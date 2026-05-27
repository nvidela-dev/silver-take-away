# Bill Pay MVP — PR Plan

**Total: 11 PRs (PR-0 through PR-10)**
Each PR maps 1:1 to a merge. Dependencies are strictly sequential — no PR can start until its predecessor is merged. This is intentional: each PR builds context that the next one consumes.

---

## PR-0: Foundation & Schema

**Branch:** `feat/foundation`
**Goal:** Establish the entire codebase skeleton so every subsequent PR has types, schema, validators, and folder structure to lean on. This is the "context layer" — an agent working on PR-3 should be able to read `types/index.ts`, `db/schema/`, and `lib/validators/` and know exactly what shape data takes.

**Scope:**
- `npx create-next-app@latest` with App Router, TypeScript strict, Tailwind, `src/` directory
- shadcn/ui init + install all needed components (Table, Button, Badge, Dialog, Popover, DropdownMenu, Select, Input, Tabs, Toast/Sonner, Separator, Form)
- Drizzle ORM config + `@neondatabase/serverless` driver
- **All 8 DB schema table definitions** in `db/schema/` (users, vendors, vendor_payment_methods, categories, bills, bill_line_items, payments, bill_activity_log) with enums, indexes, and FK constraints
- Run `drizzle-kit generate` to produce initial migration SQL
- **All TypeScript types** in `types/index.ts` — every interface, enum, filter type, input type, composite type from the requirements doc
- **All Zod validators** in `lib/validators/` (bill.schemas.ts, payment.schemas.ts, vendor.schemas.ts) — including line item sum validation
- **State machine** in `lib/services/state-machine.ts` — `TRANSITION_MAP` constant + `assertValidTransition` pure function
- Complete folder structure with empty barrel files for actions, services, repositories, auth, queries
- `next.config.ts` with security headers
- `jest.config.ts` with multi-project setup (unit, integration, components)
- `.env.example` with all required env vars (DATABASE_URL, CLERK_*, NEXT_PUBLIC_CLERK_*)
- `package.json` scripts: `dev`, `build`, `db:generate`, `db:migrate`, `db:push`, `db:seed`, `test`, `test:unit`, `test:integration`, `test:components`
- README skeleton (product description, setup instructions, architecture decisions placeholder)

**Acceptance criteria:**
- `npm run build` passes with zero errors
- `drizzle-kit generate` produces valid migration SQL
- All types import cleanly across the codebase
- State machine unit tests pass (valid transitions return correct status, invalid transitions throw)
- Zod validators unit tests pass (happy path, missing fields, boundary amounts, line item sum)

**FRs addressed:** None directly — this is infrastructure. But it establishes the contracts that every FR depends on.

**Key files:**
```
src/
├── db/schema/index.ts           # All 8 tables + enums
├── db/index.ts                  # NeonDB + Drizzle client export
├── types/index.ts               # All interfaces
├── lib/validators/              # All Zod schemas
├── lib/services/state-machine.ts
├── lib/auth/require-auth.ts     # Stub (implemented PR-1)
├── lib/auth/require-role.ts     # Stub (implemented PR-1)
├── lib/actions/bills.ts         # Empty barrel
├── lib/actions/payments.ts      # Empty barrel
├── lib/actions/vendors.ts       # Empty barrel
├── lib/repositories/            # Empty barrel files
├── lib/queries/                 # Empty barrel files
├── __tests__/unit/state-machine.test.ts
├── __tests__/unit/validators.test.ts
├── next.config.ts               # Security headers
├── proxy.ts                     # Stub (implemented PR-1)
└── jest.config.ts
```

---

## PR-1: Auth & Layout Shell

**Branch:** `feat/auth-layout`
**Depends on:** PR-0
**Goal:** Authentication works end-to-end, users sync to the DB, and the dashboard has a navigable shell. After this PR, you can sign in, see a sidebar, and click through empty pages.

**Scope:**
- Clerk provider setup in `app/layout.tsx`
- Sign-in and sign-up pages under `app/(auth)/`
- `proxy.ts` — Clerk proxy protecting all `(dashboard)` routes, public webhook endpoint
- Clerk webhook handler at `app/api/webhooks/clerk/route.ts` — creates/updates `users` table rows on `user.created` / `user.updated` events. Svix signature verification.
- `lib/auth/require-auth.ts` — wraps `currentUser()`, resolves to local `User` record by `clerk_id`
- `lib/auth/require-role.ts` — checks user role against allowed roles, throws on mismatch
- Dashboard layout at `app/(dashboard)/layout.tsx` — sidebar with nav links (Bills, Payments, Vendors), top bar with user menu, breadcrumb component
- Empty page shells: `app/(dashboard)/bills/page.tsx`, `app/(dashboard)/payments/page.tsx`, `app/(dashboard)/vendors/page.tsx`
- Run initial DB migration against NeonDB (`drizzle-kit push` or `drizzle-kit migrate`)

**Acceptance criteria:**
- Unauthenticated users redirected to `/sign-in`
- Signed-in users see the dashboard shell
- Clerk webhook creates a `users` row (verify in DB)
- `requireAuth()` returns the correct local `User`
- `requireRole()` throws for unauthorized roles
- Sidebar navigation works between all three sections

**FRs addressed:** FR-22 (RBAC foundation), FR-27 (Clerk webhook sync)

---

## PR-2: Repositories, Services & Seed

**Branch:** `feat/repos-seed`
**Depends on:** PR-1
**Goal:** The entire data access and business logic layer is built and tested. The seed script populates a realistic demo environment. After this PR, the DB is full of data and every server action can be built by composing existing repos and services.

**Scope:**
- **All repository files** — each accepts a `tx` (transaction handle) or `db` client:
  - `bill.repo.ts` — findById, findFiltered (with search, pagination, sorting), create, update, updateStatus (with optimistic concurrency WHERE), delete, archive
  - `payment.repo.ts` — findById, findByBillId, findFiltered, create, updateStatus, updateScheduledDate
  - `vendor.repo.ts` — findById, findAll, create, update, delete
  - `line-item.repo.ts` — findByBillId, createMany, deleteByBillId, replaceForBill (delete + recreate in tx)
  - `activity-log.repo.ts` — create, findByBillId (ordered by created_at desc)
- **Bill transition service** (`lib/services/bill-transitions.ts`) — `transitionBillStatus(db, billId, action, actor)` function that wraps the state machine + repo calls + activity log + payment creation in a single transaction. All side effects (payment creation on schedule, bill revert on cancel, etc.) handled here.
- **Payment lifecycle service** (`lib/services/payment-lifecycle.ts`) — payment status transitions
- **Auth helpers unit tests** — role check matrix
- **Seed script** (`db/seed.ts`) — generates all demo data per §10: 6-8 users, 10-15 vendors, categories, 50+ bills across all statuses, payments, activity logs. Deterministic (same output each run) so the demo is reproducible.
- `package.json` script: `db:seed` runs the seed

**Acceptance criteria:**
- `npm run db:seed` populates the DB with realistic data
- Bills exist in every status, payments in every status
- Activity logs exist for every bill
- Integration test: create bill → submit → approve → schedule → initiate → paid (full lifecycle through repos/services)
- Integration test: bulk approve 5 bills in a transaction, verify atomicity

**FRs addressed:** FR-30 (seed data), FR-04 (invalid transition rejection), FR-05 (approve/reject), FR-18 (atomic bulk ops)

---

## PR-3: Vendor Management

**Branch:** `feat/vendors`
**Depends on:** PR-2
**Goal:** Full vendor CRUD surface. First real user-facing feature.

**Scope:**
- Vendor server actions: `createVendor`, `updateVendor`, `deleteVendor`, `setDefaultPaymentMethod`
- Vendor list page — search, table with columns (name, email, owner, # of bills, default payment method)
- Vendor create/edit form — name, email, owner selection (user dropdown), payment methods (add/remove, set default)
- Vendor detail page — vendor info, payment methods list, associated bills table (links to bill detail, built in PR-8)
- Toast notifications for action feedback (sonner setup — first use, reused everywhere after)

**Acceptance criteria:**
- Create a vendor with payment method → appears in list
- Edit vendor, change default payment method → persists
- Delete vendor with no bills → succeeds
- Delete vendor with bills → blocked with error
- Vendor detail shows associated bills (empty for now — populated once bills exist)

**FRs addressed:** FR-10 (vendor CRUD), FR-11 (default payment method), FR-29 (toasts)

---

## PR-4: Bills/Payments Surface Scaffolding (Folders & Placeholders)

**Branch:** `feat/surface-scaffold`
**Depends on:** PR-3
**Goal:** Put all near-term folders, route placeholders, and component placeholders in place so downstream feature PRs only implement behavior.

**Scope:**
- Create missing feature folders and placeholder files for Bills and Payments surfaces:
  - `app/(dashboard)/bills/_components/`
  - `app/(dashboard)/payments/_components/`
  - `app/(dashboard)/bills/[id]/page.tsx` (placeholder detail)
  - `app/(dashboard)/payments/[id]/page.tsx` (placeholder detail)
- Add placeholder tab shell components/pages for:
  - Bills: Drafts, For Approval, For Payment, History, Overview
  - Payments: Overview, Needs Review, Pending, History
- Add placeholder shared table shell components (no real data wiring yet), with stable props/contracts for later PRs.
- Add placeholder action/query module exports where needed so import structure is stable before implementation.
- Ensure route-level breadcrumbs/nav labels are wired for these placeholders.

**Acceptance criteria:**
- All new placeholder routes compile and render.
- Navigation can reach all placeholder tabs/details without runtime errors.
- `npm run build` passes with scaffold-only changes.
- No business mutations or real lifecycle logic are introduced in this PR.

**FRs addressed:** None directly — this is execution scaffolding for subsequent feature PRs.

---

## PR-5: Bill CRUD & Drafts Tab

**Branch:** `feat/bill-crud-drafts`
**Depends on:** PR-4
**Goal:** Bills can be created, edited, and deleted. The Drafts tab is fully functional with the DataTable, column config, search, and context menu.

**Scope:**
- Bill server actions: `createBill`, `updateBill`, `deleteBill` (drafts only)
- Bill creation form — vendor select, invoice fields (number, date, due date), amount, currency, description, invoice file upload (URL field), dynamic line items with category select, amount validation (sum = total)
- Bill edit form — same as create, pre-populated, draft-only guard
- **TanStack React Table setup** with shadcn DataTable — this is the foundational table component reused across all tabs
- Drafts tab — table showing draft bills, all columns (vendor/owner, status, amount, due date, invoice #, invoice date)
- Column configuration (add/remove/reorder via popover)
- Free-text search bar (searches vendor name, invoice number, description)
- Per-row context menu (⋮) — edit, delete, view detail (detail page built in PR-8)
- Row selection checkboxes

**Acceptance criteria:**
- Create a bill with 3 line items → appears in Drafts tab
- Line item sum validation blocks submission when sum ≠ total
- Edit a draft bill → changes persist
- Delete a draft → removed from table
- Search "vendor name" → filters table
- Column toggle hides/shows columns
- Context menu opens with correct actions per row

**FRs addressed:** FR-01 (create bill), FR-02 (line item sum), FR-20 (column config), FR-28 (confirmation dialogs), FR-31 (invoice upload), FR-33 (context menu), FR-34 (search)

---

## PR-6: Bill Actions & Approval/Payment Tabs

**Branch:** `feat/bill-actions-tabs`
**Depends on:** PR-5
**Goal:** All bill status transitions work. The Approval and For Payment tabs are functional. Users can move a bill through its entire lifecycle from the table UI.

**Scope:**
- Bill server actions: `submitForApproval`, `approveBill`, `rejectBill`, `schedulePayment`, `initiatePayment`, `cancelPayment`, `retryPayment`, `markBillAsPaid`, `archiveBill`, `unschedulePayment`
- Each action: Zod validation → auth check → role guard → service layer → transaction → activity log
- Optimistic concurrency on all status transitions (WHERE on expected status)
- **For Approval tab** — table showing `awaiting_approval` bills, approve/reject buttons (inline or context menu), approval note input
- **For Payment tab** — table showing `approved`, `scheduled`, `initiated` bills, schedule/pay/cancel actions
- Approver editing — approvers can edit fields (except amount, vendor, payment details) on bills in approval
- Context menu actions update per tab (approve/reject on approval tab, schedule/pay/cancel on payment tab)
- Archive flow — confirmation dialog, moves to History

**Acceptance criteria:**
- Submit draft for approval → appears in Approval tab
- Approve bill → moves to For Payment tab
- Reject bill with note → moves to History
- Schedule payment → payment record created, bill shows scheduled
- Initiate → cancel → bill reverts to approved
- Retry failed payment → new payment created
- Mark as paid → bill and payment both in paid status
- Concurrent approve (two users) → second gets conflict error
- Activity log entry created for every action

**FRs addressed:** FR-03 (lifecycle), FR-04 (invalid transitions), FR-05 (approve/reject), FR-06 (payment creation), FR-07 (simulated payments), FR-08 (retry), FR-09 (cancel revert), FR-25 (activity log), FR-32 (approver editing)

---

## PR-7: Filters, Sorts & Bulk Actions

**Branch:** `feat/filters-bulk`
**Depends on:** PR-6
**Goal:** The full filter/sort system with URL state and all bulk operations.

**Scope:**
- **nuqs integration** — all filter state serialized to URL search params
- Additive filter chip UI — "+ Add filter" popover, dimension picker, value selector, removable pills
- All filter dimensions: vendor, vendor owner, status, amount range, payment method, category (with exclusion toggle), unscheduled, date ranges (invoice, due, payment send, payment arrival)
- "Only" shortcut in filter value lists
- Column sorting (click header to toggle asc/desc)
- Pagination (page size selector, page navigation)
- **All bulk actions** — bulk approve, bulk edit (amount, due date, invoice date, description, category), bulk delete drafts, bulk archive, bulk schedule, bulk pay now, bulk cancel, bulk retry, bulk unschedule, bulk mark as paid
- Bulk action bar appears when rows are selected (checkbox count + action buttons)
- All bulk ops use single transaction with all-or-nothing semantics

**Acceptance criteria:**
- Add 3 filters → URL updates, table filters, chips show, back button restores previous state
- Category exclusion toggle works ("Accounting Class is not Administrative")
- Unscheduled filter shows only approved bills with no scheduled payment
- Sort by amount desc → table reorders
- Select 5 bills → bulk approve → all 5 approved in one transaction
- Bulk edit due date on 3 bills → all updated
- Bulk action on mixed-status bills where one is invalid → entire batch rejected with error message

**FRs addressed:** FR-14 (bill filters), FR-16 (sorting), FR-17 (bulk actions), FR-18 (atomic bulk), FR-21 (category exclusion)

---

## PR-8: History, Overview & Bill Detail

**Branch:** `feat/history-overview-detail`
**Depends on:** PR-7
**Goal:** The remaining Bills tabs and the full bill detail page.

**Scope:**
- **History tab** — shows paid + archived bills, same table/filter/sort infrastructure
- **Overview tab** — status count cards (drafts: N, awaiting approval: N, scheduled: N, etc.) linking to filtered views
- **Bill detail page** (`app/(dashboard)/bills/[id]/page.tsx`):
  - Header: vendor name, status badge, amount, dates
  - Line items table with category labels
  - Payment status section (linked payment record, status, dates)
  - Activity log timeline (chronological list of all events with actor, action, timestamp, metadata)
  - Invoice file preview/download (if invoice_url is set)
  - Action buttons based on current status and user role
- Overdue badge — red "Overdue" label on bills where `due_date < today` and not paid/archived
- Breadcrumb updates: Bills > [Tab] > [Bill #INV-123]

**Acceptance criteria:**
- History tab shows all paid and archived bills
- Overview tab counts match actual bill counts per status
- Clicking a count card navigates to the correct tab with filter applied
- Bill detail shows all fields, line items, activity log in correct order
- Activity log shows "Created by X", "Submitted for approval by X", "Approved by Y", etc.
- Overdue badge appears on overdue bills in tables and detail view
- Invoice file link opens file in new tab

**FRs addressed:** FR-12 (bill tab views), FR-26 (activity log display), FR-35 (overdue badge)

---

## PR-9: Payments Surface

**Branch:** `feat/payments`
**Depends on:** PR-8
**Goal:** The entire Payments tab is functional — separate from Bills, with its own tabs, filters, sorts, bulk actions, and detail view.

**Scope:**
- Payment server actions (if not already covered): cancel, edit date, mark as paid, retry, unschedule — operating on payment records directly
- **Payments page** with tab navigation: Overview, Needs Review, Pending, History
- Payments table using same DataTable infrastructure but with payment-specific columns
- Compound date column — send date + arrival date displayed vertically in one cell
- Payment filters: search, vendor, status, amount range, payment method, arrival date, payment date, due date — all via nuqs
- Payment sorts: due date, payment date, arrival date
- Payment bulk actions: cancel, edit payment date, mark as paid, retry, unschedule
- **Payment detail view** — linked back to originating bill, payment status timeline, method details, initiated by (creator)
- Free-text search bar

**Acceptance criteria:**
- Payments tab shows all payment records grouped by tab
- Needs Review shows pending payments
- Pending shows scheduled/initiated/in-transit
- History shows paid/cancelled/failed
- Compound date column renders correctly
- Payment filters work with URL state
- Bulk cancel 3 payments → all cancelled, originating bills revert to approved
- Payment detail links back to bill detail

**FRs addressed:** FR-13 (payment tab views), FR-15 (payment filters), FR-06 (payment records)

---

## PR-10: Export, Polish & Tests

**Branch:** `feat/export-polish-tests`
**Depends on:** PR-9
**Goal:** Final deliverable quality. CSV export works, UI is polished, tests provide confidence, README is complete.

**Scope:**
- **CSV export** — papaparse, exports current filtered view from both Bills and Payments tabs. Respects active filters and visible columns. Download triggers browser save dialog.
- Responsive polish — test all pages at 375px, 768px, 1440px, 2560px. Fix any overflow, truncation, or layout breaks.
- Toast notifications audit — ensure every server action success/error shows a toast
- Loading states — skeleton loaders for tables during data fetch, disabled buttons during mutations
- Error states — empty state for tables with no results, error boundary for failed queries
- **Integration tests**: full bill lifecycle, bulk operations atomicity, concurrent access conflict
- **Component tests**: bills table (tabs, filters, search, sort, bulk bar), bill form (validation, line items), confirmation dialogs
- README completion — product description, prioritized workflows, what was left out and why, setup instructions, architecture decisions, data model explanation

**Acceptance criteria:**
- CSV export downloads correct data matching current filters
- All pages render correctly at all breakpoints
- Every mutation shows success/error toast
- Tables show skeleton during load, empty state when no results
- `npm test` passes all unit, integration, and component tests
- README is complete and follows the submission spec

**FRs addressed:** FR-19 (CSV export), FR-29 (toasts), FR-28 (confirmation dialogs)
**NFRs addressed:** NFR-01 (LCP), NFR-12 (responsive), NFR-13 (accessibility), NFR-16 (CI tests), NFR-19 (error shape)

---

## Dependency Graph

```
PR-0 Foundation
  └─→ PR-1 Auth & Layout
       └─→ PR-2 Repos, Services & Seed
            └─→ PR-3 Vendors
                 └─→ PR-4 Surface Scaffolding
                      └─→ PR-5 Bill CRUD & Drafts
                           └─→ PR-6 Bill Actions & Tabs
                                └─→ PR-7 Filters & Bulk
                                     └─→ PR-8 History, Overview & Detail
                                          └─→ PR-9 Payments Surface
                                               └─→ PR-10 Export, Polish & Tests
```

## Estimated Effort

| PR | Effort | Cumulative |
|---|---|---|
| PR-0 Foundation | 2-3h | 2-3h |
| PR-1 Auth & Layout | 2-3h | 4-6h |
| PR-2 Repos & Seed | 3-4h | 7-10h |
| PR-3 Vendors | 2-3h | 9-13h |
| PR-4 Surface Scaffolding | 1-2h | 10-15h |
| PR-5 Bill CRUD & Drafts | 3-4h | 13-19h |
| PR-6 Bill Actions & Tabs | 3-4h | 16-23h |
| PR-7 Filters & Bulk | 3-4h | 19-27h |
| PR-8 History, Overview & Detail | 2-3h | 21-30h |
| PR-9 Payments Surface | 2-3h | 23-33h |
| PR-10 Export, Polish & Tests | 3-4h | 26-37h |

**Total estimated: 26-37 hours** depending on pace and debugging time.
