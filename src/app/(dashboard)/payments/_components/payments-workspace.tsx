'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';

import { Alert } from '@/app/_components/atoms/alert';
import { useColumnVisibility } from '@/app/_components/hooks/use-column-visibility';
import { useSavedView } from '@/app/_components/hooks/use-saved-view';
import { useTableSelection } from '@/app/_components/hooks/use-table-selection';
import {
  BulkActionsMenu,
  type BulkActionDescriptor,
} from '@/app/_components/molecules/bulk-actions-menu';
import { ColumnPicker } from '@/app/_components/molecules/column-picker';
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
  PAYMENT_FILTER_FIELD_KEYS,
  type PaymentFilters,
} from '@/lib/validators/payment-filter-spec';

import { PaymentFilterBar } from './filters/payment-filter-bar';
import { usePaymentBulkActions } from './hooks/use-payment-bulk-actions';
import { usePaymentFilters } from './hooks/use-payment-filters';
import { usePaymentTransitions } from './hooks/use-payment-transitions';
import { PaymentTransitionDialog } from './payment-transition-dialog';
import { PaymentsTable } from './payments-table';
import {
  completedActionsColumn,
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
  completed: 'payments.completed',
};

const EMPTY_MESSAGE_BY_TAB: Record<PaymentFilterTab, string> = {
  upcoming: 'No upcoming payments match this view.',
  processing: 'No payments are currently processing.',
  completed: 'No completed payments match this view.',
};

const LOADING_MESSAGE_BY_TAB: Record<PaymentFilterTab, string> = {
  upcoming: 'Loading upcoming payments…',
  processing: 'Loading payments in processing…',
  completed: 'Loading completed payments…',
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
  const completedSelection = useTableSelection(activeTab === 'completed' ? activeIds : []);

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
  const completedColumns = [
    selectionColumn(completedSelection),
    ...paymentReadColumns,
    completedActionsColumn({
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
  const completedVisibility = useColumnVisibility(
    completedColumns,
    activeTab === 'completed' ? initialHiddenColumns : [],
  );

  const activeVisibility = (() => {
    if (activeTab === 'upcoming') return upcomingVisibility;
    if (activeTab === 'processing') return processingVisibility;
    return completedVisibility;
  })();

  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    const updates: Partial<PaymentFilters> = {};
    for (const key of PAYMENT_FILTER_FIELD_KEYS) {
      (updates as Record<string, unknown>)[key] = filters[key] ?? null;
    }
    void filtersController.setValues(updates as Partial<PaymentFilters>);
  }, [filtersController]);
  const applySort = useCallback((sort: { by: string; dir: 'asc' | 'desc' }) => {
    void filtersController.setSort(sort as Parameters<typeof filtersController.setSort>[0]);
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
    currentFilters: filtersController.values as unknown as Record<string, unknown>,
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

  // Completed-tab retry only applies to failed rows; bulk-retry will silently
  // skip non-failed selections at the DB layer (the bulk update is scoped to
  // status='failed').
  const completedBulkActions: BulkActionDescriptor[] = [
    {
      id: 'retry',
      label: 'Retry failed',
      variant: 'accent',
      onClick: () => bulk.retry({
        paymentIds: [...completedSelection.selectedIds],
        onSuccess: completedSelection.clear,
      }),
    },
  ];

  const isTableLoading = isPending || filtersController.isPending;

  return (
    <main className="grid gap-6">
      <PageHeader eyebrow="Bill Pay" title="Payments" />
      <SurfaceTabs
        actions={(
          <>
            <SavedViewControls controller={savedView} />
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
            {activeTab === 'completed' ? (
              <>
                <BulkActionsMenu
                  actions={completedBulkActions}
                  count={completedSelection.selectedCount}
                  entityLabel="payment"
                  isPending={isPending}
                  onClear={completedSelection.clear}
                />
                <ColumnPicker
                  columns={completedVisibility.configurableColumns}
                  hiddenIds={completedVisibility.hiddenIds}
                  onToggle={completedVisibility.toggle}
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
      {activeTab === 'completed' ? (
        <div>
          <PaymentsTable
            amountTotal={activePayments.amountTotal}
            columns={completedVisibility.visibleColumns}
            currentPage={filtersController.pagination.page}
            emptyMessage={EMPTY_MESSAGE_BY_TAB.completed}
            isLoading={isTableLoading}
            loadingMessage={LOADING_MESSAGE_BY_TAB.completed}
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
