'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback, useMemo, useState, useTransition,
} from 'react';

import { Alert } from '@/app/_components/atoms/alert';
import { useColumnVisibility } from '@/app/_components/hooks/use-column-visibility';
import { useSavedView } from '@/app/_components/hooks/use-saved-view';
import { useTableSelection } from '@/app/_components/hooks/use-table-selection';
import {
  BulkActionsMenu,
  type BulkActionDescriptor,
} from '@/app/_components/molecules/bulk-actions-menu';
import { ColumnPicker } from '@/app/_components/molecules/column-picker';
import { ExportCsvButton } from '@/app/_components/molecules/export-csv-button';
import { NoteDialog } from '@/app/_components/molecules/note-dialog';
import { PageHeader } from '@/app/_components/molecules/page-header';
import { SavedViewControls } from '@/app/_components/molecules/saved-view-controls';
import { SurfaceTabs } from '@/app/_components/molecules/surface-tabs';
import { paymentTabs } from '@/app/_navigation';
import type {
  PaymentListResult,
  PaymentReferenceData,
} from '@/lib/types/payment/filters';
import type { PaymentFilterTab } from '@/lib/types/payment/tabs';
import type { PaymentListItem } from '@/lib/types/payment/views';
import type {
  WorkspaceKey,
  WorkspaceTabPreferences,
} from '@/lib/types/workspace-preferences';
import {
  parseSavedPaymentFilterValues,
} from '@/lib/validators/payment-filter-spec';
import { isPaymentSortKey } from '@/lib/validators/payment-sort-spec';
import { PAYMENT_EXPORT_COLUMN_IDS } from '@/lib/export/columns';

import { PaymentFilterBar } from './filters/payment-filter-bar';
import { usePaymentBulkActions } from './hooks/use-payment-bulk-actions';
import { usePaymentFilters } from './hooks/use-payment-filters';
import { usePaymentTransitions } from './hooks/use-payment-transitions';
import { PaymentTransitionDialog } from './payment-transition-dialog';
import { PaymentsTable } from './payments-table';
import {
  historyActionsColumn,
  paymentReadColumns,
  processingActionsColumn,
  selectionColumn,
  upcomingActionsColumn,
} from './payments-table-columns';

interface PaymentsWorkspaceProps {
  activePayments: PaymentListResult<PaymentListItem>;
  activeTab: PaymentFilterTab;
  loadError: string | null;
  referenceData: PaymentReferenceData;
  savedPreferences: WorkspaceTabPreferences | null;
}

const PAYMENT_TAB_TO_WORKSPACE_KEY: Record<PaymentFilterTab, WorkspaceKey> = {
  upcoming: 'payments.upcoming',
  processing: 'payments.processing',
  history: 'payments.history',
};

const PAYMENT_EXPORT_COLUMN_ID_SET = new Set<string>(PAYMENT_EXPORT_COLUMN_IDS);

const EMPTY_MESSAGE_BY_TAB: Record<PaymentFilterTab, string> = {
  upcoming: 'No upcoming payments match this view.',
  processing: 'No payments are currently processing.',
  history: 'No paid, failed, or cancelled payments match this view.',
};

const LOADING_MESSAGE_BY_TAB: Record<PaymentFilterTab, string> = {
  upcoming: 'Loading upcoming payments…',
  processing: 'Loading payments in processing…',
  history: 'Loading payment history…',
};

export function PaymentsWorkspace({
  activePayments,
  activeTab,
  loadError,
  referenceData,
  savedPreferences,
}: PaymentsWorkspaceProps) {
  const router = useRouter();
  const filtersController = usePaymentFilters();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const transitions = usePaymentTransitions({
    startTransition,
    router,
    onDirectError: setActionError,
  });

  const bulk = usePaymentBulkActions({
    startTransition,
    router,
    onDirectError: setActionError,
  });

  const activeIds = useMemo(
    () => activePayments.items.map((payment) => payment.id),
    [activePayments.items],
  );

  // Per-tab selection state. Only the active tab's selection is wired to
  // the on-screen rows; the others stay zero-length and never collide.
  const upcomingSelection = useTableSelection(activeTab === 'upcoming' ? activeIds : []);
  const processingSelection = useTableSelection(activeTab === 'processing' ? activeIds : []);
  const historySelection = useTableSelection(activeTab === 'history' ? activeIds : []);

  const upcomingColumns = [
    selectionColumn(upcomingSelection),
    ...paymentReadColumns,
    upcomingActionsColumn({
      onInitiate: transitions.initiate,
      onCancel: transitions.requestCancel,
    }),
  ];
  const processingColumns = [
    selectionColumn(processingSelection),
    ...paymentReadColumns,
    processingActionsColumn({
      onMarkPaid: transitions.requestMarkPaid,
      onMarkFailed: transitions.requestMarkFailed,
    }),
  ];
  const historyColumns = [
    selectionColumn(historySelection),
    ...paymentReadColumns,
    historyActionsColumn({
      onRetry: transitions.retry,
    }),
  ];

  const initialHiddenColumns = savedPreferences?.hiddenColumns ?? [];
  const upcomingVisibility = useColumnVisibility(
    upcomingColumns,
    activeTab === 'upcoming' ? initialHiddenColumns : [],
  );
  const processingVisibility = useColumnVisibility(
    processingColumns,
    activeTab === 'processing' ? initialHiddenColumns : [],
  );
  const historyVisibility = useColumnVisibility(
    historyColumns,
    activeTab === 'history' ? initialHiddenColumns : [],
  );

  const activeVisibility = (() => {
    if (activeTab === 'upcoming') return upcomingVisibility;
    if (activeTab === 'processing') return processingVisibility;
    return historyVisibility;
  })();

  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    void filtersController.setValues(parseSavedPaymentFilterValues(filters));
  }, [filtersController]);
  const applySort = useCallback((sort: { by: string; dir: 'asc' | 'desc' }) => {
    if (isPaymentSortKey(sort.by)) {
      void filtersController.setSort({ by: sort.by, dir: sort.dir });
    }
  }, [filtersController]);
  const applyPageSize = useCallback((pageSize: number) => {
    void filtersController.setPageSize(pageSize);
  }, [filtersController]);
  const applyHiddenColumns = useCallback((hidden: readonly string[]) => {
    activeVisibility.setHidden(hidden);
  }, [activeVisibility]);

  const savedView = useSavedView({
    workspaceKey: PAYMENT_TAB_TO_WORKSPACE_KEY[activeTab],
    savedPreferences,
    currentFilters: filtersController.values,
    currentSort: filtersController.sort,
    currentPageSize: filtersController.pagination.pageSize,
    currentHiddenColumns: [...activeVisibility.hiddenIds],
    applyFilters,
    applySort,
    applyPageSize,
    applyHiddenColumns,
    router,
  });

  const upcomingBulkActions: BulkActionDescriptor[] = [
    {
      id: 'initiate',
      label: 'Initiate',
      variant: 'accent',
      onClick: () => bulk.initiate({
        paymentIds: [...upcomingSelection.selectedIds],
        onSuccess: upcomingSelection.clear,
      }),
    },
    {
      id: 'cancel',
      label: 'Cancel',
      variant: 'destructive',
      onClick: () => bulk.requestCancel({
        paymentIds: [...upcomingSelection.selectedIds],
        onSuccess: upcomingSelection.clear,
      }),
    },
  ];

  const processingBulkActions: BulkActionDescriptor[] = [
    {
      id: 'mark_paid',
      label: 'Mark paid',
      variant: 'accent',
      onClick: () => bulk.requestMarkPaid({
        paymentIds: [...processingSelection.selectedIds],
        onSuccess: processingSelection.clear,
      }),
    },
    {
      id: 'mark_failed',
      label: 'Mark failed',
      variant: 'destructive',
      onClick: () => bulk.requestMarkFailed({
        paymentIds: [...processingSelection.selectedIds],
        onSuccess: processingSelection.clear,
      }),
    },
  ];

  // History-tab retry only applies to failed rows; bulk-retry will silently
  // skip non-failed selections at the DB layer (the bulk update is scoped to
  // status='failed').
  const historyBulkActions: BulkActionDescriptor[] = [
    {
      id: 'retry',
      label: 'Retry failed',
      variant: 'accent',
      onClick: () => bulk.retry({
        paymentIds: [...historySelection.selectedIds],
        onSuccess: historySelection.clear,
      }),
    },
  ];

  const isTableLoading = isPending || filtersController.isPending;
  const exportColumnIds = activeVisibility.visibleColumns
    .map((column) => column.id)
    .filter((id) => PAYMENT_EXPORT_COLUMN_ID_SET.has(id));

  return (
    <main className="grid gap-6">
      <PageHeader eyebrow="Bill Pay" title="Payments" />
      <SurfaceTabs
        actions={(
          <>
            <SavedViewControls controller={savedView} />
            <ExportCsvButton
              columnIds={exportColumnIds}
              resource="payments"
              tab={activeTab}
            />
            {activeTab === 'upcoming' ? (
              <>
                <BulkActionsMenu
                  actions={upcomingBulkActions}
                  count={upcomingSelection.selectedCount}
                  entityLabel="payment"
                  isPending={isPending}
                  onClear={upcomingSelection.clear}
                />
                <ColumnPicker
                  columns={upcomingVisibility.configurableColumns}
                  hiddenIds={upcomingVisibility.hiddenIds}
                  onToggle={upcomingVisibility.toggle}
                />
              </>
            ) : null}
            {activeTab === 'processing' ? (
              <>
                <BulkActionsMenu
                  actions={processingBulkActions}
                  count={processingSelection.selectedCount}
                  entityLabel="payment"
                  isPending={isPending}
                  onClear={processingSelection.clear}
                />
                <ColumnPicker
                  columns={processingVisibility.configurableColumns}
                  hiddenIds={processingVisibility.hiddenIds}
                  onToggle={processingVisibility.toggle}
                />
              </>
            ) : null}
            {activeTab === 'history' ? (
              <>
                <BulkActionsMenu
                  actions={historyBulkActions}
                  count={historySelection.selectedCount}
                  entityLabel="payment"
                  isPending={isPending}
                  onClear={historySelection.clear}
                />
                <ColumnPicker
                  columns={historyVisibility.configurableColumns}
                  hiddenIds={historyVisibility.hiddenIds}
                  onToggle={historyVisibility.toggle}
                />
              </>
            ) : null}
          </>
        )}
        activeValue={activeTab}
        tabs={paymentTabs}
      />
      <PaymentFilterBar
        controller={filtersController}
        options={referenceData}
        tab={activeTab}
      />

      {loadError ? <Alert>{loadError}</Alert> : null}
      {actionError ? <Alert>{actionError}</Alert> : null}

      {activeTab === 'upcoming' ? (
        <div>
          <PaymentsTable
            amountTotal={activePayments.amountTotal}
            columns={upcomingVisibility.visibleColumns}
            currentPage={filtersController.pagination.page}
            emptyMessage={EMPTY_MESSAGE_BY_TAB.upcoming}
            isLoading={isTableLoading}
            loadingMessage={LOADING_MESSAGE_BY_TAB.upcoming}
            onPageSizeChange={(pageSize) => {
              void filtersController.setPageSize(pageSize);
            }}
            onSortChange={(key) => {
              void filtersController.toggleSort(key);
            }}
            pageSize={filtersController.pagination.pageSize}
            pageSizeOptions={filtersController.pageSizeOptions}
            payments={activePayments.items}
            sort={filtersController.sort}
            totalPayments={activePayments.total}
          />
        </div>
      ) : null}
      {activeTab === 'processing' ? (
        <div>
          <PaymentsTable
            amountTotal={activePayments.amountTotal}
            columns={processingVisibility.visibleColumns}
            currentPage={filtersController.pagination.page}
            emptyMessage={EMPTY_MESSAGE_BY_TAB.processing}
            isLoading={isTableLoading}
            loadingMessage={LOADING_MESSAGE_BY_TAB.processing}
            onPageSizeChange={(pageSize) => {
              void filtersController.setPageSize(pageSize);
            }}
            onSortChange={(key) => {
              void filtersController.toggleSort(key);
            }}
            pageSize={filtersController.pagination.pageSize}
            pageSizeOptions={filtersController.pageSizeOptions}
            payments={activePayments.items}
            sort={filtersController.sort}
            totalPayments={activePayments.total}
          />
        </div>
      ) : null}
      {activeTab === 'history' ? (
        <div>
          <PaymentsTable
            amountTotal={activePayments.amountTotal}
            columns={historyVisibility.visibleColumns}
            currentPage={filtersController.pagination.page}
            emptyMessage={EMPTY_MESSAGE_BY_TAB.history}
            isLoading={isTableLoading}
            loadingMessage={LOADING_MESSAGE_BY_TAB.history}
            onPageSizeChange={(pageSize) => {
              void filtersController.setPageSize(pageSize);
            }}
            onSortChange={(key) => {
              void filtersController.toggleSort(key);
            }}
            pageSize={filtersController.pagination.pageSize}
            pageSizeOptions={filtersController.pageSizeOptions}
            payments={activePayments.items}
            sort={filtersController.sort}
            totalPayments={activePayments.total}
          />
        </div>
      ) : null}

      <PaymentTransitionDialog isPending={isPending} transitions={transitions} />

      {bulk.pending?.kind === 'cancel' ? (
        <NoteDialog
          confirmLabel="Cancel payments"
          confirmVariant="destructive"
          description={`${bulk.pending.paymentIds.length} payments selected`}
          error={bulk.bulkError}
          isPending={isPending}
          noteRequired={false}
          notePlaceholder="Optional reason for cancelling these payments."
          onCancel={bulk.cancel}
          onConfirm={bulk.confirmCancel}
          title="Bulk cancel payments"
        />
      ) : null}

      {bulk.pending?.kind === 'mark_paid' ? (
        <NoteDialog
          confirmLabel="Mark as paid"
          confirmVariant="accent"
          description={`${bulk.pending.paymentIds.length} payments selected`}
          error={bulk.bulkError}
          isPending={isPending}
          noteRequired={false}
          notePlaceholder="Optional confirmation reference or context."
          onCancel={bulk.cancel}
          onConfirm={bulk.confirmMarkPaid}
          title="Bulk mark payments as paid"
        />
      ) : null}

      {bulk.pending?.kind === 'mark_failed' ? (
        <NoteDialog
          confirmLabel="Mark as failed"
          confirmVariant="destructive"
          description={`${bulk.pending.paymentIds.length} payments selected`}
          error={bulk.bulkError}
          isPending={isPending}
          noteRequired
          notePlaceholder="Why did these payments fail?"
          onCancel={bulk.cancel}
          onConfirm={bulk.confirmMarkFailed}
          title="Bulk mark payments as failed"
        />
      ) : null}
    </main>
  );
}
