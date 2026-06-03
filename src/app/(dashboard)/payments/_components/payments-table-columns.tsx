'use client';

import { Button } from '@/app/_components/atoms/button';
import { SelectionCheckbox } from '@/app/_components/atoms/selection-checkbox';
import type { TableSelection } from '@/app/_components/hooks/use-table-selection';
import { DetailNameTrigger } from '@/app/_components/molecules/detail-name-trigger';
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

function vendorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? '').join('');
  return letters ? letters.toUpperCase() : '?';
}

function vendorTone(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % avatarTones.length;
  }
  return avatarTones[hash];
}

function formatOwnerDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

interface DetailsHandlers {
  onViewDetails: (payment: PaymentListItem) => void;
}

export function vendorOwnerColumn(handlers: DetailsHandlers): PaymentsTableColumn {
  const { onViewDetails } = handlers;

  return {
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
          <DetailNameTrigger
            ariaLabel={`View payment details for ${payment.vendor.name}`}
            label={payment.vendor.name}
            onClick={() => onViewDetails(payment)}
          />
          <p className="truncate text-xs text-slate-500">
            {payment.creator.fullName}
            {' · '}
            {formatOwnerDate(payment.createdAt)}
          </p>
        </div>
      </div>
    ),
  };
}

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

export function paymentReadColumns(handlers: DetailsHandlers): PaymentsTableColumn[] {
  return [
    vendorOwnerColumn(handlers),
    statusColumn,
    amountColumn,
    methodColumn,
    scheduledDateColumn,
    arrivalDateColumn,
    invoiceNumberColumn,
    createdAtColumn,
  ];
}

export function selectionColumn(selection: TableSelection): PaymentsTableColumn {
  return {
    id: 'selection',
    header: 'Select',
    isConfigurable: false,
    headerClassName: 'py-3 pl-4 pr-2',
    cellClassName: 'py-3 pl-4 pr-2',
    renderHeader: () => (
      <SelectionCheckbox
        ariaLabel="Select all visible payments"
        checked={selection.isAllSelected}
        indeterminate={selection.isSomeSelected}
        onChange={selection.toggleAll}
      />
    ),
    render: (payment) => (
      <SelectionCheckbox
        ariaLabel={`Select ${payment.vendor.name} payment`}
        checked={selection.isSelected(payment.id)}
        onChange={() => selection.toggle(payment.id)}
      />
    ),
  };
}

interface UpcomingActionsHandlers {
  onInitiate: (payment: PaymentListItem) => void;
  onCancel: (payment: PaymentListItem) => void;
}

export function upcomingActionsColumn(handlers: UpcomingActionsHandlers): PaymentsTableColumn {
  const { onInitiate, onCancel } = handlers;
  return {
    id: 'upcoming-actions',
    header: 'Actions',
    srOnlyHeader: true,
    isConfigurable: false,
    render: (payment) => (
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => onInitiate(payment)}
          size="sm"
          type="button"
          variant="accent"
        >
          Initiate
        </Button>
        <Button
          onClick={() => onCancel(payment)}
          size="sm"
          type="button"
          variant="destructive"
        >
          Cancel
        </Button>
      </div>
    ),
  };
}

interface ProcessingActionsHandlers {
  onMarkPaid: (payment: PaymentListItem) => void;
  onMarkFailed: (payment: PaymentListItem) => void;
}

export function processingActionsColumn(
  handlers: ProcessingActionsHandlers,
): PaymentsTableColumn {
  const { onMarkPaid, onMarkFailed } = handlers;
  return {
    id: 'processing-actions',
    header: 'Actions',
    srOnlyHeader: true,
    isConfigurable: false,
    render: (payment) => (
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => onMarkPaid(payment)}
          size="sm"
          type="button"
          variant="accent"
        >
          Mark paid
        </Button>
        <Button
          onClick={() => onMarkFailed(payment)}
          size="sm"
          type="button"
          variant="destructive"
        >
          Mark failed
        </Button>
      </div>
    ),
  };
}

interface HistoryActionsHandlers {
  onRetry: (payment: PaymentListItem) => void;
}

export function historyActionsColumn(
  handlers: HistoryActionsHandlers,
): PaymentsTableColumn {
  const { onRetry } = handlers;
  return {
    id: 'history-actions',
    header: 'Actions',
    srOnlyHeader: true,
    isConfigurable: false,
    render: (payment) => {
      // Retry is only meaningful for failed payments. Paid and cancelled
      // rows render an empty cell so the column width stays consistent.
      if (payment.status !== 'failed') return null;
      return (
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => onRetry(payment)}
            size="sm"
            type="button"
            variant="accent"
          >
            Retry
          </Button>
        </div>
      );
    },
  };
}
