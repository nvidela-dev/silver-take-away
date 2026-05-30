'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import { transitionBillUseCase } from '@/lib/use-cases/bills';
import { approveBillSchema } from '@/lib/validators/bill.schemas';
import type { Bill } from '@/lib/types/bill/bill';
import type { ApproveBillInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';

import { toBillActionError } from './errors';
import { BILL_APPROVAL_ROLES } from './permissions';

export async function approveBill(
  input: ApproveBillInput,
): Promise<ActionResult<Bill>> {
  try {
    assertDatabaseConfigured();
    const parsed = approveBillSchema.parse(input);
    const actor = await requireAuth();
    requireRole(actor, BILL_APPROVAL_ROLES);
    const bill = await transitionBillUseCase({
      billId: parsed.billId,
      action: 'approve',
      actor,
      note: parsed.note,
      expectedUpdatedAt: parsed.expectedUpdatedAt,
    });
    revalidatePath('/bills');
    revalidatePath(`/bills/${bill.id}`);
    return { ok: true, data: bill };
  } catch (error) {
    return toBillActionError(error);
  }
}
