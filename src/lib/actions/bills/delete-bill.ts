'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import { deleteBillUseCase } from '@/lib/use-cases/bills';
import { billIdSchema } from '@/lib/validators/bill.schemas';
import type { ActionResult } from '@/types';

import { toBillActionError } from './errors';
import { BILL_DELETE_ROLES } from './permissions';

export async function deleteBill(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    assertDatabaseConfigured();
    const parsed = billIdSchema.parse(id);
    const actor = await requireAuth();
    requireRole(actor, BILL_DELETE_ROLES);
    await deleteBillUseCase(parsed);
    revalidatePath('/bills');
    return { ok: true, data: { id: parsed } };
  } catch (error) {
    return toBillActionError(error);
  }
}
