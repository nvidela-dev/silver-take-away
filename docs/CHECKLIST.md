# Bill Pay MVP — Progress Checklist

> **Usage:** Check off items as they are completed. Each top-level section is a PR. Items within a section can be done in any order unless noted.

---

## PR-0: Foundation & Schema

### Project Init
- [ ] Create Next.js app (App Router, TypeScript strict, Tailwind, src/ directory)
- [ ] Install core dependencies: drizzle-orm, @neondatabase/serverless, drizzle-kit, zod, date-fns
- [ ] Install UI dependencies: @tanstack/react-table, nuqs, react-hook-form, @hookform/resolvers, sonner, lucide-react, papaparse
- [ ] Install test dependencies: jest, @testing-library/react, @testing-library/jest-dom, ts-jest
- [ ] shadcn/ui init + install components (Table, Button, Badge, Dialog, Popover, DropdownMenu, Select, Input, Tabs, Separator, Form, Card, Checkbox, Label, Textarea)
- [ ] Create `.env.example` with all required env vars

### Config Files
- [ ] `next.config.ts` — security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [ ] `jest.config.ts` — multi-project setup (unit, integration, components)
- [ ] `drizzle.config.ts` — NeonDB connection, schema path, migrations output
- [ ] `tsconfig.json` — strict mode, path aliases (@/)

### Database Schema (`db/schema/`)
- [ ] Enum: `user_role` (admin, owner, ap_clerk, approver, employee)
- [ ] Enum: `bill_status` (draft, awaiting_approval, approved, scheduled, initiated, paid, archived, rejected, payment_failed)
- [ ] Enum: `payment_method_type` (ach, wire, check, card)
- [ ] Enum: `payment_status` (pending, scheduled, initiated, in_transit, paid, failed, cancelled)
- [ ] Table: `users` (id, clerk_id, email, full_name, role, created_at, updated_at)
- [ ] Table: `vendors` (id, name, email, owner_id FK, created_at, updated_at)
- [ ] Table: `vendor_payment_methods` (id, vendor_id FK, method_type, is_default, bank_name, account_number_last4, routing_number_last4, mailing_address, created_at)
- [ ] Table: `categories` (id, name, created_at)
- [ ] Table: `bills` (id, vendor_id FK, created_by FK, status, invoice_number, invoice_date, due_date, amount, currency, description, invoice_url, created_at, updated_at)
- [ ] Table: `bill_line_items` (id, bill_id FK CASCADE, description, amount, category_id FK, sort_order)
- [ ] Table: `payments` (id, bill_id FK, created_by FK, amount, payment_method, status, scheduled_date, initiated_date, arrival_date, cancelled_at, failure_reason, created_at, updated_at)
- [ ] Table: `bill_activity_log` (id, bill_id FK CASCADE, actor_id FK, action, metadata jsonb, created_at)
- [ ] All indexes defined (bills: status, vendor_id, due_date, created_by; payments: bill_id, created_by, status, scheduled_date)
- [ ] Run `drizzle-kit generate` — migration SQL generated successfully
- [ ] DB client export (`db/index.ts`)

### TypeScript Types (`types/index.ts`)
- [ ] All enums: UserRole, BillStatus, PaymentMethodType, PaymentStatus, BillActionType
- [ ] Core entities: User, Vendor, VendorPaymentMethod, Category, Bill, BillLineItem, Payment, BillActivityLog
- [ ] Composite types: BillWithRelations, PaymentWithRelations, VendorWithRelations
- [ ] Table types: BillTab, PaymentTab, BillFilters (with search, isUnscheduled), PaymentFilters (with search), SortConfig, SortDirection, PaginationConfig
- [ ] Input types: CreateBillInput (with invoiceUrl), UpdateBillInput, BulkEditBillsInput, SchedulePaymentInput, ApproveRejectInput
- [ ] Server action signatures documented as comments

### Validators (`lib/validators/`)
- [ ] `bill.schemas.ts` — createBillSchema, updateBillSchema, bulkEditBillsSchema, billIdSchema, approveRejectSchema
- [ ] `payment.schemas.ts` — schedulePaymentSchema, paymentIdSchema
- [ ] `vendor.schemas.ts` — createVendorSchema, updateVendorSchema, vendorIdSchema
- [ ] Line item sum validation in createBillSchema

### State Machine (`lib/services/state-machine.ts`)
- [ ] `TRANSITION_MAP` constant — maps [currentStatus][actionType] → nextStatus
- [ ] `assertValidTransition(current, action)` — pure function, throws on invalid
- [ ] `getAvailableActions(status)` — returns valid action types for a given status

### Folder Structure
- [ ] `lib/actions/` — empty barrel files (bills.ts, payments.ts, vendors.ts)
- [ ] `lib/services/` — state-machine.ts + empty bill-transitions.ts, payment-lifecycle.ts
- [ ] `lib/repositories/` — empty barrel files (bill.repo.ts, payment.repo.ts, vendor.repo.ts, line-item.repo.ts, activity-log.repo.ts)
- [ ] `lib/auth/` — stub require-auth.ts, require-role.ts
- [ ] `lib/queries/` — empty barrel files
- [ ] `lib/utils.ts` — money formatting, date formatting helpers
- [ ] `__tests__/unit/`, `__tests__/integration/`, `__tests__/components/`

### Tests (PR-0)
- [ ] Unit test: state machine — all valid transitions
- [ ] Unit test: state machine — all invalid transitions throw
- [ ] Unit test: state machine — getAvailableActions returns correct set per status
- [ ] Unit test: Zod validators — happy path for each schema
- [ ] Unit test: Zod validators — missing required fields
- [ ] Unit test: Zod validators — boundary amounts (0, negative, max numeric(12,2))
- [ ] Unit test: Zod validators — line item sum mismatch rejected

### Final Checks
- [ ] `npm run build` passes with zero errors
- [ ] `npm run test:unit` passes
- [ ] All imports resolve cleanly

---

## PR-1: Clerk

### Identity Setup
- [ ] Clerk provider in `app/layout.tsx`
- [ ] Sign-in page: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- [ ] Sign-up page: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- [ ] Configure Clerk env vars and validate boot/runtime behavior

### Route Protection (Identity-Only)
- [ ] `proxy.ts`/middleware protects dashboard routes using Clerk session only
- [ ] Public routes for auth flows are explicitly configured
- [ ] Unauthenticated users are redirected to `/sign-in`

### Validation
- [ ] Auth routes render correctly in local/dev builds
- [ ] Protected routes allow authenticated Clerk users
- [ ] `npm run build` passes with Clerk enabled

---

## PR-2: Neon

### Database Connectivity
- [ ] Configure `DATABASE_URL` and Drizzle client for Neon
- [ ] Verify connection from runtime/server context
- [ ] Add/verify DB health-check query path

### Schema + Migration
- [ ] Run `db:generate` and confirm migration output
- [ ] Run `db:migrate` or `db:push` against Neon
- [ ] Verify baseline tables/enums/indexes exist in Neon

### Validation
- [ ] `npm run build` passes with Neon config in place
- [ ] App can execute basic read/write path against Neon

---

## PR-3: Clerk-Neon Integration

### Webhook Sync
- [ ] `app/api/webhooks/clerk/route.ts` — POST handler
- [ ] Svix signature verification
- [ ] Handle `user.created` and `user.updated` with idempotent upsert into Neon `users`

### Integrated Auth Helpers
- [ ] `lib/auth/require-auth.ts` resolves Clerk session to local Neon `users` record
- [ ] `lib/auth/require-role.ts` enforces role checks from local user data

### Validation
- [ ] Duplicate webhook deliveries do not create duplicate users
- [ ] Authenticated requests resolve local user record correctly
- [ ] Unauthorized roles are rejected correctly on protected flows

---

## PR-4: Bills/Payments Surface Scaffolding (Folders & Placeholders)

### Route + Folder Scaffolding
- [ ] Create `app/(dashboard)/bills/_components/` folder with placeholder components
- [ ] Create `app/(dashboard)/payments/_components/` folder with placeholder components
- [ ] Add placeholder route: `app/(dashboard)/bills/[id]/page.tsx`
- [ ] Add placeholder route: `app/(dashboard)/payments/[id]/page.tsx`

### Bills Placeholders
- [ ] Add placeholder tab surfaces for: Drafts, For Approval, For Payment, History, Overview
- [ ] Add placeholder table shell component contract for bills surface (props only, no data behavior)
- [ ] Ensure breadcrumbs/nav labels resolve for placeholder bills routes

### Payments Placeholders
- [ ] Add placeholder tab surfaces for: Overview, Needs Review, Pending, History
- [ ] Add placeholder table shell component contract for payments surface (props only, no data behavior)
- [ ] Ensure breadcrumbs/nav labels resolve for placeholder payments routes

### Contracts + Build Check
- [ ] Add placeholder exports for future actions/queries where imports are expected in later PRs
- [ ] `npm run build` passes with placeholder-only additions
- [ ] Verify navigation reaches all placeholders without runtime errors
- [ ] Confirm no real mutation/business logic was introduced in this PR

---

## PR-5: Bill CRUD & Drafts Tab

### Server Actions
- [ ] `createBill` — validate (line item sum), auth, create bill + line items + activity log in tx
- [ ] `updateBill` — validate, auth, draft-only guard, optimistic lock (updated_at), replace line items in tx
- [ ] `deleteBill` — auth, draft-only guard, hard delete

### Bill Form
- [ ] Vendor select dropdown
- [ ] Invoice fields: number, date, due date, amount, currency, description
- [ ] Invoice file URL input
- [ ] Dynamic line items: add row, remove row, description, amount, category select
- [ ] Line item sum validation — real-time display of sum vs total, blocks submit on mismatch
- [ ] React Hook Form + Zod resolver integration

### Drafts Tab
- [ ] TanStack React Table + shadcn DataTable setup
- [ ] Columns: checkbox, vendor/owner (compound), status, amount, due date, invoice #, invoice date
- [ ] Column configuration popover (add/remove/reorder)
- [ ] Free-text search bar
- [ ] Per-row context menu (⋮): edit, delete, view detail (detail page placeholder)
- [ ] Row selection checkboxes
- [ ] Pagination

---

## PR-6: Bill Actions & Approval/Payment Tabs

### Server Actions
- [ ] `submitForApproval` — draft-only, line items sum check, transition
- [ ] `approveBill` — auth (admin/owner/approver), transition, activity log
- [ ] `rejectBill` — auth, transition, note in activity log metadata
- [ ] `schedulePayment` — auth, transition, create payment record
- [ ] `initiatePayment` — auth, transition
- [ ] `cancelPayment` — auth, cancel payment, revert bill to approved
- [ ] `retryPayment` — auth, create new payment, transition
- [ ] `markBillAsPaid` — auth, create payment with paid status
- [ ] `archiveBill` — auth, confirmation required, transition
- [ ] `unschedulePayment` — auth, remove scheduled date

### Approval Tab
- [ ] Table showing `awaiting_approval` bills
- [ ] Approve button with optional note input
- [ ] Reject button with required note input
- [ ] Approver can edit bill fields (except amount, vendor, payment details)
- [ ] Context menu: approve, reject, view detail

### For Payment Tab
- [ ] Table showing approved/scheduled/initiated bills
- [ ] Schedule payment dialog (payment method select, date picker)
- [ ] Pay now / initiate button
- [ ] Cancel button (with confirmation)
- [ ] Context menu: schedule, pay, cancel, unschedule, mark as paid, view detail

### Shared
- [ ] Archive flow with confirmation dialog
- [ ] All actions create activity log entries
- [ ] Optimistic concurrency on all transitions
- [ ] Toast feedback on success/error

---

## PR-7: Filters, Sorts & Bulk Actions

### Filter System
- [ ] nuqs setup — useQueryState for all filter params
- [ ] "+ Add filter" popover with dimension picker
- [ ] Vendor filter — dropdown with search
- [ ] Vendor owner filter — dropdown with search
- [ ] Status filter — multi-select checkboxes
- [ ] Amount filter — min/max number inputs
- [ ] Payment method filter — multi-select
- [ ] Category filter — multi-select with "Only" shortcut
- [ ] Category exclusion toggle ("is not" mode)
- [ ] Unscheduled filter — boolean toggle
- [ ] Date range filters — invoice date, due date, payment send date, payment arrival date
- [ ] Active filter chips — removable pills at top of table
- [ ] "Remove filter" action on each chip
- [ ] URL state persistence — back button restores filters

### Sorting
- [ ] Click column header to sort (asc → desc → none)
- [ ] Sort indicator arrow in column header
- [ ] Sort state in URL params

### Pagination
- [ ] Page size selector (10, 25, 50)
- [ ] Page navigation (prev/next, page numbers)
- [ ] Total count display

### Bulk Actions
- [ ] Bulk action bar — appears when rows selected, shows count + action buttons
- [ ] Bulk approve
- [ ] Bulk edit (amount, due date, invoice date, description, category) — dialog with fields
- [ ] Bulk delete drafts — confirmation dialog
- [ ] Bulk archive — confirmation dialog
- [ ] Bulk schedule payment — dialog with method + date
- [ ] Bulk pay now / initiate
- [ ] Bulk cancel — confirmation dialog
- [ ] Bulk retry
- [ ] Bulk unschedule
- [ ] Bulk mark as paid
- [ ] All bulk ops: single transaction, all-or-nothing
- [ ] Error message identifies failing record on batch failure

---

## PR-8: History, Overview & Bill Detail

### History Tab
- [ ] Table showing paid + archived bills
- [ ] Same filter/sort/search infrastructure
- [ ] Archived bills show "Archived" status badge

### Overview Tab
- [ ] Status count cards (drafts, awaiting approval, approved, scheduled, initiated, paid, archived, rejected, payment_failed)
- [ ] Each card links to the corresponding tab with status filter pre-applied
- [ ] Counts update in real-time based on data

### Bill Detail Page
- [ ] Route: `app/(dashboard)/bills/[id]/page.tsx`
- [ ] Header: vendor name, status badge, amount, currency, invoice #
- [ ] Dates section: invoice date, due date, payment send/arrival dates
- [ ] Overdue badge (red, computed)
- [ ] Line items table: description, amount, category
- [ ] Payment status section: linked payment record, method, status, dates
- [ ] Activity log timeline: chronological events with actor avatar/name, action description, timestamp, metadata
- [ ] Invoice file preview/download link (if invoice_url set)
- [ ] Action buttons: contextual based on current status + user role (uses getAvailableActions)
- [ ] Breadcrumbs: Bills > [Tab] > INV-[number]

---

## PR-9: Payments Surface

### Payment Server Actions (if not in PR-6)
- [ ] Payment-specific: cancelPayment, editPaymentDate, markPaymentAsPaid, retryPayment, unschedulePayment

### Payments Page
- [ ] Route: `app/(dashboard)/payments/page.tsx`
- [ ] Tab navigation: Overview, Needs Review, Pending, History
- [ ] Overview: all payments mixed status
- [ ] Needs Review: pending payments requiring action
- [ ] Pending: scheduled/initiated/in-transit
- [ ] History: paid/cancelled/failed

### Payments Table
- [ ] Reuses DataTable infrastructure from Bills
- [ ] Payment-specific columns: vendor, bill invoice #, amount, payment method, status, payment date, arrival date
- [ ] Compound date column: send date + arrival date stacked vertically
- [ ] Free-text search bar
- [ ] Payment filters via nuqs: search, vendor, status, amount, method, arrival date, payment date, due date
- [ ] Filter chips
- [ ] Column sorting: due date, payment date, arrival date
- [ ] Per-row context menu
- [ ] Row selection + bulk action bar

### Payments Bulk Actions
- [ ] Cancel
- [ ] Edit payment date
- [ ] Mark as paid
- [ ] Retry
- [ ] Unschedule

### Payment Detail
- [ ] Route: `app/(dashboard)/payments/[id]/page.tsx`
- [ ] Payment info: amount, method, status, dates, initiated by (creator)
- [ ] Link back to originating bill detail
- [ ] Failure reason display (if failed)

---

## PR-10: Export, Polish & Tests

### CSV Export
- [ ] papaparse integration
- [ ] Bills tab: export button in table header
- [ ] Payments tab: export button in table header
- [ ] Export respects current filters and visible columns
- [ ] Browser download dialog triggered
- [ ] Handles edge cases: commas in descriptions, unicode vendor names

### Polish
- [ ] Responsive audit: 375px, 768px, 1440px, 2560px — all pages
- [ ] Skeleton loaders on all tables during data fetch
- [ ] Loading/disabled state on action buttons during mutations
- [ ] Empty state component for tables with no results
- [ ] Error boundary for failed queries
- [ ] Toast audit: every server action success/error shows toast
- [ ] Keyboard navigation: tab through table rows, enter to open detail
- [ ] Focus management: dialogs trap focus, return focus on close

### Tests
- [ ] Integration: full bill lifecycle end-to-end
- [ ] Integration: bulk approve atomicity (success case)
- [ ] Integration: bulk approve atomicity (failure case — partial rollback)
- [ ] Integration: concurrent status transition conflict
- [ ] Integration: Clerk webhook create + update + idempotency
- [ ] Component: Bills table renders correct tabs
- [ ] Component: Bills table applies filters to URL
- [ ] Component: Bills table sorts by column click
- [ ] Component: Bill form — vendor select, line items, sum validation
- [ ] Component: Bill form — submission calls correct action
- [ ] Component: Approve/reject buttons per role and status
- [ ] Component: Confirmation dialogs render and execute

### README
- [ ] Product description — what the product does
- [ ] Prioritized workflows — what was built and why
- [ ] What was left out and why
- [ ] Setup instructions (clone, env vars, install, db migrate, db seed, dev)
- [ ] Architecture decisions — layered architecture, state machine, URL state, etc.
- [ ] Data model explanation with ER diagram reference
- [ ] Test instructions (npm test, npm run test:unit, etc.)
