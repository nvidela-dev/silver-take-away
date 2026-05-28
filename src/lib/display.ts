import type {
  BillStatus,
  PaymentMethodType,
  PaymentStatus,
  StatusDisplayMeta,
  UserRole,
} from '@/types';

export const billStatusDisplay = {
  draft: { label: 'Draft', tone: 'slate' },
  awaiting_approval: { label: 'Awaiting approval', tone: 'amber' },
  approved: { label: 'Approved', tone: 'blue' },
  scheduled: { label: 'Ready for payment', tone: 'sky' },
  initiated: { label: 'Initiated', tone: 'violet' },
  paid: { label: 'Paid', tone: 'emerald' },
  archived: { label: 'Archived', tone: 'slate' },
  rejected: { label: 'Rejected', tone: 'rose' },
  payment_failed: { label: 'Payment failed', tone: 'rose' },
} as const satisfies Record<BillStatus, StatusDisplayMeta>;

export const paymentStatusDisplay = {
  pending: { label: 'Pending', tone: 'amber' },
  scheduled: { label: 'Scheduled', tone: 'sky' },
  initiated: { label: 'Initiated', tone: 'violet' },
  in_transit: { label: 'In transit', tone: 'blue' },
  paid: { label: 'Paid', tone: 'emerald' },
  failed: { label: 'Failed', tone: 'rose' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
} as const satisfies Record<PaymentStatus, StatusDisplayMeta>;

export const paymentMethodDisplay = {
  ach: { label: 'ACH', tone: 'blue' },
  wire: { label: 'Wire', tone: 'violet' },
  check: { label: 'Check', tone: 'amber' },
  card: { label: 'Card', tone: 'emerald' },
} as const satisfies Record<PaymentMethodType, StatusDisplayMeta>;

export const userRoleDisplay = {
  admin: { label: 'Admin', tone: 'rose' },
  owner: { label: 'Owner', tone: 'violet' },
  ap_clerk: { label: 'AP Clerk', tone: 'blue' },
  approver: { label: 'Approver', tone: 'amber' },
  employee: { label: 'Employee', tone: 'slate' },
} as const satisfies Record<UserRole, StatusDisplayMeta>;
