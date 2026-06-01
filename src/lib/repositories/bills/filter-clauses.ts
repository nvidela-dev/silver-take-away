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
import {
  BILL_FILTER_FIELD_KEYS,
  type BillFilterFieldKey,
  type BillFilterValue,
} from '@/lib/validators/bill-filter-spec';

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

type ClauseBuilder<K extends BillFilterFieldKey> = (value: BillFilterValue<K>) => SQL | undefined;

type ClauseBuilders = { [K in BillFilterFieldKey]: ClauseBuilder<K> };

const CLAUSE_BUILDERS: ClauseBuilders = {
  search: (v) => buildSearchClause(v),
  status: (v) => (v.length > 0 ? inArray(bills.status, [...v]) : undefined),
  vendorId: (v) => eq(bills.vendorId, v),
  vendorOwnerId: (v) => eq(vendors.ownerId, v),
  categoryId: (v) => buildCategoryClause(v),
  amountMin: (v) => gte(bills.amount, v.toFixed(2)),
  amountMax: (v) => lte(bills.amount, v.toFixed(2)),
  invoiceDateFrom: (v) => gte(bills.invoiceDate, v),
  invoiceDateTo: (v) => lte(bills.invoiceDate, v),
  dueDateFrom: (v) => gte(bills.dueDate, v),
  dueDateTo: (v) => lte(bills.dueDate, v),
};

export function buildBillFilterClauses(filters: BillFilters): SQL[] {
  return BILL_FILTER_FIELD_KEYS
    .map((key) => {
      const value = filters[key];
      if (value === undefined || value === null) return undefined;
      const builder = CLAUSE_BUILDERS[key] as ClauseBuilder<typeof key>;
      return builder(value);
    })
    .filter((clause): clause is SQL => clause !== undefined);
}
