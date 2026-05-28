export interface CreateBillActivityLogRecord {
  id: string;
  billId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown> | null;
}

export function toBillActivityLogInsert(record: CreateBillActivityLogRecord) {
  return {
    id: record.id,
    billId: record.billId,
    actorId: record.actorId,
    action: record.action,
    metadata: record.metadata ?? null,
  };
}
