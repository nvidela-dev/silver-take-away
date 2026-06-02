// Server-action / use-case input shapes for the payments workspace.
// Wire format: decimal amounts as strings, dates as ISO YYYY-MM-DD.

import type { PaymentMethodType } from '../enums';

export interface SchedulePaymentInput {
  billId: string;
  paymentMethod: PaymentMethodType;
  scheduledDate: string;
}

export interface UpdatePaymentInput {
  id: string;
  expectedUpdatedAt?: string;
  paymentMethod?: PaymentMethodType;
  scheduledDate?: string;
}

export interface CancelPaymentInput {
  paymentId: string;
  note?: string;
}

export interface RetryPaymentInput {
  paymentId: string;
  scheduledDate?: string;
}

export interface BulkSchedulePaymentsInput {
  paymentIds: string[];
  scheduledDate: string;
}

export interface BulkCancelPaymentsInput {
  paymentIds: string[];
  note?: string;
}

export interface BulkUpdatePaymentsInput {
  paymentIds: string[];
  paymentMethod?: PaymentMethodType;
  scheduledDate?: string;
}
