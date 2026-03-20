# Alphix

Alphix is a monorepo for an automated trading SaaS.

## Packages

- `packages/web`: Next.js web app (auth, dashboard, admin)
- `packages/shared`: shared types, DB schema, utilities
- `packages/trading-engine`: broker adapters, strategies, execution modules

## Local Setup

1. Copy environment file:

```bash
cp .env.example .env
```

2. Fill required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for profile sync and admin DB views)

3. Install and run:

```bash
bun install
bun run dev
```

## Build and Test

```bash
bun run build
bun run test
```

## Auto Deployment

Production auto deployment is configured via GitHub Actions:

- Workflow: `.github/workflows/deploy-production.yml`
- Trigger: push to `main` (and manual trigger via `workflow_dispatch`)
- Target: Vercel production deployment for `packages/web`

Required GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

If these secrets are missing, deployment job will fail.

## Auth and Admin

- Login page: `/login`
- Signup page: `/signup`
- Admin page: `/admin`
- Admin subpages: `/admin/users`, `/admin/subscriptions`

Admin access is controlled by Supabase user `app_metadata.role === "admin"`.

### Grant Admin Role

Set role with Supabase Admin API or dashboard so it is stored in `app_metadata`.

Example (Node.js):

```ts
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

await admin.auth.admin.updateUserById('USER_UUID', {
  app_metadata: { role: 'admin' },
})
```

## Profile Sync Behavior

During signup, Alphix attempts to sync profile data to the `users` table.

- If `SUPABASE_SERVICE_ROLE_KEY` is configured, sync runs normally.
- If it is missing, signup still succeeds and API returns `PROFILE_SYNC_UNAVAILABLE`.

## Troubleshooting

- If `/login` or `/admin` returns server errors, confirm Supabase env vars are set.
- If admin menu is not visible after login, verify user `app_metadata.role` is `admin`.
- If `/admin/users` or `/admin/subscriptions` fails, verify service role key and DB migrations.
