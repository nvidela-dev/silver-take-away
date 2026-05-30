import {
  BillNotFoundError,
  applyBillStatusTransition,
  getBillById,
} from '@/lib/repositories/bills';
import { assertValidTransition } from '@/lib/services/state-machine';
import type { Bill } from '@/lib/types/bill/bill';
import type { BillActionType } from '@/lib/types/bill/actions';
import type { User } from '@/lib/types/user';

const ACTION_LOG_STRINGS: Partial<Record<BillActionType, string>> = {
  submit_for_approval: 'submitted_for_approval',
  approve: 'approved',
  reject: 'rejected',
};

interface TransitionBillInput {
  billId: string;
  action: BillActionType;
  actor: User;
  note?: string;
  expectedUpdatedAt?: string;
}

export async function transitionBillUseCase(
  input: TransitionBillInput,
): Promise<Bill> {
  const bill = await getBillById(input.billId);
  if (!bill) {
    throw new BillNotFoundError();
  }

  const nextStatus = assertValidTransition(bill.status, input.action);
  const logAction = ACTION_LOG_STRINGS[input.action] ?? input.action;

  return applyBillStatusTransition({
    billId: input.billId,
    currentStatus: bill.status,
    nextStatus,
    action: logAction,
    actor: input.actor,
    note: input.note,
    expectedUpdatedAt: input.expectedUpdatedAt,
  });
}
