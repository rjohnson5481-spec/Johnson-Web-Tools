# HANDOFF — end of session 2026-04-10

## What was completed this session
Two bug fixes and a full data model redesign. All changes committed and
pushed directly to main. Netlify auto-deploys on push.

### Bug fix 1 — addSubject no longer pre-populates future days
`hooks/useSubjects.js` — removed logic that wrote empty cell docs to all
5 days when a subject was added. addSubject now only writes to the subject
list doc. (This was resolved before the model redesign made it moot.)

### Bug fix 2 — PDF parser overhaul
`netlify/functions/parse-schedule.js` — complete rewrite of the system
prompt and response handler for BJU Homeschool Hub "Print By Day" format.
New output shape: `{ student, weekId, days: [{ dayIndex, lessons: [{ subject, lesson }] }] }`
Consumers updated: PlannerLayout.jsx handleApplySchedule and UploadSheet.jsx
result summary display.

### Data model redesign — per-day implicit subjects (3 batches)
This is a breaking change to the Firestore data model. Subjects are now
per-day and implicit — a subject exists on a day only when its cell document
exists. No global subject list.

**New Firestore path:**
```
/users/{uid}/weeks/{weekId}/students/{studentName}/days/{dayIndex}/subjects/{subjectName}
  → { lesson, note, done, flag }
```
dayIndex and subject are swapped vs the old path. This enables a simple
`collection()` query to get all subjects for a given day.

**Files changed (3 batches, each committed separately):**

Batch 1 — data layer:
- `packages/planner/src/constants/firestore.js` — removed subjectListPath,
  old subjectPath/dayPath; added daySubjectsPath and cellPath (new order)
- `packages/planner/src/firebase/planner.js` — removed subscribeSubjectList,
  saveSubjectList, subscribeDayData; added subscribeDaySubjects, deleteCell;
  updated updateCell to write to new cellPath

Batch 2 — hook + wiring:
- `packages/planner/src/hooks/useSubjects.js` — new signature
  useSubjects(uid, weekId, student, day); single subscription to
  subscribeDaySubjects; subjects = Object.keys(dayData); addSubject creates
  a cell (which IS the subject); removeSubject deletes the cell; updateCell
  keeps dayIndex param so PDF import can write to any day
- `packages/planner/src/App.jsx` — passes ui.day to useSubjects;
  passes dayData={dayData} to PlannerLayout

Batch 3 — component:
- `packages/planner/src/components/PlannerLayout.jsx` — weekData → dayData
  throughout; handleToggleDone/handleToggleFlag use dayData[subject] ??
  instead of weekData[subject]?.[day]; handleApplySchedule no longer calls
  addSubject (updateCell creates the cell); SubjectCard and EditSheet data
  props use dayData[subject] directly

---

## What is currently incomplete or untested
- **Not smoke-tested in browser** — the new data model has not been walked
  through on a live device. Before building any new features, the golden
  path should be verified:
  1. Sign in
  2. Select a day
  3. Add a subject — confirm it appears only on that day
  4. Switch days — confirm the subject is NOT on other days
  5. Add the same subject on another day — confirm it appears on both
  6. Edit a cell, toggle done/flag
  7. PDF import — confirm lessons land on the correct days
  8. Remove a subject on one day — confirm other days unaffected
- **Orphaned Firestore data** — old documents at the old paths are still
  in Firestore but are never read or written. Can be manually deleted from
  the Firebase console (no migration script needed). See CLAUDE.md for paths.
- **reward-tracker** — still needs migrating into monorepo structure

---

## What the next session should start with
1. Read CLAUDE.md + HANDOFF.md (required)
2. Confirm with Rob: smoke-test the live planner first, or go straight to next task?
3. If smoke-testing: walk the golden path (see checklist above) on the deployed
   /planner URL and report any issues before building anything new
4. If issues found: fix them before moving on
5. Only after smoke-test passes: confirm with Rob what comes next

---

## Decisions made this session (already added to CLAUDE.md)
- Subjects are now per-day and implicit — no global subject list document
- New Firestore path has dayIndex BEFORE subject to enable simple collection query
- useSubjects hook signature changed to useSubjects(uid, weekId, student, day)
- updateCell keeps (subject, dayIndex, data) signature — PDF import needs it
- addSubject in hook always writes to current day (from hook closure)
- Old Firestore paths are orphaned — no migration, manual Firebase console cleanup
