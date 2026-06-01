// Pagination contract for the Bills overview tab. Each operational group
// shows a bounded slice of its bills and grows via a "Show more" control.
// Kept dependency-free (type-only import) so both the server page and the
// client overview component can share the param names and clamping.

import type { BillFilterTab } from './tabs';

// How many bills each group shows initially and how many each "Show more"
// click reveals.
export const OVERVIEW_GROUP_PAGE_SIZE = 5;

// Upper bound on how many bills a single group can expand to, guarding
// against a hand-edited URL forcing an unbounded query.
export const OVERVIEW_GROUP_MAX_SIZE = 100;

export function overviewCountParam(tab: BillFilterTab): string {
  return `${tab}Count`;
}

export function clampOverviewCount(value: number): number {
  if (!Number.isFinite(value)) return OVERVIEW_GROUP_PAGE_SIZE;
  const rounded = Math.floor(value);
  if (rounded < OVERVIEW_GROUP_PAGE_SIZE) return OVERVIEW_GROUP_PAGE_SIZE;
  return Math.min(rounded, OVERVIEW_GROUP_MAX_SIZE);
}
