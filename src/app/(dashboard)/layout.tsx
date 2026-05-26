import type { ReactNode } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

import { Breadcrumb } from './_components/breadcrumb';

export const dynamic = 'force-dynamic';

const navItems = [
  { href: '/bills', label: 'Bills' },
  { href: '/payments', label: 'Payments' },
  { href: '/vendors', label: 'Vendors' },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#f8fafc' }}>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem',
          display: 'grid',
          gap: '1rem',
        }}
      >
        <header
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            backgroundColor: '#ffffff',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <Breadcrumb />
          {clerkEnabled ? (
            <UserButton />
          ) : (
            <span style={{ color: '#475569', fontSize: '0.9rem' }}>
              User
            </span>
          )}
        </header>

        <details
          className="dashboard-mobile-menu"
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            backgroundColor: '#ffffff',
            padding: '0.5rem 0.75rem',
          }}
        >
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            Menu
          </summary>
          <nav
            aria-label="Mobile navigation"
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </details>

        <div
          className="dashboard-main-grid"
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: '220px 1fr',
          }}
        >
          <aside
            className="dashboard-sidebar"
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              backgroundColor: '#ffffff',
              padding: '1rem',
              alignSelf: 'start',
            }}
          >
            <nav
              aria-label="Sidebar navigation"
              style={{ display: 'grid', gap: '0.5rem' }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.625rem',
                    textDecoration: 'none',
                    color: '#0f172a',
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              backgroundColor: '#ffffff',
              padding: '1rem',
              minHeight: '420px',
            }}
          >
            {children}
          </section>
        </div>
      </div>

      <style>
        {`
          .dashboard-mobile-menu {
            display: none;
          }

          @media (max-width: 900px) {
            .dashboard-mobile-menu {
              display: block;
            }

            .dashboard-sidebar {
              display: none;
            }

            .dashboard-main-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}
