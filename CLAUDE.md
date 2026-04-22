# CLAUDE.md — Johnson Web Tools
Current version: v1.0.2

## What this repo is
A monorepo housing all digital tools for Iron & Light Johnson Academy.
Seeded from Home-School-Planner and stripped down to two PWAs.
Every tool shares the same Ink & Gold branding, Lexend typography, and
single Firebase project.

## The Johnson Family
- Rob (dad, homeschool teacher, MDiv student)
- Ashley (mom)
- Students: Orion and Malachi

## Repo structure
/
├── CLAUDE.md                  ← you are here, update after every session
├── HANDOFF.md                 ← overwrite at end of every session
├── netlify.toml               ← rewards is the default build
├── firestore.rules
├── package.json               ← workspaces: shared, rewards, tools
└── packages/
    ├── shared/                ← Ink & Gold tokens, Lexend font, Firebase init, auth, useDarkMode, logo.png
    ├── rewards/               ← Rewards tracker PWA — "Rewards App" — rewards.grasphislove.com
    │   └── src/
    │       ├── App.jsx                ← auth gate, student-list subscription, gear icon
    │       ├── components/SignIn.jsx
    │       ├── components/SettingsScreen.jsx  ← student add/remove + sign-out
    │       ├── firebase/settings.js           ← writes /users/{uid}/settings/students
    │       └── tools/reward-tracker/          ← do not touch without Rob's approval
    └── tools/                 ← TE Extractor PWA — "Tools App" — tools.grasphislove.com

Root `package.json` workspaces: ["packages/shared", "packages/rewards", "packages/tools"].

### Rewards navigation
- The app opens straight to the reward dashboard (or an empty-state
  placeholder if no students exist).
- A gear icon ⚙️ is fixed at the top-right of every rewards screen.
  Tapping it opens the Settings screen; the back arrow there returns
  to the dashboard. No tab bar, no bottom nav.

---

## Stack
- React 18 + Vite 5 (rewards package)
- Vanilla HTML/CSS/JS (tools package — TE Extractor)
- Firebase Auth — Google sign-in, single family account, shared across packages
- Firebase Firestore
- vite-plugin-pwa — both PWAs are installable
- Netlify — one site per package (set up by Rob manually)

## Locked dependencies — do not upgrade or swap without asking Rob
- firebase, react, react-dom, vite, vite-plugin-pwa
All package.json entries use exact versions — no ^ or ~ prefixes.

---

## Deployment
- Host: Netlify — two sites, one per package
- Rewards URL: `rewards.grasphislove.com` — publishes `packages/rewards/dist`
- Tools URL: `tools.grasphislove.com` — publishes `packages/tools/dist`
- Root `netlify.toml` is configured for the rewards site. The tools site will
  get its own config once Rob creates the separate Netlify site.

## Firebase project
- Project ID: **johnson-web-tools** (NOT `homeschool-tools-ff73c` — that is
  the retired Home-School-Planner project)
- Single family account, Google sign-in only
- Rewards and Tools share the same Firebase project and auth state

## Environment variables (Netlify dashboard only — never in code)
Both sites need the same set:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_STORAGE_BUCKET

Tools additionally needs:
- VITE_ANTHROPIC_API_KEY — TE Extractor calls api.anthropic.com directly
  from the browser (intentional exception — Netlify Function proxy caused
  60s gateway timeouts)

---

## Firestore data model

### Rewards
/users/{uid}/rewardTracker/{studentName}
  → { points: number }
  CRITICAL: path is `rewardTracker/{studentName}` — NO 'students/' segment.
  Never add one.

/users/{uid}/rewardTracker/{studentName}/log/{docId}
  → { type: 'award'|'deduct'|'spend', points: number, note: string, createdAt: serverTimestamp }

/users/{uid}/settings/students
  → { names: string[] }

Cash value: 15 pts = $1.00 (floor division).

### TE Extractor
/users/{uid}/teExtractor/extractions/items/{docId}
  → { fileName, lessons, html, previewText, createdAt }

### Firestore Security Rules
match /users/{userId}/{document=**} { allow read, write: if request.auth.uid == userId; }

---

## Design system — Ink & Gold
- Font: **Lexend only** (loaded via Google Fonts)
- Accent: **gold #c9a84c only** (and #e8c97a highlight)
- Header background: always **#22252e** hardcoded
- PWA background_color: `#1c1e24`
- Color tokens live in `packages/shared/src/styles/tokens.css` — never duplicate
- Do not invent new colors without Rob's approval

### Responsive breakpoints (canonical)
- `<400px` — small phone
- `400–809px` — large phone (scaled up)
- `≥810px` — desktop

Desktop breakpoint is always 810px. Large phone band is always bounded:
`(min-width: 400px) and (max-width: 809px)`.

---

## File size rules
- Hard limit: **300 lines per source file** (JSX / JS / CSS)
- CLAUDE.md and HANDOFF.md are exempt
- Target: under 250 lines
- One responsibility per file
- Components never contain business logic — extract to hooks/
- Firebase calls never live in components — extract to firebase/

## Constants rule
All string literals, Firestore path builders, and fixed lists live in a
`constants/` folder. Never hardcode these values in components or hooks.

---

## Branch strategy
**Always work directly on main.** Never create feature branches.
Commit and push after each confirmed working step. Netlify auto-deploys on
every push to main. Do not open pull requests.

## Session discipline
- Always read the relevant file before editing it — never assume contents
- Maximum 3 files changed per prompt — if more needed, break into steps
- Do not build and debug in the same prompt
- Never work on top of already-broken code — revert and restart clean
- New feature = commit the current working state first
- Start a fresh Claude Code chat for every new session

## End of every session — required
1. Update CLAUDE.md with any new decisions made this session
2. Overwrite HANDOFF.md (lean format)

## Start of every session — required
1. Read CLAUDE.md in full
2. Read HANDOFF.md
3. Confirm with Rob: what are we building today?

---

## Key decisions — do not revisit without Rob's explicit instruction
- Monorepo split into **two separate Netlify sites** (rewards + tools), not one
- Firebase project is **johnson-web-tools** — fresh data, never use `homeschool-tools-ff73c`
- `rewardTracker/{studentName}` — **no 'students/' segment** in the path, ever
- Rewards data starts fresh — no migration from the old planner project
- TE Extractor calls Anthropic API directly from browser (Netlify Function
  proxy caused 60s timeouts — do not revert)
- Firebase config values always via `VITE_FIREBASE_*` env vars — never
  hardcoded in source
- Font: **Lexend only**
- Accent: **gold #c9a84c only**
- Header background: **always #22252e hardcoded**
- Exact dependency versions only — no `^` or `~` prefixes
- 300-line hard limit per source file (CLAUDE.md + HANDOFF.md exempt)
- Work directly on main always — no feature branches
- Desktop breakpoint: 810px
- Google sign-in only, single family account
