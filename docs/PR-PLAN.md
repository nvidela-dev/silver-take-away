# Bill Pay MVP — PR Plan

## Baseline

- `PR-0` is merged and complete.
- `PR-0` is locked baseline and not active scope.
- All remaining work is split into review-friendly PRs with one clear outcome each.

## Backlog Sequence (No Time Windows)

1. `PR-1` Shell Contracts & Navigation Skeleton
2. `PR-2` Domain Data Layer Core
3. `PR-3` Minimal Clerk + NeonDB Integration Gate
4. `PR-4` Vendor Management
5. `PR-5` Bill Draft CRUD
6. `PR-6` Bill Lifecycle Actions
7. `PR-7` Bills Views (Filters, Bulk, History, Detail)
8. `PR-8` Payments Surface
9. `PR-9` Export, QA Hardening & Documentation

---

## PR-1: Shell Contracts & Navigation Skeleton

**Objective**
- Establish app shell and route skeleton without feature behavior.

**Must Ship**
- Dashboard layout shell with stable navigation to Bills, Payments, Vendors.
- Placeholder pages for each route with consistent empty states.
- Shared UI contracts for page title/action/header sections.

**Out of Scope**
- Auth providers and external identity wiring.
- Domain data reads/writes.
- Vendor/bill/payment business actions.

**Dependencies**
- `PR-0` merged baseline.

**Acceptance Gates**
- **PR1-G1:** Bills, Payments, and Vendors routes are reachable from shared nav.
- **PR1-G2:** Dashboard shell layout is reused across feature routes.
- **PR1-G3:** Placeholder routes render without runtime errors in dev and build.

**Estimated Effort**
- Small

---

## PR-2: Domain Data Layer Core

**Objective**
- Deliver repository/service primitives for bills, payments, vendors, line items, and activity logs.

**Must Ship**
- Repository modules with tx/db-friendly signatures.
- `bill-transitions` and `payment-lifecycle` services with transaction boundaries.
- Deterministic seed script (`db:seed`) for local verification.
- Integration tests for happy path and rollback behavior.

**Out of Scope**
- Clerk auth wiring.
- Protected route behavior.
- End-user feature workflows.

**Dependencies**
- `PR-1` merged.
- Drizzle schema and migrations from `PR-0`.

**Acceptance Gates**
- **PR2-G1:** Repository APIs cover required read/write operations and accept tx/db handles.
- **PR2-G2:** Lifecycle services execute side effects inside single transaction scopes.
- **PR2-G3:** `db:seed` produces deterministic demo data across supported entities.
- **PR2-G4:** Integration tests pass for lifecycle happy path and atomic rollback failure path.

**Estimated Effort**
- Medium

---

## PR-3: Minimal Clerk + NeonDB Integration Gate

**Objective**
- Establish the minimum production integration baseline (identity + database) before feature delivery.

**Must Ship**
- Clerk provider wired in app layout.
- `proxy.ts` route protection for dashboard surfaces.
- Minimal Clerk webhook handling for user sync (`user.created`, `user.updated`) with idempotent upsert.
- `requireAuth()` local-user resolution and `requireRole()` authorization guard.
- NeonDB runtime connection configuration validated in app runtime.

**Out of Scope**
- Vendor/bill/payment feature UX.
- Advanced role matrix beyond helper-level guard checks.
- UI polish beyond auth flow correctness.

**Dependencies**
- `PR-2` merged.
- Clerk and Neon environment variables configured.

**Acceptance Gates**
- **PR3-G1:** Unauthenticated dashboard requests redirect to sign-in.
- **PR3-G2:** Authenticated users can access dashboard shell routes.
- **PR3-G3:** Clerk webhook user events sync idempotently into local `users` records.
- **PR3-G4:** `requireAuth()` and `requireRole()` enforce expected access behavior.
- **PR3-G5:** App can execute a DB read/write path using configured NeonDB connection.

**Estimated Effort**
- Medium

---

## PR-4: Vendor Management

**Objective**
- Ship vendor CRUD and default payment method management.

**Must Ship**
- Vendor actions (`create`, `update`, `delete`, `setDefaultPaymentMethod`).
- Vendor list + create/edit + detail surfaces.
- Single-default-payment-method enforcement per vendor.
- Mutation feedback (success/error toasts + destructive confirmation).

**Out of Scope**
- Bill and payment feature workflows.
- Cross-surface optimization passes.

**Dependencies**
- `PR-3` merged.

**Acceptance Gates**
- **PR4-G1:** Vendor create/update/delete enforce validation + auth constraints.
- **PR4-G2:** Default payment method switching guarantees one default method per vendor.
- **PR4-G3:** Vendor list supports search and detail navigation with default/owner visibility.
- **PR4-G4:** Destructive vendor operations require confirmation and return clear feedback.

**Estimated Effort**
- Medium

---

## PR-5: Bill Draft CRUD

**Objective**
- Enable draft-only bill authoring with line-item validation.

**Must Ship**
- Draft bill create/update/delete actions with status guards.
- Bill form with dynamic line items and total enforcement.
- Drafts table with search + row actions + column visibility baseline.

**Out of Scope**
- Approval/payment transitions.
- Bulk action system.

**Dependencies**
- `PR-4` merged.

**Acceptance Gates**
- **PR5-G1:** Draft bill create/edit/delete works with validator safeguards.
- **PR5-G2:** Line item sum mismatch blocks invalid bill persistence.
- **PR5-G3:** Drafts table supports search, row actions, and column visibility controls.
- **PR5-G4:** Non-draft records are blocked from draft-only mutation paths.

**Estimated Effort**
- Medium

---

## PR-6: Bill Lifecycle Actions

**Objective**
- Deliver approval/payment transition actions on bills.

**Must Ship**
- Transition actions (`submit`, `approve`, `reject`, `schedule`, `initiate`, `cancel`, `retry`, `mark paid`, `archive`, `unschedule`).
- Approval and For Payment views wired to transition actions.
- Activity log writes and optimistic concurrency handling.

**Out of Scope**
- Full filter model and bulk tooling.
- Payments dedicated workspace.

**Dependencies**
- `PR-5` merged.

**Acceptance Gates**
- **PR6-G1:** All transitions enforce allowed-state map and reject invalid state changes.
- **PR6-G2:** Approval and For Payment views reflect mutation results immediately.
- **PR6-G3:** Transition side effects (payment creation/reversion/retry) persist correctly.
- **PR6-G4:** Concurrency conflicts fail safely with deterministic user-facing errors.

**Estimated Effort**
- Medium

---

## PR-7: Bills Views (Filters, Bulk, History, Detail)

**Objective**
- Complete the Bills surface for operational use.

**Must Ship**
- URL-backed filters, sorting, pagination.
- Bulk action bar with transactional all-or-nothing behavior.
- History and Overview tabs.
- Bill detail view with line items, payment status, and activity timeline.

**Out of Scope**
- Payments standalone feature set.
- CSV export.

**Dependencies**
- `PR-6` merged.

**Acceptance Gates**
- **PR7-G1:** Filter/sort state is URL-backed and preserved across browser navigation.
- **PR7-G2:** Bulk actions execute supported operations and rollback fully on invalid rows.
- **PR7-G3:** History/Overview groupings and counts match canonical bill states.
- **PR7-G4:** Bill detail renders canonical header, line items, payment info, and activity log.

**Estimated Effort**
- Medium

---

## PR-8: Payments Surface

**Objective**
- Ship dedicated payment operations views and actions.

**Must Ship**
- Payments tabs + table.
- Payment row and bulk actions for supported flows.
- Payment detail with source bill linkage.

**Out of Scope**
- Final polish/export pass.

**Dependencies**
- `PR-7` merged.

**Acceptance Gates**
- **PR8-G1:** Payments tabs display correct status grouping and membership.
- **PR8-G2:** Payment actions mutate payment/bill state consistently for supported scenarios.
- **PR8-G3:** Payment detail shows lifecycle metadata and navigable linkage to originating bill.

**Estimated Effort**
- Medium

---

## PR-9: Export, QA Hardening & Documentation

**Objective**
- Finish release readiness and operational confidence.

**Must Ship**
- CSV export for bills/payments filtered views.
- Responsive and loading/empty/error UX hardening.
- Integration/component coverage for core workflows.
- README completion for setup, architecture, and commands.

**Out of Scope**
- Net-new business workflows.

**Dependencies**
- `PR-8` merged.

**Acceptance Gates**
- **PR9-G1:** CSV export respects active filters and visibility rules.
- **PR9-G2:** Core pages pass responsive QA at 375/768/1440/2560 widths.
- **PR9-G3:** Integration and component suites pass for core workflow scenarios.
- **PR9-G4:** README reflects current behavior, setup, architecture, and test usage.

**Estimated Effort**
- Medium
