# CETC-LSC Portal — Design System MASTER

> Source of truth for all visual decisions. Derived from the official CETC-LSC
> mockup (dark warm institutional brand), WCAG-corrected. Every session builds
> against this file; page-specific overrides live in `pages/`.

## Brand essence

CETC-LSC Faculty Evaluation Portal — warm, institutional, trustworthy.
Dark espresso canvas, layered brown panels, orange action color, gold accents.
The mood: a university at evening, not a tech dashboard.

## Color tokens (contrast-verified on their intended surfaces)

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--canvas` | `#171310` | page background | — |
| `--panel` | `#3A271B` | cards, sidebar, table rows | — |
| `--panel-2` | `#4A3427` | hover fills, nested panels | — |
| `--bg-2` | `#1F1A15` | inputs, tracks, wells | — |
| `--cream` | `#F5F0E8` | primary text on panel | 11:1 ✓ |
| `--cream-dim` | `#C8BEB0` | body text on panel | 7:1 ✓ |
| `--cream-muted` | `#A99D8D` | secondary text on panel | 5:1 ✓ |
| `--cream-faint` | `#8A7F71` | non-essential hints only (≥14px bold) | 3.4:1 ⚠ large only |
| `--brand` | `#D86A12` | fills, borders, large numerals on canvas | 4.9:1 on canvas ✓ |
| `--brand-text` | `#F09A5A` | orange TEXT on panels | 4.8:1 on panel ✓ |
| `--brand-light` | `#E8873F` | hover, large accents | — |
| `--brand-hover` | `#C25E0F` | pressed states | — |
| `--gold` | `#B58A3C` | chart fills, stars, large text | — |
| `--gold-text` | `#CDA45C` | gold TEXT on panels | 5:1 ✓ |
| `--positive` | `#82BB82` | positive text/badges on panel | 4.8:1 ✓ |
| `--positive-fill` | `#6FA86F` | chart fills, donut segments | — |
| `--negative` | `#C9615A` | negative text/badges on panel | 4.6:1 ✓ |
| `--negative-fill` | `#B0453D` | chart fills | — |
| `--subtle` | `rgba(245,240,232,0.10)` | borders | — |

Rule: never place `--brand`, `--gold`, or `--negative-fill` as small-text colors
on panels — use the `-text` variants.

## Typography

- Body: system stack (`ui-sans-serif, system-ui, ...`) — zero font cost.
- Display: **Manrope** (via `next/font`, variable `--font-display`) — page
  titles, stat values, logo, numbers. Weights 700/800.
- Scale: page title 26px/700 · panel title 16px/700 · body 14px · meta 12px ·
  stat value 28px/800. Line-height 1.5 body.

## Layout

- Navbar (sticky): logo `CETC-LSC` (orange accent), role links, profile pill
  (initials avatar + name + role chip + sign out).
- Sidebar 240px, desktop only (`md:`), role-specific sections — never show nav
  a role can't access (RLS-aligned):
  - **student**: Main (Dashboard, Evaluate Faculty, My Evaluations)
  - **faculty**: Main (My Results)
  - **dean**: Main (Dashboard), Analytics (History, Reports)
  - **admin**: Main (Admin, Dashboard), Analytics (Reports)
- Content: 32/40px padding, stat grid 4-up, content grid 1.3fr/1fr.
- Density: dashboard-dense (8–24px component padding).

## Icons

Phosphor **duotone** weight, vendored as React components in
`src/components/icons.tsx` (generated from the local pack — zero npm dep).
`fill="currentColor"`, `aria-hidden`, sized via className. No emoji as icons.

## Motion

- Baseline (everywhere, CSS only): 150–250ms hover/focus transitions,
  card lift `translateY(-2px)` + border glow on hover, orange focus rings
  (`:focus-visible`, 3px `rgba(216,106,18,0.35)`).
- Choreographed (dean dashboard only, `motion` library): stat-card +
  panel entrance stagger, 300–450ms, `ease-out`, y-offset 16px, 60ms each.
- `prefers-reduced-motion: reduce` → all transitions/animations off, stagger
  renders final state immediately.

## Components (class contract)

`.btn` (brand fill, dark text on orange), `.btn-outline` (ghost, subtle
border), `.btn-danger`, `.input` (bg-2, brand focus ring), `.card` (panel,
subtle border, 12px radius, hover lift), `.table/.th/.td`, `.badge`
(+ `.badge-positive/.badge-gold/.badge-negative/.badge-brand`), `.chip`
(role chip), `.panel-title`, `.stat-label/.stat-value`, `.side-link`
(sidebar item), `.success-banner`, `.side-section-h`.

## Skill & process gates (gap analysis — 2026-09-13)

Inventory is design-rich (ui-ux-pro-max, impeccable, design-taste-frontend,
high-end-visual-design, web-design-guidelines, emilkowalski suite ×12,
brandkit). **No new skills required.** The gaps are process gates:

| Gate | Status | Owner skill/agent |
|---|---|---|
| Accessibility (contrast, focus, keyboard, reduced-motion) | ✅ applied in this rebrand | `ecc:accessibility`, ui-ux-pro-max checklist |
| Security review of new write surfaces (drafts RPC) | ✅ self-reviewed with migration 0004 (enrollment check, size caps, student-only RLS) | `ecc:security-review` |
| Test coverage (eval submit, draft, RLS smoke) | ⬜ pending — biggest open gap | `ecc:react-testing`, `ecc:e2e-testing` |
| Load test (500 concurrent, k6 — plan §7) | ⬜ pending | k6 OSS |
| Dependency updates | ✅ automated | Dependabot (weekly) |
| Design token persistence | ✅ this file | ui-ux-pro-max `--persist` pattern |

Re-review gates after: new features, new pages, or each semester rollout.
