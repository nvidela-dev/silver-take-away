'use client';

import { useMemo } from 'react';

import { useDataTableQueryState } from '@/app/_components/hooks/use-data-table-query-state';
import {
  BILL_FILTER_FIELD_KEYS,
  BILL_PAGE_SIZE_OPTIONS,
  filterParsers,
  paginationParsers,
} from '@/lib/validators/bill-filter-spec';
import {
  billSortSpec,
  type BillSort,
  type BillSortKey,
} from '@/lib/validators/bill-sort-spec';
import type { BillStatus } from '@/lib/types/enums';

export type BillFilterValues = {
  [K in keyof typeof filterParsers]: ReturnType<typeof filterParsers[K]['parseServerSide']>;
};

export interface BillFiltersController {
  values: BillFilterValues;
  status: BillStatus[] | null;
  pagination: { page: number; pageSize: number };
  pageSizeOptions: readonly number[];
  sort: BillSort;
  isPending: boolean;
  setValues: (updates: Partial<BillFilterValues>) => Promise<URLSearchParams>;
  clearAll: () => Promise<URLSearchParams>;
  setPage: (page: number) => Promise<URLSearchParams>;
  setPageSize: (pageSize: number) => Promise<URLSearchParams>;
  setSort: (sort: BillSort) => Promise<URLSearchParams>;
  toggleSort: (key: BillSortKey) => Promise<URLSearchParams>;
}

const clearedFilters = Object.fromEntries(
  BILL_FILTER_FIELD_KEYS.map((key) => [key, null]),
) as Partial<BillFilterValues>;

const sortParsers = billSortSpec.parsers;

export function useBillFilters(): BillFiltersController {
  const tableState = useDataTableQueryState<
    typeof filterParsers,
    typeof paginationParsers,
    typeof sortParsers,
    BillSortKey
  >({
    clearedFilters,
    filterParsers,
    pageSizeOptions: BILL_PAGE_SIZE_OPTIONS,
    paginationParsers,
    sortParsers,
  });

  const status = useMemo(
    () => (tableState.values.status ? (tableState.values.status as BillStatus[]) : null),
    [tableState.values.status],
  );

  return {
    ...tableState,
    status,
  };
}
