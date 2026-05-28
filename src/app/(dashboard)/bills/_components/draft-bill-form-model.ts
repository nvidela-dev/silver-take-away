import type {
  CreateBillInput,
  DraftBillListItem,
} from '@/types';

export type DraftBillFormValues = CreateBillInput;

export const emptyDraftBillLineItem: DraftBillFormValues['lineItems'][number] = {
  description: '',
  amount: '0.00',
  categoryId: '',
};

export function createDefaultDraftBillFormValues(): DraftBillFormValues {
  return {
    vendorId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    amount: '0.00',
    currency: 'USD',
    description: '',
    invoiceUrl: '',
    lineItems: [{ ...emptyDraftBillLineItem }],
  };
}

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function normalizeDraftBillFormValues(
  values: DraftBillFormValues,
): CreateBillInput {
  return {
    vendorId: values.vendorId,
    invoiceNumber: normalizeOptional(values.invoiceNumber),
    invoiceDate: normalizeOptional(values.invoiceDate),
    dueDate: normalizeOptional(values.dueDate),
    amount: values.amount,
    currency: values.currency || 'USD',
    description: normalizeOptional(values.description),
    invoiceUrl: normalizeOptional(values.invoiceUrl),
    lineItems: values.lineItems.map((lineItem) => ({
      description: normalizeOptional(lineItem.description),
      amount: lineItem.amount,
      categoryId: normalizeOptional(lineItem.categoryId),
    })),
  };
}

export function draftBillToFormValues(bill: DraftBillListItem): DraftBillFormValues {
  const lineItems = bill.lineItems.length > 0
    ? bill.lineItems.map((lineItem) => ({
      description: lineItem.description ?? '',
      amount: lineItem.amount,
      categoryId: lineItem.categoryId ?? '',
    }))
    : [{ ...emptyDraftBillLineItem }];

  return {
    vendorId: bill.vendorId,
    invoiceNumber: bill.invoiceNumber ?? '',
    invoiceDate: bill.invoiceDate ?? '',
    dueDate: bill.dueDate ?? '',
    amount: bill.amount,
    currency: bill.currency,
    description: bill.description ?? '',
    invoiceUrl: bill.invoiceUrl ?? '',
    lineItems,
  };
}
