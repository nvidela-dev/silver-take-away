'use client';

import { UserButton } from '@clerk/nextjs';
import {
  ChevronDown,
  CreditCard,
  ReceiptText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { dashboardNavigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const navIconMap = {
  receipt: ReceiptText,
  'credit-card': CreditCard,
} as const;

interface DashboardSidebarProps {
  clerkEnabled: boolean;
}

export function DashboardSidebar({ clerkEnabled }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        'hidden w-60 shrink-0 flex-col border-r border-slate-200',
        'bg-stone-50 text-slate-950 lg:flex',
      ].join(' ')}
    >
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={[
                'grid size-7 shrink-0 place-items-center rounded',
                'bg-slate-900 text-white',
              ].join(' ')}
            >
              <ReceiptText aria-hidden className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Workspace</p>
              <p className="truncate text-sm font-semibold">Silver Take Away</p>
            </div>
          </div>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-slate-400" />
        </div>
      </div>

      <nav
        aria-label="Sidebar navigation"
        className="flex flex-1 flex-col gap-0.5 p-3"
      >
        <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Bill Pay
        </p>
        {dashboardNavigation.map((item) => {
          const Icon = navIconMap[item.icon ?? 'receipt'];
          const itemPathname = item.href.split('?')[0];
          const isActive = pathname === itemPathname
            || pathname.startsWith(`${itemPathname}/`);

          return (
            <Link
              className={cn(
                [
                  'flex h-9 items-center gap-2 rounded px-2 text-sm',
                  'font-medium no-underline transition-colors',
                ].join(' '),
                isActive
                  ? 'bg-white text-slate-950 ring-1 ring-slate-200'
                  : 'text-slate-600 hover:bg-white hover:text-slate-950',
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        {clerkEnabled ? (
          <UserButton />
        ) : (
          <div className="rounded bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
            User
          </div>
        )}
      </div>
    </aside>
  );
}
