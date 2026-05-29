import {
  PageHeader,
  SurfaceTabs,
} from '@/app/_components/shared';
import {
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/auth';
import { billTabs } from '@/lib/navigation';
import { getBillFormOptions, listDraftBills } from '@/lib/queries';

import {
  BillsFilteredView,
  BillsStatusOverview,
  DraftBillsView,
} from './_components';

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

async function loadDraftBillData() {
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
  const shouldLoadDraftData = activeTab === 'overview' || activeTab === 'drafts';
  const draftData = shouldLoadDraftData
    ? await loadDraftBillData()
    : {
      draftBills: [],
      billFormOptions: { vendors: [], categories: [] },
      loadError: null,
    };

  return (
    <main className="grid gap-6">
      <PageHeader
        eyebrow="Bill Pay"
        title="Bills"
      />
      <SurfaceTabs activeValue={activeTab} tabs={billTabs} />
      {activeTab === 'overview' ? (
        <BillsStatusOverview draftBills={draftData.draftBills} />
      ) : null}
      {activeTab === 'drafts' ? (
        <DraftBillsView
          bills={draftData.draftBills}
          loadError={draftData.loadError}
          options={draftData.billFormOptions}
        />
      ) : null}
      {activeTab === 'approvals' ? (
        <BillsFilteredView
          description="Bills awaiting an approval decision."
          title="For approval"
        />
      ) : null}
      {activeTab === 'payment' ? (
        <BillsFilteredView
          description="Approved bills ready to schedule or release for payment."
          title="For payment"
        />
      ) : null}
    </main>
  );
}
