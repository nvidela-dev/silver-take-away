# Bill Pay MVP

Accounts payable management — bills flow `draft → awaiting_approval → approved → scheduled → initiated → paid` with role-based access, bulk operations, and configurable table views.

See [REQUIREMENTS.md](./docs/REQUIREMENTS.md) for the full spec and [PR-PLAN.md](./docs/PR-PLAN.md) for the delivery plan.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Drizzle ORM · NeonDB · Zod · Jest · ESLint (Airbnb)

UI tooling (Tailwind, shadcn/ui, react-hook-form, TanStack Table, nuqs, sonner, etc.) lands with the PRs that need it, not before.

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
```

## Deploy to Vercel (Neon + Clerk)

1. Create a Neon Postgres project and copy the pooled connection string into `DATABASE_URL`.
   Example format: `postgresql://neondb_owner:<password>@ep-example-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
2. In Clerk, create a Next.js application and copy:
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_WEBHOOK_SECRET`
3. In Vercel project settings, add all env vars from `.env.example` to:
   - `Production`
   - `Preview`
   - `Development` (optional if you use local env only)
4. In Clerk webhooks, add endpoint:
   - `https://<your-vercel-domain>/api/webhooks/clerk`
   - subscribe to `user.created` and `user.updated`
   - use the matching `CLERK_WEBHOOK_SECRET`
5. Keep Clerk sign-in/sign-up redirects pointed at `/` until the dashboard routes land.
   The root page shows Clerk session, Neon health, and local user sync status.
6. Run schema migration against Neon before first production usage:
   - locally: `yarn db:push`
   - or CI/release job: `yarn db:migrate`
7. Deploy to Vercel and verify:
   - `/sign-in` renders Clerk sign-in
   - `/api/health/db` returns `{ "ok": true }`
   - signing in creates or updates a row in Neon `users`
   - protected routes redirect unauthenticated users once the dashboard shell is merged
   - webhook delivery succeeds in Clerk dashboard logs

## Scripts

| Command | Purpose |
|---|---|
| `yarn dev` | Run the dev server on `localhost:3000`. |
| `yarn build` | Production build. |
| `yarn typecheck` | Type-check without emitting. |
| `yarn lint` | ESLint (Airbnb ruleset). |
| `yarn test` | Run all Jest projects. |
| `yarn test:unit` | Pure unit tests (state machine, validators). |
| `yarn test:integration` | Integration test project (placeholder until PR-2). |
| `yarn test:components` | Component test project (placeholder until PR-3+). |
| `yarn db:generate` | Generate a Drizzle migration from the schema. |
| `yarn db:migrate` | Apply pending migrations. |
| `yarn db:push` | Push the schema directly (dev convenience). |
| `yarn db:seed` | Seed placeholder (real seed in PR-2). |

## Architecture

Layered (actions → services → repositories) with a pure state machine. See [REQUIREMENTS.md §12](./docs/REQUIREMENTS.md) for the SOLID breakdown and transaction boundaries.

```
src/
├── app/                  Next.js App Router (minimal stubs — UI in PR-1+)
├── db/
│   ├── schema/           Drizzle table definitions (one file per table)
│   └── migrations/       drizzle-kit generated SQL
├── lib/
│   ├── auth/             Clerk wrappers, role guards (stubs — wired in PR-1)
│   ├── services/         Pure business logic (state machine lives here)
│   └── validators/       Zod schemas
├── proxy.ts              Auth proxy stub (real config in PR-1)
├── types/                Shared TS interfaces
└── __tests__/            Unit tests proving the type contracts
```

## Status

- **PR-0 (this PR)** — Schema, types, validators, state machine, ESLint (Airbnb). No UI, no features. Reviewable as a pure contract layer.
- PR-1 → PR-10 — See [PR-PLAN.md](./docs/PR-PLAN.md).
