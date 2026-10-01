# Operations Runbook

Single source of truth for secrets, key rotation, backups, and the pause risk.
The README covers setup; this file covers operating the portal. Keep both
current in the same commit as the change that invalidates them (drift rule).

## Secrets lifecycle

| Secret | Lives in | Used by | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env, `.env.local` | everywhere | public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env, `.env.local` | dean overview cache, login resolution + student registration, scripts/tests | server-only; since 0007 the public verify page does NOT use it |
| `RECEIPT_SIGNING_KEY` | Vercel env, `.env.local` | receipt signing (receipt.ts) | missing or malformed = silent unsigned receipts (now logged at startup) |
| `NEXT_PUBLIC_SITE_URL` | Vercel env | QR codes on /verify | set to the real domain; falls back to VERCEL_URL then localhost |
| `SUPABASE_ACCESS_TOKEN` | `.env.local` only | apply-mgmt-api.mjs, seed-remote.mjs | project-admin scope; never commit, never send anywhere except api.supabase.com |
| `DATABASE_URL_DIRECT` | GitHub repo secret | backup.yml pg_dump | session/direct connection, not the 6543 pooler |
| `KEEPALIVE_SUPABASE_URL` + `KEEPALIVE_SERVICE_ROLE_KEY` | GitHub repo secrets | keep-alive.yml | one REST read per day |
| `TEST_SUPABASE_URL` / `TEST_SUPABASE_ANON_KEY` / `TEST_SUPABASE_SERVICE_ROLE_KEY` + var `ALLOW_TESTS_ON` | GitHub secrets/var | ci.yml tests job | tests refuse to run against any project unless `ALLOW_TESTS_ON` matches the URL's ref |

## Receipt key rotation

The signing key is Ed25519, `kid cetc-receipt-v1` (receipt.ts). One key is
served at `/.well-known/receipt-jwks.json` with `cache-control: max-age=3600`.

Rotation means old receipts stop verifying offline once the JWKS swaps. Runbook:

1. Generate the new key locally: `npm run db:key` (appends to `.env.local`).
2. Decide the cutover moment (between submission windows is ideal).
3. Update `RECEIPT_SIGNING_KEY` in Vercel, redeploy.
4. Bump `kid` in `src/lib/receipt.ts` (both the signer and the JWKS entry) to
   `cetc-receipt-v2` in the same deploy.
5. If old receipts must stay verifiable, serve the old public key alongside the
   new one in the JWKS for one more rotation cycle before dropping it.
6. Verify: load `/verify/<real-id>`, confirm a JWS appears and verifies against
   the live JWKS (`node scripts/verify-receipt-e2e.mjs <id>` against localhost).

## Backups and the restore drill

- `backup.yml` pg_dumps daily at 01:10 UTC into GitHub artifacts (90 days) and
  verifies the archive is readable before uploading. It is the ONLY backup.
- If the job fails, there is no backup that day: check the Actions tab the same
  week, not after a disaster.
- Restore drill (run quarterly, never against production):
  1. Download a fresh artifact.
  2. `pg_restore --clean --if-exists -d "$THROWAWAY_DB_URL" backup-*.dump`
     into a throwaway Supabase project.
  3. Point `ALLOW_TESTS_ON` at the throwaway ref and run `npm test` against it.
  4. Spot-check: `select count(*) from evaluations;` matches expectations.

## Pause risk

Free projects pause after 7 idle days; `keep-alive.yml` performs one REST read
per day so usage keeps the project warm even between semesters. If the project
ever does pause: Supabase dashboard, Restore. Note the restored project serves
a broken portal while paused (DNS goes away), so watch the Actions tab for a
failing keep-alive as the early warning.

## Staff account promotion

Since 0007, signup metadata can no longer create staff roles (the trigger
hardcodes `student`). To promote:

```sql
update public.profiles set role = 'faculty' where id = '<auth-user-uuid>';
```

Run it in the Supabase SQL editor. Create the auth user first (Dashboard →
Authentication → Add user, with `full_name`/`student_no` metadata so the
profile is sensible). Every promotion is a manual, deliberate act.

## Email sending

Password resets use Supabase Auth's email sender. The built-in SMTP has tight
hourly caps and no custom domain, so reset mail can be slow or spam-filtered.
Configure custom SMTP (Project Settings → Auth → SMTP) before the first real
submission window.

## Student data

`profiles` is readable by every authenticated user (names are needed across
dashboards). This is a deliberate acceptance: at one college this is
acceptable; if it stops being so, split the broad read into a narrowed view.
