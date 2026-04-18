# HANDOFF — v0.26.0 Data & Backup in Settings

## What was completed this session

3 code commits + this docs commit on `main`:

```
73e41d4 chore: bump to v0.26.0
51679e1 feat: Data & Backup section in Settings
0b0b1e1 feat: backup export/import/restore logic (v0.26.0)
```

### Commit 1 — backup.js (`0b0b1e1`, 166 lines)

**firebase/backup.js** — pure Firestore logic, no UI:
- `exportAllData(uid)`: reads all 13 collections (settings, presets, weeks with nested days/subjects, sickDays, rewardTracker with nested log, schoolYears with nested quarters/breaks, courses, enrollments, grades, reportNotes, activities, savedReports). Returns JSON-serializable object with version + timestamp.
- `downloadBackup(uid)`: calls export, triggers browser download as `ironlight-backup-{date}.json`.
- `importMerge(uid, backup)`: writes only documents that don't already exist (non-destructive). Returns `{ imported, skipped }`.
- `importFullRestore(uid, backup)`: deletes ALL existing user data across all collections (including nested subcollections), then writes every document from backup. Returns `{ restored }`.

### Commit 2 — DataBackupSection (`51679e1`)

**DataBackupSection.jsx** (119 lines) + **DataBackupSection.css** (36 lines):
- Export Backup: gold button, "Exporting..." → "Done ✓" for 2 seconds.
- Import & Merge: file picker, parses JSON, shows "Imported N, skipped N" result.
- Full Restore: two-step confirmation — first modal warns about permanent deletion, second modal requires typing "RESTORE". Only then opens file picker. Shows result + Reload button.
- Modal: fixed overlay, centered card, Ink & Gold styling.

**SettingsTab.jsx** (232→234 lines): imports and renders `<DataBackupSection uid={uid} />` below App section.

### Commit 3 — Version bump (`73e41d4`)
0.25.5 → **0.26.0** across all 3 packages.

Build green at every commit.

---

## File-size report

| File | Lines |
|---|---|
| `firebase/backup.js` | 166 |
| `tabs/DataBackupSection.jsx` | 119 |
| `tabs/DataBackupSection.css` | 36 |
| `tabs/SettingsTab.jsx` | 234 |

---

## What is currently incomplete / pending

- **Browser smoke test** — not run. Walk:
  - Settings → Data & Backup section visible below App.
  - Export: downloads JSON file with all data.
  - Import & Merge: select backup JSON → imports missing items, reports count.
  - Full Restore: two confirmations → select JSON → replaces all data → reload.
  - Backup file includes all planner weeks, grades, reports, activities, etc.

- **Carry-overs:**
  - PlannerLayout.jsx at 347 lines (needs split).
  - Saved report PDFs are NOT included in backup (Storage binaries excluded, only Firestore metadata).

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md.
2. Smoke test backup export/import/restore.
3. Test: export → full restore → verify all data round-trips.

## Key file locations

```
packages/dashboard/src/
├── firebase/
│   └── backup.js                          # NEW — 166
└── tabs/
    ├── SettingsTab.jsx                     # 232 → 234
    ├── DataBackupSection.jsx              # NEW — 119
    └── DataBackupSection.css              # NEW — 36
```
