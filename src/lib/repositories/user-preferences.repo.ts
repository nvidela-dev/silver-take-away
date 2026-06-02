import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import {
  type WorkspaceKey,
  type WorkspacePreferencesMap,
  type WorkspaceTabPreferences,
} from '@/lib/types/workspace-preferences';
import {
  workspaceKeySchema,
  workspaceTabPreferencesSchema,
} from '@/lib/validators/workspace-preferences.schemas';

// Defensive read: filter out malformed entries and entries from an older
// preference schema version, so a client running new code never tries to
// hydrate from a payload it doesn't understand.
export function deserializeWorkspacePreferences(raw: unknown): WorkspacePreferencesMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.entries(raw).reduce<WorkspacePreferencesMap>(
    (out, [key, value]) => {
      const workspaceKey = workspaceKeySchema.safeParse(key);
      const preferences = workspaceTabPreferencesSchema.safeParse(value);
      if (!workspaceKey.success || !preferences.success) return out;
      return {
        ...out,
        [workspaceKey.data]: preferences.data,
      };
    },
    {},
  );
}

export async function getUserWorkspacePreferences(
  userId: string,
): Promise<WorkspacePreferencesMap> {
  const [row] = await db
    .select({ workspacePreferences: users.workspacePreferences })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return deserializeWorkspacePreferences(row?.workspacePreferences);
}

export async function setUserWorkspaceTabPreference(
  userId: string,
  workspaceKey: WorkspaceKey,
  preferences: WorkspaceTabPreferences,
): Promise<void> {
  // jsonb_set with `create_if_missing=true` lets us upsert the single
  // key in-place without rewriting the whole document.
  await db
    .update(users)
    .set({
      workspacePreferences: sql`jsonb_set(
        coalesce(${users.workspacePreferences}, '{}'::jsonb),
        ${`{${workspaceKey}}`}::text[],
        ${JSON.stringify(preferences)}::jsonb,
        true
      )`,
      updatedAt: sql`now()`,
    })
    .where(eq(users.id, userId));
}

export async function deleteUserWorkspaceTabPreference(
  userId: string,
  workspaceKey: WorkspaceKey,
): Promise<void> {
  // The `- key` operator removes the key when present; a no-op otherwise.
  await db
    .update(users)
    .set({
      workspacePreferences: sql`${users.workspacePreferences} - ${workspaceKey}::text`,
      updatedAt: sql`now()`,
    })
    .where(eq(users.id, userId));
}
