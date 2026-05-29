import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_components/ui/card';

interface BillsFilteredViewProps {
  description: string;
  title: string;
}

export function BillsFilteredView({
  description,
  title,
}: BillsFilteredViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={[
            'rounded-md border border-dashed border-slate-300 p-6',
            'text-center text-sm text-slate-600',
          ].join(' ')}
        >
          No bills in this view.
        </div>
      </CardContent>
    </Card>
  );
}
