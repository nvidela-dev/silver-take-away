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

function buildSearchClause(term: string): SQL | undefined {
  const wildcard = `%${term}%`;
  return or(
    ilike(vendors.name, wildcard),
    ilike(bills.invoiceNumber, wildcard),
    ilike(bills.description, wildcard),
  );
}

export function buildPaymentFilterClauses(filters: PaymentFilters): SQL[] {
  return [
    filters.search ? buildSearchClause(filters.search) : undefined,
    filters.status && filters.status.length > 0
      ? inArray(payments.status, filters.status)
      : undefined,
    filters.paymentMethod && filters.paymentMethod.length > 0
      ? inArray(payments.paymentMethod, filters.paymentMethod)
      : undefined,
    filters.vendorId ? eq(bills.vendorId, filters.vendorId) : undefined,
    filters.vendorOwnerId ? eq(vendors.ownerId, filters.vendorOwnerId) : undefined,
    filters.billId ? eq(payments.billId, filters.billId) : undefined,
    filters.amountMin !== undefined
      ? gte(payments.amount, filters.amountMin.toFixed(2))
      : undefined,
    filters.amountMax !== undefined
      ? lte(payments.amount, filters.amountMax.toFixed(2))
      : undefined,
    filters.scheduledDateFrom ? gte(payments.scheduledDate, filters.scheduledDateFrom) : undefined,
    filters.scheduledDateTo ? lte(payments.scheduledDate, filters.scheduledDateTo) : undefined,
    filters.arrivalDateFrom ? gte(payments.arrivalDate, filters.arrivalDateFrom) : undefined,
    filters.arrivalDateTo ? lte(payments.arrivalDate, filters.arrivalDateTo) : undefined,
  ]
    .filter((clause): clause is SQL => clause !== undefined);
}
