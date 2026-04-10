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
  command = "npm run build"
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

---

## Environment variables (Netlify dashboard only — never in code)
- ANTHROPIC_API_KEY — Netlify Functions only, never client-side
- VITE_FIREBASE_API_KEY 
- VITE_FIREBASE_AUTH_DOMAIN 
- VITE_FIREBASE_PROJECT_ID 
- VITE_FIREBASE_APP_ID 

## Anthropic API pattern
Client NEVER calls api.anthropic.com directly.
All Anthropic calls go through Netlify Functions.
Current functions:
- netlify/functions/parse-schedule.js (planner PDF import)
Client calls: POST /api/parse-schedule with { file: base64, mediaType }
Function calls Anthropic API using server-side ANTHROPIC_API_KEY
Model: claude-sonnet-4-20250514

---

## Firestore data model
/users/{uid}/weeks/{weekId}/students/{studentName}/subjects/{subjectName}/days/{0-4}
  → { lesson: string, note: string, done: boolean, flag: boolean }

/users/{uid}/subjectLists/{studentName}
  → { subjects: string[] }

weekId format: "2026-08-17" (Monday of that week)

---

## File structure — planner tool
packages/planner/src/
├── main.jsx                     # app entry, mounts App (~18 lines)
├── App.jsx                      # wiring only: auth + hooks → PlannerLayout (~47 lines)
├── planner.css                  # global resets for planner (~17 lines)
├── firebase/
│   └── planner.js               # all Firestore reads/writes (~48 lines)
│   # NO init.js or auth.js here — import db/auth/useAuth from @homeschool/shared
├── hooks/
│   ├── useWeek.js               # week navigation state (~32 lines)
│   ├── useSubjects.js           # subject list + day data subscriptions (~53 lines)
│   ├── usePdfImport.js          # file upload + Netlify Function call (~48 lines)
│   └── usePlannerUI.js          # all local UI state, keeps App.jsx thin (~21 lines)
├── components/
│   ├── PlannerLayout.jsx        # full page layout, all sheets, toggle handlers (~111 lines)
│   ├── PlannerLayout.css        # layout shell styles (~42 lines)
│   ├── Header.jsx               # 2-row 80px fixed header (~52 lines)
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
│   └── AddSubjectSheet.css      # add sheet styles (~115 lines)
└── constants/
    ├── subjects.js              # SUBJECT_PRESETS array (~19 lines)
    ├── days.js                  # DAY_NAMES, DAY_SHORT, date helpers (~46 lines)
    ├── routes.js                # ROUTES object (~5 lines)
    └── firestore.js             # Firestore path builder functions (~18 lines)

## Planner-specific layout decisions
- Header is 2 rows: Row 1 (48px) = logo + week nav + actions;
  Row 2 (32px) = student selector pills. Total: 80px.
- planner-body margin-top: 80px to clear the fixed header
- DayStrip is sticky at top: 80px, z-index: 50
- All bottom sheets use slide-up animation from translateY(100%)
- Each sheet has its own overlay class (not shared) to avoid CSS conflicts
- safe-area-inset-bottom applied to all sheets for iPhone home bar

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
- shared      → ✅ Complete — tokens, fonts, Firebase init, auth hook
- dashboard   → ✅ Complete — deployed to Netlify, Google auth working, PWA ready
- planner     → complete and merged to main
- reward-tracker → exists, needs migrating into monorepo structure
## Phase tracking — planner
Phase 1 — COMPLETE (all code on branch claude/read-claude-docs-er59m):
  ✓ 1. Firebase/Firestore layer (firebase/planner.js)
  ✓ 2. Netlify Function — parse-schedule
  ✓ 3. Config files (package.json, vite.config.js, index.html)
  ✓ 4. Hooks (useWeek, useSubjects, usePdfImport, usePlannerUI)
  ✓ 5. App entry (main.jsx, App.jsx, planner.css)
  ✓ 6. PlannerLayout + Header + DayStrip
  ✓ 7. SubjectCard + EditSheet
  ✓ 8. AddSubjectSheet + UploadSheet
  ✓ 9. Deploy config (netlify.toml redirects, dashboard outDir)
  — Swap Days: not built (confirm with Rob before starting)

Phase 2 (do not build yet):
  - Auto-roll flagged lessons to next week
  - Week history browser
  - Copy last week as template
  - Export week as PDF

---

## Key decisions — do not revisit without Rob's explicit instruction
- Monorepo, single Netlify site — not GitHub Pages
- Single Firebase project shared across all tools
- Google sign-in only — single family account
- Anthropic API key server-side only — never in client bundle
- Mobile-first, max-width 480px on all tools
- Lexend font only — no serif fonts in the UI
- Parchment & Forest color system only — no new tokens
- No grade tracking in any tool
- @dnd-kit/core for drag-and-drop — never hand-roll
- Exact dependency versions — no ^ or ~ in package.json

---

## Design System — Parchment & Forest
### All tokens and components live in packages/shared
### Never redefine in individual tools

**Font**
Single font family: Lexend (Google Fonts)
Weights: 300, 400, 500, 600, 700
Stack: 'Lexend', system-ui, sans-serif — applied to ALL elements globally
No serif fonts anywhere in the UI.

**Color tokens — Light mode (default)**
--bg-base:       #f5f0e8
--bg-surface:    #ece6d8
--bg-card:       #faf7f2
--bg-card-hover: #f0ebe0
--border:        #d6cdb8
--border-light:  #e8e0cc
--forest:        #2d5a3d
--forest-light:  #3d7a52
--forest-pale:   rgba(45,90,61,0.08)
--gold:          #8a6a20
--gold-light:    #b8922a
--red:           #c0392b
--text-primary:  #2a2418
--text-secondary:#5a4e38
--text-muted:    #8a7a60

**Color tokens — Dark mode**
--bg-base:       #1a2018
--bg-surface:    #202820
--bg-card:       #263024
--bg-card-hover: #2e3a2c
--border:        #3a4838
--border-light:  #445442
--forest:        #3a7a50
--forest-light:  #4e9e68
--forest-pale:   rgba(78,158,104,0.12)
--gold:          #c9a84c
--gold-light:    #e8c97a
--red:           #e05252
--text-primary:  #e8f0e4
--text-secondary:#a0b89a
--text-muted:    #607860

Dark mode: toggle data-mode="light" / data-mode="dark" on <html>
All tokens scoped to [data-mode] selectors
All color transitions: transition: 0.3s

**Layout**
- Fixed top header: 60px, background: var(--forest)
- Fixed left sidebar: 68px, background: var(--bg-surface),
  border-right: 1px solid var(--border)
- Main: margin-top: 60px, margin-left: 68px, padding: 28px
- Optional utility bar 36px above header — push header top: 36px,
  main margin-top: 96px
- Mobile (max-width 480px): sidebar collapses to bottom nav,
  no left margin

**Header**
- Background: var(--forest)
- Logo: 38x38px, border-radius: 8px, gold gradient #c9a84c → #e8c97a,
  dark green text #1a3020, font-weight: 700
- School name: 13px, font-weight: 600, letter-spacing: 0.07em,
  text-transform: uppercase, color: rgba(255,255,255,0.8),
  accent word in #e8c97a
- Tagline: italic, 11px, color: rgba(255,255,255,0.4)
- Date: 12px, color: rgba(255,255,255,0.4)
- Right controls: background: rgba(255,255,255,0.1),
  border: 1px solid rgba(255,255,255,0.15), border-radius: 8px

**Sidebar nav items**
- 44x44px, border-radius: 10px
- Default: color: var(--text-muted), no background
- Hover: background: var(--bg-card)
- Active: background: var(--forest-pale), color: var(--forest),
  box-shadow: inset 0 0 0 1px rgba(45,90,61,0.2)

**Cards**
- background: var(--bg-card), border: 1px solid var(--border),
  border-radius: 12px, padding: 22px
- shadow light: 0 1px 4px rgba(0,0,0,0.06)
- shadow dark: 0 1px 6px rgba(0,0,0,0.25)
- Title: 12px, font-weight: 600, letter-spacing: 0.08em,
  text-transform: uppercase, color: var(--text-secondary)
- Hover: border-color: var(--forest-light),
  box-shadow: 0 4px 16px rgba(45,90,61,0.12),
  transform: translateY(-2px)

**Buttons**
- Primary: background: var(--forest), color: #fff,
  border-radius: 8px, padding: 7px 16px, 13px, font-weight: 600
  hover: var(--forest-light)
- Ghost: transparent, border: 1px solid var(--border),
  color: var(--text-secondary)
  hover: border var(--forest), color var(--forest)
- Text link: color: var(--forest-light), no border/background

**Progress bars**
- Track: 4px, background: var(--border), border-radius: 2px
- Fill: linear-gradient(90deg, var(--forest), var(--forest-light))
- Fill gold: linear-gradient(90deg, #b8922a, #d4aa3a)
- Thumb: 12x12px, background: var(--forest-light),
  border: 2px solid var(--bg-base),
  box-shadow: 0 0 0 2px var(--forest-light)

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
- Warm, never cold. Neutrals lean cream/tan in light, forest in dark.
  Never gray-blue anywhere.
- Lexend 300-400 body, 500-600 emphasis
- Forest green header is the strongest brand anchor — always consistent
- Borders always warm-toned, never neutral gray
- Spacing generous: 28px page padding, 20px between cards,
  22px internal card padding
