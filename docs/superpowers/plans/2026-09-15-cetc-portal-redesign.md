# CETC Portal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Frosted Academic Glassmorphism + Tactile Soft-UI redesign across the CETC Faculty Evaluation Portal, adding dual-mode support (Luminous Espresso Dark & Alabaster Parchment Light), Manrope + Plus Jakarta Sans typography, tactile segmented rating controls, sticky category progress tracking, and an interactive slide-over Dean inspector drawer.

**Architecture:** 
- Centralized Tailwind CSS v4 design tokens and dual-mode `@custom-variant dark` in `globals.css`.
- Shared layout shell (`PortalNav` & `PortalLayout`) housing the frosted glass navigation rail and zero-FOUC theme toggle.
- Isolated, reusable interactive components (`TactileRatingGroup`, `EvaluationProgressCapsule`, `FacultyInspectorDrawer`) built with container queries, hardware-accelerated transitions, and WCAG AA contrast.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Motion 13, Recharts 3, TypeScript 5.

## Global Constraints
- Strictly adhere to `docs/superpowers/specs/2026-09-15-cetc-portal-redesign-design.md`.
- No purple/indigo neon glows; use CSU CETC Molten Amber (`#D86A12`) and Deep Espresso (`#120E0B`).
- No generic `Inter` font; use `Manrope` (Display/Stats) and `Plus Jakarta Sans` (Body/UI).
- Zero emojis; use existing Phosphor duotone line SVGs.
- No `transition: all`; specify explicit animated properties (`transform`, `opacity`).
- Minimum touch targets of 44×44px; spacing inside hit targets (zero deadzones).
- Full `prefers-reduced-motion: reduce` support.

---

### Task 1: Foundational Design Tokens & Dual-Mode Infrastructure

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/error.tsx:11`
- Modify: `src/app/not-found.tsx:5`
- Create: `src/components/ThemeProvider.tsx`

**Interfaces:**
- Produces: Tailwind v4 theme variables (`--color-canvas`, `--color-glass-surface`, `--color-panel`, `--color-brand`, etc.), dark mode toggler hook `useTheme()`.

- [ ] **Step 1: Update typography in `src/app/layout.tsx`**
  Import `Plus_Jakarta_Sans` alongside `Manrope` from `next/font/google`, declaring CSS variables `--font-manrope` and `--font-sans`. Inject a synchronous theme script in `<head>` to read `localStorage.getItem('cetc-theme')` or system preference and add `.dark` class to `<html>` with zero FOUC.
- [ ] **Step 2: Consolidate design tokens in `src/app/globals.css`**
  Add `@custom-variant dark (&:where(.dark, .dark *));`.
  Declare the complete light and dark token palettes under `@theme` for canvas, glass surface, panel, cream/walnut text, molten amber brand, and status colors.
  Define `beautiful-shadows` and `smooth-shadow-ring` utility classes.
- [ ] **Step 3: Fix `min-h-screen` in `error.tsx` and `not-found.tsx`**
  Replace `min-h-screen` with `min-h-[100dvh]` to eliminate iOS Safari viewport jumping.
- [ ] **Step 4: Create `ThemeProvider.tsx` client component**
  Expose `theme` state (`'dark' | 'light' | 'system'`) and `toggleTheme()` function. Persist selection to `localStorage` and `document.documentElement.classList`.
- [ ] **Step 5: Verify build & theme compilation**
  Run `npm run build` or `npx next lint` to confirm Tailwind v4 compiles without token syntax errors.
- [ ] **Step 6: Commit changes**
  `git add src/app/layout.tsx src/app/globals.css src/app/error.tsx src/app/not-found.tsx src/components/ThemeProvider.tsx && git commit -m "feat: setup dual-mode tokens and typography"`

---

### Task 2: Frosted Glass Shell & Navigation Rail

**Files:**
- Modify: `src/components/PortalNav.tsx`
- Modify: `src/app/(portal)/layout.tsx`

**Interfaces:**
- Consumes: `useTheme()` from `src/components/ThemeProvider.tsx`.
- Produces: High-craft `RailNav` supporting desktop frosted rail and responsive mobile bottom glass bar.

- [ ] **Step 1: Refactor `PortalNav.tsx` styling**
  Apply frosted glass styling (`backdrop-blur-md bg-glass-surface border border-glass-border ring-1 ring-white/5`).
  Update active navigation links to use molten amber glow (`#D86A12`) with active indicator pill.
- [ ] **Step 2: Add theme toggle to Profile Pill in `PortalNav.tsx`**
  Integrate Sun/Moon toggle button inside the user profile pill (`Juan Dela Cruz • STUDENT` / `Dr. Roberto Al-Rashid • DEAN`) with micro-spring interaction.
- [ ] **Step 3: Update `src/app/(portal)/layout.tsx`**
  Wrap the portal content inside `<ThemeProvider>` and ensure container hierarchy supports both desktop rail and mobile bottom bar without layout shifts.
- [ ] **Step 4: Verify navigation responsiveness**
  Check that RailNav renders correctly on desktop and mobile viewports with zero horizontal scrolling.
- [ ] **Step 5: Commit changes**
  `git add src/components/PortalNav.tsx src/app/(portal)/layout.tsx && git commit -m "feat: upgrade PortalNav to frosted glass with theme switcher"`

---

### Task 3: Tactile Student Evaluation Questionnaire Experience

**Files:**
- Create: `src/components/TactileRatingGroup.tsx`
- Create: `src/components/EvaluationProgressCapsule.tsx`
- Modify: `src/components/EvalForm.tsx`

**Interfaces:**
- Produces: `TactileRatingGroup` component with numeric 1–5 pills, `EvaluationProgressCapsule` with dynamic amber fill.
- Consumes: Rating change callback `(questionId: string, rating: number) => void`.

- [ ] **Step 1: Build `TactileRatingGroup.tsx`**
  Implement molded 3D recessed inset well (`bg-black/25 shadow-inner p-1.5 rounded-xl border border-white/5`).
  Render segmented buttons 1, 2, 3, 4, 5 with scale anchor labels ("1: Poor", "5: Outstanding").
  Selected button: pressed into the well (`translate-y-[1px]`), molten amber fill (`#D86A12`), dark numeral, amber glow.
  Add keyboard navigation (`role="radiogroup"`, arrow keys, number keys 1–5, `aria-pressed`, `aria-label`).
- [ ] **Step 2: Build `EvaluationProgressCapsule.tsx`**
  Sticky container displaying "X of Y Questions Rated" with liquid molten amber progress bar (`scaleX` transform) and auto-save draft sync badge.
- [ ] **Step 3: Refactor `src/components/EvalForm.tsx`**
  Group questions by criteria categories with clear section headers.
  Replace legacy star icons with `<TactileRatingGroup />`.
  Embed `<EvaluationProgressCapsule />` at the top of the form.
  Upgrade E-signature canvas with beveled inset styling and styled "Submit Anonymously" toggle.
  Upgrade bottom action bar to floating frosted glass bar with primary "Submit Evaluation" button.
- [ ] **Step 4: Verify student evaluation interaction**
  Test rating questions, draft saving, signature drawing, and keyboard navigation.
- [ ] **Step 5: Commit changes**
  `git add src/components/TactileRatingGroup.tsx src/components/EvaluationProgressCapsule.tsx src/components/EvalForm.tsx && git commit -m "feat: implement tactile scoring dials and progress capsule in EvalForm"`

---

### Task 4: Shared Staff Scaffold & Bento KPI Grid

**Files:**
- Modify: `src/components/dashboard/StaffScaffold.tsx`
- Modify: `src/components/Charts.tsx`

**Interfaces:**
- Produces: Updated `StaffStatCard` with `@container` queries, directional glows, and verified chart palette colors.

- [ ] **Step 1: Update chart palette in `src/components/Charts.tsx`**
  Update `SENTIMENT_COLORS` to verified tokens: Positive Sage `#6FA86F`, Neutral Gold `#B58A3C`, Negative Crimson `#C9615A`.
  Update tooltip surfaces to frosted dark / light styling with high-contrast text.
- [ ] **Step 2: Refactor `StaffStatCard` in `StaffScaffold.tsx`**
  Wrap stat card in `@container`. Apply smooth ring elevation (`ring-1 ring-white/5 shadow-lg bg-panel`).
  Add directional ambient glow behind primary metric values and enhance SVG `Sparkline` with smooth cubic curve and glowing point indicator.
- [ ] **Step 3: Commit changes**
  `git add src/components/dashboard/StaffScaffold.tsx src/components/Charts.tsx && git commit -m "feat: modernize StaffScaffold bento cards and chart palette"`

---

### Task 5: Dean Analytics Dashboard & Slide-Over Inspector Drawer

**Files:**
- Create: `src/components/dashboard/FacultyInspectorDrawer.tsx`
- Modify: `src/components/dashboard/DeanFacultyTable.tsx`
- Modify: `src/app/(portal)/dean/page.tsx`

**Interfaces:**
- Produces: `FacultyInspectorDrawer` sliding panel for deep-dive faculty dossiers.
- Consumes: Selected `DeanFacultyRow` object and close handler.

- [ ] **Step 1: Build `FacultyInspectorDrawer.tsx`**
  Create 440px wide frosted glass panel (`backdrop-blur-xl bg-glass-surface border-l border-glass-border shadow-2xl`).
  Animate entrance via `motion.div` with spring physics (`stiffness: 300, damping: 30`).
  Display faculty profile, per-criterion bar breakdowns, sentiment donut, and stream of anonymous student comments with sentiment chips.
  Include action buttons: "Download Appraisal PDF" and "Close".
- [ ] **Step 2: Refactor `DeanFacultyTable.tsx`**
  Replace bulky nested card borders with 1px hairline dividers (`border-t border-subtle`) complying with the card overuse ban.
  Add click interaction to table rows to set `selectedFaculty(row)`.
  Render sentiment mini-bar in each row and mount `<FacultyInspectorDrawer />`.
- [ ] **Step 3: Refactor `src/app/(portal)/dean/page.tsx`**
  Implement 4-card asymmetrical bento KPI grid: College Average Score (`4.72 / 5.00`), Participation Rate (`86.4%`), Sentiment Donut, and Action Alert card.
- [ ] **Step 4: Verify Dean dashboard interactions**
  Test opening and closing the slide-over drawer, filtering departments, searching faculty, and PDF triggers.
- [ ] **Step 5: Commit changes**
  `git add src/components/dashboard/FacultyInspectorDrawer.tsx src/components/dashboard/DeanFacultyTable.tsx src/app/(portal)/dean/page.tsx && git commit -m "feat: implement Dean bento grid and slide-over inspector drawer"`

---

### Task 6: Faculty, Admin, and Student Dashboard Refinements

**Files:**
- Modify: `src/app/(portal)/student/page.tsx`
- Modify: `src/app/(portal)/faculty/page.tsx`
- Modify: `src/components/dashboard/FacultyClassesTable.tsx`
- Modify: `src/components/dashboard/AdminUsersTable.tsx`

**Interfaces:**
- Cascades design tokens across remaining role dashboards.

- [ ] **Step 1: Refactor Student Dashboard (`src/app/(portal)/student/page.tsx`)**
  Update Pending vs. Completed cards with frosted glass styling, amber status rings, and updated course subject cards.
- [ ] **Step 2: Refactor Faculty Dashboard (`src/app/(portal)/faculty/page.tsx`)**
  Update personal appraisal metric cards and classes table (`FacultyClassesTable.tsx`) with smooth ring elevation and sentiment mini-bars.
- [ ] **Step 3: Refactor Admin User Management (`src/components/dashboard/AdminUsersTable.tsx`)**
  Apply 1px hairline borders, high-density row heights, and frosted dialog styles to user management tables.
- [ ] **Step 4: Commit changes**
  `git add src/app/(portal)/student/page.tsx src/app/(portal)/faculty/page.tsx src/components/dashboard/FacultyClassesTable.tsx src/components/dashboard/AdminUsersTable.tsx && git commit -m "feat: apply redesign to Student, Faculty, and Admin dashboards"`

---

### Task 7: Full Verification, Accessibility Audit & Regression Testing

**Files:**
- Verification only (all files).

- [ ] **Step 1: Run unit and API tests**
  Execute: `npm test` to verify all evaluations, draft saving, and RLS smoke tests pass without regressions.
- [ ] **Step 2: Run production Next.js build & type check**
  Execute: `npm run build` to ensure zero TypeScript errors, bundle compilation success, and static asset generation.
- [ ] **Step 3: Verify WCAG AA Contrast and Theme Switching**
  Test theme switching between Luminous Espresso Dark and Alabaster Parchment Light. Verify contrast of text, buttons, and rating controls.
- [ ] **Step 4: Verify reduced-motion behavior**
  Simulate `prefers-reduced-motion: reduce` in browser devtools and confirm all transitions are suppressed cleanly.
