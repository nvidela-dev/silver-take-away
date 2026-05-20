import { z } from "zod";

import { paymentMethodSchema, uuidSchema } from "./shared";

const vendorPaymentMethodInputSchema = z.object({
  methodType: paymentMethodSchema,
  isDefault: z.boolean().optional(),
  bankName: z.string().max(100).optional(),
  accountNumberLast4: z
    .string()
    .regex(/^\d{4}$/, "Must be 4 digits.")
    .optional(),
  routingNumberLast4: z
    .string()
    .regex(/^\d{4}$/, "Must be 4 digits.")
    .optional(),
  mailingAddress: z.string().max(500).optional(),
});

export const createVendorSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.email().optional(),
    ownerId: uuidSchema.optional(),
    paymentMethods: z.array(vendorPaymentMethodInputSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.paymentMethods) return true;
      const defaults = data.paymentMethods.filter((pm) => pm.isDefault === true);
      return defaults.length <= 1;
    },
    {
      message: "Only one payment method may be marked as default.",
      path: ["paymentMethods"],
    },
  );

export const updateVendorSchema = z
  .object({
    id: uuidSchema,
    name: z.string().min(1).max(200).optional(),
    email: z.email().optional(),
    ownerId: uuidSchema.nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.ownerId !== undefined,
    { message: "At least one field must be provided to update." },
  );

export const vendorIdSchema = uuidSchema;

export const setDefaultPaymentMethodSchema = z.object({
  vendorId: uuidSchema,
  paymentMethodId: uuidSchema,
});

export type CreateVendorSchema = z.infer<typeof createVendorSchema>;
export type UpdateVendorSchema = z.infer<typeof updateVendorSchema>;
export type SetDefaultPaymentMethodSchema = z.infer<typeof setDefaultPaymentMethodSchema>;
