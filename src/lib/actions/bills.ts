'use server';

import type {
  ActionResult,
  Bill,
  CreateBillInput,
  UpdateBillInput,
} from '@/types';

import { createBill as createBillAction } from './bills/create-bill';
import { deleteBill as deleteBillAction } from './bills/delete-bill';
import { updateBill as updateBillAction } from './bills/update-bill';

export async function createBill(
  input: CreateBillInput,
): Promise<ActionResult<Bill>> {
  return createBillAction(input);
}

export async function updateBill(
  input: UpdateBillInput,
): Promise<ActionResult<Bill>> {
  return updateBillAction(input);
}

export async function deleteBill(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return deleteBillAction(id);
}
