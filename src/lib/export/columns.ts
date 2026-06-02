export const BILL_EXPORT_COLUMN_IDS = [
  'vendor',
  'status',
  'amount',
  'invoiceDate',
  'dueDate',
  'invoiceNumber',
  'lines',
] as const;

export const PAYMENT_EXPORT_COLUMN_IDS = [
  'vendor',
  'status',
  'amount',
  'paymentMethod',
  'scheduledDate',
  'arrivalDate',
  'invoiceNumber',
  'createdAt',
] as const;
