import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import {
  getBillReferenceData as getBillReferenceDataFromRepo,
  getBillStatusAggregates as getBillStatusAggregatesFromRepo,
  listBills as listBillsFromRepo,
} from '@/lib/repositories/bills';
import { STATUSES_BY_TAB } from '@/lib/types/bill/tabs';
import type {
  BillFilters,
  BillListResult,
  BillPagination,
  BillReferenceData,
  BillStatusAggregate,
} from '@/lib/types/bill/filters';
import type { BillFilterTab } from '@/lib/types/bill/tabs';
import type { BillStatus } from '@/lib/types/enums';
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

export async function listBillsForTab(
  tab: BillFilterTab,
  args: BillListArgs = {},
): Promise<BillListResult<BillListItem>> {
  await gateBillRead();
  return listBillsFromRepo({ statuses: STATUSES_BY_TAB[tab], ...args });
}

export async function getBillReferenceData(): Promise<BillReferenceData> {
  await gateBillRead();
  return getBillReferenceDataFromRepo();
}

const OVERVIEW_STATUSES: readonly BillStatus[] = [
  ...STATUSES_BY_TAB.drafts,
  ...STATUSES_BY_TAB.approvals,
  ...STATUSES_BY_TAB.payment,
];

export async function getBillOverviewAggregates(): Promise<BillStatusAggregate[]> {
  await gateBillRead();
  return getBillStatusAggregatesFromRepo(OVERVIEW_STATUSES);
}
