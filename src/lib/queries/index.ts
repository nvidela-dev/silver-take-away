import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import {
  getBillFormOptions as getBillFormOptionsFromRepo,
  listDraftBills as listDraftBillsFromRepo,
} from '@/lib/repositories/bill.repo';

const BILL_DRAFT_VIEWER_ROLES = ['admin', 'owner', 'ap_clerk'] as const;

export async function listDraftBills() {
  assertDatabaseConfigured();
  const actor = await requireAuth();
  requireRole(actor, BILL_DRAFT_VIEWER_ROLES);
  return listDraftBillsFromRepo();
}

export async function getBillFormOptions() {
  assertDatabaseConfigured();
  const actor = await requireAuth();
  requireRole(actor, BILL_DRAFT_VIEWER_ROLES);
  return getBillFormOptionsFromRepo();
}
