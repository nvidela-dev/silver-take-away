import type { CreateBillInput, UpdateBillInput } from '@/types';

import { createUuid } from '@/lib/id';

type LineItemInput = CreateBillInput['lineItems'][number]
  | NonNullable<UpdateBillInput['lineItems']>[number];

export interface BillLineItemInsertRecord {
  id: string;
  billId: string;
  description?: string;
  amount: string;
  categoryId?: string;
  sortOrder: number;
}

export function toBillLineItemInsertRecords(
  billId: string,
  lineItems: readonly LineItemInput[],
  ids: readonly string[],
): BillLineItemInsertRecord[] {
  return lineItems.map((lineItem, index) => ({
    id: ids[index] ?? createUuid(),
    billId,
    description: lineItem.description,
    amount: lineItem.amount,
    categoryId: lineItem.categoryId,
    sortOrder: index,
  }));
}
