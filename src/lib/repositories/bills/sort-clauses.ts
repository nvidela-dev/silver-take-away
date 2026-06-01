import {
  asc,
  desc,
  sql,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm';

import { bills, vendors } from '@/db/schema';
import type { BillSort, BillSortKey } from '@/lib/validators/bill-sort-spec';

// Bills do not store a payment date directly. We sort by the latest
// scheduled payment per bill via a correlated subquery so that bills with
// no payment yet are still represented (NULL sorts last in desc/first in
// asc on Postgres — see explicit NULLS handling below).
const paymentDateExpr = sql<string | null>`(
  select max(p.scheduled_date)
  from payments p
  where p.bill_id = ${bills.id}
)`;

const SORT_COLUMNS: Record<BillSortKey, SQLWrapper> = {
  vendor: vendors.name,
  status: bills.status,
  amount: bills.amount,
  invoiceNumber: bills.invoiceNumber,
  invoiceDate: bills.invoiceDate,
  dueDate: bills.dueDate,
  paymentDate: paymentDateExpr,
};

export function billSortColumn(key: BillSortKey): SQLWrapper {
  return SORT_COLUMNS[key];
}

export function buildBillOrderBy(sort: BillSort): SQL[] {
  const column = SORT_COLUMNS[sort.by];
  const primary = sort.dir === 'asc'
    ? sql`${asc(column)} nulls last`
    : sql`${desc(column)} nulls last`;
  // Stable tiebreaker so paginated results don't shuffle between pages.
  return [primary, desc(bills.createdAt), desc(bills.id)];
}
