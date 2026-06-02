import { sql } from 'drizzle-orm';
import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { paymentMethodTypeEnum, paymentStatusEnum } from './enums';
import { bills } from './bills';
import { users } from './users';

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    billId: uuid('bill_id')
      .notNull()
      .references(() => bills.id, { onDelete: 'restrict' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    paymentMethod: paymentMethodTypeEnum('payment_method').notNull(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    scheduledDate: date('scheduled_date'),
    initiatedDate: timestamp('initiated_date', { withTimezone: true }),
    arrivalDate: date('arrival_date'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('payments_bill_idx').on(table.billId),
    index('payments_created_by_idx').on(table.createdBy),
    index('payments_status_idx').on(table.status),
    index('payments_scheduled_date_idx').on(table.scheduledDate),
  ],
);
