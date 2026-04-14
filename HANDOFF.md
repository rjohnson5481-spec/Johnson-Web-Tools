# HANDOFF — Session ending 2026-04-14 (thirteenth session)

## What was completed this session — v0.21.2

### Fix 1 — Rename `__allday__` to `allday` (commit e1bfedb) ✅ COMPLETE
Firestore rejects document IDs wrapped in double underscores (`__name__`) as
reserved. Renamed the all-day event subject key from `__allday__` to `allday`
across all 6 affected files:
- `AddSubjectSheet.jsx` — line 13: `existingSubjects.includes('allday')`
- `SubjectCard.jsx` — comment + condition: `subject === 'allday'`
- `PlannerLayout.jsx` — 5 replacements across allDayData, filter, SubjectCard, updateCell, setEditTarget
- `EditSheet.jsx` — line 7: `subject === 'allday'`
- `firebase/planner.js` — `hasAllDayEvent` and `getAllDayEvent` helpers
- `firebase/planner.js` — restored clean `updateCell` (removed 3 diagnostic console.logs from session 12)

### Fix 2A — Normalize weekId to Monday in import handler (commit 6e9de2d) ✅ COMPLETE
Added `mondayWeekId(dateStr)` to `constants/days.js`. This parses the date string as
a local date (avoids UTC timezone shift with `new Date(y, m-1, d)`) and returns the
Monday weekId for that week. `handleApplySchedule` in `PlannerLayout.jsx` now normalizes
`parsedData.weekId` via `safeData = { ...parsedData, weekId: mondayWeekId(parsedData.weekId) }`
before all Firestore writes and navigation. The AI's system prompt in parse-schedule.js
was already correct — no Netlify Function changes needed.

### Fix 2B — One-time migration of bad Tuesday weekIds (commit e317135) ✅ COMPLETE
Added `migrateBadWeeks(uid)` to `firebase/planner.js`. Migrates data from two known bad
Tuesday weekIds (`2026-04-07` → `2026-04-06`; `2026-04-14` → `2026-04-13`). Reads
student list from Firestore settings, copies cells to the correct Monday week without
overwriting existing good data, deletes the bad week after migration, and sets a
localStorage flag to prevent re-runs. Called once from `App.jsx` after auth via `useEffect`.

### Version bump — 0.21.2 ✅ COMPLETE
Both `packages/planner/package.json` and `packages/dashboard/package.json` bumped to 0.21.2.

---

## What to do first next session

### 1. Verify in production
After push and Netlify deploy:
1. Open /planner in browser
2. Add an All Day Event — confirm it saves and reappears after page reload
3. Confirm the week for 2026-04-06 now shows the data that was previously in 2026-04-07
4. Import a PDF — confirm the displayed weekId in the log is a Monday, not a Tuesday

### 2. Import merge smoke-test (still pending from v0.21.0)
Import a second PDF with "Replace existing schedule" toggle OFF —
confirm existing done/note data is preserved.

### 3. Verify Firestore security rules (session 9 item — still unchecked)
Confirm rules allow reads/writes to `/users/{uid}/teExtractor/extractions/items/{docId}`.

---

## Known incomplete / not started

- Subject count badges in desktop sidebar DayStrip NOT implemented
- reward-tracker: not migrated
- Academic Records: coming-soon placeholder only
- app.js in te-extractor ~970+ lines — violates 300-line limit
