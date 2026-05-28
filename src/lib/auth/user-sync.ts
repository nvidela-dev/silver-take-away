import { currentUser } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';

import { assertDatabaseConfigured, db } from '@/db';
import { users } from '@/db/schema';
import type { User } from '@/types';

import {
  type ClerkLocalUserProfile,
  profileFromBackendUser,
} from './clerk-user-profile';

async function shouldBootstrapAdminRole(): Promise<boolean> {
  const result = await db.execute(sql`select count(*)::int as count from users`);
  const rows = result.rows as { count: number }[];
  return Number(rows[0]?.count ?? 0) === 0;
}

export async function ensureBootstrapAdminRole(user: User): Promise<User> {
  if (user.role !== 'employee') {
    return user;
  }

  const result = await db.execute(sql`select count(*)::int as count from users`);
  const rows = result.rows as { count: number }[];
  const isOnlyUser = Number(rows[0]?.count ?? 0) === 1;
  if (!isOnlyUser) {
    return user;
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      role: 'admin',
      updatedAt: sql`now()`,
    })
    .where(sql`${users.id} = ${user.id}`)
    .returning();

  return updatedUser ?? user;
}

export async function upsertLocalUserFromClerkProfile(
  profile: ClerkLocalUserProfile,
): Promise<User> {
  const role = await shouldBootstrapAdminRole() ? 'admin' : 'employee';
  const [user] = await db
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

  return ensureBootstrapAdminRole(user);
}

export async function syncCurrentClerkUserToNeon(): Promise<User | null> {
  assertDatabaseConfigured();

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  return upsertLocalUserFromClerkProfile(profileFromBackendUser(clerkUser));
}
