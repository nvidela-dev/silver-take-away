'use client';

import {
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback } from 'react';
import type {
  UseFieldArrayReturn,
  UseFormRegister,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import type { BillFormOptions } from '@/types';

import type { DraftBillFormValues } from './draft-bill-form-model';

type DraftBillLineItemField = UseFieldArrayReturn<
  DraftBillFormValues,
  'lineItems'
>['fields'][number];

interface DraftBillLineItemsProps {
  categories: BillFormOptions['categories'];
  fields: DraftBillLineItemField[];
  onAppendLineItem: () => void;
  onRemoveLineItem: (index: number) => void;
  register: UseFormRegister<DraftBillFormValues>;
}

interface DraftBillLineItemRowProps {
  categories: BillFormOptions['categories'];
  field: DraftBillLineItemField;
  index: number;
  isOnlyLineItem: boolean;
  onRemoveLineItem: (index: number) => void;
  register: UseFormRegister<DraftBillFormValues>;
}

function DraftBillLineItemRow({
  categories,
  field,
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
      key={field.id}
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

export function DraftBillLineItems({
  categories,
  fields,
  onAppendLineItem,
  onRemoveLineItem,
  register,
}: DraftBillLineItemsProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-950">Line items</h2>
        <Button
          onClick={onAppendLineItem}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Plus aria-hidden className="size-4" />
          Add line
        </Button>
      </div>

      {fields.map((field, index) => (
        <DraftBillLineItemRow
          categories={categories}
          field={field}
          index={index}
          isOnlyLineItem={fields.length === 1}
          key={field.id}
          onRemoveLineItem={onRemoveLineItem}
          register={register}
        />
      ))}
    </div>
  );
}
