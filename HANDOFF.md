# HANDOFF — v0.27.3 Add Missing @netlify/blobs Dependency

## What was completed this session

2 code commits + this docs commit on `main`:

```
53921cb chore: bump to v0.27.3
9825f28 fix: add @netlify/blobs dependency for scheduled backup (v0.27.3)
```

### Commit 1 — Fix (`9825f28`)
Added `"@netlify/blobs": "8.1.0"` to root package.json dependencies. Required by `scheduled-backup.js` for Netlify Blobs storage.

### Commit 2 — Version bump (`53921cb`)
0.27.2 → **0.27.3** across all 3 packages.

---

## What the next session should start with

1. Deploy to Netlify and verify scheduled-backup function deploys without import errors.
2. Trigger a test run to confirm backup writes to Blobs.

## Key file locations

```
/package.json                                  # +@netlify/blobs 8.1.0
```
