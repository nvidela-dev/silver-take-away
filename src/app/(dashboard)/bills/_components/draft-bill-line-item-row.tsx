'use client';

import { Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import type { FieldError, UseFormRegister } from 'react-hook-form';

import { Button } from '@/app/_components/atoms/button';
import { Input } from '@/app/_components/atoms/input';
import { Select } from '@/app/_components/atoms/select';
import type { DraftBillFormInput } from '@/lib/validators/bill.schemas';
import type { BillFormOptions } from '@/lib/types/bill/views';

type LineItemErrors = Partial<{
  description: FieldError;
  amount: FieldError;
  categoryId: FieldError;
}>;

export interface DraftBillLineItemRowProps {
  categories: BillFormOptions['categories'];
  errors?: LineItemErrors;
  fieldId: string;
  index: number;
  isOnlyLineItem: boolean;
  onRemoveLineItem: (index: number) => void;
  register: UseFormRegister<DraftBillFormInput>;
}

export function DraftBillLineItemRow({
  categories,
  errors = undefined,
  fieldId,
  index,
  isOnlyLineItem,
  onRemoveLineItem,
  register,
}: DraftBillLineItemRowProps) {
  const removeLineItem = useCallback(() => {
    onRemoveLineItem(index);
  }, [index, onRemoveLineItem]);

  const firstError = errors?.description?.message
    ?? errors?.amount?.message
    ?? errors?.categoryId?.message;

  return (
    <div
      className="grid gap-2 rounded-md border border-slate-200 p-3"
      key={fieldId}
    >
      <div className="grid gap-2 md:grid-cols-[1fr_140px_180px_auto]">
        <Input
          aria-invalid={errors?.description ? true : undefined}
          aria-label={`Line ${index + 1} description`}
          placeholder="Description"
          {...register(`lineItems.${index}.description`)}
        />
        <Input
          aria-invalid={errors?.amount ? true : undefined}
          aria-label={`Line ${index + 1} amount`}
          inputMode="decimal"
          placeholder="0.00"
          {...register(`lineItems.${index}.amount`)}
        />
        <Select
          aria-invalid={errors?.categoryId ? true : undefined}
          aria-label={`Line ${index + 1} category`}
          {...register(`lineItems.${index}.categoryId`)}
        >
          <option value="">Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Button
          aria-label={`Remove line ${index + 1}`}
          disabled={isOnlyLineItem}
          onClick={removeLineItem}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden className="size-4" />
        </Button>
      </div>
      {firstError ? (
        <p className="text-xs text-rose-700" role="alert">{firstError}</p>
      ) : null}
    </div>
  );
}
