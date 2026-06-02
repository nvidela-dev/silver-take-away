// Payment state-machine actions. Consumed by lib/services/payment-state-machine.ts
// to drive payment status transitions.

export type PaymentActionType = | 'initiate'
  | 'cancel'
  | 'mark_paid'
  | 'mark_failed'
  | 'retry';
