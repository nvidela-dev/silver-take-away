import {
  and,
  eq,
  inArray,
  sql,
  type SQL,
} from 'drizzle-orm';

import { db } from '@/db';
import {
  billLineItems,
  bills,
  categories,
  users,
  vendors,
} from '@/db/schema';
import type { Bill } from '@/lib/types/bill/bill';
import type {
  BillListQuery,
  BillListResult,
  BillPagination,
  BillReferenceData,
  BillStatusAggregate,
} from '@/lib/types/bill/filters';
import type { BillStatus } from '@/lib/types/enums';
import type { BillListItem } from '@/lib/types/bill/views';
import type { Category } from '@/lib/types/category';
import type { User } from '@/lib/types/user';
import type { Vendor } from '@/lib/types/vendor';
import type { BillSort } from '@/lib/validators/bill-sort-spec';
import { billSortSpec } from '@/lib/validators/bill-sort-spec';

import { buildBillFilterClauses } from './filter-clauses';
import { buildBillOrderBy } from './sort-clauses';

const DEFAULT_BILL_SORT: BillSort = {
  by: billSortSpec.defaultKey,
  dir: billSortSpec.defaultDir,
};

export async function getBillById(id: string): Promise<Bill | null> {
  const [bill] = await db.select().from(bills).where(eq(bills.id, id)).limit(1);
  return bill ?? null;
}

function buildBillWhereClauses(
  statuses: BillListQuery['statuses'],
  filters: BillListQuery['filters'],
): SQL[] {
  const clauses: SQL[] = [];
  if (statuses.length > 0) {
    clauses.push(inArray(bills.status, [...statuses]));
  }
  if (filters) {
    clauses.push(...buildBillFilterClauses(filters));
  }
  return clauses;
}

interface BillRowSlice {
  bill: Bill;
  vendor: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>;
  creator: Pick<User, 'id' | 'email' | 'fullName' | 'role'>;
  lineItem: typeof billLineItems.$inferSelect | null;
  category: Category | null;
}

function groupBillRows(rows: BillRowSlice[]): BillListItem[] {
  const grouped = rows.reduce((acc, row) => {
    if (!acc.has(row.bill.id)) {
      acc.set(row.bill.id, {
        ...row.bill,
        vendor: row.vendor,
        creator: row.creator,
        lineItems: [],
        lineItemCount: 0,
      });
    }

    if (row.lineItem) {
      acc.get(row.bill.id)?.lineItems.push({
        ...row.lineItem,
        category: row.category,
      });
    }

    return acc;
  }, new Map<string, BillListItem>());

  return Array.from(grouped.values()).map((bill) => ({
    ...bill,
    lineItems: bill.lineItems.sort((a, b) => a.sortOrder - b.sortOrder),
    lineItemCount: bill.lineItems.length,
  }));
}

async function fetchBillIds(
  whereClauses: SQL[],
  pagination: BillPagination | undefined,
  sort: BillSort,
): Promise<{ amountTotal: string; ids: string[]; total: number }> {
  const conditions = whereClauses.length > 0 ? and(...whereClauses) : undefined;
  const orderBy = buildBillOrderBy(sort);

  // The inner joins to vendors/users are 1:1, so distinct is unnecessary
  // and would require all ORDER BY expressions to appear in the select
  // list under Postgres semantics. A plain select keeps the sort
  // expressions opaque to the planner.
  const idQuery = db
    .select({ id: bills.id })
    .from(bills)
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .innerJoin(users, eq(bills.createdBy, users.id))
    .where(conditions)
    .orderBy(...orderBy);

  const countQuery = db
    .select({
      amountTotal: sql<string>`coalesce(sum(${bills.amount}), 0)::text`,
      value: sql<number>`count(distinct ${bills.id})::int`,
    })
    .from(bills)
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .innerJoin(users, eq(bills.createdBy, users.id))
    .where(conditions);

  const [idRows, countRows] = await Promise.all([
    pagination
      ? idQuery.limit(pagination.pageSize).offset((pagination.page - 1) * pagination.pageSize)
      : idQuery,
    countQuery,
  ]);

  return {
    amountTotal: countRows[0]?.amountTotal ?? '0',
    ids: idRows.map((row) => row.id),
    total: countRows[0]?.value ?? 0,
  };
}

export async function listBills(
  query: BillListQuery,
): Promise<BillListResult<BillListItem>> {
  const whereClauses = buildBillWhereClauses(query.statuses, query.filters);
  const sort = query.sort ?? DEFAULT_BILL_SORT;
  const { amountTotal, ids, total } = await fetchBillIds(whereClauses, query.pagination, sort);

  if (ids.length === 0) {
    return { amountTotal, items: [], total };
  }

  const rows = await db
    .select({
      bill: bills,
      vendor: {
        id: vendors.id,
        name: vendors.name,
        email: vendors.email,
        ownerId: vendors.ownerId,
      },
      creator: {
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
      },
      lineItem: billLineItems,
      category: categories,
    })
    .from(bills)
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .innerJoin(users, eq(bills.createdBy, users.id))
    .leftJoin(billLineItems, eq(billLineItems.billId, bills.id))
    .leftJoin(categories, eq(categories.id, billLineItems.categoryId))
    .where(inArray(bills.id, ids));

  const orderIndex = new Map(ids.map((id, index) => [id, index]));
  const items = groupBillRows(rows).sort(
    (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
  );

  return { amountTotal, items, total };
}

export async function getBillReferenceData(): Promise<BillReferenceData> {
  const [vendorRows, ownerRows, categoryRows] = await Promise.all([
    db
      .select({
        id: vendors.id,
        name: vendors.name,
        email: vendors.email,
        ownerId: vendors.ownerId,
      })
      .from(vendors)
      .orderBy(vendors.name),
    db
      .selectDistinct({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      })
      .from(users)
      .innerJoin(vendors, eq(vendors.ownerId, users.id))
      .orderBy(users.fullName),
    db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .orderBy(categories.name),
  ]);

  return {
    vendors: vendorRows,
    owners: ownerRows,
    categories: categoryRows,
  };
}

export async function getBillStatusAggregates(
  statuses: readonly BillStatus[],
): Promise<BillStatusAggregate[]> {
  if (statuses.length === 0) {
    return [];
  }
  const rows = await db
    .select({
      status: bills.status,
      count: sql<number>`count(*)::int`,
      totalAmount: sql<string>`coalesce(sum(${bills.amount}), 0)::text`,
    })
    .from(bills)
    .where(inArray(bills.status, [...statuses]))
    .groupBy(bills.status);

  return rows;
}
