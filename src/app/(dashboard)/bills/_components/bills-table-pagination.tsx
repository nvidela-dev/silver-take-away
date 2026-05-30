'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/app/_components/ui/button';

interface BillsTablePaginationProps {
  page: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function BillsTablePagination({
  page,
  pageSize,
  pageSizeOptions,
  total,
  onPageChange,
  onPageSizeChange,
}: BillsTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const firstIndex = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastIndex = Math.min(total, safePage * pageSize);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  return (
    <div
      className={[
        'flex flex-wrap items-center justify-between gap-3 px-1 py-2',
        'text-xs text-slate-600',
      ].join(' ')}
    >
      <div>
        {total === 0 ? (
          <span>No bills match this view.</span>
        ) : (
          <span>
            Showing
            {' '}
            <span className="font-medium text-slate-900">{firstIndex}</span>
            –
            <span className="font-medium text-slate-900">{lastIndex}</span>
            {' of '}
            <span className="font-medium text-slate-900">{total}</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2" htmlFor="bill-page-size">
          <span>Per page</span>
          <select
            className={[
              'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs',
              'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300',
            ].join(' ')}
            id="bill-page-size"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous page"
            disabled={!canPrev}
            onClick={() => onPageChange(safePage - 1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </Button>
          <span className="px-2 tabular-nums">
            {safePage}
            {' / '}
            {totalPages}
          </span>
          <Button
            aria-label="Next page"
            disabled={!canNext}
            onClick={() => onPageChange(safePage + 1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronRight aria-hidden className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
