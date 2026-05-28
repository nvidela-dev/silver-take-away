import {
  desc,
  eq,
} from 'drizzle-orm';

import { db } from '@/db';
import {
  billLineItems,
  bills,
  categories,
  users,
  vendors,
} from '@/db/schema';
import type {
  Bill,
  BillFormOptions,
  DraftBillListItem,
} from '@/types';

export async function getBillById(id: string): Promise<Bill | null> {
  const [bill] = await db.select().from(bills).where(eq(bills.id, id)).limit(1);
  return bill ?? null;
}

export async function listDraftBills(): Promise<DraftBillListItem[]> {
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
    .where(eq(bills.status, 'draft'))
    .orderBy(desc(bills.createdAt), desc(bills.updatedAt));

  const draftBills = rows.reduce((acc, row) => {
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
  }, new Map<string, DraftBillListItem>());

  return Array.from(draftBills.values()).map((bill) => ({
    ...bill,
    lineItems: bill.lineItems.sort((a, b) => a.sortOrder - b.sortOrder),
    lineItemCount: bill.lineItems.length,
  }));
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
