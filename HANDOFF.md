# HANDOFF — v0.29.1 Friday coming-soon promoted to modal

## What was completed this session
- FridayComingSoonSheet — new modal with dark #22252e header,
  Coming Soon title, body text, and a single gold "Got it"
  button. Styled to match SickDaySheet (same overlay, handle,
  header padding, border-radius, footer).
- useSickDay now tracks showFridayComingSoon + exposes
  handleFridayComingSoonDismiss. The 5-second auto-dismiss
  timer and the inline toast are gone.
- PlannerLayout renders FridayComingSoonSheet when
  showFridayComingSoon is true (no toast JSX, no inline
  styles). Layout is back to 252 lines.
- Version bump to v0.29.1.

## What is broken or incomplete
- Netlify Blobs auto-backup fix (v0.28.6) is deployed but
  unverified — confirm a backup appears in the Blobs store
  after the next scheduled run (or invoke the function
  manually)
- PlannerTab.jsx still destructures sickDayIndices from
  useSubjects (now undefined) and passes a dead sickDayIndices
  prop to PlannerLayout. Harmless — clean up on the next
  PlannerTab touch.
- Month view is the queued feature that will also ship proper
  Friday sick-day handling (move-to-next-Monday etc). Do not
  re-add FridayOverflowSheet in the meantime.

## Next session must start with
1. Read CLAUDE.md and HANDOFF.md
2. Confirm on main, pull latest
3. Ask Rob what we are building today

## Key files changed recently
- packages/dashboard/src/tools/planner/components/FridayComingSoonSheet.jsx (new)
- packages/dashboard/src/tools/planner/components/FridayComingSoonSheet.css (new)
- packages/dashboard/src/tools/planner/hooks/useSickDay.js
- packages/dashboard/src/tools/planner/components/PlannerLayout.jsx
- packages/dashboard/package.json
- packages/shared/package.json
- packages/te-extractor/package.json
- CLAUDE.md
