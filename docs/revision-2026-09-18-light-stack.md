# Light-Stack Revision Plan - 2026-09-18

> Locked after stack review (ponytail + ui-design-spec review of the proposal).
> Goal: same features, fewer dependencies, light/airy design per
> `design-system/cetc-lsc/MASTER.md` (v2).
>
> **Drift rule:** the moment repo and this doc diverge, the commit that causes
> the divergence updates this doc in the same commit. This file stays the
> single source of truth or it stops being one.

## Locked decisions

1. **Sentiment = lexicon, both sides.** Delete `@huggingface/transformers`
   (136MB model was downloading to student browsers). New `src/lib/sentiment.ts`:
   ~200-word Tagalog/English lexicon with negation handling ("hindi", "walang").
   Same function runs client-side (live tag) and in the submit server action
   (stored result). No HF API. **Measured gate, not vibes:** hand-label 50-100
   real comments, run the lexicon over them, compute accuracy before locking in.
   Keep the module interface (`classifyComment(text) -> SentimentResult | null`)
   swappable so a model can slot in later without touching callers.
2. **Cron: deleted, fully.** RLS/RPC already enforce `closes_at` at submit time.
   Open state is derived: `manual_override ?? (now between opens_at and closes_at)`.
   Add a nullable `manual_override` column (`open | closed | null`) so the
   admin's one-click Open/Close toggle still works on top of derived state.
   Draft expiry: **ignore, don't sweep** - drafts are private, tiny, and
   overwritten on reopen; stale ones are harmless. Delete
   `src/app/api/cron/daily`. No cron of any kind.
3. **Signature: keep native canvas + stroke points** (already works, zero deps).
   Do NOT add signature_pad unless smoothing/undo proves necessary - if mobile
   strokes come out jagged, first check `touch-action: none`, `devicePixelRatio`
   scaling, and pointer capture. Keep planned `jose` (Ed25519 JWS) + `qrcode` +
   `/verify/[id]` - spec-required.
4. **Anonymity is structural, done during the schema swap.** `evaluations`
   rows carry the student ID (one-per-section uniqueness + participation rate;
   faculty RLS blocks that table). `comments` rows store only
   section/subject/semester + text + sentiment - **no student column at all**,
   so the identity join cannot exist. Free during the schema rewrite,
   a data migration if deferred.
5. **Design: light/airy zinc.** Source of truth is
   `design-system/cetc-lsc/MASTER.md` v2. Espresso theme is retired.
6. **Expect RLS to start enforcing for real.** Authenticated-role policies
   (faculty/dean reads especially) were thin-tested under the old setup; after
   the swap, "missing rows" = the boundary finally working. Tests catch it.

## Dependency changes

Remove:
- `@huggingface/transformers` (+ `onnxruntime-node` from allowScripts)
- `drizzle-orm`, `drizzle-kit`
- `postgres` (after seed conversion)
- `motion`

Add:
- `react-hook-form`, `zod` (shadcn Form)
- `jose`, `qrcode` (+ types)
- `cmdk` (via `npx shadcn@latest add command`)

## Script changes

- Remove: `db:generate`, `db:apply` (Drizzle ceremony; migrations are already plain SQL)
- Convert `scripts/seed.ts` / `seed-remote.mjs` (postgres.js) to `.sql`
  applied via `supabase db reset` / `supabase db push`
- Types: `supabase gen types typescript` replaces `src/db/schema.ts`
- Tests (`scripts/tests/*.test.mjs`, PostgREST-level) and k6 harness survive unchanged

## File deletions

- `src/db/` (Drizzle schema)
- `scripts/apply-migrations.ts`
- `src/lib/supabase/middleware.ts` (role guards move to route layouts)
- `src/components/Stagger.tsx` (CSS replaces it)
- `src/lib/sentiment.ts` (REPLACED in place by the lexicon module - the old
  transformers import must not survive the sweep; grep for it after)
- `src/app/api/cron/daily/` (decision 2: no cron of any kind)

## Code sweep

- Replace all espresso/glassmorphism classes (`bg-espresso-*`, `text-cream-*`,
  `amber-glow*`, `text-[#...]`, `font-mono` labels, glass blur utilities)
  with shadcn primitives + zinc tokens, page by page
- `globals.css`: apply MASTER.md v2 tokens (shadcn v4 format)
- Install Inter via `next/font`; drop Manrope/system-stack mix
- Delete vendored Phosphor icons (`src/components/icons.tsx`) in favor of lucide-react
- Add the three a11y hard requirements: focus-visible rings, reduced-motion,
  44px star targets

## Execution order

Commit after every step; tests green between each. Steps 1-5 structural,
6 cosmetic, 7 features.

1. [x] DONE 2026-09-18: v2 tokens applied to `globals.css` (legacy token names
   kept as zinc-valued aliases until the sweep; light is now the default theme);
   added table/tabs/input/label/form/command primitives (brought RHF, zod, cmdk).
   Build passes, 10/10 tests green.
   `npx shadcn@latest init` + `add` needed primitives; apply v2 tokens to `globals.css`.
   **In parallel, start collecting the 50-100 hand-labeled comments NOW** (not
   at step 7) - pull from real paper evaluation forms if any exist. Real
   student phrasing and real Taglish is the point; self-written comments are
   suspiciously well-formed and the accuracy number will lie.
2. [x] DONE: middleware redirects deleted; role guards live in route layouts
   (`requireProfile`/`requireRole` already covered every page). **Deviation:**
   the proxy is KEPT as `refreshSession` (no redirects) because Server
   Components cannot write cookies — without it Supabase access tokens expire
   after 1h and students get logged out mid-form. `motion` removed; drawer +
   backdrop are CSS keyframes; dead `Stagger.tsx` deleted.
3. [x] DONE: Drizzle deleted (`drizzle-orm`, `drizzle-kit`, `drizzle.config.ts`,
   `src/db/`, `db:generate`). **Deviations:** `scripts/apply-migrations.ts` is
   KEPT — it is the hand-rolled SQL migration runner, not Drizzle ceremony;
   `postgres` moved to devDependencies (migrations + seeds only); types stay
   hand-written in `lib/types.ts` (no CLI link/config.toml here, so
   `supabase gen types` has nothing to read). Migration 0006 was applied via
   `scripts/run-sql.mjs` (Management API — no DATABASE_URL in this env).
4. [x] DONE: `src/lib/sentiment.ts` replaced in place by the lexicon
   (~200 words, Tagalog/English + negation window + multi-word phrases);
   `@huggingface/transformers` deleted; server action classifies at submit and
   the client tag is display-only.
5. [x] DONE: derived open state live (`manual_override ?? window`), admin
   toggle writes `manual_override`, `api/cron/daily` + the Vercel cron +
   `rpc_clear_stale_drafts` all deleted. No cron of any kind.
6. [x] DONE: theme sweep complete. Gate refined to
   `grep -rniE "espresso|amber|\bglass\b" src/` -> **0 matches** (the plain
   `glass` pattern false-positives on `Hourglass`). Dark mode deleted
   (ThemeProvider, theme script, `.dark` block, nav toggles); Inter swapped in
   for Manrope/Jakarta; charts de-gradiented to the muted palette; Phosphor
   icons replaced by a one-file lucide re-export shim (zero markup changes).
   **Deviation:** the `.btn/.card/.table` class contract is RETAINED
   (transitional) rather than rewriting every page's markup to shadcn
   primitives — that rewrite is cosmetic and can happen page by page.
7. [x] DONE: receipts are real — `jose` Ed25519 JWS signed from the stored
   evaluation, public `/verify/[id]` page with QR, JWKS at
   `/.well-known/receipt-jwks.json` for offline verification, key generated by
   `npm run db:key` into `.env.local`. zod now validates both server actions at
   the trust boundary (submit + draft). Lexicon accuracy gate is runnable:
   `npm run sentiment:eval <labeled.jsonl|csv>`, plus a 4-case unit test.
   **Deviation:** the react-hook-form conversion is SKIPPED — the form already
   works with uncontrolled star inputs and gating; zod went where it actually
   buys safety (the trust boundary). Add RHF only if the form grows.
   **User action still open:** the 50-100 real hand-labeled comments.

## Runtime smoke test (post-sweep, dev server)

- `/login` 200; `/verify/[real-id]` 200 with signed receipt; `/verify/[bogus]` 404
- `/.well-known/receipt-jwks.json` serves the **public-only** JWK
- End-to-end proof (`scripts/verify-receipt-e2e.mjs`): JWS extracted from the
  rendered page verifies offline against the JWKS (EdDSA, issuer cetc-portal,
  claims match). PASS.
- Two bugs the smoke test caught and fixed: jose needs PEM (not raw base64)
  + `extractable: true` for JWKS export; and the first JWKS implementation
  was leaking the PRIVATE key component `d` on a public endpoint - fixed.
- Fake pre-filled demo signature removed from SignaturePad (it let students
  submit without ever signing); canvas stroke now follows `--brand`.
- Lint: 0 errors (11 pre-existing warnings in mock-data components).

