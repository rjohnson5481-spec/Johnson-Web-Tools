# HANDOFF — v1.0.0 Initial split from Home-School-Planner

## What was completed this session
- Repo stripped from planner seed to rewards + tools packages only
- `packages/rewards` — reward tracker PWA, opens straight to dashboard
- `packages/tools` — TE Extractor PWA, base `/`, standalone at new domain
- `packages/shared` — updated for johnson-web-tools Firebase project
  (renamed to `@johnson-web-tools/shared`, added `useDarkMode` hook)
- `netlify.toml` configured for rewards as default build
- Old `packages/dashboard` and `packages/te-extractor` deleted entirely

## What is broken or incomplete
- Netlify sites not yet created — Rob to set up two sites manually
  (one for rewards, one for tools)
- Environment variables not yet added to Netlify — Rob to add
  `VITE_FIREBASE_*` to both sites, and `VITE_ANTHROPIC_API_KEY` to tools
- First deploy not yet confirmed
- `tools` package needs its own separate Netlify site (root `netlify.toml`
  currently only wires up the rewards build)
- TE Extractor still redirects signed-out users to `/` — now that tools
  is standalone, `/` is itself. Rob to decide: add an inline sign-in UI,
  or redirect to `rewards.grasphislove.com` for sign-in.
- No `npm install` has been run on the new workspace layout — unverified

## Next session must start with
1. Read CLAUDE.md and HANDOFF.md
2. Confirm on main, pull latest
3. Ask Rob what we are working on today

## Key files changed this session
- `packages/rewards/` — new PWA package
  - `src/App.jsx`, `src/main.jsx`, `src/App.css`
  - `src/components/SignIn.jsx` + `.css`
  - `src/tools/reward-tracker/` (moved from old dashboard)
  - `vite.config.js`, `package.json`, `index.html`
- `packages/tools/` — renamed from `te-extractor`
  - `vite.config.js` (base `/`, added PWA plugin)
  - `public/manifest.json` (name "Tools App")
  - `public/index.html` + `public/sw.js` (rewrote `/te-extractor/` paths)
  - `package.json` (scoped name + version)
- `packages/shared/`
  - `package.json` (renamed to `@johnson-web-tools/shared`, v1.0.0)
  - `src/index.js` (exports `useDarkMode`)
  - `src/hooks/useDarkMode.js` (new — moved from dashboard)
- `package.json` (workspaces list)
- `netlify.toml` (rewritten for rewards build)
- `CLAUDE.md` (new — replaces retired planner version)
- `HANDOFF.md` (this file)

## Deleted this session
- `packages/dashboard/` entirely
- `packages/te-extractor/` (renamed to `packages/tools/`)
- `netlify/functions/parse-schedule.{js,json}`
- `netlify/functions/scheduled-backup.js`
- `CLAUDE-DESIGN.md`, `CLAUDE-HISTORY.md` (old planner docs)
