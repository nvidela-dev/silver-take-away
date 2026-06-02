import type { PaymentStatus } from '../enums';

// Operational tabs for the Payments workspace. Mirrors the 3-tab
// structure used on Bills. Grouping is intentionally coarse — failures
// and cancellations live under `completed` because they are terminal
// states, not actions the user needs to triage in their own column.
// Revisit if/when the workspace gets a dedicated "issues" tab.
export type PaymentFilterTab = 'upcoming' | 'processing' | 'completed';

export const STATUSES_BY_TAB = {
  upcoming: ['pending', 'scheduled'],
  processing: ['initiated', 'in_transit'],
  completed: ['paid', 'failed', 'cancelled'],
} as const satisfies Record<PaymentFilterTab, readonly PaymentStatus[]>;
