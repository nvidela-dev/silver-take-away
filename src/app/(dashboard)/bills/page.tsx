import {
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/auth';
import { billTabs } from '@/app/_navigation';
import {
  getBillFormOptions,
  listApprovalBills,
  listDraftBills,
  listPaymentBills,
} from '@/lib/queries';

import { BillsWorkspace } from './_components';

interface BillsPageProps {
  searchParams: Promise<{
    page?: string | string[];
    tab?: string | string[];
  }>;
}

function resolveActiveTab(tab?: string | string[]) {
  const value = Array.isArray(tab) ? tab[0] : tab;

  if (value && billTabs.some((item) => item.value === value)) {
    return value;
  }

  return 'drafts';
}

function resolvePage(page?: string | string[]) {
  const value = Number(Array.isArray(page) ? page[0] : page);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

async function loadBillWorkspaceData(page: number) {
  try {
    const [draftBills, approvalBills, paymentBills, billFormOptions] = await Promise.all([
      listDraftBills(page),
      listApprovalBills(page),
      listPaymentBills(page),
      getBillFormOptions(),
    ]);
    return {
      draftBills: draftBills.bills,
      draftAmountTotal: draftBills.amountTotal,
      draftTotal: draftBills.total,
      approvalBills: approvalBills.bills,
      approvalAmountTotal: approvalBills.amountTotal,
      approvalTotal: approvalBills.total,
      paymentBills: paymentBills.bills,
      paymentAmountTotal: paymentBills.amountTotal,
      paymentTotal: paymentBills.total,
      billFormOptions,
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
      draftBills: [],
      draftAmountTotal: '0',
      draftTotal: 0,
      approvalBills: [],
      approvalAmountTotal: '0',
      approvalTotal: 0,
      paymentBills: [],
      paymentAmountTotal: '0',
      paymentTotal: 0,
      billFormOptions: { vendors: [], categories: [] },
      loadError,
    };
  }
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const activeTab = resolveActiveTab(params.tab);
  const page = resolvePage(params.page);
  const workspaceData = await loadBillWorkspaceData(page);

  return (
    <BillsWorkspace
      activeTab={activeTab}
      approvalBills={workspaceData.approvalBills}
      approvalAmountTotal={workspaceData.approvalAmountTotal}
      approvalTotal={workspaceData.approvalTotal}
      currentPage={page}
      draftBills={workspaceData.draftBills}
      draftAmountTotal={workspaceData.draftAmountTotal}
      draftTotal={workspaceData.draftTotal}
      loadError={workspaceData.loadError}
      options={workspaceData.billFormOptions}
      paymentBills={workspaceData.paymentBills}
      paymentAmountTotal={workspaceData.paymentAmountTotal}
      paymentTotal={workspaceData.paymentTotal}
    />
  );
}
