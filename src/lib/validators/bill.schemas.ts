import { z } from 'zod';

import {
  isoDateSchema,
  positiveMoneyStringSchema,
  sumMoneyStrings,
  uuidSchema,
} from './shared';

const lineItemInputSchema = z.object({
  id: uuidSchema.optional(),
  description: z.string().max(500).optional(),
  amount: positiveMoneyStringSchema,
  categoryId: uuidSchema.optional(),
});

const billCoreFields = {
  invoiceNumber: z.string().min(1).max(50).optional(),
  invoiceDate: isoDateSchema.optional(),
  dueDate: isoDateSchema.optional(),
  currency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code.')
    .default('USD'),
  description: z.string().max(2000).optional(),
  invoiceUrl: z.url().optional(),
};

export const createBillSchema = z
  .object({
    vendorId: uuidSchema,
    amount: positiveMoneyStringSchema,
    ...billCoreFields,
    lineItems: z.array(lineItemInputSchema).min(1, 'At least one line item is required.'),
  })
  .refine(
    (data) => sumMoneyStrings(data.lineItems.map((li) => li.amount)) === Number(data.amount),
    {
      message: 'Line item amounts must sum to the bill total.',
      path: ['lineItems'],
    },
  );

export const updateBillSchema = z
  .object({
    id: uuidSchema,
    expectedUpdatedAt: z.iso.datetime().optional(),
    amount: positiveMoneyStringSchema.optional(),
    invoiceNumber: z.string().min(1).max(50).optional(),
    invoiceDate: isoDateSchema.optional(),
    dueDate: isoDateSchema.optional(),
    currency: z
      .string()
      .length(3)
      .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code.')
      .optional(),
    description: z.string().max(2000).optional(),
    invoiceUrl: z.url().optional(),
    lineItems: z.array(lineItemInputSchema).min(1).optional(),
  })
  .refine(
    (data) => {
      if (!data.lineItems || !data.amount) return true;
      return (
        sumMoneyStrings(data.lineItems.map((li) => li.amount))
        === Number(data.amount)
      );
    },
    {
      message: 'Line item amounts must sum to the bill total.',
      path: ['lineItems'],
    },
  );

export const bulkEditBillsSchema = z
  .object({
    billIds: z.array(uuidSchema).min(1).max(100),
    dueDate: isoDateSchema.optional(),
    invoiceDate: isoDateSchema.optional(),
    amount: positiveMoneyStringSchema.optional(),
    description: z.string().max(2000).optional(),
    categoryId: uuidSchema.optional(),
  })
  .refine(
    (data) => data.dueDate !== undefined
      || data.invoiceDate !== undefined
      || data.amount !== undefined
      || data.description !== undefined
      || data.categoryId !== undefined,
    { message: 'At least one field must be provided to bulk edit.' },
  );

export const billIdSchema = uuidSchema;

export const approveRejectSchema = z.object({
  billId: uuidSchema,
  note: z.string().max(1000).optional(),
});

export const billIdListSchema = z.array(uuidSchema).min(1).max(100);

export type CreateBillSchema = z.infer<typeof createBillSchema>;
export type UpdateBillSchema = z.infer<typeof updateBillSchema>;
export type BulkEditBillsSchema = z.infer<typeof bulkEditBillsSchema>;
export type ApproveRejectSchema = z.infer<typeof approveRejectSchema>;
