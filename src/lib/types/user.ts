// User domain. Mirrors the `users` table in the database schema.

import type { UserRole } from './enums';

export interface User {
  id: string;
  mockUserKey: string;
  email: string;
  fullName: string;
  role: UserRole;
  // Map of saved workspace preferences keyed by workspace+tab (e.g.
  // `bills.drafts`). Stored as jsonb on the `users` table; the typed
  // shape of each entry lives in `@/lib/types/workspace-preferences`.
  workspacePreferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
