// Payment domain. Mirrors the `payments` and `payment_activity_log`
// tables in the database schema. Entity-only — no cross-domain
// references; composite/joined shapes live in ./views.

import type { PaymentMethodType, PaymentStatus } from '../enums';

export interface Payment {
  id: string;
  billId: string;
  createdBy: string;
  amount: string;
  currency: string;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  scheduledDate: string | null;
  initiatedDate: Date | null;
  arrivalDate: string | null;
  cancelledAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentActivityLog {
  id: string;
  paymentId: string;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
