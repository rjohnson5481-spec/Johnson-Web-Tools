# HANDOFF — Session 18 (cleanup + weekId display fix)

## What was completed this session

### 1. Retired packages/planner and packages/reward-tracker
- Deleted `packages/planner/` and `packages/reward-tracker/` directories entirely
- Updated root `package.json` workspaces from `["packages/*"]` glob to explicit list:
  `["packages/shared", "packages/dashboard", "packages/te-extractor"]`
- Removed `/planner/*` and `/reward-tracker/*` redirect blocks from `netlify.toml`
  (only `/api/*`, `/te-extractor/*`, and `/*` remain)
- Build verified clean after retirement

### 2. Fixed weekId display in import preview sheet
- `UploadSheet.jsx` was showing `result.weekId` raw (from AI response) without normalization
- AI can return a non-Monday date (e.g. "2026-04-14" Tue instead of "2026-04-13" Mon)
- Wrapped all three display sites with `mondayWeekId()` imported from `../constants/days.js`:
  - Success state: "Applied — jumped to week of …"
  - Preview meta: "Student · Week of …"
  - Per-day date headers in the lesson list
- `handleApply` left unchanged — PlannerLayout already normalizes via `mondayWeekId()` before writes

---

## What is currently incomplete / pending

1. **HomeTab — replace tool cards with morning summary**
   - Currently shows old tool card grid (links to /planner, /reward-tracker — now dead).
   - Replace with morning summary: today's date, which student's day it is, point balances.
   - The tool card links point to retired URLs. Fix or replace before next user-facing push.

2. **Dark mode + sign-out missing from shell HomeTab**
   - Dark mode toggle and sign-out are only accessible inside each tool's header.
   - HomeTab needs: dark mode toggle + sign-out. Options: small icon row, or a settings sheet.
   - Confirm approach with Rob.

3. **Chunk size warning**
   - JS bundle is 634 KB (>500 KB). Expected with both tools merged.
   - Address with dynamic imports if load time becomes a concern.

4. **Import merge bug (calm-whistling-clock.md plan)**
   - Rob reported second PDF import with "Replace existing schedule" OFF still overwrites data.
   - Plan at `/root/.claude/plans/calm-whistling-clock.md` has full diagnostic steps.
   - Step 1: add console.logs to UploadSheet, PlannerLayout, and useSubjects.
   - Waiting for Rob to confirm if still reproducible in the shell tab (not /planner/).

5. **CLAUDE.md netlify.toml section needs update**
   - CLAUDE.md still shows the old netlify.toml with `/planner/*` and `/reward-tracker/*` blocks.
   - Update to reflect current 3-redirect config.

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md (standard)
2. Confirm HomeTab tool card links are broken and replace with morning summary
3. Address dark mode + sign-out on HomeTab
4. If Rob reports import merge bug still present: follow calm-whistling-clock.md plan — add logs, push, share output, then fix
5. Update CLAUDE.md netlify.toml section

---

## Current netlify.toml (confirmed working)
```toml
[build]
  command = "npm install && npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/te-extractor/*"
  to = "/te-extractor/index.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Current root workspaces
```json
"workspaces": ["packages/shared", "packages/dashboard", "packages/te-extractor"]
```
