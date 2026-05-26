import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

/**
 * Build-safe fallback:
 * Next.js can evaluate route modules at build time (including webhook routes).
 * We avoid throwing during module import and rely on runtime env configuration
 * for real DB operations.
 */
const databaseUrl = process.env.DATABASE_URL
  ?? 'postgresql://user:password@localhost:5432/dbname';
const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
export { schema };
