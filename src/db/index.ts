import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

/**
 * Build-safe fallback:
 * Next.js can evaluate route modules at build time (including webhook routes),
 * so we avoid import-time throws here. Real routes must call
 * `assertDatabaseConfigured()` before DB access.
 */
const FALLBACK_DATABASE_URL = 'postgresql://user:password@localhost:5432/dbname';
const databaseUrl = process.env.DATABASE_URL
  ?? FALLBACK_DATABASE_URL;
const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
export { schema };

export function assertDatabaseConfigured(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not configured. Set it in Vercel project environment variables.',
    );
  }
}
