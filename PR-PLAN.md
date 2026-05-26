# Bill Pay MVP — PR Plan

## Baseline

- `PR-0` is merged and complete.
- This plan starts from the current baseline in `feat/foundation`:
  - Schema + migrations exist.
  - Core types, validators, and state machine exist.
  - Stub folders and placeholder modules exist for upcoming layers.
- `PR-0` is no longer active scope.

## Next 5 Days Execution Window

### Ordered PR Consumption Sequence

1. `PR-1` Auth & Layout Shell
2. `PR-2` Repositories, Services & Seed
3. `PR-3` Vendor Management

### Delivery Lanes

- **Primary lane:** `PR-1 -> PR-2 -> PR-3` end-to-end merges.
- **Optional parallel lane (low risk only):**
  - UI shell polish tasks that do not alter business flow contracts.
  - Test harness scaffolding that does not block primary feature merges.
  - Documentation updates for newly merged behavior.

### Day-by-Day Priority

- **Day 1:** Start and finish core auth wiring for `PR-1` (Clerk provider, proxy protection, sign-in/sign-up flow).
- **Day 2:** Finish `PR-1` (webhook sync, `requireAuth`, `requireRole`, dashboard shell, route protection).
- **Day 3:** Start `PR-2` data layer (`bill`, `payment`, `vendor`, `line-item`, `activity-log` repositories).
- **Day 4:** Finish `PR-2` services + seed + integration tests.
- **Day 5:** Start `PR-3` vendor CRUD UI/actions and close with merge-ready acceptance gates.

---

## PR-1: Auth & Layout Shell

**Objective**
- Deliver authenticated dashboard access, user sync into local DB, and a usable app shell.

**Must Ship**
- Clerk provider in root layout.
- `proxy.ts` enforcing authenticated access to dashboard routes.
- Public Clerk webhook route with signature verification and idempotent user upsert.
- `requireAuth()` + `requireRole()` production implementation.
- Dashboard layout with navigation to Bills, Payments, Vendors.

**Out of Scope**
- Bills/Payments/Vendors feature logic beyond empty page shells.
- Role-specific feature gating beyond route/session checks and helper enforcement.
- Data tables, filters, and CRUD flows.

**Dependencies**
- `PR-0` merged (already satisfied).
- Clerk environment values configured in runtime environment.

**Acceptance Gates**
- **PR1-G1:** Unauthenticated requests to dashboard routes are redirected to sign-in.
- **PR1-G2:** Authenticated user can navigate between Bills, Payments, and Vendors shell pages.
- **PR1-G3:** Clerk `user.created` and `user.updated` webhook events upsert local `users` row idempotently.
- **PR1-G4:** `requireAuth()` resolves current Clerk session to local user or throws typed auth error.
- **PR1-G5:** `requireRole()` blocks unauthorized roles and allows authorized roles.

**Estimated Effort**
- 2-3 hours

---

## PR-2: Repositories, Services & Seed

**Objective**
- Ship core transaction-safe domain behavior so feature PRs compose from stable repositories/services.

**Must Ship**
- Repositories for bills, payments, vendors, line items, and activity logs with transaction-friendly signatures.
- `bill-transitions` service implementing state transition side effects in DB transactions.
- `payment-lifecycle` service for payment status transitions.
- Deterministic seed script (`db:seed`) with realistic data distribution across statuses.
- Integration tests for lifecycle path and atomicity of batch mutation behavior.

**Out of Scope**
- End-user feature pages beyond seed/testing verification surfaces.
- Broad UI work (table UX, filters, dialogs).
- Export/polish concerns.

**Dependencies**
- `PR-1` merged.
- Auth helpers from `PR-1` available for service/action integration.

**Acceptance Gates**
- **PR2-G1:** Repository methods support required read/write paths and accept tx/db handles without layer-skipping.
- **PR2-G2:** Bill lifecycle transitions execute with required side effects (activity log + payment side effects) inside transactions.
- **PR2-G3:** `db:seed` populates consistent deterministic demo dataset with bills/payments/activity logs.
- **PR2-G4:** Integration test validates full happy-path lifecycle (`create -> submit -> approve -> schedule -> initiate -> paid`).
- **PR2-G5:** Integration test validates all-or-nothing rollback on bulk transition failure.

**Estimated Effort**
- 3-4 hours

---

## PR-3: Vendor Management

**Objective**
- Deliver the first complete user-facing workflow: vendor CRUD + payment method defaults.

**Must Ship**
- Vendor actions (`create`, `update`, `delete`, `setDefaultPaymentMethod`) with validation/auth/transaction boundaries.
- Vendor list, create/edit flow, and detail view.
- Enforcement that only one default payment method exists per vendor.
- Toast feedback and destructive confirmation UX.

**Out of Scope**
- Bill creation/editing flows.
- Payment tab/domain actions.
- Cross-surface optimization and broad UI polish.

**Dependencies**
- `PR-2` merged.
- Seeded dataset available for rapid verification.

**Acceptance Gates**
- **PR3-G1:** Vendor create/update/delete behavior works with validation and authorization constraints.
- **PR3-G2:** Default payment method switching guarantees one default method per vendor.
- **PR3-G3:** Vendor list supports search + owner/default method visibility and navigates to detail.
- **PR3-G4:** Destructive actions require confirmation and all vendor mutations surface success/error toasts.

**Estimated Effort**
- 2-3 hours

---

## PR-4: Bill CRUD & Drafts Tab (Upcoming)

**Objective**
- Enable bill create/edit/delete in draft state and establish reusable draft table foundation.

**Must Ship**
- Draft-safe bill create/update/delete actions with line-item sum enforcement.
- Bill form with dynamic line items.
- Drafts table baseline (search, context actions, column visibility).

**Out of Scope**
- Approval/payment lifecycle actions.
- Bulk actions and advanced filters.

**Dependencies**
- `PR-3` merged.

**Acceptance Gates**
- **PR4-G1:** Draft bill can be created, edited, and deleted with validator safeguards.
- **PR4-G2:** Line item sum mismatch blocks submission consistently.
- **PR4-G3:** Drafts table supports search, row actions, and column visibility toggles.
- **PR4-G4:** Draft-only guard prevents edit/delete for non-draft statuses.

**Estimated Effort**
- 3-4 hours

---

## PR-5: Bill Actions & Approval/Payment Tabs (Upcoming)

**Objective**
- Deliver approval/payment state actions and corresponding bill tabs.

**Must Ship**
- Transition actions (`submit`, `approve`, `reject`, `schedule`, `initiate`, `cancel`, `retry`, `mark paid`, `archive`, `unschedule`).
- Approval and For Payment table flows.
- Optimistic concurrency safeguards and activity log writes for every transition.

**Out of Scope**
- Full filter system and bulk action system.
- Payments standalone surface.

**Dependencies**
- `PR-4` merged.

**Acceptance Gates**
- **PR5-G1:** All status transitions enforce allowed-state map and reject invalid transitions.
- **PR5-G2:** Approval and For Payment tabs reflect status changes immediately after action success.
- **PR5-G3:** Transition side effects (payment creation/reversion/retry) are persisted correctly.
- **PR5-G4:** Concurrency conflict path returns deterministic user-facing error without partial writes.

**Estimated Effort**
- 3-4 hours

---

## PR-6: Filters, Sorts & Bulk Actions (Upcoming)

**Objective**
- Add URL-synced table control system and atomic bulk operations.

**Must Ship**
- URL-backed filters, sorting, pagination.
- Bulk action bar and priority bulk operations.
- Transactional all-or-nothing behavior for bulk writes.

**Out of Scope**
- Final history/detail polish.
- CSV export.

**Dependencies**
- `PR-5` merged.

**Acceptance Gates**
- **PR6-G1:** Filter/sort state is URL-backed and browser navigation preserves state.
- **PR6-G2:** Supported filter dimensions apply correctly to bills dataset.
- **PR6-G3:** Bulk action bar executes supported actions across selected rows.
- **PR6-G4:** Any invalid record in bulk mutation rolls back whole batch with clear error response.

**Estimated Effort**
- 3-4 hours

---

## PR-7: History, Overview & Bill Detail (Upcoming)

**Objective**
- Complete bills surface with history, overview, and detailed bill traceability.

**Must Ship**
- History and Overview tabs.
- Bill detail page with line items, payment status, and activity timeline.
- Overdue badge behavior.

**Out of Scope**
- Payments standalone surface.
- CSV export/polish pass.

**Dependencies**
- `PR-6` merged.

**Acceptance Gates**
- **PR7-G1:** History and Overview tabs show correct status grouping and counts.
- **PR7-G2:** Bill detail page renders canonical data (header, line items, payment info, activity log).
- **PR7-G3:** Overdue badge appears only for overdue non-paid/non-archived bills.

**Estimated Effort**
- 2-3 hours

---

## PR-8: Payments Surface (Upcoming)

**Objective**
- Ship dedicated payments experience with status tabs, filters, actions, and detail.

**Must Ship**
- Payments tab navigation + table.
- Payment-specific actions and bulk actions.
- Payment detail with linkage to bill.

**Out of Scope**
- Final export and QA hardening.

**Dependencies**
- `PR-7` merged.

**Acceptance Gates**
- **PR8-G1:** Payments tabs show correct status groupings and record membership.
- **PR8-G2:** Payment actions mutate payment/bill states correctly for supported flows.
- **PR8-G3:** Payment detail links to originating bill and displays lifecycle metadata.

**Estimated Effort**
- 2-3 hours

---

## PR-9: Export, Polish & Tests (Upcoming)

**Objective**
- Final quality pass: export, responsive/accessibility polish, and confidence test coverage.

**Must Ship**
- CSV export for bills/payments filtered views.
- Responsive + loading/empty/error UX hardening.
- Integration/component test completion.
- README completion.

**Out of Scope**
- Net-new product workflows.

**Dependencies**
- `PR-8` merged.

**Acceptance Gates**
- **PR9-G1:** CSV export matches active filters and selected visibility rules.
- **PR9-G2:** Core pages pass responsive QA at 375/768/1440/2560 widths.
- **PR9-G3:** Integration and component suites cover target scenarios and pass in CI.
- **PR9-G4:** README reflects shipped behavior, setup, architecture, and test commands.

**Estimated Effort**
- 3-4 hours
