import { createSortSpec, type SortValue } from './sort-spec';

export const PAYMENT_SORT_KEYS = [
  'vendor',
  'status',
  'amount',
  'paymentMethod',
  'scheduledDate',
  'arrivalDate',
  'createdAt',
] as const;

export type PaymentSortKey = (typeof PAYMENT_SORT_KEYS)[number];
export type PaymentSort = SortValue<PaymentSortKey>;

export const paymentSortSpec = createSortSpec<PaymentSortKey>({
  allowedKeys: PAYMENT_SORT_KEYS,
  defaultKey: 'scheduledDate',
  defaultDir: 'desc',
});
