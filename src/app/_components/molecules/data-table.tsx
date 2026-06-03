'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useId,
  useTransition,
  type ReactNode,
} from 'react';

import { Button } from '@/app/_components/atoms/button';
import { Card } from '@/app/_components/atoms/card';
import { Select } from '@/app/_components/atoms/select';
import type { SortValue } from '@/lib/validators/sort-spec';

export interface DataTableColumn<TRow, TSortKey extends string = string> {
  cellClassName?: string;
  header: string;
  headerClassName?: string;
  id: string;
  isConfigurable?: boolean;
  render: (row: TRow) => ReactNode;
  renderHeader?: () => ReactNode;
  skeletonClassName?: string;
  sortKey?: TSortKey;
  srOnlyHeader?: boolean;
}

interface DataTableProps<TRow, TSortKey extends string> {
  columns: DataTableColumn<TRow, TSortKey>[];
  currentPage?: number;
  emptyMessage: string;
  footerSummary?: ReactNode;
  getRowKey: (row: TRow) => string;
  isLoading?: boolean;
  loadingLabel?: string;
  loadingMessage?: string;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (key: TSortKey) => void;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  rows: TRow[];
  sort?: SortValue<TSortKey>;
  totalRows?: number;
}

function DataTableSkeletonRows<TRow, TSortKey extends string>({
  columns,
  count,
  loadingLabel,
}: {
  columns: DataTableColumn<TRow, TSortKey>[];
  count: number;
  loadingLabel: string;
}): React.ReactElement[] {
  return Array.from({ length: count }, (_, index) => (
    <tr className="h-14 border-b border-slate-100 last:border-0" key={index}>
      {columns.map((column) => (
        <td
          aria-label={loadingLabel}
          className={[
            'h-14',
            column.cellClassName ?? 'py-3 pr-4',
          ].join(' ')}
          key={column.id}
        >
          <div
            className={[
              'h-5 animate-pulse rounded bg-slate-100',
              column.skeletonClassName ?? '',
            ].join(' ')}
          />
        </td>
      ))}
    </tr>
  ));
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: 'asc' | 'desc';
}): React.ReactElement {
  if (!active) return <ArrowUpDown aria-hidden className="size-3.5 opacity-40" />;
  return direction === 'asc'
    ? <ArrowUp aria-hidden className="size-3.5" />
    : <ArrowDown aria-hidden className="size-3.5" />;
}

function SortableHeader<TRow, TSortKey extends string>({
  column,
  direction,
  isActive,
  onSort,
}: {
  column: DataTableColumn<TRow, TSortKey>;
  direction: 'asc' | 'desc';
  isActive: boolean;
  onSort: (key: TSortKey) => void;
}): string | React.ReactElement {
  if (!column.sortKey) return column.header;
  const { sortKey } = column;
  const nextDir = isActive && direction === 'desc' ? 'asc' : 'desc';
  const isRightAligned = (column.headerClassName ?? '').includes('text-right');

  return (
    <button
      aria-label={`Sort by ${column.header} ${nextDir}ending`}
      className={[
        'inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700',
        isRightAligned ? 'w-full justify-end' : '',
      ].join(' ').trim()}
      onClick={() => onSort(sortKey)}
      type="button"
    >
      <span>{column.header}</span>
      <SortIndicator active={isActive} direction={direction} />
    </button>
  );
}

function resolveAriaSort(
  active: boolean,
  direction: 'asc' | 'desc' | undefined,
): 'ascending' | 'descending' | undefined {
  if (!active) return undefined;
  return direction === 'asc' ? 'ascending' : 'descending';
}

function DataTableHeaderCell<TRow, TSortKey extends string>({
  column,
  onSortChange = undefined,
  sort = undefined,
}: {
  column: DataTableColumn<TRow, TSortKey>;
  onSortChange?: (key: TSortKey) => void;
  sort?: SortValue<TSortKey>;
}): React.ReactElement {
  const isSortable = Boolean(column.sortKey && onSortChange);
  const isActive = isSortable && sort?.by === column.sortKey;
  const ariaSort = resolveAriaSort(isActive, sort?.dir);

  let content: ReactNode;
  if (column.renderHeader) content = column.renderHeader();
  else if (column.srOnlyHeader) content = <span className="sr-only">{column.header}</span>;
  else if (isSortable && onSortChange) {
    content = (
      <SortableHeader
        column={column}
        direction={sort?.dir ?? 'desc'}
        isActive={isActive}
        onSort={onSortChange}
      />
    );
  } else content = column.header;

  return (
    <th
      aria-sort={ariaSort}
      className={column.headerClassName ?? 'py-3 pr-4 font-medium'}
    >
      {content}
    </th>
  );
}

export function DataTable<TRow, TSortKey extends string>({
  columns,
  currentPage = 1,
  emptyMessage,
  footerSummary = null,
  getRowKey,
  isLoading = false,
  loadingLabel = 'Loading row',
  loadingMessage = 'Loading rows…',
  onPageSizeChange = undefined,
  onSortChange = undefined,
  pageSize = 10,
  pageSizeOptions = [],
  rows,
  sort = undefined,
  totalRows = rows.length,
}: DataTableProps<TRow, TSortKey>): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageSizeId = useId();
  const [isNavigating, startNavigation] = useTransition();
  const colSpan = columns.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const showSkeleton = isLoading || isNavigating;

  const goToPage = (page: number): void => {
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
                <DataTableHeaderCell
                  column={column}
                  key={column.id}
                  onSortChange={onSortChange}
                  sort={sort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {showSkeleton ? (
              <>
                <tr className="sr-only">
                  <td colSpan={colSpan}>{loadingMessage}</td>
                </tr>
                <DataTableSkeletonRows
                  columns={columns}
                  count={pageSize}
                  loadingLabel={loadingLabel}
                />
              </>
            ) : null}
            {!showSkeleton && rows.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-slate-600" colSpan={colSpan}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {!showSkeleton
              ? rows.map((row) => (
                <tr
                  className={[
                    'h-14 border-b border-slate-100 last:border-0 hover:bg-slate-50',
                    'animate-[table-row-fade-in_180ms_ease-out]',
                  ].join(' ')}
                  key={getRowKey(row)}
                >
                  {columns.map((column) => (
                    <td
                      className={column.cellClassName ?? 'py-3 pr-4'}
                      key={column.id}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              )) : null}
          </tbody>
        </table>
      </div>
      {totalRows > 0 ? (
        <div
          className={[
            'flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3',
            'text-xs text-slate-500',
          ].join(' ')}
        >
          <div>{footerSummary}</div>
          <div className="flex items-center gap-3">
            {onPageSizeChange && pageSizeOptions.length > 0 ? (
              <label className="flex items-center gap-2" htmlFor={pageSizeId}>
                <span>Per page</span>
                <Select
                  className="w-auto px-2 text-xs"
                  controlSize="sm"
                  disabled={showSkeleton}
                  id={pageSizeId}
                  onChange={(event) => onPageSizeChange(Number(event.target.value))}
                  value={pageSize}
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </label>
            ) : null}
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
