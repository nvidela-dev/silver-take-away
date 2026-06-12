'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { requireRole } from '@/lib/auth/require-role';
import { bulkTransitionBillsUseCase } from '@/lib/use-cases/bills';
import { bulkApproveBillsSchema } from '@/lib/validators/bill.schemas';
import type { Bill } from '@/lib/types/bill/bill';
import type { BulkApproveBillsInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';

import { toBillActionError } from './errors';
import { BILL_APPROVAL_ROLES } from './permissions';

export async function bulkApproveBills(
  input: BulkApproveBillsInput,
): Promise<ActionResult<Bill[]>> {
  try {
    assertDatabaseConfigured();
    const parsed = bulkApproveBillsSchema.parse(input);
    const actor = await getCurrentUser();
    requireRole(actor, BILL_APPROVAL_ROLES);
    const updated = await bulkTransitionBillsUseCase({
      billIds: parsed.billIds,
      action: 'approve',
      actor,
      note: parsed.note,
    });
    revalidatePath('/bills');
    return { ok: true, data: updated };
  } catch (error) {
    return toBillActionError(error);
  }
}
