'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { requireRole } from '@/lib/auth/require-role';
import { bulkDeleteDraftsUseCase } from '@/lib/use-cases/bills';
import { bulkDeleteDraftsSchema } from '@/lib/validators/bill.schemas';
import type { BulkDeleteDraftsInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';

import { toBillActionError } from './errors';
import { BILL_DELETE_ROLES } from './permissions';

export async function bulkDeleteBills(
  input: BulkDeleteDraftsInput,
): Promise<ActionResult<{ count: number }>> {
  try {
    assertDatabaseConfigured();
    const parsed = bulkDeleteDraftsSchema.parse(input);
    const actor = await getCurrentUser();
    requireRole(actor, BILL_DELETE_ROLES);
    await bulkDeleteDraftsUseCase(parsed.billIds);
    revalidatePath('/bills');
    return { ok: true, data: { count: parsed.billIds.length } };
  } catch (error) {
    return toBillActionError(error);
  }
}
