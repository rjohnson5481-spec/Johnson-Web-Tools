# HANDOFF — Session ending 2026-04-14 (eighth session)

## What was completed this session

### TE Extractor v0.20.4 — Firebase Auth, Firestore history, progress indicator

All changes on main. 4 commits + version bump + CLAUDE.md + HANDOFF.

**Step 1 — Firebase Auth CDN (commit dd4b075)**
- Added inline `<script type="module">` in index.html that imports Firebase 10.11.0 from CDN
- Config values use Vite's `%VITE_FIREBASE_*%` HTML replacement (replaced at build time from Netlify env vars)
- Exposes `window.__teAuth`, `window.__teDb`, `window.__teUid`, `window.__teFirestore` on window
- `onAuthStateChanged`: redirects to `/` if not signed in; dispatches `te-auth-ready` event when authenticated
- Firebase script placed before app.js in HTML

**Step 2 — Firestore extraction history (commit a96965f)**
- Session Log tab updated: subtitle changed to "saved across all sessions", loading spinner while fetching
- `state.history` replaces `state.sessionLog` — persisted to Firestore
- Firestore path: `/users/{uid}/teExtractor/extractions/items/{docId}`
- Fields stored: `fileName`, `lessons`, `html`, `previewText` (200 chars, tags stripped), `createdAt` (serverTimestamp)
- Optimistic local update first, then Firestore save (non-blocking — extraction doesn't fail if Firestore fails)
- On auth-ready: loads history with getDocs, renders immediately
- Per-entry actions: Open (new tab), Download, Delete (from Firestore + local state)
- Empty state: "No extractions yet. Extract your first lesson to get started."
- `formatDate()` added for cross-session date display

**Step 3 — Extraction progress indicator (commit 5663d36)**
- Gold animated progress bar below the Extract button (shown during API call)
- Rotating status messages every 5 seconds: "Scanning PDF…", "Extracting questions…", "Building HTML…", "Almost done…"
- Elapsed time counter (right-aligned, bold)
- Progress bar fills 0→90% over 90 seconds (never reaches 100% until `stopProgress()` clears it)
- Starts at top of `runExtraction()`, stops in finally block (on success OR error)

**Version + CLAUDE.md (this commit)**
- VERSION bumped to 0.20.4 in app.js and package.json
- CLAUDE.md updated: system prompt note updated (removed green color note, added Ink & Gold note), added Firebase CDN pattern section documenting the window globals, auth flow, and Firestore path

---

## CRITICAL — must verify before first use

1. **Firebase CDN script requires Netlify env vars at build time:**
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
   These should already be set (planner uses them), but if the TE Extractor redirects to `/` on load,
   confirm these vars are set in Netlify → Site configuration → Environment variables.

2. **Firestore security rules** — confirm the rules allow reads/writes to:
   `/users/{uid}/teExtractor/extractions/items/{docId}`
   The planner's existing rules may not cover the `teExtractor` subcollection path.
   Check Firebase Console → Firestore → Rules and add if needed:
   ```
   match /users/{uid}/teExtractor/extractions/items/{docId} {
     allow read, write: if request.auth.uid == uid;
   }
   ```

---

## Current state

Committed and pushed to main. Netlify deploying.

---

## What to do first next session

1. Test the v0.20.4 changes end-to-end:
   - Open /te-extractor/ — should redirect to / if not signed in, or load normally if signed in
   - Session Log tab: should show loading spinner, then empty state (or existing history if prior extractions exist)
   - Run an extraction: progress bar appears, rotates messages, shows elapsed time
   - After extraction: Session Log shows the entry with Open/Download/Delete actions
   - Delete an entry: confirm it disappears from Firestore and local state
   - Reload page: confirm history re-loads from Firestore

2. Check Firestore security rules (see CRITICAL above)

3. Planner smoke-test (still pending):
   - Import second PDF with toggle OFF — existing done/note data should be preserved

4. reward-tracker: still needs migrating into monorepo structure.

---

## Known incomplete / not started

- reward-tracker: not migrated
- Academic Records: coming-soon placeholder only
- CLAUDE.md Layout section still says "2 rows, total 80px" — should be "3 rows, total 132px"
- app.js is ~970+ lines — violates the 300-line hard limit; should be split into modules
  (extraction logic, history, debug log, progress, PDF splitter are natural seams)
- The `historyOpen()` function falls back to `state.history[0]` if id not found — this is a
  code smell; entries without IDs (optimistic before Firestore save completes) can't be opened
  until the docRef.id is backfilled. Consider disabling Open button until ID is confirmed.
