'use client';

import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useCallback, useMemo } from 'react';

import { BILL_PAGE_SIZE_OPTIONS, DEFAULT_BILL_PAGE_SIZE } from '@/lib/validators/bill.schemas';
import type { BillStatus } from '@/lib/types/enums';

const filterParsers = {
  search: parseAsString,
  status: parseAsArrayOf(parseAsString),
  vendorId: parseAsString,
  vendorOwnerId: parseAsString,
  categoryId: parseAsString,
  amountMin: parseAsFloat,
  amountMax: parseAsFloat,
  invoiceDateFrom: parseAsString,
  invoiceDateTo: parseAsString,
  dueDateFrom: parseAsString,
  dueDateTo: parseAsString,
};

const paginationParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(DEFAULT_BILL_PAGE_SIZE),
};

const queryOptions = { shallow: false, history: 'push' } as const;

export type BillFilterValues = {
  [K in keyof typeof filterParsers]: ReturnType<typeof filterParsers[K]['parseServerSide']>;
};

export interface BillFiltersController {
  values: BillFilterValues;
  status: BillStatus[] | null;
  pagination: { page: number; pageSize: number };
  pageSizeOptions: readonly number[];
  setValues: (updates: Partial<BillFilterValues>) => Promise<URLSearchParams>;
  clearAll: () => Promise<URLSearchParams>;
  setPage: (page: number) => Promise<URLSearchParams>;
  setPageSize: (pageSize: number) => Promise<URLSearchParams>;
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

export function useBillFilters(): BillFiltersController {
  const [values, setValuesRaw] = useQueryStates(filterParsers, queryOptions);
  const [pagination, setPaginationRaw] = useQueryStates(paginationParsers, queryOptions);

  const setValues = useCallback(
    (updates: Partial<BillFilterValues>) => {
      void setPaginationRaw({ page: 1 });
      return setValuesRaw(updates);
    },
    [setPaginationRaw, setValuesRaw],
  );

  const clearAll = useCallback(() => {
    void setPaginationRaw({ page: 1 });
    return setValuesRaw(clearedFilters);
  }, [setPaginationRaw, setValuesRaw]);

  const setPage = useCallback(
    (page: number) => setPaginationRaw({ page }),
    [setPaginationRaw],
  );

  const setPageSize = useCallback(
    (pageSize: number) => setPaginationRaw({ pageSize, page: 1 }),
    [setPaginationRaw],
  );

  const status = useMemo(
    () => (values.status ? (values.status as BillStatus[]) : null),
    [values.status],
  );

  return {
    values,
    status,
    pagination,
    pageSizeOptions: BILL_PAGE_SIZE_OPTIONS,
    setValues,
    clearAll,
    setPage,
    setPageSize,
  };
}
