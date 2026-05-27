import { currentUser } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';

import { assertDatabaseConfigured, db } from '@/db';
import { users } from '@/db/schema';
import type { User } from '@/types';

import {
  type ClerkLocalUserProfile,
  profileFromBackendUser,
} from './clerk-user-profile';

export async function upsertLocalUserFromClerkProfile(
  profile: ClerkLocalUserProfile,
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      clerkId: profile.clerkId,
      email: profile.email,
      fullName: profile.fullName,
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
}

export async function syncCurrentClerkUserToNeon(): Promise<User | null> {
  assertDatabaseConfigured();

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  return upsertLocalUserFromClerkProfile(profileFromBackendUser(clerkUser));
}
