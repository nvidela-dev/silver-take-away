'use client';

import type { ReactNode } from 'react';

import { Card } from '@/app/_components/ui/card';
import { formatMoney } from '@/lib/utils';
import type { BillListItem } from '@/lib/types/bill/views';

export interface BillsTableColumn {
  id: string;
  header: string;
  headerClassName?: string;
  cellClassName?: string;
  srOnlyHeader?: boolean;
  isConfigurable?: boolean;
  render: (bill: BillListItem) => ReactNode;
}

interface BillsTableProps {
  bills: BillListItem[];
  columns: BillsTableColumn[];
  emptyMessage: string;
  isLoading?: boolean;
  loadingMessage?: string;
}

export function BillsTable({
  bills,
  columns,
  emptyMessage,
  isLoading = false,
  loadingMessage = 'Loading bills…',
}: BillsTableProps) {
  const total = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const currency = bills[0]?.currency ?? 'USD';
  const colSpan = columns.length;

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
                  {column.srOnlyHeader ? (
                    <span className="sr-only">{column.header}</span>
                  ) : (
                    column.header
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
            'flex justify-end border-t border-slate-200 px-4 py-3',
            'text-xs text-slate-500',
          ].join(' ')}
        >
          {bills.length}
          {' '}
          {bills.length === 1 ? 'bill' : 'bills'}
          {' · '}
          <span className="ml-1 font-medium text-slate-700">
            {formatMoney(total.toFixed(2), currency)}
            {' total'}
          </span>
        </div>
      ) : null}
    </Card>
  );
}
