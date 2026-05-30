// Payment domain. Mirrors the `payments` table in the database schema.
//
// `Payment` is the entity (no cross-domain references). Composite views
// that join Payment with Bill or Vendor live alongside the other relations
// in bill/views.ts — this keeps the dependency graph one-way (bill/views
// imports payment; payment never imports bill/views).

import type { PaymentMethodType, PaymentStatus } from './enums';

export interface Payment {
  id: string;
  billId: string;
  createdBy: string;
  amount: string;
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

export interface SchedulePaymentInput {
  billId: string;
  paymentMethod: PaymentMethodType;
  scheduledDate: string;
}

export interface PaymentFilters {
  search?: string;
  vendorId?: string;
  status?: PaymentStatus[];
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: PaymentMethodType;
  arrivalDateFrom?: string;
  arrivalDateTo?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}
