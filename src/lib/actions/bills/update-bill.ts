'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import { updateBillUseCase } from '@/lib/use-cases/bills';
import { updateBillSchema } from '@/lib/validators/bill.schemas';
import type {
  ActionResult,
  Bill,
  UpdateBillInput,
} from '@/types';

import { toBillActionError } from './errors';
import { BILL_EDITOR_ROLES } from './permissions';

export async function updateBill(
  input: UpdateBillInput,
): Promise<ActionResult<Bill>> {
  try {
    assertDatabaseConfigured();
    const parsed = updateBillSchema.parse(input);
    const actor = await requireAuth();
    requireRole(actor, BILL_EDITOR_ROLES);
    const updated = await updateBillUseCase(parsed, actor);
    revalidatePath('/bills');
    revalidatePath(`/bills/${updated.id}`);
    return { ok: true, data: updated };
  } catch (error) {
    return toBillActionError(error);
  }
}
