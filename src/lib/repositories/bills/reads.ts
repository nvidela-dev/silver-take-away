import {
  and,
  desc,
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

import { buildBillFilterClauses } from './filter-clauses';

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
): Promise<{ ids: string[]; total: number }> {
  const conditions = whereClauses.length > 0 ? and(...whereClauses) : undefined;

  const idQuery = db
    .selectDistinct({
      id: bills.id,
      createdAt: bills.createdAt,
      updatedAt: bills.updatedAt,
    })
    .from(bills)
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .innerJoin(users, eq(bills.createdBy, users.id))
    .where(conditions)
    .orderBy(desc(bills.createdAt), desc(bills.updatedAt));

  const countQuery = db
    .select({ value: sql<number>`count(distinct ${bills.id})::int` })
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
    ids: idRows.map((row) => row.id),
    total: countRows[0]?.value ?? 0,
  };
}

export async function listBills(
  query: BillListQuery,
): Promise<BillListResult<BillListItem>> {
  const whereClauses = buildBillWhereClauses(query.statuses, query.filters);
  const { ids, total } = await fetchBillIds(whereClauses, query.pagination);

  if (ids.length === 0) {
    return { items: [], total };
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
    .where(inArray(bills.id, ids))
    .orderBy(desc(bills.createdAt), desc(bills.updatedAt));

  return { items: groupBillRows(rows), total };
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
