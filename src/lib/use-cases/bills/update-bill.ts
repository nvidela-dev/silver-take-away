import {
  BillNotFoundError,
  getBillById,
  updateDraftBill,
} from '@/lib/repositories/bills';
import { assertDraftBillEditable } from '@/lib/services/bill-transitions';
import type {
  Bill,
  UpdateBillInput,
  User,
} from '@/types';

export async function updateBillUseCase(
  input: UpdateBillInput,
  actor: User,
): Promise<Bill> {
  const bill = await getBillById(input.id);
  if (!bill) {
    throw new BillNotFoundError();
  }

  assertDraftBillEditable(bill);
  return updateDraftBill(input, actor);
}
