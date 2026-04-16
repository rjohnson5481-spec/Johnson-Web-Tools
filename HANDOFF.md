# HANDOFF — v0.23.5 Phase 2 Session 7: Breaks + Calendar Import

## What was completed this session

6 commits on `main` (+ this docs commit):

```
c368ea7 feat: wire CalendarImportSheet into Academic Records tab
1db19ed feat: add CalendarImportSheet for AI-powered break detection
6e59049 fix: attendance calculation subtracts break days
b5acf22 feat: add breaks UI to school year management sheets
2a20ea9 feat: add break management to useSchoolYears hook
b589294 feat: add school breaks to Firestore layer
```

### Commit 1 — Firestore layer for breaks (`b589294`)

**academics.js** (48 → 55 lines):
- Added `breaksCol(uid, yearId)` and `breakDoc(uid, yearId, breakId)` path builders.
- Updated data model comment to include breaks subcollection.

**academicRecords.js** (185 → 207 lines):
- Imported `breaksCol`, `breakDoc` from academics.js.
- Added `getBreaks(uid, yearId)` — reads all breaks for a school year, sorted by startDate.
- Added `saveBreak(uid, yearId, breakId, data)` — setDoc merge with updatedAt timestamp.
- Added `deleteBreak(uid, yearId, breakId)` — deleteDoc.
- All three follow the exact same pattern as the quarter functions.

### Commit 2 — useSchoolYears hook breaks (`2a20ea9`)

**useSchoolYears.js** (146 → 188 lines):
- `reload()` now fetches breaks alongside quarters in parallel (`Promise.all`) for each school year.
- School year tree shape: `{ id, label, startDate, endDate, quarters: [], breaks: [] }`.
- Added `addBreak(yearId, data)`, `updateBreak(yearId, breakId, data)`, `removeBreak(yearId, breakId)` — all three throw on missing uid, reload after write.
- Updated return object to expose all three break mutators.

### Commit 3 — Breaks UI in sheets (`b5acf22`)

**SchoolYearSheet.jsx** (125 → 152 lines):
- Added breaks list under each year block (below quarters), with section label "BREAKS" + trailing rule.
- Each break row shows label + date range + edit pencil button.
- Dashed "+ Add Break" button at bottom of each year's breaks.
- Added `onEditBreak` and `onAddBreak` props.

**SchoolYearSheet.css** (271 → 298 lines):
- Added `.sy-breaks-list`, `.sy-section-label`, `.sy-break-row`, `.sy-break-info`, `.sy-break-label`, `.sy-break-dates`, `.sy-add-break-btn` styles.
- Large-phone media query entries for break elements.

**AddEditSchoolYearSheet.jsx** (142 → 143 lines):
- Added `'break'` entries to `TITLES` and `LABELS` maps.
- Updated `removeNoun` logic for break mode.
- Updated "Remove" button label for break mode.

**AcademicRecordsTab.jsx** (218 → 218 lines):
- Added `addBreak`/`updateBreak`/`removeBreak` destructuring from `useSchoolYears`.
- Added `editingBreak` state variable.
- Added `handleAddBreak(yearId)` and `handleEditBreak({ break, yearId })` handlers.
- Updated `closeSchoolYearSheets`/`closeAddEditSchoolYear` to clear `editingBreak`.
- Updated save/delete handlers to handle `'break'` mode.
- Updated `editingItem` to resolve break objects.
- Passed `onEditBreak`/`onAddBreak` to `<SchoolYearSheet>`.

### Commit 4 — Attendance subtracts break days (`6e59049`)

**useAcademicSummary.js** (132 → 141 lines):
- `attendanceDays` now computes `breakDays`: for each break in `activeSchoolYear.breaks`, counts weekdays within the break period that overlap the start–end window.
- New formula: `attended = schoolDays − breakDays − sick`.
- Return shape changed: `{ attended, sick, breakDays, schoolDays, required: 175 }` (was `{ attended, sick, total, required }`).

**RecordsMainView.jsx** (189 → 191 → 197 lines):
- Attendance detail row shows "Breaks: N" when `breakDays > 0`.
- Changed `attendanceDays.total` to `attendanceDays.schoolDays` in the "School days" display.

### Commit 5 — CalendarImportSheet (`1db19ed`)

**CalendarImportSheet.jsx** (198 lines, NEW):
- Bottom sheet (z-index 300) for importing school breaks from iCal/PDF/image files.
- Three-phase flow: file picker → parsing spinner → results preview.
- Anthropic API call: browser-direct (same pattern as TE Extractor) using `VITE_ANTHROPIC_API_KEY`.
- Model: `claude-sonnet-4-20250514`, max_tokens 4096.
- System prompt instructs Claude to extract breaks/holidays as JSON array of `{ label, startDate, endDate }`.
- File handling: FileReader → base64, media type detection for PDF/image/text.
- Results preview: count + individual break rows with label + date range.
- Confirm button calls `onImport(results)` with the parsed array.

**CalendarImportSheet.css** (114 lines, NEW):
- Sheet chrome following established pattern: overlay, panel, handle, ink header, scrollable body, footer.
- File zone with dashed border, hover gold accent, selected state with gold background.
- Spinner, error box, results preview styles.
- Large-phone media query at 400–1023px.

### Commit 6 — Wiring into tab (`c368ea7`)

**AcademicRecordsTab.jsx** (218 → 237 lines):
- Added `CalendarImportSheet` import.
- Added `calendarImportOpen` state.
- Added `handleCalendarImport(breaks)` — iterates parsed breaks, calls `addBreak` for each with active school year's id.
- Passed `onCalendarImport` to `RecordsMainView` (null when no active year).
- Rendered `<CalendarImportSheet>` with `yearLabel` from active school year.

**RecordsMainView.jsx** (191 → 197 lines):
- Added `onCalendarImport` to props.
- Replaced disabled "Import Curriculum Data" button with "Import Calendar Breaks" — live when `onCalendarImport` is provided, disabled otherwise.

Build green at every commit. No version bump (within v0.23.5).

---

## Firestore data model change

New subcollection under school years:

```
/users/{uid}/schoolYears/{yearId}/breaks/{breakId}
  → { label: string, startDate: string, endDate: string }
```

Breaks follow the same pattern as quarters — subcollection of a school year, same field shape.

---

## File-size report (post-session)

All under 300:

| File | Lines |
|---|---|
| `constants/academics.js` | 55 |
| `firebase/academicRecords.js` | 207 |
| `hooks/useSchoolYears.js` | 188 |
| `hooks/useAcademicSummary.js` | 141 |
| `components/SchoolYearSheet.jsx` | 152 |
| `components/SchoolYearSheet.css` | 298 |
| `components/AddEditSchoolYearSheet.jsx` | 143 |
| `components/CalendarImportSheet.jsx` | 198 |
| `components/CalendarImportSheet.css` | 114 |
| `components/RecordsMainView.jsx` | 197 |
| `tabs/AcademicRecordsTab.jsx` | 237 |

---

## What is currently incomplete / pending

- **Browser smoke test** — not run. Walk:
  - Open Academic Records → Manage School Year & Quarters → breaks list shows under each year.
  - Add Break → form appears with label/start/end fields. Save → break persists.
  - Edit Break → pencil opens form pre-filled. Delete → inline confirm → break removed.
  - Attendance stats: with breaks added, attended count decreases (schoolDays − breakDays − sick).
  - "Breaks: N" appears in attendance detail row when breakDays > 0.
  - Import Calendar Breaks → file picker opens. Select iCal/PDF/image → "Parse Calendar" → spinner → results preview → "Import N Breaks" → breaks saved to active school year.
  - Import Calendar: requires `VITE_ANTHROPIC_API_KEY` to be set (only on Netlify build).

- **Carry-overs (still open):**
  - `useAcademicSummary` still fetches grades redundantly (could be removed now that `useGrades` owns grade state).
  - Cascading-delete UX warnings (school year → quarters/breaks, course → enrollments, enrollment → grades).
  - iPad portrait breakpoint decision.
  - iPhone SE 300px grid overflow.
  - Planner Phase 2 features (auto-roll, week history, copy last week, export PDF).
  - Import merge bug (inherited v0.22.3).
  - **CLAUDE.md drift** — academic-records still not documented in CLAUDE.md after 7 sessions.
  - SchoolYearSheet.css at 298 lines — dangerously close to the 300-line limit. Any additions will require a split.

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md.
2. Smoke test breaks management and calendar import end-to-end.
3. Probable next directions:
   - **CLAUDE.md sweep** — document academic-records (hooks, components, firebase, constants, data model, breaks) since it's been 7 sessions of undocumented work.
   - **Remove redundant grades fetch from useAcademicSummary**.
   - **Phase 2 Session 8: Report Card generation**.
   - Or: tackle cascading-delete UX warnings.

## Key file locations (touched this session)

```
packages/dashboard/
├── src/
│   ├── tabs/
│   │   └── AcademicRecordsTab.jsx                                          # 218 → 237
│   └── tools/academic-records/
│       ├── constants/
│       │   └── academics.js                                                # 48 → 55 (break paths)
│       ├── firebase/
│       │   └── academicRecords.js                                          # 185 → 207 (break CRUD)
│       ├── hooks/
│       │   ├── useSchoolYears.js                                           # 146 → 188 (break mutators)
│       │   └── useAcademicSummary.js                                       # 132 → 141 (break days calc)
│       └── components/
│           ├── SchoolYearSheet.jsx                                         # 125 → 152 (breaks list)
│           ├── SchoolYearSheet.css                                         # 271 → 298 (break styles)
│           ├── AddEditSchoolYearSheet.jsx                                  # 142 → 143 (break mode)
│           ├── RecordsMainView.jsx                                         # 191 → 197 (calendar import btn)
│           ├── CalendarImportSheet.jsx                                     # NEW — 198
│           └── CalendarImportSheet.css                                     # NEW — 114
```

Net: 2 new source files (312 lines), 9 modified, no version bump. No App.jsx changes.
