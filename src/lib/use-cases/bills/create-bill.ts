import { createDraftBill } from '@/lib/repositories/bills';
import type { Bill } from '@/lib/types/bill/bill';
import type { CreateBillInput } from '@/lib/types/bill/inputs';
import type { User } from '@/lib/types/user';

export async function createBillUseCase(
  input: CreateBillInput,
  actor: User,
): Promise<Bill> {
  return createDraftBill(input, actor);
}
