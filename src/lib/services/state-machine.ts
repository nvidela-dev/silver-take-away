import { BILL_ACTIONS, type BillActionType } from '@/lib/types/bill/actions';
import type { BillStatus } from '@/lib/types/enums';

/**
 * Status transitions driven by user actions.
 *
 * `delete` is omitted intentionally — it is a hard-delete operation rather than
 * a status transition, and is gated via `canDelete()` below.
 *
 * Archive is available from every status except `draft` (which is deleted,
 * not archived) and `archived` (already terminal). It closes the bill out of
 * the active queue regardless of where it sits — including in-flight payment
 * stages. See `canArchive()` below for the UI-facing gate.
 *
 * Payment-failure transitions (e.g. `initiated -> payment_failed`) are not
 * user-driven and are owned by the payment lifecycle service. They are not
 * represented here.
 */
export const TRANSITION_MAP: Record<
  BillStatus,
  Partial<Record<BillActionType, BillStatus>>
> = {
  draft: {
    submit_for_approval: 'awaiting_approval',
    archive: 'archived',
  },
  awaiting_approval: {
    approve: 'approved',
    reject: 'rejected',
    archive: 'archived',
  },
  approved: {
    schedule_payment: 'scheduled',
    mark_as_paid: 'paid',
    archive: 'archived',
  },
  scheduled: {
    initiate_payment: 'initiated',
    cancel_payment: 'approved',
    unschedule: 'approved',
    archive: 'archived',
  },
  initiated: {
    mark_as_paid: 'paid',
    cancel_payment: 'approved',
    archive: 'archived',
  },
  paid: {
    archive: 'archived',
  },
  archived: {},
  rejected: {
    archive: 'archived',
  },
  payment_failed: {
    retry_payment: 'initiated',
    archive: 'archived',
  },
};

/** Statuses from which a hard delete is allowed (drafts only, per spec §6). */
const DELETABLE_STATUSES = new Set<BillStatus>(['draft']);

export class InvalidTransitionError extends Error {
  readonly code = 'INVALID_TRANSITION';

  constructor(
    readonly current: BillStatus,
    readonly action: BillActionType,
  ) {
    super(
      `Cannot perform action "${action}" on a bill in status "${current}".`,
    );
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Returns the next status for a given action from the current status, or
 * throws `InvalidTransitionError` if the action is not permitted.
 *
 * Pure — no DB access. Safe to unit-test in isolation.
 */
export function assertValidTransition(
  current: BillStatus,
  action: BillActionType,
): BillStatus {
  const next = TRANSITION_MAP[current][action];
  if (!next) {
    throw new InvalidTransitionError(current, action);
  }
  return next;
}

/** Returns the set of actions available from a given status (excludes delete). */
export function getAvailableActions(status: BillStatus): BillActionType[] {
  const actions = BILL_ACTIONS.filter((action) => TRANSITION_MAP[status][action] !== undefined);
  if (DELETABLE_STATUSES.has(status)) {
    return [...actions, 'delete'];
  }
  return actions;
}

/** Whether a hard delete is allowed in this status. */
export function canDelete(status: BillStatus): boolean {
  return DELETABLE_STATUSES.has(status);
}

/**
 * Whether the bill can be archived from this status via the row action.
 * Drafts are excluded — they have a dedicated hard-delete action instead,
 * even though the raw transition map technically allows draft -> archived.
 */
export function canArchive(status: BillStatus): boolean {
  return status !== 'draft' && 'archive' in TRANSITION_MAP[status];
}
