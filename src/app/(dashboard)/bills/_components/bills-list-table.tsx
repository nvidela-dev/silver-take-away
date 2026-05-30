import { StatusBadge } from '@/app/_components/shared';
import { Card } from '@/app/_components/ui/card';
import { billStatusDisplay } from '@/app/_display';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import type { BillListItem } from '@/lib/types/bill/views';

interface BillsListTableProps {
  bills: BillListItem[];
  emptyMessage: string;
}

const avatarTones = [
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
];

function vendorInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? '').join('');
  return letters ? letters.toUpperCase() : '?';
}

function vendorTone(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % avatarTones.length;
  }
  return avatarTones[hash];
}

function formatOwnerDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function BillsListTable({ bills, emptyMessage }: BillsListTableProps) {
  const total = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const currency = bills[0]?.currency ?? 'USD';

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
            <tr>
              <th className="py-3 pl-4 pr-4 font-medium">Vendor / owner</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 text-right font-medium">Amount</th>
              <th className="py-3 pr-4 font-medium">Due date</th>
              <th className="py-3 pr-4 font-medium">Invoice #</th>
              <th className="py-3 pr-4 font-medium">Lines</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td className="py-8 text-center text-slate-600" colSpan={6}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {bills.map((bill) => (
              <tr
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                key={bill.id}
              >
                <td className="py-3 pl-4 pr-4">
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
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={billStatusDisplay[bill.status]} />
                </td>
                <td className="py-3 pr-4 text-right font-medium tabular-nums text-slate-950">
                  {formatMoney(bill.amount, bill.currency)}
                </td>
                <td className="py-3 pr-4 text-slate-600">
                  {bill.dueDate ? formatDate(bill.dueDate) : '—'}
                </td>
                <td className="py-3 pr-4 text-slate-600">
                  {bill.invoiceNumber ?? '—'}
                </td>
                <td className="py-3 pr-4 tabular-nums text-slate-600">
                  {bill.lineItemCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bills.length > 0 ? (
        <div
          className={[
            'flex justify-end border-t border-slate-200 px-4 py-3',
            'text-xs text-slate-500',
          ].join(' ')}
        >
          {bills.length}
          {' '}
          {bills.length === 1 ? 'bill' : 'bills'}
          {' · '}
          <span className="ml-1 font-medium text-slate-700">
            {formatMoney(total.toFixed(2), currency)}
            {' total'}
          </span>
        </div>
      ) : null}
    </Card>
  );
}
