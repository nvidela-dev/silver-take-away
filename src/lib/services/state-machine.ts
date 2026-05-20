import type { BillActionType, BillStatus } from "@/types";

/**
 * Status transitions driven by user actions.
 *
 * `delete` is omitted intentionally — it is a hard-delete operation rather than
 * a status transition, and is gated via `canDelete()` below.
 *
 * Payment-failure transitions (e.g. `initiated -> payment_failed`) are not
 * user-driven and are owned by the payment lifecycle service. They are not
 * represented here.
 */
export const TRANSITION_MAP = {
  draft: {
    submit_for_approval: "awaiting_approval",
    archive: "archived",
  },
  awaiting_approval: {
    approve: "approved",
    reject: "rejected",
  },
  approved: {
    schedule_payment: "scheduled",
    mark_as_paid: "paid",
    archive: "archived",
  },
  scheduled: {
    initiate_payment: "initiated",
    cancel_payment: "approved",
    unschedule: "approved",
  },
  initiated: {
    mark_as_paid: "paid",
    cancel_payment: "approved",
  },
  paid: {
    archive: "archived",
  },
  archived: {},
  rejected: {
    archive: "archived",
  },
  payment_failed: {
    retry_payment: "initiated",
    archive: "archived",
  },
} as const satisfies Record<
  BillStatus,
  Partial<Record<BillActionType, BillStatus>>
>;

/** Statuses from which a hard delete is allowed (drafts only, per spec §6). */
const DELETABLE_STATUSES = new Set<BillStatus>(["draft"]);

export class InvalidTransitionError extends Error {
  readonly code = "INVALID_TRANSITION";
  constructor(
    readonly current: BillStatus,
    readonly action: BillActionType,
  ) {
    super(
      `Cannot perform action "${action}" on a bill in status "${current}".`,
    );
    this.name = "InvalidTransitionError";
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
  const next = TRANSITION_MAP[current][action as keyof (typeof TRANSITION_MAP)[typeof current]];
  if (!next) {
    throw new InvalidTransitionError(current, action);
  }
  return next;
}

/** Returns the set of actions available from a given status (excludes delete). */
export function getAvailableActions(status: BillStatus): BillActionType[] {
  const actions = Object.keys(TRANSITION_MAP[status]) as BillActionType[];
  if (DELETABLE_STATUSES.has(status)) {
    return [...actions, "delete"];
  }
  return actions;
}

/** Whether a hard delete is allowed in this status. */
export function canDelete(status: BillStatus): boolean {
  return DELETABLE_STATUSES.has(status);
}
