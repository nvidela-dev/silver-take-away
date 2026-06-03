'use client';

import { useRouter } from 'next/navigation';
import {
  Plus,
  RefreshCw,
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
import { useSavedView } from '@/app/_components/hooks/use-saved-view';
import { useTableSelection } from '@/app/_components/hooks/use-table-selection';
import {
  BulkActionsMenu,
  type BulkActionDescriptor,
} from '@/app/_components/molecules/bulk-actions-menu';
import { ExportCsvButton } from '@/app/_components/molecules/export-csv-button';
import { PageHeader } from '@/app/_components/molecules/page-header';
import { SavedViewControls } from '@/app/_components/molecules/saved-view-controls';
import { SurfaceTabs } from '@/app/_components/molecules/surface-tabs';
import { notify } from '@/app/_components/feedback/notify';
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
import type {
  WorkspaceKey,
  WorkspaceTabPreferences,
} from '@/lib/types/workspace-preferences';
import {
  parseSavedBillFilterValues,
} from '@/lib/validators/bill-filter-spec';
import { isBillSortKey } from '@/lib/validators/bill-sort-spec';
import { BILL_EXPORT_COLUMN_IDS } from '@/lib/export/columns';

import { BulkConfirmDialog } from '@/app/_components/molecules/bulk-confirm-dialog';
import { NoteDialog } from '@/app/_components/molecules/note-dialog';

import { BillTransitionDialog } from './bill-transition-dialog';
import { BillDetailDialog } from './bill-detail-dialog';
import { BillsStatusOverview } from './bills-status-overview';
import { BillsTable } from './bills-table';
import {
  approvalActionsColumn,
  billReadColumns,
  billRowActionsColumn,
  draftActionsColumn,
  selectionColumn,
} from './bills-table-columns';
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
  savedPreferences: WorkspaceTabPreferences | null;
}

const BILL_TAB_TO_WORKSPACE_KEY: Record<BillFilterTab, WorkspaceKey> = {
  drafts: 'bills.drafts',
  approvals: 'bills.approvals',
  payment: 'bills.payment',
  history: 'bills.history',
};

const BILL_EXPORT_COLUMN_ID_SET = new Set<string>(BILL_EXPORT_COLUMN_IDS);

export function BillsWorkspace({
  activeBills,
  activeTab,
  overviewGroups,
  loadError,
  referenceData,
  savedPreferences,
}: BillsWorkspaceProps): React.ReactElement {
  const router = useRouter();
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<BillListItem | null>(null);
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

  const selectBillForDetails = useCallback((bill: BillListItem) => {
    setSelectedBill(bill);
  }, []);

  const closeBillDetails = useCallback(() => {
    setSelectedBill(null);
  }, []);

  const onSubmit = useCallback((input: CreateBillInput) => {
    setFormError(null);

    startTransition(async () => {
      const result = editingBill
        ? await updateBill({
          ...input,
          id: editingBill.id,
          expectedUpdatedAt: editingBill.updatedAt.toISOString(),
        }) : await createBill(input);

      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }

      notify.success(editingBill ? 'Bill updated' : 'Bill created');
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

      notify.success('Bill deleted');
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
    ...billReadColumns({ onViewDetails: selectBillForDetails }),
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
    ...billReadColumns({ onViewDetails: selectBillForDetails }),
    approvalActionsColumn({
      onApprove: transitions.requestApprove,
      onReject: transitions.requestReject,
      onArchive: transitions.requestArchive,
    }),
  ];
  const paymentColumns = [
    ...billReadColumns({ onViewDetails: selectBillForDetails }),
    billRowActionsColumn({ onArchive: transitions.requestArchive }),
  ];
  const historyColumns = billReadColumns({ onViewDetails: selectBillForDetails });

  const initialHiddenColumns = savedPreferences?.hiddenColumns ?? [];
  const draftVisibility = useColumnVisibility(
    draftColumns,
    activeTab === 'drafts' ? initialHiddenColumns : [],
  );
  const approvalVisibility = useColumnVisibility(
    approvalColumns,
    activeTab === 'approvals' ? initialHiddenColumns : [],
  );
  const paymentVisibility = useColumnVisibility(
    paymentColumns,
    activeTab === 'payment' ? initialHiddenColumns : [],
  );
  const historyVisibility = useColumnVisibility(
    historyColumns,
    activeTab === 'history' ? initialHiddenColumns : [],
  );

  const activeVisibility = (() => {
    if (activeTab === 'drafts') return draftVisibility;
    if (activeTab === 'approvals') return approvalVisibility;
    if (activeTab === 'payment') return paymentVisibility;
    if (activeTab === 'history') return historyVisibility;
    return null;
  })();

  // Build apply* adapters so the saved-view controller can push a saved
  // snapshot back into the URL + column state. Filters are pushed as a
  // single setValues call that explicitly nulls keys not present in the
  // snapshot, so partial overlaps don't leak old filter values.
  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    void filtersController.setValues(parseSavedBillFilterValues(filters));
  }, [filtersController]);
  const applySort = useCallback((sort: { by: string; dir: 'asc' | 'desc' }) => {
    if (isBillSortKey(sort.by)) {
      void filtersController.setSort({ by: sort.by, dir: sort.dir });
    }
  }, [filtersController]);
  const applyPageSize = useCallback((pageSize: number) => {
    void filtersController.setPageSize(pageSize);
  }, [filtersController]);
  const applyHiddenColumns = useCallback((hidden: readonly string[]) => {
    activeVisibility?.setHidden(hidden);
  }, [activeVisibility]);

  const savedView = useSavedView({
    workspaceKey: activeTab !== 'overview'
      ? BILL_TAB_TO_WORKSPACE_KEY[activeTab]
      // Inactive on overview; the controls don't render there.
      : 'bills.drafts',
    savedPreferences,
    currentFilters: filtersController.values,
    currentSort: filtersController.sort,
    currentPageSize: filtersController.pagination.pageSize,
    currentHiddenColumns: activeVisibility ? [...activeVisibility.hiddenIds] : [],
    applyFilters,
    applySort,
    applyPageSize,
    applyHiddenColumns,
    router,
  });

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
  const exportColumnIds = activeVisibility?.visibleColumns
    .map((column) => column.id)
    .filter((id) => BILL_EXPORT_COLUMN_ID_SET.has(id)) ?? [];
  const savedViewColumns = activeVisibility?.configurableColumns.map((column) => ({
    id: column.id,
    isVisible: !activeVisibility.hiddenIds.has(column.id),
    label: column.header,
    onToggle: () => activeVisibility.toggle(column.id),
  })) ?? [];

  return (
    <main className="grid grid-cols-1 gap-6">
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
            {activeTab !== 'overview' && activeTab !== 'drafts' ? (
              <ExportCsvButton
                columnIds={exportColumnIds}
                resource="bills"
                tab={activeTab}
              />
            ) : null}
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
            {activeTab !== 'overview' ? (
              <SavedViewControls columns={savedViewColumns} controller={savedView} />
            ) : null}
          </>
        )}
        activeValue={activeTab}
        tabs={billTabs}
      />
      <BillFilterBar
        actions={(
          <Button
            disabled={isTableLoading}
            onClick={() => startTransition(() => router.refresh())}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw aria-hidden className="size-4" />
            Refresh
          </Button>
        )}
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
        <BillsStatusOverview groups={overviewGroups} onViewDetails={selectBillForDetails} />
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
      {activeTab === 'history' ? (
        <div>
          <BillsTable
            amountTotal={activeBills.amountTotal}
            bills={activeBills.items}
            columns={historyVisibility.visibleColumns}
            currentPage={filtersController.pagination.page}
            emptyMessage="No paid or archived bills match this view."
            isLoading={isTableLoading}
            loadingMessage="Loading bill history…"
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

      {selectedBill ? (
        <BillDetailDialog bill={selectedBill} onClose={closeBillDetails} />
      ) : null}

      {transitions.archiveCandidate ? (
        <BulkConfirmDialog
          confirmLabel="Archive bill"
          confirmVariant="destructive"
          description={`Archive the ${transitions.archiveCandidate.vendor.name} bill? `
            + 'It is removed from your active queue and connected accounting provider '
            + 'and marked closed without payment. It moves to History as Archived for '
            + 'audit and cannot be undone.'}
          error={transitions.archiveError}
          isPending={isPending}
          onCancel={transitions.cancelArchive}
          onConfirm={transitions.confirmArchive}
          title="Archive bill"
        />
      ) : null}

      {bulk.pending?.kind === 'approve' ? (
        <NoteDialog
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
        <NoteDialog
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
