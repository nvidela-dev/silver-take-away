'use client';

import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  bills: 'Bills',
  payments: 'Payments',
  vendors: 'Vendors',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const [segment] = pathname.split('/').filter(Boolean);
  const label = segment ? LABELS[segment] ?? segment : 'Dashboard';

  return (
    <nav aria-label="Breadcrumb" style={{ color: '#334155', fontSize: '0.9rem' }}>
      <span>Dashboard /</span>
      <span style={{ marginLeft: '0.25rem' }}>{label}</span>
    </nav>
  );
}
