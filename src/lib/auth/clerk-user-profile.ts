export interface ClerkLocalUserProfile {
  clerkId: string;
  email: string;
  fullName: string;
}

interface ClerkEmailAddressWebhookSource {
  id: string;
  email_address: string;
}

interface ClerkEmailAddressBackendSource {
  id: string;
  emailAddress: string;
}

export interface ClerkWebhookUserProfileSource {
  id: string;
  first_name: string | null;
  last_name: string | null;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddressWebhookSource[];
}

export interface ClerkBackendUserProfileSource {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primaryEmailAddressId: string | null;
  emailAddresses: ClerkEmailAddressBackendSource[];
}

function fallbackEmail(clerkId: string): string {
  return `${clerkId}@no-email.clerk.local`;
}

export function buildClerkFullName(
  firstName: string | null,
  lastName: string | null,
): string {
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return fullName.length > 0 ? fullName : 'Unknown User';
}

export function selectPrimaryWebhookEmail(
  data: Pick<ClerkWebhookUserProfileSource, 'email_addresses' | 'primary_email_address_id'>,
): string | null {
  const primary = data.email_addresses.find(
    (entry) => entry.id === data.primary_email_address_id,
  );
  if (primary?.email_address) {
    return primary.email_address;
  }

  return data.email_addresses[0]?.email_address ?? null;
}

export function selectPrimaryBackendEmail(
  data: Pick<ClerkBackendUserProfileSource, 'emailAddresses' | 'primaryEmailAddressId'>,
): string | null {
  const primary = data.emailAddresses.find(
    (entry) => entry.id === data.primaryEmailAddressId,
  );
  if (primary?.emailAddress) {
    return primary.emailAddress;
  }

  return data.emailAddresses[0]?.emailAddress ?? null;
}

export function profileFromWebhookUser(
  data: ClerkWebhookUserProfileSource,
): ClerkLocalUserProfile {
  return {
    clerkId: data.id,
    email: selectPrimaryWebhookEmail(data) ?? fallbackEmail(data.id),
    fullName: buildClerkFullName(data.first_name, data.last_name),
  };
}

export function profileFromBackendUser(
  data: ClerkBackendUserProfileSource,
): ClerkLocalUserProfile {
  return {
    clerkId: data.id,
    email: selectPrimaryBackendEmail(data) ?? fallbackEmail(data.id),
    fullName: buildClerkFullName(data.firstName, data.lastName),
  };
}
