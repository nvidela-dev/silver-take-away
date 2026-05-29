import { Card, CardContent } from '@/app/_components/ui/card';

interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
}

export function MetricCard({ description, label, value }: MetricCardProps) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

MetricCard.defaultProps = {
  description: undefined,
};
