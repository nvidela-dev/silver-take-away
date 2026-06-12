import {
  DEFAULT_MOCK_USER_KEY,
  getMockUserProfile,
  mockUserProfiles,
} from '@/lib/auth/mock-users';

describe('mock user profiles', () => {
  it('provides one selectable profile for every role', () => {
    expect(mockUserProfiles.map((profile) => profile.role)).toEqual([
      'admin',
      'owner',
      'ap_clerk',
      'approver',
      'employee',
    ]);
  });

  it('resolves a selected profile by its stable key', () => {
    expect(getMockUserProfile('approver')).toMatchObject({
      fullName: 'Parker Approver',
      role: 'approver',
    });
  });

  it('falls back to the default profile for a missing or invalid cookie', () => {
    expect(getMockUserProfile(undefined).key).toBe(DEFAULT_MOCK_USER_KEY);
    expect(getMockUserProfile('unknown').key).toBe(DEFAULT_MOCK_USER_KEY);
  });
});
