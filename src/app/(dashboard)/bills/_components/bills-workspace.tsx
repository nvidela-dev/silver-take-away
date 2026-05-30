'use client';

import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
} from 'lucide-react';
import {
  useCallback,
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
import { createBill } from '@/lib/actions/bills/create-bill';
import { deleteBill } from '@/lib/actions/bills/delete-bill';
import { updateBill } from '@/lib/actions/bills/update-bill';
import { billTabs } from '@/app/_navigation';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type { BillFormOptions, BillListItem } from '@/lib/types/bill/views';

import { BillTransitionDialog } from './bill-transition-dialog';
import { BillsStatusOverview } from './bills-status-overview';
import { BillsTable } from './bills-table';
import {
  approvalActionsColumn,
  billReadColumns,
  draftActionsColumn,
} from './bills-table-columns';
import { ColumnPicker } from './column-picker';
import { DraftBillForm } from './draft-bill-form';
import { useBillTransitions } from './hooks/use-bill-transitions';
import { useColumnVisibility } from './hooks/use-column-visibility';
import { useDialogBehavior } from './hooks/use-dialog-behavior';

interface BillsWorkspaceProps {
  activeTab: string;
  approvalBills: BillListItem[];
  draftBills: BillListItem[];
  loadError: string | null;
  options: BillFormOptions;
  paymentBills: BillListItem[];
}

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
  const [isPending, startTransition] = useTransition();

  const transitions = useBillTransitions({
    startTransition,
    router,
    onDirectError: setFormError,
  });

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

  useDialogBehavior({
    containerRef: dialogRef,
    onClose: closeForm,
    enabled: isFormOpen,
  });

  const draftColumns = [
    ...billReadColumns,
    draftActionsColumn({
      deleteCandidateId,
      onCancelDelete: cancelDelete,
      onDelete,
      onEdit: selectBillForEdit,
      onRequestDelete: requestDelete,
      onSubmit: transitions.submitForApproval,
    }),
  ];
  const approvalColumns = [
    ...billReadColumns,
    approvalActionsColumn({
      onApprove: transitions.requestApprove,
      onReject: transitions.requestReject,
    }),
  ];
  const paymentColumns = billReadColumns;

  const draftVisibility = useColumnVisibility(draftColumns);
  const approvalVisibility = useColumnVisibility(approvalColumns);
  const paymentVisibility = useColumnVisibility(paymentColumns);

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
        <div className="grid gap-3">
          <div className="flex justify-end">
            <ColumnPicker
              columns={draftVisibility.configurableColumns}
              hiddenIds={draftVisibility.hiddenIds}
              onToggle={draftVisibility.toggle}
            />
          </div>
          <BillsTable
            bills={draftBills}
            columns={draftVisibility.visibleColumns}
            emptyMessage="No draft bills yet."
            isLoading={isPending}
            loadingMessage="Loading draft bills…"
          />
        </div>
      ) : null}
      {activeTab === 'approvals' ? (
        <div className="grid gap-3">
          <div className="flex justify-end">
            <ColumnPicker
              columns={approvalVisibility.configurableColumns}
              hiddenIds={approvalVisibility.hiddenIds}
              onToggle={approvalVisibility.toggle}
            />
          </div>
          <BillsTable
            bills={approvalBills}
            columns={approvalVisibility.visibleColumns}
            emptyMessage="No bills awaiting approval."
          />
        </div>
      ) : null}
      {activeTab === 'payment' ? (
        <div className="grid gap-3">
          <div className="flex justify-end">
            <ColumnPicker
              columns={paymentVisibility.configurableColumns}
              hiddenIds={paymentVisibility.hiddenIds}
              onToggle={paymentVisibility.toggle}
            />
          </div>
          <BillsTable
            bills={paymentBills}
            columns={paymentVisibility.visibleColumns}
            emptyMessage="No bills ready for payment."
          />
        </div>
      ) : null}

      <BillTransitionDialog isPending={isPending} transitions={transitions} />
    </main>
  );
}
