import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { SurfaceTab } from '@/types';

interface SurfaceTabsProps {
  tabs: readonly SurfaceTab[];
  activeValue: string;
}

export function SurfaceTabs({ activeValue, tabs }: SurfaceTabsProps) {
  return (
    <nav
      aria-label="Surface tabs"
      className="flex gap-8 overflow-x-auto border-b border-slate-200"
    >
      {tabs.map((tab) => (
        <Link
          className={cn(
            [
              'whitespace-nowrap border-b-2 px-0 pb-2 pt-1',
              'text-sm font-medium no-underline transition-colors',
            ].join(' '),
            tab.value === activeValue
              ? 'border-slate-950 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-950',
          )}
          href={tab.href}
          key={tab.value}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
