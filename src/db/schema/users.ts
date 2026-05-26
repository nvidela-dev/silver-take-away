import { sql } from 'drizzle-orm';
import {
  pgTable, text, timestamp, uniqueIndex, uuid,
} from 'drizzle-orm/pg-core';

import { userRoleEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clerkId: text('clerk_id').notNull(),
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    role: userRoleEnum('role').notNull().default('employee'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('users_clerk_id_unique').on(table.clerkId)],
);
