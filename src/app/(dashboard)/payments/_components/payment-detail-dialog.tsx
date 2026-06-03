'use client';

import type { ReactNode } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { paymentMethodDisplay, paymentStatusDisplay } from '@/app/_display';
import { Modal } from '@/app/_components/molecules/modal';
import { StatusBadge } from '@/app/_components/molecules/status-badge';
import type { PaymentListItem } from '@/lib/types/payment/views';
import { formatDate, formatMoney } from '@/lib/utils';

interface PaymentDetailDialogProps {
  onClose: () => void;
  payment: PaymentListItem;
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

export function PaymentDetailDialog({
  onClose,
  payment,
}: PaymentDetailDialogProps): React.ReactElement {
  const invoiceLabel = payment.bill.invoiceNumber
    ? `Invoice ${payment.bill.invoiceNumber}`
    : 'No invoice number';

  return (
    <Modal
      description={`${payment.vendor.name} · ${invoiceLabel}`}
      footer={(
        <Button onClick={onClose} type="button" variant="outline">
          Close
        </Button>
      )}
      maxWidth="5xl"
      onClose={onClose}
      title="Payment details"
    >
      <div className="max-h-[75dvh] overflow-y-auto px-5 pb-5 pt-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Amount</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {formatMoney(payment.amount, payment.currency)}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-2">
              <StatusBadge status={paymentStatusDisplay[payment.status]} />
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Method</p>
            <div className="mt-2">
              <StatusBadge status={paymentMethodDisplay[payment.paymentMethod]} />
            </div>
          </div>
        </div>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-950">Payment information</h3>
          <dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Vendor">{payment.vendor.name}</DetailField>
            <DetailField label="Vendor email">{payment.vendor.email ?? 'Not set'}</DetailField>
            <DetailField label="Created by">{payment.creator.fullName}</DetailField>
            <DetailField label="Creator email">{payment.creator.email}</DetailField>
            <DetailField label="Invoice number">
              {payment.bill.invoiceNumber ?? 'Not set'}
            </DetailField>
            <DetailField label="Invoice date">
              {payment.bill.invoiceDate ? formatDate(payment.bill.invoiceDate) : 'Not set'}
            </DetailField>
            <DetailField label="Bill due date">
              {payment.bill.dueDate ? formatDate(payment.bill.dueDate) : 'Not set'}
            </DetailField>
            <DetailField label="Scheduled date">
              {payment.scheduledDate ? formatDate(payment.scheduledDate) : 'Not set'}
            </DetailField>
            <DetailField label="Initiated date">
              {payment.initiatedDate ? formatDateTime(payment.initiatedDate) : 'Not set'}
            </DetailField>
            <DetailField label="Arrival date">
              {payment.arrivalDate ? formatDate(payment.arrivalDate) : 'Not set'}
            </DetailField>
            <DetailField label="Cancelled">
              {payment.cancelledAt ? formatDateTime(payment.cancelledAt) : 'Not set'}
            </DetailField>
            <DetailField label="Created">{formatDateTime(payment.createdAt)}</DetailField>
            <DetailField label="Last updated">{formatDateTime(payment.updatedAt)}</DetailField>
            <DetailField label="Payment ID">
              <code className="break-all text-xs text-slate-600">{payment.id}</code>
            </DetailField>
            <DetailField label="Bill ID">
              <code className="break-all text-xs text-slate-600">{payment.billId}</code>
            </DetailField>
          </dl>
        </section>

        <section className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Bill description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {payment.bill.description ?? 'No bill description provided.'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Failure reason</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {payment.failureReason ?? 'No failure reason recorded.'}
            </p>
          </div>
        </section>
      </div>
    </Modal>
  );
}
