import {
  and,
  eq,
  inArray,
  sql,
  type SQL,
} from 'drizzle-orm';

import { db } from '@/db';
import {
  bills,
  categories,
  payments,
  users,
  vendors,
} from '@/db/schema';
import type { Payment } from '@/lib/types/payment/payment';
import type {
  PaymentListQuery,
  PaymentListResult,
  PaymentPagination,
  PaymentReferenceData,
  PaymentStatusAggregate,
} from '@/lib/types/payment/filters';
import type { PaymentStatus } from '@/lib/types/enums';
import type { PaymentListItem } from '@/lib/types/payment/views';
import type { PaymentSort } from '@/lib/validators/payment-sort-spec';
import { paymentSortSpec } from '@/lib/validators/payment-sort-spec';

import { buildPaymentFilterClauses } from './filter-clauses';
import { buildPaymentOrderBy } from './sort-clauses';

const DEFAULT_PAYMENT_SORT: PaymentSort = {
  by: paymentSortSpec.defaultKey,
  dir: paymentSortSpec.defaultDir,
};

export async function getPaymentById(id: string): Promise<Payment | null> {
  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return payment ?? null;
}

function buildPaymentWhereClauses(
  statuses: PaymentListQuery['statuses'],
  filters: PaymentListQuery['filters'],
): SQL[] {
  const clauses: SQL[] = [];
  if (statuses.length > 0) {
    clauses.push(inArray(payments.status, [...statuses]));
  }
  if (filters) {
    clauses.push(...buildPaymentFilterClauses(filters));
  }
  return clauses;
}

async function fetchPaymentIds(
  whereClauses: SQL[],
  pagination: PaymentPagination | undefined,
  sort: PaymentSort,
): Promise<{ amountTotal: string; ids: string[]; total: number }> {
  const conditions = whereClauses.length > 0 ? and(...whereClauses) : undefined;
  const orderBy = buildPaymentOrderBy(sort);

  const idQuery = db
    .select({ id: payments.id })
    .from(payments)
    .innerJoin(bills, eq(payments.billId, bills.id))
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .innerJoin(users, eq(payments.createdBy, users.id))
    .where(conditions)
    .orderBy(...orderBy);

  const countQuery = db
    .select({
      amountTotal: sql<string>`coalesce(sum(${payments.amount}), 0)::text`,
      value: sql<number>`count(distinct ${payments.id})::int`,
    })
    .from(payments)
    .innerJoin(bills, eq(payments.billId, bills.id))
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .innerJoin(users, eq(payments.createdBy, users.id))
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

export async function listPayments(
  query: PaymentListQuery,
): Promise<PaymentListResult<PaymentListItem>> {
  const whereClauses = buildPaymentWhereClauses(query.statuses, query.filters);
  const sort = query.sort ?? DEFAULT_PAYMENT_SORT;
  const { amountTotal, ids, total } = await fetchPaymentIds(whereClauses, query.pagination, sort);

  if (ids.length === 0) {
    return { amountTotal, items: [], total };
  }

  const rows = await db
    .select({
      payment: payments,
      bill: {
        id: bills.id,
        invoiceNumber: bills.invoiceNumber,
        invoiceDate: bills.invoiceDate,
        dueDate: bills.dueDate,
        description: bills.description,
      },
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
    })
    .from(payments)
    .innerJoin(bills, eq(payments.billId, bills.id))
    .innerJoin(vendors, eq(bills.vendorId, vendors.id))
    .innerJoin(users, eq(payments.createdBy, users.id))
    .where(inArray(payments.id, ids));

  const orderIndex = new Map(ids.map((id, index) => [id, index]));
  const items: PaymentListItem[] = rows
    .map((row) => ({
      ...row.payment,
      bill: row.bill,
      vendor: row.vendor,
      creator: row.creator,
    }))
    .sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));

  return { amountTotal, items, total };
}

export async function getPaymentReferenceData(): Promise<PaymentReferenceData> {
  // Payments expose vendor / owner / category filters that mirror the
  // Bills filter bar. Vendor and owner come from the vendors table; the
  // categories list is included for symmetry even though payments do not
  // currently filter by category — it keeps the reference shape identical
  // to the bills one, which lets shared filter editors stay generic.
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

export async function getPaymentStatusAggregates(
  statuses: readonly PaymentStatus[],
): Promise<PaymentStatusAggregate[]> {
  if (statuses.length === 0) {
    return [];
  }
  const rows = await db
    .select({
      status: payments.status,
      count: sql<number>`count(*)::int`,
      totalAmount: sql<string>`coalesce(sum(${payments.amount}), 0)::text`,
    })
    .from(payments)
    .where(inArray(payments.status, [...statuses]))
    .groupBy(payments.status);

  return rows;
}
