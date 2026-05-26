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
- [x] PR-0 support folders (`actions`, `repositories`, `queries`, `services`) scaffolded.
- [x] Plan/checklist baseline updated and merged.

---

## PR-1: Auth & Layout Shell [READY]

### Ready Criteria
- [x] PR-0 merged baseline is available.
- [x] `users` table and DB client exist.
- [ ] Clerk runtime secrets are present in environment.

### Execution Checklist
- [ ] Wire Clerk provider in root layout.
- [ ] Implement `proxy.ts` route protection for dashboard pages.
- [ ] Add sign-in/sign-up routes and validate redirect behavior.
- [ ] Implement Clerk webhook handler with signature verification.
- [ ] Implement idempotent user upsert on `user.created` and `user.updated`.
- [ ] Implement `requireAuth()` local-user resolution.
- [ ] Implement `requireRole()` role guard integration path.
- [ ] Build dashboard shell with nav to Bills, Payments, Vendors.

### Done Criteria
- [ ] **PR1-G1:** Unauthenticated requests to dashboard routes are redirected to sign-in.
- [ ] **PR1-G2:** Authenticated user can navigate between Bills, Payments, and Vendors shell pages.
- [ ] **PR1-G3:** Clerk `user.created` and `user.updated` webhook events upsert local `users` row idempotently.
- [ ] **PR1-G4:** `requireAuth()` resolves current Clerk session to local user or throws typed auth error.
- [ ] **PR1-G5:** `requireRole()` blocks unauthorized roles and allows authorized roles.

---

## PR-2: Repositories, Services & Seed [BLOCKED]

### Ready Criteria
- [ ] PR-1 is merged.
- [ ] Auth helper implementations are stable.

### Execution Checklist
- [ ] Implement `bill`, `payment`, `vendor`, `line-item`, `activity-log` repository modules.
- [ ] Ensure repository signatures accept tx/db handles without layer-skipping.
- [ ] Implement `bill-transitions` service with transaction-scoped side effects.
- [ ] Implement `payment-lifecycle` service for payment status transitions.
- [ ] Add deterministic seed script and wire `db:seed`.
- [ ] Add integration tests for lifecycle happy path and batch atomic rollback.

### Done Criteria
- [ ] **PR2-G1:** Repository methods support required read/write paths and accept tx/db handles without layer-skipping.
- [ ] **PR2-G2:** Bill lifecycle transitions execute with required side effects (activity log + payment side effects) inside transactions.
- [ ] **PR2-G3:** `db:seed` populates consistent deterministic demo dataset with bills/payments/activity logs.
- [ ] **PR2-G4:** Integration test validates full happy-path lifecycle (`create -> submit -> approve -> schedule -> initiate -> paid`).
- [ ] **PR2-G5:** Integration test validates all-or-nothing rollback on bulk transition failure.

---

## PR-3: Vendor Management [BLOCKED]

### Ready Criteria
- [ ] PR-2 is merged.
- [ ] Seed data is available for local UI verification.

### Execution Checklist
- [ ] Implement vendor actions (`create`, `update`, `delete`, `setDefaultPaymentMethod`).
- [ ] Build vendor list view with search and owner/default visibility.
- [ ] Build create/edit vendor flow with payment methods editor.
- [ ] Build vendor detail view with associated bills summary.
- [ ] Add confirmation + toast feedback for all vendor mutations.

### Done Criteria
- [ ] **PR3-G1:** Vendor create/update/delete behavior works with validation and authorization constraints.
- [ ] **PR3-G2:** Default payment method switching guarantees one default method per vendor.
- [ ] **PR3-G3:** Vendor list supports search + owner/default method visibility and navigates to detail.
- [ ] **PR3-G4:** Destructive actions require confirmation and all vendor mutations surface success/error toasts.

---

## PR-4: Bill CRUD & Drafts Tab [BLOCKED]

### Ready Criteria
- [ ] PR-3 is merged.

### Execution Checklist
- [ ] Implement draft bill create/update/delete actions with validation.
- [ ] Build bill form with dynamic line items and sum enforcement.
- [ ] Build Drafts table baseline (search, context menu, column visibility).

### Done Criteria
- [ ] **PR4-G1:** Draft bill can be created, edited, and deleted with validator safeguards.
- [ ] **PR4-G2:** Line item sum mismatch blocks submission consistently.
- [ ] **PR4-G3:** Drafts table supports search, row actions, and column visibility toggles.
- [ ] **PR4-G4:** Draft-only guard prevents edit/delete for non-draft statuses.

---

## PR-5: Bill Actions & Approval/Payment Tabs [BLOCKED]

### Ready Criteria
- [ ] PR-4 is merged.

### Execution Checklist
- [ ] Implement transition actions for approval/payment/archive lifecycle.
- [ ] Build Approval tab action flow.
- [ ] Build For Payment tab action flow.
- [ ] Enforce optimistic concurrency and transition logging for every action.

### Done Criteria
- [ ] **PR5-G1:** All status transitions enforce allowed-state map and reject invalid transitions.
- [ ] **PR5-G2:** Approval and For Payment tabs reflect status changes immediately after action success.
- [ ] **PR5-G3:** Transition side effects (payment creation/reversion/retry) are persisted correctly.
- [ ] **PR5-G4:** Concurrency conflict path returns deterministic user-facing error without partial writes.

---

## PR-6: Filters, Sorts & Bulk Actions [BLOCKED]

### Ready Criteria
- [ ] PR-5 is merged.

### Execution Checklist
- [ ] Implement URL-backed filters, sorting, and pagination.
- [ ] Implement filter chips and supported filter dimensions.
- [ ] Implement bulk action bar and supported batch operations.
- [ ] Enforce transactional rollback for bulk failures.

### Done Criteria
- [ ] **PR6-G1:** Filter/sort state is URL-backed and browser navigation preserves state.
- [ ] **PR6-G2:** Supported filter dimensions apply correctly to bills dataset.
- [ ] **PR6-G3:** Bulk action bar executes supported actions across selected rows.
- [ ] **PR6-G4:** Any invalid record in bulk mutation rolls back whole batch with clear error response.

---

## PR-7: History, Overview & Bill Detail [BLOCKED]

### Ready Criteria
- [ ] PR-6 is merged.

### Execution Checklist
- [ ] Build History and Overview tabs for bills.
- [ ] Build bill detail page sections (header, line items, payment info, activity log).
- [ ] Add overdue badge behavior and validate status conditions.

### Done Criteria
- [ ] **PR7-G1:** History and Overview tabs show correct status grouping and counts.
- [ ] **PR7-G2:** Bill detail page renders canonical data (header, line items, payment info, activity log).
- [ ] **PR7-G3:** Overdue badge appears only for overdue non-paid/non-archived bills.

---

## PR-8: Payments Surface [BLOCKED]

### Ready Criteria
- [ ] PR-7 is merged.

### Execution Checklist
- [ ] Build payments tabs and payments table baseline.
- [ ] Implement payment-specific row and bulk actions.
- [ ] Build payment detail page and bill linkage.

### Done Criteria
- [ ] **PR8-G1:** Payments tabs show correct status groupings and record membership.
- [ ] **PR8-G2:** Payment actions mutate payment/bill states correctly for supported flows.
- [ ] **PR8-G3:** Payment detail links to originating bill and displays lifecycle metadata.

---

## PR-9: Export, Polish & Tests [BLOCKED]

### Ready Criteria
- [ ] PR-8 is merged.

### Execution Checklist
- [ ] Implement CSV export for bills/payments filtered views.
- [ ] Execute responsive and loading/empty/error UX polish pass.
- [ ] Complete integration/component test targets for merged behavior.
- [ ] Finalize README with shipped workflows/setup/architecture/tests.

### Done Criteria
- [ ] **PR9-G1:** CSV export matches active filters and selected visibility rules.
- [ ] **PR9-G2:** Core pages pass responsive QA at 375/768/1440/2560 widths.
- [ ] **PR9-G3:** Integration and component suites cover target scenarios and pass in CI.
- [ ] **PR9-G4:** README reflects shipped behavior, setup, architecture, and test commands.
