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

const draftLineItemFormSchema = z.object({
  id: z.string().optional(),
  description: z.string().max(500),
  amount: z.string(),
  categoryId: z.string(),
});

const draftBillOptionalTextFieldSchema = z.string().max(2000);

function optionalFormString(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export const draftBillFormSchema = z
  .object({
    vendorId: z.string().min(1, 'Vendor is required.'),
    amount: z.string(),
    invoiceNumber: z.string().max(50),
    invoiceDate: z.string(),
    dueDate: z.string(),
    currency: z
      .string()
      .length(3)
      .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code.'),
    description: draftBillOptionalTextFieldSchema,
    invoiceUrl: z.string(),
    lineItems: z.array(draftLineItemFormSchema).min(1, 'At least one line item is required.'),
  })
  .superRefine((data, ctx) => {
    const parsedAmount = positiveMoneyStringSchema.safeParse(data.amount);
    if (!parsedAmount.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Amount must be a positive value with up to 2 decimals.',
        path: ['amount'],
      });
    }

    data.lineItems.forEach((lineItem, index) => {
      const parsedLineAmount = positiveMoneyStringSchema.safeParse(lineItem.amount);
      if (!parsedLineAmount.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Amount must be a positive value with up to 2 decimals.',
          path: ['lineItems', index, 'amount'],
        });
      }

      if (lineItem.categoryId && !uuidSchema.safeParse(lineItem.categoryId).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Category must be a valid selection.',
          path: ['lineItems', index, 'categoryId'],
        });
      }
    });

    if (data.invoiceDate && !isoDateSchema.safeParse(data.invoiceDate).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invoice date must be an ISO date.',
        path: ['invoiceDate'],
      });
    }
    if (data.dueDate && !isoDateSchema.safeParse(data.dueDate).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due date must be an ISO date.',
        path: ['dueDate'],
      });
    }
    if (data.invoiceUrl && !z.url().safeParse(data.invoiceUrl).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invoice URL must be a valid URL.',
        path: ['invoiceUrl'],
      });
    }

    if (
      parsedAmount.success
      && data.lineItems.every((li) => positiveMoneyStringSchema.safeParse(li.amount).success)
      && sumMoneyStrings(data.lineItems.map((li) => li.amount)) !== Number(data.amount)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Line item amounts must sum to the bill total.',
        path: ['lineItems'],
      });
    }
  })
  .transform((data) => {
    const invoiceNumber = optionalFormString(data.invoiceNumber);
    const invoiceDate = optionalFormString(data.invoiceDate);
    const dueDate = optionalFormString(data.dueDate);
    const description = optionalFormString(data.description);
    const invoiceUrl = optionalFormString(data.invoiceUrl);

    return {
      vendorId: data.vendorId,
      amount: data.amount,
      currency: data.currency || 'USD',
      ...(invoiceNumber ? { invoiceNumber } : {}),
      ...(invoiceDate ? { invoiceDate } : {}),
      ...(dueDate ? { dueDate } : {}),
      ...(description ? { description } : {}),
      ...(invoiceUrl ? { invoiceUrl } : {}),
      lineItems: data.lineItems.map((lineItem) => {
        const lineDescription = optionalFormString(lineItem.description);
        const categoryId = optionalFormString(lineItem.categoryId);

        return {
          amount: lineItem.amount,
          ...(lineDescription ? { description: lineDescription } : {}),
          ...(categoryId ? { categoryId } : {}),
        };
      }),
    };
  });

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

const expectedUpdatedAtField = z.iso.datetime().optional();
const noteField = z.string().max(1000);

export const submitForApprovalSchema = z.object({
  billId: uuidSchema,
  expectedUpdatedAt: expectedUpdatedAtField,
});

export const approveBillSchema = z.object({
  billId: uuidSchema,
  expectedUpdatedAt: expectedUpdatedAtField,
  note: noteField.optional(),
});

export const rejectBillSchema = z.object({
  billId: uuidSchema,
  expectedUpdatedAt: expectedUpdatedAtField,
  note: noteField.min(1, 'A rejection note is required.'),
});

export const billIdListSchema = z.array(uuidSchema).min(1).max(100);

export type CreateBillSchema = z.infer<typeof createBillSchema>;
export type DraftBillFormInput = z.input<typeof draftBillFormSchema>;
export type DraftBillFormValues = z.output<typeof draftBillFormSchema>;
export type UpdateBillSchema = z.infer<typeof updateBillSchema>;
export type BulkEditBillsSchema = z.infer<typeof bulkEditBillsSchema>;
export type SubmitForApprovalSchema = z.infer<typeof submitForApprovalSchema>;
export type ApproveBillSchema = z.infer<typeof approveBillSchema>;
export type RejectBillSchema = z.infer<typeof rejectBillSchema>;
