import { z } from 'zod';

import { isoDateSchema, paymentMethodSchema, uuidSchema } from './shared';

export const schedulePaymentSchema = z.object({
  billId: uuidSchema,
  paymentMethod: paymentMethodSchema,
  scheduledDate: isoDateSchema,
});

export const paymentIdSchema = uuidSchema;

export const editPaymentDateSchema = z.object({
  paymentId: uuidSchema,
  scheduledDate: isoDateSchema,
});

const noteField = z.string().max(1000);
const paymentIdListSchema = z.array(uuidSchema).min(1).max(100);

export const initiatePaymentSchema = z.object({
  paymentId: uuidSchema,
  note: noteField.optional(),
});

export const cancelPaymentSchema = z.object({
  paymentId: uuidSchema,
  note: noteField.optional(),
});

export const markPaidPaymentSchema = z.object({
  paymentId: uuidSchema,
  note: noteField.optional(),
});

export const markFailedPaymentSchema = z.object({
  paymentId: uuidSchema,
  note: noteField.min(1, 'A failure reason is required.'),
});

export const retryPaymentSchema = z.object({
  paymentId: uuidSchema,
  note: noteField.optional(),
});

export const bulkInitiatePaymentsSchema = z.object({
  paymentIds: paymentIdListSchema,
  note: noteField.optional(),
});

export const bulkCancelPaymentsSchema = z.object({
  paymentIds: paymentIdListSchema,
  note: noteField.optional(),
});

export const bulkMarkPaidPaymentsSchema = z.object({
  paymentIds: paymentIdListSchema,
  note: noteField.optional(),
});

export const bulkMarkFailedPaymentsSchema = z.object({
  paymentIds: paymentIdListSchema,
  note: noteField.min(1, 'A failure reason is required.'),
});

export const bulkRetryPaymentsSchema = z.object({
  paymentIds: paymentIdListSchema,
  note: noteField.optional(),
});

export type SchedulePaymentSchema = z.infer<typeof schedulePaymentSchema>;
export type EditPaymentDateSchema = z.infer<typeof editPaymentDateSchema>;
export type InitiatePaymentSchema = z.infer<typeof initiatePaymentSchema>;
export type CancelPaymentSchema = z.infer<typeof cancelPaymentSchema>;
export type MarkPaidPaymentSchema = z.infer<typeof markPaidPaymentSchema>;
export type MarkFailedPaymentSchema = z.infer<typeof markFailedPaymentSchema>;
export type RetryPaymentSchema = z.infer<typeof retryPaymentSchema>;
export type BulkInitiatePaymentsSchema = z.infer<typeof bulkInitiatePaymentsSchema>;
export type BulkCancelPaymentsSchema = z.infer<typeof bulkCancelPaymentsSchema>;
export type BulkMarkPaidPaymentsSchema = z.infer<typeof bulkMarkPaidPaymentsSchema>;
export type BulkMarkFailedPaymentsSchema = z.infer<typeof bulkMarkFailedPaymentsSchema>;
export type BulkRetryPaymentsSchema = z.infer<typeof bulkRetryPaymentsSchema>;
