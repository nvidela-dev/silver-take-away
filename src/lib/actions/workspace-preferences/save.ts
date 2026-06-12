'use server';

import { z } from 'zod';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { setUserWorkspaceTabPreference } from '@/lib/repositories/user-preferences.repo';
import type { ActionResult } from '@/lib/types/common';
import { saveWorkspaceTabPreferenceSchema } from '@/lib/validators/workspace-preferences.schemas';

export async function saveWorkspaceTabPreference(
  input: unknown,
): Promise<ActionResult<true>> {
  try {
    assertDatabaseConfigured();
    const parsed = saveWorkspaceTabPreferenceSchema.parse(input);
    const actor = await getCurrentUser();
    await setUserWorkspaceTabPreference(actor.id, parsed.workspaceKey, parsed.preferences);
    return { ok: true, data: true };
  } catch (error) {
    return toError(error);
  }
}

function toError(error: unknown): ActionResult<never> {
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues[0]?.message ?? 'Workspace preference input is invalid.',
      },
    };
  }
  return {
    ok: false,
    error: {
      code: 'UNKNOWN',
      message: 'Could not save your view preferences.',
    },
  };
}
