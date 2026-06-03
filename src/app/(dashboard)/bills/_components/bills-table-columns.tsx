'use client';

import { Edit2, Trash2 } from 'lucide-react';
import { useRef } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { DetailNameTrigger } from '@/app/_components/molecules/detail-name-trigger';
import { usePopoverDismiss } from '@/app/_components/hooks/use-popover-dismiss';
import { SelectionCheckbox } from '@/app/_components/atoms/selection-checkbox';
import { PopoverPanel } from '@/app/_components/molecules/popover-panel';
import type { TableSelection } from '@/app/_components/hooks/use-table-selection';
import { RowActionsMenu, type RowAction } from '@/app/_components/molecules/row-actions-menu';
import { StatusBadge } from '@/app/_components/molecules/status-badge';
import { billStatusDisplay } from '@/app/_display';
import { canArchive } from '@/lib/services/state-machine';
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

export function vendorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? '').join('');
  return letters ? letters.toUpperCase() : '?';
}

export function vendorTone(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % avatarTones.length;
  }
  return avatarTones[hash];
}

export function formatOwnerDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

interface DetailsHandlers {
  onViewDetails: (bill: BillListItem) => void;
}

export function vendorOwnerColumn(handlers: DetailsHandlers): BillsTableColumn {
  const { onViewDetails } = handlers;

  return {
    id: 'vendor',
    header: 'Vendor / owner',
    headerClassName: 'py-3 pl-4 pr-4 font-medium',
    cellClassName: 'py-3 pl-4 pr-4',
    isConfigurable: false,
    skeletonClassName: 'h-8',
    sortKey: 'vendor',
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
          <DetailNameTrigger
            ariaLabel={`View bill details for ${bill.vendor.name}`}
            label={bill.vendor.name}
            onClick={() => onViewDetails(bill)}
          />
          <p className="truncate text-xs text-slate-500">
            {bill.creator.fullName}
            {' · '}
            {formatOwnerDate(bill.createdAt)}
          </p>
        </div>
      </div>
    ),
  };
}

export const statusColumn: BillsTableColumn = {
  id: 'status',
  header: 'Status',
  sortKey: 'status',
  render: (bill) => <StatusBadge status={billStatusDisplay[bill.status]} />,
};

export const amountColumn: BillsTableColumn = {
  id: 'amount',
  header: 'Amount',
  headerClassName: 'py-3 pr-4 text-right font-medium',
  cellClassName: 'py-3 pr-4 text-right font-medium tabular-nums text-slate-950',
  sortKey: 'amount',
  render: (bill) => formatMoney(bill.amount, bill.currency),
};

export const invoiceDateColumn: BillsTableColumn = {
  id: 'invoiceDate',
  header: 'Invoice date',
  cellClassName: 'py-3 pr-4 text-slate-600',
  sortKey: 'invoiceDate',
  render: (bill) => (bill.invoiceDate ? formatDate(bill.invoiceDate) : '—'),
};

export const dueDateColumn: BillsTableColumn = {
  id: 'dueDate',
  header: 'Due date',
  cellClassName: 'py-3 pr-4 text-slate-600',
  sortKey: 'dueDate',
  render: (bill) => (bill.dueDate ? formatDate(bill.dueDate) : '—'),
};

export const invoiceNumberColumn: BillsTableColumn = {
  id: 'invoiceNumber',
  header: 'Invoice #',
  cellClassName: 'py-3 pr-4 text-slate-600',
  sortKey: 'invoiceNumber',
  render: (bill) => bill.invoiceNumber ?? '—',
};

export const linesColumn: BillsTableColumn = {
  id: 'lines',
  header: 'Lines',
  cellClassName: 'py-3 pr-4 tabular-nums text-slate-600',
  render: (bill) => bill.lineItemCount,
};

export function billReadColumns(handlers: DetailsHandlers): BillsTableColumn[] {
  return [
    vendorOwnerColumn(handlers),
    statusColumn,
    amountColumn,
    invoiceDateColumn,
    dueDateColumn,
    invoiceNumberColumn,
    linesColumn,
  ];
}

export function selectionColumn(selection: TableSelection): BillsTableColumn {
  return {
    id: 'selection',
    header: 'Select',
    isConfigurable: false,
    headerClassName: 'py-3 pl-4 pr-2',
    cellClassName: 'py-3 pl-4 pr-2',
    renderHeader: () => (
      <SelectionCheckbox
        ariaLabel="Select all visible bills"
        checked={selection.isAllSelected}
        indeterminate={selection.isSomeSelected}
        onChange={selection.toggleAll}
      />
    ),
    render: (bill) => (
      <SelectionCheckbox
        ariaLabel={`Select ${bill.vendor.name} bill`}
        checked={selection.isSelected(bill.id)}
        onChange={() => selection.toggle(bill.id)}
      />
    ),
  };
}

interface DraftActionsHandlers {
  deleteCandidateId: string | null;
  onCancelDelete: () => void;
  onDelete: (id: string) => void;
  onEdit: (bill: BillListItem) => void;
  onRequestDelete: (id: string) => void;
  onSubmit?: (bill: BillListItem) => void;
}

interface DraftDeleteActionProps {
  bill: BillListItem;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (id: string) => void;
  onRequest: (id: string) => void;
}

function DraftDeleteAction({
  bill,
  isOpen,
  onCancel,
  onConfirm,
  onRequest,
}: DraftDeleteActionProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  usePopoverDismiss({
    containerRef,
    enabled: isOpen,
    onDismiss: onCancel,
  });

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Delete ${bill.vendor.name} draft`}
        onClick={() => {
          if (isOpen) {
            onCancel();
            return;
          }
          onRequest(bill.id);
        }}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Trash2 aria-hidden className="size-4" />
      </Button>
      {isOpen ? (
        <PopoverPanel
          align="right"
          aria-label={`Confirm deleting ${bill.vendor.name} draft`}
          className="w-64 p-3"
          role="dialog"
        >
          <p className="text-sm font-medium text-slate-950">Delete this draft?</p>
          <p className="mt-1 text-xs text-slate-500">
            This removes the draft bill and cannot be undone.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button onClick={onCancel} size="sm" type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(bill.id)}
              size="sm"
              type="button"
              variant="destructive"
            >
              Delete
            </Button>
          </div>
        </PopoverPanel>
      ) : null}
    </div>
  );
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
          <DraftDeleteAction
            bill={bill}
            isOpen={isDeleteCandidate}
            onCancel={onCancelDelete}
            onConfirm={onDelete}
            onRequest={onRequestDelete}
          />
        </div>
      );
    },
  };
}

interface RowActionsHandlers {
  onArchive: (bill: BillListItem) => void;
}

// The per-row archive entry, shown for any bill whose status permits
// archiving (everything except drafts and already-archived bills).
function archiveRowActions(
  bill: BillListItem,
  onArchive: (bill: BillListItem) => void,
): RowAction[] {
  if (!canArchive(bill.status)) return [];
  return [{
    label: 'Archive bill',
    variant: 'destructive',
    onSelect: () => onArchive(bill),
  }];
}

function ArchiveRowMenu({
  bill,
  onArchive,
}: {
  bill: BillListItem;
  onArchive: (bill: BillListItem) => void;
}): React.ReactElement {
  return (
    <RowActionsMenu
      actions={archiveRowActions(bill, onArchive)}
      ariaLabel={`Actions for ${bill.vendor.name} bill`}
    />
  );
}

// A trailing kebab (⋮) menu for per-row lifecycle actions. Currently only
// exposes "Archive bill", shown when the bill's status permits archiving.
export function billRowActionsColumn(handlers: RowActionsHandlers): BillsTableColumn {
  const { onArchive } = handlers;

  return {
    id: 'row-actions',
    header: 'Actions',
    srOnlyHeader: true,
    isConfigurable: false,
    render: (bill) => (
      <div className="flex justify-end">
        <ArchiveRowMenu bill={bill} onArchive={onArchive} />
      </div>
    ),
  };
}

interface ApprovalActionsHandlers {
  onApprove: (bill: BillListItem) => void;
  onReject: (bill: BillListItem) => void;
  onArchive: (bill: BillListItem) => void;
}

export function approvalActionsColumn(
  handlers: ApprovalActionsHandlers,
): BillsTableColumn {
  const { onApprove, onReject, onArchive } = handlers;

  return {
    id: 'approval-actions',
    header: 'Actions',
    srOnlyHeader: true,
    isConfigurable: false,
    render: (bill) => (
      <div className="flex items-center justify-end gap-2">
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
        <ArchiveRowMenu bill={bill} onArchive={onArchive} />
      </div>
    ),
  };
}
