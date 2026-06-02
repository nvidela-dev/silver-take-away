import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { z } from 'zod';

import type { BillFilterTab } from '@/lib/types/bill/tabs';
import type { BillStatus } from '@/lib/types/enums';

import { isoDateSchema, uuidSchema } from './shared';

const ALL_LIST_TABS: readonly BillFilterTab[] = ['drafts', 'approvals', 'payment', 'history'];

const BILL_STATUS_FILTER_OPTIONS = [
  'draft',
  'awaiting_approval',
  'approved',
  'scheduled',
  'initiated',
  'paid',
  'archived',
  'rejected',
  'payment_failed',
] as const;

const billStatusEnumSchema = z.enum(BILL_STATUS_FILTER_OPTIONS);

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

interface BillFilterFieldSpec<TParser, TSchema extends z.ZodTypeAny> {
  parser: TParser;
  schema: TSchema;
  applicableTabs: readonly BillFilterTab[];
}

function defineField<TParser, TSchema extends z.ZodTypeAny>(
  spec: BillFilterFieldSpec<TParser, TSchema>,
): BillFilterFieldSpec<TParser, TSchema> {
  return spec;
}

export const BILL_FILTER_FIELD_SPECS = {
  search: defineField({
    parser: parseAsString,
    schema: stringParam.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  status: defineField({
    parser: parseAsArrayOf(parseAsStringLiteral(BILL_STATUS_FILTER_OPTIONS)),
    schema: csvList.pipe(z.array(billStatusEnumSchema).min(1)).optional(),
    applicableTabs: ['payment', 'history'] as const,
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
  categoryId: defineField({
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
  invoiceDateFrom: defineField({
    parser: parseAsString,
    schema: isoDateSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  invoiceDateTo: defineField({
    parser: parseAsString,
    schema: isoDateSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  dueDateFrom: defineField({
    parser: parseAsString,
    schema: isoDateSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
  dueDateTo: defineField({
    parser: parseAsString,
    schema: isoDateSchema.optional(),
    applicableTabs: ALL_LIST_TABS,
  }),
} as const;

export type BillFilterFieldKey = keyof typeof BILL_FILTER_FIELD_SPECS;

export const BILL_FILTER_FIELD_KEYS: readonly BillFilterFieldKey[] = [
  'search',
  'status',
  'vendorId',
  'vendorOwnerId',
  'categoryId',
  'amountMin',
  'amountMax',
  'invoiceDateFrom',
  'invoiceDateTo',
  'dueDateFrom',
  'dueDateTo',
];

export const filterParsers = {
  search: BILL_FILTER_FIELD_SPECS.search.parser,
  status: BILL_FILTER_FIELD_SPECS.status.parser,
  vendorId: BILL_FILTER_FIELD_SPECS.vendorId.parser,
  vendorOwnerId: BILL_FILTER_FIELD_SPECS.vendorOwnerId.parser,
  categoryId: BILL_FILTER_FIELD_SPECS.categoryId.parser,
  amountMin: BILL_FILTER_FIELD_SPECS.amountMin.parser,
  amountMax: BILL_FILTER_FIELD_SPECS.amountMax.parser,
  invoiceDateFrom: BILL_FILTER_FIELD_SPECS.invoiceDateFrom.parser,
  invoiceDateTo: BILL_FILTER_FIELD_SPECS.invoiceDateTo.parser,
  dueDateFrom: BILL_FILTER_FIELD_SPECS.dueDateFrom.parser,
  dueDateTo: BILL_FILTER_FIELD_SPECS.dueDateTo.parser,
};

export type BillFilterQueryValues = {
  [K in keyof typeof filterParsers]: ReturnType<typeof filterParsers[K]['parseServerSide']>;
};

const savedNullableString = z.string().nullable().catch(null);
const savedNullableNumber = z.number().nullable().catch(null);
const savedBillStatuses = z.array(billStatusEnumSchema).nullable().catch(null);

export function parseSavedBillFilterValues(
  filters: Record<string, unknown>,
): Partial<BillFilterQueryValues> {
  return {
    search: savedNullableString.parse(filters.search ?? null),
    status: savedBillStatuses.parse(filters.status ?? null),
    vendorId: savedNullableString.parse(filters.vendorId ?? null),
    vendorOwnerId: savedNullableString.parse(filters.vendorOwnerId ?? null),
    categoryId: savedNullableString.parse(filters.categoryId ?? null),
    amountMin: savedNullableNumber.parse(filters.amountMin ?? null),
    amountMax: savedNullableNumber.parse(filters.amountMax ?? null),
    invoiceDateFrom: savedNullableString.parse(filters.invoiceDateFrom ?? null),
    invoiceDateTo: savedNullableString.parse(filters.invoiceDateTo ?? null),
    dueDateFrom: savedNullableString.parse(filters.dueDateFrom ?? null),
    dueDateTo: savedNullableString.parse(filters.dueDateTo ?? null),
  };
}

const fieldSchemas = {
  search: BILL_FILTER_FIELD_SPECS.search.schema,
  status: BILL_FILTER_FIELD_SPECS.status.schema,
  vendorId: BILL_FILTER_FIELD_SPECS.vendorId.schema,
  vendorOwnerId: BILL_FILTER_FIELD_SPECS.vendorOwnerId.schema,
  categoryId: BILL_FILTER_FIELD_SPECS.categoryId.schema,
  amountMin: BILL_FILTER_FIELD_SPECS.amountMin.schema,
  amountMax: BILL_FILTER_FIELD_SPECS.amountMax.schema,
  invoiceDateFrom: BILL_FILTER_FIELD_SPECS.invoiceDateFrom.schema,
  invoiceDateTo: BILL_FILTER_FIELD_SPECS.invoiceDateTo.schema,
  dueDateFrom: BILL_FILTER_FIELD_SPECS.dueDateFrom.schema,
  dueDateTo: BILL_FILTER_FIELD_SPECS.dueDateTo.schema,
};

export const billFiltersSchema = z.object(fieldSchemas);

export type BillFilters = z.infer<typeof billFiltersSchema>;

export type BillFilterValue<K extends BillFilterFieldKey> = NonNullable<BillFilters[K]>;

export type BillStatusFilterValue = NonNullable<BillFilters['status']> extends readonly (infer S)[]
  ? S extends BillStatus ? S : never
  : never;

export const DEFAULT_BILL_PAGE_SIZE = 10;
export const BILL_PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];

export const paginationParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(DEFAULT_BILL_PAGE_SIZE),
};

export const billPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().refine(
    (size) => BILL_PAGE_SIZE_OPTIONS.includes(size),
    { message: 'pageSize must be one of the allowed options.' },
  ).default(DEFAULT_BILL_PAGE_SIZE),
});

export type BillPaginationSchema = z.infer<typeof billPaginationSchema>;

export function scopedFiltersForTab(
  tab: BillFilterTab,
  filters: BillFilters,
): BillFilters {
  const entries = BILL_FILTER_FIELD_KEYS
    .filter((key) => (
      filters[key] !== undefined
      && BILL_FILTER_FIELD_SPECS[key].applicableTabs.includes(tab)
    ))
    .map((key) => [key, filters[key]] as const);
  return Object.fromEntries(entries);
}
