import {
  PaymentNotFoundError,
  applyPaymentStatusTransition,
  getPaymentById,
} from '@/lib/repositories/payments';
import { assertValidPaymentTransition } from '@/lib/services/payment-state-machine';
import type { Payment } from '@/lib/types/payment/payment';
import type { PaymentActionType } from '@/lib/types/payment/actions';
import type { User } from '@/lib/types/user';

const ACTION_LOG_STRINGS: Record<PaymentActionType, string> = {
  initiate: 'payment_initiated',
  cancel: 'payment_cancelled',
  mark_paid: 'payment_marked_paid',
  mark_failed: 'payment_marked_failed',
  retry: 'payment_retried',
};

interface TransitionPaymentInput {
  paymentId: string;
  action: PaymentActionType;
  actor: User;
  note?: string;
}

export async function transitionPaymentUseCase(
  input: TransitionPaymentInput,
): Promise<Payment> {
  const payment = await getPaymentById(input.paymentId);
  if (!payment) {
    throw new PaymentNotFoundError();
  }

  const nextStatus = assertValidPaymentTransition(payment.status, input.action);

  return applyPaymentStatusTransition({
    paymentId: input.paymentId,
    currentStatus: payment.status,
    nextStatus,
    action: ACTION_LOG_STRINGS[input.action],
    actor: input.actor,
    note: input.note,
  });
}
