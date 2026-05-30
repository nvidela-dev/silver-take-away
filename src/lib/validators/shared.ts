import { z } from 'zod';

import type { PaymentMethodType, PaymentStatus } from '@/lib/types/enums';

export const uuidSchema = z.guid();

/**
 * Money as a decimal string with up to 2 fractional digits. Matches
 * `numeric(12,2)` on the DB side: max 10 integer digits, 2 fractional digits.
 * Stored as a string throughout to avoid float precision loss.
 */
export const moneyStringSchema = z
  .string()
  .regex(
    /^\d{1,10}(\.\d{1,2})?$/,
    'Amount must be a decimal with up to 2 fractional digits.',
  );

export const positiveMoneyStringSchema = moneyStringSchema.refine(
  (value) => Number(value) > 0,
  'Amount must be greater than zero.',
);

export const nonNegativeMoneyStringSchema = moneyStringSchema.refine(
  (value) => Number(value) >= 0,
  'Amount must not be negative.',
);

/** ISO 8601 date (YYYY-MM-DD). Drizzle's `date` column expects this format. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.');

export const paymentMethodSchema = z.enum([
  'ach',
  'wire',
  'check',
  'card',
]) satisfies z.ZodType<PaymentMethodType>;

export const paymentStatusSchema = z.enum([
  'pending',
  'scheduled',
  'initiated',
  'in_transit',
  'paid',
  'failed',
  'cancelled',
]) satisfies z.ZodType<PaymentStatus>;

/** Sums an array of money strings to a 2-decimal-rounded number. */
export function sumMoneyStrings(values: readonly string[]): number {
  // Sum as cents to avoid float drift, then divide back at the end.
  const totalCents = values.reduce((acc, value) => {
    const [whole, frac = ''] = value.split('.');
    const paddedFrac = (`${frac}00`).slice(0, 2);
    return acc + Number(whole) * 100 + Number(paddedFrac);
  }, 0);
  return totalCents / 100;
}

/** True when two money strings represent the same value to 2 decimals. */
export function moneyStringsEqual(a: string, b: string): boolean {
  return sumMoneyStrings([a]) === sumMoneyStrings([b]);
}
