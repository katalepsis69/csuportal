# CETC Faculty Evaluation Portal

Faculty evaluation system for the College of Engineering, Technology and Computing, Cotabato
State University. Four roles — student, faculty, dean, admin — on a zero-cost stack:
Next.js 16 + Supabase (Postgres, Auth, RLS) + Vercel Hobby.

There is no demo data in the UI. Every panel shows what the database actually contains;
an empty database renders an empty state. Sample data comes only from the optional seeder.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 App Router, server actions, `force-dynamic` on all authenticated pages (no ISR, no shared HTML cache) |
| DB + Auth | Supabase free. **RLS is the authorization layer** — `supabase/migrations/0001_rls_and_functions.sql`, hardened in `0003` |
| Schema | Plain SQL migrations in `supabase/migrations/` (0000 → 0007), applied by script. No ORM |
| Data access | supabase-js with the signed-in user's session → every query passes RLS. Aggregates run in `rpc_*` SQL functions |
| Sentiment | Tagalog/English lexicon (`src/lib/sentiment.ts`) — deterministic, zero network. Computed server-side at submit; the browser tag is display-only |
| E-signature | Canvas → normalized stroke points as JSON (~1–2 KB), redrawn on PDFs. Never base64 images in the DB |
| Receipts | Ed25519 JWS (`jose`) over the stored evaluation, public key at `/.well-known/receipt-jwks.json`, QR-linked `/verify/[id]` |
| Reports | `@react-pdf/renderer` in the browser (6 report types) + Recharts dashboards |
| Eval period | Derived, no cron: `manual_override ?? (now between opens_at and closes_at)` (`sem_is_open()`) |
| Backups | `pg_dump` GitHub Action (`.github/workflows/backup.yml`) — the only backup on Supabase free |

## Roles

- **student** — sees assigned subjects for the current semester, submits one evaluation per
  subject: 1–5 ratings, optional comment, e-signature, anonymous toggle; gets a verifiable receipt
- **faculty** — own results only: per-question averages, per-subject breakdown, sentiment counts,
  anonymous comments, PDF export. Student identity is unreachable (see below)
- **dean** — department dashboard (participation, ranking, per-criterion), faculty dossier,
  history drill-down (AY → term → subject → faculty), all reports
- **admin** — programs, sections, subjects, faculty assignments, questions, semesters and the
  open/close toggle, enrollments

## Setup

1. **Create a Supabase project** (free, no card) and copy `.env.example` to `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. **Signing key for receipts**: `npm run db:key` writes `RECEIPT_SIGNING_KEY` to `.env.local`.
   Without it, receipts render as an unsigned hash instead of a verifiable JWS.
3. **Apply migrations** — either way:
   ```bash
   npm run db:push    # Management API: needs SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF
   npm run db:apply   # direct Postgres: needs DATABASE_URL (pooler port 6543)
   ```
   Migration **0007 is required by the current app** (`rpc_receipt_for`, the single-current-
   semester index, and the corrected `rpc_history` branch order).
4. **Optional demo data** (a handful of users, two semesters, one semester of evaluations):
   ```bash
   node scripts/seed-remote.mjs   # or: npm run db:seed with DATABASE_URL
   ```
   Seeded accounts use password `eval1234`: `admin@`, `dean@`, `maria@`/`jose@`/`ana@`
   (`@cetc.test`) and `student1..5@cetc.test`. Nothing in the UI hardcodes these.
5. `npm run dev` → http://localhost:3000

## Gates

```bash
npm run lint     # eslint
npx tsc --noEmit # typecheck (also runs inside next build)
npm run build    # production build
npm test         # RLS + flow tests against the LIVE project (needs .env.local + seed + 0007)
npm run sentiment:eval labeled.jsonl   # lexicon accuracy over hand-labeled comments
k6 run -e VUS=500 k6/submit-load.js    # load gate; run scripts/loadtest-setup.mjs first
```

## Security model

- All runtime DB access uses the signed-in user's JWT. The service-role key is used only by
  the student self-registration/admin-lookup action, the test suite, and the seeders.
- The public `/verify/[id]` route reads through `rpc_receipt_for`, a SECURITY DEFINER function
  that returns five non-identifying columns — not through the service role.
- **Anonymity is structural.** Comments live in `evaluation_comments`, which has no student
  column, so the identity join cannot be written. Faculty read results through the
  `faculty_evaluations` view; the dean sees sentiment labels via `comment_labels` (no text) and
  text only through dean-gated RPCs.
- Students insert evaluations only for their own enrollments, one per subject (unique
  constraint), only while `sem_is_open()` (checked inside `rpc_submit_evaluation`).
- `evaluations` have no UPDATE/DELETE policy — submissions are immutable.
- One current semester is enforced by a partial unique index, not by app code.

## Deploy (Vercel, $0)

1. Push to GitHub → import in Vercel (Hobby).
2. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `RECEIPT_SIGNING_KEY`, `NEXT_PUBLIC_SITE_URL` (canonical origin
   for receipt QR codes).
3. Apply migration 0007 (step 3 above) before deploying — the receipt page depends on it.
4. **Backups**: set the repo secret `DATABASE_URL_DIRECT` (session pooler 5432 or direct URL);
   `backup.yml` pg_dumps daily to artifacts kept 90 days. Test one restore before any review:
   `pg_restore --clean --if-exists -d "$NEW_DB_URL" backup-*.dump`.
5. Note: free Supabase projects **pause after one week of inactivity** and there are no
   automatic backups. There is no cron in this app by design — if the project pauses, run any
   query (or `npm run db:push`) to wake it.

## Creating real users

Supabase Dashboard → Authentication → Add user, with **user metadata** so the trigger creates
the matching profile:

```json
{ "role": "student", "full_name": "Juan Dela Cruz", "student_no": "2026-0001" }
```

Roles: `admin` / `dean` / `faculty` / `student` (default). Then Admin → Enrollments to place
students in classes. Password and email changes happen in Supabase Auth, not in this app.

## Free-tier watchlist

| Resource | Cap | This app |
|---|---|---|
| Supabase DB | 500 MB | 48k evaluations over 4 semesters ≈ tens of MB (stroke points, not images) |
| Supabase pause | 1 week idle | manual wake, or a daily keep-alive query if you want it automatic |
| Supabase backups | none on free | GitHub Action pg_dump |
| Vercel Hobby | 100 GB transfer, 1M invocations/mo | well under for ~2k students |

Escape hatch if caps are ever hit: Cloudflare Workers + Neon (documented in the original
stack plan).
