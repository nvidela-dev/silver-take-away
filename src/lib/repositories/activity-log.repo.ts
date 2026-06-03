export interface CreateBillActivityLogRecord {
  id: string;
  billId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown> | null;
}

export interface BillActivityLogInsert {
  id: string;
  billId: string;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
}

export function toBillActivityLogInsert(
  record: CreateBillActivityLogRecord,
): BillActivityLogInsert {
  return {
    id: record.id,
    billId: record.billId,
    actorId: record.actorId,
    action: record.action,
    metadata: record.metadata ?? null,
  };
}
