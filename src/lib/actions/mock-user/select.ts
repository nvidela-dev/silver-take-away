'use server';

import { cookies } from 'next/headers';

import {
  getMockUserProfile,
  MOCK_USER_COOKIE_NAME,
  mockUserProfiles,
} from '@/lib/auth/mock-users';

export async function selectMockUser(key: string): Promise<void> {
  const isKnownUser = mockUserProfiles.some((profile) => profile.key === key);
  if (!isKnownUser) {
    throw new Error('Unknown mock user.');
  }

  const profile = getMockUserProfile(key);
  const cookieStore = await cookies();
  cookieStore.set(MOCK_USER_COOKIE_NAME, profile.key, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
