'use client';

import type { useRouter } from 'next/navigation';
import { useCallback, useState, type TransitionStartFunction } from 'react';

import { approveBill } from '@/lib/actions/bills/approve-bill';
import { archiveBill } from '@/lib/actions/bills/archive-bill';
import { rejectBill } from '@/lib/actions/bills/reject-bill';
import { submitForApproval } from '@/lib/actions/bills/submit-for-approval';
import { notify } from '@/app/_components/feedback/notify';
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
  // Archive uses a plain confirm (no note), so it gets its own candidate
  // state rather than sharing the note-dialog transition flow.
  archiveCandidate: BillListItem | null;
  archiveError: string | null;
  requestArchive: (bill: BillListItem) => void;
  cancelArchive: () => void;
  confirmArchive: () => void;
}

export function useBillTransitions({
  startTransition,
  router,
  onDirectError,
}: UseBillTransitionsOptions): BillTransitions {
  const [pendingTransition, setPendingTransition] = useState<PendingBillTransition | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [archiveCandidate, setArchiveCandidate] = useState<BillListItem | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const submit = useCallback((bill: BillListItem) => {
    startTransition(async () => {
      const result = await submitForApproval({ billId: bill.id });
      if (!result.ok) {
        onDirectError(result.error.message);
        return;
      }
      notify.success('Bill submitted for approval');
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

      notify.success(kind === 'approve' ? 'Bill approved' : 'Bill rejected');
      setPendingTransition(null);
      router.refresh();
    });
  }, [pendingTransition, router, startTransition]);

  const requestArchive = useCallback((bill: BillListItem) => {
    setArchiveError(null);
    setArchiveCandidate(bill);
  }, []);

  const cancelArchive = useCallback(() => {
    setArchiveCandidate(null);
    setArchiveError(null);
  }, []);

  const confirmArchive = useCallback(() => {
    if (!archiveCandidate) {
      return;
    }
    const { id } = archiveCandidate;
    setArchiveError(null);

    startTransition(async () => {
      const result = await archiveBill({ billId: id });
      if (!result.ok) {
        setArchiveError(result.error.message);
        return;
      }

      notify.success('Bill archived');
      setArchiveCandidate(null);
      router.refresh();
    });
  }, [archiveCandidate, router, startTransition]);

  return {
    pendingTransition,
    transitionError,
    submitForApproval: submit,
    requestApprove,
    requestReject,
    cancelTransition,
    confirmTransition,
    archiveCandidate,
    archiveError,
    requestArchive,
    cancelArchive,
    confirmArchive,
  };
}
