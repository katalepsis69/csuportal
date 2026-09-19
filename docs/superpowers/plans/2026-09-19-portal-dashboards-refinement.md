# Portal Dashboards & Error Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Dean dashboard runtime error (`ref: 229212020`), repair broken white-on-white text in the portal navigation, remove crypto-gimmicks and fake review anti-patterns, and align the Login Portal, Faculty Dashboard, and Dean Dashboard with the light-stack specification (`design-system/cetc-lsc/MASTER.md` and `/ui-design-spec`).

**Architecture:** 
- Eliminate inline client event handlers in Server Components by creating an isolated interactive `SemesterSelect` client component with native URL parameter syncing.
- Repair `PortalNav` navigation shell: eliminate `text-white` on white background, remove awkward dual-dot active indicators, and replace the crypto-flavor diagnostic widget with actual institutional academic semester status.
- Refactor `StaffScaffold` and KPI cards: replace heavy dark gradients and multicolored sparklines with clean zinc tokens, subtle single-accent metrics, and `tabular-nums`.
- Modernize `DeanPage`: fix Action Alert contrast (white text on white card), sanitize all `faculty` and `full_name` accesses against null/undefined, and convert remaining legacy classes (`text-cream*`, `bg-panel*`, `border-subtle*`) to standard zinc tokens.
- Refine `login/page.tsx`: replace the fake 5-star customer review quote with genuine institutional accreditation and evaluation security guarantees, and tighten responsive spacing.

**Tech Stack:** Next.js 16.3.5 (Turbopack), React 19.2.8, Tailwind CSS v4, Lucide React, Recharts 3.10.1, @supabase/ssr.

## Global Constraints

- **Single Accent:** CSU maroon (`#7f1d1d` / `var(--primary)`) appears only on primary buttons, active nav indicators, and key focus rings.
- **Canvas & Cards:** Page canvas is `#FAFAFA` (`zinc-50`), cards are `#FFFFFF` with `1px` `#E4E4E7` (`zinc-200`) borders and `shadow-xs`.
- **Typography:** Inter with weights 400 and 600 only; `tabular-nums` on every number in tables and KPI cards.
- **Zero RSC Serialization Violations:** No functions or event handlers passed from Server Components to HTML elements or Client Components.
- **Accessibility:** Minimum 4.5:1 text contrast on light canvas; `focus-visible:ring-2 focus-visible:ring-offset-2` on all interactive elements; minimum 44px touch targets.
- **Verification Rule:** `npm run build` and `npm test` must stay green after every task.

---

### Task 1: Create Isolated Interactive `SemesterSelect` Client Component & Fix Dean RSC Crash

**Files:**
- Create: `src/components/dashboard/SemesterSelect.tsx`
- Modify: `src/app/(portal)/dean/page.tsx:275-298`
- Modify: `src/app/(portal)/error.tsx:1-24`

**Interfaces:**
- Produces: `SemesterSelect({ semesters, currentId, paramName }: { semesters: Semester[]; currentId?: string | null; paramName?: string })`
- Consumes: Next.js `useRouter`, `usePathname`, `useSearchParams`

- [ ] **Step 1: Write unit test / test harness for SemesterSelect and route rendering**
Ensure `scripts/test_dean_route.mjs` verifies that `/dean` renders 200 without throwing `digest: '229212020'`.

- [ ] **Step 2: Create `src/components/dashboard/SemesterSelect.tsx`**
Create clean client component that renders a stylized, accessible `<select>`:
```tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Semester } from '@/lib/types';

export function SemesterSelect({
  semesters,
  currentId,
  paramName = 'sem',
}: {
  semesters: Semester[];
  currentId?: string | null;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(newVal: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newVal) {
      params.set(paramName, newVal);
    } else {
      params.delete(paramName);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={currentId ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Filter evaluation semester"
        className="appearance-none rounded-xl border border-border bg-card px-3.5 py-2 pr-8 text-xs font-medium text-foreground hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs min-h-[38px] transition-colors"
      >
        <option value="">Current semester</option>
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.academic_year} {s.term}
            {s.is_current ? ' (Current)' : ' (Archive)'}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `src/app/(portal)/dean/page.tsx` to replace inline `form` + `onChange` with `<SemesterSelect>`**
Replace lines 275-298 with `<SemesterSelect semesters={(semesters ?? []) as Semester[]} currentId={semesterId} />`. Also sanitize `f.full_name` checks to `f.full_name?.includes(...)` and `(f.full_name || 'Faculty Member').split(' ')[0]`.

- [ ] **Step 4: Update `src/app/(portal)/error.tsx`**
Refactor error boundary to clean zinc styling, replacing legacy `text-cream-muted` with `text-muted-foreground`, and adding clear error guidance.

- [ ] **Step 5: Run tests and verify Dean page loads with 0 errors**
Run: `node scripts/test_dean_route.mjs`
Expected: Status 200, HasError: false for all query configurations.

- [ ] **Step 6: Commit**
```bash
git add src/components/dashboard/SemesterSelect.tsx src/app/(portal)/dean/page.tsx src/app/(portal)/error.tsx
git commit -m "fix(portal): resolve RSC event handler crash on dean dashboard and modernize error boundary"
```

---

### Task 2: Refactor Navigation Shell (`PortalNav.tsx`) to Fix Invisible Text and Anti-Patterns

**Files:**
- Modify: `src/components/PortalNav.tsx`

**Interfaces:**
- Consumes: `Role`, `fullName`
- Produces: Persistent responsive portal rail with accessible high-contrast navigation

- [ ] **Step 1: Fix text-white on white background in `PortalNav.tsx`**
Replace `text-white` on `CSU CETC` branding, navigation item labels, active states, and user names:
- Header brand: `text-foreground font-semibold`
- Active nav item: `bg-primary/10 text-primary font-semibold border-l-2 border-primary` (clean single left indicator, no glowing double dots)
- Inactive nav item: `text-muted-foreground hover:text-foreground hover:bg-muted`
- Bottom profile card name: `text-foreground font-semibold truncate`
- Remove double dots: remove the left `w-2 h-2` and right `w-1.5 h-1.5` dot pairing. Use a single refined active bar or pill indicator.

- [ ] **Step 2: Replace pseudo-crypto diagnostic widget with Institutional Academic Status**
Replace `"Ledger Integrity 100% Valid"` / `"SHA-256 Ledger Synchronized"` with legitimate institutional academic session status:
- Title: `Academic Session`
- Value: `Active Semester` (or `AY 2026–2027 • 1st Sem`)
- Status pill: `Quorum & RLS Active` with a subtle checkmark icon.

- [ ] **Step 3: Verify contrast and responsive mobile drawer**
Ensure mobile drawer and desktop sidebar have consistent zinc background (`bg-card`), 1px borders (`border-border`), and WCAG 4.5:1 compliant contrast.

- [ ] **Step 4: Commit**
```bash
git add src/components/PortalNav.tsx
git commit -m "fix(nav): repair white-on-white text, remove double-dot indicators, and normalize academic status widget"
```

---

### Task 3: Refactor `StaffScaffold.tsx` and Refine Faculty Dashboard

**Files:**
- Modify: `src/components/dashboard/StaffScaffold.tsx`
- Modify: `src/app/(portal)/faculty/page.tsx`
- Modify: `src/components/dashboard/FacultyClassesTable.tsx`

**Interfaces:**
- Consumes: `FacultyOverview`, `Semester[]`
- Produces: Clean institutional dashboard meeting `MASTER.md` v2 specs

- [ ] **Step 1: Clean up `StaffScaffold.tsx` KPI cards and breadcrumbs**
- Remove pseudo-specular gradients (`from-transparent via-white/20 to-transparent`) and ambient blur glows (`bg-brand/8 blur-2xl`).
- Refactor `StaffStatCard` to standard clean cards: `bg-card border border-border rounded-xl p-5 shadow-xs`.
- Ensure sparklines use refined, muted strokes (`var(--primary)` or `#15803d` for positive) without multi-colored clutter.
- Enforce `tabular-nums` on all values.
- Replace breadcrumb container with clean inline navigation (removing the redundant extra outer card).

- [ ] **Step 2: Update `src/app/(portal)/faculty/page.tsx`**
- Replace inline semester form with the unified `<SemesterSelect>`.
- Standardize chart containers with `bg-card border border-border shadow-xs rounded-xl`.
- Verify student sentiment donut and question bar chart hit-areas, responsive flex, and clean labels.

- [ ] **Step 3: Update `src/components/dashboard/FacultyClassesTable.tsx`**
- Replace legacy table styling with clean zinc borders (`divide-border`, `bg-muted/40` headers, `hover:bg-muted/60`).
- Ensure all numbers use `tabular-nums` and ratings are properly aligned.

- [ ] **Step 4: Run test suite**
Run: `npm test`
Expected: 15/15 passing.

- [ ] **Step 5: Commit**
```bash
git add src/components/dashboard/StaffScaffold.tsx src/app/(portal)/faculty/page.tsx src/components/dashboard/FacultyClassesTable.tsx
git commit -m "refactor(faculty): apply v2 light institutional tokens and clean KPI cards"
```

---

### Task 4: Polish Dean Dashboard & Roster Table (`dean/page.tsx`, `DeanFacultyTable.tsx`)

**Files:**
- Modify: `src/app/(portal)/dean/page.tsx`
- Modify: `src/components/dashboard/DeanFacultyTable.tsx`
- Modify: `src/components/dashboard/FacultyInspectorDrawer.tsx`

**Interfaces:**
- Consumes: `DeanOverview`, `Semester[]`
- Produces: Executive Dean Analytics and Faculty Appraisal Roster matching `MASTER.md`

- [ ] **Step 1: Fix Tile 4 Action Alert contrast bug in `dean/page.tsx`**
Fix line 513: Replace `bg-gradient-to-b from-white to-white text-white` with an institutional alert card:
`bg-card border-l-4 border-l-primary border-y border-r border-border p-5 rounded-xl shadow-xs`
Metric number `03` in `text-foreground font-extrabold text-3xl font-display tabular-nums`.

- [ ] **Step 2: Replace all remaining `cream/panel` tokens in `dean/page.tsx` with standard zinc tokens**
- Replace `text-cream` -> `text-foreground`
- Replace `text-cream-muted` -> `text-muted-foreground`
- Replace `bg-panel/75 backdrop-blur-xl` -> `bg-card shadow-xs`
- Replace `border-subtle` -> `border-border`
- Replace `bg-panel2` -> `bg-muted`

- [ ] **Step 3: Polish `DeanFacultyTable.tsx` & `FacultyInspectorDrawer.tsx`**
- In `DeanFacultyTable`: clean zinc table layout, `tabular-nums`, proper badge contrast, and accessible search input.
- In `FacultyInspectorDrawer`: clean white surface (`bg-card`), concentric inner radius, proper text contrast on faculty initials avatar (`bg-primary text-primary-foreground`), clean criteria progress bars, and verified student feedback cards.

- [ ] **Step 4: Verify Dean Page end-to-end**
Run: `node scripts/test_dean_route.mjs`
Expected: Status 200, HasError: false, with all tokens and components rendering cleanly.

- [ ] **Step 5: Commit**
```bash
git add src/app/(portal)/dean/page.tsx src/components/dashboard/DeanFacultyTable.tsx src/components/dashboard/FacultyInspectorDrawer.tsx
git commit -m "refactor(dean): eliminate contrast bugs, polish faculty roster, and unify with light-stack"
```

---

### Task 5: Refine Login Portal (`src/app/login/page.tsx`)

**Files:**
- Modify: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: Auth state, demo credentials, student registration
- Produces: Calm, institutional student and staff login portal

- [ ] **Step 1: Replace anti-slop fake customer quote with Institutional Integrity Statement**
Remove `★★★★★ Student Verified` and the fake committee quote.
Replace with CSU CETC Institutional Evaluation Notice:
- Academic Quality Assurance Notice: "Official student feedback system for curriculum improvement, faculty development, and CHED compliance at Cotabato State University."
- Cryptographic Verification Guarantee: "Every submission generates a verifiable, tamper-evident cryptographic receipt with Ed25519 digital signature."

- [ ] **Step 2: Clean up left and right column layout and tokens**
- Replace `bg-canvas` -> `bg-background` (`zinc-50`).
- Replace `text-cream` -> `text-foreground`, `text-cream-muted` -> `text-muted-foreground`, `border-subtle` -> `border-border`.
- Right-column preview window: replace fake gradient blobs with a clean, crisp card showcasing real evaluation workflow (`portal.csu.edu.ph/student`), completion metrics, and subject roster.
- Ensure all inputs have `h-11` (min 44px touch target) with `focus-visible:ring-2 focus-visible:ring-primary/20`.

- [ ] **Step 3: Test login flow**
Run: `npm test`
Test authentication helper with `scripts/tests/flows.test.mjs`.
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/app/login/page.tsx
git commit -m "refactor(login): replace fake rating anti-pattern with institutional notice and apply zinc design system"
```

---

### Task 6: Global Build & Regression Verification

**Files:**
- All touched files

- [ ] **Step 1: Run TypeScript compiler and production build**
Run: `npm run build`
Expected: 0 TypeScript errors, all routes statically optimized or server-rendered cleanly.

- [ ] **Step 2: Run complete test suite**
Run: `npm test`
Expected: 15/15 tests passing.

- [ ] **Step 3: Perform visual QA check**
Verify that:
- `/login` has no dark/cream remnants, looks institutional, responsive on desktop and mobile.
- `/faculty` loads with clean KPI cards, working filter, readable sidebar.
- `/dean` loads without error, semester filter works seamlessly, faculty table and inspector drawer open with clear contrast.
- Zero invisible `text-white` elements anywhere on white backgrounds.

- [ ] **Step 4: Final commit**
```bash
git commit --allow-empty -m "chore: complete portal dashboards and error refinement verification"
```
