# HANDOFF — v0.19.0 Polish Session (2026-04-12)

## What was completed this session

### v0.19.0 — five fixes, six commits

**Fix 1 — PWA theme_color** (`3c5984c`)
- Changed `theme_color` from `#2d5a3d` to `#22252e` in:
  - `packages/dashboard/public/manifest.json`
  - `packages/dashboard/index.html`
  - `packages/planner/index.html`

**Fix 2 — Merge School Year + School Days** (`9a487be`)
- Removed separate "School Year" and "School Days" coming-soon sections
- Replaced with single "School Year & Compliance" section
- Description: "Set academic year dates and track school days for ND compliance — coming in Phase 2"

**Fix 3 — Student delete with confirmation** (`9a487be`, same commit as Fix 2)
- Added ✕ button to each student row in SettingsSheet
- ✕ hidden when only one student remains (`namedStudents.length > 1` guard)
- Tapping ✕ shows inline confirmation: red tint row, "Remove [name]?", Yes (red) + Cancel
- On Yes: `saveStudents(students.filter(...))` removes from Firestore
- New CSS classes: `.settings-row--confirm`, `.settings-confirm-msg`, `.settings-confirm-btns`, `.settings-confirm-yes`, `.settings-confirm-cancel`, `.settings-row-actions`

**Fix 4 — Wire Header student toggle from Firestore** (`a3c2e1e`)
- `App.jsx` calls `useSettings(user?.uid)`, passes `students` to PlannerLayout
- `PlannerLayout.jsx` threads `students` prop to Header
- `Header.jsx` removes hardcoded `['Orion', 'Malachi']`; uses `students` prop with `?? []` guard
- Effect in App.jsx: if selected student is removed, falls back to `students[0]`

**Fix 5 — Wire Firestore subjects into AddSubjectSheet** (`bdefe8c`)
- `useSettings` now accepts optional `plannerStudent` param; pre-loads that student's subjects
- `useSettings` now exposes `subjectsByStudent` map in its return value
- `App.jsx` passes `ui.student` to `useSettings`, derives `plannerSubjects = subjectsByStudent[ui.student]`, passes to PlannerLayout
- `PlannerLayout` passes `plannerSubjects` to `AddSubjectSheet` as `presets` prop
- `AddSubjectSheet` uses `(presets ?? SUBJECT_PRESETS)` for the quick-pick grid

**Version bump** (`cdd561a`)
- Both package.json files: `0.18.0` → `0.19.0`

---

## What is currently incomplete

- Smoke-test needed (all fixes are code-only, not browser-verified):
  - Fix 1: PWA install banner shows `#22252e` charcoal (not green)
  - Fix 2: Settings sheet shows one "School Year & Compliance" section (not two)
  - Fix 3: Student ✕ button appears; confirmation works; ✕ hidden when 1 student remains
  - Fix 4: Header student pills update immediately when students added/removed in Settings
  - Fix 5: AddSubjectSheet quick-picks show student's Firestore subjects (not hardcoded list)
- reward-tracker — still needs migrating into monorepo structure
- Phase 2 features (do not build until Rob confirms)

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md
2. Smoke-test all 5 fixes in browser (list above)
3. Confirm with Rob: Phase 2 features or reward-tracker migration?

---

## Architecture notes

- `useSettings` is called in TWO places: `App.jsx` (students list + subject pre-load for planner) and `SettingsSheet.jsx` (full settings editing state). Both subscribe independently to Firestore. Intentional — not a bug.
- `activeStudent` in `useSettings` controls the Default Subjects tab in SettingsSheet and is independent from `ui.student` (the planner's selected student).
- `plannerSubjects` is `undefined` until Firestore returns data. `AddSubjectSheet` falls back to `SUBJECT_PRESETS` when `presets` is `undefined`, so the quick-pick grid always shows something on first open.
