# CLAUDE-DESIGN.md — Iron & Light Johnson Academy Design System

Read this file only for sessions that touch CSS or visual components. Do not read for logic-only sessions.

---

## Planner-specific layout decisions
- Header is 3 rows: Row 1 (48px) = logo + brand + 4 icon buttons;
  Row 2 (~52px) = week navigation centered; Row 3 (32px) = student selector pills.
  Total: 132px.
- planner-body margin-top: 132px to clear the fixed header
- DayStrip is sticky at top: 132px, z-index: 50
- All bottom sheets use slide-up animation from translateY(100%)
- Each sheet has its own overlay class (not shared) to avoid CSS conflicts
- safe-area-inset-bottom applied to all sheets for iPhone home bar

## Mobile layout — base styles
- Mobile-first. Content fills the full viewport width with 16px horizontal padding.
- No `max-width: 480px` anywhere — removed in v0.22.8. Bottom sheets also use `max-width: 100%`.
- `.planner-subjects` and `.rl-body` use a responsive grid
  `repeat(auto-fill, minmax(300px, 1fr))` so subject cards / student cards
  reflow to 2 columns on wide phones (Galaxy S25 Ultra landscape ~915px).
- Bottom nav height: 56px base (iPhone SE / small phones below 400px).
- Large phone scaling: `@media (min-width: 400px) and (max-width: 1023px)` — added in
  v0.22.9 to give wide phones (Galaxy S25 Ultra 412px, Pixel 8 Pro etc.) a
  native-app feel. Inside this band: bottom nav grows to 68px, nav icon 18→24px,
  nav label 9→12px; planner header grows to ~140px; all sheet text inputs are
  forced to 16px to suppress iOS Safari auto-zoom on focus. Desktop (≥1024px)
  is explicitly unaffected — the query is bounded at 1023px max.
- Three-tier responsive layout (small / medium / large phone with distinct
  typography scales) is deferred to Phase 4.

## Responsive breakpoints (canonical)
- `<400px` — small phone base (iPhone SE, iPhone 13 mini). Compact nav 56px, base font sizes.
- `400–1023px` — large phone (Galaxy S25 Ultra, Pixel 8 Pro, iPhone 15 Pro Max). Scaled-up fonts/spacing/nav, still mobile shell.
- `≥1024px` — desktop (iPad Pro landscape, laptop, desktop). 200px fixed sidebar, shell content offset.
- iPad portrait (~810px) currently falls into the large-phone band (mobile shell with bottom nav). Carry-over decision — see HANDOFF history.

---

## Desktop layout (≥1024px) — all rules are additive media queries; mobile is UNCHANGED
Desktop = shell sidebar at left + planner content column to the right.

- Planner Header: `display: none` at ≥1024px. Shell sidebar provides branding, nav, sign-out, and a Student selector when the Planner tab is active.
- Shell `<BottomNav>` flips to a 200px fixed left sidebar at ≥1024px (`#22252e`, gold active state, vertical tab list). Student selector renders only when `activeTab === 'planner'` and hides on all other tabs.
- `.shell-content { margin-left: 200px; padding-bottom: 0 }` at ≥1024px — clears the sidebar.
- Desktop week nav lives inside `.planner-body` as `.planner-week-nav-desktop` (JSX, not in Header) — sits above the DayStrip. Gold chevrons, ink label.
- `.day-strip` is `position: static` in the shell at ≥1024px — sticky behavior is dropped on desktop because the shell scrolls as a whole and a sticky strip would clip the day title scrolling beneath it. Mobile stays sticky at `top: 132px` for the fixed header.
- `.planner-body` on desktop: `margin-top: 0; max-width: none;` (mobile margin-left/right: auto centers inside shell content).
- `.planner-subjects`: grid `repeat(auto-fill, minmax(340px, 1fr))`, gap 14px.
- `.planner-action-bar` on desktop: `left: 200px; right: 0; bottom: 0; max-width: none; margin: 0` (set in App.css so the planner layer stays sidebar-unaware).
- Desktop-only day header (.planner-day-header) reveals day title + subject count. The inline "+ Add" is `display: none` on desktop (redundant with the bottom dashed "+ Add Subject").
- Desktop breakpoint: 1024px. Never add desktop-only JSX — CSS media queries only. (Raised from 768px in v0.22.7 — the 768px breakpoint was triggering the desktop sidebar on wide mobile phones like the Galaxy S25 Ultra.)

### Where desktop rules live (avoid re-creating conflicts)
- `App.css` @media → shell-aware concerns only: `.shell-content` offset, `.shell-content .day-strip` non-sticky, `.shell-content .planner-action-bar` alignment. Anything referencing the 200px sidebar or the `.shell-content` scope lives here.
- `PlannerLayout.css` @media → planner-only: `.planner-body` sizing, `.planner-main` padding, `.planner-subjects` grid, `.planner-day-header*`, `.planner-day-add-btn { display:none }`, `.planner-week-nav-desktop`, `.planner-week-nav-btn`, `.planner-action-btn*`.
- `Header.css` @media → single rule `.header { display: none }`.
- `DayStrip.css` → no @media. Mobile horizontal pill layout is correct at every width; shell-awareness is handled in App.css.
- `SubjectCard.css` → no @media. Card geometry is intrinsic; the grid in PlannerLayout drives multi-column at desktop.
- `BottomNav.css` @media → mobile-bottom-bar → desktop-left-sidebar transition, brand / student / footer sections.

---

### Dark mode token rule
Never hardcode colors that need to work in both light and dark. Always
use CSS variables (`var(--text-primary)`, `var(--text-secondary)`, `var(--bg-card)`, etc.).

Hardcoded literals are ONLY correct on brand chrome:
- Header / sidebar / bottom nav / sheet-header backgrounds are always `#22252e` regardless of mode — the brand anchor.
- Active-state gold accents (`#e8c97a`, `#c9a84c`) on the dark chrome stay the same in both modes.

Token choice (tricky spots):
- Card body text (subject names, lesson text, titles) → `var(--text-primary)` NOT `var(--ink)`. `--ink` is near-black in both modes (it re-tints toward card-chrome for ink backgrounds) and becomes unreadable on dark card backgrounds.
- Section headings, sheet labels, small-caps dividers → `var(--text-secondary)` NOT `var(--text-muted)`. `--text-muted` is too faint for small-caps headings in dark mode.

When a hardcoded color must only apply in one mode, scope with `[data-mode="dark"]` rules.

---

## Design System — Ink & Gold
### All tokens and components live in packages/shared
### Never redefine in individual tools

**Font**
Single font family: Lexend (Google Fonts)
Weights: 300, 400, 500, 600, 700
Stack: 'Lexend', system-ui, sans-serif — applied to ALL elements globally
Form elements override explicit: input, textarea, button, select all inherit Lexend.
Body base: 14px. No serif fonts anywhere in the UI.

**Logo**
File: packages/shared/src/assets/logo.png
Import: import logo from '@homeschool/shared/assets/logo.png'
Both Header components render: <img src={logo} alt="ILA" className="header-logo" />

**Color tokens — Light mode (default)**
--bg-base:       #f2f0ed
--bg-surface:    #ebe8e3
--bg-card:       #ffffff
--bg-card-hover: #faf8f5
--border:        #eae6e0
--border-light:  #f0ece6
--ink:           #22252e
--ink-light:     #3a3d48
--gold:          #c9a84c
--gold-light:    #e8c97a
--gold-pale:     rgba(201,168,76,0.10)
--red:           #c0392b
--red-lt:        #fdf0ed
--text-primary:  #2a2520
--text-secondary:#5a5248
--text-muted:    #a8a09a

**Color tokens — Dark mode**
--bg-base:       #1c1e24
--bg-surface:    #22252e
--bg-card:       #2a2d35
--bg-card-hover: #32353f
--border:        #363944
--border-light:  #3a3d48
--ink:           #3a3d48
--ink-light:     #4a4e5a
--gold:          #c9a84c
--gold-light:    #e8c97a
--gold-pale:     rgba(201,168,76,0.12)
--red:           #e05252
--red-lt:        rgba(224,82,82,0.10)
--text-primary:  #e8e8e8
--text-secondary:#a0a8b8
--text-muted:    #5a6070

Dark mode: toggle data-mode="light" / data-mode="dark" on <html>
All tokens scoped to [data-mode] selectors
All color transitions: transition: 0.3s

No backward-compat aliases — all components now use Ink & Gold tokens directly.

**Layout (current, v0.22+)**
- Mobile: planner header is a 132px fixed 3-row stack (`#22252e`). Shell has `<BottomNav>` as a 56px fixed bottom bar.
- Desktop (≥1024px): planner header is `display: none` — the shell's 200px fixed left sidebar owns branding + nav + sign-out + Student selector. Content column has `margin-left: 200px`. Planner's own week nav sits above the DayStrip inside `.planner-body`.
- All chrome backgrounds are `#22252e` (hardcoded) — never changes between light/dark.

**Header**
- Background: #22252e — hardcoded literal in both Header.css files, NOT a CSS var
- Planner: 3 rows — Row 1 (48px) logo + brand + 4 icon buttons; Row 2 (~52px) week nav centered; Row 3 (32px) student pills. Total: 132px.
- Dashboard: single row, 60px, logo + school name + 2 icon buttons
- Logo: 34–38px square, border-radius: 8px — uses logo.png (see Logo section above)
- School name structure:
    Line 1: "IRON & LIGHT" — LIGHT wrapped in .header-school-accent (color: #e8c97a)
    Line 2: "JOHNSON ACADEMY"
    Tagline: "Faith · Knowledge · Strength" (rgba(255,255,255,0.35))
- Icon buttons: 32×32px, background: rgba(255,255,255,0.08), border: rgba(255,255,255,0.13)
- Active student tab: color: #e8c97a (gold)
- Student row border-top: 1px solid rgba(255,255,255,0.07)

**DayStrip**
- Floating pill container: background var(--bg-card), border-radius: 12px,
  padding: 5px, margin: 0 14px 14px
- Active day: background #22252e (dark pill), white text
- Today: date number in var(--gold), 2px solid underline in var(--gold)
- Today + active: date in var(--gold-light) for contrast on dark pill
- Sick day: red dot via CSS ::after centered below date number (not top-right corner)

**Sidebar nav items**
- 44x44px, border-radius: 10px
- Default: color: var(--text-muted), no background
- Hover: background: var(--bg-card)
- Active: background: var(--gold-pale), color: var(--gold),
  box-shadow: inset 0 0 0 1px rgba(201,168,76,0.2)

**Cards**
- background: var(--bg-card), border: 1px solid var(--border),
  border-radius: 12px, padding: 22px
- shadow light: 0 1px 4px rgba(0,0,0,0.06)
- shadow dark: 0 1px 6px rgba(0,0,0,0.25)
- Title: 12px, font-weight: 600, letter-spacing: 0.08em,
  text-transform: uppercase, color: var(--text-secondary)
- Hover: border-color: var(--gold-light),
  box-shadow: 0 4px 16px rgba(201,168,76,0.12),
  transform: translateY(-2px)

**Buttons**
- Primary: background: var(--gold), color: #fff,
  border-radius: 8px, padding: 7px 16px, 13px, font-weight: 600
  hover: var(--gold-light)
- Ghost: transparent, border: 1px solid var(--border),
  color: var(--text-secondary)
  hover: border var(--gold), color var(--gold)
- Text link: color: var(--gold-light), no border/background

**Progress bars**
- Track: 4px, background: var(--border), border-radius: 2px
- Fill: linear-gradient(90deg, var(--gold), var(--gold-light))
- Thumb: 12x12px, background: var(--gold-light),
  border: 2px solid var(--bg-base),
  box-shadow: 0 0 0 2px var(--gold-light)

**Lesson rows**
- padding: 10px 14px, border-radius: 8px
- hover: background: var(--bg-card-hover)
- Color dot: 8x8px circle left of content
- Sub-label: italic, 11px, color: var(--text-muted)
- Date: right-aligned, 11px, color: var(--text-muted)

**Section dividers**
- 11px, font-weight: 600, letter-spacing: 0.1em,
  text-transform: uppercase, color: var(--text-muted)
- ::after flex line: height: 1px, background: var(--border), flex: 1

**General vibe — non-negotiable**
- Warm charcoal + gold. Header is always #22252e — the strongest brand anchor.
- Content area is warm cream/white in light, dark charcoal in dark. Never gray-blue.
- Lexend 300-400 body, 500-600 emphasis
- Gold (#c9a84c) is the primary accent — active states, highlights, CTAs
- Borders always warm-toned, never neutral gray
- Spacing generous: 28px page padding, 20px between cards,
  22px internal card padding
