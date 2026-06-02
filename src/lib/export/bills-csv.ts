import type { BillListItem } from '@/lib/types/bill/views';

import { buildCsv, type CsvColumn } from './csv';

const billCsvColumns: readonly CsvColumn<BillListItem>[] = [
  { sourceId: 'vendor', header: 'Vendor', value: (bill) => bill.vendor.name },
  { sourceId: 'vendor', header: 'Owner', value: (bill) => bill.creator.fullName },
  { sourceId: 'vendor', header: 'Created at', value: (bill) => bill.createdAt.toISOString() },
  { sourceId: 'status', header: 'Status', value: (bill) => bill.status },
  { sourceId: 'amount', header: 'Amount', value: (bill) => bill.amount },
  { sourceId: 'amount', header: 'Currency', value: (bill) => bill.currency },
  { sourceId: 'invoiceDate', header: 'Invoice date', value: (bill) => bill.invoiceDate ?? '' },
  { sourceId: 'dueDate', header: 'Due date', value: (bill) => bill.dueDate ?? '' },
  { sourceId: 'invoiceNumber', header: 'Invoice #', value: (bill) => bill.invoiceNumber ?? '' },
  { sourceId: 'lines', header: 'Lines', value: (bill) => bill.lineItemCount },
];

export function buildBillsCsv(
  bills: readonly BillListItem[],
  selectedSourceIds: readonly string[],
): string {
  return buildCsv(bills, billCsvColumns, selectedSourceIds);
}

export function filterExportableBills(bills: readonly BillListItem[]): BillListItem[] {
  return bills.filter((bill) => bill.status !== 'draft' && bill.status !== 'archived');
}
