import type { BillStatus } from '../enums';

export type BillFilterTab = 'drafts' | 'approvals' | 'payment';

export const PAYMENT_TAB_STATUSES: readonly BillStatus[] = ['approved', 'scheduled', 'initiated'];

export const STATUSES_BY_TAB = {
  drafts: ['draft'],
  approvals: ['awaiting_approval'],
  payment: PAYMENT_TAB_STATUSES,
} as const satisfies Record<BillFilterTab, readonly BillStatus[]>;
