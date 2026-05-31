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
import type {
  BillFilterOptions,
  BillListResult,
} from '@/lib/types/bill/filters';
import type { BillStatus } from '@/lib/types/enums';
import type { BillFormOptions, BillListItem } from '@/lib/types/bill/views';

import { BillTransitionDialog } from './bill-transition-dialog';
import { BillsStatusOverview } from './bills-status-overview';
import { BillsTable } from './bills-table';
import { BillsTablePagination } from './bills-table-pagination';
import {
  approvalActionsColumn,
  billReadColumns,
  draftActionsColumn,
} from './bills-table-columns';
import { ColumnPicker } from './column-picker';
import { DraftBillForm } from './draft-bill-form';
import {
  BillFilterBar,
  type BillFilterOptionsBag,
} from './filters/bill-filter-bar';
import type { BillFilterTab } from './filters/bill-filter-dimensions';
import { useBillFilters } from './hooks/use-bill-filters';
import { useBillTransitions } from './hooks/use-bill-transitions';
import { useColumnVisibility } from './hooks/use-column-visibility';
import { useDialogBehavior } from './hooks/use-dialog-behavior';

const PAYMENT_TAB_STATUSES: BillStatus[] = ['approved', 'scheduled', 'initiated'];

interface BillsWorkspaceProps {
  activeTab: string;
  approvalBills: BillListResult<BillListItem>;
  draftBills: BillListResult<BillListItem>;
  filterOptions: BillFilterOptions;
  loadError: string | null;
  options: BillFormOptions;
  paymentBills: BillListResult<BillListItem>;
}

export function BillsWorkspace({
  activeTab,
  approvalBills,
  draftBills,
  filterOptions,
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

  const filtersController = useBillFilters();

  const editingBill = useMemo(
    () => (editingBillId
      ? draftBills.items.find((bill) => bill.id === editingBillId) ?? null
      : null),
    [draftBills.items, editingBillId],
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

  const filterOptionsBag: BillFilterOptionsBag = useMemo(() => ({
    vendors: filterOptions.vendors,
    owners: filterOptions.owners,
    categories: filterOptions.categories,
    statuses: PAYMENT_TAB_STATUSES,
  }), [filterOptions]);

  const renderTabToolbar = (
    tab: BillFilterTab,
    columnControl: ReturnType<typeof useColumnVisibility>,
  ) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <BillFilterBar
        controller={filtersController}
        options={filterOptionsBag}
        tab={tab}
      />
      <ColumnPicker
        columns={columnControl.configurableColumns}
        hiddenIds={columnControl.hiddenIds}
        onToggle={columnControl.toggle}
      />
    </div>
  );

  const renderPagination = (total: number) => (
    <BillsTablePagination
      onPageChange={(page) => {
        void filtersController.setPage(page);
      }}
      onPageSizeChange={(pageSize) => {
        void filtersController.setPageSize(pageSize);
      }}
      page={filtersController.pagination.page}
      pageSize={filtersController.pagination.pageSize}
      pageSizeOptions={filtersController.pageSizeOptions}
      total={total}
    />
  );

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
          approvalBills={approvalBills.items}
          draftBills={draftBills.items}
          paymentBills={paymentBills.items}
        />
      ) : null}
      {activeTab === 'drafts' ? (
        <div className="grid gap-3">
          {renderTabToolbar('drafts', draftVisibility)}
          <BillsTable
            bills={draftBills.items}
            columns={draftVisibility.visibleColumns}
            emptyMessage="No draft bills match this view."
            isLoading={isPending}
            loadingMessage="Loading draft bills…"
          />
          {renderPagination(draftBills.total)}
        </div>
      ) : null}
      {activeTab === 'approvals' ? (
        <div className="grid gap-3">
          {renderTabToolbar('approvals', approvalVisibility)}
          <BillsTable
            bills={approvalBills.items}
            columns={approvalVisibility.visibleColumns}
            emptyMessage="No bills awaiting approval match this view."
          />
          {renderPagination(approvalBills.total)}
        </div>
      ) : null}
      {activeTab === 'payment' ? (
        <div className="grid gap-3">
          {renderTabToolbar('payment', paymentVisibility)}
          <BillsTable
            bills={paymentBills.items}
            columns={paymentVisibility.visibleColumns}
            emptyMessage="No bills ready for payment match this view."
          />
          {renderPagination(paymentBills.total)}
        </div>
      ) : null}

      <BillTransitionDialog isPending={isPending} transitions={transitions} />
    </main>
  );
}
