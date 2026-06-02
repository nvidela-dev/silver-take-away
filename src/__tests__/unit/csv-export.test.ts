import Papa from 'papaparse';

import {
  buildBillsCsv,
  filterExportableBills,
} from '@/lib/export/bills-csv';
import { buildPaymentsCsv } from '@/lib/export/payments-csv';
import type { BillListItem } from '@/lib/types/bill/views';
import type { PaymentListItem } from '@/lib/types/payment/views';

const bill: BillListItem = {
  id: 'bill-1',
  vendorId: 'vendor-1',
  createdBy: 'user-1',
  status: 'paid',
  invoiceNumber: '=SUM(A1:A2)',
  invoiceDate: '2026-06-01',
  dueDate: '2026-06-30',
  amount: '100.00',
  currency: 'USD',
  description: null,
  invoiceUrl: null,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
  vendor: {
    id: 'vendor-1',
    name: 'Vendor',
    email: 'vendor@example.com',
    ownerId: 'user-1',
  },
  creator: {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'User',
    role: 'admin',
  },
  lineItems: [],
  lineItemCount: 0,
};

const payment: PaymentListItem = {
  id: 'payment-1',
  billId: bill.id,
  createdBy: bill.createdBy,
  amount: bill.amount,
  currency: bill.currency,
  paymentMethod: 'ach',
  status: 'paid',
  scheduledDate: '2026-06-10',
  initiatedDate: null,
  arrivalDate: '2026-06-12',
  cancelledAt: null,
  failureReason: null,
  createdAt: bill.createdAt,
  updatedAt: bill.updatedAt,
  bill: {
    id: bill.id,
    invoiceNumber: bill.invoiceNumber,
    invoiceDate: bill.invoiceDate,
    dueDate: bill.dueDate,
    description: bill.description,
  },
  vendor: bill.vendor,
  creator: bill.creator,
};

describe('CSV exports', () => {
  it('exports selected bill columns and escapes spreadsheet formulae', () => {
    const csv = buildBillsCsv([bill], ['vendor', 'invoiceNumber']);
    const result = Papa.parse<Record<string, string>>(csv, { header: true });

    expect(result.meta.fields).toEqual(['Vendor', 'Owner', 'Created at', 'Invoice #']);
    expect(result.data[0]).toMatchObject({
      Vendor: 'Vendor',
      Owner: 'User',
      'Invoice #': "'=SUM(A1:A2)",
    });
  });

  it('removes draft and archived bills from export rows', () => {
    expect(filterExportableBills([
      bill,
      { ...bill, id: 'draft', status: 'draft' },
      { ...bill, id: 'archived', status: 'archived' },
    ])).toEqual([bill]);
  });

  it('exports selected payment columns', () => {
    const csv = buildPaymentsCsv([payment], ['amount', 'paymentMethod']);
    const result = Papa.parse<Record<string, string>>(csv, { header: true });

    expect(result.meta.fields).toEqual(['Amount', 'Currency', 'Method']);
    expect(result.data[0]).toMatchObject({
      Amount: '100.00',
      Currency: 'USD',
      Method: 'ach',
    });
  });
});
