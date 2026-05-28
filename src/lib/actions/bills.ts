'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { assertDatabaseConfigured } from '@/db';
import { requireAuth, UnauthorizedError } from '@/lib/auth/require-auth';
import { ForbiddenError, requireRole } from '@/lib/auth/require-role';
import {
  BillConflictError,
  BillNotFoundError,
  createDraftBill,
  deleteDraftBill,
  getBillById,
  updateDraftBill,
} from '@/lib/repositories/bill.repo';
import {
  DraftBillGuardError,
  assertDraftBillEditable,
} from '@/lib/services/bill-transitions';
import {
  billIdSchema,
  createBillSchema,
  updateBillSchema,
} from '@/lib/validators/bill.schemas';
import type {
  ActionResult,
  Bill,
  CreateBillInput,
  UpdateBillInput,
} from '@/types';

type BillActionResult = ActionResult<Bill>;
const BILL_EDITOR_ROLES = ['admin', 'owner', 'ap_clerk'] as const;
const BILL_DELETE_ROLES = ['admin', 'owner'] as const;

function toActionError(error: unknown): ActionResult<never> {
  if (
    error instanceof UnauthorizedError
    || error instanceof ForbiddenError
    || error instanceof BillNotFoundError
    || error instanceof BillConflictError
    || error instanceof DraftBillGuardError
  ) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  if (error instanceof z.ZodError) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues[0]?.message ?? 'Bill input is invalid.',
      },
    };
  }

  return {
    ok: false,
    error: {
      code: 'UNKNOWN',
      message: 'Something went wrong while saving the draft bill.',
    },
  };
}

export async function createBill(input: CreateBillInput): Promise<BillActionResult> {
  try {
    assertDatabaseConfigured();
    const parsed = createBillSchema.parse(input);
    const actor = await requireAuth();
    requireRole(actor, BILL_EDITOR_ROLES);
    const bill = await createDraftBill(parsed, actor);
    revalidatePath('/bills');
    return { ok: true, data: bill };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateBill(input: UpdateBillInput): Promise<BillActionResult> {
  try {
    assertDatabaseConfigured();
    const parsed = updateBillSchema.parse(input);
    const actor = await requireAuth();
    requireRole(actor, BILL_EDITOR_ROLES);
    const bill = await getBillById(parsed.id);
    if (!bill) {
      throw new BillNotFoundError();
    }
    assertDraftBillEditable(bill);
    const updated = await updateDraftBill(parsed, actor);
    revalidatePath('/bills');
    revalidatePath(`/bills/${updated.id}`);
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteBill(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    assertDatabaseConfigured();
    const parsed = billIdSchema.parse(id);
    const actor = await requireAuth();
    requireRole(actor, BILL_DELETE_ROLES);
    const bill = await getBillById(parsed);
    if (!bill) {
      throw new BillNotFoundError();
    }
    assertDraftBillEditable(bill);
    await deleteDraftBill(parsed);
    revalidatePath('/bills');
    return { ok: true, data: { id: parsed } };
  } catch (error) {
    return toActionError(error);
  }
}
