import { z } from 'zod';

import { UnauthorizedError } from '@/lib/auth/require-auth';
import { ForbiddenError } from '@/lib/auth/require-role';
import {
  BillConflictError,
  BillNotFoundError,
} from '@/lib/repositories/bills';
import { DraftBillGuardError } from '@/lib/services/bill-transitions';
import { InvalidTransitionError } from '@/lib/services/state-machine';
import type { ActionResult } from '@/lib/types/common';

export function toBillActionError(error: unknown): ActionResult<never> {
  if (
    error instanceof UnauthorizedError
    || error instanceof ForbiddenError
    || error instanceof BillNotFoundError
    || error instanceof BillConflictError
    || error instanceof DraftBillGuardError
    || error instanceof InvalidTransitionError
  ) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  if (error instanceof z.ZodError) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues[0]?.message ?? 'Bill input is invalid.',
      },
    };
  }

  return {
    ok: false,
    error: {
      code: 'UNKNOWN',
      message: 'Something went wrong while saving the bill.',
    },
  };
}
