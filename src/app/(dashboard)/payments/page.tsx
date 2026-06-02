import {
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/auth';
import { paymentTabs } from '@/app/_navigation';
import {
  getPaymentReferenceData,
  listPaymentsForTab,
} from '@/lib/queries';
import {
  DEFAULT_PAYMENT_PAGE_SIZE,
  paymentFiltersSchema,
  paymentPaginationSchema,
  scopedFiltersForTab,
  type PaymentFilters,
} from '@/lib/validators/payment-filter-spec';
import { paymentSortSpec } from '@/lib/validators/payment-sort-spec';
import type { PaymentFilterTab } from '@/lib/types/payment/tabs';
import type {
  PaymentListResult,
  PaymentPagination,
  PaymentSort,
} from '@/lib/types/payment/filters';
import type { PaymentListItem } from '@/lib/types/payment/views';

import { PaymentsWorkspace } from './_components';

interface PaymentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function resolveActiveTab(tab: string | string[] | undefined): PaymentFilterTab {
  const value = Array.isArray(tab) ? tab[0] : tab;

  if (value && paymentTabs.some((item) => item.value === value)) {
    return value as PaymentFilterTab;
  }

  return 'upcoming';
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

function parseFilters(params: Record<string, string>): PaymentFilters {
  const result = paymentFiltersSchema.safeParse(params);
  return result.success ? result.data : {};
}

function parsePagination(params: Record<string, string>): PaymentPagination {
  const result = paymentPaginationSchema.safeParse(params);
  return result.success
    ? result.data
    : { page: 1, pageSize: DEFAULT_PAYMENT_PAGE_SIZE };
}

function parseSort(params: Record<string, string>): PaymentSort {
  return paymentSortSpec.parseSearchParams(params);
}

const emptyListResult: PaymentListResult<PaymentListItem> = {
  amountTotal: '0',
  items: [],
  total: 0,
};

const errorMessages = {
  unauthorized: 'Sign in before viewing payments.',
  forbidden: 'Your account needs Bill Pay access before viewing payments.',
  generic: 'Payments could not be loaded. Check the database connection.',
} as const;

function resolveLoadError(error: unknown): string {
  if (error instanceof UnauthorizedError) return errorMessages.unauthorized;
  if (error instanceof ForbiddenError) return errorMessages.forbidden;
  return errorMessages.generic;
}

async function loadPaymentWorkspaceData(
  activeTab: PaymentFilterTab,
  filters: PaymentFilters,
  pagination: PaymentPagination,
  sort: PaymentSort,
) {
  try {
    const [activePayments, referenceData] = await Promise.all([
      listPaymentsForTab(activeTab, {
        filters: scopedFiltersForTab(activeTab, filters),
        pagination,
        sort,
      }),
      getPaymentReferenceData(),
    ]);
    return {
      activePayments,
      referenceData,
      loadError: null,
    };
  } catch (error) {
    return {
      activePayments: emptyListResult,
      referenceData: { vendors: [], owners: [], categories: [] },
      loadError: resolveLoadError(error),
    };
  }
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const params = await searchParams;
  const activeTab = resolveActiveTab(params.tab);
  const flatParams = flattenSearchParams(params);
  const filters = parseFilters(flatParams);
  const pagination = parsePagination(flatParams);
  const sort = parseSort(flatParams);
  const workspaceData = await loadPaymentWorkspaceData(activeTab, filters, pagination, sort);

  return (
    <PaymentsWorkspace
      activePayments={workspaceData.activePayments}
      activeTab={activeTab}
      loadError={workspaceData.loadError}
      referenceData={workspaceData.referenceData}
    />
  );
}
