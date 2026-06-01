import {
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/auth';
import { billTabs } from '@/app/_navigation';
import {
  getBillReferenceData,
  listBillOverviewGroups,
  listBillsForTab,
} from '@/lib/queries';
import {
  billFiltersSchema,
  billPaginationSchema,
  DEFAULT_BILL_PAGE_SIZE,
  scopedFiltersForTab,
  type BillFilters,
} from '@/lib/validators/bill-filter-spec';
import { billSortSpec } from '@/lib/validators/bill-sort-spec';
import {
  clampOverviewPage,
  overviewPageParam,
} from '@/lib/types/bill/overview';
import type { BillFilterTab } from '@/lib/types/bill/tabs';
import type {
  BillListResult,
  BillPagination,
  BillSort,
} from '@/lib/types/bill/filters';
import type { BillListItem } from '@/lib/types/bill/views';

import { BillsWorkspace } from './_components';

interface BillsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type BillTabValue = 'overview' | BillFilterTab;

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

function parseSort(params: Record<string, string>): BillSort {
  return billSortSpec.parseSearchParams(params);
}

const OVERVIEW_GROUP_TABS: readonly BillFilterTab[] = ['drafts', 'approvals', 'payment'];

function parseOverviewPages(
  params: Record<string, string>,
): Partial<Record<BillFilterTab, number>> {
  const pages: Partial<Record<BillFilterTab, number>> = {};
  OVERVIEW_GROUP_TABS.forEach((tab) => {
    const raw = params[overviewPageParam(tab)];
    if (raw !== undefined) {
      pages[tab] = clampOverviewPage(Number(raw));
    }
  });
  return pages;
}

const emptyListResult: BillListResult<BillListItem> = { amountTotal: '0', items: [], total: 0 };

const errorMessages = {
  unauthorized: 'Sign in before creating or viewing bills.',
  forbidden: 'Your account needs Bill Pay access before creating or viewing bills.',
  generic: 'Bills could not be loaded. Check the database connection.',
} as const;

function resolveLoadError(error: unknown): string {
  if (error instanceof UnauthorizedError) return errorMessages.unauthorized;
  if (error instanceof ForbiddenError) return errorMessages.forbidden;
  return errorMessages.generic;
}

async function loadActiveTabBills(
  activeTab: BillTabValue,
  filters: BillFilters,
  pagination: BillPagination,
  sort: BillSort,
) {
  if (activeTab === 'overview') return emptyListResult;
  return listBillsForTab(activeTab, {
    filters: scopedFiltersForTab(activeTab, filters),
    pagination,
    sort,
  });
}

async function loadOverviewGroups(
  activeTab: BillTabValue,
  filters: BillFilters,
  sort: BillSort,
  pages: Partial<Record<BillFilterTab, number>>,
) {
  if (activeTab !== 'overview') return [];
  return listBillOverviewGroups({ filters, sort, pages });
}

async function loadBillWorkspaceData(
  activeTab: BillTabValue,
  filters: BillFilters,
  pagination: BillPagination,
  sort: BillSort,
  overviewPages: Partial<Record<BillFilterTab, number>>,
) {
  try {
    const [activeBills, overviewGroups, referenceData] = await Promise.all([
      loadActiveTabBills(activeTab, filters, pagination, sort),
      loadOverviewGroups(activeTab, filters, sort, overviewPages),
      getBillReferenceData(),
    ]);
    return {
      activeBills,
      overviewGroups,
      referenceData,
      loadError: null,
    };
  } catch (error) {
    return {
      activeBills: emptyListResult,
      overviewGroups: [],
      referenceData: { vendors: [], owners: [], categories: [] },
      loadError: resolveLoadError(error),
    };
  }
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const activeTab = resolveActiveTab(params.tab);
  const flatParams = flattenSearchParams(params);
  const filters = parseFilters(flatParams);
  const pagination = parsePagination(flatParams);
  const sort = parseSort(flatParams);
  const overviewPages = parseOverviewPages(flatParams);
  const workspaceData = await loadBillWorkspaceData(
    activeTab,
    filters,
    pagination,
    sort,
    overviewPages,
  );

  return (
    <BillsWorkspace
      activeBills={workspaceData.activeBills}
      activeTab={activeTab}
      overviewGroups={workspaceData.overviewGroups}
      loadError={workspaceData.loadError}
      referenceData={workspaceData.referenceData}
    />
  );
}
