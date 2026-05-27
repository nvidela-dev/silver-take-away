import type { User } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { assertDatabaseConfigured, db } from '@/db';
import { users } from '@/db/schema';

import { syncCurrentClerkUserToNeon } from './user-sync';

export class UnauthorizedError extends Error {
  readonly code = 'UNAUTHENTICATED';

  constructor(message = 'You must be signed in to perform this action.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export async function requireAuth(): Promise<User> {
  assertDatabaseConfigured();

  const authState = await auth();
  if (!authState.userId) {
    throw new UnauthorizedError();
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, authState.userId))
    .limit(1);

  if (!user) {
    const syncedUser = await syncCurrentClerkUserToNeon();
    if (syncedUser?.clerkId === authState.userId) {
      return syncedUser;
    }

    throw new UnauthorizedError('Authenticated Clerk user could not be synced to Neon.');
  }

  return user;
}
