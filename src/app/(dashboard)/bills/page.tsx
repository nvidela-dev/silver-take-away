import {
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/auth';
import { billTabs } from '@/app/_navigation';
import {
  getBillFilterOptions,
  getBillFormOptions,
  listApprovalBills,
  listDraftBills,
  listPaymentBills,
} from '@/lib/queries';
import {
  billFiltersSchema,
  billPaginationSchema,
  DEFAULT_BILL_PAGE_SIZE,
} from '@/lib/validators/bill.schemas';
import type { BillFilters, BillPagination } from '@/lib/types/bill/filters';

import { BillsWorkspace } from './_components';

interface BillsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type BillTabValue = 'overview' | 'drafts' | 'approvals' | 'payment';

function resolveActiveTab(tab: string | string[] | undefined): BillTabValue {
  const value = Array.isArray(tab) ? tab[0] : tab;

  if (value && billTabs.some((item) => item.value === value)) {
    return value as BillTabValue;
  }

  return 'drafts';
}

function flattenSearchParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] ?? '' : value as string]),
  );
}

function parseFilters(params: Record<string, string>): BillFilters {
  const result = billFiltersSchema.safeParse(params);
  return result.success ? result.data : {};
}

function parsePagination(params: Record<string, string>): BillPagination {
  const result = billPaginationSchema.safeParse(params);
  return result.success
    ? result.data
    : { page: 1, pageSize: DEFAULT_BILL_PAGE_SIZE };
}

const emptyListResult = { items: [], total: 0 };

async function loadBillWorkspaceData(
  activeTab: BillTabValue,
  filters: BillFilters,
  pagination: BillPagination,
) {
  const isDraftsActive = activeTab === 'drafts';
  const isApprovalsActive = activeTab === 'approvals';
  const isPaymentActive = activeTab === 'payment';

  try {
    const [
      draftBills,
      approvalBills,
      paymentBills,
      billFormOptions,
      billFilterOptions,
    ] = await Promise.all([
      listDraftBills(isDraftsActive ? { filters, pagination } : {}),
      listApprovalBills(isApprovalsActive ? { filters, pagination } : {}),
      listPaymentBills(isPaymentActive ? { filters, pagination } : {}),
      getBillFormOptions(),
      getBillFilterOptions(),
    ]);
    return {
      draftBills,
      approvalBills,
      paymentBills,
      billFormOptions,
      billFilterOptions,
      loadError: null,
    };
  } catch (error) {
    let loadError = 'Bills could not be loaded. Check the database connection.';
    if (error instanceof UnauthorizedError) {
      loadError = 'Sign in before creating or viewing bills.';
    }
    if (error instanceof ForbiddenError) {
      loadError = 'Your account needs Bill Pay access before creating or viewing bills.';
    }

    return {
      draftBills: emptyListResult,
      approvalBills: emptyListResult,
      paymentBills: emptyListResult,
      billFormOptions: { vendors: [], categories: [] },
      billFilterOptions: { vendors: [], owners: [], categories: [] },
      loadError,
    };
  }
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const activeTab = resolveActiveTab(params.tab);
  const flatParams = flattenSearchParams(params);
  const filters = parseFilters(flatParams);
  const pagination = parsePagination(flatParams);
  const workspaceData = await loadBillWorkspaceData(activeTab, filters, pagination);

  return (
    <BillsWorkspace
      activeTab={activeTab}
      approvalBills={workspaceData.approvalBills}
      draftBills={workspaceData.draftBills}
      filterOptions={workspaceData.billFilterOptions}
      loadError={workspaceData.loadError}
      options={workspaceData.billFormOptions}
      paymentBills={workspaceData.paymentBills}
    />
  );
}
