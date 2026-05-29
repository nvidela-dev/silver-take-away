import { DetailPlaceholder } from '@/app/_components/shared';

interface PaymentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PaymentDetailPage({
  params,
}: PaymentDetailPageProps) {
  const { id } = await params;

  return (
    <DetailPlaceholder
      description="Stable payment detail route reserved for payment feature work."
      eyebrow="Payment detail"
      id={id}
      title="Payment detail"
    />
  );
}
