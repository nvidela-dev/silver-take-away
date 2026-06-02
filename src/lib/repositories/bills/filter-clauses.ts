import {
  and,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import { db } from '@/db';
import { billLineItems, bills, vendors } from '@/db/schema';
import type { BillFilters } from '@/lib/types/bill/filters';

function buildSearchClause(term: string): SQL | undefined {
  const wildcard = `%${term}%`;
  return or(
    ilike(vendors.name, wildcard),
    ilike(bills.invoiceNumber, wildcard),
    ilike(bills.description, wildcard),
  );
}

function buildCategoryClause(categoryId: string): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(billLineItems)
      .where(and(
        eq(billLineItems.billId, bills.id),
        eq(billLineItems.categoryId, categoryId),
      )),
  );
}

export function buildBillFilterClauses(filters: BillFilters): SQL[] {
  return [
    filters.search ? buildSearchClause(filters.search) : undefined,
    filters.status && filters.status.length > 0 ? inArray(bills.status, filters.status) : undefined,
    filters.vendorId ? eq(bills.vendorId, filters.vendorId) : undefined,
    filters.vendorOwnerId ? eq(vendors.ownerId, filters.vendorOwnerId) : undefined,
    filters.categoryId ? buildCategoryClause(filters.categoryId) : undefined,
    filters.amountMin !== undefined ? gte(bills.amount, filters.amountMin.toFixed(2)) : undefined,
    filters.amountMax !== undefined ? lte(bills.amount, filters.amountMax.toFixed(2)) : undefined,
    filters.invoiceDateFrom ? gte(bills.invoiceDate, filters.invoiceDateFrom) : undefined,
    filters.invoiceDateTo ? lte(bills.invoiceDate, filters.invoiceDateTo) : undefined,
    filters.dueDateFrom ? gte(bills.dueDate, filters.dueDateFrom) : undefined,
    filters.dueDateTo ? lte(bills.dueDate, filters.dueDateTo) : undefined,
  ]
    .filter((clause): clause is SQL => clause !== undefined);
}
