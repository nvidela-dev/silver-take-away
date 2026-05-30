import {
  and,
  eq,
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
import type { CreateBillInput, UpdateBillInput } from '@/lib/types/bill/inputs';
import type { User } from '@/lib/types/user';

import { toBillActivityLogInsert } from '../activity-log.repo';
import { toBillLineItemInsertRecords } from '../line-item.repo';
import {
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
