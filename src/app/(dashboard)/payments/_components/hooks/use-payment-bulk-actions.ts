'use client';

import type { useRouter } from 'next/navigation';
import { useCallback, useState, type TransitionStartFunction } from 'react';

import { bulkCancelPayments } from '@/lib/actions/payments/bulk-cancel-payments';
import { bulkInitiatePayments } from '@/lib/actions/payments/bulk-initiate-payments';
import { bulkMarkPaymentsFailed } from '@/lib/actions/payments/bulk-mark-failed-payments';
import { bulkMarkPaymentsPaid } from '@/lib/actions/payments/bulk-mark-paid-payments';
import { bulkRetryPayments } from '@/lib/actions/payments/bulk-retry-payments';

export type BulkPaymentPendingKind = 'cancel' | 'mark_paid' | 'mark_failed';

export interface BulkPaymentPendingState {
  kind: BulkPaymentPendingKind;
  paymentIds: string[];
  onSuccess: () => void;
}

interface UsePaymentBulkActionsOptions {
  startTransition: TransitionStartFunction;
  router: ReturnType<typeof useRouter>;
  onDirectError: (message: string) => void;
}

interface RequestArgs {
  paymentIds: string[];
  onSuccess: () => void;
}

export interface PaymentBulkActions {
  pending: BulkPaymentPendingState | null;
  bulkError: string | null;
  // Direct (no dialog) actions
  initiate: (args: RequestArgs) => void;
  retry: (args: RequestArgs) => void;
  // Dialog-confirmed actions
  requestCancel: (args: RequestArgs) => void;
  requestMarkPaid: (args: RequestArgs) => void;
  requestMarkFailed: (args: RequestArgs) => void;
  cancel: () => void;
  confirmCancel: (note: string) => void;
  confirmMarkPaid: (note: string) => void;
  confirmMarkFailed: (note: string) => void;
}

export function usePaymentBulkActions({
  startTransition,
  router,
  onDirectError,
}: UsePaymentBulkActionsOptions): PaymentBulkActions {
  const [pending, setPending] = useState<BulkPaymentPendingState | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const open = useCallback((kind: BulkPaymentPendingKind, args: RequestArgs) => {
    setBulkError(null);
    setPending({ kind, paymentIds: args.paymentIds, onSuccess: args.onSuccess });
  }, []);

  const cancelDialog = useCallback(() => {
    setPending(null);
    setBulkError(null);
  }, []);

  const finishSuccess = useCallback(() => {
    pending?.onSuccess();
    setPending(null);
    setBulkError(null);
    router.refresh();
  }, [pending, router]);

  const initiate = useCallback(({ paymentIds, onSuccess }: RequestArgs) => {
    if (paymentIds.length === 0) return;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkInitiatePayments({ paymentIds });
      if (!result.ok) {
        onDirectError(result.error.message);
        return;
      }
      onSuccess();
      router.refresh();
    });
  }, [onDirectError, router, startTransition]);

  const retry = useCallback(({ paymentIds, onSuccess }: RequestArgs) => {
    if (paymentIds.length === 0) return;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkRetryPayments({ paymentIds });
      if (!result.ok) {
        onDirectError(result.error.message);
        return;
      }
      onSuccess();
      router.refresh();
    });
  }, [onDirectError, router, startTransition]);

  const requestCancel = useCallback((args: RequestArgs) => open('cancel', args), [open]);
  const requestMarkPaid = useCallback((args: RequestArgs) => open('mark_paid', args), [open]);
  const requestMarkFailed = useCallback((args: RequestArgs) => open('mark_failed', args), [open]);

  const confirmCancel = useCallback((note: string) => {
    if (!pending || pending.kind !== 'cancel') return;
    const { paymentIds } = pending;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkCancelPayments({
        paymentIds,
        ...(note ? { note } : {}),
      });
      if (!result.ok) {
        setBulkError(result.error.message);
        return;
      }
      finishSuccess();
    });
  }, [finishSuccess, pending, startTransition]);

  const confirmMarkPaid = useCallback((note: string) => {
    if (!pending || pending.kind !== 'mark_paid') return;
    const { paymentIds } = pending;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkMarkPaymentsPaid({
        paymentIds,
        ...(note ? { note } : {}),
      });
      if (!result.ok) {
        setBulkError(result.error.message);
        return;
      }
      finishSuccess();
    });
  }, [finishSuccess, pending, startTransition]);

  const confirmMarkFailed = useCallback((note: string) => {
    if (!pending || pending.kind !== 'mark_failed') return;
    const { paymentIds } = pending;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkMarkPaymentsFailed({ paymentIds, note });
      if (!result.ok) {
        setBulkError(result.error.message);
        return;
      }
      finishSuccess();
    });
  }, [finishSuccess, pending, startTransition]);

  return {
    pending,
    bulkError,
    initiate,
    retry,
    requestCancel,
    requestMarkPaid,
    requestMarkFailed,
    cancel: cancelDialog,
    confirmCancel,
    confirmMarkPaid,
    confirmMarkFailed,
  };
}
