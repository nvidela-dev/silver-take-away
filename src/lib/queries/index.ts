import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import {
  getBillFormOptions as getBillFormOptionsFromRepo,
  listBillsByStatuses as listBillsByStatusesFromRepo,
} from '@/lib/repositories/bills';

const BILL_VIEWER_ROLES = ['admin', 'owner', 'ap_clerk', 'approver'] as const;

async function gateBillRead() {
  assertDatabaseConfigured();
  const actor = await requireAuth();
  requireRole(actor, BILL_VIEWER_ROLES);
}

export async function listDraftBills(page?: number) {
  await gateBillRead();
  return listBillsByStatusesFromRepo(['draft'], page);
}

export async function listApprovalBills(page?: number) {
  await gateBillRead();
  return listBillsByStatusesFromRepo(['awaiting_approval'], page);
}

export async function listPaymentBills(page?: number) {
  await gateBillRead();
  return listBillsByStatusesFromRepo(['approved', 'scheduled', 'initiated'], page);
}

export async function getBillFormOptions() {
  await gateBillRead();
  return getBillFormOptionsFromRepo();
}
