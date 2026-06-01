'use client';

import { useQueryStates } from 'nuqs';
import {
  useCallback,
  useMemo,
  useTransition,
} from 'react';

import {
  BILL_FILTER_FIELD_KEYS,
  BILL_PAGE_SIZE_OPTIONS,
  filterParsers,
  paginationParsers,
} from '@/lib/validators/bill-filter-spec';
import type { BillStatus } from '@/lib/types/enums';

export type BillFilterValues = {
  [K in keyof typeof filterParsers]: ReturnType<typeof filterParsers[K]['parseServerSide']>;
};

export interface BillFiltersController {
  values: BillFilterValues;
  status: BillStatus[] | null;
  pagination: { page: number; pageSize: number };
  pageSizeOptions: readonly number[];
  isPending: boolean;
  setValues: (updates: Partial<BillFilterValues>) => Promise<URLSearchParams>;
  clearAll: () => Promise<URLSearchParams>;
  setPage: (page: number) => Promise<URLSearchParams>;
  setPageSize: (pageSize: number) => Promise<URLSearchParams>;
}

const clearedFilters = Object.fromEntries(
  BILL_FILTER_FIELD_KEYS.map((key) => [key, null]),
) as Partial<BillFilterValues>;

export function useBillFilters(): BillFiltersController {
  const [isPending, startTransition] = useTransition();

  const queryOptions = useMemo(
    () => ({ shallow: false, history: 'push' as const, startTransition }),
    [startTransition],
  );

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
    isPending,
    setValues,
    clearAll,
    setPage,
    setPageSize,
  };
}
