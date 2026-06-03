'use client';

import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDot,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useTransition, type ComponentType } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { Card } from '@/app/_components/atoms/card';
import { DetailNameTrigger } from '@/app/_components/molecules/detail-name-trigger';
import { StatusBadge } from '@/app/_components/molecules/status-badge';
import { billStatusDisplay } from '@/app/_display';
import { cn, formatMoney } from '@/lib/utils';
import type { BillOverviewGroup } from '@/lib/types/bill/filters';
import {
  OVERVIEW_GROUP_PAGE_SIZE,
  clampOverviewPage,
  overviewPageParam,
} from '@/lib/types/bill/overview';
import type { BillFilterTab, OverviewGroupTab } from '@/lib/types/bill/tabs';
import type { BillListItem } from '@/lib/types/bill/views';

import { formatOwnerDate, vendorInitials, vendorTone } from './bills-table-columns';

interface BillsStatusOverviewProps {
  groups: BillOverviewGroup[];
  onViewDetails: (bill: BillListItem) => void;
}

interface GroupMeta {
  title: string;
  Icon: ComponentType<{ className?: string }>;
}

const GROUP_META: Record<OverviewGroupTab, GroupMeta> = {
  drafts: { title: 'Ready for review', Icon: CircleDot },
  approvals: { title: 'Awaiting approvals', Icon: CircleCheck },
  payment: { title: 'For payment', Icon: Banknote },
};

interface VendorOwnerCellProps {
  bill: BillListItem;
  onViewDetails: (bill: BillListItem) => void;
}

function VendorOwnerCell({
  bill,
  onViewDetails,
}: VendorOwnerCellProps): React.ReactElement {
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
        <DetailNameTrigger
          ariaLabel={`View bill details for ${bill.vendor.name}`}
          label={bill.vendor.name}
          onClick={() => onViewDetails(bill)}
        />
        <p className="truncate text-xs text-slate-500">
          {bill.creator.fullName}
          {' · '}
          {formatOwnerDate(bill.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function BillsStatusOverview({
  groups,
  onViewDetails,
}: BillsStatusOverviewProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToGroupPage = (tab: BillFilterTab, page: number): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(overviewPageParam(tab), String(page));
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
              const pageCount = Math.max(1, Math.ceil(total / OVERVIEW_GROUP_PAGE_SIZE));
              const currentPage = Math.min(
                clampOverviewPage(Number(searchParams.get(overviewPageParam(group.tab)) ?? 1)),
                pageCount,
              );
              const fillerCount = pageCount > 1 ? OVERVIEW_GROUP_PAGE_SIZE - items.length : 0;
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
                    <tr className="border-b border-slate-100">
                      <td className="py-4 pl-14 pr-4 text-sm text-slate-400" colSpan={3}>
                        No bills in this view.
                      </td>
                    </tr>
                  ) : (
                    items.map((bill) => (
                      <tr
                        className="h-14 border-b border-slate-100 hover:bg-slate-50"
                        key={bill.id}
                      >
                        <td className="py-3 pl-4 pr-4">
                          <VendorOwnerCell bill={bill} onViewDetails={onViewDetails} />
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
                  {fillerCount > 0
                    ? Array.from({ length: fillerCount }, (_, index) => (
                      <tr aria-hidden className="h-14 border-b border-slate-100" key={index}>
                        <td aria-label="Reserved table row" colSpan={3} />
                      </tr>
                    )) : null}
                  {pageCount > 1 ? (
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pl-4 pr-4" colSpan={3}>
                        <div className="flex items-center justify-end gap-3 text-xs text-slate-500">
                          <span>
                            Page
                            {' '}
                            {currentPage}
                            {' of '}
                            {pageCount}
                          </span>
                          <Button
                            aria-label={`Previous ${meta.title} page`}
                            disabled={isPending || currentPage <= 1}
                            onClick={() => goToGroupPage(group.tab, currentPage - 1)}
                            size="icon"
                            type="button"
                            variant="outline"
                          >
                            <ChevronLeft aria-hidden className="size-4" />
                          </Button>
                          <Button
                            aria-label={`Next ${meta.title} page`}
                            disabled={isPending || currentPage >= pageCount}
                            onClick={() => goToGroupPage(group.tab, currentPage + 1)}
                            size="icon"
                            type="button"
                            variant="outline"
                          >
                            <ChevronRight aria-hidden className="size-4" />
                          </Button>
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
