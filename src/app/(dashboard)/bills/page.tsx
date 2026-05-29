import {
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/auth';
import { billTabs } from '@/lib/navigation';
import { getBillFormOptions, listDraftBills } from '@/lib/queries';

import { BillsWorkspace } from './_components';

interface BillsPageProps {
  searchParams: Promise<{
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

async function loadBillWorkspaceData() {
  try {
    const [draftBills, billFormOptions] = await Promise.all([
      listDraftBills(),
      getBillFormOptions(),
    ]);
    return { draftBills, billFormOptions, loadError: null };
  } catch (error) {
    let loadError = 'Draft bills could not be loaded. Check the database connection.';
    if (error instanceof UnauthorizedError) {
      loadError = 'Sign in before creating or viewing bills.';
    }
    if (error instanceof ForbiddenError) {
      loadError = 'Your account needs Bill Pay access before creating or viewing bills.';
    }

    return {
      draftBills: [],
      billFormOptions: { vendors: [], categories: [] },
      loadError,
    };
  }
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const activeTab = resolveActiveTab(params.tab);
  const workspaceData = await loadBillWorkspaceData();

  return (
    <BillsWorkspace
      activeTab={activeTab}
      bills={workspaceData.draftBills}
      loadError={workspaceData.loadError}
      options={workspaceData.billFormOptions}
    />
  );
}
