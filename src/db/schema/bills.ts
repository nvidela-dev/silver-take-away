import { sql } from "drizzle-orm";
import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { billStatusEnum } from "./enums";
import { users } from "./users";
import { vendors } from "./vendors";

export const bills = pgTable(
  "bills",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: billStatusEnum("status").notNull().default("draft"),
    invoiceNumber: text("invoice_number"),
    invoiceDate: date("invoice_date"),
    dueDate: date("due_date"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    description: text("description"),
    invoiceUrl: text("invoice_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bills_status_idx").on(table.status),
    index("bills_vendor_idx").on(table.vendorId),
    index("bills_due_date_idx").on(table.dueDate),
    index("bills_created_by_idx").on(table.createdBy),
  ],
);
