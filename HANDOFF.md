# HANDOFF — v1.0.3

## What was completed this session
- Removed the `[build]` block from `netlify.toml`. Both Netlify sites
  (rewards + tools) now take their base directory, build command, and
  publish path from the Netlify dashboard rather than the repo —
  previously the hardcoded rewards build was being forced on the tools
  site too. The SPA redirect rule stays.
- Bumped `shared`, `rewards`, `tools` from 1.0.2 → 1.0.3.

## What is broken or incomplete
- Each Netlify site's dashboard build settings must now be correct on
  their own:
  - Rewards site: base `packages/rewards`, build `npm run build`,
    publish `packages/rewards/dist`.
  - Tools site: base `packages/tools`, build `npm run build`,
    publish `packages/tools/dist`.
- Firebase console rules still need to be published manually by Rob
  (copy `firestore.rules` into Firebase → Firestore → Rules → Publish).
- TE Extractor signed-out redirect still points at `/` (self-loop) —
  carried over, not addressed this session.
- `npm install` has not been run locally against the workspace.

## Next session must start with
1. Read CLAUDE.md and HANDOFF.md
2. Confirm on main, pull latest
3. Ask Rob what we are working on today

## Key files changed this session
- `netlify.toml` — dropped `[build]` block; only the SPA redirect remains
- `packages/shared/package.json`, `packages/rewards/package.json`,
  `packages/tools/package.json` — version 1.0.2 → 1.0.3
