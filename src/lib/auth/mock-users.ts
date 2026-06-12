import type { UserRole } from '@/lib/types/enums';

export interface MockUserProfile {
  key: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export const mockUserProfiles = [
  {
    key: 'admin',
    email: 'admin@bill-pay.local',
    fullName: 'Avery Admin',
    role: 'admin',
  },
  {
    key: 'owner',
    email: 'owner@bill-pay.local',
    fullName: 'Olivia Owner',
    role: 'owner',
  },
  {
    key: 'ap-clerk',
    email: 'ap-clerk@bill-pay.local',
    fullName: 'Casey Clerk',
    role: 'ap_clerk',
  },
  {
    key: 'approver',
    email: 'approver@bill-pay.local',
    fullName: 'Parker Approver',
    role: 'approver',
  },
  {
    key: 'employee',
    email: 'employee@bill-pay.local',
    fullName: 'Emery Employee',
    role: 'employee',
  },
] as const satisfies readonly MockUserProfile[];

export type MockUserKey = (typeof mockUserProfiles)[number]['key'];

export const DEFAULT_MOCK_USER_KEY: MockUserKey = 'admin';
export const MOCK_USER_COOKIE_NAME = 'bill-pay-mock-user';

export function getMockUserProfile(key: string | null | undefined): MockUserProfile {
  return mockUserProfiles.find((profile) => profile.key === key)
    ?? mockUserProfiles[0];
}
