import { currentUser } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';

import { assertDatabaseConfigured, db } from '@/db';
import { users } from '@/db/schema';
import type { User } from '@/lib/types/user';

import {
  type ClerkLocalUserProfile,
  profileFromBackendUser,
} from './clerk-user-profile';

// Stable advisory-lock key for the one-time admin-bootstrap path. Two
// concurrent first-time sign-ups would otherwise both see `no privileged
// user exists` and both become admin; the lock serializes them.
// Fits in a signed bigint, which is what pg_advisory_xact_lock expects.
const BOOTSTRAP_LOCK_KEY = 23_487_211_287;

export async function upsertLocalUserFromClerkProfile(
  profile: ClerkLocalUserProfile,
): Promise<User> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${BOOTSTRAP_LOCK_KEY})`);

    const privilegedRows = await tx.execute(sql`
      select 1
      from users
      where role in ('admin', 'owner', 'ap_clerk')
      limit 1
    `);
    const role = privilegedRows.rows.length === 0 ? 'admin' : 'employee';

    const [user] = await tx
      .insert(users)
      .values({
        clerkId: profile.clerkId,
        email: profile.email,
        fullName: profile.fullName,
        role,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: profile.email,
          fullName: profile.fullName,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    if (!user) {
      throw new Error('Failed to upsert Clerk user into Neon.');
    }

    return user;
  });
}

export async function syncCurrentClerkUserToNeon(): Promise<User | null> {
  assertDatabaseConfigured();

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  return upsertLocalUserFromClerkProfile(profileFromBackendUser(clerkUser));
}
