# HANDOFF — v0.29.2 Friday pre-confirm + allday cleanup on undo

## What was completed this session
- FridayComingSoonSheet now runs BEFORE the cascade. When
  Friday has any non-allday lesson, useSickDay parks the
  pending { selectedSubjects, sickDayIndex } in state and
  opens the sheet — no Firestore writes yet. Confirm Sick
  Day (gold primary) deletes Friday's lessons then runs the
  normal cascade + allday auto-write. Cancel (ghost button
  + backdrop tap) discards everything; Firestore is untouched.
- Undo Sick Day now clears the auto-written "Sick Day"
  allday event. handleUndoSickDay captures the sick-day
  index from sickDayIndices before the marker is cleared,
  then — only if the allday lesson label is exactly
  "Sick Day" — deletes that allday cell. A user-placed
  custom allday (any other label) is left alone.
- Sheet copy updated to "Friday's lessons will be deleted
  when this sick day is applied. A month view and improved
  sick day cascading is coming soon." Buttons: Cancel + Confirm Sick Day.
- Version bump to v0.29.2.

## What is broken or incomplete
- Netlify Blobs auto-backup fix (v0.28.6) is deployed but
  unverified — confirm a backup appears in the Blobs store
  after the next scheduled run (or invoke the function
  manually).
- PlannerTab.jsx still destructures sickDayIndices from
  useSubjects (now undefined) and passes a dead sickDayIndices
  prop to PlannerLayout. Harmless — clean up on the next
  PlannerTab touch.
- PlannerLayout.jsx is at 256 lines (over the 250 target,
  well under the 300 hard cap) — the extra confirm/dismiss
  prop pushed it a few lines over. Trim on the next
  PlannerLayout touch.
- Month view is the queued feature that will ship proper
  Friday sick-day handling (move-to-next-Monday etc). Until
  then the pre-confirm sheet is a hard delete — make sure
  the user understands the word "deleted" in the sheet copy.

## Next session must start with
1. Read CLAUDE.md and HANDOFF.md
2. Confirm on main, pull latest
3. Ask Rob what we are building today

## Key files changed recently
- packages/dashboard/src/tools/planner/hooks/useSickDay.js
- packages/dashboard/src/tools/planner/components/FridayComingSoonSheet.jsx
- packages/dashboard/src/tools/planner/components/FridayComingSoonSheet.css
- packages/dashboard/src/tools/planner/components/PlannerLayout.jsx
- packages/dashboard/package.json
- packages/shared/package.json
- packages/te-extractor/package.json
- CLAUDE.md
