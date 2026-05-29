'use client';

import {
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback } from 'react';

import { StatusBadge } from '@/app/_components/shared';
import { Button } from '@/app/_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_components/ui/card';
import { billStatusDisplay } from '@/lib/display';
import { formatDate, formatMoney } from '@/lib/utils';
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
    <tr>
      <td className="py-3 pr-4 font-medium text-slate-950">
        {bill.vendor.name}
      </td>
      <td className="py-3 pr-4">
        <StatusBadge status={billStatusDisplay[bill.status]} />
      </td>
      <td className="py-3 pr-4 text-right">
        {formatMoney(bill.amount, bill.currency)}
      </td>
      <td className="py-3 pr-4">
        {bill.dueDate ? formatDate(bill.dueDate) : '-'}
      </td>
      <td className="py-3 pr-4">{bill.invoiceNumber ?? '-'}</td>
      <td className="py-3 pr-4">{bill.lineItemCount}</td>
      <td className="py-3">
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
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Drafts</CardTitle>
            <CardDescription>
              Bills currently being prepared before approval.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto" aria-busy={isLoading}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Vendor</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4 text-right">Amount</th>
                <th className="py-3 pr-4">Due date</th>
                <th className="py-3 pr-4">Invoice #</th>
                <th className="py-3 pr-4">Lines</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
      </CardContent>
    </Card>
  );
}
