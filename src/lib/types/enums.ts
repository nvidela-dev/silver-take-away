// Domain enums. Mirrors the Postgres enums in src/db/schema/enums.ts —
// keep these in sync. Lives in its own file so the entity modules (user,
// vendor, payment, bill) can import enums without importing each other.

export type UserRole = | 'admin'
  | 'owner'
  | 'ap_clerk'
  | 'approver'
  | 'employee';

export type BillStatus = | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'scheduled'
  | 'initiated'
  | 'paid'
  | 'archived'
  | 'rejected'
  | 'payment_failed';

export type PaymentMethodType = 'ach' | 'wire' | 'check' | 'card';

export type PaymentStatus = | 'pending'
  | 'scheduled'
  | 'initiated'
  | 'in_transit'
  | 'paid'
  | 'failed'
  | 'cancelled';
