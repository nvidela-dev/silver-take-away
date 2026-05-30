import { StatusBadge } from '@/app/_components/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_components/ui/card';
import { billStatusDisplay } from '@/app/_display';
import { formatMoney } from '@/lib/utils';
import type { BillListItem } from '@/lib/types/bill/views';

interface BillsStatusOverviewProps {
  approvalBills: BillListItem[];
  draftBills: BillListItem[];
  paymentBills: BillListItem[];
}

function sumAmount(bills: BillListItem[]) {
  return bills.reduce((total, bill) => total + Number(bill.amount), 0);
}

export function BillsStatusOverview({
  approvalBills,
  draftBills,
  paymentBills,
}: BillsStatusOverviewProps) {
  const groups = [
    {
      id: 'drafts',
      title: 'Drafts',
      description: 'Bills being prepared before approval.',
      status: billStatusDisplay.draft,
      count: draftBills.length,
      total: sumAmount(draftBills),
    },
    {
      id: 'approvals',
      title: 'For approval',
      description: 'Bills awaiting an approval decision.',
      status: billStatusDisplay.awaiting_approval,
      count: approvalBills.length,
      total: sumAmount(approvalBills),
    },
    {
      id: 'payment',
      title: 'For payment',
      description: 'Approved bills ready for payment work.',
      status: billStatusDisplay.scheduled,
      count: paymentBills.length,
      total: sumAmount(paymentBills),
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
