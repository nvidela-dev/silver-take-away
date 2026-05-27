import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { sql } from 'drizzle-orm';
import type { ReactNode } from 'react';

import { assertDatabaseConfigured, db } from '@/db';
import { syncCurrentClerkUserToNeon } from '@/lib/auth/user-sync';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

interface UserSyncState {
  status: 'not-configured' | 'signed-out' | 'synced' | 'error';
  message: string;
  user?: User;
}

interface BadgeProps {
  tone: 'green' | 'red' | 'amber' | 'blue';
  children: string;
}

interface HealthCardProps {
  title: string;
  badge: ReactNode;
  children: ReactNode;
}

interface SyncDetailsProps {
  user: User;
}

function isClerkConfigured(): boolean {
  return Boolean(
    process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}

async function getNeonHealth() {
  try {
    assertDatabaseConfigured();
    await db.execute(sql`select 1 as ok`);
    return { ok: true, message: 'Connected to Neon' };
  } catch (error) {
    return {
      ok: false,
      message: (error as Error).message,
    };
  }
}

async function getUserSyncState(): Promise<UserSyncState> {
  if (!isClerkConfigured()) {
    return {
      status: 'not-configured',
      message: 'Set Clerk env vars to enable sign-in and user sync.',
    };
  }

  try {
    const user = await syncCurrentClerkUserToNeon();
    if (!user) {
      return {
        status: 'signed-out',
        message: 'Sign in with Clerk to create or refresh your Neon users row.',
      };
    }

    return {
      status: 'synced',
      message: 'Clerk identity is stored in Neon.',
      user,
    };
  } catch (error) {
    return {
      status: 'error',
      message: (error as Error).message,
    };
  }
}

function Badge({ tone, children }: BadgeProps) {
  const tones = {
    green: 'bg-emerald-100 text-emerald-950 ring-emerald-200',
    red: 'bg-rose-100 text-rose-950 ring-rose-200',
    amber: 'bg-amber-100 text-amber-950 ring-amber-200',
    blue: 'bg-sky-100 text-sky-950 ring-sky-200',
  };

  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1',
        tones[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function HealthCard({
  title,
  badge,
  children,
}: HealthCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
        {badge}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SyncDetails({ user }: SyncDetailsProps) {
  const rows = [
    ['Name', user.fullName],
    ['Email', user.email],
    ['Role', user.role],
    ['Clerk ID', user.clerkId],
    ['Neon User ID', user.id],
  ];

  return (
    <dl className="grid gap-3 text-sm">
      {rows.map(([label, value]) => (
        <div
          className="grid gap-1 rounded-md bg-slate-50 px-3 py-2 sm:grid-cols-[7rem_1fr] sm:gap-3"
          key={label}
        >
          <dt className="font-medium text-slate-500">{label}</dt>
          <dd className="break-all text-slate-950">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function Home() {
  const [neonHealth, userSync] = await Promise.all([
    getNeonHealth(),
    getUserSyncState(),
  ]);
  const clerkConfigured = isClerkConfigured();
  const signedIn = userSync.status === 'synced';
  const syncedUser = userSync.status === 'synced' ? userSync.user : undefined;

  return (
    <main className="min-h-dvh bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header
          className={[
            'flex flex-col gap-5 rounded-lg border border-white/10 bg-white/5 p-6',
            'sm:flex-row sm:items-center sm:justify-between',
          ].join(' ')}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
              PR-3 Runtime Check
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Clerk + Neon user sync
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Sign in with Clerk, then this page upserts the authenticated
              identity into the Neon `users` table and shows the resulting row.
            </p>
          </div>

          {signedIn ? (
            <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-slate-950">
              <span className="text-sm font-medium">Signed in</span>
              <UserButton />
            </div>
          ) : null}
        </header>

        {!signedIn && clerkConfigured ? (
          <section
            className={[
              'flex flex-col gap-3 rounded-lg border border-sky-300/30',
              'bg-sky-400/10 p-5 sm:flex-row sm:items-center sm:justify-between',
            ].join(' ')}
          >
            <div>
              <h2 className="font-semibold text-white">Start the sync check</h2>
              <p className="mt-1 text-sm text-sky-100">
                Authenticate with Clerk to create or update your local Neon user row.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SignInButton forceRedirectUrl="/" fallbackRedirectUrl="/">
                <button
                  className={[
                    'rounded-md bg-white px-4 py-2 text-sm font-semibold',
                    'text-slate-950 shadow-sm hover:bg-slate-100',
                  ].join(' ')}
                  type="button"
                >
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton forceRedirectUrl="/" fallbackRedirectUrl="/">
                <button
                  className={[
                    'rounded-md border border-white/60 px-4 py-2 text-sm',
                    'font-semibold text-white hover:bg-white/10',
                  ].join(' ')}
                  type="button"
                >
                  Sign up
                </button>
              </SignUpButton>
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <HealthCard
            badge={
              neonHealth.ok
                ? <Badge tone="green">OK</Badge>
                : <Badge tone="red">ERROR</Badge>
            }
            title="Neon"
          >
            <p className="text-sm leading-6 text-slate-600">{neonHealth.message}</p>
          </HealthCard>

          <HealthCard
            badge={
              clerkConfigured
                ? <Badge tone="green">CONFIGURED</Badge>
                : <Badge tone="amber">SETUP</Badge>
            }
            title="Clerk"
          >
            <p className="text-sm leading-6 text-slate-600">
              {clerkConfigured
                ? 'Clerk env vars are present and auth UI is enabled.'
                : 'Clerk env vars are missing, so sign-in is disabled.'}
            </p>
          </HealthCard>

          <HealthCard
            badge={
              userSync.status === 'synced'
                ? <Badge tone="green">SYNCED</Badge>
                : <Badge tone={userSync.status === 'error' ? 'red' : 'blue'}>PENDING</Badge>
            }
            title="User Row"
          >
            <p className="text-sm leading-6 text-slate-600">{userSync.message}</p>
          </HealthCard>
        </div>

        {syncedUser ? (
          <section className="rounded-lg border border-emerald-300/40 bg-white p-5 shadow-sm">
            <div
              className={[
                'mb-4 flex flex-col gap-2 sm:flex-row',
                'sm:items-center sm:justify-between',
              ].join(' ')}
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Neon users row</h2>
                <p className="text-sm text-slate-600">
                  This is the local application user resolved from Clerk.
                </p>
              </div>
              <Badge tone="green">READY FOR RBAC</Badge>
            </div>
            <SyncDetails user={syncedUser} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
