# CETC Faculty Evaluation Portal

Next.js 16 + Supabase (Postgres, Auth, RLS) + Vercel. Everything runs on free
tiers. The operating spec is [docs/revision-2026-09-18-light-stack.md](docs/revision-2026-09-18-light-stack.md);
operating procedures live in [docs/operations.md](docs/operations.md).

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 App Router (server actions, `force-dynamic` on authed pages) |
| DB + Auth | Supabase free (RLS is the authorization layer — migrations `0000`–`0007` in `supabase/migrations/`) |
| Schema | Plain SQL migrations applied by `scripts/apply-mgmt-api.mjs` (Management API) or `scripts/apply-migrations.ts` (direct Postgres) |
| Data access | supabase-js with the user's session cookie → every query passes RLS. Aggregates via `rpc_*` functions (invoker rights; the dean-gated comment readers are SECURITY DEFINER with in-function checks) |
| Sentiment | ~200-word Tagalog/English lexicon (`src/lib/sentiment.ts`), computed server-side at submit; client tag is display-only. Accuracy gate: `npm run sentiment:eval` over 50-100 real hand-labeled comments |
| E-signature | Canvas → stroke points JSON, redrawn on PDFs. Never base64 PNG in the DB |
| Receipts | Ed25519 JWS (`jose`) signed server-side; public JWKS at `/.well-known/receipt-jwks.json`; `/verify/[id]` reads through the narrow `rpc_receipt_for` function with the anonymous client (no service role) |
| Open state | Derived, no cron of any kind: `manual_override ?? (now between opens_at and closes_at)` |
| Backups | pg_dump GitHub Action (`.github/workflows/backup.yml`) — the ONLY backup. `keep-alive.yml` pings the project daily so free-tier pause never bites |

## Roles

- **student** — sees assigned subjects (current semester), submits one evaluation per subject: 1–5 ratings, optional comment (server-side lexicon sentiment), e-signature, anonymous toggle
- **faculty** — own results: per-question averages, per-subject breakdown, sentiment pie, anonymous comments, PDF export. Student identity is never visible (enforced by RLS + view)
- **dean** — department dashboard (participation, faculty ranking, per-criterion), history drill-down (AY → term → subject → faculty), all reports
- **admin** — CRUD over reference data with an audit trail (`admin_audit`), semesters/eval-period open-close with manual override, enrollments

Signup always creates a `student`. Promoting staff is a deliberate operator SQL
step — see [docs/operations.md](docs/operations.md#staff-account-promotion).

## Setup (fresh Supabase project)

1. **Create project** at supabase.com (free). No credit card needed.
2. **Get credentials** → put in `.env.local` (copy `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `npm run db:key` to generate `RECEIPT_SIGNING_KEY`
3. **Migrations** (tables + RLS + functions) — two options:
   ```bash
   # A. no DB password needed (Management API):
   node scripts/apply-mgmt-api.mjs   # needs SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF in .env.local
   # B. with a direct Postgres connection:
   npm run db:apply   # DATABASE_URL = pooler port 6543
   ```
4. **Seed demo data** (optional, for a demo environment only — never production):
   ```bash
   node scripts/seed-remote.mjs   # same env as option A
   ```
   Creates demo users (password `eval1234`) and a past semester with
   evaluations. The seed promotes its own staff roles explicitly, because the
   signup trigger no longer reads roles from metadata.
5. **Run** `npm run dev` → http://localhost:3000

## Deploy (Vercel)

1. Push to GitHub → import in Vercel.
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `RECEIPT_SIGNING_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. Add repo secrets for the workflows: `DATABASE_URL_DIRECT` (backups),
   `KEEPALIVE_SUPABASE_URL` + `KEEPALIVE_SERVICE_ROLE_KEY` (keep-alive), and
   optionally the `TEST_*` secrets + `ALLOW_TESTS_ON` variable for CI tests.
4. **Backups**: verify one green run of `backup.yml`, then do the restore drill
   in [docs/operations.md](docs/operations.md#backups-and-the-restore-drill).

## Security model (RLS)

- All runtime DB access uses the signed-in user's JWT — the only service-role
  code paths are the dean overview cache, login resolution/registration, and
  scripts/tests.
- Students: insert evaluations only for their own enrollments (RLS), one per
  subject (unique constraint), window must be open (`sem_is_open`), and
  comment rows are attribution-bound to their evaluation (0007).
- Faculty: read results **only** through `faculty_evaluations` view — no
  student identity columns, ever.
- Dean/admin: full read; admin-only writes on reference tables, recorded in
  `admin_audit`.
- Profiles: `authenticated` may update only their own `full_name` column
  (0007); role changes are operator SQL.
- `evaluations` have no UPDATE/DELETE policy — submissions are immutable.

## Free-tier watchlist

| Resource | Cap | This app |
|---|---|---|
| Supabase DB | 500MB | signatures are stroke points, not images; comment text is the bulk over time |
| Supabase pause | 1 week idle | `keep-alive.yml` pings daily; restore from the dashboard if it ever pauses |
| Supabase backups | none on free | GitHub Action pg_dump + quarterly restore drill |
| Vercel Hobby | 100GB transfer, 1M invocations/mo | `/verify` is unthrottled per hit; accepted at this scale, revisit only if scans get hot |

If caps are ever hit: Cloudflare Workers + Neon escape hatch is documented in
the stack plan.
