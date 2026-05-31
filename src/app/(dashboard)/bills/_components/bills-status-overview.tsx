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
import type { BillStatusAggregate } from '@/lib/types/bill/filters';
import { STATUSES_BY_TAB, type BillFilterTab } from '@/lib/types/bill/tabs';

interface BillsStatusOverviewProps {
  aggregates: BillStatusAggregate[];
}

interface OverviewGroupSpec {
  id: BillFilterTab;
  title: string;
  description: string;
  status: typeof billStatusDisplay[keyof typeof billStatusDisplay];
}

const OVERVIEW_GROUPS: readonly OverviewGroupSpec[] = [
  {
    id: 'drafts',
    title: 'Drafts',
    description: 'Bills being prepared before approval.',
    status: billStatusDisplay.draft,
  },
  {
    id: 'approvals',
    title: 'For approval',
    description: 'Bills awaiting an approval decision.',
    status: billStatusDisplay.awaiting_approval,
  },
  {
    id: 'payment',
    title: 'For payment',
    description: 'Approved bills ready for payment work.',
    status: billStatusDisplay.scheduled,
  },
];

function aggregateForGroup(
  group: OverviewGroupSpec,
  aggregates: BillStatusAggregate[],
): { count: number; total: number } {
  const statuses = STATUSES_BY_TAB[group.id] as readonly string[];
  return aggregates
    .filter((agg) => statuses.includes(agg.status))
    .reduce(
      (acc, agg) => ({
        count: acc.count + agg.count,
        total: acc.total + Number(agg.totalAmount),
      }),
      { count: 0, total: 0 },
    );
}

export function BillsStatusOverview({ aggregates }: BillsStatusOverviewProps) {
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
          {OVERVIEW_GROUPS.map((group) => {
            const { count, total } = aggregateForGroup(group, aggregates);
            return (
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
                  {count}
                  {' '}
                  {count === 1 ? 'bill' : 'bills'}
                </div>
                <div className="text-sm font-semibold text-slate-950 sm:text-right">
                  {formatMoney(total.toFixed(2), 'USD')}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
