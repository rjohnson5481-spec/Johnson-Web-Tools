# HANDOFF — v0.28.0 Backup Restore Diff Complete (Session B)

## What was completed this session

4 code commits + this docs commit on `main`. This is Session B of two —
desktop calendar diff view, desktop/mobile routing, MATCH-item fix on
mobile, version bump. The backup restore feature is now complete.

```
<docs>  docs: update HANDOFF v0.28.0
f7f9e8e  chore: bump version to v0.28.0
e833166  fix: show MATCH items on mobile diff sheet
927a493  feat: wire desktop vs mobile diff view in RestoreDiffSheet
b2bf7b3  feat: RestoreDiffCalendar desktop calendar diff view (v0.28.0)
```

### Commit 1 — RestoreDiffCalendar desktop component (`b2bf7b3`)
Files:
- `packages/dashboard/src/firebase/RestoreDiffCalendar.jsx` (181 lines, new)
- `packages/dashboard/src/firebase/RestoreDiffCalendar.css` (131 lines, new)

Full-screen overlay (z-index 400, `#f2f0ed` light / `--bg-base` dark)
that renders the restore diff as a 5-column Mon–Fri calendar grid.
Not a modal — fills the viewport, header + grid + footer all stacked
as flex children.

- **Header** (`#22252e` per brand rule): CSS grid with three tracks —
  filename on the left, week-nav chevrons + `formatWeekLabel()` label
  + "x of y" counter in the center, conflict summary (`X conflicts
  this week`) + close button on the right.
- **Week nav** jumps only through weeks that have diff data. `‹` / `›`
  step the index through `Object.keys(diff).sort()`; chevrons disable
  at the edges.
- **Grid** uses `grid-template-columns: repeat(5, 1fr)` with a 1px gap
  over a `--border` background, so each column is separated by a
  hairline without needing manual `border-right` rules. Each column
  has a day header (`DAY_SHORT[di]` + date number) and a scrollable
  body of cells.
- **Cell statuses** — each card has a 3px left border and a tinted
  background per status:
  - `MATCH` — normal card at 65% opacity, grey `✓` badge. Not
    clickable (`rdc-card--static`).
  - `NEW` — green (#2e7d32) left border, green tint, green `NEW`
    badge. Clicking toggles checked state.
  - `CHANGED` — red (#c0392b) left border, red tint, red `CHANGED`
    badge. Renders the backup lesson text with a muted, struck-through
    `was: ...` line underneath showing what would be overwritten.
  - `DELETE` — red border, red tint, red `DELETE` badge, lesson text
    rendered with strikethrough.
  - Unchecked non-MATCH cells — 40% opacity and strikethrough,
    indicating they'll be skipped.
- **Footer** (`#22252e`): Cancel (ghost) on the left, live
  `X changes selected` count in the center, `Restore Selected` gold
  button on the right. The gold button disables when `totalSelected`
  hits zero. Clicking Restore clones the diff with the local checked
  state and calls `applyRestoreDiff` — same API as the mobile sheet.

Does NOT touch `CalendarWeekView.jsx`, `CalendarWeekView.css`, or any
planner file. Prefix is `rdc-*` (distinct from the planner's `cwv-*`
and the mobile sheet's `rds-*`) so styles can't collide.

### Commit 2 — Desktop/mobile routing (`927a493`)
File: `packages/dashboard/src/firebase/RestoreDiffSheet.jsx` (219 lines)

`RestoreDiffSheet` is now a thin router. At `≥1024px` it renders
`<RestoreDiffCalendar>`; below 1024px it falls through to
`<RestoreDiffSheetMobile>` (the existing bottom-sheet body, renamed
but otherwise untouched).

Desktop detection uses a `useIsDesktop()` hook backed by
`matchMedia('(min-width: 1024px)')` with a `change` listener, so
resizing the window mid-restore swaps the view. No separate CSS
module — handled entirely in the JSX. Initial state uses a `typeof
window !== 'undefined'` guard for SSR safety even though this app
doesn't SSR today.

The caller in `DataBackupSection.jsx` is unchanged — it still mounts
a single `<RestoreDiffSheet>` and the component picks the right
renderer internally.

### Commit 3 — MATCH items on mobile (`e833166`)
File: `packages/dashboard/src/firebase/RestoreDiffSheet.jsx`

Previously `visibleDays` filtered out any day where
`conflicts === 0`, so a backup that exactly matched Firestore left
the sheet body blank. Now every day that has diff data is rendered:
- Days with at least one conflict → expanded by default, gold
  `X conflict(s)` badge.
- Days with only MATCH items → collapsed by default, green
  `All matched` badge (replaced the old `No conflicts` text).
- Individual MATCH rows keep the existing render: `rds-check-ph`
  placeholder where the checkbox would be, and a grey `match` tag on
  the lesson line.

`daysUnchanged` is now computed against the full day list rather than
"days hidden," so the header summary
`X conflicts · Y days unchanged · tap a day to review` continues to
reflect reality.

### Commit 4 — Version bump (`f7f9e8e`)
0.27.9 → **0.28.0** across dashboard, shared, te-extractor. Minor
version bump because the backup restore flow is now feature-complete.

---

## What is currently broken or incomplete

Nothing from this session. All four commits land cleanly and the
diff flow is feature-complete end-to-end.

Carried over from Session A (still open):
- `generateRestoreDiff` compares **only** weekly subject cells — it
  does not diff `schoolYears`, `courses`, `enrollments`, `grades`,
  `reportNotes`, `activities`, `savedReports`, `sickDays`,
  `subjectPresets`, `rewardTracker`, or `settings/students`. The
  planner cells are by far the largest surface, so the current
  coverage is useful, but a full-data diff is future work.
- `settings/students` is still never deleted by `importFullRestore`
  when the backup is missing that key (pre-existing issue).

Deferred polish items from Session A's handoff (not required for
completion, but still good ideas):
- Loading toast / spinner in `DataBackupSection` while
  `generateRestoreDiff` runs on large backups.
- Success toast after `applyRestoreDiff` instead of silent close.
- Secondary confirmation before Restore if many DELETE items are
  checked.
- User-facing error surface instead of `console.warn` on apply
  failure.

## What the next session should start with

1. Read `CLAUDE.md` + this `HANDOFF.md`.
2. Smoke test desktop diff view: resize viewport to ≥1024px, Export →
   edit some Firestore cells → Restore from Backup → verify the
   calendar grid renders; click a few cards to toggle, use the week
   nav on a multi-week backup, press Restore Selected, verify only
   checked items hit Firestore.
3. Smoke test mobile sheet: resize viewport below 1024px, same
   sequence. Confirm MATCH-only days now show up collapsed with an
   "All matched" badge.
4. Decide whether to extend the diff engine to non-week surfaces
   (schoolYears, courses, enrollments, grades, etc.) or keep the
   feature planner-focused.

## Decisions made this session (add to CLAUDE.md if still relevant)

- **Restore-diff flow is split by viewport**: `<1024px` → bottom
  sheet (`RestoreDiffSheetMobile`), `≥1024px` → full-screen calendar
  overlay (`RestoreDiffCalendar`). Both share the same
  `generateRestoreDiff` / `applyRestoreDiff` API in
  `src/firebase/backup.js`.
- **All diff-flow components live in `src/firebase/`** alongside
  `backup.js` — deliberate deviation from the usual `components/` or
  `tabs/` tree because they are so tightly coupled to the backup
  engine.
- **Prefixes** — `rds-*` for mobile sheet, `rdc-*` for desktop
  calendar, `cwv-*` for planner CalendarWeekView. No overlap so the
  planner and the diff view never fight each other.
- **Week navigation in the desktop diff** jumps only through weeks
  that have diff data — unaffected weeks are skipped entirely.

## Key file locations

```
packages/dashboard/src/firebase/backup.js                 # unchanged from Session A
packages/dashboard/src/firebase/RestoreDiffSheet.jsx      # now a router; mobile body preserved inside
packages/dashboard/src/firebase/RestoreDiffSheet.css      # unchanged from Session A
packages/dashboard/src/firebase/RestoreDiffCalendar.jsx   # NEW — 181 lines, desktop calendar diff
packages/dashboard/src/firebase/RestoreDiffCalendar.css   # NEW — 131 lines, desktop calendar styles
packages/dashboard/src/tabs/DataBackupSection.jsx         # unchanged; still mounts one <RestoreDiffSheet>
packages/dashboard/package.json                           # 0.28.0
packages/shared/package.json                              # 0.28.0
packages/te-extractor/package.json                        # 0.28.0
```
