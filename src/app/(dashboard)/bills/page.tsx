import {
  MetricCard,
  PageHeader,
  PlaceholderTable,
  SurfaceTabs,
} from '@/components/shared';
import { billPlaceholderTable, billTabs } from '@/lib/navigation';
import { getBillFormOptions, listDraftBills } from '@/lib/queries';

import { DraftBillsView } from './_components';

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
  } catch {
    return {
      draftBills: [],
      billFormOptions: { vendors: [], categories: [] },
      loadError: 'Draft bills could not be loaded. Check the database connection.',
    };
  }
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const activeTab = resolveActiveTab(params.tab);
  const draftData = activeTab === 'drafts'
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
      {activeTab === 'drafts' ? (
        <DraftBillsView
          bills={draftData.draftBills}
          loadError={draftData.loadError}
          options={draftData.billFormOptions}
        />
      ) : (
        <>
          <PlaceholderTable state={billPlaceholderTable} />
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Drafts" value="-" />
            <MetricCard label="For approval" value="-" />
            <MetricCard label="For payment" value="-" />
          </div>
        </>
      )}
    </main>
  );
}
