import {
  billStatusDisplay,
  paymentMethodDisplay,
  paymentStatusDisplay,
  userRoleDisplay,
} from '@/app/_display';
import type { SurfaceTone } from '@/app/_types/style';
import type {
  BillStatus,
  PaymentMethodType,
  PaymentStatus,
  UserRole,
} from '@/lib/types/enums';

const billStatuses: BillStatus[] = [
  'draft',
  'awaiting_approval',
  'approved',
  'scheduled',
  'initiated',
  'paid',
  'archived',
  'rejected',
  'payment_failed',
];

const paymentStatuses: PaymentStatus[] = [
  'pending',
  'scheduled',
  'initiated',
  'in_transit',
  'paid',
  'failed',
  'cancelled',
];

const paymentMethods: PaymentMethodType[] = ['ach', 'wire', 'check', 'card'];

const userRoles: UserRole[] = [
  'admin',
  'owner',
  'ap_clerk',
  'approver',
  'employee',
];

const tones: SurfaceTone[] = [
  'slate',
  'sky',
  'blue',
  'amber',
  'emerald',
  'rose',
  'violet',
];

describe('display metadata maps', () => {
  it('covers every domain status and role with a label and tone', () => {
    const entries = [
      ...billStatuses.map((status) => billStatusDisplay[status]),
      ...paymentStatuses.map((status) => paymentStatusDisplay[status]),
      ...paymentMethods.map((method) => paymentMethodDisplay[method]),
      ...userRoles.map((role) => userRoleDisplay[role]),
    ];

    for (const meta of entries) {
      expect(meta.label).toEqual(expect.any(String));
      expect(meta.label.length).toBeGreaterThan(0);
      expect(tones).toContain(meta.tone);
    }
  });
});
