# HANDOFF — v0.23.11 Phase 2 Session 10B: Curriculum Import

## What was completed this session

3 code commits + this docs commit on `main`:

```
a3ad1a8 chore: bump version to v0.23.11
fd91f32 feat: wire curriculum import into Course Catalog (v0.23.11)
db83d1f feat: add CurriculumImportSheet with AI parsing and duplicate detection
```

### Commit 1 — CurriculumImportSheet (`db83d1f`)

**CurriculumImportSheet.jsx** (182 lines, NEW):
- Bottom sheet (z-index 300) for importing courses from curriculum receipts.
- Accepts PDF or image files, sends to Anthropic API (browser-direct, `VITE_ANTHROPIC_API_KEY`).
- System prompt extracts courses as `[{ name, curriculum, gradingType, gradeLevel }]`.
- Duplicate detection: case-insensitive partial name match against existing courses prop.
- Results preview shows course rows with name/curriculum/grade level/scale badge. Duplicates shown muted with "Already in catalog" badge. Non-duplicates have remove (✕) button.
- Import count excludes duplicates and removed courses. "All courses already in catalog" disables confirm when all dupes.
- Debug log: `buildCurriculumLog` helper captures file info, timing, raw response, per-course listing with [DUPLICATE] tags.

**CurriculumImportSheet.css** (108 lines, NEW):
- Sheet chrome matching CalendarImportSheet pattern. File zone, spinner, error, results, course rows, badges, remove button, log panel.

### Commit 2 — Wiring (`fd91f32`)

**CourseCatalogSheet.jsx** (98→100): Added `onImportCurriculum` prop and "📥 Import Receipt" ghost button in section header row.
**CourseCatalogSheet.css** (249→260): Added `.cc-section-row`, `.cc-import-btn` styles.
**AcademicRecordsTab.jsx** (182→193): Added `curriculumImportOpen` state, `handleCurriculumImport` handler (calls `addCourse` per parsed course), passes props through to sheets.
**AcademicRecordsSheets.jsx** (64→68): Added `CurriculumImportSheet` import and render.

### Commit 3 — Version bump (`a3ad1a8`)
- 0.23.10 → **0.23.11** across all 3 workspace package.json files.

Build green at every commit.

---

## File-size report (post-session)

| File | Lines |
|---|---|
| `components/CurriculumImportSheet.jsx` | 182 |
| `components/CurriculumImportSheet.css` | 108 |
| `components/CourseCatalogSheet.jsx` | 100 |
| `components/CourseCatalogSheet.css` | 260 |
| `components/AcademicRecordsSheets.jsx` | 68 |
| `tabs/AcademicRecordsTab.jsx` | 193 |

---

## What is currently incomplete / pending

- **Browser smoke test** — not run. Walk:
  - Course Catalog → "Import Receipt" button in header opens CurriculumImportSheet.
  - Select PDF/image → "Analyze Receipt" → spinner → results preview.
  - Courses already in catalog shown muted with "Already in catalog" badge.
  - Remove unwanted courses with ✕ button before importing.
  - "Import N Courses" saves new courses to catalog. Catalog refreshes.
  - View Log shows file info, timing, raw response, per-course listing.

- **Carry-overs:**
  - **CLAUDE.md drift** — academic-records still not documented after 10+ sessions.
  - `useAcademicSummary` still fetches grades redundantly.
  - Cascading-delete UX warnings.

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md.
2. Smoke test curriculum import end-to-end.
3. Next: **CLAUDE.md sweep** — critical, 10+ sessions undocumented.

## Key file locations (touched this session)

```
packages/dashboard/
├── package.json                                                     # v0.23.11
├── src/
│   ├── tabs/
│   │   └── AcademicRecordsTab.jsx                                   # 182 → 193
│   └── tools/academic-records/components/
│       ├── CurriculumImportSheet.jsx                                # NEW — 182
│       ├── CurriculumImportSheet.css                                # NEW — 108
│       ├── CourseCatalogSheet.jsx                                   # 98 → 100
│       ├── CourseCatalogSheet.css                                   # 249 → 260
│       └── AcademicRecordsSheets.jsx                                # 64 → 68
packages/shared/package.json                                         # v0.23.11
packages/te-extractor/package.json                                   # v0.23.11
```
