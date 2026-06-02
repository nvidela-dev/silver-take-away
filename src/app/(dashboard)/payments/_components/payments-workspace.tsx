'use client';

import { Alert } from '@/app/_components/atoms/alert';
import { useColumnVisibility } from '@/app/_components/hooks/use-column-visibility';
import { ColumnPicker } from '@/app/_components/molecules/column-picker';
import { PageHeader } from '@/app/_components/molecules/page-header';
import { SurfaceTabs } from '@/app/_components/molecules/surface-tabs';
import { paymentTabs } from '@/app/_navigation';
import type {
  PaymentListResult,
  PaymentReferenceData,
} from '@/lib/types/payment/filters';
import type { PaymentFilterTab } from '@/lib/types/payment/tabs';
import type { PaymentListItem } from '@/lib/types/payment/views';

import { PaymentFilterBar } from './filters/payment-filter-bar';
import { usePaymentFilters } from './hooks/use-payment-filters';
import { PaymentsTable } from './payments-table';
import { paymentReadColumns } from './payments-table-columns';

interface PaymentsWorkspaceProps {
  activePayments: PaymentListResult<PaymentListItem>;
  activeTab: PaymentFilterTab;
  loadError: string | null;
  referenceData: PaymentReferenceData;
}

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
}: PaymentsWorkspaceProps) {
  const filtersController = usePaymentFilters();
  const columns = paymentReadColumns;
  const visibility = useColumnVisibility(columns);
  const isTableLoading = filtersController.isPending;

  return (
    <main className="grid gap-6">
      <PageHeader eyebrow="Bill Pay" title="Payments" />
      <SurfaceTabs
        actions={(
          <ColumnPicker
            columns={visibility.configurableColumns}
            hiddenIds={visibility.hiddenIds}
            onToggle={visibility.toggle}
          />
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

      <div>
        <PaymentsTable
          amountTotal={activePayments.amountTotal}
          columns={visibility.visibleColumns}
          currentPage={filtersController.pagination.page}
          emptyMessage={EMPTY_MESSAGE_BY_TAB[activeTab]}
          isLoading={isTableLoading}
          loadingMessage={LOADING_MESSAGE_BY_TAB[activeTab]}
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
    </main>
  );
}
