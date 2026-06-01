import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';

import {
  BillsTable,
  type BillsTableColumn,
} from '@/app/(dashboard)/bills/_components/bills-table';
import type { BillListItem } from '@/lib/types/bill/views';

const columns: BillsTableColumn[] = [
  {
    id: 'invoiceNumber',
    header: 'Invoice #',
    render: (bill) => bill.invoiceNumber,
  },
];

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('tab=drafts'),
}));

const bills: BillListItem[] = Array.from({ length: 10 }, (_, index) => ({
  id: `bill-${index + 1}`,
  vendorId: 'vendor-1',
  createdBy: 'user-1',
  status: 'draft',
  invoiceNumber: `PAGE-${index + 1}`,
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
}));

afterEach(() => {
  cleanup();
});

describe('BillsTable', () => {
  it('shows one server page and navigates with the page query parameter', async () => {
    const user = userEvent.setup();
    render(
      <BillsTable
        bills={bills}
        columns={columns}
        emptyMessage="No bills."
        totalBills={12}
      />,
    );

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    expect(screen.getByText('PAGE-1')).toBeInTheDocument();
    expect(screen.getByText('PAGE-10')).toBeInTheDocument();
    expect(screen.getByText('PAGE-1').closest('tr')).toHaveClass('h-14');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(push).toHaveBeenCalledWith('?tab=drafts&page=2', { scroll: false });
  });

  it('renders animated skeleton rows while loading', () => {
    const { container } = render(
      <BillsTable
        bills={bills}
        columns={columns}
        emptyMessage="No bills."
        isLoading
        loadingMessage="Loading draft bills…"
        totalBills={12}
      />,
    );

    expect(screen.getByText('Loading draft bills…')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(10);
    expect(screen.getByText((content) => content.includes('12 bills'))).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.queryByText('PAGE-1')).not.toBeInTheDocument();
  });
});
