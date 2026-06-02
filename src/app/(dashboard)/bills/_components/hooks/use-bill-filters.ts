'use client';

import { useDataTableQueryState } from '@/app/_components/hooks/use-data-table-query-state';
import {
  BILL_PAGE_SIZE_OPTIONS,
  filterParsers,
  paginationParsers,
  type BillFilterQueryValues,
} from '@/lib/validators/bill-filter-spec';
import {
  billSortSpec,
  type BillSort,
  type BillSortKey,
} from '@/lib/validators/bill-sort-spec';

export type BillFilterValues = BillFilterQueryValues;

export interface BillFiltersController {
  values: BillFilterValues;
  status: BillFilterValues['status'];
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

const clearedFilters: Partial<BillFilterValues> = {
  search: null,
  status: null,
  vendorId: null,
  vendorOwnerId: null,
  categoryId: null,
  amountMin: null,
  amountMax: null,
  invoiceDateFrom: null,
  invoiceDateTo: null,
  dueDateFrom: null,
  dueDateTo: null,
};

const sortParsers = billSortSpec.parsers;

export function useBillFilters(): BillFiltersController {
  const tableState = useDataTableQueryState<
    typeof filterParsers,
    BillSortKey
  >({
    clearedFilters,
    filterParsers,
    pageSizeOptions: BILL_PAGE_SIZE_OPTIONS,
    paginationParsers,
    sortParsers,
  });

  return {
    ...tableState,
    status: tableState.values.status,
  };
}
