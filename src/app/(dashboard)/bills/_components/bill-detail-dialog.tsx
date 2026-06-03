'use client';

import type { ReactNode } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { billStatusDisplay } from '@/app/_display';
import { Modal } from '@/app/_components/molecules/modal';
import { StatusBadge } from '@/app/_components/molecules/status-badge';
import type { BillListItem } from '@/lib/types/bill/views';
import { formatDate, formatMoney } from '@/lib/utils';

interface BillDetailDialogProps {
  bill: BillListItem;
  onClose: () => void;
}

interface DetailFieldProps {
  children: ReactNode;
  label: string;
}

function DetailField({ children, label }: DetailFieldProps): React.ReactElement {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export function BillDetailDialog({
  bill,
  onClose,
}: BillDetailDialogProps): React.ReactElement {
  const invoiceLabel = bill.invoiceNumber ? `Invoice ${bill.invoiceNumber}` : 'No invoice number';

  return (
    <Modal
      description={`${bill.vendor.name} · ${invoiceLabel}`}
      footer={(
        <Button onClick={onClose} type="button" variant="outline">
          Close
        </Button>
      )}
      maxWidth="5xl"
      onClose={onClose}
      title="Bill details"
    >
      <div className="max-h-[75dvh] overflow-y-auto px-5 pb-5 pt-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Amount</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {formatMoney(bill.amount, bill.currency)}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-2">
              <StatusBadge status={billStatusDisplay[bill.status]} />
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Due date</p>
            <p className="mt-2 text-sm font-medium text-slate-950">
              {bill.dueDate ? formatDate(bill.dueDate) : 'Not set'}
            </p>
          </div>
        </div>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-950">Bill information</h3>
          <dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Vendor">{bill.vendor.name}</DetailField>
            <DetailField label="Vendor email">{bill.vendor.email ?? 'Not set'}</DetailField>
            <DetailField label="Owner">{bill.creator.fullName}</DetailField>
            <DetailField label="Owner email">{bill.creator.email}</DetailField>
            <DetailField label="Invoice number">{bill.invoiceNumber ?? 'Not set'}</DetailField>
            <DetailField label="Invoice date">
              {bill.invoiceDate ? formatDate(bill.invoiceDate) : 'Not set'}
            </DetailField>
            <DetailField label="Created">{formatDateTime(bill.createdAt)}</DetailField>
            <DetailField label="Last updated">{formatDateTime(bill.updatedAt)}</DetailField>
            <DetailField label="Bill ID">
              <code className="break-all text-xs text-slate-600">{bill.id}</code>
            </DetailField>
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-950">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {bill.description ?? 'No description provided.'}
          </p>
          {bill.invoiceUrl ? (
            <a
              className="mt-3 inline-flex text-sm font-medium text-sky-700 hover:text-sky-800"
              href={bill.invoiceUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open invoice document
            </a>
          ) : null}
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">Line items</h3>
            <span className="text-xs text-slate-500">
              {bill.lineItemCount}
              {' '}
              {bill.lineItemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.lineItems.length > 0 ? bill.lineItems.map((lineItem) => (
                  <tr className="border-b border-slate-100 last:border-0" key={lineItem.id}>
                    <td className="px-3 py-2 text-slate-900">
                      {lineItem.description ?? 'No description'}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {lineItem.category?.name ?? 'Uncategorized'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                      {formatMoney(lineItem.amount, bill.currency)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={3}>
                      No line items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Modal>
  );
}
