# HANDOFF — v1.0.4

## What was completed this session
- Added a React Dashboard shell to the tools package:
  - `/` now renders `App.jsx` → SignIn (when signed out) or Dashboard
    (when signed in). No more redirect loop.
  - Dashboard has the Ink & Gold header (logo, school name, "Tools App"
    subtitle), gear icon placeholder (no-op), one TE Extractor card
    with "Launch →" button, and a red-outlined Sign Out at the bottom.
  - Launch button hard-navigates to `/te-extractor/`.
- Relocated the vanilla TE Extractor:
  - `packages/tools/public/*` → `packages/tools/te-extractor/*`
  - Vite now does a multi-page build (React at `/`, vanilla at
    `/te-extractor/`); both HTML entries still get `VITE_*` env var
    substitution at build time.
  - Updated SW registration path/scope to `/te-extractor/sw.js` and
    `/te-extractor/`, navigation-fallback cache key to
    `/te-extractor/index.html`, and manifest `start_url`/`scope` to
    `/te-extractor/`.
- Hardened the TE Extractor sign-out: `window.location.replace('/')`
  instead of `href = '/'` so Back-button cannot bounce into a signed-out
  TE Extractor URL.
- Added React deps (`react`, `react-dom`, `firebase`, `@vitejs/plugin-react`,
  `@johnson-web-tools/shared`) to `packages/tools/package.json`.
- Bumped `shared`, `rewards`, `tools` from 1.0.3 → 1.0.4.
- CLAUDE.md reflects the new tools tree and routing.

## What is broken or incomplete
- Tools Netlify site needs its dashboard build settings verified:
  base `packages/tools`, build `npm run build`, publish
  `packages/tools/dist`. After this session the build produces BOTH
  `dist/index.html` (React) and `dist/te-extractor/index.html` (vanilla).
- Tools package now has React deps — Rob will need to run `npm install`
  at the repo root before the tools site builds locally/on Netlify.
- The gear icon on the Tools Dashboard is a placeholder (no onClick
  behavior yet). Rob to decide what Settings means for the tools app.
- Firebase console rules still need manual publish by Rob.
- `npm install` has not been run against the new workspace locally.
- `useDarkMode` is called from tools `App.jsx` but there is no UI to
  toggle the mode yet — it only honors a previously-saved preference.

## Next session must start with
1. Read CLAUDE.md and HANDOFF.md
2. Confirm on main, pull latest
3. Ask Rob what we are working on today

## Key files changed this session
- `packages/tools/index.html` — new React app entry at root
- `packages/tools/src/main.jsx`, `App.jsx`, `App.css` — new React shell
- `packages/tools/src/Dashboard.jsx`, `Dashboard.css` — new
- `packages/tools/src/components/SignIn.jsx`, `SignIn.css` — new
- `packages/tools/vite.config.js` — multi-page build, React plugin,
  shared alias
- `packages/tools/package.json` — React deps + version 1.0.4
- `packages/tools/te-extractor/*` — moved from `public/`, SW + manifest
  paths re-scoped to `/te-extractor/`; sign-out switched to `replace()`
- `packages/shared/package.json`, `packages/rewards/package.json` —
  version 1.0.4
- `CLAUDE.md` — tools tree + navigation section, stack updated
