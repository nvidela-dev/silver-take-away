'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireRole } from '@/lib/auth/require-role';
import { bulkUpdateDraftsUseCase } from '@/lib/use-cases/bills';
import { bulkEditBillsSchema } from '@/lib/validators/bill.schemas';
import type { Bill } from '@/lib/types/bill/bill';
import type { BulkEditBillsInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';

import { toBillActionError } from './errors';
import { BILL_EDITOR_ROLES } from './permissions';

export async function bulkUpdateBills(
  input: BulkEditBillsInput,
): Promise<ActionResult<Bill[]>> {
  try {
    assertDatabaseConfigured();
    const parsed = bulkEditBillsSchema.parse(input);
    const actor = await requireAuth();
    requireRole(actor, BILL_EDITOR_ROLES);
    const updated = await bulkUpdateDraftsUseCase(parsed, actor);
    revalidatePath('/bills');
    return { ok: true, data: updated };
  } catch (error) {
    return toBillActionError(error);
  }
}
