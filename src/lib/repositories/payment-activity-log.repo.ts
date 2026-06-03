export interface CreatePaymentActivityLogRecord {
  id: string;
  paymentId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown> | null;
}

export interface PaymentActivityLogInsert {
  id: string;
  paymentId: string;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
}

export function toPaymentActivityLogInsert(
  record: CreatePaymentActivityLogRecord,
): PaymentActivityLogInsert {
  return {
    id: record.id,
    paymentId: record.paymentId,
    actorId: record.actorId,
    action: record.action,
    metadata: record.metadata ?? null,
  };
}
