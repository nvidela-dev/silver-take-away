import { sql } from "drizzle-orm";
import {
  integer,
  numeric,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { bills } from "./bills";
import { categories } from "./categories";

export const billLineItems = pgTable("bill_line_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: uuid("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  sortOrder: integer("sort_order").notNull().default(0),
});
