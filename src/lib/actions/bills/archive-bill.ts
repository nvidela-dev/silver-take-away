'use server';

import { revalidatePath } from 'next/cache';

import { assertDatabaseConfigured } from '@/db';
import { getCurrentUser } from '@/lib/auth/current-user';
import { requireRole } from '@/lib/auth/require-role';
import { transitionBillUseCase } from '@/lib/use-cases/bills';
import { archiveBillSchema } from '@/lib/validators/bill.schemas';
import type { Bill } from '@/lib/types/bill/bill';
import type { ArchiveBillInput } from '@/lib/types/bill/inputs';
import type { ActionResult } from '@/lib/types/common';

import { toBillActionError } from './errors';
import { BILL_ARCHIVE_ROLES } from './permissions';

export async function archiveBill(
  input: ArchiveBillInput,
): Promise<ActionResult<Bill>> {
  try {
    assertDatabaseConfigured();
    const parsed = archiveBillSchema.parse(input);
    const actor = await getCurrentUser();
    requireRole(actor, BILL_ARCHIVE_ROLES);
    const bill = await transitionBillUseCase({
      billId: parsed.billId,
      action: 'archive',
      actor,
    });
    revalidatePath('/bills');
    revalidatePath(`/bills/${bill.id}`);
    return { ok: true, data: bill };
  } catch (error) {
    return toBillActionError(error);
  }
}
