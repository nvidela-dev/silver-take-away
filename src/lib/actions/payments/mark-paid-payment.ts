'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import { transitionPaymentUseCase } from '@/lib/use-cases/payments';
import { markPaidPaymentSchema } from '@/lib/validators/payment.schemas';
import type { Payment } from '@/lib/types/payment/payment';
import type { ActionResult } from '@/lib/types/common';

import { toPaymentActionError } from './errors';
import { PAYMENT_TRANSITION_ROLES } from './permissions';

export async function markPaymentPaid(
  input: { paymentId: string; note?: string },
): Promise<ActionResult<Payment>> {
  try {
    assertDatabaseConfigured();
    const parsed = markPaidPaymentSchema.parse(input);
    const actor = await requireAuth();
    requireRole(actor, PAYMENT_TRANSITION_ROLES);
    const payment = await transitionPaymentUseCase({
      paymentId: parsed.paymentId,
      action: 'mark_paid',
      actor,
      note: parsed.note,
    });
    revalidatePath('/payments');
    revalidatePath(`/payments/${payment.id}`);
    return { ok: true, data: payment };
  } catch (error) {
    return toPaymentActionError(error);
  }
}
