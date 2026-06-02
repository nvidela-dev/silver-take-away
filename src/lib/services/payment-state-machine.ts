import { PAYMENT_ACTIONS, type PaymentActionType } from '@/lib/types/payment/actions';
import type { PaymentStatus } from '@/lib/types/enums';

/**
 * Status transitions driven by user actions on payments.
 *
 * Mirrors `bill-state-machine` in shape: pure function `assertValidTransition`
 * looks up the next status from the (current, action) pair.
 *
 * Automated lifecycle transitions (e.g. processor callbacks moving
 * `initiated -> in_transit`) are not user-driven and live elsewhere; they
 * are not represented here.
 */
export const TRANSITION_MAP: Record<
  PaymentStatus,
  Partial<Record<PaymentActionType, PaymentStatus>>
> = {
  pending: {
    initiate: 'initiated',
    cancel: 'cancelled',
  },
  scheduled: {
    initiate: 'initiated',
    cancel: 'cancelled',
  },
  initiated: {
    mark_paid: 'paid',
    mark_failed: 'failed',
  },
  in_transit: {
    mark_paid: 'paid',
    mark_failed: 'failed',
  },
  paid: {},
  failed: {
    retry: 'scheduled',
  },
  cancelled: {},
};

export class InvalidPaymentTransitionError extends Error {
  readonly code = 'INVALID_PAYMENT_TRANSITION';

  constructor(
    readonly current: PaymentStatus,
    readonly action: PaymentActionType,
  ) {
    super(
      `Cannot perform action "${action}" on a payment in status "${current}".`,
    );
    this.name = 'InvalidPaymentTransitionError';
  }
}

export function assertValidPaymentTransition(
  current: PaymentStatus,
  action: PaymentActionType,
): PaymentStatus {
  const next = TRANSITION_MAP[current][action];
  if (!next) {
    throw new InvalidPaymentTransitionError(current, action);
  }
  return next;
}

export function getAvailablePaymentActions(status: PaymentStatus): PaymentActionType[] {
  return PAYMENT_ACTIONS.filter((action) => TRANSITION_MAP[status][action] !== undefined);
}
