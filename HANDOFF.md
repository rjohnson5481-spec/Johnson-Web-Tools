# HANDOFF — Session ending 2026-04-14 (netlify redirect fix, v0.21.2)

## What was completed this session

### Fix ✅ — reward-tracker SPA redirect corrected in netlify.toml (commit 803c920)
The `/reward-tracker/*` redirect block existed in netlify.toml but was positioned
**below** `/planner/*`, which caused Netlify to fall through to the `/*` catch-all
and serve the dashboard instead. Moved the reward-tracker block above `/planner/*`.

Final redirect order in netlify.toml:
1. `/api/*` → Netlify Functions
2. `/te-extractor/*` → te-extractor/index.html
3. `/reward-tracker/*` → reward-tracker/index.html  ← fixed position
4. `/planner/*` → planner/index.html
5. `/*` → index.html (dashboard catch-all)

---

## What to do first next session

### 1. Verify reward-tracker in production
After Netlify deploy:
1. Open `/reward-tracker/` — confirm it loads the reward tracker, not the dashboard
2. Orion shows 50 pts, Malachi shows 60 pts on first load
3. Award, Deduct, Spend sheets open and write to Firestore
4. Log button opens log page with entries
5. Back button returns to main screen

### 2. Add reward-tracker tile to dashboard
CLAUDE.md rule: "When adding a new tool, add it to the dashboard first." This was
skipped to build the tool first (Rob's instruction). Dashboard tile should be added.

### 3. Firestore security rules
Ensure rules allow reads/writes to `/users/{uid}/rewardTracker/**`.

### 4. Planner — import sheet preview weekId label (cosmetic)
"Week of Apr 14" displays pre-normalized weekId. Fix in UploadSheet.jsx or
PlannerLayout.jsx — run weekId through `mondayWeekId()` before displaying in preview.

### 5. Verify Firestore security rules for te-extractor (session 9 item — still unchecked)
Confirm rules allow reads/writes to `/users/{uid}/teExtractor/extractions/items/{docId}`.

---

## Known incomplete / not started

- reward-tracker dashboard tile not yet added
- Subject count badges in desktop sidebar DayStrip NOT implemented
- Academic Records: coming-soon placeholder only
- app.js in te-extractor ~970+ lines — violates 300-line limit
