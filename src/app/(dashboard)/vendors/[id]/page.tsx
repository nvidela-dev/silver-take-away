import { DetailPlaceholder } from '@/components/shared';

interface VendorDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VendorDetailPage({
  params,
}: VendorDetailPageProps) {
  const { id } = await params;

  return (
    <DetailPlaceholder
      description="Stable vendor detail route reserved for vendor feature work."
      eyebrow="Vendor detail"
      id={id}
      title="Vendor detail"
    />
  );
}
