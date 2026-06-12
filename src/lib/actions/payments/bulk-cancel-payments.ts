'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { requireRole } from '@/lib/auth/require-role';
import { bulkTransitionPaymentsUseCase } from '@/lib/use-cases/payments';
import { bulkCancelPaymentsSchema } from '@/lib/validators/payment.schemas';
import type { Payment } from '@/lib/types/payment/payment';
import type { ActionResult } from '@/lib/types/common';

import { toPaymentActionError } from './errors';
import { PAYMENT_TRANSITION_ROLES } from './permissions';

export async function bulkCancelPayments(
  input: { paymentIds: string[]; note?: string },
): Promise<ActionResult<Payment[]>> {
  try {
    assertDatabaseConfigured();
    const parsed = bulkCancelPaymentsSchema.parse(input);
    const actor = await getCurrentUser();
    requireRole(actor, PAYMENT_TRANSITION_ROLES);
    const updated = await bulkTransitionPaymentsUseCase({
      paymentIds: parsed.paymentIds,
      action: 'cancel',
      actor,
      note: parsed.note,
    });
    revalidatePath('/payments');
    return { ok: true, data: updated };
  } catch (error) {
    return toPaymentActionError(error);
  }
}
