> **SUPERSEDED 2026-09-18.** The design direction in this file is replaced by
> `design-system/cetc-lsc/MASTER.md` (v2, light/airy zinc). Do not implement from
> this file. Kept only for history.


# CETC Faculty Evaluation Portal — Design Specification
**Date:** 2026-09-15  
**Status:** Approved via Brainstorming & Grilling Interview  
**Aesthetic Direction:** Frosted Academic Glassmorphism + Tactile Soft-UI Hybrid (Dual Mode: Luminous Espresso Dark & Alabaster Parchment Light)

---

## 1. Executive Summary & Design Read

### 1.1 Context & Audience
The CETC Faculty Evaluation Portal serves **Cotabato State University (College of Engineering and Technology)**. It orchestrates faculty performance appraisals across four distinct roles:
1. **Students:** Completing multi-question teacher evaluations with 1–5 ratings, qualitative comments (with client-side sentiment analysis), and e-signatures.
2. **Faculty:** Inspecting personal performance distributions, question-by-question averages, sentiment analysis, and anonymous feedback.
3. **Deans:** Analyzing departmental participation rates, comparative faculty rankings, historical trends across academic terms, and generating accreditation reports.
4. **Admins:** Managing programs, sections, faculty assignments, evaluation cycles, and student enrollments.

### 1.2 Design Read
> *"An academic command and evaluation system for an engineering college that synthesizes institutional credibility with tactile modern delight: frosted glass atmospheric containers housing high-contrast, tactile scoring controls for students, and high-density bento analytics for administrators."*

### 1.3 The 3 Calibrated Dials
* **`DESIGN_VARIANCE` (7/10):** Asymmetrical role-specific layouts. High-density data grids for administrative analytics balanced by clean, focused, category-grouped survey flows for students.
* **`MOTION_INTENSITY` (5/10):** Physics-driven micro-interactions (tactile button press springs, snappy toggle flips) paired with coordinated slide-overs and staggered KPI entrances. Zero non-functional decorative floating animation.
* **`VISUAL_DENSITY` (8/10 for Analytics / 5/10 for Student Surveys):** Tight padding and tabular figures in analytics views; comfortable hit areas (≥44px) and breathable spacing in survey questionnaires.

---

## 2. Design System Tokens & Dual-Mode Architecture

The portal features a **Dual-Mode System** supporting **Luminous Espresso Dark** (default institutional dark mode) and **Alabaster Parchment Light** (clean, daylight academic print aesthetic).

### 2.1 Color Tokens

| Token | Espresso Dark (Default) | Alabaster Light | Purpose |
|---|---|---|---|
| `--color-canvas` | `#120E0B` (Deep Espresso) | `#F8F6F1` (Warm Alabaster) | Root application background |
| `--color-canvas-subtle` | `#18130F` | `#F0ECE3` | Secondary wells, input backgrounds |
| `--color-glass-surface` | `rgba(38, 26, 18, 0.65)` | `rgba(255, 255, 255, 0.75)` | Translucent frosted glass containers |
| `--color-glass-border` | `rgba(245, 240, 232, 0.08)` | `rgba(45, 31, 23, 0.08)` | Hairline rim on glass panels |
| `--color-panel` | `#221710` (Solid Panel) | `#FFFFFF` (Pure White Card) | Solid high-contrast content cards |
| `--color-panel-elevated`| `#2C1E15` | `#FAF8F5` | Hovered rows, nested card wells |
| `--color-text-primary` | `#F7F2EB` (Warm Cream) | `#251811` (Deep Walnut Ink) | Headings, primary content (≥11:1) |
| `--color-text-dim` | `#D1C7BA` | `#5C4A3E` | Body text, table data (≥7:1) |
| `--color-text-muted` | `#9E9182` | `#827063` | Secondary labels, timestamps (≥4.5:1) |
| `--color-text-faint` | `#706456` | `#A69689` | Subtle icons, placeholders |
| `--color-brand` | `#D86A12` (Molten Amber) | `#C25E0F` (Terracotta Ink) | Primary action fills, active highlights |
| `--color-brand-glow` | `rgba(216, 106, 18, 0.25)` | `rgba(194, 94, 15, 0.15)` | Focus rings, active button aura |
| `--color-gold` | `#B58A3C` (Imperial Gold) | `#9E7528` (Antique Gold) | High ratings, star accents, awards |
| `--color-positive` | `#6FA86F` (Muted Sage) | `#2E7D32` (Forest Green) | Positive sentiment, completion badges |
| `--color-negative` | `#C9615A` (Terra Crimson) | `#C62828` (Crimson) | Negative sentiment, critical alerts |
| `--color-border-subtle` | `rgba(245, 240, 232, 0.08)` | `rgba(45, 31, 23, 0.09)` | Standard divider borders |

### 2.2 Glassmorphism & Elevation System
* **Selective Glass Shell:**
  * RailNav, page top navigation, modal dialogs, and floating progress bars use:
    ```css
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    background: var(--color-glass-surface);
    border: 1px solid var(--color-glass-border);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
    ```
  * Content cards and data tables remain **solid panels** (`--color-panel`) with hairline borders to guarantee 60fps on mobile and 100% text contrast.
* **Concentric Radii:**
  * Containers follow the optical nested formula: $R_{\text{outer}} = R_{\text{inner}} + \text{padding}$.
  * Outer card: `rounded-2xl` (16px) with `p-4` (16px) $\rightarrow$ Inner pills/inputs: `rounded-lg` (8px).

---

## 3. Typography Hierarchy

Pairing: **Manrope** (Display & Numeric Authority) + **Plus Jakarta Sans** (Body & UI Clarity).

| Level | Font Family | Size / Line-Height | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| **Display 1** | Manrope | 28px / 1.15 | 800 (ExtraBold) | -0.02em | Main page titles, primary KPI numbers |
| **Section Title** | Manrope | 18px / 1.3 | 700 (Bold) | -0.01em | Card headers, modal titles, category labels |
| **Stat Value** | Manrope | 22px / 1.1 | 800 (ExtraBold) | Tabular figures | KPI cards, rating averages (e.g. `4.82`) |
| **Body Primary** | Plus Jakarta Sans | 14px / 1.5 | 500 (Medium) | 0.00em | Question prompts, table row cells, inputs |
| **Body Secondary** | Plus Jakarta Sans | 13px / 1.4 | 400 (Regular) | 0.00em | Descriptions, subtext, helper notes |
| **Micro / Label** | Plus Jakarta Sans | 11px / 1.3 | 600 (SemiBold) | +0.05em | Uppercase chips, table headers (`TH`), status badges |

---

## 4. Component Architecture & User Flows

### 4.1 Global Navigation (`RailNav`)
* **Layout:** Desktop vertical rail (`w-60` expanded or compact) / Mobile responsive glass bottom bar.
* **Glass Surface:** Frosted glass background with subtle 1px border.
* **Profile Pill:** Contains user avatar initials, user name, role chip (`STUDENT`, `FACULTY`, `DEAN`, `ADMIN`), and an integrated **Theme Switcher** (Sun/Moon icon toggle) for instant Dark/Light transitions.
* **Role Scoping:** Strictly renders only routes authorized by Supabase RLS policies for that specific role.

### 4.2 Student Evaluation Questionnaire (`EvalForm`)
Combines Direction D's **tactile kinetic interaction** with a structured **category-grouped workflow**:

1. **Sticky Frosted Progress Capsule:**
   * Pinned at the top or bottom of the viewport during evaluation.
   * Features a dynamic counter: `14 / 20 Questions Rated`.
   * Liquid amber progress bar fills smoothly with a spring transition as questions are rated.
   * Quick status badge: indicates draft save status ("Auto-saved 2m ago").

2. **Category-Grouped Question Containers:**
   * Questions grouped by evaluation criteria (e.g., *I. Commitment to Teaching*, *II. Knowledge of Subject Matter*, *III. Independent Learning Support*).
   * Clean section headers with completion pill indicators (`5/5 Completed` with positive checkmark).

3. **Tactile Segmented Numeric Rating Pills (1 to 5):**
   * Replaces traditional star icons with a molded 3D segmented horizontal pill strip.
   * **Physical Depth:** Inset dark well (`bg-black/25`) housing 5 tactile numeric buttons (`1`, `2`, `3`, `4`, `5`).
   * **Verbal Anchors:** Micro-labels displayed at the ends (`1: Poor`, `5: Outstanding`).
   * **Tactile Feedback:** 
     * Default: subtly raised surface with 1px border.
     * Hover: `-1px` Y-lift with warm glow.
     * Active/Pressed: `translate-y-[1px]` sinking into the well, active background switches to glowing molten amber (`#D86A12`), text becomes high-contrast dark espresso.
   * **Keyboard Accessible:** Supports Tab focusing and Arrow/Number key (1–5) direct selection.

4. **E-Signature Canvas & Anonymous Toggle:**
   * Framed inside a beveled tablet-like canvas well with clear/undo actions.
   * Tactile toggle switch for submitting anonymously ("Your name remains hidden from faculty").

### 4.3 Dean & Faculty Analytics Views
Optimized for high-density analysis and rapid decision-making:

1. **Asymmetrical Bento KPI Grid:**
   * 4-card responsive bento layout:
     * Card 1 (Wide): Overall College Average Rating (`4.68 / 5.00`) with distribution sparkline.
     * Card 2: Student Participation Rate (`84.2%`) with target threshold marker.
     * Card 3: Sentiment Breakdown (Donut chart: Positive / Neutral / Negative).
     * Card 4: Action Required (Pending evaluations, unreviewed classes).
   * Cards feature frosted glass surfaces with subtle directional ambient backlighting.

2. **Faculty Appraisal Roster (`DeanFacultyTable`):**
   * Clean, sortable data table with sticky glass header.
   * Columns: Faculty Name & Department, Classes Taught, Evaluations Received, Overall Score, Sentiment Mini-Bar, Actions.
   * Hovering a row produces a subtle highlight and chevron cue.

3. **Slide-Over Glass Inspector Drawer (`FacultyInspectorDrawer`):**
   * Clicking any faculty member smoothly animates a 440px wide frosted glass drawer from the right screen edge.
   * The Dean inspects:
     * Faculty profile & total evaluation count.
     * Per-criterion score breakdown (horizontal bar charts).
     * Sentiment analysis distribution.
     * Real-time stream of anonymous student feedback comments with sentiment tags.
     * One-click "Export Dossier PDF" button.
   * No page reload; preserves table filter, search, and scroll state.

---

## 5. Motion Physics & Technical Ergonomics

### 5.1 Hybrid Motion Architecture
* **Micro-interactions (CSS Spring Ease):**
  * Buttons, rating pills, theme toggle, and card hover states use optimized hardware-accelerated transforms:
    ```css
    transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), 
                box-shadow 180ms ease-out, 
                background-color 150ms ease-out;
    ```
  * Active states: `active:scale-[0.98]` and `active:translate-y-[1px]`.
* **Structural Transitions (`motion` library):**
  * Bento KPI cards: Staggered entrance animation ($y: 12\text{px} \rightarrow 0\text{px}$, opacity $0 \rightarrow 1$, stagger $40\text{ms}$).
  * Inspector Drawer: Physics spring slide ($x: 100\% \rightarrow 0\%$, stiffness 300, damping 30).
* **Accessibility (`prefers-reduced-motion: reduce`):**
  * Full suppression of all spring physics and translation offsets. Instant opacity/layout rendering.

---

## 6. Verification & Accessibility Requirements

1. **Contrast Compliance (WCAG 2.1 AA):**
   * All primary body text on both dark espresso and light alabaster surfaces must meet $\ge 7:1$.
   * Secondary and placeholder labels must meet $\ge 4.5:1$.
   * Interactive borders and rating indicators must meet $\ge 3:1$ against adjacent backgrounds.
2. **Mobile Usability:**
   * Single-column collapse on screens $< 768\text{px}$.
   * All clickable rating pills and navigation icons have minimum touch targets of $44 \times 44\text{px}$.
3. **Zero FOUC (Flash of Unstyled Content):**
   * Theme mode script executes synchronously in `<head>` to prevent blinding light/dark flashes during SSR hydration.
