# HANDOFF — v0.27.7 Sick Day Pill Wired to Cascade

## What was completed this session

2 code commits + this docs commit on `main`:

```
da204bf chore: bump version to v0.27.7
610afd8 fix: wire sick day desktop pill to cascade target (v0.27.7)
```

### Commit 1 — Wire SickDaySheet pill to actual cascade target (`610afd8`)
Files: `PlannerLayout.jsx`, `useSubjects.js`

Closes the v0.27.6 gap. The desktop SickDaySheet was already passing the picked day as `onConfirm(selected, activeDay)`, but the parent dropped the second arg and the cascade ran from `day` (the parent state). Now both layers honor the explicit pick.

`PlannerLayout.jsx` (line 81–84):
- `handleSickDayConfirm` now accepts `(selectedSubjects, sickDayIndex)` and forwards `sickDayIndex` to `performSickDay`.

`useSubjects.js` (`performSickDay`, lines 92–126):
- Signature is now `performSickDay(selectedSubjects, sickDayIndex = day)` — defaulting to `day` keeps mobile (no 2nd arg passed) byte-for-byte equivalent to before.
- `startData` lookup: when `sickDayIndex === day`, still reads from in-memory `dayData[subject]` (fast path). When the picked day differs, falls back to `dbReadCell(uid, weekId, student, sickDayIndex, subject)` so the chain seed is correct for any day.
- All five `day` references inside the function (chain seed, `for` loop, `dbDeleteCell` for the source cell, `getWeekDates(...)[day]` for the marker date) replaced with `sickDayIndex`.

Mobile path: SickDaySheet's `onConfirm` is unchanged — it always sends `(selected, activeDay)`. On mobile `activeDay === day` (the prop) because there are no pills, so the result is identical to the old code.

### Commit 2 — Version bump (`da204bf`)
0.27.6 → **0.27.7** across all 3 packages (dashboard, shared, te-extractor).

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md.
2. Smoke test the desktop sick day flow end-to-end:
   - Open Sick Day from any day, switch pills, check subjects on the picked day, Confirm.
   - Verify the sick-day red dot appears on the picked day's DayStrip date and that the cascade actually shifts that day's lessons forward.
   - Verify the marker is written for the picked day's date string (not Monday).
3. Smoke test mobile to confirm no regression — DayStrip → Sick Day → check subjects → Confirm should behave exactly as in v0.27.5.

## Key file locations

```
packages/dashboard/src/tools/planner/components/PlannerLayout.jsx     # handleSickDayConfirm forwards sickDayIndex
packages/dashboard/src/tools/planner/hooks/useSubjects.js             # performSickDay accepts sickDayIndex = day
packages/dashboard/package.json                                        # 0.27.7
packages/shared/package.json                                           # 0.27.7
packages/te-extractor/package.json                                     # 0.27.7
```
