# CLAUDE.md — Iron & Light Johnson Academy Homeschool Tools
Current version: v0.28.8

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
├── CLAUDE-DESIGN.md           ← Ink & Gold design system (read for UI/CSS sessions only)
├── CLAUDE-HISTORY.md          ← phase history, migration notes (read only when requested)
├── HANDOFF.md                 ← overwrite at end of every session
├── scratch.js                 ← never committed, complex logic sandbox
├── netlify.toml               ← global Netlify config
├── packages/
│   ├── shared/                ← design system, Firebase init, auth, components
│   ├── dashboard/             ← unified app shell; all tools live in src/tools/
│   └── te-extractor/          ← vanilla HTML/CSS/JS tool, no React, served from dist/te-extractor/

Root `package.json` workspaces: ["packages/shared", "packages/dashboard", "packages/te-extractor"].
`packages/planner` and `packages/reward-tracker` were retired — both tools now live at
`packages/dashboard/src/tools/{planner,reward-tracker}/` and render inside the dashboard shell.

---

## Stack (all tools)
- React + Vite
- Firebase Auth — Google sign-in, single family account, shared across tools
- Firebase Firestore — each tool uses its own collection namespace
- Firebase Storage — Blaze plan, used for saved report PDFs
- Netlify — single site, all tools deployed together, auto-deploy on push to main
- vite-plugin-pwa — dashboard is the installable PWA entry point
- @dnd-kit/core — drag-and-drop only, never hand-roll it
- pdf-lib — browser-side PDF generation (exact version pinned)
- @netlify/functions 2.8.1 — scheduled backup function
- @netlify/blobs 8.1.0 — backup storage
- firebase-admin 12.1.0 — server-side Firestore reads in scheduled backup

## Locked dependencies — do not upgrade or swap without asking Rob
- firebase, @dnd-kit/core, vite-plugin-pwa, react, react-dom, pdf-lib
All package.json entries use exact versions — no ^ or ~ prefixes.

---

## Deployment
- Host: Netlify, connected to GitHub repo
- Primary URL: `homeschool.grasphislove.com` (custom domain, live as of 2026-04-15)
- Secondary URL: `ironandlight.netlify.app` (Netlify default, fallback)
- App shell at root `/` — serves the dashboard (all tools as tabs)
- TE Extractor at `/te-extractor/` (separate vanilla-JS build, links out from shell)
- NOT GitHub Pages

## netlify.toml
[build]
  command = "npm install && npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/te-extractor/*"
  to = "/te-extractor/index.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

Order is required — never reorder these blocks.
No base directory — build runs from repo root via workspaces.

---

## Environment variables (Netlify dashboard only — never in code)
- ANTHROPIC_API_KEY — Netlify Functions only (parse-schedule), never client-side
- VITE_ANTHROPIC_API_KEY — TE Extractor + CalendarImportSheet + CurriculumImportSheet (intentional exception)
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_STORAGE_BUCKET — homeschool-tools-ff73c.firebasestorage.app
- FIREBASE_SERVICE_ACCOUNT — scheduled-backup.js (already set in Netlify)

## Anthropic API pattern
All Anthropic calls go through Netlify Functions — with intentional exceptions below.
Current functions:
- netlify/functions/parse-schedule.js (planner PDF import)
  Client calls: POST /api/parse-schedule with { file: base64, mediaType }
  Returns: application/json { student, weekId, days }
- netlify/functions/scheduled-backup.js (runs every 6 hours, saves to Netlify Blobs)

## TE Extractor — intentional exception to API key rule
Calls api.anthropic.com directly from client using VITE_ANTHROPIC_API_KEY.
Family-internal tool, behind Google Auth, never public facing.
Netlify Function proxy caused 60s gateway timeouts — do not revert.

---

## Firestore data model

### Planner
/users/{uid}/weeks/{weekId}/students/{studentName}/days/{0-4}/subjects/{subjectName}
  → { lesson: string, note: string, done: boolean, flag: boolean }
  Special key: 'allday' for All Day Events (NOT __allday__ — Firestore rejects double-underscore)

/users/{uid}/sickDays/{dateString}
  → { student: string, date: string, subjectsShifted: string[] }

/users/{uid}/settings/students
  → { names: string[] }  ← onSnapshot in useSettings (real-time)

/users/{uid}/subjectPresets/{studentName}
  → { subjects: string[] }

weekId / dateString format: "YYYY-MM-DD" (weekId = Monday of that week)
Always use mondayWeekId() from constants/days.js — never write a raw date string.
dayIndex: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri

CRITICAL: uid document does NOT exist in Firestore — only subcollections exist.
Use collectionGroup('subjects') for any query traversing from uid level.

### Reward Tracker
/users/{uid}/rewardTracker/{studentName}
  → { points: number }  ← NO 'students/' segment — do not add it

/users/{uid}/rewardTracker/{studentName}/log/{docId}
  → { type: 'award'|'deduct'|'spend', points: number, note: string, createdAt: serverTimestamp }

Cash value: 15 pts = $1.00 (floor division).

### Academic Records
/users/{uid}/schoolYears/{yearId}           → { label, startDate, endDate }
/users/{uid}/schoolYears/{yearId}/quarters  → { label, startDate, endDate }
/users/{uid}/schoolYears/{yearId}/breaks    → { label, startDate, endDate }
/users/{uid}/courses/{courseId}             → { name, curriculum, gradingType }
/users/{uid}/enrollments/{enrollmentId}     → { courseId, student, yearId, notes, syncPlanner, gradeLevel }
/users/{uid}/grades/{gradeId}               → { enrollmentId, quarterId, grade, percent }
/users/{uid}/reportNotes/{noteId}           → { student, quarterId, notes }
/users/{uid}/savedReports/{reportId}        → { student, periodLabel, yearLabel, generatedAt, storageUrl, notes, includeToggles }
/users/{uid}/activities/{activityId}        → { student, name, startDate, endDate, ongoing, notes }

Firebase Storage: users/{uid}/reports/{reportId}.pdf

### TE Extractor
/users/{uid}/teExtractor/extractions/items/{docId}
  → { fileName, lessons, html, previewText, createdAt }

### Firestore Security Rules
Two rules — both required, never remove either:
match /users/{userId}/{document=**} { allow read, write: if request.auth.uid == userId; }
match /{path=**}/subjects/{subjectId} { allow read: if request.auth != null; }
The second rule is required for collectionGroup backup export.

---

## Package structure
packages/dashboard/src/
├── App.jsx                    ← auth + activeTab + plannerStudent + colorMode + useSettings
├── components/
│   ├── BottomNav.jsx          ← mobile bottom bar + desktop 200px sidebar
│   └── SignIn.jsx
├── tabs/
│   ├── HomeTab.jsx            ← per-student cards, tappable mobile / expanded desktop
│   ├── PlannerTab.jsx
│   ├── RewardsTab.jsx
│   ├── AcademicRecordsTab.jsx
│   ├── SettingsTab.jsx
│   └── DataBackupSection.jsx  ← Export / Restore from Backup / Factory Reset Restore
├── hooks/
│   ├── useDarkMode.js
│   └── useHomeSummary.js
├── firebase/
│   ├── backup.js              ← exportAllData, generateRestoreDiff, applyRestoreDiff, importFullRestore
│   ├── RestoreDiffSheet.jsx   ← routes desktop→RestoreDiffCalendar / mobile→accordion
│   ├── RestoreDiffSheet.css
│   ├── RestoreDiffCalendar.jsx ← desktop calendar diff view
│   └── RestoreDiffCalendar.css
└── tools/
    ├── planner/
    │   ├── components/
    │   │   ├── PlannerLayout.jsx        ← under 250 lines
    │   │   ├── PlannerActionBar.jsx
    │   │   ├── UndoSickSheet.jsx
    │   │   ├── CalendarWeekView.jsx     ← desktop calendar grid
    │   │   ├── SickDaySheet.jsx
    │   │   ├── UploadSheet.jsx
    │   │   ├── ImportDiffPreview.jsx
    │   │   └── [other sheets]
    │   ├── hooks/
    │   │   ├── useWeek.js
    │   │   ├── useSubjects.js           ← cell data only — no sick-day listener
    │   │   ├── useSickDay.js            ← sole owner of sick-day Firestore listener
    │   │   ├── usePdfImport.js
    │   │   ├── usePlannerHelpers.js     ← PDF helpers + handleMoveCell
    │   │   ├── usePlannerUI.js
    │   │   └── useSettings.js
    │   └── constants/
    │       ├── days.js                  ← mondayWeekId() lives here
    │       └── [other constants]
    ├── reward-tracker/
    └── academic-records/

netlify/functions/
├── parse-schedule.js          ← PDF import Anthropic proxy
└── scheduled-backup.js        ← 6-hour auto backup to Netlify Blobs

---

## Responsive breakpoints (canonical)
- `<400px` — small phone. Compact nav 56px.
- `400–1023px` — large phone (Galaxy S25 Ultra etc). Scaled-up fonts/spacing/nav.
- `≥1024px` — desktop. 200px fixed sidebar, CalendarWeekView in planner.

Desktop breakpoint is always 1024px — never lower.
Large phone band is always bounded: `(min-width: 400px) and (max-width: 1023px)` — never bare min-width: 400px.
Desktop changes are always additive via @media (min-width: 1024px) — never modify base mobile styles.

---

## Tools status (v0.28.8)
- shared            → ✅ Complete
- dashboard shell   → ✅ Complete — 6-tab nav, dynamic students, dark mode
- Home Tab          → ✅ Complete — per-student cards, tappable/expanded, attendance
- Planner           → ✅ Complete — mobile DayStrip + desktop CalendarWeekView, drag-and-drop, sick day
- Reward Tracker    → ✅ Complete — award/deduct/spend/log, cash conversion
- Academic Records  → ✅ Complete — full Phase 2 feature
- TE Extractor      → ✅ Complete — vanilla JS at /te-extractor/
- Backup            → ✅ Complete — Export / Restore from Backup (diff) / Factory Reset / Auto 6hr
- School Days       → 🔒 Phase 3
- Multi-select      → 🔒 Queued

---

## File size rules
- Hard limit: 300 lines per source file (JSX / JS / CSS)
- CLAUDE.md, CLAUDE-DESIGN.md, CLAUDE-HISTORY.md are all exempt
- Target: under 250 lines per source file
- If a file approaches 250 lines, stop and split before continuing
- One responsibility per file
- Components never contain business logic — extract to hooks/
- Firebase calls never live in components — extract to firebase/

## Constants rule
All string literals, Firestore path builders, day labels, and subject lists live in constants/.
Never hardcode these values in components or hooks.

## Complex logic rule
Any non-trivial logic gets prototyped in scratch.js first. Never committed.

## Build order — always follow this
1. Read packages/shared before building anything
2. Never duplicate branding, tokens, Firebase init, or auth
3. Firebase + Auth layer before any UI
4. Firestore read/write layer before components
5. Constants files before any component that needs them
6. Stop and confirm with Rob before starting a new phase or new tool

---

## Session discipline
- Always read the relevant file before editing it — never assume file contents
- Maximum 3 files changed per prompt — if more needed, break into steps
- Do not build and debug in the same prompt
- Never work on top of already-broken code — revert and restart clean
- New feature = commit the current working state first
- Start a fresh Claude Code chat for every new session

## End of every session — required
1. Update CLAUDE.md with any new decisions made this session
2. Overwrite HANDOFF.md using the lean format (see prompt guide)

## Start of every session — required
1. Read CLAUDE.md in full
2. Read HANDOFF.md
3. For UI/CSS sessions — also read CLAUDE-DESIGN.md
4. Confirm with Rob: what are we building today?

---

## Branch strategy
Always work directly on main. Never create feature branches.
Commit and push after each confirmed working step.
Netlify auto-deploys on every push to main.
Do not open pull requests. Do not create branches named claude/* or feature/*.

## Netlify build — final confirmed config
- No base directory
- Command: npm install && npm run build (runs from repo root)
- Publish: dist
- Do not change without Rob's explicit instruction

---

## Key decisions — do not revisit without Rob's explicit instruction
- Monorepo, single Netlify site
- homeschool.grasphislove.com is primary domain
- Firebase only, Google sign-in only — single family account
- Desktop breakpoint: 1024px (raised from 768px — S25 Ultra compatibility)
- Large phone scaling band: 400–1023px bounded
- No max-width on mobile — content fills viewport width
- allday key (not __allday__) — Firestore rejects double-underscore
- weekId always Monday — mondayWeekId() in constants/days.js
- rewardTracker/{student} — no 'students/' segment
- collectionGroup('subjects') for backup/restore — uid doc does not exist
- Firestore collectionGroup subjects read rule must never be removed
- TE Extractor links out via window.location.href — React rewrite deferred Phase 3
- TE Extractor direct browser API call — Netlify Function caused 60s timeouts
- Unified Settings tab owns all settings
- Student state lifted to App.jsx
- CLAUDE.md, CLAUDE-DESIGN.md, CLAUDE-HISTORY.md all exempt from 300-line rule
- Work directly on main always — no feature branches
- 300-line hard limit per source file
- Grade entry saves both percent + letter
- Attendance = weekdays − breaks − sick days
- pdf-lib for browser-side PDF generation
- Firebase Storage for saved report PDFs — path: users/{uid}/reports/
- Student stored as name string (Phase 4: migrate to profile docs)
- Cascading deletes not implemented — console.warn fires on parent deletes
- Home tab: tappable mobile / expanded desktop per-student cards
- Restore from Backup uses diff engine — user reviews conflicts before applying
- Full Restore (Factory Reset) wipes all data then restores — two-step confirmation
- Backup export filename uses email username + date
- useSickDay hook owns sick day Firestore listener — Undo button driven by Firestore not local state
