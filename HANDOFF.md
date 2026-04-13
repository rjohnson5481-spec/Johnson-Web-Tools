# HANDOFF — Session ending 2026-04-13 (fourth session)

## What was completed this session

### Fix 1 — 504 Timeout: per-function config + netlify.toml backup

- `netlify/functions/te-extractor.json` created: `{ "timeout": 300 }`
- `netlify/functions/parse-schedule.json` created: `{ "timeout": 300 }`
- `netlify.toml`: added `[functions] timeout = 300` block after `[build]`

Per-function JSON files are the more reliable mechanism; the toml block is a
belt-and-suspenders backup. Both set a 5-minute timeout.

### Fix 2 — 500 on large files: client-side base64 size gate

- `packages/te-extractor/public/app.js`: after reading base64 in step 2 of
  `runExtraction()`, block if `base64.length > 8_000_000` before the API call
- Shows the trimmer panel (same as the page-count guard above it) so the user
  can immediately trim to a smaller range
- Error message: "This PDF is too large to process in one request. Please upload
  a smaller section — ideally under 50 pages — and try again."

---

## Current state

All committed and pushed to main. Netlify deploying.

---

## What to do first next session

1. Test extraction end-to-end with a real TE PDF:
   - Small file (< 6 MB raw): should complete within timeout now
   - Large file (> ~6 MB raw): should show the size-gate error and display the
     trimmer panel before making any API call

2. If extraction still times out on normal-sized files, the Netlify function
   timeout config may not be taking effect — check Netlify dashboard under
   Functions → Settings to confirm 300s is showing.

3. Remove the `console.log` in `callAPI()` once extraction is confirmed working.

4. Smoke-test planner at /planner/ — confirm import wipe fix (8dc3b64) still
   works: import second PDF with toggle OFF, existing done/note data preserved.

5. reward-tracker: still needs migrating into monorepo structure.

---

## Known incomplete / not started

- reward-tracker: not migrated
- Academic Records: coming-soon placeholder only
- CLAUDE.md Layout section still says "2 rows, total 80px" — should be
  "3 rows, total 132px"
- Console.log in callAPI() should be removed once 400/504 issues are confirmed
  resolved
