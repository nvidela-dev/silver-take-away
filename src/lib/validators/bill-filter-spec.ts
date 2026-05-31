import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server';
import { z } from 'zod';

import type { BillFilterTab } from '@/lib/types/bill/tabs';
import type { BillStatus } from '@/lib/types/enums';

import { isoDateSchema, uuidSchema } from './shared';

const ALL_LIST_TABS: readonly BillFilterTab[] = ['drafts', 'approvals', 'payment'];

const billStatusEnumSchema = z.enum([
  'draft',
  'awaiting_approval',
  'approved',
  'scheduled',
  'initiated',
  'paid',
  'archived',
  'rejected',
  'payment_failed',
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
    parser: parseAsArrayOf(parseAsString),
    schema: csvList.pipe(z.array(billStatusEnumSchema).min(1)).optional(),
    applicableTabs: ['payment'] as const,
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

export const BILL_FILTER_FIELD_KEYS = Object.keys(BILL_FILTER_FIELD_SPECS) as BillFilterFieldKey[];

export const filterParsers = Object.fromEntries(
  BILL_FILTER_FIELD_KEYS.map((key) => [key, BILL_FILTER_FIELD_SPECS[key].parser]),
) as { [K in BillFilterFieldKey]: typeof BILL_FILTER_FIELD_SPECS[K]['parser'] };

const fieldSchemas = Object.fromEntries(
  BILL_FILTER_FIELD_KEYS.map((key) => [key, BILL_FILTER_FIELD_SPECS[key].schema]),
) as { [K in BillFilterFieldKey]: typeof BILL_FILTER_FIELD_SPECS[K]['schema'] };

export const billFiltersSchema = z.object(fieldSchemas);

export type BillFilters = z.infer<typeof billFiltersSchema>;

export type BillFilterValue<K extends BillFilterFieldKey> = NonNullable<BillFilters[K]>;

export type BillStatusFilterValue = NonNullable<BillFilters['status']> extends readonly (infer S)[]
  ? S extends BillStatus ? S : never
  : never;

export const DEFAULT_BILL_PAGE_SIZE = 25;
export const BILL_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const paginationParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(DEFAULT_BILL_PAGE_SIZE),
};

export const billPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().refine(
    (size) => (BILL_PAGE_SIZE_OPTIONS as readonly number[]).includes(size),
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
