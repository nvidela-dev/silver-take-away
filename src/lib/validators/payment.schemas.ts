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

export type SchedulePaymentSchema = z.infer<typeof schedulePaymentSchema>;
export type EditPaymentDateSchema = z.infer<typeof editPaymentDateSchema>;
