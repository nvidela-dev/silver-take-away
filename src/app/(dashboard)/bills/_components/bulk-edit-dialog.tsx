'use client';

import { X } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';
import type { BulkEditBillsInput } from '@/lib/types/bill/inputs';

import { useDialogBehavior } from './hooks/use-dialog-behavior';

interface BulkEditDialogProps {
  billIds: string[];
  categoryOptions: { id: string; name: string }[];
  isPending: boolean;
  error: string | null;
  onConfirm: (input: BulkEditBillsInput) => void;
  onCancel: () => void;
}

function trimOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function BulkEditDialog({
  billIds,
  categoryOptions,
  isPending,
  error,
  onConfirm,
  onCancel,
}: BulkEditDialogProps) {
  const titleId = useId();
  const amountId = useId();
  const dueDateId = useId();
  const invoiceDateId = useId();
  const descriptionId = useId();
  const categoryId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useDialogBehavior({ containerRef: dialogRef, onClose: onCancel });

  const handleConfirm = () => {
    const input: BulkEditBillsInput = { billIds };
    const amountValue = trimOrUndefined(amount);
    const dueDateValue = trimOrUndefined(dueDate);
    const invoiceDateValue = trimOrUndefined(invoiceDate);
    const descriptionValue = trimOrUndefined(description);
    const categoryValue = trimOrUndefined(category);
    if (amountValue !== undefined) input.amount = amountValue;
    if (dueDateValue !== undefined) input.dueDate = dueDateValue;
    if (invoiceDateValue !== undefined) input.invoiceDate = invoiceDateValue;
    if (descriptionValue !== undefined) input.description = descriptionValue;
    if (categoryValue !== undefined) input.categoryId = categoryValue;
    onConfirm(input);
  };

  const inputClass = [
    'block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5',
    'text-sm text-slate-950 placeholder:text-slate-400',
    'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300',
  ].join(' ');

  return (
    <div
      aria-labelledby={titleId}
      aria-modal
      className={[
        'fixed inset-0 z-50 grid place-items-center bg-slate-950/50',
        'p-3 sm:p-6',
      ].join(' ')}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950" id={titleId}>
              Bulk edit bills
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {billIds.length}
              {' '}
              {billIds.length === 1 ? 'bill' : 'bills'}
              {' selected. Only filled fields are updated.'}
            </p>
          </div>
          <Button
            aria-label="Close dialog"
            onClick={onCancel}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        <div className="grid gap-3 px-5 pb-5 pt-4">
          <label className="grid gap-1" htmlFor={amountId}>
            <span className="text-xs font-medium text-slate-700">Amount</span>
            <input
              className={inputClass}
              id={amountId}
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Leave blank to keep current"
              type="text"
              value={amount}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1" htmlFor={dueDateId}>
              <span className="text-xs font-medium text-slate-700">Due date</span>
              <input
                className={inputClass}
                id={dueDateId}
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
            </label>
            <label className="grid gap-1" htmlFor={invoiceDateId}>
              <span className="text-xs font-medium text-slate-700">Invoice date</span>
              <input
                className={inputClass}
                id={invoiceDateId}
                onChange={(event) => setInvoiceDate(event.target.value)}
                type="date"
                value={invoiceDate}
              />
            </label>
          </div>
          <label className="grid gap-1" htmlFor={descriptionId}>
            <span className="text-xs font-medium text-slate-700">Description</span>
            <input
              className={inputClass}
              id={descriptionId}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Leave blank to keep current"
              type="text"
              value={description}
            />
          </label>
          <label className="grid gap-1" htmlFor={categoryId}>
            <span className="text-xs font-medium text-slate-700">Category</span>
            <select
              className={inputClass}
              id={categoryId}
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">Leave unchanged</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <p className="text-xs text-rose-700">{error}</p>
          ) : null}
        </div>
        <div
          className={[
            'flex items-center justify-end gap-2 border-t border-slate-200',
            'bg-slate-50 px-5 py-3',
          ].join(' ')}
        >
          <Button
            disabled={isPending}
            onClick={onCancel}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={handleConfirm}
            type="button"
            variant="accent"
          >
            {isPending ? 'Working…' : 'Apply to selected'}
          </Button>
        </div>
      </div>
    </div>
  );
}
