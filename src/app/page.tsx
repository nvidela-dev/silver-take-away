import { sql } from 'drizzle-orm';

import { assertDatabaseConfigured, db } from '@/db';

export const dynamic = 'force-dynamic';

async function getNeonHealth() {
  try {
    assertDatabaseConfigured();
    await db.execute(sql`select 1 as ok`);
    return { ok: true, message: 'Connected' } as const;
  } catch (error) {
    return {
      ok: false,
      message: (error as Error).message,
    } as const;
  }
}

export default async function Home() {
  const neonHealth = await getNeonHealth();

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-4 px-6 py-10"
    >
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Bill Pay MVP</h1>
      <p className="text-slate-600">Runtime environment check.</p>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium text-slate-900">Neon Health</h2>
          <span
            className={[
              'rounded-md px-2.5 py-1 text-xs font-semibold',
              neonHealth.ok
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-rose-100 text-rose-900',
            ].join(' ')}
          >
            {neonHealth.ok ? 'OK' : 'ERROR'}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-600">{neonHealth.message}</p>
      </section>
    </main>
  );
}
