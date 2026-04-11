# HANDOFF — end of Undo Sick Day session (2026-04-11)

## What was completed this session

One feature commit pushed to main (`618f2a5`).

---

### Feature: Undo Sick Day

When the current day has a sick day marker, the "Sick Day" button in the
bottom action bar now reads "↩ Undo Sick Day" instead. Tapping it opens a
confirmation sheet. Confirming reverses the cascade and removes the red dot.

**Files changed:**

`packages/planner/src/firebase/planner.js`
- Added `readSickDay(uid, dateString)` — reads the sick day marker doc
- Added `deleteSickDay(uid, dateString)` — deletes the sick day marker doc

`packages/planner/src/hooks/useSubjects.js`
- Added `performUndoSickDay()`:
  1. Reads `subjectsShifted` from the sick day marker for the current day
  2. For each subject, builds unbroken chain from D+1 forward
  3. Writes each cell one day back (D+1→D, D+2→D+1, …)
  4. Deletes the last source cell in the chain
  5. Deletes the sick day Firestore document
- Returned from hook alongside `performSickDay`

`packages/planner/src/hooks/usePlannerUI.js`
- Added `showUndoSickDay` / `setShowUndoSickDay` state

`packages/planner/src/App.jsx`
- Destructured `performUndoSickDay` from `useSubjects`, passed to PlannerLayout

`packages/planner/src/components/PlannerLayout.jsx`
- Action bar button is conditional: shows "↩ Undo Sick Day" when `isSickDay`,
  "Sick Day" otherwise
- Added `handleUndoSickDay()` handler
- Inline confirmation sheet: ink header, warning message, Cancel + Undo buttons

`packages/planner/src/components/PlannerLayout.css`
- Added `.planner-action-btn--undo` (red-lt bg, red text — mirrors Clear Week style)
- Added full `.undo-sick-*` styles for the confirmation sheet
  (overlay, slide-up panel, handle, ink header, body, footer, buttons)

---

## Algorithm notes

The undo is within-week only — the mirror of the forward cascade.

Forward (sick day): reads chain from D through D+4, writes in reverse to D+1…,
drops Friday overflow, deletes sick day cell, writes sick day marker.

Reverse (undo): reads `subjectsShifted` from the marker, builds chain from D+1
through week (stops at first gap per subject), writes each cell to dayIndex-1,
deletes the last source cell, deletes the sick day marker.

All chain data is loaded into memory before any writes, so write order doesn't
matter for correctness.

---

## What is currently incomplete

- **Not smoke-tested in browser** — verify after deploy:
  1. On a day with a sick day marker: action bar shows "↩ Undo Sick Day"
  2. On a normal day: action bar shows "Sick Day"
  3. Tapping "↩ Undo Sick Day" opens the confirmation sheet
  4. Confirming shifts lessons back, removes red dot from DayStrip
  5. Cancel closes the sheet without making changes

- **reward-tracker** — still needs migrating into monorepo structure

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md (required)
2. Smoke-test Undo Sick Day in the browser
3. Confirm with Rob: Phase 2 features, reward-tracker migration, or other work?

### Phase 2 options (do not build without Rob's go-ahead)
- Auto-roll flagged lessons to next week
- Week history browser
- Copy last week as template
- Export week as PDF
