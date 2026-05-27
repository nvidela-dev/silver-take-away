import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { SurfaceTab } from '@/types';

interface SurfaceTabsProps {
  tabs: readonly SurfaceTab[];
  activeValue: string;
}

export function SurfaceTabs({ activeValue, tabs }: SurfaceTabsProps) {
  return (
    <nav aria-label="Surface tabs" className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <Link
          className={cn(
            'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium no-underline',
            tab.value === activeValue
              ? 'bg-slate-950 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
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
