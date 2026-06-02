import { createSortSpec, type SortValue } from './sort-spec';

export const BILL_SORT_KEYS = [
  'vendor',
  'status',
  'amount',
  'invoiceNumber',
  'invoiceDate',
  'dueDate',
  'paymentDate',
] as const;

export type BillSortKey = (typeof BILL_SORT_KEYS)[number];
export type BillSort = SortValue<BillSortKey>;

export function isBillSortKey(value: string): value is BillSortKey {
  return BILL_SORT_KEYS.some((key) => key === value);
}

export const billSortSpec = createSortSpec<BillSortKey>({
  allowedKeys: BILL_SORT_KEYS,
  defaultKey: 'invoiceDate',
  defaultDir: 'desc',
});
