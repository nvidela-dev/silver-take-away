'use client';

import { Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import type { UseFormRegister } from 'react-hook-form';

import { Button } from '@/app/_components/ui/button';
import type { DraftBillFormInput } from '@/lib/validators/bill.schemas';
import type { BillFormOptions } from '@/types';

export interface DraftBillLineItemRowProps {
  categories: BillFormOptions['categories'];
  fieldId: string;
  index: number;
  isOnlyLineItem: boolean;
  onRemoveLineItem: (index: number) => void;
  register: UseFormRegister<DraftBillFormInput>;
}

export function DraftBillLineItemRow({
  categories,
  fieldId,
  index,
  isOnlyLineItem,
  onRemoveLineItem,
  register,
}: DraftBillLineItemRowProps) {
  const removeLineItem = useCallback(() => {
    onRemoveLineItem(index);
  }, [index, onRemoveLineItem]);

  return (
    <div
      className="grid gap-2 rounded-md border border-slate-200 p-3"
      key={fieldId}
    >
      <div className="grid gap-2 md:grid-cols-[1fr_140px_180px_auto]">
        <input
          aria-label={`Line ${index + 1} description`}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          placeholder="Description"
          {...register(`lineItems.${index}.description`)}
        />
        <input
          aria-label={`Line ${index + 1} amount`}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          inputMode="decimal"
          placeholder="0.00"
          {...register(`lineItems.${index}.amount`)}
        />
        <select
          aria-label={`Line ${index + 1} category`}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          {...register(`lineItems.${index}.categoryId`)}
        >
          <option value="">Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
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
    </div>
  );
}
