# HANDOFF — v0.27.8 Full Restore Cleans Live Firestore

## What was completed this session

2 code commits + this docs commit on `main`:

```
39921b3 chore: bump version to v0.27.8
6b91c6f fix: full restore deletes live Firestore data before write (v0.27.8)
```

### Commit 1 — Full Restore weeks delete uses `collectionGroup` (`6b91c6f`)
File: `packages/dashboard/src/firebase/backup.js` (`importFullRestore`)

**Bug:** A Friday with 3 subjects in the backup was ending up with 6 subjects after Full Restore. The 3 extras were leftover subject docs from a sick-day cascade that the delete phase never touched.

**Root cause:** The old delete walk did
```js
getDocs(collection(db, `${base}/weeks`))
  → for each week: getDocs(collection(db, `${base}/weeks/${w.id}/students`))
    → for each student / dayIndex: deleteCol(.../subjects)
```
But `weeks/{weekId}`, `weeks/{weekId}/students/{name}`, and `.../days/{di}` are all **ghost path segments** in this app — there are no real docs at those paths, only the leaf `subjects/{subject}` docs. A plain `collection()` walk over the parent paths returns an empty snapshot, so the inner loop never ran for any week and no subject docs were deleted. The write phase then `setDoc`'d the backup's subjects on top of whatever was already there.

**Fix:** Replace the nested-collection walk with a `collectionGroup('subjects')` query (already imported, already used in `exportAllData` for the same reason). Filter the returned docs by the `users/{uid}/weeks/` prefix and `deleteDoc` each one in parallel via `Promise.all`. This deletes *every* live subject doc under the user — including ones not in the backup file — before the write phase begins.

Diff is +13 / −7 lines, contained to the weeks delete block. Everything else in `importFullRestore` (sickDays / courses / enrollments / grades / reportNotes / activities / savedReports / subjectPresets / schoolYears+quarters+breaks / rewardTracker+log delete passes, and the entire write phase) is unchanged.

### Commit 2 — Version bump (`39921b3`)
0.27.7 → **0.27.8** across all 3 packages (dashboard, shared, te-extractor).

---

## Known surviving gaps in Full Restore (carried over from v0.27.7 diagnostic, unchanged this session)

These are NOT addressed by this fix — flagging for future sessions:

- **`settings/students`** — never explicitly deleted; only overwritten when the backup contains it. If a backup file is missing `students`, the pre-restore students doc survives.
- **Anything in `settings/` other than the `students` doc** — never touched at all.
- **Collections not listed in the delete phase** — e.g. TE Extractor's `teExtractor/` tree, the legacy `subjectLists/` orphans called out in CLAUDE.md, and any future collection added without updating this file. Not cleared, not restored.

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md.
2. Smoke test: open Settings → Data Backup, run Full Restore from a known-good backup file. Verify the post-restore subject counts match the backup file exactly (no leftover sick-day cascade docs surviving on Fridays or any other day).
3. Decide whether to also harden `settings/students` deletion and other listed gaps above.

## Key file locations

```
packages/dashboard/src/firebase/backup.js      # importFullRestore weeks-delete now uses collectionGroup
packages/dashboard/package.json                # 0.27.8
packages/shared/package.json                   # 0.27.8
packages/te-extractor/package.json             # 0.27.8
```
