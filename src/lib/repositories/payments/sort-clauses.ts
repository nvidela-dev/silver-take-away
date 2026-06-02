import {
  asc,
  desc,
  sql,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm';

import { payments, vendors } from '@/db/schema';
import type { PaymentSort, PaymentSortKey } from '@/lib/validators/payment-sort-spec';

const SORT_COLUMNS: Record<PaymentSortKey, SQLWrapper> = {
  vendor: vendors.name,
  status: payments.status,
  amount: payments.amount,
  paymentMethod: payments.paymentMethod,
  scheduledDate: payments.scheduledDate,
  arrivalDate: payments.arrivalDate,
  createdAt: payments.createdAt,
};

export function paymentSortColumn(key: PaymentSortKey): SQLWrapper {
  return SORT_COLUMNS[key];
}

export function buildPaymentOrderBy(sort: PaymentSort): SQL[] {
  const column = SORT_COLUMNS[sort.by];
  const primary = sort.dir === 'asc'
    ? sql`${asc(column)} nulls last`
    : sql`${desc(column)} nulls last`;
  // Stable tiebreaker so paginated results don't shuffle between pages.
  return [primary, desc(payments.createdAt), desc(payments.id)];
}
