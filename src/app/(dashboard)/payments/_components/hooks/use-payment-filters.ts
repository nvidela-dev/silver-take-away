'use client';

import { useMemo } from 'react';

import { useDataTableQueryState } from '@/app/_components/hooks/use-data-table-query-state';
import {
  PAYMENT_FILTER_FIELD_KEYS,
  PAYMENT_PAGE_SIZE_OPTIONS,
  filterParsers,
  paginationParsers,
} from '@/lib/validators/payment-filter-spec';
import {
  paymentSortSpec,
  type PaymentSort,
  type PaymentSortKey,
} from '@/lib/validators/payment-sort-spec';
import type { PaymentMethodType, PaymentStatus } from '@/lib/types/enums';

export type PaymentFilterValues = {
  [K in keyof typeof filterParsers]: ReturnType<typeof filterParsers[K]['parseServerSide']>;
};

export interface PaymentFiltersController {
  values: PaymentFilterValues;
  status: PaymentStatus[] | null;
  paymentMethod: PaymentMethodType[] | null;
  pagination: { page: number; pageSize: number };
  pageSizeOptions: readonly number[];
  sort: PaymentSort;
  isPending: boolean;
  setValues: (updates: Partial<PaymentFilterValues>) => Promise<URLSearchParams>;
  clearAll: () => Promise<URLSearchParams>;
  setPage: (page: number) => Promise<URLSearchParams>;
  setPageSize: (pageSize: number) => Promise<URLSearchParams>;
  setSort: (sort: PaymentSort) => Promise<URLSearchParams>;
  toggleSort: (key: PaymentSortKey) => Promise<URLSearchParams>;
}

const clearedFilters = Object.fromEntries(
  PAYMENT_FILTER_FIELD_KEYS.map((key) => [key, null]),
) as Partial<PaymentFilterValues>;

const sortParsers = paymentSortSpec.parsers;

export function usePaymentFilters(): PaymentFiltersController {
  const tableState = useDataTableQueryState<
    typeof filterParsers,
    typeof paginationParsers,
    typeof sortParsers,
    PaymentSortKey
  >({
    clearedFilters,
    filterParsers,
    pageSizeOptions: PAYMENT_PAGE_SIZE_OPTIONS,
    paginationParsers,
    sortParsers,
  });

  const status = useMemo(
    () => (tableState.values.status ? (tableState.values.status as PaymentStatus[]) : null),
    [tableState.values.status],
  );

  const paymentMethod = useMemo(
    () => (tableState.values.paymentMethod
      ? (tableState.values.paymentMethod as PaymentMethodType[])
      : null),
    [tableState.values.paymentMethod],
  );

  return {
    ...tableState,
    status,
    paymentMethod,
  };
}
