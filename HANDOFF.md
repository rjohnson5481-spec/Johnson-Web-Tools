# HANDOFF — Settings Sheet Session (2026-04-12)

## What was completed this session

### Settings sheet — v0.18.0

Full settings bottom sheet built and wired. Five commits:
- `699cc1d` — Firestore path builders + `firebase/settings.js` I/O layer
- `0afe31b` — `useDarkMode.js` + `useSettings.js` hooks
- `d10ac85` — `SettingsSheet.jsx` + `SettingsSheet.css`
- `510f82f` — Wired into Header, usePlannerUI, PlannerLayout
- `e133824` — Version bumped to 0.18.0 in both package.json files

**New files:**
- `packages/planner/src/constants/firestore.js` — added `settingsStudentsPath`, `settingsSubjectsPath`
- `packages/planner/src/firebase/settings.js` — read/write for students list + default subjects
- `packages/planner/src/hooks/useDarkMode.js` — same logic as dashboard version
- `packages/planner/src/hooks/useSettings.js` — students + default subjects state management
- `packages/planner/src/components/SettingsSheet.jsx` — full settings UI (~120 lines)
- `packages/planner/src/components/SettingsSheet.css` — styles (~230 lines)

**Sheet sections:**
1. Appearance — dark mode toggle (reads/writes `color-mode` localStorage key)
2. Students — list from Firestore, inline pencil-edit, add new student
3. Default Subjects — per-student tabs, add/remove subjects, lazy-loaded from Firestore
4. School Year — coming soon (opacity 0.45, pointer-events none)
5. App — version label `v0.18.0`, "Clear Cache & Reload" button
6. School Days — coming soon (opacity 0.45, pointer-events none)

**Firestore paths used:**
- `users/{uid}/settings/students` → `{ names: string[] }`
- `users/{uid}/subjectPresets/{student}` → `{ subjects: string[] }`
  (Note: spec had a 5-segment path which isn't valid in Firestore; using 4-segment equivalent)

**Default subjects** fall back to `SUBJECT_PRESETS` constant when no Firestore doc exists.

**Dark mode** is initialized from localStorage before first render in `main.jsx`
(already existed). `useDarkMode` hook in SettingsSheet handles toggle.

**Not yet wired:**
- Header still uses hardcoded `['Orion', 'Malachi']` student list —
  follow-up: read from settings Firestore doc and drive Header + usePlannerUI initial student
- AddSubjectSheet still uses `SUBJECT_PRESETS` constant for quick-picks —
  follow-up: read per-student default subjects from settings and use those instead

---

## What is currently incomplete

- Smoke-test still needed for fixes from prior sessions (fixes 2–5 listed in previous HANDOFF)
- Header student list + AddSubjectSheet presets not yet wired to Firestore settings data
- reward-tracker — still needs migrating into monorepo structure

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md
2. Smoke-test Settings sheet in browser:
   - Dark mode toggle persists across reload
   - Students: edit name, add student, saves to Firestore
   - Default Subjects: per-student tabs, add/remove, saves to Firestore
   - Coming Soon sections are greyed out
   - Clear Cache & Reload works
3. Wire Header student list to Firestore settings (replace hardcoded array)
4. Wire AddSubjectSheet presets to per-student Firestore subjects
5. Confirm with Rob: Phase 2 features or reward-tracker migration?
