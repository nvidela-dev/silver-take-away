import {
  and,
  desc,
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
import {
  billLineItems,
  bills,
  categories,
  users,
  vendors,
} from '@/db/schema';
import type { Bill } from '@/lib/types/bill/bill';
import type {
  BillFilterOptions,
  BillFilters,
  BillListQuery,
  BillListResult,
  BillPagination,
} from '@/lib/types/bill/filters';
import type { BillFormOptions, BillListItem } from '@/lib/types/bill/views';
import type { Category } from '@/lib/types/category';
import type { User } from '@/lib/types/user';
import type { Vendor } from '@/lib/types/vendor';

export async function getBillById(id: string): Promise<Bill | null> {
  const [bill] = await db.select().from(bills).where(eq(bills.id, id)).limit(1);
  return bill ?? null;
}

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

function buildBillFilterClauses(filters: BillFilters): (SQL | undefined)[] {
  return [
    filters.search ? buildSearchClause(filters.search) : undefined,
    filters.status?.length ? inArray(bills.status, filters.status) : undefined,
    filters.vendorId ? eq(bills.vendorId, filters.vendorId) : undefined,
    filters.vendorOwnerId ? eq(vendors.ownerId, filters.vendorOwnerId) : undefined,
    filters.amountMin !== undefined
      ? gte(bills.amount, filters.amountMin.toFixed(2)) : undefined,
    filters.amountMax !== undefined
      ? lte(bills.amount, filters.amountMax.toFixed(2)) : undefined,
    filters.invoiceDateFrom ? gte(bills.invoiceDate, filters.invoiceDateFrom) : undefined,
    filters.invoiceDateTo ? lte(bills.invoiceDate, filters.invoiceDateTo) : undefined,
    filters.dueDateFrom ? gte(bills.dueDate, filters.dueDateFrom) : undefined,
    filters.dueDateTo ? lte(bills.dueDate, filters.dueDateTo) : undefined,
    filters.categoryId ? buildCategoryClause(filters.categoryId) : undefined,
  ];
}

function buildBillWhereClauses(
  statuses: BillListQuery['statuses'],
  filters: BillFilters | undefined,
): SQL[] {
  const candidates: (SQL | undefined)[] = [
    statuses.length > 0 ? inArray(bills.status, statuses) : undefined,
    ...(filters ? buildBillFilterClauses(filters) : []),
  ];
  return candidates.filter((clause): clause is SQL => clause !== undefined);
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

export async function getBillFormOptions(): Promise<BillFormOptions> {
  const [vendorRows, categoryRows] = await Promise.all([
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
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .orderBy(categories.name),
  ]);

  return {
    vendors: vendorRows,
    categories: categoryRows,
  };
}

export async function getBillFilterOptions(): Promise<BillFilterOptions> {
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
