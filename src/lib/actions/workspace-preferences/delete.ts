'use server';

import { z } from 'zod';

import { assertDatabaseConfigured } from '@/db';
import { UnauthorizedError, requireAuth } from '@/lib/auth/require-auth';
import { ForbiddenError } from '@/lib/auth/require-role';
import { deleteUserWorkspaceTabPreference } from '@/lib/repositories/user-preferences.repo';
import type { ActionResult } from '@/lib/types/common';
import { deleteWorkspaceTabPreferenceSchema } from '@/lib/validators/workspace-preferences.schemas';

export async function deleteWorkspaceTabPreference(
  input: unknown,
): Promise<ActionResult<true>> {
  try {
    assertDatabaseConfigured();
    const parsed = deleteWorkspaceTabPreferenceSchema.parse(input);
    const actor = await requireAuth();
    await deleteUserWorkspaceTabPreference(actor.id, parsed.workspaceKey);
    return { ok: true, data: true };
  } catch (error) {
    return toError(error);
  }
}

function toError(error: unknown): ActionResult<never> {
  if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }
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
