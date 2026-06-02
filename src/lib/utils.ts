import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO date (`YYYY-MM-DD`) into a locale-aware date string.
 */
export function formatDate(value: string, locale = 'en-US'): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString(locale);
}

/**
 * Formats a count with its noun: `pluralize(1, 'bill')` → "1 bill",
 * `pluralize(3, 'bill')` → "3 bills". Pass an explicit plural for irregulars.
 */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Formats a money decimal string (`numeric(12,2)` shape) for display.
 */
export function formatMoney(
  amount: string,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}
