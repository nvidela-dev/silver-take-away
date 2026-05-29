import { UserButton } from '@clerk/nextjs';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/app/_components/ui/button';
import { dashboardNavigation } from '@/lib/navigation';

import { DashboardSidebar } from './_components/dashboard-sidebar';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="min-h-dvh bg-emerald-950 p-0 text-slate-950 lg:p-8">
      <div
        className={[
          'mx-auto flex min-h-dvh max-w-[1320px] overflow-hidden bg-white',
          'shadow-2xl lg:min-h-[calc(100dvh-4rem)] lg:rounded-lg',
        ].join(' ')}
      >
        <DashboardSidebar clerkEnabled={clerkEnabled} />
        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="border-b border-slate-200 px-4 py-3 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
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
          <div className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-10 lg:py-9">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
