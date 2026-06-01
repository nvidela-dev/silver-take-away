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

import { Button } from '@/app/_components/atoms/button';
import { PageHeader } from '@/app/_components/molecules/page-header';
import { SurfaceTabs } from '@/app/_components/molecules/surface-tabs';
import { createBill } from '@/lib/actions/bills/create-bill';
import { deleteBill } from '@/lib/actions/bills/delete-bill';
import { updateBill } from '@/lib/actions/bills/update-bill';
import { billTabs } from '@/app/_navigation';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type { BillFormOptions, BillListItem } from '@/lib/types/bill/views';

import { BillNoteDialog } from './bill-note-dialog';
import { BillTransitionDialog } from './bill-transition-dialog';
import { BillsBulkActionsMenu, type BulkActionDescriptor } from './bills-bulk-actions-bar';
import { BillsStatusOverview } from './bills-status-overview';
import { BillsTable } from './bills-table';
import {
  approvalActionsColumn,
  billReadColumns,
  draftActionsColumn,
  selectionColumn,
} from './bills-table-columns';
import { BulkConfirmDialog } from './bulk-confirm-dialog';
import { BulkEditDialog } from './bulk-edit-dialog';
import { ColumnPicker } from './column-picker';
import { DraftBillForm } from './draft-bill-form';
import { useBillBulkActions } from './hooks/use-bill-bulk-actions';
import { useBillTransitions } from './hooks/use-bill-transitions';
import { useBillsSelection } from './hooks/use-bills-selection';
import { useColumnVisibility } from './hooks/use-column-visibility';
import { useDialogBehavior } from './hooks/use-dialog-behavior';

interface BillsWorkspaceProps {
  activeTab: string;
  approvalAmountTotal: string;
  approvalBills: BillListItem[];
  approvalTotal: number;
  currentPage: number;
  draftAmountTotal: string;
  draftBills: BillListItem[];
  draftTotal: number;
  loadError: string | null;
  options: BillFormOptions;
  paymentAmountTotal: string;
  paymentBills: BillListItem[];
  paymentTotal: number;
}

export function BillsWorkspace({
  activeTab,
  approvalAmountTotal,
  approvalBills,
  approvalTotal,
  currentPage,
  draftAmountTotal,
  draftBills,
  draftTotal,
  loadError,
  options,
  paymentAmountTotal,
  paymentBills,
  paymentTotal,
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

  const bulk = useBillBulkActions({
    startTransition,
    router,
    onDirectError: setFormError,
  });

  const draftIds = useMemo(() => draftBills.map((bill) => bill.id), [draftBills]);
  const approvalIds = useMemo(() => approvalBills.map((bill) => bill.id), [approvalBills]);

  const draftSelection = useBillsSelection(draftIds);
  const approvalSelection = useBillsSelection(approvalIds);

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
    selectionColumn(draftSelection),
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
    selectionColumn(approvalSelection),
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

  const draftBulkActions: BulkActionDescriptor[] = [
    {
      id: 'submit',
      label: 'Submit for approval',
      variant: 'accent',
      onClick: () => bulk.submit({
        billIds: [...draftSelection.selectedIds],
        onSuccess: draftSelection.clear,
      }),
    },
    {
      id: 'edit',
      label: 'Edit',
      variant: 'secondary',
      onClick: () => bulk.requestEdit({
        billIds: [...draftSelection.selectedIds],
        onSuccess: draftSelection.clear,
      }),
    },
    {
      id: 'delete',
      label: 'Delete',
      variant: 'destructive',
      onClick: () => bulk.requestDelete({
        billIds: [...draftSelection.selectedIds],
        onSuccess: draftSelection.clear,
      }),
    },
  ];

  const approvalBulkActions: BulkActionDescriptor[] = [
    {
      id: 'approve',
      label: 'Approve',
      variant: 'accent',
      onClick: () => bulk.requestApprove({
        billIds: [...approvalSelection.selectedIds],
        onSuccess: approvalSelection.clear,
      }),
    },
    {
      id: 'reject',
      label: 'Reject',
      variant: 'destructive',
      onClick: () => bulk.requestReject({
        billIds: [...approvalSelection.selectedIds],
        onSuccess: approvalSelection.clear,
      }),
    },
  ];

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
      <SurfaceTabs
        actions={(
          <>
            {activeTab === 'drafts' ? (
              <BillsBulkActionsMenu
                actions={draftBulkActions}
                count={draftSelection.selectedCount}
                isPending={isPending}
                onClear={draftSelection.clear}
              />
            ) : null}
            {activeTab === 'approvals' ? (
              <BillsBulkActionsMenu
                actions={approvalBulkActions}
                count={approvalSelection.selectedCount}
                isPending={isPending}
                onClear={approvalSelection.clear}
              />
            ) : null}
            {activeTab === 'drafts' ? (
              <ColumnPicker
                columns={draftVisibility.configurableColumns}
                hiddenIds={draftVisibility.hiddenIds}
                onToggle={draftVisibility.toggle}
              />
            ) : null}
            {activeTab === 'approvals' ? (
              <ColumnPicker
                columns={approvalVisibility.configurableColumns}
                hiddenIds={approvalVisibility.hiddenIds}
                onToggle={approvalVisibility.toggle}
              />
            ) : null}
            {activeTab === 'payment' ? (
              <ColumnPicker
                columns={paymentVisibility.configurableColumns}
                hiddenIds={paymentVisibility.hiddenIds}
                onToggle={paymentVisibility.toggle}
              />
            ) : null}
          </>
        )}
        activeValue={activeTab}
        tabs={billTabs}
      />

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
          approvalAmountTotal={approvalAmountTotal}
          approvalTotal={approvalTotal}
          draftAmountTotal={draftAmountTotal}
          draftTotal={draftTotal}
          paymentAmountTotal={paymentAmountTotal}
          paymentTotal={paymentTotal}
        />
      ) : null}
      {activeTab === 'drafts' ? (
        <div>
          <BillsTable
            amountTotal={draftAmountTotal}
            bills={draftBills}
            columns={draftVisibility.visibleColumns}
            currentPage={currentPage}
            emptyMessage="No draft bills yet."
            isLoading={isPending}
            loadingMessage="Loading draft bills…"
            totalBills={draftTotal}
          />
        </div>
      ) : null}
      {activeTab === 'approvals' ? (
        <div>
          <BillsTable
            amountTotal={approvalAmountTotal}
            bills={approvalBills}
            columns={approvalVisibility.visibleColumns}
            currentPage={currentPage}
            emptyMessage="No bills awaiting approval."
            isLoading={isPending}
            loadingMessage="Loading bills awaiting approval…"
            totalBills={approvalTotal}
          />
        </div>
      ) : null}
      {activeTab === 'payment' ? (
        <div>
          <BillsTable
            amountTotal={paymentAmountTotal}
            bills={paymentBills}
            columns={paymentVisibility.visibleColumns}
            currentPage={currentPage}
            emptyMessage="No bills ready for payment."
            isLoading={isPending}
            loadingMessage="Loading bills ready for payment…"
            totalBills={paymentTotal}
          />
        </div>
      ) : null}

      <BillTransitionDialog isPending={isPending} transitions={transitions} />

      {bulk.pending?.kind === 'approve' ? (
        <BillNoteDialog
          confirmLabel="Approve bills"
          confirmVariant="accent"
          description={`${bulk.pending.billIds.length} bills selected`}
          error={bulk.bulkError}
          isPending={isPending}
          noteRequired={false}
          notePlaceholder="Optional context for the approval log."
          onCancel={bulk.cancel}
          onConfirm={bulk.confirmApprove}
          title="Bulk approve bills"
        />
      ) : null}

      {bulk.pending?.kind === 'reject' ? (
        <BillNoteDialog
          confirmLabel="Reject bills"
          confirmVariant="destructive"
          description={`${bulk.pending.billIds.length} bills selected`}
          error={bulk.bulkError}
          isPending={isPending}
          noteRequired
          notePlaceholder="Why are these bills being rejected?"
          onCancel={bulk.cancel}
          onConfirm={bulk.confirmReject}
          title="Bulk reject bills"
        />
      ) : null}

      {bulk.pending?.kind === 'delete' ? (
        <BulkConfirmDialog
          confirmLabel="Delete drafts"
          confirmVariant="destructive"
          description={`Permanently delete ${bulk.pending.billIds.length} draft `
            + `${bulk.pending.billIds.length === 1 ? 'bill' : 'bills'}? This cannot be undone.`}
          error={bulk.bulkError}
          isPending={isPending}
          onCancel={bulk.cancel}
          onConfirm={bulk.confirmDelete}
          title="Delete selected drafts"
        />
      ) : null}

      {bulk.pending?.kind === 'edit' ? (
        <BulkEditDialog
          billIds={bulk.pending.billIds}
          categoryOptions={options.categories}
          error={bulk.bulkError}
          isPending={isPending}
          onCancel={bulk.cancel}
          onConfirm={bulk.confirmEdit}
        />
      ) : null}
    </main>
  );
}
