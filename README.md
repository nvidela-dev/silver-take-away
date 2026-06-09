# Bill Pay MVP

An accounts-payable workspace: AP teams capture bills, route them for approval,
schedule and execute payments, and keep an auditable trail of every step.

## What the product does

The app is organized around two workspaces — **Bills** and **Payments** — each a
filterable, sortable, paginated table with bulk actions and CSV export. Access is
role-based, and every state change is recorded in an append-only activity log.

### Core flow: a bill from capture to paid

1. **Capture.** An AP clerk creates a bill against a vendor, with line items
   (optionally categorized), amount, currency, due date, and an invoice file URL.
   It starts as a **draft**, the only state in which it can be freely edited or deleted.
2. **Submit for approval.** The clerk submits the draft, moving it to
   **awaiting approval**.
3. **Approve or reject.** An approver reviews and either approves the bill or
   rejects it with the reason captured in the log.
4. **Schedule or pay.** Once approved, the bill can be scheduled for payment or
   marked paid directly.
5. **Execute.** A scheduled bill is initiated, then marked paid on settlement.
   Failed payments can be retried; in-flight ones can be cancelled back to approved.
6. **Close out.** Any non-draft bill can be archived, removing it from active
   workspaces while preserving its history.

The matching **payment** record tracks the money movement itself — method (ACH,
wire, check, card), schedule/initiation/arrival dates, and failure reasons —
through its own lifecycle (`pending → initiated → paid`, with cancel/fail/retry paths).

> Full transition maps, the per-status actions, and the roles allowed to drive
> each one are documented in [docs/LIFECYCLES.md](./docs/LIFECYCLES.md).

### Who can do what

Five roles (`admin`, `owner`, `ap_clerk`, `approver`, `employee`) gate the
workspace actions: AP clerks capture and submit bills, approvers approve or
reject them, and admins/owners can do both plus delete. Identity comes from
Clerk; the authorization role lives on the local `users` record.

### Working in the workspaces

- **Filter, sort, paginate** — every list is server-driven; the active table state
  lives in the URL so any view is shareable by link.
- **Bulk actions** — select multiple rows to approve, reject, submit, archive,
  delete, initiate, retry, cancel, or mark paid/failed in one step.
- **Saved preferences** — each user can persist their filters, sort, page size,
  and hidden columns per tab.
- **CSV export** — export any filtered view; the export reuses the table's exact
  filter, sort, and visible-column inputs.

## Documentation

| Doc | Contents |
|---|---|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Layering, key technical decisions, where logic lives. |
| [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) | Schema, relationships, enums, and modeling boundaries. |
| [docs/LIFECYCLES.md](./docs/LIFECYCLES.md) | Bill and payment state machines and per-action roles. |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deploying to Vercel with Neon and Clerk. |

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Clerk · Drizzle ORM · NeonDB · Zod · TanStack Table · React Hook Form · nuqs · Tailwind CSS · Vitest · ESLint (Airbnb)

## Setup

```bash
# 1. Install dependencies
corepack enable
yarn install

# 2. Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL + Clerk env vars.

# 3. Apply the schema to your Neon database (once DATABASE_URL is set)
yarn db:push

# 4. Run the dev server
yarn dev
```

For production deployment, see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Scripts

| Command | Purpose |
|---|---|
| `yarn dev` | Run the dev server on `localhost:3000`. |
| `yarn build` | Production build. |
| `yarn typecheck` | Type-check without emitting. |
| `yarn lint` | ESLint (Airbnb ruleset). |
| `yarn test` | Run all Vitest projects. |
| `yarn test:unit` | Pure unit tests (state machine, validators). |
| `yarn test:components` | Component tests. |
| `yarn db:generate` | Generate a Drizzle migration from the schema. |
| `yarn db:migrate` | Apply pending migrations (includes demo seed data). |
| `yarn db:push` | Push the schema directly (dev convenience — does not run seed migrations). |

## Skipped features

- **No role simulation / assignment.** Role checks are enforced server-side (see
  [docs/LIFECYCLES.md](./docs/LIFECYCLES.md)), but there is no UI to assign or
  switch a user's role. New users default to `employee` and roles must be set
  directly in the database, so the permission system can't be exercised through
  the app yet. A role simulation to act as different roles is planned.
- **No invoice scanning.** Invoices are referenced by file URL only — there is no
  OCR or document extraction to auto-populate bill fields from an uploaded file.
- **No real payment execution.** Payments are modeled and driven entirely through
  the lifecycle state machine; there is no integration with a payment processor or
  bank rail, so no money actually moves and statuses are advanced manually.
- **Custom saved views were not added.** Users can save one set of filters, sort
  order, page size, and hidden columns per built-in tab, but cannot create, name,
  or switch between additional custom views.
