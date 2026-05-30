'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import { createBillUseCase } from '@/lib/use-cases/bills';
import { createBillSchema } from '@/lib/validators/bill.schemas';
import type { Bill } from '@/lib/types/bill/bill';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';

import { toBillActionError } from './errors';
import { BILL_EDITOR_ROLES } from './permissions';

export async function createBill(
  input: CreateBillInput,
): Promise<ActionResult<Bill>> {
  try {
    assertDatabaseConfigured();
    const parsed = createBillSchema.parse(input);
    const actor = await requireAuth();
    requireRole(actor, BILL_EDITOR_ROLES);
    const bill = await createBillUseCase(parsed, actor);
    revalidatePath('/bills');
    return { ok: true, data: bill };
  } catch (error) {
    return toBillActionError(error);
  }
}
