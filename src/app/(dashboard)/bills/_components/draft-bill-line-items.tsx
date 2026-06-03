'use client';

import { Plus } from 'lucide-react';
import type {
  FieldErrors,
  UseFieldArrayReturn,
  UseFormRegister,
} from 'react-hook-form';

import { Button } from '@/app/_components/atoms/button';
import type { DraftBillFormInput } from '@/lib/validators/bill.schemas';
import type { BillFormOptions } from '@/lib/types/bill/views';

import { DraftBillLineItemRow } from './draft-bill-line-item-row';

type DraftBillLineItemField = UseFieldArrayReturn<
  DraftBillFormInput,
  'lineItems'
>['fields'][number];

interface DraftBillLineItemsProps {
  categories: BillFormOptions['categories'];
  errors?: FieldErrors<DraftBillFormInput>['lineItems'];
  fields: DraftBillLineItemField[];
  onAppendLineItem: () => void;
  onRemoveLineItem: (index: number) => void;
  register: UseFormRegister<DraftBillFormInput>;
}

export function DraftBillLineItems({
  categories,
  errors = undefined,
  fields,
  onAppendLineItem,
  onRemoveLineItem,
  register,
}: DraftBillLineItemsProps): React.ReactElement {
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
          errors={Array.isArray(errors) ? errors[index] : undefined}
          fieldId={field.id}
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
