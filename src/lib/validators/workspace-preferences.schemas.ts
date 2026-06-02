import { z } from 'zod';

import {
  WORKSPACE_KEYS,
  WORKSPACE_PREFERENCES_VERSION,
} from '@/lib/types/workspace-preferences';

export const workspaceKeySchema = z.enum(WORKSPACE_KEYS);

const sortSchema = z.object({
  by: z.string().min(1).max(64),
  dir: z.enum(['asc', 'desc']),
});

export const workspaceTabPreferencesSchema = z.object({
  version: z.literal(WORKSPACE_PREFERENCES_VERSION),
  // Filters mirror the controller's filter values; the controller is the
  // schema authority for individual filter keys, so we accept any
  // JSON-serialisable record here and revalidate at the controller layer
  // when applying to the URL.
  filters: z.record(z.string(), z.unknown()),
  sort: sortSchema,
  pageSize: z.number().int().positive().max(500),
  hiddenColumns: z.array(z.string().min(1).max(64)).max(64),
});

export const saveWorkspaceTabPreferenceSchema = z.object({
  workspaceKey: workspaceKeySchema,
  preferences: workspaceTabPreferencesSchema,
});

export const deleteWorkspaceTabPreferenceSchema = z.object({
  workspaceKey: workspaceKeySchema,
});

export type SaveWorkspaceTabPreferenceInput = z.infer<typeof saveWorkspaceTabPreferenceSchema>;
export type DeleteWorkspaceTabPreferenceInput = z.infer<typeof deleteWorkspaceTabPreferenceSchema>;
