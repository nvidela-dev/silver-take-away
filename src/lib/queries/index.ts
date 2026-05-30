import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import {
  getBillFilterOptions as getBillFilterOptionsFromRepo,
  getBillFormOptions as getBillFormOptionsFromRepo,
  listBills as listBillsFromRepo,
} from '@/lib/repositories/bills';
import type {
  BillFilters,
  BillListResult,
  BillPagination,
} from '@/lib/types/bill/filters';
import type { BillListItem } from '@/lib/types/bill/views';

const BILL_VIEWER_ROLES = ['admin', 'owner', 'ap_clerk', 'approver'] as const;

interface BillListArgs {
  filters?: BillFilters;
  pagination?: BillPagination;
}

async function gateBillRead() {
  assertDatabaseConfigured();
  const actor = await requireAuth();
  requireRole(actor, BILL_VIEWER_ROLES);
}

export async function listDraftBills(
  args: BillListArgs = {},
): Promise<BillListResult<BillListItem>> {
  await gateBillRead();
  return listBillsFromRepo({ statuses: ['draft'], ...args });
}

export async function listApprovalBills(
  args: BillListArgs = {},
): Promise<BillListResult<BillListItem>> {
  await gateBillRead();
  return listBillsFromRepo({ statuses: ['awaiting_approval'], ...args });
}

export async function listPaymentBills(
  args: BillListArgs = {},
): Promise<BillListResult<BillListItem>> {
  await gateBillRead();
  return listBillsFromRepo({
    statuses: ['approved', 'scheduled', 'initiated'],
    ...args,
  });
}

export async function getBillFormOptions() {
  await gateBillRead();
  return getBillFormOptionsFromRepo();
}

export async function getBillFilterOptions() {
  await gateBillRead();
  return getBillFilterOptionsFromRepo();
}
