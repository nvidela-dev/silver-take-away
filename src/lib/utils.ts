import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a money string for display. Defaults to USD, en-US. */
export function formatMoney(
  amount: string | number,
  currency = "USD",
  locale = "en-US",
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/** Formats an ISO date string (YYYY-MM-DD) for display, e.g. "Mar 5, 2026". */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  return format(parseISO(isoDate), "MMM d, yyyy");
}

/** True when an ISO due date is strictly before today (no time component). */
export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseISO(dueDate).getTime() < today.getTime();
}
