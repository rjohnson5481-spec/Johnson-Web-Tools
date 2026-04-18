# HANDOFF — v0.25.1 Desktop Calendar: Selection + Drag-and-Drop

## What was completed this session

2 code commits + this docs commit on `main`:

```
99781f6 chore: bump to v0.25.1
374407b feat: add card selection and drag-and-drop between day columns (v0.25.1)
```

### Commit 1 — Selection + DnD (`374407b`)

**@dnd-kit/core 6.3.1** installed as exact version dependency.

**CalendarWeekView.jsx (92→159 lines):**
- Click a lesson card to toggle selection (gold border + tint). Done cards excluded.
- Selection pill in top bar: "{N} selected · drag to move ✕ clear".
- Click grid background clears selection. Double-click opens EditSheet.
- `DndContext` with `PointerSensor` (8px activation distance).
- `DraggableCard` wrapper: entire card is drag handle. Dragged cards go opacity 0.4.
- `DroppableColumn` wrapper: each day column body is a drop target.
- Multi-select drag: if dragged card is in selection, ALL selected cards move.
- Drop on same column = no-op. After successful move, selection clears.
- `onMoveCell(fromDay, subject, toDay)` prop called for each card to move.

**CalendarWeekView.css (92→110 lines):**
- `.cwv-card.selected` — 1.5px solid #c9a84c border + rgba gold tint.
- `.cwv-sel-check` — gold checkmark replacing subject dot when selected.
- `.cwv-sel-pill` / `.cwv-sel-clear` — selection count pill in top bar.

**PlannerLayout.jsx (336→347 lines):**
- Import `readCell`, `updateCell`, `deleteCell` from `firebase/planner.js`.
- `handleMoveCell(fromDay, subject, toDay)`: reads cell data, writes to target day, deletes from source.
- Passes `onMoveCell={handleMoveCell}` to CalendarWeekView.

### Commit 2 — Version bump (`99781f6`)
0.25.0 → **0.25.1** across all 3 packages.

Build green at every commit. Mobile completely untouched.

---

## File-size report

| File | Lines |
|---|---|
| `CalendarWeekView.jsx` | 159 |
| `CalendarWeekView.css` | 110 |
| `PlannerLayout.jsx` | 347 |

**Warning**: PlannerLayout.jsx at 347 lines. Needs split before any further additions.

---

## What is currently incomplete / pending

- **Browser smoke test** — not run. Walk:
  - Desktop: click a lesson card → gold border + selection pill appears.
  - Click another card → both selected. Click selected card → deselects.
  - Done cards: click does nothing (no selection).
  - Click empty grid area → clears selection.
  - Double-click card → EditSheet opens.
  - Drag a card to another day column → lesson moves to that day.
  - Drag a selected card when multiple selected → all selected cards move.
  - Drop on same column → nothing happens.
  - Mobile: completely unchanged — no DnD, no selection.

- **Not built yet:**
  - Within-day reordering (Session 3)
  - Drag overlay (ghost card while dragging)
  - PlannerLayout.jsx split (347 lines)
  - After move, CalendarWeekView data doesn't auto-refresh (needs `loadWeekDataFrom` re-trigger)

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md.
2. Smoke test selection + drag-and-drop on desktop.
3. Fix: after a move, the calendar grid may need a data refresh trigger.
4. Next: within-day reordering, or PlannerLayout split.

## Key file locations

```
packages/dashboard/
├── package.json                                          # v0.25.1 + @dnd-kit/core
├── src/tools/planner/components/
│   ├── CalendarWeekView.jsx                              # 92 → 159
│   ├── CalendarWeekView.css                              # 92 → 110
│   └── PlannerLayout.jsx                                 # 336 → 347
packages/shared/package.json                              # v0.25.1
packages/te-extractor/package.json                        # v0.25.1
```
