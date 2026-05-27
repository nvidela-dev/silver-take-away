import { MetricCard, PageHeader, PlaceholderTable } from '@/components/shared';
import { vendorPlaceholderTable } from '@/lib/navigation';

export default function VendorsPage() {
  return (
    <main className="grid gap-6">
      <PageHeader
        description={[
          'Standardized vendor surface for future profiles,',
          'ownership, and payment methods.',
        ].join(' ')}
        eyebrow="PR-4 scaffold"
        title="Vendors"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Vendors" value="-" />
        <MetricCard label="Owners" value="-" />
        <MetricCard label="Payment methods" value="-" />
      </div>
      <PlaceholderTable state={vendorPlaceholderTable} />
    </main>
  );
}
