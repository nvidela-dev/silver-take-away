import { sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { assertDatabaseConfigured, db } from '@/db';
import { users } from '@/db/schema';
import type { User } from '@/lib/types/user';

import {
  getMockUserProfile,
  MOCK_USER_COOKIE_NAME,
  type MockUserProfile,
} from './mock-users';

export async function getSelectedMockUserProfile(): Promise<MockUserProfile> {
  const cookieStore = await cookies();
  return getMockUserProfile(cookieStore.get(MOCK_USER_COOKIE_NAME)?.value);
}

export async function getCurrentUser(): Promise<User> {
  assertDatabaseConfigured();

  const profile = await getSelectedMockUserProfile();
  const [user] = await db
    .insert(users)
    .values({
      mockUserKey: profile.key,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    })
    .onConflictDoUpdate({
      target: users.mockUserKey,
      set: {
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  if (!user) {
    throw new Error('Failed to resolve the selected mock user.');
  }

  return user;
}
