import {
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
} from 'drizzle-orm';

import { bills, payments, vendors } from '@/db/schema';
import type { PaymentFilters } from '@/lib/types/payment/filters';
import {
  PAYMENT_FILTER_FIELD_KEYS,
  type PaymentFilterFieldKey,
  type PaymentFilterValue,
} from '@/lib/validators/payment-filter-spec';

function buildSearchClause(term: string): SQL | undefined {
  const wildcard = `%${term}%`;
  return or(
    ilike(vendors.name, wildcard),
    ilike(bills.invoiceNumber, wildcard),
    ilike(bills.description, wildcard),
  );
}

type ClauseBuilder<K extends PaymentFilterFieldKey> = (
  value: PaymentFilterValue<K>,
) => SQL | undefined;

type ClauseBuilders = { [K in PaymentFilterFieldKey]: ClauseBuilder<K> };

const CLAUSE_BUILDERS: ClauseBuilders = {
  search: (v) => buildSearchClause(v),
  status: (v) => (v.length > 0 ? inArray(payments.status, [...v]) : undefined),
  paymentMethod: (v) => (v.length > 0 ? inArray(payments.paymentMethod, [...v]) : undefined),
  vendorId: (v) => eq(bills.vendorId, v),
  vendorOwnerId: (v) => eq(vendors.ownerId, v),
  billId: (v) => eq(payments.billId, v),
  amountMin: (v) => gte(payments.amount, v.toFixed(2)),
  amountMax: (v) => lte(payments.amount, v.toFixed(2)),
  scheduledDateFrom: (v) => gte(payments.scheduledDate, v),
  scheduledDateTo: (v) => lte(payments.scheduledDate, v),
  arrivalDateFrom: (v) => gte(payments.arrivalDate, v),
  arrivalDateTo: (v) => lte(payments.arrivalDate, v),
};

export function buildPaymentFilterClauses(filters: PaymentFilters): SQL[] {
  return PAYMENT_FILTER_FIELD_KEYS
    .map((key) => {
      const value = filters[key];
      if (value === undefined || value === null) return undefined;
      const builder = CLAUSE_BUILDERS[key] as ClauseBuilder<typeof key>;
      return builder(value);
    })
    .filter((clause): clause is SQL => clause !== undefined);
}
