import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserJSON } from '@clerk/backend';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';
import { Webhook } from 'svix';

import { assertDatabaseConfigured, db } from '@/db';
import { users } from '@/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildFullName(firstName: string | null, lastName: string | null): string {
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return fullName.length > 0 ? fullName : 'Unknown User';
}

function selectPrimaryEmail(data: UserJSON): string | null {
  const primary = data.email_addresses.find(
    (entry) => entry.id === data.primary_email_address_id,
  );
  if (primary?.email_address) {
    return primary.email_address;
  }

  return data.email_addresses[0]?.email_address ?? null;
}

export async function POST(req: NextRequest) {
  try {
    assertDatabaseConfigured();
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'CLERK_WEBHOOK_SECRET is not configured.' },
      { status: 500 },
    );
  }

  const headerStore = await headers();
  const svixId = headerStore.get('svix-id');
  const svixTimestamp = headerStore.get('svix-timestamp');
  const svixSignature = headerStore.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers.' }, { status: 400 });
  }

  const payload = await req.text();
  const verifier = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    event = verifier.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  if (event.type !== 'user.created' && event.type !== 'user.updated') {
    return NextResponse.json({ ok: true });
  }

  const userData = event.data;
  const email = selectPrimaryEmail(userData)
    ?? `${userData.id}@no-email.clerk.local`;
  const fullName = buildFullName(userData.first_name, userData.last_name);

  await db
    .insert(users)
    .values({
      clerkId: userData.id,
      email,
      fullName,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email,
        fullName,
        updatedAt: sql`now()`,
      },
    });

  return NextResponse.json({ ok: true });
}
