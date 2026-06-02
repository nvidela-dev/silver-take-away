import { sql } from 'drizzle-orm';
import {
  index, jsonb, pgTable, text, timestamp, uuid,
} from 'drizzle-orm/pg-core';

import { payments } from './payments';
import { users } from './users';

export const paymentActivityLog = pgTable(
  'payment_activity_log',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('payment_activity_log_payment_idx').on(table.paymentId)],
);
