'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  useTransition,
  type ReactNode,
} from 'react';

import { Button } from '@/app/_components/atoms/button';
import { Card } from '@/app/_components/atoms/card';
import { formatMoney } from '@/lib/utils';
import type { BillListItem } from '@/lib/types/bill/views';

const PAGE_SIZE = 10;
const SKELETON_ROW_COUNT = 10;

function BillsTableSkeletonRows({ columns }: { columns: BillsTableColumn[] }) {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
    <tr className="h-14 border-b border-slate-100 last:border-0" key={index}>
      {columns.map((column) => (
        <td
          aria-label="Loading bill"
          className={column.cellClassName ?? 'py-3 pr-4'}
          key={column.id}
        >
          <div
            className={[
              'animate-pulse rounded bg-slate-100',
              column.id === 'vendor' ? 'h-8' : 'h-5',
            ].join(' ')}
          />
        </td>
      ))}
    </tr>
  ));
}

function BillsTableFillerRows({ count, colSpan }: { count: number; colSpan: number }) {
  return Array.from({ length: count }, (_, index) => (
    <tr aria-hidden className="h-14 border-b border-slate-100 last:border-0" key={index}>
      <td aria-label="Reserved bill row" colSpan={colSpan} />
    </tr>
  ));
}

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
  const [isNavigating, startNavigation] = useTransition();
  const total = amountTotal ?? bills.reduce((sum, bill) => sum + Number(bill.amount), 0).toFixed(2);
  const currency = bills[0]?.currency ?? 'USD';
  const colSpan = columns.length;
  const pageCount = Math.max(1, Math.ceil(totalBills / PAGE_SIZE));
  const showSkeleton = isLoading || isNavigating;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    startNavigation(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto" aria-busy={showSkeleton}>
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
            {showSkeleton ? (
              <>
                <tr className="sr-only">
                  <td colSpan={colSpan}>{loadingMessage}</td>
                </tr>
                <BillsTableSkeletonRows columns={columns} />
              </>
            ) : null}
            {!showSkeleton && bills.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-slate-600" colSpan={colSpan}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {!showSkeleton
              ? bills.map((bill) => (
                <tr
                  className={[
                    'h-14 border-b border-slate-100 last:border-0 hover:bg-slate-50',
                    'animate-[bills-row-fade-in_180ms_ease-out]',
                  ].join(' ')}
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
            {!showSkeleton && bills.length > 0 && bills.length < PAGE_SIZE ? (
              <BillsTableFillerRows count={PAGE_SIZE - bills.length} colSpan={colSpan} />
            ) : null}
          </tbody>
        </table>
      </div>
      {totalBills > 0 ? (
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
                disabled={showSkeleton || currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={showSkeleton || currentPage === pageCount}
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
