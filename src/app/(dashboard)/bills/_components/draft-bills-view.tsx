import type { DraftBillListItem } from '@/types';

import { DraftBillsTable } from './draft-bills-table';

interface DraftBillsViewProps {
  bills: DraftBillListItem[];
  deleteCandidateId: string | null;
  isLoading: boolean;
  onCancelDelete: () => void;
  onDelete: (id: string) => void;
  onEdit: (bill: DraftBillListItem) => void;
  onRequestDelete: (id: string) => void;
}

export function DraftBillsView({
  bills,
  deleteCandidateId,
  isLoading,
  onCancelDelete,
  onDelete,
  onEdit,
  onRequestDelete,
}: DraftBillsViewProps) {
  return (
    <DraftBillsTable
      bills={bills}
      deleteCandidateId={deleteCandidateId}
      isLoading={isLoading}
      onCancelDelete={onCancelDelete}
      onDelete={onDelete}
      onEdit={onEdit}
      onRequestDelete={onRequestDelete}
    />
  );
}
