import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server';
import { z } from 'zod';

import type { PaymentMethodType, PaymentStatus } from '@/lib/types/enums';
import type { PaymentFilterTab } from '@/lib/types/payment/tabs';

import { isoDateSchema, uuidSchema } from './shared';

const ALL_LIST_TABS: readonly PaymentFilterTab[] = ['upcoming', 'processing', 'history'];

const paymentStatusEnumSchema = z.enum([
  'pending',
  'scheduled',
  'initiated',
  'in_transit',
  'paid',
  'failed',
  'cancelled',
]);

const paymentMethodEnumSchema = z.enum([
  'ach',
  'wire',
  'check',
  'card',
]);

const csvList = z
  .string()
  .transform((value) => value.split(',').map((part) => part.trim()).filter(Boolean));

const stringParam = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1));

const positiveNumberParam = z.coerce.number().refine(
  (n) => Number.isFinite(n) && n >= 0,
  { message: 'Amount must be a non-negative number.' },
);

interface PaymentFilterFieldSpec<TParser, TSchema extends z.ZodTypeAny> {
  parser: TParser;
  schema: TSchema;
  applicableTabs: readonly PaymentFilterTab[];
}

function defineField<TParser, TSchema extends z.ZodTypeAny>(
  spec: PaymentFilterFieldSpec<TParser, TSchema>,
): PaymentFilterFieldSpec<TParser, TSchema> {
  return spec;
}

export const PAYMENT_FILTER_FIELD_SPECS = {
  search: defineField({
    parser: parseAsString,
    schema: stringParam.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  status: defineField({
    parser: parseAsArrayOf(parseAsString),
    schema: csvList.pipe(z.array(paymentStatusEnumSchema).min(1)).optional(),
    applicableTabs: ['history'] as const,
  }),
  paymentMethod: defineField({
    parser: parseAsArrayOf(parseAsString),
    schema: csvList.pipe(z.array(paymentMethodEnumSchema).min(1)).optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  vendorId: defineField({
    parser: parseAsString,
    schema: uuidSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  vendorOwnerId: defineField({
    parser: parseAsString,
    schema: uuidSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  billId: defineField({
    parser: parseAsString,
    schema: uuidSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  amountMin: defineField({
    parser: parseAsFloat,
    schema: positiveNumberParam.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  amountMax: defineField({
    parser: parseAsFloat,
    schema: positiveNumberParam.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  scheduledDateFrom: defineField({
    parser: parseAsString,
    schema: isoDateSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  scheduledDateTo: defineField({
    parser: parseAsString,
    schema: isoDateSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  arrivalDateFrom: defineField({
    parser: parseAsString,
    schema: isoDateSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  arrivalDateTo: defineField({
    parser: parseAsString,
    schema: isoDateSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
} as const;

export type PaymentFilterFieldKey = keyof typeof PAYMENT_FILTER_FIELD_SPECS;

export const PAYMENT_FILTER_FIELD_KEYS = Object.keys(
  PAYMENT_FILTER_FIELD_SPECS,
) as PaymentFilterFieldKey[];

export const filterParsers = Object.fromEntries(
  PAYMENT_FILTER_FIELD_KEYS.map((key) => [key, PAYMENT_FILTER_FIELD_SPECS[key].parser]),
) as { [K in PaymentFilterFieldKey]: typeof PAYMENT_FILTER_FIELD_SPECS[K]['parser'] };

const fieldSchemas = Object.fromEntries(
  PAYMENT_FILTER_FIELD_KEYS.map((key) => [key, PAYMENT_FILTER_FIELD_SPECS[key].schema]),
) as { [K in PaymentFilterFieldKey]: typeof PAYMENT_FILTER_FIELD_SPECS[K]['schema'] };

export const paymentFiltersSchema = z.object(fieldSchemas);

export type PaymentFilters = z.infer<typeof paymentFiltersSchema>;

export type PaymentFilterValue<K extends PaymentFilterFieldKey> = NonNullable<PaymentFilters[K]>;

export type PaymentStatusFilterValue = NonNullable<
  PaymentFilters['status']
> extends readonly (infer S)[]
  ? S extends PaymentStatus ? S : never
  : never;

export type PaymentMethodFilterValue = NonNullable<
  PaymentFilters['paymentMethod']
> extends readonly (infer M)[]
  ? M extends PaymentMethodType ? M : never
  : never;

export const DEFAULT_PAYMENT_PAGE_SIZE = 10;
export const PAYMENT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const paginationParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(DEFAULT_PAYMENT_PAGE_SIZE),
};

export const paymentPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().refine(
    (size) => (PAYMENT_PAGE_SIZE_OPTIONS as readonly number[]).includes(size),
    { message: 'pageSize must be one of the allowed options.' },
  ).default(DEFAULT_PAYMENT_PAGE_SIZE),
});

export type PaymentPaginationSchema = z.infer<typeof paymentPaginationSchema>;

export function scopedFiltersForTab(
  tab: PaymentFilterTab,
  filters: PaymentFilters,
): PaymentFilters {
  const entries = PAYMENT_FILTER_FIELD_KEYS
    .filter((key) => (
      filters[key] !== undefined
      && PAYMENT_FILTER_FIELD_SPECS[key].applicableTabs.includes(tab)
    ))
    .map((key) => [key, filters[key]] as const);
  return Object.fromEntries(entries);
}
