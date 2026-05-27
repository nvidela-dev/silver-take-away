import {
  buildClerkFullName,
  profileFromBackendUser,
  profileFromWebhookUser,
  selectPrimaryBackendEmail,
  selectPrimaryWebhookEmail,
} from '@/lib/auth/clerk-user-profile';

describe('buildClerkFullName', () => {
  it('combines first and last name', () => {
    expect(buildClerkFullName('Ada', 'Lovelace')).toBe('Ada Lovelace');
  });

  it('falls back when Clerk has no name fields', () => {
    expect(buildClerkFullName(null, null)).toBe('Unknown User');
  });
});

describe('Clerk email selection', () => {
  it('selects the primary webhook email when present', () => {
    expect(selectPrimaryWebhookEmail({
      primary_email_address_id: 'email_2',
      email_addresses: [
        { id: 'email_1', email_address: 'backup@example.com' },
        { id: 'email_2', email_address: 'primary@example.com' },
      ],
    })).toBe('primary@example.com');
  });

  it('falls back to the first webhook email', () => {
    expect(selectPrimaryWebhookEmail({
      primary_email_address_id: 'missing',
      email_addresses: [
        { id: 'email_1', email_address: 'first@example.com' },
      ],
    })).toBe('first@example.com');
  });

  it('selects the primary backend email when present', () => {
    expect(selectPrimaryBackendEmail({
      primaryEmailAddressId: 'email_2',
      emailAddresses: [
        { id: 'email_1', emailAddress: 'backup@example.com' },
        { id: 'email_2', emailAddress: 'primary@example.com' },
      ],
    })).toBe('primary@example.com');
  });
});

describe('Clerk local profile mapping', () => {
  it('maps a webhook user into local user values', () => {
    expect(profileFromWebhookUser({
      id: 'user_123',
      first_name: 'Grace',
      last_name: 'Hopper',
      primary_email_address_id: 'email_1',
      email_addresses: [
        { id: 'email_1', email_address: 'grace@example.com' },
      ],
    })).toEqual({
      clerkId: 'user_123',
      email: 'grace@example.com',
      fullName: 'Grace Hopper',
    });
  });

  it('maps a backend user into local user values', () => {
    expect(profileFromBackendUser({
      id: 'user_456',
      firstName: 'Katherine',
      lastName: 'Johnson',
      primaryEmailAddressId: 'email_1',
      emailAddresses: [
        { id: 'email_1', emailAddress: 'katherine@example.com' },
      ],
    })).toEqual({
      clerkId: 'user_456',
      email: 'katherine@example.com',
      fullName: 'Katherine Johnson',
    });
  });
});
