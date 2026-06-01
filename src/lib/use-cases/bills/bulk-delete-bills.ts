import { deleteDraftBills } from '@/lib/repositories/bills';

export async function bulkDeleteDraftsUseCase(billIds: string[]): Promise<void> {
  await deleteDraftBills(billIds);
}
