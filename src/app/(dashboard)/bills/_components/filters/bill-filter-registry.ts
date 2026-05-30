import type { BillFilterValues } from '../hooks/use-bill-filters';

export type BillFilterDimensionId = | 'search'
  | 'status'
  | 'vendor'
  | 'vendorOwner'
  | 'category'
  | 'amount'
  | 'invoiceDate'
  | 'dueDate';

export type BillFilterTab = 'drafts' | 'approvals' | 'payment';

export interface BillFilterDimension {
  id: BillFilterDimensionId;
  label: string;
  applicableTabs: readonly BillFilterTab[];
}

const ALL_LIST_TABS: readonly BillFilterTab[] = ['drafts', 'approvals', 'payment'];

export const BILL_FILTER_DIMENSIONS: readonly BillFilterDimension[] = [
  { id: 'search', label: 'Search', applicableTabs: ALL_LIST_TABS },
  { id: 'status', label: 'Status', applicableTabs: ['payment'] },
  { id: 'vendor', label: 'Vendor', applicableTabs: ALL_LIST_TABS },
  { id: 'vendorOwner', label: 'Vendor owner', applicableTabs: ALL_LIST_TABS },
  { id: 'category', label: 'Category', applicableTabs: ALL_LIST_TABS },
  { id: 'amount', label: 'Amount', applicableTabs: ALL_LIST_TABS },
  { id: 'invoiceDate', label: 'Invoice date', applicableTabs: ALL_LIST_TABS },
  { id: 'dueDate', label: 'Due date', applicableTabs: ALL_LIST_TABS },
];

export function isDimensionActive(
  dimension: BillFilterDimensionId,
  values: BillFilterValues,
): boolean {
  switch (dimension) {
    case 'search':
      return Boolean(values.search);
    case 'status':
      return Array.isArray(values.status) && values.status.length > 0;
    case 'vendor':
      return Boolean(values.vendorId);
    case 'vendorOwner':
      return Boolean(values.vendorOwnerId);
    case 'category':
      return Boolean(values.categoryId);
    case 'amount':
      return values.amountMin !== null || values.amountMax !== null;
    case 'invoiceDate':
      return Boolean(values.invoiceDateFrom) || Boolean(values.invoiceDateTo);
    case 'dueDate':
      return Boolean(values.dueDateFrom) || Boolean(values.dueDateTo);
    default:
      return false;
  }
}

export function clearDimension(
  dimension: BillFilterDimensionId,
): Partial<BillFilterValues> {
  switch (dimension) {
    case 'search':
      return { search: null };
    case 'status':
      return { status: null };
    case 'vendor':
      return { vendorId: null };
    case 'vendorOwner':
      return { vendorOwnerId: null };
    case 'category':
      return { categoryId: null };
    case 'amount':
      return { amountMin: null, amountMax: null };
    case 'invoiceDate':
      return { invoiceDateFrom: null, invoiceDateTo: null };
    case 'dueDate':
      return { dueDateFrom: null, dueDateTo: null };
    default:
      return {};
  }
}
