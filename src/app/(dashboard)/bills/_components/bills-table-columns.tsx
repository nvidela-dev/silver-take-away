'use client';

import { Edit2, Trash2, X } from 'lucide-react';

import { StatusBadge } from '@/app/_components/shared';
import { Button } from '@/app/_components/ui/button';
import { billStatusDisplay } from '@/app/_display';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import type { BillListItem } from '@/lib/types/bill/views';

import type { BillsTableColumn } from './bills-table';

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

export const vendorOwnerColumn: BillsTableColumn = {
  id: 'vendor',
  header: 'Vendor / owner',
  headerClassName: 'py-3 pl-4 pr-4 font-medium',
  cellClassName: 'py-3 pl-4 pr-4',
  isConfigurable: false,
  render: (bill) => (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full',
          'text-xs font-semibold',
          vendorTone(bill.vendor.name),
        )}
      >
        {vendorInitials(bill.vendor.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-950">
          {bill.vendor.name}
        </p>
        <p className="truncate text-xs text-slate-500">
          {bill.creator.fullName}
          {' · '}
          {formatOwnerDate(bill.createdAt)}
        </p>
      </div>
    </div>
  ),
};

export const statusColumn: BillsTableColumn = {
  id: 'status',
  header: 'Status',
  render: (bill) => <StatusBadge status={billStatusDisplay[bill.status]} />,
};

export const amountColumn: BillsTableColumn = {
  id: 'amount',
  header: 'Amount',
  headerClassName: 'py-3 pr-4 text-right font-medium',
  cellClassName: 'py-3 pr-4 text-right font-medium tabular-nums text-slate-950',
  render: (bill) => formatMoney(bill.amount, bill.currency),
};

export const dueDateColumn: BillsTableColumn = {
  id: 'dueDate',
  header: 'Due date',
  cellClassName: 'py-3 pr-4 text-slate-600',
  render: (bill) => (bill.dueDate ? formatDate(bill.dueDate) : '—'),
};

export const invoiceNumberColumn: BillsTableColumn = {
  id: 'invoiceNumber',
  header: 'Invoice #',
  cellClassName: 'py-3 pr-4 text-slate-600',
  render: (bill) => bill.invoiceNumber ?? '—',
};

export const linesColumn: BillsTableColumn = {
  id: 'lines',
  header: 'Lines',
  cellClassName: 'py-3 pr-4 tabular-nums text-slate-600',
  render: (bill) => bill.lineItemCount,
};

export const billReadColumns: BillsTableColumn[] = [
  vendorOwnerColumn,
  statusColumn,
  amountColumn,
  dueDateColumn,
  invoiceNumberColumn,
  linesColumn,
];

interface DraftActionsHandlers {
  deleteCandidateId: string | null;
  onCancelDelete: () => void;
  onDelete: (id: string) => void;
  onEdit: (bill: BillListItem) => void;
  onRequestDelete: (id: string) => void;
  onSubmit?: (bill: BillListItem) => void;
}

export function draftActionsColumn(handlers: DraftActionsHandlers): BillsTableColumn {
  const {
    deleteCandidateId,
    onCancelDelete,
    onDelete,
    onEdit,
    onRequestDelete,
    onSubmit,
  } = handlers;

  return {
    id: 'actions',
    header: 'Actions',
    srOnlyHeader: true,
    isConfigurable: false,
    render: (bill) => {
      const isDeleteCandidate = deleteCandidateId === bill.id;

      return (
        <div className="flex justify-end gap-2">
          {onSubmit ? (
            <Button
              onClick={() => onSubmit(bill)}
              size="sm"
              type="button"
              variant="accent"
            >
              Submit for approval
            </Button>
          ) : null}
          <Button
            aria-label={`Edit ${bill.vendor.name} draft`}
            onClick={() => onEdit(bill)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Edit2 aria-hidden className="size-4" />
          </Button>
          {isDeleteCandidate ? (
            <>
              <Button
                onClick={() => onDelete(bill.id)}
                size="sm"
                type="button"
                variant="destructive"
              >
                Delete
              </Button>
              <Button
                aria-label="Cancel delete"
                onClick={onCancelDelete}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden className="size-4" />
              </Button>
            </>
          ) : (
            <Button
              aria-label={`Delete ${bill.vendor.name} draft`}
              onClick={() => onRequestDelete(bill.id)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash2 aria-hidden className="size-4" />
            </Button>
          )}
        </div>
      );
    },
  };
}

interface ApprovalActionsHandlers {
  onApprove: (bill: BillListItem) => void;
  onReject: (bill: BillListItem) => void;
}

export function approvalActionsColumn(
  handlers: ApprovalActionsHandlers,
): BillsTableColumn {
  const { onApprove, onReject } = handlers;

  return {
    id: 'approval-actions',
    header: 'Actions',
    srOnlyHeader: true,
    isConfigurable: false,
    render: (bill) => (
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => onApprove(bill)}
          size="sm"
          type="button"
          variant="accent"
        >
          Approve
        </Button>
        <Button
          onClick={() => onReject(bill)}
          size="sm"
          type="button"
          variant="destructive"
        >
          Reject
        </Button>
      </div>
    ),
  };
}
