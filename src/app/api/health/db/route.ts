import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { assertDatabaseConfigured, db } from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  try {
    assertDatabaseConfigured();
    await db.execute(sql`select 1 as ok`);
    const schemaResult = await db.execute<{ users_table: string | null }>(
      sql`select to_regclass('public.users')::text as users_table`,
    );
    const hasUsersTable = Boolean(schemaResult.rows[0]?.users_table);

    return NextResponse.json(
      {
        ok: hasUsersTable,
        provider: 'neon',
        latencyMs: Date.now() - startedAt,
        schema: {
          users: hasUsersTable,
        },
        message: hasUsersTable
          ? 'Connected to Neon and app schema is present.'
          : 'Connected to Neon, but app schema is missing. Run the database migration.',
      },
      { status: hasUsersTable ? 200 : 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        provider: 'neon',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown database error.',
      },
      { status: 503 },
    );
  }
}
