import { sql } from 'drizzle-orm';
import {
  index, jsonb, pgTable, text, timestamp, uuid,
} from 'drizzle-orm/pg-core';

import { bills } from './bills';
import { users } from './users';

export const billActivityLog = pgTable(
  'bill_activity_log',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    billId: uuid('bill_id')
      .notNull()
      .references(() => bills.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('bill_activity_log_bill_idx').on(table.billId)],
);
