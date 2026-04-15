# HANDOFF — v0.23.1 bug fixes (Course Catalog save + dual-mount)

## What was completed this session

Two-bug-fix session within v0.23.1. Three commits land on main.
No version bump — these are bug fixes inside the v0.23.1 line.

### Commit 1 — `fix: resolve uid in AcademicRecordsTab, throw on missing uid in useCourses` (90e3320)

Two surgical edits, two files.

**`packages/dashboard/src/tools/academic-records/hooks/useCourses.js`**
— replaced the silent `if (!uid) return` early return at the top
of `addCourse` and `updateCourse` with:
```js
if (!uid) throw new Error('useCourses: uid is required');
```
Now if a save is somehow attempted before auth resolves, the
console gets a clear, attributable failure instead of a no-op.

`removeCourse` was deliberately NOT changed — the spec called out
only `addCourse` and `updateCourse`. Worth flagging for next
session: the same silent guard is still on `removeCourse` (line 70),
so a delete attempted with no uid would still no-op silently.
Trivially fixable later if Rob wants symmetry.

**`packages/dashboard/src/tabs/AcademicRecordsTab.jsx`** —
`handleSaveCourse` got a permanent guard prepended:
```js
if (!uid) {
  console.warn('AcademicRecordsTab: uid missing on save — course will not persist');
  return;
}
```
This catches the same condition one layer up so the failure mode
is attributable to the tab (not a deep-stack hook throw the user
might not notice). The component-level warn names the component;
the hook's throw names the hook. Either appears in DevTools.

**Auth pattern check** — Spec asked to confirm AcademicRecordsTab
gets uid the same way as HomeTab. Both files use:
```js
const { user } = useAuth();
```
HomeTab passes `user?.uid` inline at the call site; AcademicRecordsTab
captures it as a local `const uid = user?.uid;`. Functionally
identical. AcademicRecordsTab keeps the local `uid` variable since
it's used in three downstream call sites (the hook + the two sheet
prop pass-throughs at the bottom of the component, although after
Fix 2 the catalog sheet no longer takes uid). Pattern is the same;
no auth-call refactor needed.

App.jsx already gates the entire shell behind
`if (!user) return <SignIn />`, so under normal flow `uid` should
always be defined by the time AcademicRecordsTab renders. The new
guards are defensive — they don't fix a known race, they make any
future regression visible.

### Commit 2 — `fix: pass courses as props to CourseCatalogSheet, remove duplicate useCourses` (6f50fef)

Two files. Removes an architectural bug introduced in v0.23.1
Session 2.

**Before:** `useCourses(uid)` was mounted in TWO places —
`AcademicRecordsTab.jsx:15` and `CourseCatalogSheet.jsx:24`. Each
instance had isolated React state. When the parent's mutator wrote
to Firestore and reloaded ITS list, the child sheet's instance
never knew. Newly added courses only appeared after the catalog
was closed and reopened (which remounted the child's hook).

**After:** Single source of truth — the parent's `useCourses(uid)`
is the only instance. The child receives `courses`, `loading`,
`error` as props.

**`CourseCatalogSheet.jsx` changes:**
- Removed `import { useCourses } from '../hooks/useCourses.js';`
- Removed the `uid` prop from the destructure
- Removed `const { courses, loading } = useCourses(uid);`
- Added `courses`, `loading`, `error` to the props destructure
- Updated the props docstring to reflect the new contract
- Added an inline error display under the section label:
  `{error && <p className="cc-loading" role="alert">⚠ {error}</p>}`
  — re-uses `.cc-loading` styling for now (same muted, centered
  text); a dedicated error class can be added later if Rob wants
  red styling. CSS file was deliberately untouched per spec.

**`AcademicRecordsTab.jsx` changes:**
- Destructured `courses, loading, error` from the existing
  `useCourses(uid)` call (these were already returned by the hook,
  just not previously captured).
- Replaced `uid={uid}` on `<CourseCatalogSheet>` with three new
  prop forwards: `courses={courses}`, `loading={loading}`,
  `error={error}`.

Behavior change: after a save in the editor sheet, the parent's
`useCourses` reloads and propagates the new `courses` array down
to the open catalog sheet via React's normal re-render cycle. No
more close-and-reopen needed.

### Commit 3 — `docs: update HANDOFF v0.23.1`

This file.

---

## Why the catalog appeared "not saving to Firestore"

Pre-fix, two things could mask a real save:
1. **Hook silent early-return** — if `uid` was somehow falsy when
   `addCourse` ran, the hook returned `undefined` cleanly, the
   await resolved, the editor closed, no console output, no
   network call.
2. **Dual-mount stale list** — even when the save succeeded, the
   open catalog sheet's child hook never reloaded, so the new
   course was invisible until the sheet was closed and reopened.
   This visually looked like "the save didn't happen" even when
   it had.

After Fix 1, condition (1) is loud: a real uid problem now throws
inside the hook AND warns in the component. After Fix 2, condition
(2) is impossible: there's only one source of truth for the
`courses` array, and React's normal re-render flow propagates
changes from the parent to the open child immediately.

If saves still don't appear in Firestore after deploy, the next
diagnostic is browser DevTools → Console for the warn or thrown
error, then DevTools → Network tab for the actual addDoc XHR
(should hit firestore.googleapis.com), then Firebase rules.

---

## Build verification

`npm run build` passes clean at both code commits
(`@homeschool/dashboard@0.23.1`, `@homeschool/te-extractor@0.23.1`).
No new file-size violations; no files crossed any thresholds.

---

## What is currently incomplete / pending

1. **Browser smoke test** — not run. Priority checks:
   - Open Academic Records → Manage Course Catalog → tap
     "+ Add Course" → fill in name + curriculum → Save.
     Expected: editor closes, **catalog list updates immediately
     with the new course visible** (no close-and-reopen needed).
   - Tap an existing course in the catalog → editor opens
     pre-filled → change name → Save. Expected: editor closes,
     catalog row reflects the new name immediately.
   - In editor, tap "Remove Course" → Confirm. Expected: editor
     closes, course removed from catalog immediately.
   - DevTools console: should be silent on a normal save. If it
     logs the warn or the error, uid is unresolved — surface the
     failure to Rob with timing context.

2. **`removeCourse` still has the silent `if (!uid) return` guard**
   (line 70 of useCourses.js). Spec only called out addCourse and
   updateCourse. Trivial 1-line fix to mirror — defer to next
   session unless it bites.

3. **Error styling.** The new `error` display in CourseCatalogSheet
   re-uses `.cc-loading` styles (muted gray, centered) for now.
   If errors should look distinct (red, prominent), add a
   `.cc-error` class to CourseCatalogSheet.css and switch the JSX.
   Spec said do not change CSS this session — flagged for later.

4. **Carry-overs (untouched, still open):**
   - iPad portrait breakpoint decision
   - iPhone SE 300px grid overflow
   - Planner Phase 2 features (auto-roll, week history, copy
     last week, export PDF)
   - Import merge bug (inherited from v0.22.3)
   - CLAUDE.md drift — academic-records tool not yet documented
     in CLAUDE.md trees / data-model / phase-status sections

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md (standard).
2. Smoke test the catalog save flow on device — confirm the
   immediate-update behavior works as designed.
3. If the bug is fully resolved, proceed with **Phase 2 Session 3
   — Enrollment UI** (per the v0.23.1 Session 2 HANDOFF):
   `useEnrollments` hook, EnrollmentListSheet,
   AddEditEnrollmentSheet (course picker + student picker + year
   picker), and wire the second quick-action row.
4. Optional cleanup pass: mirror the `removeCourse` guard fix,
   add a `.cc-error` class for distinct error styling.

---

## Key file locations (touched this session)

```
packages/dashboard/
└── src/
    ├── tabs/
    │   └── AcademicRecordsTab.jsx                                  # +6 lines (warn guard + props pass)
    └── tools/academic-records/
        ├── components/
        │   └── CourseCatalogSheet.jsx                              # -2 lines net (drop useCourses, add 3 props + error)
        └── hooks/
            └── useCourses.js                                       # 2 lines changed (silent return → throw)
```

Net diff across the two code commits: 25 insertions, 9 deletions
across 3 source files. No version bump (bug fixes within v0.23.1).
No Firestore writes deployed yet — push pending after this commit.
