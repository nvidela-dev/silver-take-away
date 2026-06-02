'use client';

import type { useRouter } from 'next/navigation';
import { useCallback, useState, type TransitionStartFunction } from 'react';

import { cancelPayment } from '@/lib/actions/payments/cancel-payment';
import { initiatePayment } from '@/lib/actions/payments/initiate-payment';
import { markPaymentFailed } from '@/lib/actions/payments/mark-failed-payment';
import { markPaymentPaid } from '@/lib/actions/payments/mark-paid-payment';
import { retryPayment } from '@/lib/actions/payments/retry-payment';
import { notify } from '@/app/_components/feedback/notify';
import type { PaymentListItem } from '@/lib/types/payment/views';

export type PendingPaymentTransitionKind = 'cancel' | 'mark_paid' | 'mark_failed';

const PAYMENT_TRANSITION_SUCCESS: Record<PendingPaymentTransitionKind, string> = {
  cancel: 'Payment cancelled',
  mark_paid: 'Payment marked as paid',
  mark_failed: 'Payment marked as failed',
};

export interface PendingPaymentTransition {
  kind: PendingPaymentTransitionKind;
  payment: PaymentListItem;
}

interface UsePaymentTransitionsOptions {
  startTransition: TransitionStartFunction;
  router: ReturnType<typeof useRouter>;
  onDirectError: (message: string) => void;
}

export interface PaymentTransitions {
  pendingTransition: PendingPaymentTransition | null;
  transitionError: string | null;
  initiate: (payment: PaymentListItem) => void;
  retry: (payment: PaymentListItem) => void;
  requestCancel: (payment: PaymentListItem) => void;
  requestMarkPaid: (payment: PaymentListItem) => void;
  requestMarkFailed: (payment: PaymentListItem) => void;
  cancelTransition: () => void;
  confirmTransition: (note: string) => void;
}

export function usePaymentTransitions({
  startTransition,
  router,
  onDirectError,
}: UsePaymentTransitionsOptions): PaymentTransitions {
  const [pendingTransition, setPendingTransition] = useState<PendingPaymentTransition | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const initiate = useCallback((payment: PaymentListItem) => {
    startTransition(async () => {
      const result = await initiatePayment({ paymentId: payment.id });
      if (!result.ok) {
        onDirectError(result.error.message);
        return;
      }
      notify.success('Payment initiated');
      router.refresh();
    });
  }, [onDirectError, router, startTransition]);

  const retry = useCallback((payment: PaymentListItem) => {
    startTransition(async () => {
      const result = await retryPayment({ paymentId: payment.id });
      if (!result.ok) {
        onDirectError(result.error.message);
        return;
      }
      notify.success('Payment retry started');
      router.refresh();
    });
  }, [onDirectError, router, startTransition]);

  const requestCancel = useCallback((payment: PaymentListItem) => {
    setTransitionError(null);
    setPendingTransition({ kind: 'cancel', payment });
  }, []);

  const requestMarkPaid = useCallback((payment: PaymentListItem) => {
    setTransitionError(null);
    setPendingTransition({ kind: 'mark_paid', payment });
  }, []);

  const requestMarkFailed = useCallback((payment: PaymentListItem) => {
    setTransitionError(null);
    setPendingTransition({ kind: 'mark_failed', payment });
  }, []);

  const cancelTransition = useCallback(() => {
    setPendingTransition(null);
    setTransitionError(null);
  }, []);

  const confirmTransition = useCallback((note: string) => {
    if (!pendingTransition) return;
    const { payment, kind } = pendingTransition;
    setTransitionError(null);

    startTransition(async () => {
      let result;
      if (kind === 'cancel') {
        result = await cancelPayment({
          paymentId: payment.id,
          ...(note ? { note } : {}),
        });
      } else if (kind === 'mark_paid') {
        result = await markPaymentPaid({
          paymentId: payment.id,
          ...(note ? { note } : {}),
        });
      } else {
        result = await markPaymentFailed({ paymentId: payment.id, note });
      }

      if (!result.ok) {
        setTransitionError(result.error.message);
        return;
      }

      notify.success(PAYMENT_TRANSITION_SUCCESS[kind]);
      setPendingTransition(null);
      router.refresh();
    });
  }, [pendingTransition, router, startTransition]);

  return {
    pendingTransition,
    transitionError,
    initiate,
    retry,
    requestCancel,
    requestMarkPaid,
    requestMarkFailed,
    cancelTransition,
    confirmTransition,
  };
}
