import type { PaymentListItem } from '@/lib/types/payment/views';

import { buildCsv, type CsvColumn } from './csv';

const paymentCsvColumns: readonly CsvColumn<PaymentListItem>[] = [
  { sourceId: 'vendor', header: 'Vendor', value: (payment) => payment.vendor.name },
  { sourceId: 'vendor', header: 'Owner', value: (payment) => payment.creator.fullName },
  { sourceId: 'status', header: 'Status', value: (payment) => payment.status },
  { sourceId: 'amount', header: 'Amount', value: (payment) => payment.amount },
  { sourceId: 'amount', header: 'Currency', value: (payment) => payment.currency },
  { sourceId: 'paymentMethod', header: 'Method', value: (payment) => payment.paymentMethod },
  {
    sourceId: 'scheduledDate',
    header: 'Scheduled date',
    value: (payment) => payment.scheduledDate ?? '',
  },
  {
    sourceId: 'arrivalDate',
    header: 'Arrival date',
    value: (payment) => payment.arrivalDate ?? '',
  },
  {
    sourceId: 'invoiceNumber',
    header: 'Invoice #',
    value: (payment) => payment.bill.invoiceNumber ?? '',
  },
  {
    sourceId: 'createdAt',
    header: 'Created at',
    value: (payment) => payment.createdAt.toISOString(),
  },
];

export function buildPaymentsCsv(
  payments: readonly PaymentListItem[],
  selectedSourceIds: readonly string[],
): string {
  return buildCsv(payments, paymentCsvColumns, selectedSourceIds);
}
