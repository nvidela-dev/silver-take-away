'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { Card } from '@/app/_components/atoms/card';
import { formatMoney } from '@/lib/utils';
import type { BillListItem } from '@/lib/types/bill/views';

const PAGE_SIZE = 10;

export interface BillsTableColumn {
  id: string;
  header: string;
  headerClassName?: string;
  cellClassName?: string;
  srOnlyHeader?: boolean;
  isConfigurable?: boolean;
  renderHeader?: () => ReactNode;
  render: (bill: BillListItem) => ReactNode;
}

interface BillsTableProps {
  amountTotal?: string;
  bills: BillListItem[];
  columns: BillsTableColumn[];
  currentPage?: number;
  emptyMessage: string;
  isLoading?: boolean;
  loadingMessage?: string;
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
  totalBills = bills.length,
}: BillsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const total = amountTotal ?? bills.reduce((sum, bill) => sum + Number(bill.amount), 0).toFixed(2);
  const currency = bills[0]?.currency ?? 'USD';
  const colSpan = columns.length;
  const pageCount = Math.max(1, Math.ceil(totalBills / PAGE_SIZE));

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto" aria-busy={isLoading}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  className={column.headerClassName ?? 'py-3 pr-4 font-medium'}
                  key={column.id}
                >
                  {column.renderHeader ? column.renderHeader() : null}
                  {column.srOnlyHeader ? (
                    <span className="sr-only">{column.header}</span>
                  ) : (
                    !column.renderHeader && column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="py-8 text-center text-slate-600" colSpan={colSpan}>
                  {loadingMessage}
                </td>
              </tr>
            ) : null}
            {!isLoading && bills.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-slate-600" colSpan={colSpan}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? bills.map((bill) => (
                <tr
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  key={bill.id}
                >
                  {columns.map((column) => (
                    <td
                      className={column.cellClassName ?? 'py-3 pr-4'}
                      key={column.id}
                    >
                      {column.render(bill)}
                    </td>
                  ))}
                </tr>
              ))
              : null}
          </tbody>
        </table>
      </div>
      {!isLoading && bills.length > 0 ? (
        <div
          className={[
            'flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3',
            'text-xs text-slate-500',
          ].join(' ')}
        >
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
          <div className="flex items-center gap-3">
            <span>
              Page
              {' '}
              {currentPage}
              {' of '}
              {pageCount}
            </span>
            <div className="flex gap-2">
              <Button
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={currentPage === pageCount}
                onClick={() => goToPage(currentPage + 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
