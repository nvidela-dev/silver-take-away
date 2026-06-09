# Architecture

The application keeps framework-facing code thin and moves domain work through explicit layers:

```
App Router pages and components
        |
Server actions and route handlers
        |
Zod validation + Clerk-backed auth and role guards
        |
Use cases
        |
Pure lifecycle state machines + repositories
        |
Drizzle ORM over Neon HTTP
```

## Layer responsibilities

| Layer | Responsibility |
|---|---|
| `src/app/` | Next.js pages, route handlers, and reusable UI. Bills and payments keep workspace-specific controllers while sharing table, filter, selection, saved-view, and export primitives. |
| `src/lib/actions/` | Mutation boundaries. Server actions validate input, resolve the current local user, enforce roles, invoke one use case, and return an `ActionResult`. |
| `src/lib/use-cases/` | Domain orchestration. Use cases select valid operations and keep UI/framework details out of repositories. |
| `src/lib/services/` | Pure lifecycle rules. Bill and payment transition maps are testable without database access. |
| `src/lib/repositories/` | Drizzle reads and writes. Repositories own filtering, sorting, pagination, optimistic concurrency checks, and activity-log persistence. |
| `src/db/schema/` | PostgreSQL contracts, split one table or enum group per file. |

## Key architecture decisions

- **Clerk is the identity provider; Neon is the application authorization source.** Clerk users are synced into `users`, and role checks use the local `users.role` value.
- **Lifecycle transitions are explicit state machines.** Bills and payments each have a pure transition map. User-driven actions must pass through the map before a repository write.
- **Concurrent lifecycle writes fail instead of silently overwriting newer state.** Transition updates include the expected current status in their `WHERE` clause. Draft edits can also include an expected `updated_at` value.
- **Domain history is append-only.** Bill and payment status changes write activity records with an actor, action, timestamp, and optional metadata. Repository methods pair lifecycle writes with their audit append through `db.batch()`.
- **List endpoints are server-driven.** Filters, sort order, tab scope, and pagination are translated into SQL. Bills are paginated in two phases: select ordered bill IDs first, then hydrate line items, avoiding duplicate parent rows from one-to-many joins.
- **Workspace state has two representations.** URL parameters remain the shareable source for the active table state. A versioned JSONB document on `users` optionally persists each user's saved filters, sort, page size, and hidden columns per workspace tab.
- **CSV exports reuse list semantics.** Export route handlers parse the same tab, filter, sort, and visible-column inputs as their workspace tables, then return dynamically generated downloads.
