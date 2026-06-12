'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { requireRole } from '@/lib/auth/require-role';
import { updateBillUseCase } from '@/lib/use-cases/bills';
import { updateBillSchema } from '@/lib/validators/bill.schemas';
import type { Bill } from '@/lib/types/bill/bill';
import type { UpdateBillInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';

import { toBillActionError } from './errors';
import { BILL_EDITOR_ROLES } from './permissions';

export async function updateBill(
  input: UpdateBillInput,
): Promise<ActionResult<Bill>> {
  try {
    assertDatabaseConfigured();
    const parsed = updateBillSchema.parse(input);
    const actor = await getCurrentUser();
    requireRole(actor, BILL_EDITOR_ROLES);
    const updated = await updateBillUseCase(parsed, actor);
    revalidatePath('/bills');
    revalidatePath(`/bills/${updated.id}`);
    return { ok: true, data: updated };
  } catch (error) {
    return toBillActionError(error);
  }
}
