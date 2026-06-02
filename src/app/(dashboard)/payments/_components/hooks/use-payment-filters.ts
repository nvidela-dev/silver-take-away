'use client';

import { useDataTableQueryState } from '@/app/_components/hooks/use-data-table-query-state';
import {
  PAYMENT_PAGE_SIZE_OPTIONS,
  filterParsers,
  paginationParsers,
  type PaymentFilterQueryValues,
} from '@/lib/validators/payment-filter-spec';
import {
  paymentSortSpec,
  type PaymentSort,
  type PaymentSortKey,
} from '@/lib/validators/payment-sort-spec';

export type PaymentFilterValues = PaymentFilterQueryValues;

export interface PaymentFiltersController {
  values: PaymentFilterValues;
  status: PaymentFilterValues['status'];
  paymentMethod: PaymentFilterValues['paymentMethod'];
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

const clearedFilters: Partial<PaymentFilterValues> = {
  search: null,
  status: null,
  paymentMethod: null,
  vendorId: null,
  vendorOwnerId: null,
  billId: null,
  amountMin: null,
  amountMax: null,
  scheduledDateFrom: null,
  scheduledDateTo: null,
  arrivalDateFrom: null,
  arrivalDateTo: null,
};

const sortParsers = paymentSortSpec.parsers;

export function usePaymentFilters(): PaymentFiltersController {
  const tableState = useDataTableQueryState<
    typeof filterParsers,
    PaymentSortKey
  >({
    clearedFilters,
    filterParsers,
    pageSizeOptions: PAYMENT_PAGE_SIZE_OPTIONS,
    paginationParsers,
    sortParsers,
  });

  return {
    ...tableState,
    status: tableState.values.status,
    paymentMethod: tableState.values.paymentMethod,
  };
}
