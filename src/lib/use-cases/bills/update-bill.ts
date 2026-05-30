import {
  BillNotFoundError,
  getBillById,
  updateDraftBill,
} from '@/lib/repositories/bills';
import { assertDraftBillEditable } from '@/lib/services/bill-transitions';
import type { Bill } from '@/lib/types/bill/bill';
import type { UpdateBillInput } from '@/lib/types/bill/inputs';
import type { User } from '@/lib/types/user';

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
