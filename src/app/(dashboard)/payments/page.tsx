import {
  MetricCard,
  PageHeader,
  PlaceholderTable,
  SurfaceTabs,
} from '@/components/shared';
import { paymentPlaceholderTable, paymentTabs } from '@/lib/navigation';

interface PaymentsPageProps {
  searchParams: Promise<{
    tab?: string | string[];
  }>;
}

function resolveActiveTab(tab?: string | string[]) {
  const value = Array.isArray(tab) ? tab[0] : tab;

  if (value && paymentTabs.some((item) => item.value === value)) {
    return value;
  }

  return 'overview';
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const params = await searchParams;
  const activeTab = resolveActiveTab(params.tab);

  return (
    <main className="grid gap-6">
      <PageHeader
        description={[
          'Standardized payments surface for future scheduling,',
          'payment state, and history work.',
        ].join(' ')}
        eyebrow="PR-4 scaffold"
        title="Payments"
      />
      <SurfaceTabs activeValue={activeTab} tabs={paymentTabs} />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Needs review" value="-" />
        <MetricCard label="Pending" value="-" />
        <MetricCard label="Completed" value="-" />
      </div>
      <PlaceholderTable state={paymentPlaceholderTable} />
    </main>
  );
}
