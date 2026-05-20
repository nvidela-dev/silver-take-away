# Bill Pay MVP

Accounts payable management — bills flow `draft → awaiting_approval → approved → scheduled → initiated → paid` with role-based access, bulk operations, and configurable table views.

See [REQUIREMENTS.md](./REQUIREMENTS.md) for the full spec and [PR-PLAN.md](./PR-PLAN.md) for the delivery plan.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · Drizzle ORM · NeonDB · Clerk · Jest

## Setup

```bash
# 1. Install dependencies
corepack enable
yarn install

# 2. Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL (Neon) and Clerk keys.

# 3. Apply the schema to your Neon database
yarn db:push

# 4. Seed demo data (lands in PR-2)
yarn db:seed

# 5. Run the dev server
yarn dev
```

## Scripts

| Command | Purpose |
|---|---|
| `yarn dev` | Run the dev server on `localhost:3000`. |
| `yarn build` | Production build. |
| `yarn typecheck` | Type-check without emitting. |
| `yarn lint` | ESLint. |
| `yarn test` | Run all Jest projects (unit, integration, components). |
| `yarn test:unit` | Pure unit tests (state machine, validators, utils). |
| `yarn test:integration` | Server actions against a test DB. |
| `yarn test:components` | RTL component tests. |
| `yarn db:generate` | Generate a Drizzle migration from the schema. |
| `yarn db:migrate` | Apply pending migrations. |
| `yarn db:push` | Push the schema directly (dev convenience). |
| `yarn db:seed` | Populate the database with demo data. |

## Architecture

Layered (actions → services → repositories) with a pure state machine. See [REQUIREMENTS.md §12](./REQUIREMENTS.md) for the SOLID breakdown and transaction boundaries.

```
src/
├── app/                  Next.js App Router
├── components/ui/        shadcn/ui primitives
├── db/
│   ├── schema/           Drizzle table definitions (one file per table)
│   └── migrations/       drizzle-kit generated SQL
├── lib/
│   ├── actions/          Server actions (thin orchestrators)
│   ├── services/         Business logic — state machine, transitions
│   ├── repositories/     Drizzle data-access layer (tx-aware)
│   ├── validators/       Zod schemas
│   ├── auth/             Clerk wrappers, role guards
│   ├── queries/          Server-component read paths
│   └── utils.ts          Money/date helpers, `cn()`
├── types/                Shared TS interfaces
└── __tests__/            unit · integration · components
```

## Status

- **PR-0 (this PR)** — Foundation: schema, types, validators, state machine, folder scaffold, unit tests.
- PR-1 → PR-9 — See [PR-PLAN.md](./PR-PLAN.md).
