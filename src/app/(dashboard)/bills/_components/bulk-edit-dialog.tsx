'use client';

import { useId, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { Input } from '@/app/_components/atoms/input';
import { Select } from '@/app/_components/atoms/select';
import { Modal } from '@/app/_components/molecules/modal';
import type { BulkEditBillsInput } from '@/lib/types/bill/inputs';

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
}: BulkEditDialogProps): React.ReactElement {
  const amountId = useId();
  const dueDateId = useId();
  const invoiceDateId = useId();
  const descriptionId = useId();
  const categoryId = useId();

  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const handleConfirm = (): void => {
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

  return (
    <Modal
      description={(
        <>
          {billIds.length}
          {' '}
          {billIds.length === 1 ? 'bill' : 'bills'}
          {' selected. Only filled fields are updated.'}
        </>
      )}
      footer={(
        <>
          <Button disabled={isPending} onClick={onCancel} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handleConfirm} type="button" variant="accent">
            {isPending ? 'Working…' : 'Apply to selected'}
          </Button>
        </>
      )}
      onClose={onCancel}
      title="Bulk edit bills"
    >
      <div className="grid gap-3 px-5 pb-5 pt-4">
        <label className="grid gap-1" htmlFor={amountId}>
          <span className="text-xs font-medium text-slate-700">Amount</span>
          <Input
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
            <Input
              id={dueDateId}
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              value={dueDate}
            />
          </label>
          <label className="grid gap-1" htmlFor={invoiceDateId}>
            <span className="text-xs font-medium text-slate-700">Invoice date</span>
            <Input
              id={invoiceDateId}
              onChange={(event) => setInvoiceDate(event.target.value)}
              type="date"
              value={invoiceDate}
            />
          </label>
        </div>
        <label className="grid gap-1" htmlFor={descriptionId}>
          <span className="text-xs font-medium text-slate-700">Description</span>
          <Input
            id={descriptionId}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Leave blank to keep current"
            type="text"
            value={description}
          />
        </label>
        <label className="grid gap-1" htmlFor={categoryId}>
          <span className="text-xs font-medium text-slate-700">Category</span>
          <Select
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
          </Select>
        </label>
        {error ? (
          <p className="text-xs text-rose-700">{error}</p>
        ) : null}
      </div>
    </Modal>
  );
}
