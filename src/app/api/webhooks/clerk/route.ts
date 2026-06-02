import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { Webhook } from 'svix';
import { z } from 'zod';

import { assertDatabaseConfigured } from '@/db';
import { profileFromWebhookUser } from '@/lib/auth/clerk-user-profile';
import { upsertLocalUserFromClerkProfile } from '@/lib/auth/user-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const webhookEventSchema = z.object({
  type: z.string(),
  data: z.unknown(),
});

const clerkWebhookUserSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  primary_email_address_id: z.string().nullable(),
  email_addresses: z.array(z.object({
    id: z.string(),
    email_address: z.string(),
  })),
});

export async function POST(req: NextRequest) {
  try {
    assertDatabaseConfigured();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database is not configured.' },
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

  let verifiedEvent: unknown;
  try {
    verifiedEvent = verifier.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  const parsedEvent = webhookEventSchema.safeParse(verifiedEvent);
  if (!parsedEvent.success) {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }
  const event = parsedEvent.data;

  if (event.type !== 'user.created' && event.type !== 'user.updated') {
    return NextResponse.json({ ok: true });
  }

  const parsedUser = clerkWebhookUserSchema.safeParse(event.data);
  if (!parsedUser.success) {
    return NextResponse.json({ error: 'Invalid Clerk user payload.' }, { status: 400 });
  }

  const localUser = await upsertLocalUserFromClerkProfile(
    profileFromWebhookUser(parsedUser.data),
  );

  return NextResponse.json({ ok: true, userId: localUser.id });
}
