import { applyBulkPaymentStatusTransition } from '@/lib/repositories/payments';
import { assertValidPaymentTransition } from '@/lib/services/payment-state-machine';
import type { Payment } from '@/lib/types/payment/payment';
import type { PaymentActionType } from '@/lib/types/payment/actions';
import type { PaymentStatus } from '@/lib/types/enums';
import type { User } from '@/lib/types/user';

const ACTION_LOG_STRINGS: Record<PaymentActionType, string> = {
  initiate: 'payment_initiated',
  cancel: 'payment_cancelled',
  mark_paid: 'payment_marked_paid',
  mark_failed: 'payment_marked_failed',
  retry: 'payment_retried',
};

// Source statuses for each bulk action. We accept any of these as the
// current status; the transition map then dictates the next status. All
// source statuses for a given action must yield the same next status
// (e.g. both `pending` and `scheduled` go to `initiated` for `initiate`).
const BULK_ACTION_FROM_STATUSES: Record<PaymentActionType, readonly PaymentStatus[]> = {
  initiate: ['pending', 'scheduled'],
  cancel: ['pending', 'scheduled'],
  mark_paid: ['initiated', 'in_transit'],
  mark_failed: ['initiated', 'in_transit'],
  retry: ['failed'],
};

interface BulkTransitionPaymentsInput {
  paymentIds: string[];
  action: PaymentActionType;
  actor: User;
  note?: string;
}

export async function bulkTransitionPaymentsUseCase(
  input: BulkTransitionPaymentsInput,
): Promise<Payment[]> {
  const currentStatuses = BULK_ACTION_FROM_STATUSES[input.action];
  if (currentStatuses.length === 0) {
    throw new Error(`Bulk transition for action "${input.action}" is not supported.`);
  }

  // Resolve the next status from the first source status; the state machine
  // guarantees all source statuses for the same action share the same target
  // (the map is hand-curated, so this is a structural invariant).
  const nextStatus = assertValidPaymentTransition(currentStatuses[0], input.action);

  return applyBulkPaymentStatusTransition({
    paymentIds: input.paymentIds,
    currentStatuses,
    nextStatus,
    action: ACTION_LOG_STRINGS[input.action],
    actor: input.actor,
    note: input.note,
  });
}
