'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { dashboardNavigation } from '@/lib/navigation';

const dashboardLabels = new Map(
  dashboardNavigation.map((item) => [item.href.replace('/', ''), item.label]),
);

export function Breadcrumb() {
  const pathname = usePathname();
  const [segment, id] = pathname.split('/').filter(Boolean);
  const label = segment ? dashboardLabels.get(segment) ?? segment : 'Dashboard';

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1 text-sm text-slate-700">
      <Link className="font-medium text-slate-900 no-underline" href="/bills">
        Dashboard
      </Link>
      <span>/</span>
      <span>{label}</span>
      {id ? (
        <>
          <span>/</span>
          <span className="max-w-36 truncate text-slate-500">{id}</span>
        </>
      ) : null}
    </nav>
  );
}
