// Roles allowed to drive payment-status transitions. Mirrors the bill
// approval role set today; tighten or split per action if/when the spec
// distinguishes (e.g. only owners may mark a payment as failed).
export const PAYMENT_TRANSITION_ROLES = ['admin', 'owner', 'ap_clerk'] as const;
