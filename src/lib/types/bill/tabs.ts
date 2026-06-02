import type { BillStatus } from '../enums';

export type BillFilterTab = 'drafts' | 'approvals' | 'payment' | 'history';

// The operational groups shown on the Bills overview. History is terminal
// and intentionally excluded from the overview.
export type OverviewGroupTab = Exclude<BillFilterTab, 'history'>;

export const PAYMENT_TAB_STATUSES: readonly BillStatus[] = ['approved', 'scheduled', 'initiated'];

// Terminal bills, kept for audit. Paid + archived live together under History.
export const HISTORY_TAB_STATUSES: readonly BillStatus[] = ['paid', 'archived'];

export const STATUSES_BY_TAB = {
  drafts: ['draft'],
  approvals: ['awaiting_approval'],
  payment: PAYMENT_TAB_STATUSES,
  history: HISTORY_TAB_STATUSES,
} as const satisfies Record<BillFilterTab, readonly BillStatus[]>;
