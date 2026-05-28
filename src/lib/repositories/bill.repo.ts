import {
  and,
  desc,
  eq,
} from 'drizzle-orm';

import { db } from '@/db';
import {
  billActivityLog,
  billLineItems,
  bills,
  categories,
  users,
  vendors,
} from '@/db/schema';
import type {
  Bill,
  BillFormOptions,
  CreateBillInput,
  DraftBillListItem,
  UpdateBillInput,
  User,
} from '@/types';

import { createUuid } from '@/lib/id';

import { toBillActivityLogInsert } from './activity-log.repo';
import { toBillLineItemInsertRecords } from './line-item.repo';

export class BillNotFoundError extends Error {
  readonly code = 'BILL_NOT_FOUND';

  constructor(message = 'Bill was not found.') {
    super(message);
    this.name = 'BillNotFoundError';
  }
}

export class BillConflictError extends Error {
  readonly code = 'BILL_CONFLICT';

  constructor(message = 'Bill changed before this operation completed.') {
    super(message);
    this.name = 'BillConflictError';
  }
}

export async function getBillById(id: string): Promise<Bill | null> {
  const [bill] = await db.select().from(bills).where(eq(bills.id, id)).limit(1);
  return bill ?? null;
}

export async function listDraftBills(): Promise<DraftBillListItem[]> {
  const rows = await db
    .select({
      bill: bills,
      vendor: {
        id: vendors.id,
        name: vendors.name,
        email: vendors.email,
        ownerId: vendors.ownerId,
      },
      creator: {
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
      },
      lineItem: billLineItems,
      category: categories,
    })
    .from(bills)
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .innerJoin(users, eq(bills.createdBy, users.id))
    .leftJoin(billLineItems, eq(billLineItems.billId, bills.id))
    .leftJoin(categories, eq(categories.id, billLineItems.categoryId))
    .where(eq(bills.status, 'draft'))
    .orderBy(desc(bills.createdAt), desc(bills.updatedAt));

  const draftBills = rows.reduce((acc, row) => {
    if (!acc.has(row.bill.id)) {
      acc.set(row.bill.id, {
        ...row.bill,
        vendor: row.vendor,
        creator: row.creator,
        lineItems: [],
        lineItemCount: 0,
      });
    }

    if (row.lineItem) {
      acc.get(row.bill.id)?.lineItems.push({
        ...row.lineItem,
        category: row.category,
      });
    }

    return acc;
  }, new Map<string, DraftBillListItem>());

  return Array.from(draftBills.values()).map((bill) => ({
    ...bill,
    lineItems: bill.lineItems.sort((a, b) => a.sortOrder - b.sortOrder),
    lineItemCount: bill.lineItems.length,
  }));
}

export async function getBillFormOptions(): Promise<BillFormOptions> {
  const [vendorRows, categoryRows] = await Promise.all([
    db
      .select({
        id: vendors.id,
        name: vendors.name,
        email: vendors.email,
        ownerId: vendors.ownerId,
      })
      .from(vendors)
      .orderBy(vendors.name),
    db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .orderBy(categories.name),
  ]);

  return {
    vendors: vendorRows,
    categories: categoryRows,
  };
}

export async function createDraftBill(
  input: CreateBillInput,
  actor: User,
): Promise<Bill> {
  const billId = createUuid();
  const now = new Date();
  const lineItemRecords = toBillLineItemInsertRecords(
    billId,
    input.lineItems,
    input.lineItems.map(() => createUuid()),
  );

  const [insertedBills] = await db.batch([
    db
      .insert(bills)
      .values({
        id: billId,
        vendorId: input.vendorId,
        createdBy: actor.id,
        status: 'draft',
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        amount: input.amount,
        currency: input.currency ?? 'USD',
        description: input.description,
        invoiceUrl: input.invoiceUrl,
        createdAt: now,
        updatedAt: now,
      })
      .returning(),
    db.insert(billLineItems).values(lineItemRecords),
    db.insert(billActivityLog).values(
      toBillActivityLogInsert({
        id: createUuid(),
        billId,
        actorId: actor.id,
        action: 'draft_created',
        metadata: { lineItemCount: input.lineItems.length },
      }),
    ),
  ]);

  const [bill] = insertedBills;
  if (!bill) {
    throw new BillNotFoundError('Draft bill could not be created.');
  }

  return bill;
}

export async function updateDraftBill(
  input: UpdateBillInput,
  actor: User,
): Promise<Bill> {
  const whereClauses = [eq(bills.id, input.id), eq(bills.status, 'draft')];
  if (input.expectedUpdatedAt) {
    whereClauses.push(eq(bills.updatedAt, new Date(input.expectedUpdatedAt)));
  }

  const now = new Date();
  const updateStatement = db
    .update(bills)
    .set({
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      invoiceUrl: input.invoiceUrl,
      updatedAt: now,
    })
    .where(and(...whereClauses))
    .returning();

  const logStatement = db.insert(billActivityLog).values(
    toBillActivityLogInsert({
      id: createUuid(),
      billId: input.id,
      actorId: actor.id,
      action: 'draft_updated',
      metadata: { replacedLineItems: Boolean(input.lineItems) },
    }),
  );

  const [bill] = await updateStatement;
  if (!bill) {
    throw input.expectedUpdatedAt ? new BillConflictError() : new BillNotFoundError();
  }

  if (input.lineItems) {
    const lineItemRecords = toBillLineItemInsertRecords(
      input.id,
      input.lineItems,
      input.lineItems.map((lineItem) => lineItem.id ?? createUuid()),
    );

    await db.batch([
      db.delete(billLineItems).where(eq(billLineItems.billId, input.id)),
      db.insert(billLineItems).values(lineItemRecords),
      logStatement,
    ]);

    return bill;
  }

  await logStatement;
  return bill;
}

export async function deleteDraftBill(id: string): Promise<void> {
  const deleted = await db
    .delete(bills)
    .where(and(eq(bills.id, id), eq(bills.status, 'draft')))
    .returning({ id: bills.id });

  if (deleted.length === 0) {
    throw new BillNotFoundError('Draft bill was not found or is no longer a draft.');
  }
}
