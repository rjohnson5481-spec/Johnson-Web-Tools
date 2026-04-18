# HANDOFF — v0.27.1 Streamlined Parse→Review→Publish Flow

## What was completed this session

2 code commits + this docs commit on `main`:

```
09b683b chore: bump to v0.27.1
e9428ae feat: streamline import to Parse→Review→Publish flow (v0.27.1)
```

### Commit 1 — Streamlined flow (`e9428ae`)

**UploadSheet.jsx (149→109 lines):**
- Auto-trigger diff when parse completes: `useEffect` fires `onApply(result, setDiff)` when `result` arrives, with `triggered` ref to prevent double-fire.
- Removed intermediate "Review Changes" button — diff appears automatically after parse.
- Removed the parsed result preview block (day-grouped lesson list) — no longer shown since diff replaces it.
- Renamed: "Import" → **Parse**, "Confirm Import" → **Publish**, "Applied" → **Published**.
- Shows "Comparing with existing…" spinner during diff comparison.
- `reviewing` state tracks the diff comparison phase.

**ImportDiffPreview.jsx (49→45 lines):**
- Removed `onCancel`/`onConfirm` props and the inline action buttons — UploadSheet footer handles Cancel/Publish.

### Commit 2 — Version bump (`09b683b`)
0.27.0 → **0.27.1** across all 3 packages.

Build green. PlannerLayout.jsx not touched (still 353 lines).

---

## Import flow (v0.27.1)

1. Pick file → **Parse** button
2. Parse → spinner → "Comparing with existing…" spinner
3. Diff preview with NEW/CHANGED/UNCHANGED badges
4. **Publish** → writes only new + changed cells → success

---

## File-size report

| File | Lines |
|---|---|
| `UploadSheet.jsx` | 109 |
| `ImportDiffPreview.jsx` | 45 |

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md.
2. Smoke test: pick PDF → Parse → auto-diff → Publish.
3. Priority: split PlannerLayout.jsx (353 lines).

## Key file locations

```
packages/dashboard/src/tools/planner/components/
├── UploadSheet.jsx                          # 149 → 109
└── ImportDiffPreview.jsx                    # 49 → 45
```
