'use client';

import { DataTable, type DataTableColumn } from '@/app/_components/molecules/data-table';
import { formatMoney } from '@/lib/utils';
import type { PaymentListItem } from '@/lib/types/payment/views';
import type { PaymentSort, PaymentSortKey } from '@/lib/validators/payment-sort-spec';

export type PaymentsTableColumn = DataTableColumn<PaymentListItem, PaymentSortKey>;

interface PaymentsTableProps {
  amountTotal?: string;
  columns: PaymentsTableColumn[];
  currentPage?: number;
  emptyMessage: string;
  isLoading?: boolean;
  loadingMessage?: string;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (key: PaymentSortKey) => void;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  payments: PaymentListItem[];
  sort?: PaymentSort;
  totalPayments?: number;
}

export function PaymentsTable({
  amountTotal = undefined,
  columns,
  currentPage = 1,
  emptyMessage,
  isLoading = false,
  loadingMessage = 'Loading payments…',
  onPageSizeChange = undefined,
  onSortChange = undefined,
  pageSize = 10,
  pageSizeOptions = [],
  payments,
  sort = undefined,
  totalPayments = payments.length,
}: PaymentsTableProps) {
  const total = amountTotal
    ?? payments.reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2);
  const currency = payments[0]?.currency ?? 'USD';

  return (
    <DataTable
      columns={columns}
      currentPage={currentPage}
      emptyMessage={emptyMessage}
      footerSummary={(
        <span>
          {totalPayments}
          {' '}
          {totalPayments === 1 ? 'payment' : 'payments'}
          {' · '}
          <span className="font-medium text-slate-700">
            {formatMoney(total, currency)}
            {' total'}
          </span>
        </span>
      )}
      getRowKey={(payment) => payment.id}
      isLoading={isLoading}
      loadingLabel="Loading payment"
      loadingMessage={loadingMessage}
      onPageSizeChange={onPageSizeChange}
      onSortChange={onSortChange}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      rows={payments}
      sort={sort}
      totalRows={totalPayments}
    />
  );
}
