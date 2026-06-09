# Lifecycle state machines

Bills and payments each move through an explicit, pure transition map
(`src/lib/services/`). User-driven actions must resolve to a valid transition
before any repository write, and each successful transition appends an activity
record. Failure transitions that are not user-driven (e.g. a processor marking a
payment `in_transit`) live outside these maps.

## Bill transitions

Source: `src/lib/services/state-machine.ts`

| From | Action | To |
|---|---|---|
| `draft` | `submit_for_approval` | `awaiting_approval` |
| `draft` | `archive` | `archived` |
| `awaiting_approval` | `approve` | `approved` |
| `awaiting_approval` | `reject` | `rejected` |
| `approved` | `schedule_payment` | `scheduled` |
| `approved` | `mark_as_paid` | `paid` |
| `scheduled` | `initiate_payment` | `initiated` |
| `scheduled` | `cancel_payment` / `unschedule` | `approved` |
| `initiated` | `mark_as_paid` | `paid` |
| `initiated` | `cancel_payment` | `approved` |
| `payment_failed` | `retry_payment` | `initiated` |
| any except `draft`/`archived` | `archive` | `archived` |

- **Delete** is allowed only from `draft` (it is a hard delete, not a transition).
- **Archive** is offered from every status except `draft` (deleted instead) and
  `archived` (already terminal).

## Payment transitions

Source: `src/lib/services/payment-state-machine.ts`

| From | Action | To |
|---|---|---|
| `pending` | `initiate` | `initiated` |
| `pending` | `cancel` | `cancelled` |
| `scheduled` | `initiate` | `initiated` |
| `scheduled` | `cancel` | `cancelled` |
| `initiated` | `mark_paid` | `paid` |
| `initiated` | `mark_failed` | `failed` |
| `in_transit` | `mark_paid` | `paid` |
| `in_transit` | `mark_failed` | `failed` |
| `failed` | `retry` | `scheduled` |

`paid` and `cancelled` are terminal.

## Roles per action

Role checks use the local `users.role` value (`src/lib/actions/*/permissions.ts`).

| Capability | Allowed roles |
|---|---|
| Edit / create / submit / archive bills | `admin`, `owner`, `ap_clerk` |
| Delete bills | `admin`, `owner` |
| Approve / reject bills | `admin`, `owner`, `approver` |
| Drive payment transitions | `admin`, `owner`, `ap_clerk` |
