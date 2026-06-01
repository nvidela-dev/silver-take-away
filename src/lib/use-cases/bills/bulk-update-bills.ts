import { updateDraftBills } from '@/lib/repositories/bills';
import type { Bill } from '@/lib/types/bill/bill';
import type { BulkEditBillsInput } from '@/lib/types/bill/inputs';
import type { User } from '@/lib/types/user';

export async function bulkUpdateDraftsUseCase(
  input: BulkEditBillsInput,
  actor: User,
): Promise<Bill[]> {
  return updateDraftBills(input, actor);
}
