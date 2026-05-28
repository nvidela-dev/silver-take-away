import {
  ArrowRight,
  Building2,
  CreditCard,
  ReceiptText,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const scaffoldRoutes = [
  {
    href: '/bills',
    label: 'Bills',
    description: 'Primary Bill Pay queue with tabs and table shell.',
    icon: ReceiptText,
  },
  {
    href: '/bills/demo-bill',
    label: 'Bill detail',
    description: 'Detail route placeholder ready for future bill data wiring.',
    icon: ReceiptText,
  },
  {
    href: '/payments',
    label: 'Payments',
    description: 'Payment workspace for release, status, and reconciliation.',
    icon: CreditCard,
  },
  {
    href: '/payments/demo-payment',
    label: 'Payment detail',
    description: 'Detail route placeholder ready for future payment behavior.',
    icon: CreditCard,
  },
  {
    href: '/vendors',
    label: 'Vendors Setup',
    description: 'Supporting setup for vendor profiles and payment methods.',
    icon: Building2,
  },
  {
    href: '/vendors/demo-vendor',
    label: 'Vendor detail',
    description: 'Detail route placeholder ready for future vendor profiles.',
    icon: Building2,
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Bill Pay
          </p>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Bills and payments workspace scaffold
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Open each route to review the product-aligned shells for Bills,
                Payments, and supporting vendor setup.
              </p>
            </div>
            <Button asChild>
              <Link href="/bills">
                Open Bills
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scaffoldRoutes.map((route) => {
            const Icon = route.icon;

            return (
              <Card key={route.href}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        'grid size-10 place-items-center rounded-md',
                        'bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <CardTitle>{route.label}</CardTitle>
                  </div>
                  <CardDescription>{route.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link href={route.href}>
                      {route.href}
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
