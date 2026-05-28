import {
  BillNotFoundError,
  deleteDraftBill,
  getBillById,
} from '@/lib/repositories/bills';
import { assertDraftBillEditable } from '@/lib/services/bill-transitions';

export async function deleteBillUseCase(id: string): Promise<void> {
  const bill = await getBillById(id);
  if (!bill) {
    throw new BillNotFoundError();
  }

  assertDraftBillEditable(bill);
  await deleteDraftBill(id);
}
