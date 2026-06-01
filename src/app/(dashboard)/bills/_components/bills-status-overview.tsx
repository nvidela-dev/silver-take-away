import { StatusBadge } from '@/app/_components/molecules/status-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_components/atoms/card';
import { billStatusDisplay } from '@/app/_display';
import { formatMoney } from '@/lib/utils';

interface BillsStatusOverviewProps {
  approvalAmountTotal: string;
  approvalTotal: number;
  draftAmountTotal: string;
  draftTotal: number;
  paymentAmountTotal: string;
  paymentTotal: number;
}

export function BillsStatusOverview({
  approvalAmountTotal,
  approvalTotal,
  draftAmountTotal,
  draftTotal,
  paymentAmountTotal,
  paymentTotal,
}: BillsStatusOverviewProps) {
  const groups = [
    {
      id: 'drafts',
      title: 'Drafts',
      description: 'Bills being prepared before approval.',
      status: billStatusDisplay.draft,
      count: draftTotal,
      total: Number(draftAmountTotal),
    },
    {
      id: 'approvals',
      title: 'For approval',
      description: 'Bills awaiting an approval decision.',
      status: billStatusDisplay.awaiting_approval,
      count: approvalTotal,
      total: Number(approvalAmountTotal),
    },
    {
      id: 'payment',
      title: 'For payment',
      description: 'Approved bills ready for payment work.',
      status: billStatusDisplay.scheduled,
      count: paymentTotal,
      total: Number(paymentAmountTotal),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>
          Bills grouped by the fixed operational views.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid divide-y divide-slate-100">
          {groups.map((group) => (
            <div
              className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              key={group.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-950">
                    {group.title}
                  </h2>
                  <StatusBadge status={group.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {group.description}
                </p>
              </div>
              <div className="text-sm font-medium text-slate-950">
                {group.count}
                {' '}
                {group.count === 1 ? 'bill' : 'bills'}
              </div>
              <div className="text-sm font-semibold text-slate-950 sm:text-right">
                {formatMoney(group.total.toFixed(2), 'USD')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
