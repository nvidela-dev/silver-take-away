import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { Webhook } from 'svix';

import { assertDatabaseConfigured } from '@/db';
import { profileFromWebhookUser } from '@/lib/auth/clerk-user-profile';
import { upsertLocalUserFromClerkProfile } from '@/lib/auth/user-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  const localUser = await upsertLocalUserFromClerkProfile(
    profileFromWebhookUser(event.data),
  );

  return NextResponse.json({ ok: true, userId: localUser.id });
}
