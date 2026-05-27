import {
  MetricCard,
  PageHeader,
  PlaceholderTable,
  SurfaceTabs,
} from '@/components/shared';
import { billPlaceholderTable, billTabs } from '@/lib/navigation';

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

  return 'overview';
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const activeTab = resolveActiveTab(params.tab);

  return (
    <main className="grid gap-6">
      <PageHeader
        description={[
          'Standardized bills surface for future intake, approval,',
          'payment readiness, and history work.',
        ].join(' ')}
        eyebrow="PR-4 scaffold"
        title="Bills"
      />
      <SurfaceTabs activeValue={activeTab} tabs={billTabs} />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Drafts" value="-" />
        <MetricCard label="For approval" value="-" />
        <MetricCard label="For payment" value="-" />
      </div>
      <PlaceholderTable state={billPlaceholderTable} />
    </main>
  );
}
