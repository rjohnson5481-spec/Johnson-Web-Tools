# HANDOFF — v0.26.3 Add Firestore Rules to Repo

## What was completed this session

1 code commit + this docs commit on `main`:

```
c400388 chore: add firestore.rules to repo (current live rules)
```

### Commit 1 — firestore.rules (`c400388`)

Created `firestore.rules` at repo root with the current live Firestore security rules:
- Users can only read/write their own data (`request.auth.uid == userId`).
- Collection group read rule on `subjects` allows the backup export `collectionGroup('subjects')` query.

No version bump — documentation-only commit.

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md.
2. Confirm backup export works in production with weeks data populated.

## Key file locations

```
/firestore.rules                           # NEW — 12 lines
```
