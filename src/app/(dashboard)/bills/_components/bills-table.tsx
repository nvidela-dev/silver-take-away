'use client';

import { DataTable, type DataTableColumn } from '@/app/_components/molecules/data-table';
import { formatMoney } from '@/lib/utils';
import type { BillListItem } from '@/lib/types/bill/views';
import type { BillSort, BillSortKey } from '@/lib/validators/bill-sort-spec';

export type BillsTableColumn = DataTableColumn<BillListItem, BillSortKey>;

interface BillsTableProps {
  amountTotal?: string;
  bills: BillListItem[];
  columns: BillsTableColumn[];
  currentPage?: number;
  emptyMessage: string;
  isLoading?: boolean;
  loadingMessage?: string;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (key: BillSortKey) => void;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  sort?: BillSort;
  totalBills?: number;
}

export function BillsTable({
  amountTotal = undefined,
  bills,
  columns,
  currentPage = 1,
  emptyMessage,
  isLoading = false,
  loadingMessage = 'Loading bills…',
  onPageSizeChange = undefined,
  onSortChange = undefined,
  pageSize = 10,
  pageSizeOptions = [],
  sort = undefined,
  totalBills = bills.length,
}: BillsTableProps) {
  const total = amountTotal ?? bills.reduce((sum, bill) => sum + Number(bill.amount), 0).toFixed(2);
  const currency = bills[0]?.currency ?? 'USD';

  return (
    <DataTable
      columns={columns}
      currentPage={currentPage}
      emptyMessage={emptyMessage}
      footerSummary={(
        <span>
          {totalBills}
          {' '}
          {totalBills === 1 ? 'bill' : 'bills'}
          {' · '}
          <span className="font-medium text-slate-700">
            {formatMoney(total, currency)}
            {' total'}
          </span>
        </span>
      )}
      getRowKey={(bill) => bill.id}
      isLoading={isLoading}
      loadingLabel="Loading bill"
      loadingMessage={loadingMessage}
      onPageSizeChange={onPageSizeChange}
      onSortChange={onSortChange}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      rows={bills}
      sort={sort}
      totalRows={totalBills}
    />
  );
}
