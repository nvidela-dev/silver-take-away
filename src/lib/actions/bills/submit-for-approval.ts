'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { requireRole } from '@/lib/auth/require-role';
import { transitionBillUseCase } from '@/lib/use-cases/bills';
import { submitForApprovalSchema } from '@/lib/validators/bill.schemas';
import type { Bill } from '@/lib/types/bill/bill';
import type { SubmitForApprovalInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';

import { toBillActionError } from './errors';
import { BILL_SUBMIT_ROLES } from './permissions';

export async function submitForApproval(
  input: SubmitForApprovalInput,
): Promise<ActionResult<Bill>> {
  try {
    assertDatabaseConfigured();
    const parsed = submitForApprovalSchema.parse(input);
    const actor = await getCurrentUser();
    requireRole(actor, BILL_SUBMIT_ROLES);
    const bill = await transitionBillUseCase({
      billId: parsed.billId,
      action: 'submit_for_approval',
      actor,
    });
    revalidatePath('/bills');
    revalidatePath(`/bills/${bill.id}`);
    return { ok: true, data: bill };
  } catch (error) {
    return toBillActionError(error);
  }
}
