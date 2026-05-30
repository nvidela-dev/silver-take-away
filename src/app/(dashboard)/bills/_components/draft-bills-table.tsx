'use client';

import {
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback } from 'react';

import { StatusBadge } from '@/app/_components/shared';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';
import { billStatusDisplay } from '@/lib/display';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import type { DraftBillListItem } from '@/types';

interface DraftBillsTableProps {
  bills: DraftBillListItem[];
  deleteCandidateId: string | null;
  isLoading: boolean;
  onCancelDelete: () => void;
  onDelete: (id: string) => void;
  onEdit: (bill: DraftBillListItem) => void;
  onRequestDelete: (id: string) => void;
}

interface DraftBillRowProps {
  bill: DraftBillListItem;
  isDeleteCandidate: boolean;
  onCancelDelete: () => void;
  onDelete: (id: string) => void;
  onEdit: (bill: DraftBillListItem) => void;
  onRequestDelete: (id: string) => void;
}

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

function DraftBillRow({
  bill,
  isDeleteCandidate,
  onCancelDelete,
  onDelete,
  onEdit,
  onRequestDelete,
}: DraftBillRowProps) {
  const editBill = useCallback(() => {
    onEdit(bill);
  }, [bill, onEdit]);

  const deleteBill = useCallback(() => {
    onDelete(bill.id);
  }, [bill.id, onDelete]);

  const requestDelete = useCallback(() => {
    onRequestDelete(bill.id);
  }, [bill.id, onRequestDelete]);

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="py-3 pl-4 pr-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold',
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
      </td>
      <td className="py-3 pr-4">
        <StatusBadge status={billStatusDisplay[bill.status]} />
      </td>
      <td className="py-3 pr-4 text-right font-medium tabular-nums text-slate-950">
        {formatMoney(bill.amount, bill.currency)}
      </td>
      <td className="py-3 pr-4 text-slate-600">
        {bill.dueDate ? formatDate(bill.dueDate) : '—'}
      </td>
      <td className="py-3 pr-4 text-slate-600">{bill.invoiceNumber ?? '—'}</td>
      <td className="py-3 pr-4 tabular-nums text-slate-600">
        {bill.lineItemCount}
      </td>
      <td className="py-3 pr-4">
        <div className="flex justify-end gap-2">
          <Button
            aria-label={`Edit ${bill.vendor.name} draft`}
            onClick={editBill}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Edit2 aria-hidden className="size-4" />
          </Button>
          {isDeleteCandidate ? (
            <>
              <Button
                onClick={deleteBill}
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
              onClick={requestDelete}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash2 aria-hidden className="size-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function DraftBillsTable({
  bills,
  deleteCandidateId,
  isLoading,
  onCancelDelete,
  onDelete,
  onEdit,
  onRequestDelete,
}: DraftBillsTableProps) {
  const total = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const currency = bills[0]?.currency ?? 'USD';

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto" aria-busy={isLoading}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
            <tr>
              <th className="py-3 pl-4 pr-4 font-medium">Vendor / owner</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 text-right font-medium">Amount</th>
              <th className="py-3 pr-4 font-medium">Due date</th>
              <th className="py-3 pr-4 font-medium">Invoice #</th>
              <th className="py-3 pr-4 font-medium">Lines</th>
              <th className="py-3 pr-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="py-8 text-center text-slate-600" colSpan={7}>
                  Loading draft bills...
                </td>
              </tr>
            ) : null}
            {!isLoading && bills.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-slate-600" colSpan={7}>
                  No draft bills yet.
                </td>
              </tr>
            ) : null}
            {!isLoading ? bills.map((bill) => (
              <DraftBillRow
                bill={bill}
                isDeleteCandidate={deleteCandidateId === bill.id}
                key={bill.id}
                onCancelDelete={onCancelDelete}
                onDelete={onDelete}
                onEdit={onEdit}
                onRequestDelete={onRequestDelete}
              />
            )) : null}
          </tbody>
        </table>
      </div>
      {!isLoading && bills.length > 0 ? (
        <div
          className={[
            'flex justify-end border-t border-slate-200 px-4 py-3',
            'text-xs text-slate-500',
          ].join(' ')}
        >
          {bills.length}
          {' '}
          {bills.length === 1 ? 'bill' : 'bills'}
          {' · '}
          <span className="ml-1 font-medium text-slate-700">
            {formatMoney(total.toFixed(2), currency)}
            {' total'}
          </span>
        </div>
      ) : null}
    </Card>
  );
}
