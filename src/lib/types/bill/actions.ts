// Bill state-machine actions. Consumed by lib/services/state-machine.ts
// to drive status transitions.

export type BillActionType = | 'submit_for_approval'
  | 'approve'
  | 'reject'
  | 'schedule_payment'
  | 'initiate_payment'
  | 'mark_as_paid'
  | 'cancel_payment'
  | 'retry_payment'
  | 'archive'
  | 'unschedule'
  | 'delete';
