// Per-user, per-tab saved view preferences. Persisted to
// `users.workspace_preferences` (jsonb) and mirrored 1:1 by the client
// filter/sort/column state.
//
// Tab keys are namespaced by workspace to avoid collisions when the same
// tab name is reused (e.g. `payment` exists on bills, `processing` is
// payment-only).

export const WORKSPACE_KEYS = [
  'bills.drafts',
  'bills.approvals',
  'bills.payment',
  'bills.history',
  'payments.upcoming',
  'payments.processing',
  'payments.history',
] as const;

export type WorkspaceKey = (typeof WORKSPACE_KEYS)[number];

// Bumped on breaking schema changes; deserializers should ignore entries
// with an unrecognized version so an older client doesn't load values it
// can't interpret.
export const WORKSPACE_PREFERENCES_VERSION = 1 as const;

export interface WorkspaceTabPreferences {
  version: typeof WORKSPACE_PREFERENCES_VERSION;
  filters: Record<string, unknown>;
  sort: { by: string; dir: 'asc' | 'desc' };
  pageSize: number;
  hiddenColumns: string[];
}

export type WorkspacePreferencesMap = Partial<Record<WorkspaceKey, WorkspaceTabPreferences>>;
