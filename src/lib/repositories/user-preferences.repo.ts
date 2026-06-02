import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import {
  WORKSPACE_PREFERENCES_VERSION,
  type WorkspaceKey,
  type WorkspacePreferencesMap,
  type WorkspaceTabPreferences,
} from '@/lib/types/workspace-preferences';

// Defensive read: filter out malformed entries and entries from an older
// preference schema version, so a client running new code never tries to
// hydrate from a payload it doesn't understand.
export function deserializeWorkspacePreferences(raw: unknown): WorkspacePreferencesMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: WorkspacePreferencesMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const entry = value as Partial<WorkspaceTabPreferences>;
    if (entry.version !== WORKSPACE_PREFERENCES_VERSION) continue;
    if (!entry.sort || typeof entry.sort.by !== 'string') continue;
    if (typeof entry.pageSize !== 'number') continue;
    if (!Array.isArray(entry.hiddenColumns)) continue;
    if (!entry.filters || typeof entry.filters !== 'object') continue;
    out[key as WorkspaceKey] = {
      version: WORKSPACE_PREFERENCES_VERSION,
      filters: entry.filters as Record<string, unknown>,
      sort: { by: entry.sort.by, dir: entry.sort.dir ?? 'desc' },
      pageSize: entry.pageSize,
      hiddenColumns: entry.hiddenColumns as string[],
    };
  }
  return out;
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
