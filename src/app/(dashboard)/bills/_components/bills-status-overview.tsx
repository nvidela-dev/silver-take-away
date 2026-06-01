'use client';

import { Banknote, CircleCheck, CircleDot } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useTransition, type ComponentType } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { Card } from '@/app/_components/atoms/card';
import { StatusBadge } from '@/app/_components/molecules/status-badge';
import { billStatusDisplay } from '@/app/_display';
import { cn, formatMoney } from '@/lib/utils';
import type { BillOverviewGroup } from '@/lib/types/bill/filters';
import {
  OVERVIEW_GROUP_PAGE_SIZE,
  clampOverviewCount,
  overviewCountParam,
} from '@/lib/types/bill/overview';
import type { BillFilterTab } from '@/lib/types/bill/tabs';
import type { BillListItem } from '@/lib/types/bill/views';

import { formatOwnerDate, vendorInitials, vendorTone } from './bills-table-columns';

interface BillsStatusOverviewProps {
  groups: BillOverviewGroup[];
}

interface GroupMeta {
  title: string;
  Icon: ComponentType<{ className?: string }>;
}

const GROUP_META: Record<BillFilterTab, GroupMeta> = {
  drafts: { title: 'Ready for review', Icon: CircleDot },
  approvals: { title: 'Awaiting approvals', Icon: CircleCheck },
  payment: { title: 'For payment', Icon: Banknote },
};

function VendorOwnerCell({ bill }: { bill: BillListItem }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full',
          'text-xs font-semibold',
          vendorTone(bill.vendor.name),
        )}
      >
        {vendorInitials(bill.vendor.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-950">
          {bill.vendor.name}
        </p>
        <p className="truncate text-xs text-slate-500">
          {bill.creator.fullName}
          {' · '}
          {formatOwnerDate(bill.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function BillsStatusOverview({ groups }: BillsStatusOverviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const openBill = (id: string) => {
    router.push(`/bills/${id}`);
  };

  const showMore = (tab: BillFilterTab, shown: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(
      overviewCountParam(tab),
      String(clampOverviewCount(shown + OVERVIEW_GROUP_PAGE_SIZE)),
    );
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
            <tr>
              <th className="py-3 pl-4 pr-4 font-medium">Vendor / owner</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const meta = GROUP_META[group.tab];
              const { items, total } = group.result;
              const hasMore = items.length < total;
              return (
                <Fragment key={group.tab}>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <td className="py-3 pl-4 pr-4" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <meta.Icon className="size-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-950">
                          {meta.title}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {total}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {items.length === 0 ? (
                    <tr className="border-b border-slate-100 last:border-0">
                      <td className="py-4 pl-14 pr-4 text-sm text-slate-400" colSpan={3}>
                        No bills in this view.
                      </td>
                    </tr>
                  ) : (
                    items.map((bill) => (
                      <tr
                        className={cn(
                          'h-14 cursor-pointer border-b border-slate-100 last:border-0',
                          'hover:bg-slate-50',
                        )}
                        key={bill.id}
                        onClick={() => openBill(bill.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openBill(bill.id);
                          }
                        }}
                        role="link"
                        tabIndex={0}
                      >
                        <td className="py-3 pl-4 pr-4">
                          <VendorOwnerCell bill={bill} />
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={billStatusDisplay[bill.status]} />
                        </td>
                        <td
                          className={cn(
                            'py-3 pr-4 text-right font-medium tabular-nums',
                            'text-slate-950',
                          )}
                        >
                          {formatMoney(bill.amount, bill.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                  {hasMore ? (
                    <tr className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pl-12 pr-4" colSpan={3}>
                        <div className="flex items-center gap-3">
                          <Button
                            disabled={isPending}
                            onClick={() => showMore(group.tab, items.length)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Show more
                          </Button>
                          <span className="text-xs text-slate-400">
                            {`Showing ${items.length} of ${total}`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
