// Pagination contract for the Bills overview tab. Each operational group
// is its own compact, independently paginated slice so all groups stay
// visible in the viewport without vertical scrolling. Kept dependency-free
// (type-only import) so both the server page and the client overview
// component can share the param names and clamping.

import type { BillFilterTab } from './tabs';

// Rows shown per group page. Small on purpose: three stacked groups each
// need to fit on screen at once.
export const OVERVIEW_GROUP_PAGE_SIZE = 4;

export function overviewPageParam(tab: BillFilterTab): string {
  return `${tab}Page`;
}

export function clampOverviewPage(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const rounded = Math.floor(value);
  return rounded < 1 ? 1 : rounded;
}
