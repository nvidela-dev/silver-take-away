interface PaymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({
  params,
}: PaymentDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  return (
    <main className="grid gap-2">
      <h1 className="text-2xl font-semibold text-slate-950">Payment detail</h1>
      <p className="text-sm text-slate-600">
        Detail view for payment
        {' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{id}</code>
        {' '}
        lands in a follow-up PR.
      </p>
    </main>
  );
}
