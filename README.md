# CETC Faculty Evaluation Portal

Zero-cost production stack per the [stack plan](../1789278694789-zero-cost-production-stack.md) (Rev 2):
Next.js 16 + Supabase (Postgres, Auth, RLS) + Vercel Hobby. Everything runs on free tiers.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 App Router (server actions, no ISR on authed pages) |
| DB + Auth | Supabase free (RLS is the authorization layer — see `supabase/migrations/0001_rls_and_functions.sql`) |
| Schema | Drizzle schema-as-code (`src/db/schema.ts`) → `drizzle-kit generate` |
| Data access | supabase-js with the user's session cookie → every query passes RLS. Aggregates via SECURITY INVOKER SQL functions (`rpc_*`) |
| Sentiment | transformers.js v4 **in the browser** — `twn39/multilingual-sentiment-analysis-ONNX` (23 languages incl. Tagalog + English). Zero server cost, never blocks submit (fails → Neutral) |
| E-signature | Canvas → stroke points JSON (~1–2KB), redrawn on PDFs. Never base64 PNG in the DB |
| Reports | @react-pdf/renderer in the browser (6 report types) + Recharts dashboards |
| Cron | Vercel Cron daily → `/api/cron/daily` (service-role key): keeps Supabase unpauased (free projects pause after 1 week idle) + auto opens/closes eval periods |
| Backups | pg_dump GitHub Action (`.github/workflows/backup.yml`) — the ONLY backup on Supabase free |

## Roles

- **student** — sees assigned subjects (current semester), submits one evaluation per subject: 1–5 ratings, optional comment (auto-sentiment client-side), e-signature, anonymous toggle
- **faculty** — own results: per-question averages, per-subject breakdown, sentiment pie, anonymous comments, PDF export. Student identity is never visible (enforced by RLS + view)
- **dean** — department dashboard (participation, faculty ranking, per-criterion), history drill-down (AY → term → subject → faculty), all reports
- **admin** — CRUD: programs, sections, subjects, faculty assignments, questions, semesters/eval-period open-close, enrollments

## Setup (fresh Supabase project)

1. **Create project** at supabase.com (free). No credit card needed.
2. **Get credentials** → put in `.env.local` (copy `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` — Settings → API (server-only; the cron uses it)
3. **Migrations** (creates tables + RLS + functions) — two options:
   ```bash
   # A. no DB password needed (Management API):
   node scripts/apply-mgmt-api.mjs   # needs SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF in .env.local
   # B. with a direct Postgres connection:
   npm run db:generate && npm run db:apply   # DATABASE_URL = pooler port 6543
   ```
4. **Seed demo data** (optional but recommended for the defense demo):
   ```bash
   node scripts/seed-remote.mjs   # same env as option A
   ```
   Creates demo users (password `eval1234`): `admin@`, `dean@`, `maria@`/`jose@`/`ana@` (faculty),
   `student1..5@cetc.test`, plus subjects/classes/enrollments and a past semester with evaluations.
   Without the service key it seeds only reference data.
5. **Run** `npm run dev` → http://localhost:3000

## Deploy (Vercel, $0)

1. Push to GitHub → import in Vercel (Hobby plan, no card).
2. Set env vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (random string).
3. `vercel.json` registers the daily cron (01:00 UTC, Hobby precision ±59 min).
4. **Backups**: add repo secret `DATABASE_URL_DIRECT` (session pooler port 5432 or direct URL)
   → `.github/workflows/backup.yml` pg_dumps daily, artifacts kept 90 days.
   Test one restore before the defense: download artifact →
   `pg_restore --clean --if-exists -d "$NEW_DB_URL" backup-*.dump`.

## Creating real users

Supabase Dashboard → Authentication → Add user → set **user metadata** so the trigger
creates the right profile:

```json
{ "role": "student", "full_name": "Juan Dela Cruz", "student_no": "2026-0001" }
```

Roles: `admin` / `dean` / `faculty` / `student` (default). Then use Admin → Enrollments
to assign students to classes.

## Security model (RLS)

- All runtime DB access uses the signed-in user's JWT — server code cannot bypass RLS.
- Students: insert evaluations only for their own enrollments (RLS), one per subject
  (unique constraint), period must be open (checked in `rpc_submit_evaluation`).
- Faculty: read results **only** through `faculty_evaluations` view — it has no
  `student_id` column at all, anonymous or not.
- Dean/admin: full read; admin-only writes on all reference tables.
- `evaluations` have no UPDATE/DELETE policy — submissions are immutable.

## Free-tier watchlist

| Resource | Cap | This app |
|---|---|---|
| Supabase DB | 500MB | 48k eval rows over 4 semesters ≈ tens of MB (signatures are stroke points, not images) |
| Supabase pause | 1 week idle | daily cron keeps it alive |
| Supabase backups | none on free | GitHub Action pg_dump |
| Vercel Hobby | 100GB transfer, 1M invocations/mo | well under for 2k students |
| Vercel cron | 1/day per job, ±59 min | fine for open/close |

If caps are ever hit: Cloudflare Workers + Neon escape hatch is documented in the stack plan.
