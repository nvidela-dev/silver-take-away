# Deployment (Vercel + Neon)

1. Create a Neon Postgres project and copy the pooled connection string into `DATABASE_URL`.
   Example format: `postgresql://neondb_owner:<password>@ep-example-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
2. In Vercel project settings, add all env vars from `.env.example` to:
   - `Production`
   - `Preview`
   - `Development` (optional if you use local env only)
3. Run schema migration against Neon before first production usage:
   - locally or in a CI/release job: `yarn db:migrate`
4. Deploy to Vercel and verify:
   - `/` redirects to `/bills?tab=drafts`
   - `/api/health/db` returns `{ "ok": true }`
   - changing the mock user updates the displayed role
   - role-restricted actions return a permission error for disallowed profiles

The deployed app has no authentication boundary. Anyone with the URL can choose
any mock profile and mutate data.
