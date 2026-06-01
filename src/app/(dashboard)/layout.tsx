'use client';

import { UserButton } from '@clerk/nextjs';
import {
  ChevronDown,
  CreditCard,
  Menu,
  ReceiptText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { dashboardNavigation } from '@/app/_navigation';
import { cn } from '@/lib/utils';

const navIconMap = {
  receipt: ReceiptText,
  'credit-card': CreditCard,
} as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <NuqsAdapter>
      <div className="min-h-dvh bg-emerald-950 p-0 text-slate-950 lg:p-8">
        <div
          className={[
            'mx-auto flex min-h-dvh max-w-[1320px] overflow-hidden bg-white',
            'shadow-2xl lg:min-h-[calc(100dvh-4rem)] lg:rounded-lg',
          ].join(' ')}
        >
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
              <p
                className={[
                  'px-2 pb-2 pt-1 text-xs font-semibold uppercase',
                  'tracking-wide text-slate-500',
                ].join(' ')}
              >
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
                <div
                  className={[
                    'rounded bg-white px-3 py-2 text-sm text-slate-600',
                    'ring-1 ring-slate-200',
                  ].join(' ')}
                >
                  User
                </div>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col bg-white">
            <header className="border-b border-slate-200 px-4 py-3 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <details className="relative">
                  <summary
                    className={[
                      'flex cursor-pointer list-none items-center gap-2',
                      'font-semibold',
                    ].join(' ')}
                  >
                    <Menu aria-hidden className="size-4" />
                    Menu
                  </summary>
                  <nav
                    aria-label="Mobile navigation"
                    className={[
                      'absolute left-0 top-8 z-20 grid w-56 gap-1 rounded-md',
                      'border border-slate-200 bg-white p-2 shadow-lg',
                    ].join(' ')}
                  >
                    {dashboardNavigation.map((item) => (
                      <Button asChild key={item.href} size="sm" variant="ghost">
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </nav>
                </details>
                {clerkEnabled ? (
                  <UserButton />
                ) : (
                  <span className="text-sm text-slate-600">User</span>
                )}
              </div>
            </header>
            <div
              className={[
                'min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6',
                'lg:px-10 lg:py-9',
              ].join(' ')}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </NuqsAdapter>
  );
}
