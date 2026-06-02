'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import { bulkTransitionPaymentsUseCase } from '@/lib/use-cases/payments';
import { bulkRetryPaymentsSchema } from '@/lib/validators/payment.schemas';
import type { Payment } from '@/lib/types/payment/payment';
import type { ActionResult } from '@/lib/types/common';

import { toPaymentActionError } from './errors';
import { PAYMENT_TRANSITION_ROLES } from './permissions';

export async function bulkRetryPayments(
  input: { paymentIds: string[]; note?: string },
): Promise<ActionResult<Payment[]>> {
  try {
    assertDatabaseConfigured();
    const parsed = bulkRetryPaymentsSchema.parse(input);
    const actor = await requireAuth();
    requireRole(actor, PAYMENT_TRANSITION_ROLES);
    const updated = await bulkTransitionPaymentsUseCase({
      paymentIds: parsed.paymentIds,
      action: 'retry',
      actor,
      note: parsed.note,
    });
    revalidatePath('/payments');
    return { ok: true, data: updated };
  } catch (error) {
    return toPaymentActionError(error);
  }
}
