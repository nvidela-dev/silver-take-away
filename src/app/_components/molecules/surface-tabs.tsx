import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { SurfaceTab } from '@/app/_types/navigation';

interface SurfaceTabsProps {
  tabs: readonly SurfaceTab[];
  activeValue: string;
  actions?: ReactNode;
}

export function SurfaceTabs({ actions = null, activeValue, tabs }: SurfaceTabsProps) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-slate-200">
      <nav aria-label="Surface tabs" className="flex gap-8 overflow-x-auto">
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
      {actions ? <div className="flex shrink-0 gap-2 pb-2">{actions}</div> : null}
    </div>
  );
}
