# CETC-LSC Portal - Design System MASTER

> Source of truth for all visual decisions (v2, 2026-09-18). **Supersedes the
> Luminous Espresso / Frosted Glassmorphism system** and all tokens in
> `docs/superpowers/specs/2026-09-15-cetc-portal-redesign-design.md`.
> Every session builds against this file.

## Brand essence

CETC-LSC Faculty Evaluation Portal - calm, institutional, trustworthy.
White cards on a zinc-50 canvas, one university accent. The mood: a
well-lit office in the morning, not a tech dashboard.

**Air is a spacing decision, not a decoration decision.** Hierarchy comes
from spacing and typography, never from elevation or color.

## Color tokens (shadcn v4 `globals.css` - edit values in place, OKLCH or hex as generated)

| Token | Value | Use |
|---|---|---|
| `--background` | `#FAFAFA` (zinc-50) | page canvas |
| `--card` | `#FFFFFF` | all cards, tables, dialogs |
| `--border` | `#E4E4E7` (zinc-200) | 1px borders, dividers |
| `--muted` | `#F4F4F5` (zinc-100) | wells, hover fills, table row hover |
| `--foreground` | `#18181B` (zinc-900) | headings, primary text |
| `--muted-foreground` | `#71717A` (zinc-500) | secondary text (4.8:1 ok) |
| `--primary` | `<official CSU maroon hex>` | primary buttons, active states, chart highlights, focus rings |
| `--primary-foreground` | `#FFFFFF` | text on primary (verify 4.5:1+) |
| `--gold` | `#B58A3C` | **chart fills / large elements only - never small text** (2.8:1 on white, fails) |
| `--radius` | `0.625rem` | all radii, concentric (outer = inner + padding) |

Chart palette (muted, no gradients, thin axes, no legend clutter):
positive `#15803D` / neutral `#A1A1AA` / negative `#DC2626`.

Rule: one accent. Primary color appears only on primary buttons, active
states, focus rings, and chart highlights - never as decoration.

## Typography

- One family: **Inter** (`next/font`, weights 400/600 only).
- `tabular-nums` on every number in tables, KPI cards, and stat values.
- Scale: page title 24px/600 / card title 16px/600 / body 14px/400 /
  meta 12px / KPI value 28px/600. Line-height 1.5.

## Layout & space

- Content centered, `max-w-6xl`, never touching screen edges.
- `p-6`+ inside cards, `gap-6` grids - gaps between containers exceed
  inner padding (Gestalt: air lives between cards, not inside them).
- Shadows barely exist: `shadow-xs` only. Hierarchy from spacing and type.
- Sidebar 240px desktop only, role-specific sections (RLS-aligned) -
  same nav contract as before.
- Star-rating inputs: 44x44px minimum touch targets.

## Tables

Subtle row dividers (`--border`), hover `zinc-50`, sticky header,
no zebra stripes, `tabular-nums`, right-aligned numeric columns.

## Empty states

One icon, one line of text, generous padding. A zero-state list must
look intentional.

## Motion

- CSS only: 150-200ms fade/slide on hover/focus/mount. Nothing else, rarely.
- No animation library. `transform`/`opacity` only.
- `prefers-reduced-motion: reduce` -> all transitions off, final states render immediately.

## Accessibility (hard requirements)

- Focus: `focus-visible:ring-2 focus-visible:ring-offset-2` on every
  interactive element (rings in `--primary`).
- Contrast: 4.5:1 body text, 3:1 large headings. zinc-500 on white = 4.8:1 ok.
- Icons decorative -> `aria-hidden`; star inputs get accessible labels.

## Icons

`lucide-react` (already installed). `aria-hidden`, sized via className.
No emoji as icons.

## Components (shadcn/ui)

Use shadcn primitives as generated - Button, Card, Table, Tabs, Dialog,
Command (cmdk palette), Badge, Form (RHF+zod). Token edits in this file are
the only theme work.

**Transitional note:** the legacy class contract in `globals.css`
(`.btn/.card/.table/.badge/...`) is retained while page markup migrates to
shadcn primitives page by page. It is re-skinned to these tokens - no new
markup should be written against it.

## What this file supersedes

- Old espresso tokens in `design-system/cetc-lsc/` -> replaced by this file.
- `docs/superpowers/specs/2026-09-15-cetc-portal-redesign-design.md` -> superseded.
- `docs/superpowers/plans/2026-09-15-cetc-portal-redesign.md` -> superseded.

Re-review gates after: new features, new pages, or each semester rollout.
