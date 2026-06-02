import {
  and,
  eq,
  inArray,
} from 'drizzle-orm';

import { db } from '@/db';
import {
  paymentActivityLog,
  payments,
} from '@/db/schema';
import { createUuid } from '@/lib/id';
import type { Payment } from '@/lib/types/payment/payment';
import type { PaymentStatus } from '@/lib/types/enums';
import type { User } from '@/lib/types/user';

import { toPaymentActivityLogInsert } from '../payment-activity-log.repo';
import {
  PaymentBulkConflictError,
  PaymentConflictError,
} from './errors';

interface StatusSideEffectFields {
  initiatedDate?: Date | null;
  arrivalDate?: string | null;
  cancelledAt?: Date | null;
  failureReason?: string | null;
}

// Translate a payment status transition into the column writes that should
// accompany the status change (e.g. stamping `cancelled_at` when moving to
// `cancelled`). Keeps the transition repository functions free of branchy
// logic and gives the use case a single place to extend per-status side
// effects.
function statusSideEffectFields(
  nextStatus: PaymentStatus,
  options: { note?: string; now: Date },
): StatusSideEffectFields {
  switch (nextStatus) {
    case 'initiated':
      return { initiatedDate: options.now };
    case 'cancelled':
      return { cancelledAt: options.now };
    case 'paid':
      return { arrivalDate: options.now.toISOString().slice(0, 10) };
    case 'failed':
      return { failureReason: options.note ?? null };
    case 'scheduled':
      // Retry path — clear any failure context from the previous attempt.
      return { failureReason: null };
    default:
      return {};
  }
}

interface ApplyPaymentStatusTransitionInput {
  paymentId: string;
  currentStatus: PaymentStatus;
  nextStatus: PaymentStatus;
  action: string;
  actor: User;
  note?: string;
}

export async function applyPaymentStatusTransition(
  input: ApplyPaymentStatusTransitionInput,
): Promise<Payment> {
  const now = new Date();
  const metadata = input.note ? { note: input.note } : null;
  const sideEffects = statusSideEffectFields(input.nextStatus, {
    note: input.note,
    now,
  });

  const [updatedPayments] = await db.batch([
    db
      .update(payments)
      .set({
        status: input.nextStatus,
        updatedAt: now,
        ...sideEffects,
      })
      .where(and(
        eq(payments.id, input.paymentId),
        eq(payments.status, input.currentStatus),
      ))
      .returning(),
    db.insert(paymentActivityLog).values(
      toPaymentActivityLogInsert({
        id: createUuid(),
        paymentId: input.paymentId,
        actorId: input.actor.id,
        action: input.action,
        metadata,
      }),
    ),
  ]);

  const [payment] = updatedPayments;
  if (!payment) {
    throw new PaymentConflictError();
  }

  return payment;
}

interface ApplyBulkPaymentStatusTransitionInput {
  paymentIds: string[];
  currentStatuses: readonly PaymentStatus[];
  nextStatus: PaymentStatus;
  action: string;
  actor: User;
  note?: string;
}

export async function applyBulkPaymentStatusTransition(
  input: ApplyBulkPaymentStatusTransitionInput,
): Promise<Payment[]> {
  if (input.paymentIds.length === 0) {
    return [];
  }

  const now = new Date();
  const metadata = input.note ? { note: input.note } : null;
  const sideEffects = statusSideEffectFields(input.nextStatus, {
    note: input.note,
    now,
  });

  const updateStatement = db
    .update(payments)
    .set({
      status: input.nextStatus,
      updatedAt: now,
      ...sideEffects,
    })
    .where(and(
      inArray(payments.id, input.paymentIds),
      inArray(payments.status, [...input.currentStatuses]),
    ))
    .returning();

  const logInserts = input.paymentIds.map((paymentId) => db.insert(paymentActivityLog).values(
    toPaymentActivityLogInsert({
      id: createUuid(),
      paymentId,
      actorId: input.actor.id,
      action: input.action,
      metadata,
    }),
  ));

  const [updatedPayments] = await db.batch([updateStatement, ...logInserts]);

  if (updatedPayments.length !== input.paymentIds.length) {
    throw new PaymentBulkConflictError(input.paymentIds.length, updatedPayments.length);
  }

  return updatedPayments;
}
