// Bill entity. Mirrors the `bills`, `bill_line_items`, and
// `bill_activity_log` tables in the database schema. Entity-only — no
// cross-domain references; composite/joined shapes live in ./views.

import type { BillStatus } from '../enums';

export interface Bill {
  id: string;
  vendorId: string;
  createdBy: string;
  status: BillStatus;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  amount: string;
  currency: string;
  description: string | null;
  invoiceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillLineItem {
  id: string;
  billId: string;
  description: string | null;
  amount: string;
  categoryId: string | null;
  sortOrder: number;
}

export interface BillActivityLog {
  id: string;
  billId: string;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
