import { UserButton } from '@clerk/nextjs';
import {
  Building2, CreditCard, Menu, ReceiptText,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { dashboardNavigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { Breadcrumb } from './_components/breadcrumb';

export const dynamic = 'force-dynamic';

const navIconMap = {
  receipt: ReceiptText,
  'credit-card': CreditCard,
  building: Building2,
} as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-4 p-4">
        <header
          className={cn(
            'flex items-center justify-between gap-3 rounded-lg',
            'border border-slate-200 bg-white px-4 py-3',
          )}
        >
          <Breadcrumb />
          {clerkEnabled ? (
            <UserButton />
          ) : (
            <span className="text-sm text-slate-600">User</span>
          )}
        </header>

        <details className="rounded-lg border border-slate-200 bg-white px-3 py-2 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
            <Menu aria-hidden className="size-4" />
            Menu
          </summary>
          <nav
            aria-label="Mobile navigation"
            className="mt-2 flex flex-wrap gap-3"
          >
            {dashboardNavigation.map((item) => (
              <Button asChild key={item.href} size="sm" variant="secondary">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </details>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            className={cn(
              'hidden self-start rounded-lg border border-slate-200',
              'bg-white p-4 lg:block',
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bill Pay
            </p>
            <Separator className="my-3" />
            <nav aria-label="Sidebar navigation" className="grid gap-2">
              {dashboardNavigation.map((item) => {
                const Icon = navIconMap[item.icon ?? 'receipt'];

                return (
                  <Link
                    className={cn(
                      'grid gap-1 rounded-md px-3 py-2 text-slate-800',
                      'no-underline hover:bg-slate-100',
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Icon aria-hidden className="size-4" />
                      {item.label}
                    </span>
                    <span className="text-xs leading-5 text-slate-500">
                      {item.description}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
