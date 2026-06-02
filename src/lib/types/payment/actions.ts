// Payment state-machine actions. Consumed by lib/services/payment-state-machine.ts
// to drive payment status transitions.

export const PAYMENT_ACTIONS = [
  'initiate',
  'cancel',
  'mark_paid',
  'mark_failed',
  'retry',
] as const;

export type PaymentActionType = (typeof PAYMENT_ACTIONS)[number];
