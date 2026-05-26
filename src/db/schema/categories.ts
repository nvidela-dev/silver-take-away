import { sql } from 'drizzle-orm';
import {
  pgTable, text, timestamp, uniqueIndex, uuid,
} from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('categories_name_unique').on(table.name)],
);
