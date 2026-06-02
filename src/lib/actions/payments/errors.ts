import { z } from 'zod';

import { UnauthorizedError } from '@/lib/auth/require-auth';
import { ForbiddenError } from '@/lib/auth/require-role';
import {
  PaymentBulkConflictError,
  PaymentConflictError,
  PaymentNotFoundError,
} from '@/lib/repositories/payments';
import { InvalidPaymentTransitionError } from '@/lib/services/payment-state-machine';
import { reportUnexpectedError } from '@/lib/observability';
import type { ActionResult } from '@/lib/types/common';

export function toPaymentActionError(
  error: unknown,
  context = 'payment action',
): ActionResult<never> {
  if (
    error instanceof UnauthorizedError
    || error instanceof ForbiddenError
    || error instanceof PaymentNotFoundError
    || error instanceof PaymentConflictError
    || error instanceof PaymentBulkConflictError
    || error instanceof InvalidPaymentTransitionError
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
        message: error.issues[0]?.message ?? 'Payment input is invalid.',
      },
    };
  }

  // Anything past the typed branches above is unexpected: log it server-side
  // (full stack) before returning the safe generic message to the client.
  reportUnexpectedError(context, error);
  return {
    ok: false,
    error: {
      code: 'UNKNOWN',
      message: 'Something went wrong while updating the payment.',
    },
  };
}
