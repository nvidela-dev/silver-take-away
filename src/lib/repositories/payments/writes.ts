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

  // Guarded update: the `status` predicate scopes the write to a payment that
  // is still in its expected status, so a concurrent change matches no rows
  // and surfaces as a conflict instead of clobbering newer state.
  const [payment] = await db
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
    .returning();

  // Bail before touching the audit log: neon-http has no interactive
  // transaction, so the only way to avoid logging an action that never
  // happened is to confirm the transition landed before writing the entry.
  if (!payment) {
    throw new PaymentConflictError();
  }

  await db.insert(paymentActivityLog).values(
    toPaymentActivityLogInsert({
      id: createUuid(),
      paymentId: input.paymentId,
      actorId: input.actor.id,
      action: input.action,
      metadata,
    }),
  );

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

  const updatedPayments = await db
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

  // Log exactly the payments that transitioned, keyed off the update result
  // rather than the requested ids, so conflicted rows never receive a
  // spurious audit entry. A partial match still logs what genuinely changed
  // before the conflict is raised below.
  if (updatedPayments.length > 0) {
    await db.insert(paymentActivityLog).values(
      updatedPayments.map((payment) => toPaymentActivityLogInsert({
        id: createUuid(),
        paymentId: payment.id,
        actorId: input.actor.id,
        action: input.action,
        metadata,
      })),
    );
  }

  if (updatedPayments.length !== input.paymentIds.length) {
    throw new PaymentBulkConflictError(input.paymentIds.length, updatedPayments.length);
  }

  return updatedPayments;
}
