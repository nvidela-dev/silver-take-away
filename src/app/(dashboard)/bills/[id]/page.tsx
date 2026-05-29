import { DetailPlaceholder } from '@/app/_components/shared';

interface BillDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = await params;

  return (
    <DetailPlaceholder
      description="Stable bill detail route reserved for PR-5+ feature work."
      eyebrow="Bill detail"
      id={id}
      title="Bill detail"
    />
  );
}
