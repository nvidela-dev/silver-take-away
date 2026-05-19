# Bill Pay MVP — Requirements Document v1.9

**Stack:** Next.js 14+ · TypeScript · Drizzle ORM · NeonDB · Clerk · Tailwind CSS · shadcn/ui · Jest

---

## 1. Product Overview

Ramp Bill Pay is an accounts payable (AP) management system. It handles the full lifecycle of a bill — from invoice intake through approval workflows to payment execution and reconciliation.

The product is organized around two primary surfaces: a **Bills** tab (invoice creation, editing, approval) and a **Payments** tab (fund transfer tracking post-approval).

The core value proposition is workflow automation: bills flow through deterministic stages (`draft → approval → payment → paid`), with role-based access, bulk operations, and configurable table views reducing manual AP overhead.

---

## 2. MVP Scope

### 2.1 Prioritized Workflows

1. **Bill Creation & Editing** — Create bills from scratch (no OCR), attach line items with category allocation, edit in draft state.
2. **Bill Lifecycle Management** — Move bills through stages: `draft → awaiting_approval → approved → scheduled → initiated → paid`. Support `rejected`, `archived`, and `payment_failed` terminal/semi-terminal states.
3. **Approval Flow** — Authorized users (admin, owner, approver role) can approve or reject bills in `awaiting_approval` status. Single-action status change — no multi-step chain. Bulk approve supported. All approval/rejection events recorded in the activity log.
4. **Payment Simulation** — No real payment rails. Payments are created post-approval and transition through simulated statuses. Support mark-as-paid for off-platform payments.
5. **Vendor Management** — CRUD vendors with payment method preferences and assigned vendor owners.
6. **Table Views, Filters, Sorts & Bulk Actions** — Filterable, sortable, column-configurable tables for both Bills and Payments. Tab-based navigation by stage. Bulk approve, pay, edit, archive, delete, cancel, retry, unschedule.
7. **CSV Export** — Export current filtered view as CSV from both Bills and Payments surfaces.

### 2.2 Out of Scope

- OCR / invoice scanning
- Recurring bills
- AP email forwarding
- CSV/spreadsheet bill upload
- Multi-entity support
- Real payment processing
- Advanced export / AP aging report
- Custom saved views
- Multi-step approval chains
- Email notifications / remind approvers & vendors
- Payment remittance receipt download

---

## 3. Architecture

### 3.1 Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Database | NeonDB (Serverless Postgres) |
| ORM | Drizzle ORM |
| Auth | Clerk |
| Styling | Tailwind CSS + shadcn/ui primitives |
| Testing | Jest + React Testing Library |
| Deployment | Vercel |

### 3.2 Project Structure

```
src/
├── app/
│   ├── (auth)/                # Clerk sign-in/sign-up
│   ├── (dashboard)/
│   │   ├── bills/             # Bills table, detail, create/edit
│   │   ├── payments/          # Payments table, detail
│   │   ├── vendors/           # Vendor CRUD
│   │   └── layout.tsx         # Sidebar + top nav shell
│   └── api/
│       ├── bills/             # Route handlers
│       ├── payments/
│       ├── vendors/
│       └── webhooks/clerk/    # Clerk user sync webhook
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── bills/
│   ├── payments/
│   └── vendors/
├── db/
│   ├── schema/                # Drizzle table definitions
│   ├── migrations/
│   ├── seed.ts                # Demo data seed script
│   └── index.ts               # DB client export
├── lib/
│   ├── actions/               # Server actions (thin orchestrators)
│   ├── services/              # Business logic, state machine
│   ├── repositories/          # Drizzle data access layer
│   ├── validators/            # Zod schemas
│   ├── auth/                  # Clerk wrappers, role guards
│   ├── queries/               # Read-path server component queries
│   └── utils.ts
├── types/
│   └── index.ts               # Shared TS interfaces
└── __tests__/
    ├── unit/                  # State machine, validators, utils
    ├── integration/           # Server actions against test DB
    └── components/            # RTL component tests
```

### 3.3 Data Flow

All mutations go through Next.js **Server Actions** (`lib/actions/`) which act as thin orchestrators: validate input (Zod), check authorization (Clerk session + role guards), then delegate to a **service layer** (`lib/services/`) for business logic and a **repository layer** (`lib/repositories/`) for Drizzle queries. Multi-table writes execute inside `db.transaction()` with optimistic concurrency checks. See Section 12 for full ACID boundaries and SOLID layering.

Read paths use server components with direct Drizzle queries. Table filtering and sorting are handled via URL search params parsed server-side into Drizzle `where` and `orderBy` clauses.

UI layer uses **Tailwind CSS** for all styling with **shadcn/ui** as the component primitive layer (tables, dialogs, buttons, badges, dropdowns, popovers). No custom CSS files — all composition happens through Tailwind utility classes and shadcn/ui's className-based theming overrides.

### 3.4 Key Dependencies

| Package | Purpose |
|---|---|
| `@tanstack/react-table` | Headless table primitives — filtering, sorting, pagination, row selection, column toggling. Composes with shadcn/ui `<DataTable>`. Building this from scratch is a week; TanStack gives it for free. |
| `nuqs` | Type-safe URL search param state management. Makes filters and sorts SSR-compatible, shareable, and back-button friendly without hand-rolling `useSearchParams` parsing in every table view. |
| `react-hook-form` + `@hookform/resolvers/zod` | Bill creation form has dynamic line item arrays, conditional fields, and sum validation. RHF handles array fields natively; Zod resolver is a one-line integration with our existing validators. |
| `@neondatabase/serverless` | Drizzle driver for NeonDB's HTTP/WebSocket serverless connection. Not the standard `pg` driver — required for Vercel edge/serverless compatibility. |
| `drizzle-zod` | Generates Zod schemas from Drizzle table definitions. Keeps validators and DB schema in sync without manual duplication. |
| `date-fns` | Date formatting and comparison for invoice/due/payment dates. Lighter than dayjs for the operations we need. |
| `sonner` | Toast notifications for action feedback (approved, scheduled, error). shadcn/ui recommended toast library — one component, zero config. |
| `lucide-react` | Icon set that ships with shadcn/ui. Already a transitive dependency. |
| `papaparse` | CSV export. Edge cases (commas in descriptions, unicode vendor names, quoted fields) aren't worth debugging manually. |
| `svix` (optional) | Clerk webhook signature verification. Can also verify manually, but Svix is Clerk's recommended library for production webhook security. |

### 3.5 Middleware

```typescript
// middleware.ts (Next.js root)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)',  // Clerk webhook must be public
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();     // Redirects to sign-in if no session
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

All `(dashboard)` routes are protected by default. The Clerk webhook endpoint is explicitly public since it receives unsigned POST requests from Clerk's servers. Role-based authorization happens at the server action layer, not in middleware — middleware only gates authentication (is there a session?), actions gate authorization (does this user's role permit this operation?).

### 3.6 Security

**Headers** — configured in `next.config.js`, not middleware. The Next.js equivalent of Helmet:

```javascript
// next.config.js
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS handled by Vercel at the edge — not set manually
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

**What's covered by default:**

| Concern | Coverage |
|---|---|
| CSRF | Next.js server actions validate Origin header automatically. No extra work. |
| SQL injection | Drizzle ORM parameterizes all queries. Only a risk if writing raw SQL, which we don't. |
| XSS | React escapes all rendered content. No `dangerouslySetInnerHTML` usage in this project. |
| Auth session | Clerk middleware protects all non-public routes. Session tokens are httpOnly cookies managed by Clerk. |
| Webhook integrity | `svix` verifies Clerk webhook signatures — prevents spoofed webhook payloads. |

**Deferred to production (not MVP):**

| Concern | Rationale |
|---|---|
| Rate limiting | Would use `@upstash/ratelimit` with Redis. Requires external infra. For a take-home, noting it shows better scope judgment than wiring up Redis for a demo. |
| CSP (Content-Security-Policy) | Strict CSP requires auditing all inline scripts and third-party resources. Meaningful for production, overkill for a demo. |
| Input length limits | Zod validators should cap string lengths (e.g., `description` max 2000 chars, `invoice_number` max 50). Listed here as a reminder to add during implementation. |
| Audit log tamper protection | Activity log is append-only at the app layer but not enforced at the DB level. Production would use a write-only DB role or row-level security. |

---

## 4. Database Schema

All tables use `uuid` primary keys via `gen_random_uuid()`. Timestamps are `timestamptz`. Money fields are `numeric(12,2)`.

### Entity-Relationship Summary

```
users ──< vendors          (owner_id)
users ──< bills            (created_by)
users ──< payments         (created_by)
users ──< bill_activity_log (actor_id)
vendors ──< bills
vendors ──< vendor_payment_methods
bills ──< bill_line_items
bills ──< payments
bills ──< bill_activity_log
categories ──< bill_line_items
```

### `users`

Mirrors Clerk user data needed for relational queries. Synced via Clerk webhook.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| clerk_id | text | UNIQUE, NOT NULL |
| email | text | NOT NULL |
| full_name | text | NOT NULL |
| role | user_role | NOT NULL, default 'employee' |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, default now() |

Enum `user_role`: `admin` · `owner` · `ap_clerk` · `approver` · `employee`

### `vendors`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| name | text | NOT NULL |
| email | text | nullable |
| owner_id | uuid | FK → users.id, nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

### `vendor_payment_methods`

Normalized out of vendors to support multiple payment methods per vendor.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| vendor_id | uuid | FK → vendors.id, NOT NULL, ON DELETE CASCADE |
| method_type | payment_method_type | NOT NULL |
| is_default | boolean | NOT NULL, default false |
| bank_name | text | nullable |
| account_number_last4 | text | nullable |
| routing_number_last4 | text | nullable |
| mailing_address | text | nullable |
| created_at | timestamptz | NOT NULL |

Enum `payment_method_type`: `ach` · `wire` · `check` · `card`

Only last4 digits stored for display. Real system would integrate with a payment processor vault.

### `categories`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| name | text | NOT NULL, UNIQUE |
| created_at | timestamptz | NOT NULL |

### `bills`

Central entity. Status drives the entire UI surface.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| vendor_id | uuid | FK → vendors.id, NOT NULL |
| created_by | uuid | FK → users.id, NOT NULL |
| status | bill_status | NOT NULL, default 'draft' |
| invoice_number | text | nullable |
| invoice_date | date | nullable |
| due_date | date | nullable |
| amount | numeric(12,2) | NOT NULL |
| currency | text | NOT NULL, default 'USD' |
| description | text | nullable |
| invoice_url | text | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Enum `bill_status`: `draft` · `awaiting_approval` · `approved` · `scheduled` · `initiated` · `paid` · `archived` · `rejected` · `payment_failed`

Indexes: `(status)`, `(vendor_id)`, `(due_date)`, `(created_by)`

### `bill_line_items`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| bill_id | uuid | FK → bills.id, NOT NULL, ON DELETE CASCADE |
| description | text | nullable |
| amount | numeric(12,2) | NOT NULL |
| category_id | uuid | FK → categories.id, nullable |
| sort_order | integer | NOT NULL, default 0 |

Constraint: sum of line item amounts = `bills.amount`. Enforced at the application layer inside a transaction with a `SELECT SUM` check.

### `payments`

Created when a bill reaches `approved` status. Has its own lifecycle independent of the bill.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| bill_id | uuid | FK → bills.id, NOT NULL |
| created_by | uuid | FK → users.id, NOT NULL |
| amount | numeric(12,2) | NOT NULL |
| payment_method | payment_method_type | NOT NULL |
| status | payment_status | NOT NULL, default 'pending' |
| scheduled_date | date | nullable |
| initiated_date | timestamptz | nullable |
| arrival_date | date | nullable |
| cancelled_at | timestamptz | nullable |
| failure_reason | text | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Enum `payment_status`: `pending` · `scheduled` · `initiated` · `in_transit` · `paid` · `failed` · `cancelled`

Indexes: `(bill_id)`, `(created_by)`, `(status)`, `(scheduled_date)`

### `bill_activity_log`

Append-only audit trail. Every status change, edit, and payment event gets a row.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| bill_id | uuid | FK → bills.id, NOT NULL, ON DELETE CASCADE |
| actor_id | uuid | FK → users.id, NOT NULL |
| action | text | NOT NULL |
| metadata | jsonb | nullable |
| created_at | timestamptz | NOT NULL |

---

## 5. TypeScript Interfaces

Live in `src/types/index.ts`.

```typescript
// ---- Enums ----

export type UserRole = 'admin' | 'owner' | 'ap_clerk' | 'approver' | 'employee';

export type BillStatus =
  | 'draft' | 'awaiting_approval' | 'approved'
  | 'scheduled' | 'initiated' | 'paid'
  | 'archived' | 'rejected' | 'payment_failed';

export type PaymentMethodType = 'ach' | 'wire' | 'check' | 'card';

export type PaymentStatus =
  | 'pending' | 'scheduled' | 'initiated'
  | 'in_transit' | 'paid' | 'failed' | 'cancelled';

// ---- Core Entities ----

export interface User {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorPaymentMethod {
  id: string;
  vendorId: string;
  methodType: PaymentMethodType;
  isDefault: boolean;
  bankName: string | null;
  accountNumberLast4: string | null;
  routingNumberLast4: string | null;
  mailingAddress: string | null;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Bill {
  id: string;
  vendorId: string;
  createdBy: string;
  status: BillStatus;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  amount: string;                 // numeric as string — no float precision loss
  currency: string;
  description: string | null;
  invoiceUrl: string | null;       // uploaded invoice file URL
  createdAt: Date;
  updatedAt: Date;
}

export interface BillLineItem {
  id: string;
  billId: string;
  description: string | null;
  amount: string;
  categoryId: string | null;
  sortOrder: number;
}

export interface Payment {
  id: string;
  billId: string;
  createdBy: string;
  amount: string;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  scheduledDate: string | null;
  initiatedDate: Date | null;
  arrivalDate: string | null;
  cancelledAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillActivityLog {
  id: string;
  billId: string;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ---- Composite / View Types ----

export interface BillWithRelations extends Bill {
  vendor: Vendor;
  creator: User;
  lineItems: BillLineItem[];
  payments: Payment[];
}

export interface PaymentWithRelations extends Payment {
  bill: Bill & { vendor: Vendor };
  creator: User;
}

export interface VendorWithRelations extends Vendor {
  owner: User | null;
  paymentMethods: VendorPaymentMethod[];
}

// ---- Table / Filter Types ----

export type BillTab =
  | 'overview' | 'drafts' | 'approvals' | 'payment' | 'history';

export type PaymentTab =
  | 'overview' | 'needs_review' | 'pending' | 'history';

export interface BillFilters {
  search?: string;                // free-text search across vendor, invoice #, description
  vendorId?: string;
  vendorOwnerId?: string;
  status?: BillStatus[];
  isUnscheduled?: boolean;        // approved bills with no scheduled payment
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: PaymentMethodType;
  categoryId?: string;
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface PaymentFilters {
  search?: string;                // free-text search across vendor, payment details
  vendorId?: string;
  status?: PaymentStatus[];
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: PaymentMethodType;
  arrivalDateFrom?: string;
  arrivalDateTo?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

// ---- Server Action Input Types ----

export interface CreateBillInput {
  vendorId: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount: string;
  currency?: string;
  description?: string;
  invoiceUrl?: string;
  lineItems: {
    description?: string;
    amount: string;
    categoryId?: string;
  }[];
}

export interface UpdateBillInput {
  id: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount?: string;
  description?: string;
  lineItems?: {
    id?: string;
    description?: string;
    amount: string;
    categoryId?: string;
  }[];
}

export interface BulkEditBillsInput {
  billIds: string[];
  dueDate?: string;
  invoiceDate?: string;
  amount?: string;
  description?: string;
  categoryId?: string;
}

export interface SchedulePaymentInput {
  billId: string;
  paymentMethod: PaymentMethodType;
  scheduledDate: string;
}

export interface ApproveRejectInput {
  billId: string;
  note?: string;
}

// ---- State Machine (internal, not client-facing) ----

export type BillActionType =
  | 'submit_for_approval'
  | 'approve'
  | 'reject'
  | 'schedule_payment'
  | 'initiate_payment'
  | 'mark_as_paid'
  | 'cancel_payment'
  | 'retry_payment'
  | 'archive'
  | 'unschedule'
  | 'delete';

// Used by the transition map: TRANSITION_MAP[currentStatus][actionType] → nextStatus
// Not exposed to the client — each action is a separate server action function.

// ---- Server Action Signatures ----
// Each is an individually exported async function in lib/actions/bills.ts
//
//   submitForApproval(billId: string)
//   approveBill(input: ApproveRejectInput)
//   rejectBill(input: ApproveRejectInput)
//   schedulePayment(input: SchedulePaymentInput)
//   initiatePayment(billId: string)
//   markBillAsPaid(billId: string)
//   cancelPayment(billId: string)
//   retryPayment(billId: string)
//   archiveBill(billId: string)
//   unschedulePayment(billId: string)
//   deleteBill(billId: string)
//   bulkApproveBills(billIds: string[])
//   bulkEditBills(input: BulkEditBillsInput)
//   bulkDeleteBills(billIds: string[])
```

---

## 6. Bill Lifecycle

Valid transitions enforced at the server action layer:

```
draft ────→ awaiting_approval ──→ approved ──→ scheduled ──→ initiated ──→ paid
  │                │                  │            │             │
  │                ↓                  │            ↓             ↓
  ↓             rejected              │        cancelled    payment_failed
archived                              ↓                        │
                               (mark as paid) → paid    (retry) → initiated
```

**Key rules:**

- `draft → awaiting_approval` requires line items summing to bill amount.
- `draft → archived` and `draft → (deleted)` are both valid. Delete is hard delete; archive is soft.
- `awaiting_approval → approved/rejected` — any authorized user changes the status. Actor and timestamp recorded in the activity log.
- `approved → scheduled` requires payment method + scheduled date. Creates a `payments` row.
- `approved → paid` via "mark as paid" for off-platform payments. Creates a `payments` row with status `paid`.
- When payment is cancelled, payment status → `cancelled`, bill reverts to `approved`.

---

## 7. Authorization Matrix

| Action | Admin | Owner | AP Clerk | Approver | Employee |
|---|:---:|:---:|:---:|:---:|:---:|
| View all bills | ✓ | ✓ | ✓ | approval queue | — |
| Create bill | ✓ | ✓ | ✓ | — | — |
| Edit draft bill | ✓ | ✓ | ✓ | — | — |
| Edit bill in approval | ✓ | ✓ | ✓ | limited* | — |
| Delete draft bill | ✓ | ✓ | — | — | — |
| Approve / reject | ✓ | ✓ | — | ✓ | — |
| Schedule payment | ✓ | ✓ | ✓ | — | — |
| Initiate payment | ✓ | ✓ | ✓ | — | — |
| Cancel payment | ✓ | ✓ | ✓ | — | — |
| Archive bill | ✓ | ✓ | ✓ | — | — |
| View payments tab | ✓ | ✓ | ✓ | — | — |
| Manage vendors | ✓ | ✓ | ✓ | — | — |
| Export CSV | ✓ | ✓ | ✓ | — | — |

Vendor owners see only bills for their assigned vendors in Approvals and History.

*\*Approver editing: approvers can edit most bill fields during approval except total amount, vendor, and payment details.*

---

## 8. Feature Inventory

### 8.1 Bills Surface

- Tab navigation: Drafts, Approvals, Payment, History, Overview
- Overview tab showing bill counts per status
- **Free-text search bar** across vendor names, invoice numbers, and descriptions — separate from filters, present on all tabs
- Bill creation form — vendor selection, invoice fields, line items with category allocation, optional invoice file upload
- Bill detail view — full bill info, line items, payment status, activity log, invoice file preview/download
- Bill editing (draft state only; approvers can edit limited fields during approval — see §7)
- Per-row context menu (⋮) for individual bill actions (archive, cancel, view detail)
- Table with configurable columns (add/remove/reorder)
- Additive filter chips — users click "+ Add filter," pick a dimension, select values; active filters display as removable pills (e.g., `Status: Scheduled, Initiated +4`). "Only" shortcut to isolate a single value.
- Filter dimensions: vendor, status, amount range, payment method, category, unscheduled (approved with no scheduled payment), date ranges
- Category exclusion toggle in filter
- Column sorting — vendor, status, amount, dates, invoice number
- **"Overdue" badge** — computed red label on bills where `due_date < today` and status is not paid/archived
- Compound column display — payment date cells show both send date and arrival date vertically
- Bulk actions: approve, edit, delete drafts, archive, schedule payment, pay now, cancel, retry, unschedule, mark as paid
- Archive flow with confirmation dialog
- CSV export of current filtered view

### 8.2 Payments Surface

- Tab navigation: Overview, Needs Review, Pending, History
- **Free-text search bar** across vendor names and payment details
- Payment detail view linked back to originating bill
- Filters: arrival date, bill due date, payment date, vendor, status, amount range, payment method
- Column sorting by date fields
- Bulk actions: cancel, edit payment date, mark as paid, retry, unschedule

> Note: Ramp's "Release" step (manual release before initiation) is simplified in our model — scheduling and initiating are separate explicit user actions that cover the same ground.

### 8.3 Vendors Surface

- Vendor list with search
- Vendor create/edit form — name, email, owner assignment, payment methods
- Vendor detail view with associated bills

### 8.4 Shared / Infrastructure

- Clerk authentication with webhook sync to local `users` table
- Role-based middleware and server action guards
- Activity log rendering on bill detail
- Seed script with realistic demo data (10+ vendors, 50+ bills, payments)
- Responsive layout — sidebar navigation, breadcrumbs
- Tailwind CSS theme with shadcn/ui integration

---

## 9. Testing Strategy

Jest as test runner with React Testing Library for component tests. Three tiers.

### Unit Tests — `__tests__/unit/`

- **Bill State Machine** — Every valid transition returns correct next status. Every invalid transition throws. Edge cases: cancel → revert to `approved`; retry from `payment_failed`; approve/reject only from `awaiting_approval`.
- **Zod Validators** — All input schemas tested for happy path, missing fields, invalid types, boundary amounts, line item sum invariant.
- **Authorization Helpers** — Each role × action combination verified against the matrix.
- **Filter/Sort Builders** — URL param parsing into Drizzle `where` clauses.
- **Utility Functions** — Money formatting, date formatting, status display mapping, CSV serialization.

### Integration Tests — `__tests__/integration/`

- **Server Actions** — Against test DB. Correct DB state after mutation, activity log entries, error responses for unauthorized roles.
- **Bill Lifecycle E2E** — Create → submit → approve → schedule → initiate → paid. Verify intermediate states and log entries.
- **Bulk Operations** — Atomicity (all-or-nothing), proper scoping per role.
- **Clerk Webhook** — Mock payloads for user create, update, and idempotency.

### Component Tests — `__tests__/components/`

- **Bills Table** — Correct tabs, filters → URL params, sort by column, checkbox → bulk bar.
- **Bill Form** — Vendor select, line item add/remove, sum validation, correct action shape.
- **Bill Actions** — Approve/reject buttons per role and status.
- **Confirmation Dialogs** — Archive, delete, cancel render warnings and execute.

### Configuration

```typescript
// jest.config.ts
{
  projects: [
    { displayName: 'unit',        testMatch: ['**/__tests__/unit/**/*.test.ts'] },
    { displayName: 'integration', testMatch: ['**/__tests__/integration/**/*.test.ts'],
      globalSetup: './test/setup-db.ts', globalTeardown: './test/teardown-db.ts' },
    { displayName: 'components',  testMatch: ['**/__tests__/components/**/*.test.tsx'],
      testEnvironment: 'jsdom', setupFilesAfterSetup: ['@testing-library/jest-dom'] },
  ],
  moduleNameMapper: { '^@/(.*)': '<rootDir>/src/$1' },
}
```

**Mocking:** Clerk auth mocked at module level. Integration tests use real DB; component tests mock server actions. Drizzle types build typed fixtures.

**CI:** Unit + component on every PR. Integration on merge to main.

---

## 10. Demo Data Strategy

- **Users**: 6–8 spanning all roles
- **Vendors**: 10–15 (SaaS, office supplies, professional services, contractors)
- **Categories**: 8–12 (Software, Office Supplies, Professional Services, Travel, Marketing, Utilities, Equipment, Insurance)
- **Bills**: 50+ across all statuses, $50–$250k, 90-day date range, multi-line splits
- **Approvals**: Bills in `awaiting_approval` with submission log entries; some with rejection notes
- **Payments**: Mix of scheduled, in-transit, paid, failed, cancelled
- **Activity Logs**: 3–8 entries per bill

---

## 11. Architecture Decisions

1. **Money as `numeric(12,2)` / string in TS** — No floats. Server-side math only. Frontend formats strings.

2. **Approvals as status change + activity log** — No dedicated table. Single transition by any authorized user, logged in `bill_activity_log`. Dedicated table only justified for multi-step chains.

3. **Separate `payments` table** — Own lifecycle. Multiple attempts possible (failed → retry). Decoupled from bills.

4. **Activity log as append-only table** — Simpler than event sourcing. Appended in same transaction as mutation.

5. **Filters/sorts via URL search params** — Shareable views, back-button nav, SSR-friendly.

6. **Clerk webhook for user sync** — FK needs require local `users` rows. Webhook avoids per-query API calls.

7. **No soft deletes except archive** — Hard delete for drafts. Archive is a terminal status, not a boolean flag.

8. **Tailwind + shadcn/ui** — Utility-first styling. shadcn/ui copy-pasted, no runtime dep, full markup control.

---

## 12. Data Integrity & SOLID

### ACID — Transaction Boundaries

Every multi-table mutation runs inside `db.transaction()`:

- **Bill Creation** — `INSERT bills` → `INSERT bill_line_items[]` → `INSERT bill_activity_log`. All or nothing.
- **Status Transitions with Side Effects** — `approved → scheduled` atomically: update bill status + insert payment + log entry. Same for mark-as-paid, cancel (revert to approved), retry (new payment row). Any failure → full rollback.
- **Bulk Operations** — All-or-nothing per batch. Bill #7 fails → entire batch rolls back with error identifying which bill and why.
- **Vendor Default Payment Method** — Unset old default + set new default in one transaction.

### Concurrency Control

- **Optimistic Concurrency on Status** — `UPDATE bills SET status = 'approved' WHERE id = ? AND status = 'awaiting_approval'`. Rows affected = 0 → conflict error.
- **Optimistic Locking on Edits** — Check `bills.updated_at` against form-load value: `UPDATE ... WHERE id = ? AND updated_at = ?`. Changed → stale data error.
- **Line Item Sum Invariant** — `SELECT SUM(amount)` check within the transaction after insert/update. Mismatch → rollback.

### SOLID — Layered Architecture

```typescript
// Server Action — thin orchestrator
export async function approveBill(billId: string) {
  const user = await requireAuth();                      // Auth
  const input = billIdSchema.parse(billId);              // Validation
  requireRole(user, ['admin', 'owner', 'approver']);     // Authorization
  return transitionBillStatus(input, 'approved', user);  // Business logic
}

// Service — state machine + side effects
async function transitionBillStatus(billId, target, actor) {
  assertValidTransition(current, target);                // Pure function
  return db.transaction(async (tx) => {
    const bill = await billRepo.updateStatus(tx, ...);   // Repository
    await activityRepo.log(tx, ...);                     // Cross-cutting
    if (needsPayment(target)) {
      await paymentRepo.create(tx, ...);                 // Side effect
    }
    return bill;
  });
}
```

- **S** — Each layer has one job. State machine is pure (unit-testable without DB). Repos handle SQL. Actions orchestrate.
- **O** — State machine is a transition map, not a switch. Adding states = adding map entries. Filter builders same pattern.
- **L** — `BillWithRelations extends Bill`. Role-scoped views filter at query level, not by omitting fields.
- **I** — Repos accept `tx` handle, not full `db`. Actions split per domain: `bills.ts`, `payments.ts`, `vendors.ts`.
- **D** — Business logic calls `billRepo.updateStatus(tx)`, not `tx.update(bills).set()`. Mockable for unit tests. `requireAuth()` wraps Clerk, also mockable.

### Module Layout

```
src/lib/
├── actions/                 # Thin orchestrators
│   ├── bills.ts
│   ├── payments.ts
│   └── vendors.ts
├── services/                # Business logic
│   ├── bill-transitions.ts
│   ├── state-machine.ts     # TRANSITION_MAP (pure)
│   └── payment-lifecycle.ts
├── repositories/            # Data access (accepts tx)
│   ├── bill.repo.ts
│   ├── payment.repo.ts
│   ├── vendor.repo.ts
│   ├── line-item.repo.ts
│   └── activity-log.repo.ts
├── validators/              # Zod schemas
│   ├── bill.schemas.ts
│   ├── payment.schemas.ts
│   └── vendor.schemas.ts
├── auth/                    # Clerk wrappers
│   ├── require-auth.ts
│   └── require-role.ts
├── queries/                 # Read-path for server components
│   ├── bill.queries.ts
│   └── payment.queries.ts
└── utils.ts
```

---

## 13. Functional Requirements

| ID | Requirement | Priority | Section Ref |
|---|---|:---:|:---:|
| **FR-01** | System shall allow authorized users to create bills with vendor, invoice fields, and one or more line items | Must | §2.1, §8.1 |
| **FR-02** | System shall enforce that line item amounts sum to the bill total before any status transition out of draft | Must | §6, §12 |
| **FR-03** | System shall transition bills through the defined lifecycle: draft → awaiting_approval → approved → scheduled → initiated → paid, with rejected, archived, and payment_failed as terminal/semi-terminal states | Must | §6 |
| **FR-04** | System shall reject invalid state transitions and return a descriptive error | Must | §6, §12 |
| **FR-05** | System shall allow authorized users (admin, owner, approver) to approve or reject bills in `awaiting_approval` status | Must | §2.1, §7 |
| **FR-06** | System shall create a payment record when a bill transitions to `scheduled` or is marked as paid | Must | §6 |
| **FR-07** | System shall simulate payment lifecycle transitions (scheduled → initiated → paid / failed) without real payment rails | Must | §2.1 |
| **FR-08** | System shall support retrying failed payments, creating a new payment record and transitioning the bill back to `initiated` | Must | §6 |
| **FR-09** | System shall revert bill status to `approved` when a payment is cancelled | Must | §6 |
| **FR-10** | System shall support CRUD operations on vendors with multiple payment methods per vendor | Must | §8.3 |
| **FR-11** | System shall enforce that only one payment method per vendor is marked as default at any time | Must | §12 |
| **FR-12** | System shall display bills in tab-based views: Drafts, Approvals, Payment, History, Overview | Must | §8.1 |
| **FR-13** | System shall display payments in tab-based views: Overview, Needs Review, Pending, History | Must | §8.2 |
| **FR-14** | System shall support filtering bills by vendor, status, amount range, payment method, category, unscheduled (approved with no scheduled payment), and date ranges | Must | §5, §8.1 |
| **FR-15** | System shall support filtering payments by vendor, status, amount range, payment method, and date ranges | Must | §5, §8.2 |
| **FR-16** | System shall support sorting table columns (vendor, status, amount, dates, invoice number) | Must | §8.1 |
| **FR-17** | System shall support bulk operations: approve, edit, delete drafts, archive, schedule, pay now, cancel, retry, unschedule, mark as paid | Must | §8.1, §8.2 |
| **FR-18** | System shall execute bulk operations atomically — all succeed or all fail with an error identifying the failing record | Must | §12 |
| **FR-19** | System shall support CSV export of the current filtered bill or payment view | Should | §8.1, §8.2 |
| **FR-20** | System shall allow adding/removing/reordering columns in table views | Should | §8.1 |
| **FR-21** | System shall support category exclusion toggle in bill filters | Should | §8.1 |
| **FR-22** | System shall enforce role-based access control per the authorization matrix for all operations | Must | §7 |
| **FR-23** | System shall restrict approver-role users to viewing only bills in the approval queue | Must | §7 |
| **FR-24** | System shall restrict vendor owners to viewing only bills for their assigned vendors | Must | §7 |
| **FR-25** | System shall record every status change, edit, approval, rejection, and payment event in an append-only activity log | Must | §4 (bill_activity_log) |
| **FR-26** | System shall display the activity log timeline on the bill detail view | Must | §8.1 |
| **FR-27** | System shall sync Clerk user data to a local users table via webhook on user create/update | Must | §3.5, §4 |
| **FR-28** | System shall display confirmation dialogs for destructive actions (archive, delete, cancel payment) | Must | §8.1, §9 |
| **FR-29** | System shall provide toast notifications for action feedback (success, error) | Should | §3.4 |
| **FR-30** | System shall seed the database with realistic demo data (10+ vendors, 50+ bills, payments across all statuses) | Must | §10 |
| **FR-31** | System shall support optional invoice file upload when creating or editing a bill, with preview/download on bill detail view | Should | §4, §8.1 |
| **FR-32** | System shall allow approver-role users to edit bill fields (except total amount, vendor, and payment details) during the approval process | Should | §7 |
| **FR-33** | System shall provide a per-row context menu (⋮) on bill and payment table rows for individual actions (archive, cancel, view detail) | Must | §8.1, §8.2 |
| **FR-34** | System shall provide a free-text search bar on all bill and payment table views, searching across vendor name, invoice number, and description | Must | §8.1, §8.2 |
| **FR-35** | System shall display a computed "Overdue" badge on bills where due date has passed and status is not paid or archived | Should | §8.1 |

---

## 14. Non-Functional Requirements

| ID | Requirement | Category | Target |
|---|---|---|---|
| **NFR-01** | Page load (LCP) for bills table shall be under 2 seconds on initial server render | Performance | < 2s LCP |
| **NFR-02** | Server action mutations shall respond within 500ms for single-record operations | Performance | < 500ms p95 |
| **NFR-03** | Bulk operations on up to 50 records shall complete within 3 seconds | Performance | < 3s for 50 records |
| **NFR-04** | Database connections shall use NeonDB serverless driver with HTTP pooling — no persistent connection required | Scalability | Serverless-compatible |
| **NFR-05** | All multi-table mutations shall execute within a single database transaction with automatic rollback on failure | Reliability | ACID compliance |
| **NFR-06** | Status transitions shall use optimistic concurrency (WHERE clause on expected current status) to prevent race conditions | Reliability | Zero duplicate transitions |
| **NFR-07** | Bill edits shall use optimistic locking via `updated_at` to prevent concurrent edit conflicts | Reliability | Conflict detection |
| **NFR-08** | Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) shall be applied to all routes | Security | §3.6 |
| **NFR-09** | All dashboard routes shall require an authenticated Clerk session | Security | Zero unauthenticated access |
| **NFR-10** | All server actions shall validate input with Zod before executing business logic | Security | Zero unvalidated mutations |
| **NFR-11** | Clerk webhook payloads shall be verified via `svix` signature validation | Security | Tamper-proof webhooks |
| **NFR-12** | UI shall be responsive and functional on viewport widths from 375px (mobile) to 2560px (ultrawide) | Usability | Mobile-first responsive |
| **NFR-13** | All interactive components shall be keyboard-navigable and screen-reader compatible via shadcn/ui accessibility primitives | Usability | WCAG 2.1 AA baseline |
| **NFR-14** | Codebase shall follow the layered architecture (actions → services → repositories) with no layer-skipping | Maintainability | SOLID compliance |
| **NFR-15** | State machine shall be a pure function with no DB dependencies, independently unit-testable | Maintainability | Isolated testability |
| **NFR-16** | Unit and component tests shall run on every PR; integration tests on merge to main | Maintainability | CI coverage |
| **NFR-17** | Application shall deploy to Vercel via Git push with zero manual steps | Deployability | One-command deploy |
| **NFR-18** | Database migrations shall be version-controlled and applied via `drizzle-kit push` or `drizzle-kit migrate` | Deployability | Repeatable migrations |
| **NFR-19** | All server action errors shall return structured error objects (not thrown exceptions) with user-facing messages and machine-readable codes | Observability | Consistent error shape |
| **NFR-20** | Activity log shall capture actor, action, timestamp, and relevant metadata for every mutation — queryable for audit purposes | Observability | Full audit trail |
