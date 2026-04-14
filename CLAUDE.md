# CLAUDE.md — Iron & Light Johnson Academy Homeschool Tools

## What this repo is
A monorepo housing all digital tools for Iron & Light Johnson Academy.
This is a growing toolset — new tools will be added over time.
Every tool shares the same branding, design system, and Firebase project.

## The Johnson Family
- Rob (dad, homeschool teacher, MDiv student)
- Ashley (mom)
- Students: Orion and Malachi

## Repo structure
/
├── CLAUDE.md                  ← you are here, update after every session
├── HANDOFF.md                 ← overwrite at end of every session
├── scratch.js                 ← never committed, complex logic sandbox
├── netlify.toml               ← global Netlify config
├── packages/
│   ├── shared/                ← design system, Firebase init, auth, components
│   ├── dashboard/             ← central home screen, PWA entry point
│   ├── planner/               ← weekly lesson planner
│   ├── te-extractor/          ← vanilla HTML/CSS/JS tool, no React, served from dist/te-extractor/
│   └── reward-tracker/        ← point reward system for Orion and Malachi

---

## Stack (all tools)
- React + Vite
- Firebase Auth — Google sign-in, single family account, shared across tools
- Firebase Firestore — each tool uses its own collection namespace
- Netlify — single site, all tools deployed together, auto-deploy on push to main
- vite-plugin-pwa — dashboard is the installable PWA entry point
- @dnd-kit/core — drag-and-drop only, never hand-roll it

## Locked dependencies — do not upgrade or swap without asking Rob
- firebase (version pinned in package.json)
- @dnd-kit/core (version pinned in package.json)
- vite-plugin-pwa (version pinned in package.json)
- react + react-dom (version pinned in package.json)
All package.json entries use exact versions — no ^ or ~ prefixes.

---

## Deployment
- Host: Netlify, connected to GitHub repo
- Dashboard at root /
- Tools at /planner, /reward-tracker, etc.
- netlify.toml handles all SPA redirects per tool
- NOT GitHub Pages

## netlify.toml
[build]
  base = "packages/dashboard"
  command = "npm install && npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/planner/*"
  to = "/planner/index.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

Order is required: /api/* and /planner/* must precede /* or the
dashboard catch-all swallows them. Never reorder these blocks.
base = "packages/dashboard" tells Netlify where to run the build command.
command includes npm install so Netlify installs deps before building.

---

## Environment variables (Netlify dashboard only — never in code)
- ANTHROPIC_API_KEY — Netlify Functions only (parse-schedule), never client-side
- VITE_ANTHROPIC_API_KEY — TE Extractor only (intentional exception — see below)
- VITE_FIREBASE_API_KEY 
- VITE_FIREBASE_AUTH_DOMAIN 
- VITE_FIREBASE_PROJECT_ID 
- VITE_FIREBASE_APP_ID 

## Anthropic API pattern
All Anthropic calls go through Netlify Functions — with one intentional exception (see below).
Current functions:
- netlify/functions/parse-schedule.js (planner PDF import)
  Client calls: POST /api/parse-schedule with { file: base64, mediaType }
  Returns: application/json { student, weekId, days }
Function calls Anthropic API using server-side ANTHROPIC_API_KEY
Model: claude-sonnet-4-20250514

## TE Extractor — intentional exception to API key rule
The TE Extractor calls api.anthropic.com directly from the client
using VITE_ANTHROPIC_API_KEY injected at build time.
This is intentional — the tool is family-internal, behind Google Auth,
and will never be public facing. The Netlify Function proxy caused
gateway timeouts that could not be resolved within Netlify Pro limits.
Do not revert this to a Netlify Function without Rob's explicit instruction.

---

## Firestore data model
/users/{uid}/weeks/{weekId}/students/{studentName}/days/{0-4}/subjects/{subjectName}
  → { lesson: string, note: string, done: boolean, flag: boolean }

/users/{uid}/sickDays/{dateString}
  → { student: string, date: string, subjectsShifted: string[] }

/users/{uid}/settings/students
  → { names: string[] }

/users/{uid}/subjectPresets/{studentName}
  → { subjects: string[] }
  Note: stores per-student default subject presets shown in Settings sheet.
  Path uses subjectPresets (not settings/defaultSubjects) for valid 4-segment Firestore doc path.

weekId / dateString format: "YYYY-MM-DD" (weekId = Monday of that week)
Always normalize external weekId strings (e.g., from AI parse results) via mondayWeekId()
in constants/days.js before any Firestore writes. new Date('YYYY-MM-DD') parses as UTC
midnight — use new Date(y, m-1, d) (local date) inside mondayWeekId to avoid timezone shift.

Subjects are implicit — a subject exists on a given day only when its
document exists. No separate subject list document. Querying all subjects
for a day = simple collection read of .../days/{dayIndex}/subjects.

dayIndex: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri

sickDays collection: one document per calendar date that was marked sick.
Filtered client-side by current week dates — collection is small (~360 docs/year max).

## Orphaned Firestore data (do not migrate — manual cleanup only)
Old paths from before the per-day redesign are still present in Firestore
but are no longer read or written by the app:
  /users/{uid}/subjectLists/{studentName}  → { subjects: string[] }
  /users/{uid}/weeks/{weekId}/students/{studentName}/subjects/{subjectName}/days/{0-4}
These can be manually deleted from the Firebase console. No migration script needed.

---

## File structure — planner tool
packages/planner/src/
├── main.jsx                     # app entry, mounts App (~18 lines)
├── App.jsx                      # wiring only: auth + hooks → PlannerLayout (~67 lines)
├── planner.css                  # global resets for planner (~17 lines)
├── firebase/
│   ├── planner.js               # all Firestore reads/writes (~48 lines)
│   └── settings.js              # read/write for settings students + subject presets (~40 lines)
│   # NO init.js or auth.js here — import db/auth/useAuth from @homeschool/shared
├── hooks/
│   ├── useWeek.js               # week navigation state (~32 lines)
│   ├── useSubjects.js           # subject list + day data subscriptions (~53 lines)
│   ├── usePdfImport.js          # file upload + Netlify Function call (~48 lines)
│   ├── usePlannerUI.js          # all local UI state, keeps App.jsx thin (~21 lines)
│   ├── useDarkMode.js           # dark mode toggle (localStorage + html data-mode) (~22 lines)
│   └── useSettings.js           # students list + per-student subjects from Firestore (~62 lines)
├── components/
│   ├── PlannerLayout.jsx        # full page layout, all sheets, toggle handlers (~111 lines)
│   ├── PlannerLayout.css        # layout shell styles (~42 lines)
│   ├── Header.jsx               # 3-row 132px fixed header; students from Firestore (~75 lines)
│   ├── Header.css               # header styles (~123 lines)
│   ├── DayStrip.jsx             # sticky day tab selector (~21 lines)
│   ├── DayStrip.css             # day strip styles (~47 lines)
│   ├── SubjectCard.jsx          # lesson card with done/flag toggles (~46 lines)
│   ├── SubjectCard.css          # card styles (~88 lines)
│   ├── EditSheet.jsx            # bottom sheet: lesson/note editor (~67 lines)
│   ├── EditSheet.css            # edit sheet styles (~128 lines)
│   ├── UploadSheet.jsx          # PDF import: picker → spinner → result (~80 lines)
│   ├── UploadSheet.css          # upload sheet styles (~155 lines)
│   ├── AddSubjectSheet.jsx      # preset grid + custom input (~65 lines)
│   ├── AddSubjectSheet.css      # add sheet styles (~115 lines)
│   ├── MonthSheet.jsx           # calendar bottom sheet, week jump (~75 lines)
│   ├── MonthSheet.css           # month sheet styles (~60 lines)
│   ├── SickDaySheet.jsx         # sick day checklist, cascade shift confirmation (~66 lines)
│   ├── SickDaySheet.css         # sick day sheet styles (~172 lines)
│   ├── SettingsSheet.jsx        # settings bottom sheet — appearance, students, subjects, app (~170 lines)
│   └── SettingsSheet.css        # settings sheet styles (~320 lines)
└── constants/
    ├── subjects.js              # SUBJECT_PRESETS array (~19 lines)
    ├── days.js                  # DAY_NAMES, DAY_SHORT, date helpers (~46 lines)
    ├── months.js                # MONTH_NAMES, getCalendarGrid (~18 lines)
    ├── routes.js                # ROUTES object (~5 lines)
    └── firestore.js             # Firestore path builder functions (~18 lines)

## Planner-specific layout decisions
- Header is 3 rows: Row 1 (48px) = logo + brand + 4 icon buttons;
  Row 2 (~52px) = week navigation centered; Row 3 (32px) = student selector pills.
  Total: 132px.
- planner-body margin-top: 132px to clear the fixed header
- DayStrip is sticky at top: 132px, z-index: 50
- All bottom sheets use slide-up animation from translateY(100%)
- Each sheet has its own overlay class (not shared) to avoid CSS conflicts
- safe-area-inset-bottom applied to all sheets for iPhone home bar

## Desktop layout (≥768px) — all rules are additive media queries; mobile is UNCHANGED
- Header: collapses to 1 row (48px). Week nav is `position: absolute` over header-top row,
  centered. Student row hidden (students appear in DayStrip sidebar instead).
- DayStrip: becomes `position: fixed; left: 0; top: 48px; bottom: 0; width: 200px;`
  background var(--bg-surface), border-right. Shows student pills at top + horizontal day rows.
- planner-body: margin-top: 48px, margin-left: 200px, max-width: none.
- .planner-subjects: grid repeat(auto-fill, minmax(340px, 1fr)).
- .planner-action-bar: left: 200px, max-width: none.
- Desktop breakpoint: 768px. Never add desktop-only JSX — CSS media queries only.

## All Day Event — data model
- Stored as `allday` key in the existing per-day subjects collection.
  Path: /users/{uid}/weeks/{weekId}/students/{student}/days/{dayIndex}/subjects/allday
  Fields: { lesson: eventName, note: eventNote, done: false, flag: false }
- `hasAllDayEvent(subjects)` and `getAllDayEvent(subjects)` helpers in firebase/planner.js.
- `subjects` (Object.keys(dayData)) includes `allday` — always filter it from regular
  subject lists using `.filter(s => s !== 'allday')`.
- SubjectCard renders a full-width #22252e banner when subject === 'allday'.
- EditSheet hides Done/Flag toggles and shows 'All Day Event' title when subject === 'allday'.
- AddSubjectSheet shows '+ All Day Event' at top; if one exists, shows 'Edit All Day Event ›'.
- IMPORTANT: `__allday__` (double-underscore) is rejected by Firestore as a reserved ID.
  Key was renamed from `__allday__` to `allday` in v0.21.2.

---

## File size rules — enforce strictly
- Hard limit: 300 lines per file, no exceptions
- Target: under 200 lines per file
- One responsibility per file — if you need "and" to describe what
  a file does, split it
- Components never contain business logic — extract to hooks/
- Firebase calls never live in components — extract to firebase/
- If a file approaches 250 lines, stop and split before continuing
- Never combine multiple components in one file

---

## Constants rule
All string literals, Firestore path builders, day labels, and subject
lists live in constants/. Never hardcode these values in components
or hooks. If it's used in more than one place, it belongs in constants/.

---

## Complex logic rule
Any non-trivial logic gets prototyped in scratch.js first.
Test it in isolation before integrating into a component or hook.
scratch.js is never committed to the repo.

---

## Build order — always follow this
1. Read packages/shared before building anything — use what exists
2. Never duplicate branding, tokens, Firebase init, or auth
3. Firebase + Auth layer before any UI
4. Firestore read/write layer before components
5. Netlify Function for any Anthropic API call before import UI
6. PWA manifest + service worker before other config
7. Constants files before any component that needs them
8. Data model confirmed working before adding features
9. Stop and confirm with Rob before starting a new phase or new tool
10. When adding a new tool, add it to the dashboard first

---

## Session discipline
- Maximum 3 files changed per prompt — if more are needed, break into steps
- Always read the relevant file before editing it
- Never assume file contents — always read first
- Do not build and debug in the same prompt — keep them separate
- Never work on top of already-broken code — revert and restart clean
- New feature = commit the current working state first

## Handling complex features
- Prototype non-trivial logic in scratch.js before integrating
- Write a plain English description of what a function should do
  and what would break it before writing the code
- Never work out complex logic inside a component being built simultaneously

## End of every session — required
Before closing, do both of these:
1. Update CLAUDE.md with any decisions made this session not already documented
2. Overwrite HANDOFF.md with:
   - What was completed this session
   - What is currently broken or incomplete
   - What the next session should start with
   - Any decisions that still need to be added to CLAUDE.md

## Start of every session — required
1. Read CLAUDE.md in full
2. Read HANDOFF.md
3. Confirm with Rob: what are we building today?
4. Identify which files will be touched before writing any code

---
## Tools status
- shared         → ✅ Complete — tokens, fonts, Firebase init, auth hook
- dashboard      → ✅ Complete — deployed to Netlify, Google auth working, PWA ready
- planner        → ✅ Complete — merged to main, deployed to /planner
- te-extractor   → ✅ Complete — vanilla HTML/CSS/JS, deployed to /te-extractor
- reward-tracker → exists, needs migrating into monorepo structure

## Phase tracking — planner
Phase 1 — COMPLETE:
  ✓ 1. Firebase/Firestore layer (firebase/planner.js)
  ✓ 2. Netlify Function — parse-schedule (BJU Homeschool Hub "Print By Day" format)
  ✓ 3. Config files (package.json, vite.config.js, index.html)
  ✓ 4. Hooks (useWeek, useSubjects, usePdfImport, usePlannerUI)
  ✓ 5. App entry (main.jsx, App.jsx, planner.css)
  ✓ 6. PlannerLayout + Header + DayStrip
  ✓ 7. SubjectCard + EditSheet
  ✓ 8. AddSubjectSheet + UploadSheet
  ✓ 9. Deploy config (netlify.toml redirects, dashboard outDir)
  ✓ 10. Bug fix: addSubject no longer pre-populates future days
  ✓ 11. Data model redesign: per-day implicit subjects (3 batches, main)
  ✓ 12. Bug fix: PDF import uses parsedData.weekId/student (importCell + jumpToWeek)
  ✓ 13. Bug fix: subject card lesson clamped to 3 lines, note to 2 lines
  ✓ 14. Feature: Delete Week — clears all cells for current student+week
  ✓ 15. Feature: Month picker — calendar bottom sheet, tapping weekday jumps to week
  ✓ 16. Quick fixes: flag card red, note dot indicator, placeholder text, calendar emoji
  ✓ 17. Feature: Upload sheet — rich parse preview, wipe toggle, success state, debug log
  ✓ 18. Feature: Sick Day — cascade shift algorithm, Firestore markers, red dot on DayStrip
  ✓ 19. Fix: flag card lighter red tint + red flag badge (was gold)
  ✓ 20. Fix: upload preview grouped by day with bold day headers
  ✓ 21. Fix: debug log enhanced — file size, response time, raw preview, subjects, per-cell writes
  ✓ 22. Fix: sick day cascade within-week only; Friday overflow warning in SickDaySheet
  ✓ 23. Visual Polish Session 1 — Ink & Gold tokens, header redesign, DayStrip floating pill, logo wired
  ✓ 24. Visual Polish Session 2 — SubjectCard, all sheets, action bar, empty state, dashboard, month picker
  ✓ 25. Settings sheet — dark mode toggle, students list, default subjects, coming-soon sections, clear cache
  ✓ 26. v0.19.0 polish — PWA theme_color #22252e; School Year & Compliance merged coming-soon;
         student delete with inline confirmation; Header students from Firestore;
         AddSubjectSheet quick-picks from per-student Firestore presets
  ✓ 27. v0.21.0 — All Day Event (allday key); desktop responsive layout ≥768px
         (single-row header, 200px DayStrip sidebar, auto-fill card grid, action bar shift)
  ✓ 28. v0.21.1 — 11-fix polish pass: All Day Event banner no longer flashes on save;
         sidebar always #22252e dark; header logo 42px + larger fonts at desktop;
         card grid gap:14px; desktop day-title header with subject count;
         header icons right-aligned + emoji font; done-pill replaced with tap-to-edit hint;
         desktop action bar Import pushed right
  ✓ 29. v0.21.2 — Fix 1: renamed allday key (was __allday__, rejected by Firestore);
         Fix 2A: weekId normalized to Monday in handleApplySchedule (mondayWeekId helper);
         Fix 2B: one-time migration from two bad Tuesday weekIds (2026-04-07, 2026-04-14)
         to correct Monday weekIds without overwriting good data

Phase 2 (do not build yet):
  - Auto-roll flagged lessons to next week
  - Week history browser
  - Copy last week as template
  - Export week as PDF

## TE Extractor — architecture notes
- Vanilla HTML/CSS/JS — Vite build step added for VITE_ env var injection only
- Lives at packages/te-extractor/public/; Vite builds to ../../dist/te-extractor/
- vite.config.js at packages/te-extractor/vite.config.js (root: 'public', base: '/te-extractor/')
- Static assets (manifest.json, sw.js) copied by build script post-Vite
- Served at /te-extractor/ via netlify.toml redirect
- Calls api.anthropic.com directly using VITE_ANTHROPIC_API_KEY — see exception note above
- System prompt (SYSTEM_PROMPT const) lives in app.js — not in a Netlify Function
- System prompt output uses Ink & Gold colors (#22252e banners, #c9a84c accents, #e8c97a lesson numbers)
- Ink & Gold only applies to the extractor app UI chrome (sidebar, buttons, form)
- Logo at packages/te-extractor/public/logo.png (copy of shared/src/assets/logo.png)
- pdf-lib lazy-loaded from CDN for PDF splitter — do not remove or replace
- Source migrated from github.com/rjohnson5481-spec/Claude-Test (flat repo root)

## TE Extractor — Firebase CDN pattern
Firebase Auth + Firestore are loaded via CDN ES module imports in an inline
`<script type="module">` block in index.html (NOT npm packages or app.js imports).
Firebase config uses Vite's `%VITE_FIREBASE_*%` HTML replacement syntax (replaced at build time).
The inline script runs before app.js and exposes:
  window.__teAuth      — Firebase Auth instance
  window.__teDb        — Firestore instance
  window.__teUid       — authenticated user's uid (set after onAuthStateChanged fires)
  window.__teFirestore — { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp }
app.js listens for `document.dispatchEvent('te-auth-ready')` to know when uid is available.
If not signed in, the inline script redirects to / immediately.
Firestore path for extraction history: /users/{uid}/teExtractor/extractions/items/{docId}
Fields: { fileName, lessons, html, previewText (200 char), createdAt (serverTimestamp) }

---

## Key decisions — do not revisit without Rob's explicit instruction
- Monorepo, single Netlify site — not GitHub Pages
- Single Firebase project shared across all tools
- Google sign-in only — single family account
- Anthropic API key server-side only — never in client bundle (TE Extractor is the sole exception — family-internal tool, see architecture notes)
- Mobile-first, max-width 480px on all tools
- Lexend font only — no serif fonts in the UI
- Ink & Gold color system only — no new tokens
- No grade tracking in any tool
- @dnd-kit/core for drag-and-drop — never hand-roll
- Exact dependency versions — no ^ or ~ in package.json

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

**Layout**
- Fixed top header: 60px (dashboard), 80px (planner — 2-row), background: #22252e
- Fixed left sidebar: 68px, background: var(--bg-surface),
  border-right: 1px solid var(--border)
- Main: margin-top: 60px, margin-left: 68px, padding: 28px
- Optional utility bar 36px above header — push header top: 36px,
  main margin-top: 96px
- Mobile (max-width 480px): sidebar collapses to bottom nav,
  no left margin

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


  ## Branch strategy
Always work directly on main.
Never create feature branches.
After each confirmed working step, commit and push directly to main.
Netlify auto-deploys on every push to main.
Do not open pull requests. Do not create branches named claude/* or feature/*.

## Netlify build — final confirmed config
- No base directory
- Command: npm install && npm run build (runs from repo root)
- Publish: dist
- Root package.json runs --workspaces --if-present to build all packages
- Do not change this without Rob's explicit instruction
