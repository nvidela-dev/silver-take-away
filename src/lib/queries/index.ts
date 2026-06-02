import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import {
  getBillReferenceData as getBillReferenceDataFromRepo,
  getBillStatusAggregates as getBillStatusAggregatesFromRepo,
  listBills as listBillsFromRepo,
} from '@/lib/repositories/bills';
import {
  getPaymentReferenceData as getPaymentReferenceDataFromRepo,
  getPaymentStatusAggregates as getPaymentStatusAggregatesFromRepo,
  listPayments as listPaymentsFromRepo,
} from '@/lib/repositories/payments';
import { OVERVIEW_GROUP_PAGE_SIZE } from '@/lib/types/bill/overview';
import { STATUSES_BY_TAB } from '@/lib/types/bill/tabs';
import { STATUSES_BY_TAB as PAYMENT_STATUSES_BY_TAB } from '@/lib/types/payment/tabs';
import type {
  BillFilters,
  BillListResult,
  BillOverviewGroup,
  BillPagination,
  BillReferenceData,
  BillSort,
  BillStatusAggregate,
} from '@/lib/types/bill/filters';
import type { BillFilterTab } from '@/lib/types/bill/tabs';
import type { BillStatus, PaymentStatus } from '@/lib/types/enums';
import type { BillListItem } from '@/lib/types/bill/views';
import type {
  PaymentFilters,
  PaymentListResult,
  PaymentPagination,
  PaymentReferenceData,
  PaymentSort,
  PaymentStatusAggregate,
} from '@/lib/types/payment/filters';
import type { PaymentFilterTab } from '@/lib/types/payment/tabs';
import type { PaymentListItem } from '@/lib/types/payment/views';
import { scopedFiltersForTab } from '@/lib/validators/bill-filter-spec';

const BILL_VIEWER_ROLES = ['admin', 'owner', 'ap_clerk', 'approver'] as const;
const PAYMENT_VIEWER_ROLES = ['admin', 'owner', 'ap_clerk', 'approver'] as const;

interface BillListArgs {
  filters?: BillFilters;
  pagination?: BillPagination;
  sort?: BillSort;
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
  return listBillsFromRepo({
    statuses: STATUSES_BY_TAB[tab],
    filters: args.filters,
    pagination: args.pagination,
    sort: args.sort,
  });
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

// Ordered operational groups shown on the Bills overview tab.
const OVERVIEW_GROUP_TABS: readonly BillFilterTab[] = ['drafts', 'approvals', 'payment'];

export async function listBillOverviewGroups(
  args: {
    filters?: BillFilters;
    sort?: BillSort;
    pages?: Partial<Record<BillFilterTab, number>>;
  } = {},
): Promise<BillOverviewGroup[]> {
  await gateBillRead();
  const results = await Promise.all(
    OVERVIEW_GROUP_TABS.map((tab) => listBillsFromRepo({
      statuses: STATUSES_BY_TAB[tab],
      filters: args.filters ? scopedFiltersForTab(tab, args.filters) : undefined,
      sort: args.sort,
      pagination: {
        page: args.pages?.[tab] ?? 1,
        pageSize: OVERVIEW_GROUP_PAGE_SIZE,
      },
    })),
  );
  return OVERVIEW_GROUP_TABS.map((tab, index) => ({ tab, result: results[index] }));
}

interface PaymentListArgs {
  filters?: PaymentFilters;
  pagination?: PaymentPagination;
  sort?: PaymentSort;
}

async function gatePaymentRead() {
  assertDatabaseConfigured();
  const actor = await requireAuth();
  requireRole(actor, PAYMENT_VIEWER_ROLES);
}

export async function listPaymentsForTab(
  tab: PaymentFilterTab,
  args: PaymentListArgs = {},
): Promise<PaymentListResult<PaymentListItem>> {
  await gatePaymentRead();
  return listPaymentsFromRepo({
    statuses: PAYMENT_STATUSES_BY_TAB[tab],
    filters: args.filters,
    pagination: args.pagination,
    sort: args.sort,
  });
}

export async function getPaymentReferenceData(): Promise<PaymentReferenceData> {
  await gatePaymentRead();
  return getPaymentReferenceDataFromRepo();
}

const PAYMENT_OVERVIEW_STATUSES: readonly PaymentStatus[] = [
  ...PAYMENT_STATUSES_BY_TAB.upcoming,
  ...PAYMENT_STATUSES_BY_TAB.processing,
  ...PAYMENT_STATUSES_BY_TAB.completed,
];

export async function getPaymentOverviewAggregates(): Promise<PaymentStatusAggregate[]> {
  await gatePaymentRead();
  return getPaymentStatusAggregatesFromRepo(PAYMENT_OVERVIEW_STATUSES);
}
