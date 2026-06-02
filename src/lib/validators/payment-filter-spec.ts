import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { z } from 'zod';

import type { PaymentMethodType, PaymentStatus } from '@/lib/types/enums';
import type { PaymentFilterTab } from '@/lib/types/payment/tabs';

import { isoDateSchema, uuidSchema } from './shared';

const ALL_LIST_TABS: readonly PaymentFilterTab[] = ['upcoming', 'processing', 'history'];

const PAYMENT_STATUS_FILTER_OPTIONS = [
  'pending',
  'scheduled',
  'initiated',
  'in_transit',
  'paid',
  'failed',
  'cancelled',
] as const;

const PAYMENT_METHOD_FILTER_OPTIONS = [
  'ach',
  'wire',
  'check',
  'card',
] as const;

const paymentStatusEnumSchema = z.enum(PAYMENT_STATUS_FILTER_OPTIONS);
const paymentMethodEnumSchema = z.enum(PAYMENT_METHOD_FILTER_OPTIONS);

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
    parser: parseAsArrayOf(parseAsStringLiteral(PAYMENT_STATUS_FILTER_OPTIONS)),
    schema: csvList.pipe(z.array(paymentStatusEnumSchema).min(1)).optional(),
    applicableTabs: ['history'] as const,
  }),
  paymentMethod: defineField({
    parser: parseAsArrayOf(parseAsStringLiteral(PAYMENT_METHOD_FILTER_OPTIONS)),
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

export const PAYMENT_FILTER_FIELD_KEYS: readonly PaymentFilterFieldKey[] = [
  'search',
  'status',
  'paymentMethod',
  'vendorId',
  'vendorOwnerId',
  'billId',
  'amountMin',
  'amountMax',
  'scheduledDateFrom',
  'scheduledDateTo',
  'arrivalDateFrom',
  'arrivalDateTo',
];

export const filterParsers = {
  search: PAYMENT_FILTER_FIELD_SPECS.search.parser,
  status: PAYMENT_FILTER_FIELD_SPECS.status.parser,
  paymentMethod: PAYMENT_FILTER_FIELD_SPECS.paymentMethod.parser,
  vendorId: PAYMENT_FILTER_FIELD_SPECS.vendorId.parser,
  vendorOwnerId: PAYMENT_FILTER_FIELD_SPECS.vendorOwnerId.parser,
  billId: PAYMENT_FILTER_FIELD_SPECS.billId.parser,
  amountMin: PAYMENT_FILTER_FIELD_SPECS.amountMin.parser,
  amountMax: PAYMENT_FILTER_FIELD_SPECS.amountMax.parser,
  scheduledDateFrom: PAYMENT_FILTER_FIELD_SPECS.scheduledDateFrom.parser,
  scheduledDateTo: PAYMENT_FILTER_FIELD_SPECS.scheduledDateTo.parser,
  arrivalDateFrom: PAYMENT_FILTER_FIELD_SPECS.arrivalDateFrom.parser,
  arrivalDateTo: PAYMENT_FILTER_FIELD_SPECS.arrivalDateTo.parser,
};

export type PaymentFilterQueryValues = {
  [K in keyof typeof filterParsers]: ReturnType<typeof filterParsers[K]['parseServerSide']>;
};

const savedNullableString = z.string().nullable().catch(null);
const savedNullableNumber = z.number().nullable().catch(null);
const savedPaymentStatuses = z.array(paymentStatusEnumSchema).nullable().catch(null);
const savedPaymentMethods = z.array(paymentMethodEnumSchema).nullable().catch(null);

export function parseSavedPaymentFilterValues(
  filters: Record<string, unknown>,
): Partial<PaymentFilterQueryValues> {
  return {
    search: savedNullableString.parse(filters.search ?? null),
    status: savedPaymentStatuses.parse(filters.status ?? null),
    paymentMethod: savedPaymentMethods.parse(filters.paymentMethod ?? null),
    vendorId: savedNullableString.parse(filters.vendorId ?? null),
    vendorOwnerId: savedNullableString.parse(filters.vendorOwnerId ?? null),
    billId: savedNullableString.parse(filters.billId ?? null),
    amountMin: savedNullableNumber.parse(filters.amountMin ?? null),
    amountMax: savedNullableNumber.parse(filters.amountMax ?? null),
    scheduledDateFrom: savedNullableString.parse(filters.scheduledDateFrom ?? null),
    scheduledDateTo: savedNullableString.parse(filters.scheduledDateTo ?? null),
    arrivalDateFrom: savedNullableString.parse(filters.arrivalDateFrom ?? null),
    arrivalDateTo: savedNullableString.parse(filters.arrivalDateTo ?? null),
  };
}

const fieldSchemas = {
  search: PAYMENT_FILTER_FIELD_SPECS.search.schema,
  status: PAYMENT_FILTER_FIELD_SPECS.status.schema,
  paymentMethod: PAYMENT_FILTER_FIELD_SPECS.paymentMethod.schema,
  vendorId: PAYMENT_FILTER_FIELD_SPECS.vendorId.schema,
  vendorOwnerId: PAYMENT_FILTER_FIELD_SPECS.vendorOwnerId.schema,
  billId: PAYMENT_FILTER_FIELD_SPECS.billId.schema,
  amountMin: PAYMENT_FILTER_FIELD_SPECS.amountMin.schema,
  amountMax: PAYMENT_FILTER_FIELD_SPECS.amountMax.schema,
  scheduledDateFrom: PAYMENT_FILTER_FIELD_SPECS.scheduledDateFrom.schema,
  scheduledDateTo: PAYMENT_FILTER_FIELD_SPECS.scheduledDateTo.schema,
  arrivalDateFrom: PAYMENT_FILTER_FIELD_SPECS.arrivalDateFrom.schema,
  arrivalDateTo: PAYMENT_FILTER_FIELD_SPECS.arrivalDateTo.schema,
};

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
export const PAYMENT_PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];

export const paginationParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(DEFAULT_PAYMENT_PAGE_SIZE),
};

export const paymentPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().refine(
    (size) => PAYMENT_PAGE_SIZE_OPTIONS.includes(size),
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
