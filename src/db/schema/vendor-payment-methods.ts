import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { paymentMethodTypeEnum } from "./enums";
import { vendors } from "./vendors";

export const vendorPaymentMethods = pgTable("vendor_payment_methods", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  methodType: paymentMethodTypeEnum("method_type").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  bankName: text("bank_name"),
  accountNumberLast4: text("account_number_last4"),
  routingNumberLast4: text("routing_number_last4"),
  mailingAddress: text("mailing_address"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
