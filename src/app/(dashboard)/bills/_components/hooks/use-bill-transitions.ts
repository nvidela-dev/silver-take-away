'use client';

import type { useRouter } from 'next/navigation';
import { useCallback, useState, type TransitionStartFunction } from 'react';

import { approveBill } from '@/lib/actions/bills/approve-bill';
import { rejectBill } from '@/lib/actions/bills/reject-bill';
import { submitForApproval } from '@/lib/actions/bills/submit-for-approval';
import type { BillListItem } from '@/lib/types/bill/views';

export interface PendingBillTransition {
  kind: 'approve' | 'reject';
  bill: BillListItem;
}

interface UseBillTransitionsOptions {
  startTransition: TransitionStartFunction;
  router: ReturnType<typeof useRouter>;
  onDirectError: (message: string) => void;
}

export interface BillTransitions {
  pendingTransition: PendingBillTransition | null;
  transitionError: string | null;
  submitForApproval: (bill: BillListItem) => void;
  requestApprove: (bill: BillListItem) => void;
  requestReject: (bill: BillListItem) => void;
  cancelTransition: () => void;
  confirmTransition: (note: string) => void;
}

export function useBillTransitions({
  startTransition,
  router,
  onDirectError,
}: UseBillTransitionsOptions): BillTransitions {
  const [pendingTransition, setPendingTransition] = useState<PendingBillTransition | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const submit = useCallback((bill: BillListItem) => {
    startTransition(async () => {
      const result = await submitForApproval({ billId: bill.id });
      if (!result.ok) {
        onDirectError(result.error.message);
        return;
      }
      router.refresh();
    });
  }, [onDirectError, router, startTransition]);

  const requestApprove = useCallback((bill: BillListItem) => {
    setTransitionError(null);
    setPendingTransition({ kind: 'approve', bill });
  }, []);

  const requestReject = useCallback((bill: BillListItem) => {
    setTransitionError(null);
    setPendingTransition({ kind: 'reject', bill });
  }, []);

  const cancelTransition = useCallback(() => {
    setPendingTransition(null);
    setTransitionError(null);
  }, []);

  const confirmTransition = useCallback((note: string) => {
    if (!pendingTransition) {
      return;
    }
    const { bill, kind } = pendingTransition;
    setTransitionError(null);

    startTransition(async () => {
      const result = kind === 'approve'
        ? await approveBill({
          billId: bill.id,
          ...(note ? { note } : {}),
        })
        : await rejectBill({ billId: bill.id, note });

      if (!result.ok) {
        setTransitionError(result.error.message);
        return;
      }

      setPendingTransition(null);
      router.refresh();
    });
  }, [pendingTransition, router, startTransition]);

  return {
    pendingTransition,
    transitionError,
    submitForApproval: submit,
    requestApprove,
    requestReject,
    cancelTransition,
    confirmTransition,
  };
}
