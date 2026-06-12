'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { requireRole } from '@/lib/auth/require-role';
import { bulkTransitionBillsUseCase } from '@/lib/use-cases/bills';
import { bulkSubmitForApprovalSchema } from '@/lib/validators/bill.schemas';
import type { Bill } from '@/lib/types/bill/bill';
import type { BulkSubmitForApprovalInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';

import { toBillActionError } from './errors';
import { BILL_SUBMIT_ROLES } from './permissions';

export async function bulkSubmitForApproval(
  input: BulkSubmitForApprovalInput,
): Promise<ActionResult<Bill[]>> {
  try {
    assertDatabaseConfigured();
    const parsed = bulkSubmitForApprovalSchema.parse(input);
    const actor = await getCurrentUser();
    requireRole(actor, BILL_SUBMIT_ROLES);
    const updated = await bulkTransitionBillsUseCase({
      billIds: parsed.billIds,
      action: 'submit_for_approval',
      actor,
    });
    revalidatePath('/bills');
    return { ok: true, data: updated };
  } catch (error) {
    return toBillActionError(error);
  }
}
