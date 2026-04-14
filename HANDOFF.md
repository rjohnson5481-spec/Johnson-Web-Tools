# HANDOFF — Session 17 (shell migration complete)

## What was completed this session

### Shell migration — planner + reward tracker embedded in dashboard

Four commits landed:

**1. Deps audit (6908b73)**
- Dashboard package.json already had all deps from planner and reward-tracker.
- No changes needed. Commit documents this explicitly.

**2. Planner source migrated (bddc407)**
- `packages/planner/src/` copied verbatim to `packages/dashboard/src/tools/planner/`
- All internal relative imports unchanged (folder structure preserved 1:1)
- Two import path fixes:
  - `Header.jsx` + `SettingsSheet.jsx`: `../../package.json` → `../../../../package.json`
    (now correctly resolves to packages/dashboard/package.json for version string)
- One CSS integration fix in `tools/planner/components/PlannerLayout.css`:
  - `.planner-action-bar`: `bottom: 0` → `bottom: 56px` (lifts above bottom nav)
  - `padding: 10px 14px env(safe-area-inset-bottom, 10px)` → `padding: 10px 14px`
  - `.planner-main`: padding-bottom `90px` → `146px` (90 + 56 for nav)
  - Desktop `.planner-main`: `100px` → `156px`

**3. Reward tracker source migrated (69f61ba)**
- `packages/reward-tracker/src/` copied verbatim to `packages/dashboard/src/tools/reward-tracker/`
- No import fixes needed — no package.json version imports
- No CSS fixes needed — no fixed action bar; shell-content padding-bottom handles clearance

**4. Tabs wired (ed583e9)**
- `PlannerTab.jsx`: full hook wiring (useAuth, useWeek, useSubjects, usePdfImport,
  usePlannerUI, useSettings) → renders PlannerLayout. No auth redirect (shell handles it).
- `RewardsTab.jsx`: seedIfNeeded + RewardLayout. seeded state preserved.
- Build verified: `npm run build --workspace=packages/dashboard` → 114 modules, 0 errors.

---

## What is currently incomplete / pending

1. **NEXT SESSION — Retire original packages**
   - `packages/planner` and `packages/reward-tracker` still exist as fallbacks.
   - Once Rob confirms the shell tabs work in production, retire those packages:
     - Remove from root `package.json` workspaces (or keep but stop building)
     - Update `netlify.toml` to remove `/planner/*` redirect (planner now lives at `/`)
     - Update `netlify.toml` to remove `/reward-tracker/*` redirect
   - DO NOT retire until production is confirmed working.

2. **HomeTab — replace tool cards with morning summary**
   - Currently still shows the old tool card grid.
   - Once planner + rewards are tabs in the shell, the tool cards for those are redundant.
   - Replace with morning summary: today's date, which student's day it is, point balances.

3. **Dark mode + sign-out missing from shell home**
   - The old dashboard Header had dark mode toggle + sign-out button.
   - Those are now only accessible within each tool's own header (planner settings, reward header).
   - HomeTab needs accessible dark mode toggle and sign-out. Options: small icon row at top of
     HomeTab, or a settings sheet. Confirm approach with Rob.

4. **Chunk size warning**
   - Build warns that the JS bundle is >500 KB. This is expected with both tools merged.
   - Not a blocker. Address with code-splitting (dynamic imports) if load time is a concern.

5. **Planner /planner/ URL still active**
   - `packages/planner` still builds to `dist/planner/` and Netlify serves it at `/planner/`.
   - Until we retire that package, the old planner URL still works.
   - Dashboard Planner tab and `/planner/` are independent until retirement.

6. **Import merge bug (planner)** — `calm-whistling-clock.md` plan still unexecuted.
   The console.log diagnostic was never added. Debug in the shell tab if Rob still sees it.

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md (standard)
2. Test the shell in production — confirm Planner tab and Rewards tab both work
3. If confirmed: retire `packages/planner` and `packages/reward-tracker`
   - Remove from root package.json workspaces (or leave + skip build)
   - Update netlify.toml redirect rules
4. Replace HomeTab tool cards with morning summary content
5. Address dark mode + sign-out on HomeTab

---

## Decisions made this session (update CLAUDE.md after confirming shell works)

### App shell file structure (to add to CLAUDE.md after confirmation)
```
packages/dashboard/src/
├── tools/
│   ├── planner/          ← copy of packages/planner/src/ + CSS nav fixes
│   └── reward-tracker/   ← copy of packages/reward-tracker/src/
├── tabs/
│   ├── PlannerTab.jsx    ← full hook wiring, renders tools/planner PlannerLayout
│   ├── RewardsTab.jsx    ← seed + renders tools/reward-tracker RewardLayout
│   ├── HomeTab.jsx       ← tool card grid (to be replaced with morning summary)
│   └── AcademicRecordsTab.jsx
```

### Planner action bar in shell
When planner is embedded in the shell, the action bar must be at `bottom: 56px`
(not `bottom: 0`) to sit above the bottom nav. This is in `tools/planner/components/PlannerLayout.css`.
The original `packages/planner/src/components/PlannerLayout.css` remains unchanged.
