# Implementation Plan: CETC Dashboard Suite UI/UX Refinement (Ponytail Minimal-Diff Edition)

Apply the **lazy senior developer ladder** (`/ponytail`):
1. **YAGNI**: No unrequested abstractions, no speculative hash listeners, no custom drawer libraries.
2. **Reuse what's here**: `FacultyInspectorDrawer` already has escape handlers, transitions, and backdrops. `globals.css` already has light-theme tokens.
3. **Shortest working diff wins**: Surgical root-cause fixes across 6 files, total diff under 40 lines.

---

## Forensic Audit & Root Cause Analysis

| Bug | Symptom in Screenshots | Root Cause | Ponytail Minimal Fix |
|---|---|---|---|
| **1. Multi-Active Nav Links** | Admin highlights 4 tabs; Dean highlights 2 tabs; Faculty highlights 2 tabs simultaneously. | `useActiveCheck()` uses `pathname.startsWith(...)` for query params and `pathname === base` for hash anchors, making all child/anchor links match true. | In `PortalNav.tsx`: Use `useSearchParams()`. Match `?tab=` only when query param equals tab; match root page only when `!tab`; ignore `#` jump anchors for active highlights. (6 lines) |
| **2. Dean Dashboard Squashed** | Canvas crushed into ~500px; Donut chart collides with "78% Positive" text; header stacks vertically. | `isDrawerOpen` initialized to `true`; `dean/page.tsx` has hardcoded `2xl:pr-[440px]`; Tile 3 is given `xl:col-span-2` which is too narrow for a 56px SVG + text. | (1) `DeanFacultyTable.tsx`: default `isDrawerOpen: false`. (2) `dean/page.tsx`: remove `2xl:pr-[440px]`. (3) `FacultyInspectorDrawer.tsx`: remove `2xl:hidden` on backdrop. (4) `dean/page.tsx`: grid to 4-3-3-2 and donut to `w-12 h-12`. (4 lines) |
| **3. Admin "No email registered" & Broken Tabs** | All users show "No email registered"; Subnav tabs have invisible text on hover and orange gradient. | `profiles` table has no staff emails; table fallback only handles `student_no`; tab CSS has `hover:text-white` on a white background. | (1) `AdminUsersTable.tsx`: add staff name fallback to email string. (2) `admin/page.tsx`: remove `hover:text-white` and replace gradient with clean card pill. (3 lines) |
| **4. Faculty Bar Chart Q-labels & Faint Text** | Chart shows `Q10 Q20 Q30... Q100`; chart labels use legacy dark-theme tokens (`text-cream`). | `sort_order` in seed is 10, 20... interpolated directly as `Q${q.sort_order}`; `Charts.tsx` has `text-cream` and `var(--cream-muted)`. | (1) `faculty/page.tsx`: use `Q${idx + 1}`. (2) `Charts.tsx`: replace `cream` tokens with `foreground` and `muted-foreground`. (4 lines) |

---

## Proposed Changes (Surgical Diffs)

### 1. Global Navigation Active State
#### [MODIFY] [PortalNav.tsx](file:///c:/Users/sloth/Downloads/abdi/cetc-portal/src/components/PortalNav.tsx)
- Replace `useActiveCheck` (lines 171–183):
```tsx
function useActiveCheck() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  return (href: string) => {
    if (href.includes('?tab=')) {
      const [base, query] = href.split('?tab=');
      return pathname === base && currentTab === query;
    }
    if (href.includes('#')) {
      return false; // In-page anchor, root page link represents current page
    }
    return pathname === href && !currentTab;
  };
}
```
*Diff: ~10 lines. Solves simultaneous multi-active highlights across Admin, Dean, and Faculty.*

---

### 2. Dean Dashboard & Drawer Unsquash
#### [MODIFY] [DeanFacultyTable.tsx](file:///c:/Users/sloth/Downloads/abdi/cetc-portal/src/components/dashboard/DeanFacultyTable.tsx)
- Line 43:
```tsx
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
```

#### [MODIFY] [FacultyInspectorDrawer.tsx](file:///c:/Users/sloth/Downloads/abdi/cetc-portal/src/components/dashboard/FacultyInspectorDrawer.tsx)
- Line 122: Delete `2xl:hidden` so the backdrop is active on all viewports when the drawer is open.

#### [MODIFY] [dean/page.tsx](file:///c:/Users/sloth/Downloads/abdi/cetc-portal/src/app/(portal)/dean/page.tsx)
- Line 248: Delete `2xl:pr-[440px]` from the main container.
- Line 318, 368, 425, 498: Adjust Bento grid spans to 4-3-3-2:
  - Tile 1 (Mean Appraisal): `xl:col-span-4`
  - Tile 2 (Participation): `xl:col-span-3`
  - Tile 3 (Sentiment): `xl:col-span-3`, change donut from `w-14 h-14` to `w-12 h-12` (prevents text collision)
  - Tile 4 (Alert): `xl:col-span-2`

*Diff: ~6 lines across 3 files. Unsquashes Dean overview completely.*

---

### 3. Admin Table Email Fallback & Subnav Tabs
#### [MODIFY] [AdminUsersTable.tsx](file:///c:/Users/sloth/Downloads/abdi/cetc-portal/src/components/dashboard/AdminUsersTable.tsx)
- Line 148: Replace `'No email registered'` with generated staff email:
```tsx
{u.email ?? (u.student_no ? `${u.student_no}@student.cetc.edu.ph` : `${u.full_name.toLowerCase().replace(/^(dr\.|engr\.|prof\.)\s*/, '').replace(/[^a-z0-9]/g, '.')}@cetc.edu.ph`)}
```

#### [MODIFY] [admin/page.tsx](file:///c:/Users/sloth/Downloads/abdi/cetc-portal/src/app/(portal)/admin/page.tsx)
- Lines 229–234: Replace broken `hover:text-white` and orange gradient with standard theme tokens:
```tsx
className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
  t.key === tab
    ? 'bg-card text-foreground font-bold shadow-xs border border-border'
    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
}`}
```

*Diff: ~5 lines across 2 files. Fixes blank emails and invisible hover tab text.*

---

### 4. Faculty Rubric Chart Q-Index & Chart Tokens
#### [MODIFY] [faculty/page.tsx](file:///c:/Users/sloth/Downloads/abdi/cetc-portal/src/app/(portal)/faculty/page.tsx)
- Line 191–194: Fix `name: 'Q' + q.sort_order` to ordinal index:
```tsx
<AvgBar
  data={(overview.per_question ?? []).map((q, idx) => ({
    name: `Q${idx + 1}`,
    value: q.avg_rating,
  }))}
/>
```

#### [MODIFY] [Charts.tsx](file:///c:/Users/sloth/Downloads/abdi/cetc-portal/src/components/Charts.tsx)
- In `SentimentPie`:
  - Line 94: `text-cream` → `text-foreground`
  - Line 97: `text-cream-muted` → `text-muted-foreground`
  - Line 72: `border-subtle bg-panel/95` → `border-border bg-card/95`
- In `AvgBar`:
  - Line 131: `fill: 'var(--cream-muted)'` → `fill: 'var(--muted-foreground)'`
  - Line 139: `fill: 'var(--text-muted)'` → `fill: 'var(--muted-foreground)'`
  - Line 127: `stroke="var(--subtle)"` → `stroke="var(--border)"`

*Diff: ~8 lines across 2 files. Fixes `Q10 Q20...` and faint cream text.*

---

## Verification Plan

### Automated Tests
- Run test suite:
  ```powershell
  npm test
  ```
  Must pass all 15 tests.
- Run build check:
  ```powershell
  npm run build
  ```
  Must compile without errors.

### Manual Sanity Checks
1. `/admin`: Verify only "Overview Control" is active. Click "User Directory" -> only "User Directory" is active.
2. `/admin`: Check user table -> emails appear properly formatted (`@cetc.edu.ph`).
3. `/admin`: Hover over tabs -> text stays visible (no white-on-white).
4. `/dean`: Overview loads full-width (drawer closed). Tile 3 donut chart and percentage have plenty of room. Click faculty row -> drawer slides in.
5. `/faculty`: Bar chart shows `Q1, Q2, Q3... Q10` with high contrast labels.
