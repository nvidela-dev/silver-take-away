'use client';

import type { useRouter } from 'next/navigation';
import { useCallback, useState, type TransitionStartFunction } from 'react';

import { bulkApproveBills } from '@/lib/actions/bills/bulk-approve-bills';
import { bulkDeleteBills } from '@/lib/actions/bills/bulk-delete-bills';
import { bulkRejectBills } from '@/lib/actions/bills/bulk-reject-bills';
import { bulkSubmitForApproval } from '@/lib/actions/bills/bulk-submit-for-approval';
import { bulkUpdateBills } from '@/lib/actions/bills/bulk-update-bills';
import { notify } from '@/app/_components/feedback/notify';
import { pluralize } from '@/lib/utils';
import type { BulkEditBillsInput } from '@/lib/types/bill/inputs';

export type BulkPendingKind = 'approve' | 'reject' | 'delete' | 'edit';

export interface BulkPendingState {
  kind: BulkPendingKind;
  billIds: string[];
  onSuccess: () => void;
}

interface UseBillBulkActionsOptions {
  startTransition: TransitionStartFunction;
  router: ReturnType<typeof useRouter>;
  onDirectError: (message: string) => void;
}

interface RequestArgs {
  billIds: string[];
  onSuccess: () => void;
}

export interface BillBulkActions {
  pending: BulkPendingState | null;
  bulkError: string | null;
  submit: (args: RequestArgs) => void;
  requestApprove: (args: RequestArgs) => void;
  requestReject: (args: RequestArgs) => void;
  requestDelete: (args: RequestArgs) => void;
  requestEdit: (args: RequestArgs) => void;
  cancel: () => void;
  confirmApprove: (note: string) => void;
  confirmReject: (note: string) => void;
  confirmDelete: () => void;
  confirmEdit: (input: BulkEditBillsInput) => void;
}

export function useBillBulkActions({
  startTransition,
  router,
  onDirectError,
}: UseBillBulkActionsOptions): BillBulkActions {
  const [pending, setPending] = useState<BulkPendingState | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const open = useCallback((kind: BulkPendingKind, args: RequestArgs) => {
    setBulkError(null);
    setPending({ kind, billIds: args.billIds, onSuccess: args.onSuccess });
  }, []);

  const cancel = useCallback(() => {
    setPending(null);
    setBulkError(null);
  }, []);

  const finishSuccess = useCallback(() => {
    pending?.onSuccess();
    setPending(null);
    setBulkError(null);
    router.refresh();
  }, [pending, router]);

  const submit = useCallback(({ billIds, onSuccess }: RequestArgs) => {
    if (billIds.length === 0) return;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkSubmitForApproval({ billIds });
      if (!result.ok) {
        onDirectError(result.error.message);
        return;
      }
      notify.success(`${pluralize(billIds.length, 'bill')} submitted for approval`);
      onSuccess();
      router.refresh();
    });
  }, [onDirectError, router, startTransition]);

  const requestApprove = useCallback((args: RequestArgs) => open('approve', args), [open]);
  const requestReject = useCallback((args: RequestArgs) => open('reject', args), [open]);
  const requestDelete = useCallback((args: RequestArgs) => open('delete', args), [open]);
  const requestEdit = useCallback((args: RequestArgs) => open('edit', args), [open]);

  const confirmApprove = useCallback((note: string) => {
    if (!pending || pending.kind !== 'approve') return;
    const { billIds } = pending;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkApproveBills({
        billIds,
        ...(note ? { note } : {}),
      });
      if (!result.ok) {
        setBulkError(result.error.message);
        return;
      }
      notify.success(`${pluralize(billIds.length, 'bill')} approved`);
      finishSuccess();
    });
  }, [finishSuccess, pending, startTransition]);

  const confirmReject = useCallback((note: string) => {
    if (!pending || pending.kind !== 'reject') return;
    const { billIds } = pending;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkRejectBills({ billIds, note });
      if (!result.ok) {
        setBulkError(result.error.message);
        return;
      }
      notify.success(`${pluralize(billIds.length, 'bill')} rejected`);
      finishSuccess();
    });
  }, [finishSuccess, pending, startTransition]);

  const confirmDelete = useCallback(() => {
    if (!pending || pending.kind !== 'delete') return;
    const { billIds } = pending;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkDeleteBills({ billIds });
      if (!result.ok) {
        setBulkError(result.error.message);
        return;
      }
      notify.success(`${pluralize(billIds.length, 'bill')} deleted`);
      finishSuccess();
    });
  }, [finishSuccess, pending, startTransition]);

  const confirmEdit = useCallback((input: BulkEditBillsInput) => {
    if (!pending || pending.kind !== 'edit') return;
    setBulkError(null);
    startTransition(async () => {
      const result = await bulkUpdateBills(input);
      if (!result.ok) {
        setBulkError(result.error.message);
        return;
      }
      notify.success(`${pluralize(input.billIds.length, 'bill')} updated`);
      finishSuccess();
    });
  }, [finishSuccess, pending, startTransition]);

  return {
    pending,
    bulkError,
    submit,
    requestApprove,
    requestReject,
    requestDelete,
    requestEdit,
    cancel,
    confirmApprove,
    confirmReject,
    confirmDelete,
    confirmEdit,
  };
}
