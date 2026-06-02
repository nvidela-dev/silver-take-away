'use client';

import { StatusBadge } from '@/app/_components/molecules/status-badge';
import { paymentMethodDisplay, paymentStatusDisplay } from '@/app/_display';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import type { PaymentListItem } from '@/lib/types/payment/views';

import type { PaymentsTableColumn } from './payments-table';

const avatarTones = [
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
];

function vendorInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? '').join('');
  return letters ? letters.toUpperCase() : '?';
}

function vendorTone(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % avatarTones.length;
  }
  return avatarTones[hash];
}

function formatOwnerDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export const vendorOwnerColumn: PaymentsTableColumn = {
  id: 'vendor',
  header: 'Vendor / owner',
  headerClassName: 'py-3 pl-4 pr-4 font-medium',
  cellClassName: 'py-3 pl-4 pr-4',
  isConfigurable: false,
  skeletonClassName: 'h-8',
  sortKey: 'vendor',
  render: (payment) => (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full',
          'text-xs font-semibold',
          vendorTone(payment.vendor.name),
        )}
      >
        {vendorInitials(payment.vendor.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-950">
          {payment.vendor.name}
        </p>
        <p className="truncate text-xs text-slate-500">
          {payment.creator.fullName}
          {' · '}
          {formatOwnerDate(payment.createdAt)}
        </p>
      </div>
    </div>
  ),
};

export const statusColumn: PaymentsTableColumn = {
  id: 'status',
  header: 'Status',
  sortKey: 'status',
  render: (payment) => <StatusBadge status={paymentStatusDisplay[payment.status]} />,
};

export const amountColumn: PaymentsTableColumn = {
  id: 'amount',
  header: 'Amount',
  headerClassName: 'py-3 pr-4 text-right font-medium',
  cellClassName: 'py-3 pr-4 text-right font-medium tabular-nums text-slate-950',
  sortKey: 'amount',
  render: (payment) => formatMoney(payment.amount, payment.currency),
};

export const methodColumn: PaymentsTableColumn = {
  id: 'paymentMethod',
  header: 'Method',
  sortKey: 'paymentMethod',
  render: (payment) => <StatusBadge status={paymentMethodDisplay[payment.paymentMethod]} />,
};

export const scheduledDateColumn: PaymentsTableColumn = {
  id: 'scheduledDate',
  header: 'Scheduled',
  cellClassName: 'py-3 pr-4 text-slate-600',
  sortKey: 'scheduledDate',
  render: (payment) => (payment.scheduledDate ? formatDate(payment.scheduledDate) : '—'),
};

export const arrivalDateColumn: PaymentsTableColumn = {
  id: 'arrivalDate',
  header: 'Arrival',
  cellClassName: 'py-3 pr-4 text-slate-600',
  sortKey: 'arrivalDate',
  render: (payment) => (payment.arrivalDate ? formatDate(payment.arrivalDate) : '—'),
};

export const invoiceNumberColumn: PaymentsTableColumn = {
  id: 'invoiceNumber',
  header: 'Invoice #',
  cellClassName: 'py-3 pr-4 text-slate-600',
  render: (payment) => payment.bill.invoiceNumber ?? '—',
};

export const createdAtColumn: PaymentsTableColumn = {
  id: 'createdAt',
  header: 'Created',
  cellClassName: 'py-3 pr-4 text-slate-600',
  sortKey: 'createdAt',
  render: (payment) => formatOwnerDate(payment.createdAt),
};

export const paymentReadColumns: PaymentsTableColumn[] = [
  vendorOwnerColumn,
  statusColumn,
  amountColumn,
  methodColumn,
  scheduledDateColumn,
  arrivalDateColumn,
  invoiceNumberColumn,
  createdAtColumn,
];
