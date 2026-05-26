# Bill Pay MVP — Progress Checklist

Status legend: `READY`, `BLOCKED`, `IN PROGRESS`, `DONE`

---

## PR-0: Foundation & Schema [DONE]

Completed baseline (locked):
- [x] Next.js + TypeScript + core tooling scaffolded.
- [x] Drizzle config, schema, and migrations created.
- [x] Core domain enums/types/validators/state machine implemented.
- [x] Security headers + `proxy.ts` stub configured.
- [x] Jest unit project configured and passing.
- [x] Initial module scaffolding (`actions`, `repositories`, `queries`, `services`) created.

---

## PR-1: Shell Contracts & Navigation Skeleton [READY]

### Ready Criteria
- [x] PR-0 merged baseline is available.

### Execution Checklist
- [ ] Build dashboard shell layout and shared navigation.
- [ ] Add Bills, Payments, Vendors placeholder pages.
- [ ] Add shared page contracts for title/action/header sections.

### Done Criteria
- [ ] **PR1-G1:** Bills, Payments, and Vendors routes are reachable from shared nav.
- [ ] **PR1-G2:** Dashboard shell layout is reused across feature routes.
- [ ] **PR1-G3:** Placeholder routes render without runtime errors in dev and build.

---

## PR-2: Domain Data Layer Core [BLOCKED]

### Ready Criteria
- [ ] PR-1 is merged.
- [ ] Current schema and migrations are stable for repository implementation.

### Execution Checklist
- [ ] Implement repository modules for bills, payments, vendors, line items, and activity logs.
- [ ] Enforce tx/db-friendly signatures for repository methods.
- [ ] Implement `bill-transitions` and `payment-lifecycle` services with transaction boundaries.
- [ ] Add deterministic seed script and wire `db:seed`.
- [ ] Add integration tests for lifecycle happy path and rollback behavior.

### Done Criteria
- [ ] **PR2-G1:** Repository APIs cover required read/write operations and accept tx/db handles.
- [ ] **PR2-G2:** Lifecycle services execute side effects inside single transaction scopes.
- [ ] **PR2-G3:** `db:seed` produces deterministic demo data across supported entities.
- [ ] **PR2-G4:** Integration tests pass for lifecycle happy path and atomic rollback failure path.

---

## PR-3: Minimal Clerk + NeonDB Integration Gate [BLOCKED]

### Ready Criteria
- [ ] PR-2 is merged.
- [ ] Clerk and Neon environment variables are configured.

### Execution Checklist
- [ ] Wire Clerk provider in app layout.
- [ ] Implement `proxy.ts` route protection for dashboard routes.
- [ ] Add minimal Clerk webhook handler for `user.created` and `user.updated`.
- [ ] Implement idempotent user upsert into local `users`.
- [ ] Implement `requireAuth()` and `requireRole()` helpers.
- [ ] Validate NeonDB runtime connectivity with one read/write flow.

### Done Criteria
- [ ] **PR3-G1:** Unauthenticated dashboard requests redirect to sign-in.
- [ ] **PR3-G2:** Authenticated users can access dashboard shell routes.
- [ ] **PR3-G3:** Clerk webhook user events sync idempotently into local `users` records.
- [ ] **PR3-G4:** `requireAuth()` and `requireRole()` enforce expected access behavior.
- [ ] **PR3-G5:** App can execute a DB read/write path using configured NeonDB connection.

---

## PR-4: Vendor Management [BLOCKED]

### Ready Criteria
- [ ] PR-3 is merged.

### Execution Checklist
- [ ] Implement vendor actions (`create`, `update`, `delete`, `setDefaultPaymentMethod`).
- [ ] Build vendor list + create/edit + detail views.
- [ ] Add single-default payment method enforcement and mutation feedback.

### Done Criteria
- [ ] **PR4-G1:** Vendor create/update/delete enforce validation + auth constraints.
- [ ] **PR4-G2:** Default payment method switching guarantees one default method per vendor.
- [ ] **PR4-G3:** Vendor list supports search and detail navigation with default/owner visibility.
- [ ] **PR4-G4:** Destructive vendor operations require confirmation and return clear feedback.

---

## PR-5: Bill Draft CRUD [BLOCKED]

### Ready Criteria
- [ ] PR-4 is merged.

### Execution Checklist
- [ ] Implement draft bill create/update/delete actions with status guards.
- [ ] Build bill form with dynamic line items and total validation.
- [ ] Build drafts table baseline (search, row actions, column visibility).

### Done Criteria
- [ ] **PR5-G1:** Draft bill create/edit/delete works with validator safeguards.
- [ ] **PR5-G2:** Line item sum mismatch blocks invalid bill persistence.
- [ ] **PR5-G3:** Drafts table supports search, row actions, and column visibility controls.
- [ ] **PR5-G4:** Non-draft records are blocked from draft-only mutation paths.

---

## PR-6: Bill Lifecycle Actions [BLOCKED]

### Ready Criteria
- [ ] PR-5 is merged.

### Execution Checklist
- [ ] Implement lifecycle transition actions for bills.
- [ ] Wire Approval and For Payment views to transition actions.
- [ ] Add activity logging and optimistic concurrency handling.

### Done Criteria
- [ ] **PR6-G1:** All transitions enforce allowed-state map and reject invalid state changes.
- [ ] **PR6-G2:** Approval and For Payment views reflect mutation results immediately.
- [ ] **PR6-G3:** Transition side effects (payment creation/reversion/retry) persist correctly.
- [ ] **PR6-G4:** Concurrency conflicts fail safely with deterministic user-facing errors.

---

## PR-7: Bills Views (Filters, Bulk, History, Detail) [BLOCKED]

### Ready Criteria
- [ ] PR-6 is merged.

### Execution Checklist
- [ ] Implement URL-backed filters, sorting, and pagination.
- [ ] Implement bulk action bar with all-or-nothing transaction behavior.
- [ ] Build History and Overview tabs.
- [ ] Build Bill detail view (header, line items, payment info, activity log).

### Done Criteria
- [ ] **PR7-G1:** Filter/sort state is URL-backed and preserved across browser navigation.
- [ ] **PR7-G2:** Bulk actions execute supported operations and rollback fully on invalid rows.
- [ ] **PR7-G3:** History/Overview groupings and counts match canonical bill states.
- [ ] **PR7-G4:** Bill detail renders canonical header, line items, payment info, and activity log.

---

## PR-8: Payments Surface [BLOCKED]

### Ready Criteria
- [ ] PR-7 is merged.

### Execution Checklist
- [ ] Build payments tabs + table.
- [ ] Implement payment row and bulk actions.
- [ ] Build payment detail and source bill linkage.

### Done Criteria
- [ ] **PR8-G1:** Payments tabs display correct status grouping and membership.
- [ ] **PR8-G2:** Payment actions mutate payment/bill state consistently for supported scenarios.
- [ ] **PR8-G3:** Payment detail shows lifecycle metadata and navigable linkage to originating bill.

---

## PR-9: Export, QA Hardening & Documentation [BLOCKED]

### Ready Criteria
- [ ] PR-8 is merged.

### Execution Checklist
- [ ] Implement CSV export for bills/payments filtered views.
- [ ] Execute responsive and loading/empty/error UX hardening pass.
- [ ] Complete integration/component coverage for core workflows.
- [ ] Finalize README with behavior, setup, architecture, and test commands.

### Done Criteria
- [ ] **PR9-G1:** CSV export respects active filters and visibility rules.
- [ ] **PR9-G2:** Core pages pass responsive QA at 375/768/1440/2560 widths.
- [ ] **PR9-G3:** Integration and component suites pass for core workflow scenarios.
- [ ] **PR9-G4:** README reflects current behavior, setup, architecture, and test usage.
