'use client';

import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

import {
  PageHeader,
  SurfaceTabs,
} from '@/app/_components/shared';
import { Button } from '@/app/_components/ui/button';
import { approveBill } from '@/lib/actions/bills/approve-bill';
import { createBill } from '@/lib/actions/bills/create-bill';
import { deleteBill } from '@/lib/actions/bills/delete-bill';
import { rejectBill } from '@/lib/actions/bills/reject-bill';
import { submitForApproval } from '@/lib/actions/bills/submit-for-approval';
import { updateBill } from '@/lib/actions/bills/update-bill';
import { billTabs } from '@/app/_navigation';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type { BillFormOptions, BillListItem } from '@/lib/types/bill/views';

import { BillNoteDialog } from './bill-note-dialog';
import { BillsStatusOverview } from './bills-status-overview';
import { BillsTable } from './bills-table';
import {
  approvalActionsColumn,
  billReadColumns,
  draftActionsColumn,
} from './bills-table-columns';
import { DraftBillForm } from './draft-bill-form';

interface PendingTransition {
  kind: 'approve' | 'reject';
  bill: BillListItem;
}

interface BillsWorkspaceProps {
  activeTab: string;
  approvalBills: BillListItem[];
  draftBills: BillListItem[];
  loadError: string | null;
  options: BillFormOptions;
  paymentBills: BillListItem[];
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function BillsWorkspace({
  activeTab,
  approvalBills,
  draftBills,
  loadError,
  options,
  paymentBills,
}: BillsWorkspaceProps) {
  const router = useRouter();
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Re-derive editingBill from the refreshed draft list so optimistic-concurrency
  // tokens (updatedAt) stay current after router.refresh().
  const editingBill = useMemo(
    () => (editingBillId ? draftBills.find((bill) => bill.id === editingBillId) ?? null : null),
    [draftBills, editingBillId],
  );

  const closeForm = useCallback(() => {
    setEditingBillId(null);
    setIsFormOpen(false);
    setFormError(null);
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingBillId(null);
    setFormError(null);
    setIsFormOpen(true);
  }, []);

  const selectBillForEdit = useCallback((bill: BillListItem) => {
    setEditingBillId(bill.id);
    setFormError(null);
    setIsFormOpen(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteCandidateId(null);
  }, []);

  const requestDelete = useCallback((id: string) => {
    setDeleteCandidateId(id);
  }, []);

  const onSubmit = useCallback((input: CreateBillInput) => {
    setFormError(null);

    startTransition(async () => {
      const result = editingBill
        ? await updateBill({
          ...input,
          id: editingBill.id,
          expectedUpdatedAt: editingBill.updatedAt.toISOString(),
        })
        : await createBill(input);

      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }

      closeForm();
      router.refresh();
    });
  }, [closeForm, editingBill, router, startTransition]);

  const onDelete = useCallback((id: string) => {
    startTransition(async () => {
      const result = await deleteBill(id);
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }

      if (editingBillId === id) {
        closeForm();
      }

      setDeleteCandidateId(null);
      router.refresh();
    });
  }, [closeForm, editingBillId, router, startTransition]);

  const onSubmitForApproval = useCallback((bill: BillListItem) => {
    setFormError(null);
    startTransition(async () => {
      const result = await submitForApproval({
        billId: bill.id,
        expectedUpdatedAt: bill.updatedAt.toISOString(),
      });
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }
      router.refresh();
    });
  }, [router, startTransition]);

  const onRequestApprove = useCallback((bill: BillListItem) => {
    setTransitionError(null);
    setPendingTransition({ kind: 'approve', bill });
  }, []);

  const onRequestReject = useCallback((bill: BillListItem) => {
    setTransitionError(null);
    setPendingTransition({ kind: 'reject', bill });
  }, []);

  const cancelPendingTransition = useCallback(() => {
    setPendingTransition(null);
    setTransitionError(null);
  }, []);

  const confirmPendingTransition = useCallback((note: string) => {
    if (!pendingTransition) {
      return;
    }
    const { bill, kind } = pendingTransition;
    setTransitionError(null);

    startTransition(async () => {
      const result = kind === 'approve'
        ? await approveBill({
          billId: bill.id,
          expectedUpdatedAt: bill.updatedAt.toISOString(),
          ...(note ? { note } : {}),
        })
        : await rejectBill({
          billId: bill.id,
          expectedUpdatedAt: bill.updatedAt.toISOString(),
          note,
        });

      if (!result.ok) {
        setTransitionError(result.error.message);
        return;
      }

      setPendingTransition(null);
      router.refresh();
    });
  }, [pendingTransition, router, startTransition]);

  useEffect(() => {
    if (!isFormOpen) {
      return undefined;
    }

    const { activeElement } = document;
    const previouslyFocused = activeElement instanceof HTMLElement ? activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialogNode = dialogRef.current;
    const focusFirst = () => {
      if (!dialogNode) {
        return;
      }
      const focusables = dialogNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const target = focusables[0] ?? dialogNode;
      target.focus();
    };
    focusFirst();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeForm();
        return;
      }
      if (event.key !== 'Tab' || !dialogNode) {
        return;
      }
      const focusables = Array.from(
        dialogNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusables.length === 0) {
        event.preventDefault();
        dialogNode.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus?.();
    };
  }, [closeForm, isFormOpen]);

  return (
    <main className="grid gap-6">
      <PageHeader
        actions={(
          <Button onClick={openCreateForm} type="button" variant="accent">
            <Plus aria-hidden className="size-4" />
            New bill
          </Button>
        )}
        eyebrow="Bill Pay"
        title="Bills"
      />
      <SurfaceTabs activeValue={activeTab} tabs={billTabs} />

      {isFormOpen ? (
        <div
          className={[
            'fixed inset-0 z-50 grid place-items-center bg-slate-950/50',
            'p-3 sm:p-6',
          ].join(' ')}
          role="dialog"
          aria-modal
          aria-labelledby={dialogTitleId}
          ref={dialogRef}
          tabIndex={-1}
        >
          <div className="w-full max-w-5xl rounded-md border border-slate-200 bg-white shadow-2xl">
            <div className="flex justify-end px-4 pt-4">
              <Button
                aria-label="Close bill form"
                onClick={closeForm}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden className="size-4" />
              </Button>
            </div>
            <div className="max-h-[85dvh] overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              <h2 className="sr-only" id={dialogTitleId}>
                {editingBill ? 'Edit bill' : 'New bill'}
              </h2>
              <DraftBillForm
                editingBill={editingBill}
                formError={formError}
                isPending={isPending}
                loadError={loadError}
                onCancelEdit={closeForm}
                onSubmit={onSubmit}
                options={options}
              />
            </div>
          </div>
        </div>
      ) : null}

      {!isFormOpen && formError ? (
        <div
          className={[
            'rounded-md border border-rose-200 bg-rose-50 p-4',
            'text-sm text-rose-950',
          ].join(' ')}
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      {activeTab === 'overview' ? (
        <BillsStatusOverview
          approvalBills={approvalBills}
          draftBills={draftBills}
          paymentBills={paymentBills}
        />
      ) : null}
      {activeTab === 'drafts' ? (
        <BillsTable
          bills={draftBills}
          columns={[
            ...billReadColumns,
            draftActionsColumn({
              deleteCandidateId,
              onCancelDelete: cancelDelete,
              onDelete,
              onEdit: selectBillForEdit,
              onRequestDelete: requestDelete,
              onSubmit: onSubmitForApproval,
            }),
          ]}
          emptyMessage="No draft bills yet."
          isLoading={isPending}
          loadingMessage="Loading draft bills…"
        />
      ) : null}
      {activeTab === 'approvals' ? (
        <BillsTable
          bills={approvalBills}
          columns={[
            ...billReadColumns,
            approvalActionsColumn({
              onApprove: onRequestApprove,
              onReject: onRequestReject,
            }),
          ]}
          emptyMessage="No bills awaiting approval."
        />
      ) : null}
      {activeTab === 'payment' ? (
        <BillsTable
          bills={paymentBills}
          columns={billReadColumns}
          emptyMessage="No bills ready for payment."
        />
      ) : null}

      {pendingTransition ? (
        <BillNoteDialog
          confirmLabel={pendingTransition.kind === 'reject' ? 'Reject bill' : 'Approve bill'}
          confirmVariant={pendingTransition.kind === 'reject' ? 'destructive' : 'accent'}
          description={`Vendor: ${pendingTransition.bill.vendor.name}`}
          error={transitionError}
          isPending={isPending}
          noteRequired={pendingTransition.kind === 'reject'}
          notePlaceholder={
            pendingTransition.kind === 'reject'
              ? 'Why is this bill being rejected?'
              : 'Optional context for the approval log.'
          }
          onCancel={cancelPendingTransition}
          onConfirm={confirmPendingTransition}
          title={pendingTransition.kind === 'reject' ? 'Reject bill' : 'Approve bill'}
        />
      ) : null}
    </main>
  );
}
