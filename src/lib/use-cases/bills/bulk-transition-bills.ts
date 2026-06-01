import { applyBulkBillStatusTransition } from '@/lib/repositories/bills';
import { assertValidTransition } from '@/lib/services/state-machine';
import type { Bill } from '@/lib/types/bill/bill';
import type { BillActionType } from '@/lib/types/bill/actions';
import type { BillStatus } from '@/lib/types/enums';
import type { User } from '@/lib/types/user';

const ACTION_LOG_STRINGS: Partial<Record<BillActionType, string>> = {
  submit_for_approval: 'submitted_for_approval',
  approve: 'approved',
  reject: 'rejected',
};

const BULK_ACTION_FROM_STATUS: Partial<Record<BillActionType, BillStatus>> = {
  submit_for_approval: 'draft',
  approve: 'awaiting_approval',
  reject: 'awaiting_approval',
};

interface BulkTransitionBillsInput {
  billIds: string[];
  action: BillActionType;
  actor: User;
  note?: string;
}

export async function bulkTransitionBillsUseCase(
  input: BulkTransitionBillsInput,
): Promise<Bill[]> {
  const currentStatus = BULK_ACTION_FROM_STATUS[input.action];
  if (!currentStatus) {
    throw new Error(`Bulk transition for action "${input.action}" is not supported.`);
  }

  const nextStatus = assertValidTransition(currentStatus, input.action);
  const logAction = ACTION_LOG_STRINGS[input.action] ?? input.action;

  return applyBulkBillStatusTransition({
    billIds: input.billIds,
    currentStatus,
    nextStatus,
    action: logAction,
    actor: input.actor,
    note: input.note,
  });
}
