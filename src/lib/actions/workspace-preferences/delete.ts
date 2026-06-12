'use server';

import { z } from 'zod';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { deleteUserWorkspaceTabPreference } from '@/lib/repositories/user-preferences.repo';
import type { ActionResult } from '@/lib/types/common';
import { deleteWorkspaceTabPreferenceSchema } from '@/lib/validators/workspace-preferences.schemas';

export async function deleteWorkspaceTabPreference(
  input: unknown,
): Promise<ActionResult<true>> {
  try {
    assertDatabaseConfigured();
    const parsed = deleteWorkspaceTabPreferenceSchema.parse(input);
    const actor = await getCurrentUser();
    await deleteUserWorkspaceTabPreference(actor.id, parsed.workspaceKey);
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
      message: 'Could not delete your saved view preferences.',
    },
  };
}
