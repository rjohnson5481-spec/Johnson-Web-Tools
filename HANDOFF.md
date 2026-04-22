# HANDOFF — v0.29.3 Extract SickDayManager from PlannerLayout

## What was completed this session
- SickDayManager.jsx — new pure-render component that owns
  the three sick-day sheets (SickDaySheet, UndoSickSheet,
  FridayComingSoonSheet). No state, no Firestore, no effects;
  all props flow through from PlannerLayout.
- PlannerLayout.jsx dropped the three direct sheet imports +
  the three conditional render blocks, replaced with a single
  <SickDayManager /> instance. Behavior identical.
- PlannerLayout.jsx is now at 250 lines (at the target, down
  from 256). SickDayManager.jsx is 44 lines.
- Version bump to v0.29.3.

## What is broken or incomplete
- Netlify Blobs auto-backup fix (v0.28.6) is deployed but
  unverified — confirm a backup appears in the Blobs store
  after the next scheduled run (or invoke the function
  manually).
- PlannerTab.jsx still destructures sickDayIndices from
  useSubjects (now undefined) and passes a dead sickDayIndices
  prop to PlannerLayout. Harmless — clean up on the next
  PlannerTab touch.
- Month view is the queued feature that will ship proper
  Friday sick-day handling (move-to-next-Monday etc). Until
  then FridayComingSoonSheet is a hard delete.

## Next session must start with
1. Read CLAUDE.md and HANDOFF.md
2. Confirm on main, pull latest
3. Ask Rob what we are building today

## Key files changed recently
- packages/dashboard/src/tools/planner/components/SickDayManager.jsx (new)
- packages/dashboard/src/tools/planner/components/PlannerLayout.jsx
- packages/dashboard/package.json
- packages/shared/package.json
- packages/te-extractor/package.json
- CLAUDE.md
