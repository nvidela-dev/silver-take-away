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

import { Alert } from '@/app/_components/atoms/alert';
import { Button } from '@/app/_components/atoms/button';
import { useColumnVisibility } from '@/app/_components/hooks/use-column-visibility';
import { useDialogBehavior } from '@/app/_components/hooks/use-dialog-behavior';
import { useTableSelection } from '@/app/_components/hooks/use-table-selection';
import {
  BulkActionsMenu,
  type BulkActionDescriptor,
} from '@/app/_components/molecules/bulk-actions-menu';
import { ColumnPicker } from '@/app/_components/molecules/column-picker';
import { PageHeader } from '@/app/_components/molecules/page-header';
import { SurfaceTabs } from '@/app/_components/molecules/surface-tabs';
import { createBill } from '@/lib/actions/bills/create-bill';
import { deleteBill } from '@/lib/actions/bills/delete-bill';
import { updateBill } from '@/lib/actions/bills/update-bill';
import { billTabs } from '@/app/_navigation';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type {
  BillListResult,
  BillOverviewGroup,
  BillReferenceData,
} from '@/lib/types/bill/filters';
import type { BillFilterTab } from '@/lib/types/bill/tabs';
import type { BillListItem } from '@/lib/types/bill/views';

import { BillNoteDialog } from './bill-note-dialog';
import { BillTransitionDialog } from './bill-transition-dialog';
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
import { DraftBillForm } from './draft-bill-form';
import { BillFilterBar } from './filters/bill-filter-bar';
import { useBillBulkActions } from './hooks/use-bill-bulk-actions';
import { useBillFilters } from './hooks/use-bill-filters';
import { useBillTransitions } from './hooks/use-bill-transitions';

type BillTabValue = 'overview' | BillFilterTab;

interface BillsWorkspaceProps {
  activeBills: BillListResult<BillListItem>;
  activeTab: BillTabValue;
  overviewGroups: BillOverviewGroup[];
  loadError: string | null;
  referenceData: BillReferenceData;
}

export function BillsWorkspace({
  activeBills,
  activeTab,
  overviewGroups,
  loadError,
  referenceData,
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
  const filtersController = useBillFilters();

  const activeIds = useMemo(() => activeBills.items.map((bill) => bill.id), [activeBills.items]);

  const draftSelection = useTableSelection(activeTab === 'drafts' ? activeIds : []);
  const approvalSelection = useTableSelection(activeTab === 'approvals' ? activeIds : []);

  const editingBill = useMemo(
    () => (editingBillId && activeTab === 'drafts'
      ? activeBills.items.find((bill) => bill.id === editingBillId) ?? null
      : null),
    [activeBills.items, activeTab, editingBillId],
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
  const isTableLoading = isPending || filtersController.isPending;

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
              <BulkActionsMenu
                actions={draftBulkActions}
                count={draftSelection.selectedCount}
                entityLabel="bill"
                isPending={isPending}
                onClear={draftSelection.clear}
              />
            ) : null}
            {activeTab === 'approvals' ? (
              <BulkActionsMenu
                actions={approvalBulkActions}
                count={approvalSelection.selectedCount}
                entityLabel="bill"
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
      <BillFilterBar
        controller={filtersController}
        options={referenceData}
        tab={activeTab}
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
                options={{
                  categories: referenceData.categories,
                  vendors: referenceData.vendors,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {!isFormOpen && formError ? (
        <Alert>
          {formError}
        </Alert>
      ) : null}

      {activeTab === 'overview' ? (
        <BillsStatusOverview groups={overviewGroups} />
      ) : null}
      {activeTab === 'drafts' ? (
        <div>
          <BillsTable
            amountTotal={activeBills.amountTotal}
            bills={activeBills.items}
            columns={draftVisibility.visibleColumns}
            currentPage={filtersController.pagination.page}
            emptyMessage="No draft bills match this view."
            isLoading={isTableLoading}
            loadingMessage="Loading draft bills…"
            onPageSizeChange={(pageSize) => {
              void filtersController.setPageSize(pageSize);
            }}
            onSortChange={(key) => {
              void filtersController.toggleSort(key);
            }}
            pageSize={filtersController.pagination.pageSize}
            pageSizeOptions={filtersController.pageSizeOptions}
            sort={filtersController.sort}
            totalBills={activeBills.total}
          />
        </div>
      ) : null}
      {activeTab === 'approvals' ? (
        <div>
          <BillsTable
            amountTotal={activeBills.amountTotal}
            bills={activeBills.items}
            columns={approvalVisibility.visibleColumns}
            currentPage={filtersController.pagination.page}
            emptyMessage="No bills awaiting approval match this view."
            isLoading={isTableLoading}
            loadingMessage="Loading bills awaiting approval…"
            onPageSizeChange={(pageSize) => {
              void filtersController.setPageSize(pageSize);
            }}
            onSortChange={(key) => {
              void filtersController.toggleSort(key);
            }}
            pageSize={filtersController.pagination.pageSize}
            pageSizeOptions={filtersController.pageSizeOptions}
            sort={filtersController.sort}
            totalBills={activeBills.total}
          />
        </div>
      ) : null}
      {activeTab === 'payment' ? (
        <div>
          <BillsTable
            amountTotal={activeBills.amountTotal}
            bills={activeBills.items}
            columns={paymentVisibility.visibleColumns}
            currentPage={filtersController.pagination.page}
            emptyMessage="No bills ready for payment match this view."
            isLoading={isTableLoading}
            loadingMessage="Loading bills ready for payment…"
            onPageSizeChange={(pageSize) => {
              void filtersController.setPageSize(pageSize);
            }}
            onSortChange={(key) => {
              void filtersController.toggleSort(key);
            }}
            pageSize={filtersController.pagination.pageSize}
            pageSizeOptions={filtersController.pageSizeOptions}
            sort={filtersController.sort}
            totalBills={activeBills.total}
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
          categoryOptions={referenceData.categories}
          error={bulk.bulkError}
          isPending={isPending}
          onCancel={bulk.cancel}
          onConfirm={bulk.confirmEdit}
        />
      ) : null}
    </main>
  );
}
