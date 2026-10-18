# Production-hardening revision — 2026-10-18

Scope: the portal must run as a real system, not a demo. Seed data stays (optional); nothing
else may present information the database did not produce.

## What changed

1. **Fabricated UI data deleted.** Every `DEFAULT_*` fallback is gone: student, faculty, dean and
   admin dashboards, the evaluation form, the faculty roster table, the dossier drawer, and the
   login page's demo-account quick-fill and mockup panels (which carried invented metrics, an
   invented dean's quote, and accreditation claims). Empty database → empty state, as specified in
   `design-system/cetc-lsc/MASTER.md`.
2. **The dean roster no longer decorates real rows.** The old code keyed fake departments, titles,
   sentiment ratios, dossier IDs and invented student comments onto rows by matching surnames
   ("Santos", "Tan"), and hard-flagged one instructor by name. Rows now carry only
   `id / name / sections / responses / overall`, with `ratingLabel` and the review flag derived
   from the score against a named threshold (`FLAG_BELOW_REVIEW = 4.25`).
3. **Dossier detail is real and on demand.** `src/lib/actions/dean.ts` calls `rpc_history`
   (dean/admin-gated in SQL) for per-question averages and identity-free comments when the drawer
   opens. Nothing is prefetched for rows nobody is looking at.
4. **The service-role key is out of the request path.** `/verify/[id]` reads
   `rpc_receipt_for(uuid)` — SECURITY DEFINER, anon-granted, five non-identifying columns —
   instead of querying `evaluations` as the service role. The dean dashboard dropped its
   service-role `unstable_cache` and reads with the caller's session, so RLS is the only
   authorization layer. (`unstable_cache` keyed on a semester id also shared one payload between
   dean and admin; the page is `force-dynamic`.)
5. **No invented login identity.** `resolveLoginEmail` returns `null` for an unknown student number
   instead of fabricating `<id>@student.cetc.edu`; the admin users table stopped printing that same
   synthetic address. Self-registration now requires a real email, because that is where recovery
   links go.
6. **Migration 0007** (`supabase/migrations/0007_production_hardening.sql`) — previously only
   referenced in `.env.example`, now it exists:
   - `rpc_receipt_for` (public receipt read),
   - partial unique index enforcing a single `is_current` semester (DB constraint, not two
     sequential admin updates),
   - indexes on `evaluation_comments(section_subject_id, semester_id)` (Postgres does not index FKs),
   - `rpc_history` branch order fixed: naming a faculty returns that faculty's detail. The old
     order tested `p_subject_id` first, so the "faculty detailed" report and drawer were being
     handed the subject list. `/dean/history`'s `level` derivation now mirrors the SQL.
   - `rpc_student_dashboard` returns `evaluation_id`, so a student can open their receipt after
     the post-submit redirect (`/student?submitted=1&h=…&r=<uuid>`, plus a link on completed rows).
7. **Dead CSS made live.** `status-sage`, `status-crimson`, `status-gold`, `panel2`, `muted0` and
   `shadow-beautiful-sm` were used at ~140 sites but never defined in `@theme`, so those elements
   silently rendered unstyled. They are now zinc/semantic aliases in `globals.css`. Espresso
   leftovers removed: `from-primary to-[#c0590d]` gradients → flat `bg-primary`,
   `placeholder-[#A1A1AA]` → `placeholder:text-muted-foreground`.
8. **Truthful copy.** No "encrypted", no "100% institutional audited", no "Rank #2 in college",
   no "+0.14 vs last term". Sentiment is described as the English/Tagalog lexicon it is (the old
   text claimed Maguindanaon support).

## Gates

`npm install` (six declared packages were missing from `node_modules`), then `npm run lint`
clean, `npx tsc --noEmit` clean, `npm run build` green.

`npm test` and migration 0007 must be run against the live project by the operator — the suite
creates and removes a throwaway student, so it is not run here without a go-ahead.

## Known, deliberately not fixed

- **Legacy class contract** (`text-cream-*`, `border-subtle`, `.btn/.card/.table`) is still the
  markup in most pages. It is re-skinned to zinc and documented as transitional in MASTER.md;
  rewriting markup per page is cosmetic and can be done one page at a time.
- **Admin cannot delete accounts from this app.** The old "Remove" button posted
  `adminDelete(table='profiles')`, which the allowlist silently ignored — a destructive control
  that did nothing. Account deletion belongs in Supabase Auth, so the button is gone; the
  allowlist for reference tables is unchanged.
- **Lexicon accuracy is still unmeasured.** The 50–100 hand-labeled real comments required by
  `docs/revision-2026-09-18-light-stack.md` decision 1 have not been collected;
  `npm run sentiment:eval <file>` is ready when they are.
- `StaffScaffold` still supports optional `trend`/`sparkline` props that no page passes. Harmless,
  remove if a future page needs the space.
