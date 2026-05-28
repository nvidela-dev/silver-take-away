import type { Bill, BillStatus } from '@/types';

export class DraftBillGuardError extends Error {
  readonly code = 'BILL_NOT_DRAFT';

  constructor(status: BillStatus) {
    super(`Draft bill operation is not allowed for bill status "${status}".`);
    this.name = 'DraftBillGuardError';
  }
}

export function assertDraftBillEditable(bill: Pick<Bill, 'status'>): void {
  if (bill.status !== 'draft') {
    throw new DraftBillGuardError(bill.status);
  }
}
