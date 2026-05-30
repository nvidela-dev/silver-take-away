import {
  Save,
  X,
} from 'lucide-react';

import { Button } from '@/app/_components/ui/button';
import { formatMoney } from '@/lib/utils';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type { BillFormOptions, BillListItem } from '@/lib/types/bill/views';

import { DraftBillLineItems } from './draft-bill-line-items';
import { useDraftBillForm } from './hooks/use-draft-bill-form';

interface DraftBillFormProps {
  editingBill: BillListItem | null;
  formError: string | null;
  isPending: boolean;
  loadError: string | null;
  onCancelEdit: () => void;
  onSubmit: (input: CreateBillInput) => void;
  options: BillFormOptions;
}

function FieldError({ message = undefined }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p className="text-xs font-normal text-rose-700" role="alert">
      {message}
    </p>
  );
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

  const {
    fields,
    formState,
    handleSubmit,
    lineItemTotal,
    register,
    registerCurrency,
    appendLineItem,
    removeLineItem,
    submitDraftBill,
    totalsMatch,
    currency,
  } = useDraftBillForm({ editingBill, onSubmit });

  const { errors } = formState;
  const lineItemsRootError = typeof errors.lineItems?.message === 'string'
    ? errors.lineItems.message
    : undefined;

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-950" id="draft-bill-form-title">
          {editingBill ? 'Edit bill' : 'New bill'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Save bill details and line items before approval.
        </p>
      </div>
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
        <form
          className="grid gap-4"
          noValidate
          onSubmit={handleSubmit(submitDraftBill)}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <label
              className="grid gap-1 text-sm font-medium text-slate-700"
              htmlFor="bill-vendor"
            >
              Vendor
              <select
                aria-invalid={errors.vendorId ? true : undefined}
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
              <FieldError message={errors.vendorId?.message} />
            </label>
            <label
              className="grid gap-1 text-sm font-medium text-slate-700"
              htmlFor="bill-invoice-number"
            >
              Invoice #
              <input
                aria-invalid={errors.invoiceNumber ? true : undefined}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                id="bill-invoice-number"
                {...register('invoiceNumber')}
              />
              <FieldError message={errors.invoiceNumber?.message} />
            </label>
            <label
              className="grid gap-1 text-sm font-medium text-slate-700"
              htmlFor="bill-amount"
            >
              Amount
              <input
                aria-invalid={errors.amount ? true : undefined}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                id="bill-amount"
                inputMode="decimal"
                {...register('amount')}
              />
              <FieldError message={errors.amount?.message} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label
              className="grid gap-1 text-sm font-medium text-slate-700"
              htmlFor="bill-currency"
            >
              Currency
              <input
                aria-invalid={errors.currency ? true : undefined}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm uppercase"
                id="bill-currency"
                maxLength={3}
                {...registerCurrency()}
              />
              <FieldError message={errors.currency?.message} />
            </label>
            <label
              className="grid gap-1 text-sm font-medium text-slate-700"
              htmlFor="bill-invoice-date"
            >
              Invoice date
              <input
                aria-invalid={errors.invoiceDate ? true : undefined}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                id="bill-invoice-date"
                type="date"
                {...register('invoiceDate')}
              />
              <FieldError message={errors.invoiceDate?.message} />
            </label>
            <label
              className="grid gap-1 text-sm font-medium text-slate-700"
              htmlFor="bill-due-date"
            >
              Due date
              <input
                aria-invalid={errors.dueDate ? true : undefined}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                id="bill-due-date"
                type="date"
                {...register('dueDate')}
              />
              <FieldError message={errors.dueDate?.message} />
            </label>
            <label
              className="grid gap-1 text-sm font-medium text-slate-700"
              htmlFor="bill-invoice-url"
            >
              Invoice URL
              <input
                aria-invalid={errors.invoiceUrl ? true : undefined}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                id="bill-invoice-url"
                type="url"
                {...register('invoiceUrl')}
              />
              <FieldError message={errors.invoiceUrl?.message} />
            </label>
          </div>

          <label
            className="grid gap-1 text-sm font-medium text-slate-700"
            htmlFor="bill-description"
          >
            Description
            <textarea
              aria-invalid={errors.description ? true : undefined}
              className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
              id="bill-description"
              {...register('description')}
            />
            <FieldError message={errors.description?.message} />
          </label>

          <DraftBillLineItems
            categories={options.categories}
            errors={errors.lineItems}
            fields={fields}
            onAppendLineItem={appendLineItem}
            onRemoveLineItem={removeLineItem}
            register={register}
          />
          {lineItemsRootError ? <FieldError message={lineItemsRootError} /> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={
                totalsMatch ? 'text-sm text-emerald-700' : 'text-sm text-rose-700'
              }
            >
              Lines total
              {' '}
              {formatMoney(lineItemTotal.toFixed(2), currency)}
            </p>
            <div className="flex gap-2">
              <Button onClick={onCancelEdit} type="button" variant="ghost">
                <X aria-hidden className="size-4" />
                Cancel
              </Button>
              <Button disabled={isPending || !totalsMatch} type="submit">
                <Save aria-hidden className="size-4" />
                {editingBill ? 'Save bill' : 'Create bill'}
              </Button>
            </div>
          </div>

          {formError ? (
            <p className="text-sm text-rose-700" role="alert">{formError}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
