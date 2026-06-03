import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';

import { BillDetailDialog } from '@/app/(dashboard)/bills/_components/bill-detail-dialog';
import { BillsStatusOverview } from '@/app/(dashboard)/bills/_components/bills-status-overview';
import { billDetailsColumn } from '@/app/(dashboard)/bills/_components/bills-table-columns';
import { PaymentDetailDialog } from '@/app/(dashboard)/payments/_components/payment-detail-dialog';
import {
  paymentDetailsColumn,
} from '@/app/(dashboard)/payments/_components/payments-table-columns';
import type { BillListItem } from '@/lib/types/bill/views';
import type { PaymentListItem } from '@/lib/types/payment/views';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('tab=overview'),
}));

const bill: BillListItem = {
  id: 'bill-1',
  vendorId: 'vendor-1',
  createdBy: 'user-1',
  status: 'awaiting_approval',
  invoiceNumber: 'INV-1001',
  invoiceDate: '2026-06-01',
  dueDate: '2026-06-30',
  amount: '1250.00',
  currency: 'USD',
  description: 'Monthly operating supplies.',
  invoiceUrl: 'https://example.com/invoices/INV-1001',
  createdAt: new Date('2026-06-01T12:00:00Z'),
  updatedAt: new Date('2026-06-02T12:00:00Z'),
  vendor: {
    id: 'vendor-1',
    name: 'Acme Supplies',
    email: 'billing@acme.example',
    ownerId: 'user-1',
  },
  creator: {
    id: 'user-1',
    email: 'owner@example.com',
    fullName: 'Alex Owner',
    role: 'owner',
  },
  lineItems: [
    {
      id: 'line-1',
      billId: 'bill-1',
      description: 'Paper products',
      amount: '1250.00',
      categoryId: 'category-1',
      sortOrder: 0,
      category: {
        id: 'category-1',
        name: 'Office supplies',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    },
  ],
  lineItemCount: 1,
};

const payment: PaymentListItem = {
  id: 'payment-1',
  billId: 'bill-1',
  createdBy: 'user-1',
  amount: '1250.00',
  currency: 'USD',
  paymentMethod: 'ach',
  status: 'failed',
  scheduledDate: '2026-06-10',
  initiatedDate: new Date('2026-06-10T12:00:00Z'),
  arrivalDate: null,
  cancelledAt: null,
  failureReason: 'Bank account could not be verified.',
  createdAt: new Date('2026-06-05T12:00:00Z'),
  updatedAt: new Date('2026-06-10T12:30:00Z'),
  bill: {
    id: 'bill-1',
    invoiceNumber: 'INV-1001',
    invoiceDate: '2026-06-01',
    dueDate: '2026-06-30',
    description: 'Monthly operating supplies.',
  },
  vendor: {
    id: 'vendor-1',
    name: 'Acme Supplies',
    email: 'billing@acme.example',
    ownerId: 'user-1',
  },
  creator: {
    id: 'user-1',
    email: 'owner@example.com',
    fullName: 'Alex Owner',
    role: 'owner',
  },
};

afterEach(() => {
  cleanup();
  push.mockReset();
});

describe('detail dialogs', () => {
  it('shows bill information and line items', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<BillDetailDialog bill={bill} onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'Bill details' })).toBeInTheDocument();
    expect(screen.getAllByText('$1,250.00')).toHaveLength(2);
    expect(screen.getByText('Awaiting approval')).toBeInTheDocument();
    expect(screen.getByText('Paper products')).toBeInTheDocument();
    expect(screen.getByText('Office supplies')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open invoice document' })).toHaveAttribute(
      'href',
      bill.invoiceUrl,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows payment information and failure details', () => {
    render(<PaymentDetailDialog onClose={vi.fn()} payment={payment} />);

    expect(screen.getByRole('dialog', { name: 'Payment details' })).toBeInTheDocument();
    expect(screen.getByText('$1,250.00')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('ACH')).toBeInTheDocument();
    expect(screen.getByText('Bank account could not be verified.')).toBeInTheDocument();
    expect(screen.getByText('Monthly operating supplies.')).toBeInTheDocument();
  });

  it('exposes explicit table controls for opening bill and payment details', async () => {
    const user = userEvent.setup();
    const onViewBill = vi.fn();
    const onViewPayment = vi.fn();

    render(
      <>
        {billDetailsColumn({ onViewDetails: onViewBill }).render(bill)}
        {paymentDetailsColumn({ onViewDetails: onViewPayment }).render(payment)}
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'View details for invoice INV-1001' }));
    await user.click(
      screen.getByRole('button', { name: 'View details for invoice INV-1001 payment' }),
    );

    expect(onViewBill).toHaveBeenCalledWith(bill);
    expect(onViewPayment).toHaveBeenCalledWith(payment);
  });

  it('opens bill details from an overview row without navigating', async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    render(
      <BillsStatusOverview
        groups={[{
          tab: 'drafts',
          result: {
            amountTotal: bill.amount,
            items: [bill],
            total: 1,
          },
        }]}
        onViewDetails={onViewDetails}
      />,
    );

    const row = screen.getByText('Acme Supplies').closest('tr');
    expect(row).not.toBeNull();
    if (!row) {
      throw new Error('Expected an overview bill row');
    }

    await user.click(row);

    expect(onViewDetails).toHaveBeenCalledWith(bill);
    expect(push).not.toHaveBeenCalled();
  });
});
