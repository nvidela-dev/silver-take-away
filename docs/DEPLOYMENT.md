# Deployment (Vercel + Neon + Clerk)

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
5. Keep Clerk sign-in/sign-up redirects pointed at `/`.
   The root route forwards authenticated users to `/bills?tab=drafts`.
6. Run schema migration against Neon before first production usage:
   - locally: `yarn db:push`
   - or CI/release job: `yarn db:migrate`
7. Deploy to Vercel and verify:
   - `/sign-in` renders Clerk sign-in
   - `/api/health/db` returns `{ "ok": true }`
   - signing in creates or updates a row in Neon `users`
   - protected routes redirect unauthenticated users
   - webhook delivery succeeds in Clerk dashboard logs
