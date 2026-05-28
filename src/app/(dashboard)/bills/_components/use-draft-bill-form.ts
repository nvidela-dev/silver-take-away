'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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

import { createBillSchema } from '@/lib/validators/bill.schemas';
import { sumMoneyStrings } from '@/lib/validators/shared';
import type {
  CreateBillInput,
  DraftBillListItem,
} from '@/types';

import {
  createDefaultDraftBillFormValues,
  draftBillToFormValues,
  emptyDraftBillLineItem,
  normalizeDraftBillFormValues,
  type DraftBillFormValues,
} from './draft-bill-form-model';

interface UseDraftBillFormOptions {
  editingBill: DraftBillListItem | null;
  onSubmit: (input: CreateBillInput) => void;
}

export function useDraftBillForm({
  editingBill,
  onSubmit,
}: UseDraftBillFormOptions) {
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
  const currency = useWatch({
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

  const submitDraftBill = useCallback((values: DraftBillFormValues) => {
    onSubmit(normalizeDraftBillFormValues(values));
  }, [onSubmit]);

  return {
    fields,
    handleSubmit,
    lineItemTotal,
    register,
    appendLineItem,
    removeLineItem,
    submitDraftBill,
    totalsMatch,
    currency,
  };
}
