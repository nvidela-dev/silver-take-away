import { redirect } from 'next/navigation';

import {
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/auth';
import { billTabs } from '@/app/_navigation';
import {
  getBillReferenceData,
  getCurrentUserWorkspaceTabPreference,
  listBillOverviewGroups,
  listBillsForTab,
} from '@/lib/queries';
import {
  BILL_FILTER_FIELD_KEYS,
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
import type {
  WorkspaceKey,
  WorkspaceTabPreferences,
} from '@/lib/types/workspace-preferences';
import {
  buildSavedPreferencesUrl,
  urlHasViewParams,
} from '@/lib/types/workspace-preferences-url';

import { BillsWorkspace } from './_components';

const BILL_TAB_TO_WORKSPACE_KEY: Record<BillFilterTab, WorkspaceKey> = {
  drafts: 'bills.drafts',
  approvals: 'bills.approvals',
  payment: 'bills.payment',
  history: 'bills.history',
};

// Keys whose presence in the URL means the user explicitly chose a view;
// when none are present we treat the URL as "bare" and hydrate from saved
// prefs via redirect.
const BILL_VIEW_PARAM_KEYS: readonly string[] = [
  ...BILL_FILTER_FIELD_KEYS,
  'sort',
  'dir',
  'page',
  'pageSize',
];

interface BillsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type BillTabValue = 'overview' | BillFilterTab;

function isBillTabValue(value: string | undefined): value is BillTabValue {
  return value !== undefined && billTabs.some((item) => item.value === value);
}

function resolveActiveTab(tab: string | string[] | undefined): BillTabValue {
  const value = Array.isArray(tab) ? tab[0] : tab;

  if (isBillTabValue(value)) {
    return value;
  }

  return 'drafts';
}

function flattenSearchParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string> {
  return Object.entries(params).reduce<Record<string, string>>((flatParams, [key, value]) => {
    if (value === undefined || value === '') return flatParams;
    return {
      ...flatParams,
      [key]: Array.isArray(value) ? value[0] ?? '' : value,
    };
  }, {});
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

async function loadSavedTabPreference(
  activeTab: BillTabValue,
): Promise<WorkspaceTabPreferences | null> {
  if (activeTab === 'overview') return null;
  try {
    return await getCurrentUserWorkspaceTabPreference(BILL_TAB_TO_WORKSPACE_KEY[activeTab]);
  } catch {
    // Don't let a prefs read failure block the page; the workspace just
    // renders without saved-view controls until next load.
    return null;
  }
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const activeTab = resolveActiveTab(params.tab);
  const flatParams = flattenSearchParams(params);

  // Hydrate the URL from saved prefs on a bare visit (e.g. /bills with no
  // view params). URL still wins whenever the user lands with any filter
  // / sort / pagination key explicitly set.
  if (activeTab !== 'overview' && !urlHasViewParams(flatParams, BILL_VIEW_PARAM_KEYS)) {
    const savedPrefs = await loadSavedTabPreference(activeTab);
    if (savedPrefs) {
      redirect(buildSavedPreferencesUrl({
        basePath: '/bills',
        tabParam: 'tab',
        tabValue: activeTab,
        preferences: savedPrefs,
      }));
    }
  }

  const filters = parseFilters(flatParams);
  const pagination = parsePagination(flatParams);
  const sort = parseSort(flatParams);
  const overviewPages = parseOverviewPages(flatParams);
  const [workspaceData, savedPreferences] = await Promise.all([
    loadBillWorkspaceData(activeTab, filters, pagination, sort, overviewPages),
    loadSavedTabPreference(activeTab),
  ]);

  return (
    <BillsWorkspace
      activeBills={workspaceData.activeBills}
      activeTab={activeTab}
      overviewGroups={workspaceData.overviewGroups}
      loadError={workspaceData.loadError}
      referenceData={workspaceData.referenceData}
      savedPreferences={savedPreferences}
    />
  );
}
