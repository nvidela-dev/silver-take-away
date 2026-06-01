import {
  and,
  eq,
  inArray,
} from 'drizzle-orm';

import { db } from '@/db';
import {
  billActivityLog,
  billLineItems,
  bills,
} from '@/db/schema';
import { createUuid } from '@/lib/id';
import type { Bill } from '@/lib/types/bill/bill';
import type { BillStatus } from '@/lib/types/enums';
import type {
  BulkEditBillsInput,
  CreateBillInput,
  UpdateBillInput,
} from '@/lib/types/bill/inputs';
import type { User } from '@/lib/types/user';

import { toBillActivityLogInsert } from '../activity-log.repo';
import { toBillLineItemInsertRecords } from '../line-item.repo';
import {
  BillBulkConflictError,
  BillConflictError,
  BillNotFoundError,
} from './errors';

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
    throw new BillNotFoundError('Bill could not be created.');
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
      action: 'bill_updated',
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
    throw new BillNotFoundError('Bill was not found or is no longer a draft.');
  }
}

interface ApplyBillStatusTransitionInput {
  billId: string;
  currentStatus: BillStatus;
  nextStatus: BillStatus;
  action: string;
  actor: User;
  note?: string;
}

export async function applyBillStatusTransition(
  input: ApplyBillStatusTransitionInput,
): Promise<Bill> {
  const now = new Date();
  const metadata = input.note ? { note: input.note } : null;

  const [updatedBills] = await db.batch([
    db
      .update(bills)
      .set({ status: input.nextStatus, updatedAt: now })
      .where(and(eq(bills.id, input.billId), eq(bills.status, input.currentStatus)))
      .returning(),
    db.insert(billActivityLog).values(
      toBillActivityLogInsert({
        id: createUuid(),
        billId: input.billId,
        actorId: input.actor.id,
        action: input.action,
        metadata,
      }),
    ),
  ]);

  const [bill] = updatedBills;
  if (!bill) {
    throw new BillConflictError();
  }

  return bill;
}

interface ApplyBulkBillStatusTransitionInput {
  billIds: string[];
  currentStatus: BillStatus;
  nextStatus: BillStatus;
  action: string;
  actor: User;
  note?: string;
}

export async function applyBulkBillStatusTransition(
  input: ApplyBulkBillStatusTransitionInput,
): Promise<Bill[]> {
  if (input.billIds.length === 0) {
    return [];
  }

  const now = new Date();
  const metadata = input.note ? { note: input.note } : null;

  const updateStatement = db
    .update(bills)
    .set({ status: input.nextStatus, updatedAt: now })
    .where(and(
      inArray(bills.id, input.billIds),
      eq(bills.status, input.currentStatus),
    ))
    .returning();

  const logInserts = input.billIds.map((billId) => db.insert(billActivityLog).values(
    toBillActivityLogInsert({
      id: createUuid(),
      billId,
      actorId: input.actor.id,
      action: input.action,
      metadata,
    }),
  ));

  const [updatedBills] = await db.batch([updateStatement, ...logInserts]);

  if (updatedBills.length !== input.billIds.length) {
    throw new BillBulkConflictError(input.billIds.length, updatedBills.length);
  }

  return updatedBills;
}

export async function deleteDraftBills(billIds: string[]): Promise<void> {
  if (billIds.length === 0) {
    return;
  }

  const deleted = await db
    .delete(bills)
    .where(and(inArray(bills.id, billIds), eq(bills.status, 'draft')))
    .returning({ id: bills.id });

  if (deleted.length !== billIds.length) {
    throw new BillBulkConflictError(billIds.length, deleted.length);
  }
}

export async function updateDraftBills(
  input: BulkEditBillsInput,
  actor: User,
): Promise<Bill[]> {
  if (input.billIds.length === 0) {
    return [];
  }

  const now = new Date();
  const updateStatement = db
    .update(bills)
    .set({
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      amount: input.amount,
      description: input.description,
      updatedAt: now,
    })
    .where(and(
      inArray(bills.id, input.billIds),
      eq(bills.status, 'draft'),
    ))
    .returning();

  const editedFields = Object.entries({
    amount: input.amount,
    dueDate: input.dueDate,
    invoiceDate: input.invoiceDate,
    description: input.description,
    categoryId: input.categoryId,
  })
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);

  const logInserts = input.billIds.map((billId) => db.insert(billActivityLog).values(
    toBillActivityLogInsert({
      id: createUuid(),
      billId,
      actorId: actor.id,
      action: 'bill_bulk_updated',
      metadata: { editedFields },
    }),
  ));

  const [updatedBills] = await db.batch([updateStatement, ...logInserts]);

  if (updatedBills.length !== input.billIds.length) {
    throw new BillBulkConflictError(input.billIds.length, updatedBills.length);
  }

  return updatedBills;
}
