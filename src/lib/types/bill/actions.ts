// Bill state-machine actions. Consumed by lib/services/state-machine.ts
// to drive status transitions.

export const BILL_ACTIONS = [
  'submit_for_approval',
  'approve',
  'reject',
  'schedule_payment',
  'initiate_payment',
  'mark_as_paid',
  'cancel_payment',
  'retry_payment',
  'archive',
  'unschedule',
  'delete',
] as const;

export type BillActionType = (typeof BILL_ACTIONS)[number];
