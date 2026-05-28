import { createDraftBill } from '@/lib/repositories/bills';
import type {
  Bill,
  CreateBillInput,
  User,
} from '@/types';

export async function createBillUseCase(
  input: CreateBillInput,
  actor: User,
): Promise<Bill> {
  return createDraftBill(input, actor);
}
