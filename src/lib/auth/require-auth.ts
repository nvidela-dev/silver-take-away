import type { User } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';

export class UnauthorizedError extends Error {
  readonly code = 'UNAUTHENTICATED';

  constructor(message = 'You must be signed in to perform this action.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Resolves the current Clerk session to the local `users` row.
 *
 * Stubbed in PR-0 — the real implementation lands in PR-1 once Clerk is wired
 * up. Server actions and queries should import from here from day one so the
 * later swap is a no-op for callers.
 */
export async function requireAuth(): Promise<User> {
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
    throw new UnauthorizedError(
      'Authenticated Clerk user is not synced to the local users table.',
    );
  }

  return user;
}
