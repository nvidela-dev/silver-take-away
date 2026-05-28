'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';
import { createBillSchema } from '@/lib/validators/bill.schemas';
import { sumMoneyStrings } from '@/lib/validators/shared';
import type {
  BillFormOptions,
  CreateBillInput,
  DraftBillListItem,
} from '@/types';

import { DraftBillLineItems } from './draft-bill-line-items';
import {
  createDefaultDraftBillFormValues,
  draftBillToFormValues,
  emptyDraftBillLineItem,
  normalizeDraftBillFormValues,
  type DraftBillFormValues,
} from './draft-bill-form-model';

interface DraftBillFormProps {
  editingBill: DraftBillListItem | null;
  formError: string | null;
  isPending: boolean;
  loadError: string | null;
  onCancelEdit: () => void;
  onSubmit: (input: CreateBillInput) => void;
  options: BillFormOptions;
}

export function DraftBillForm({
  editingBill,
  formError,
  isPending,
  loadError,
  onCancelEdit,
  onSubmit,
  options,
}: DraftBillFormProps) {
  const formDisabled = Boolean(loadError)
    || options.vendors.length === 0
    || options.categories.length === 0;

  const form = useForm<DraftBillFormValues>({
    resolver: zodResolver(createBillSchema),
    defaultValues: createDefaultDraftBillFormValues(),
  });
  const {
    control,
    handleSubmit,
    register,
    reset,
  } = form;
  const lineItems = useFieldArray({
    control,
    name: 'lineItems',
  });
  const {
    append,
    fields,
    remove,
  } = lineItems;
  const watchedLineItems = useWatch({
    control,
    name: 'lineItems',
  });
  const watchedAmount = useWatch({
    control,
    name: 'amount',
  });
  const watchedCurrency = useWatch({
    control,
    name: 'currency',
  });

  const lineItemTotal = useMemo(
    () => sumMoneyStrings(watchedLineItems.map((lineItem) => lineItem.amount || '0')),
    [watchedLineItems],
  );
  const totalsMatch = lineItemTotal === Number(watchedAmount);

  useEffect(() => {
    reset(
      editingBill
        ? draftBillToFormValues(editingBill)
        : createDefaultDraftBillFormValues(),
    );
  }, [editingBill, reset]);

  const appendLineItem = useCallback(() => {
    append({ ...emptyDraftBillLineItem });
  }, [append]);

  const removeLineItem = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  function handleValidSubmit(values: DraftBillFormValues) {
    onSubmit(normalizeDraftBillFormValues(values));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingBill ? 'Edit draft bill' : 'Create draft bill'}</CardTitle>
        <CardDescription>
          Drafts stay editable until they are submitted for approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadError ? (
          <div
            className={[
              'rounded-md border border-rose-200 bg-rose-50 p-4',
              'text-sm text-rose-950',
            ].join(' ')}
          >
            {loadError}
          </div>
        ) : null}
        {!loadError && formDisabled ? (
          <div
            className={[
              'rounded-md border border-amber-200 bg-amber-50 p-4',
              'text-sm text-amber-950',
            ].join(' ')}
          >
            Seed vendors and categories before creating draft bills.
          </div>
        ) : null}
        {!loadError && !formDisabled ? (
          <form className="grid gap-4" onSubmit={handleSubmit(handleValidSubmit)}>
            <div className="grid gap-3 md:grid-cols-3">
              <label
                className="grid gap-1 text-sm font-medium text-slate-700"
                htmlFor="bill-vendor"
              >
                Vendor
                <select
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  id="bill-vendor"
                  {...register('vendorId')}
                >
                  <option value="">Select vendor</option>
                  {options.vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className="grid gap-1 text-sm font-medium text-slate-700"
                htmlFor="bill-invoice-number"
              >
                Invoice #
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  id="bill-invoice-number"
                  {...register('invoiceNumber')}
                />
              </label>
              <label
                className="grid gap-1 text-sm font-medium text-slate-700"
                htmlFor="bill-amount"
              >
                Amount
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  id="bill-amount"
                  inputMode="decimal"
                  {...register('amount')}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <label
                className="grid gap-1 text-sm font-medium text-slate-700"
                htmlFor="bill-currency"
              >
                Currency
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm uppercase"
                  id="bill-currency"
                  maxLength={3}
                  {...register('currency')}
                />
              </label>
              <label
                className="grid gap-1 text-sm font-medium text-slate-700"
                htmlFor="bill-invoice-date"
              >
                Invoice date
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  id="bill-invoice-date"
                  type="date"
                  {...register('invoiceDate')}
                />
              </label>
              <label
                className="grid gap-1 text-sm font-medium text-slate-700"
                htmlFor="bill-due-date"
              >
                Due date
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  id="bill-due-date"
                  type="date"
                  {...register('dueDate')}
                />
              </label>
              <label
                className="grid gap-1 text-sm font-medium text-slate-700"
                htmlFor="bill-invoice-url"
              >
                Invoice URL
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  id="bill-invoice-url"
                  type="url"
                  {...register('invoiceUrl')}
                />
              </label>
            </div>

            <label
              className="grid gap-1 text-sm font-medium text-slate-700"
              htmlFor="bill-description"
            >
              Description
              <textarea
                className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
                id="bill-description"
                {...register('description')}
              />
            </label>

            <DraftBillLineItems
              categories={options.categories}
              fields={fields}
              onAppendLineItem={appendLineItem}
              onRemoveLineItem={removeLineItem}
              register={register}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                className={
                  totalsMatch ? 'text-sm text-emerald-700' : 'text-sm text-rose-700'
                }
              >
                Lines total
                {' '}
                {formatMoney(lineItemTotal.toFixed(2), watchedCurrency)}
              </p>
              <div className="flex gap-2">
                {editingBill ? (
                  <Button onClick={onCancelEdit} type="button" variant="ghost">
                    <X aria-hidden className="size-4" />
                    Cancel
                  </Button>
                ) : null}
                <Button disabled={isPending || !totalsMatch} type="submit">
                  <Save aria-hidden className="size-4" />
                  {editingBill ? 'Save draft' : 'Create draft'}
                </Button>
              </div>
            </div>

            {formError ? (
              <p className="text-sm text-rose-700">{formError}</p>
            ) : null}
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
