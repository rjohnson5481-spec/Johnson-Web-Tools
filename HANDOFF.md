# HANDOFF — v0.22.9 large phone scaling at 400px

## What was completed this session

Added a `@media (min-width: 400px) and (max-width: 1023px)` breakpoint
across 15 CSS files that scales fonts, padding, icons, nav, cards,
buttons, and sheets up proportionally. Goal: native-app feel on wide
phones (Galaxy S25 Ultra 412px portrait) instead of the miniature
"designed for 320px" look. Mobile base styles are unchanged and
desktop (≥1024px) is unchanged.

### Why the bounded query `(min-width: 400px) and (max-width: 1023px)`?

The spec said "Add a @media (min-width: 400px) breakpoint" AND
"Do not touch any @media (min-width: 1024px) desktop rules". A plain
`@media (min-width: 400px)` block also matches at desktop widths,
which would leak large-phone rules into the sidebar-mode desktop
layout (e.g., `.bn-tab { min-height: 68px }` would stretch the
compact desktop sidebar rows to 68px). Bounding with
`max-width: 1023px` keeps the scaling strictly in the large-phone
range and guarantees desktop is untouched — faithful to both spec
criteria. Noted explicitly in case Rob wants it reworked.

### Commit 1 — 15 files, 208 insertions

Each block adds property overrides only — no base style is modified,
no rules removed. All new blocks live immediately before the existing
`@media (min-width: 1024px)` block (or appended to end when no
desktop block exists) so cascade order is correct.

**Shell + nav:**
- `App.css` — `.shell-content` padding-bottom calc(68px + safe-area)
- `BottomNav.css` — nav height 68px; tab min-height 68px; icon 24px;
  label 12px

**Home tab:**
- `HomeTab.css` — `.home-content` padding 24px 20px 32px;
  greeting 26px; date 13px; summary row gap 12px; summary card
  padding 20px 16px; summary value 28px; summary label 11px;
  lesson list gap 10px; lesson row padding 14px 16px; lesson
  subject 15px; lesson text 13px; actions gap 12px margin-top 28px;
  action btn padding 14px font-size 15px

**Settings tab:**
- `SettingsTab.css` — section label 11px; row padding 16px; row
  title 15px; row sub 12px; row icon 36×36; toggle 48×28 with
  ::before thumb re-centered to top:4 left:4 width/height 20px
  and on-state translateX(20px) to preserve symmetry; version
  name 13px; version line 12px

**Planner:**
- `planner/Header.css` — header-top 52px; logo 38×38; school line1
  13px; school line2 12px; tagline 11px; icon btn 36×36 font 16px;
  week padding 10px 16px 14px; nav-btn 28px; week-label 16px;
  students row 36px; student-btn 8px 16px / 14px — total header
  ~140px
- `planner/DayStrip.css` — day-strip top: 140px (under taller header);
  pill padding 10px 6px; day-name 11px; day-date 16px
- `planner/PlannerLayout.css` — planner-body margin-top 140px;
  planner-main padding-bottom 170px (clears taller 68px nav + 90px
  action bar); planner-subjects gap 14px; day-title 26px;
  day-subtitle 14px; action-bar bottom 68px, padding 12px 16px;
  action-btn padding 12px 20px / 14px
- `planner/SubjectCard.css` — card padding 18px 16px gap 14px;
  checkbox 40×40; flag-btn 32×32 / 17px; name 12px; lesson 15px;
  hint 13px; allday-name 17px, allday-note 14px
- `planner/EditSheet.css` — title 17px; body 24px 20px gap 10px;
  label 13px; textarea 16px (iOS zoom guard) 12px 14px padding;
  toggle 12px / 14px; delete 14px; footer 14px 20px 18px;
  cancel + save 14px / 15px
- `planner/AddSubjectSheet.css` — title 17px; body 20px gap 16px;
  input 16px (iOS guard); detail-input 16px (iOS guard); add-btn
  12px 20px / 15px; section-label 11px; preset-btn 8px 14px / 13px;
  day-pill 10px 6px; day-short 11px; day-date 16px; student-pill
  8px 16px / 14px; summary 14px; confirm-btn 14px / 15px;
  allday-btn 14px 18px / 15px
- `planner/UploadSheet.css` — title 18px; body 24px 20px gap 14px;
  file-hint 15px; filename 15px; wipe-row 14px; spinner-row 15px;
  error 14px; success 16px; result-meta 15px; day-header 14px;
  lesson-row 14px; lesson-num 13px; result-footer 13px; footer
  14px 20px 18px; cancel + import + apply 14px / 15px

**Reward tracker:**
- `reward-tracker/RewardLayout.css` — rl-body padding 24px 20px;
  student card scaled via `.sc-*` classes (identity 22px 22px 0
  gap 16px; avatar 60×60 / 44px; name 22px; cash 14px; points-block
  22px 22px 4px; points 60px; points-label 13px; actions 18px 22px
  22px gap 10px; btn 14px / 14px)
- `reward-tracker/ActionSheet.css` — title 18px; body 24px 20px gap
  16px; stepper gap 24px; stepper-btn 48×48 / 24px; stepper-value
  32px / min-width 80px (spec said 32 — that's smaller than base
  40; followed spec literally, flag below); quick-btn 10px 16px /
  14px; balance 14px; input 16px (iOS guard); footer 0 20px;
  cancel-btn 14px / 15px; confirm-btn 16px / 16px
- `reward-tracker/RewardHeader.css` — rh-top height 64px; back-btn
  40×40 / 14px (spec said 14 — smaller than base 18; followed spec
  literally, flag below); back-spacer 40px; logo 38×38; line1 13px;
  line2 12px; tagline 11px
- `reward-tracker/LogPage.css` — log-body padding 24px 20px;
  student-bar 16px 18px; avatar 36px; student-name 18px; balance
  14px; list gap 10px; entry padding 14px 16px; entry-icon 22px;
  entry-note 15px; entry-date 13px; entry-pts 16px

### Commit 2 — version bump to v0.22.9

- `packages/dashboard/package.json`:    0.22.8 → 0.22.9
- `packages/shared/package.json`:       0.22.8 → 0.22.9
- `packages/te-extractor/package.json`: 0.22.8 → 0.22.9

Build verified clean at every commit
(`@homeschool/dashboard@0.22.9`, `@homeschool/te-extractor@0.22.9`).

---

## Spec inconsistencies flagged (followed literally, worth Rob's review)

1. **Action sheet `.action-stepper-value` font-size: 32px** — spec
   line said "Points number font-size: 32px" but the base style is
   40px, so this *shrinks* on wide phones. Contradicts the "scale
   up" theme. Applied 32px literally.

2. **Reward header back button font-size: 14px** — spec line said
   "Back button font-size: 14px" but base is 18px, so this shrinks
   the `←` arrow glyph on wide phones. Contradicts scale-up theme.
   Applied 14px literally.

If either was a typo for a larger value (e.g., 44px for the stepper
number, 20px for the back-arrow), a one-line follow-up can flip them.

---

## Files over the 300-line hard limit (CLAUDE.md rule — flag per spec)

All five were noted in the task brief. No file was split this session.
Suggested next-session split targets in parentheses.

- `packages/dashboard/src/tabs/SettingsTab.css` — 376 lines (was 362).
  Split target: Appearance/App rows vs. Student rows + Subject
  sub-section.
- `packages/dashboard/src/tabs/HomeTab.css` — 324 lines (was 308, now
  crossed limit this session). Split target: `home-header` +
  top-content vs. `home-lesson-*` + `home-action-*`.
- `packages/dashboard/src/tools/planner/components/PlannerLayout.css`
  — 360 lines (was 350). Split target: layout shell vs.
  `.undo-sick-*` bottom sheet (the undo-sick CSS is a self-contained
  bottom sheet embedded in PlannerLayout — could move into its own
  `UndoSickSheet.css` even though there is no `UndoSickSheet.jsx`).
- `packages/dashboard/src/tools/planner/components/AddSubjectSheet.css`
  — 408 lines (was 390). Split target: base sheet chrome vs. per-day
  details + student pills + summary block.
- `packages/dashboard/src/tools/planner/components/UploadSheet.css` —
  333 lines (was 313). Split target: pre-parse chrome (file zone,
  wipe toggle, spinner) vs. result preview (`.upload-sheet-result*`,
  `.upload-sheet-day-*`, `.upload-sheet-lesson-*`).

---

## What is currently incomplete / pending

1. **Browser smoke test** — not run. Priority checks:
   - **Galaxy S25 Ultra portrait (412px)** — nav tabs now 68px tall
     with 24px icons and 12px labels; planner header feels ~140px
     tall with readable week nav; subject cards reflow to 2 columns
     in landscape (from v0.22.8) with 18/16 padding; tap to edit
     hint is 13px, readable.
   - **iOS keyboard zoom** — every text input in bottom sheets is
     now 16px at ≥400px to suppress iOS Safari auto-zoom on focus.
     Specifically: EditSheet textarea, AddSubjectSheet input +
     detail-input, ActionSheet note input. Verify on a real iPhone
     SE / 13 / 15 in Safari.
   - **iPhone SE portrait (~375px)** — below the 400px threshold,
     so the session's scaling does NOT apply. SE keeps the original
     small-phone layout. Intentional.
   - **iPad portrait (~810px)** — within the 400–1023 band, so
     the scaled-up styles DO apply. Bottom nav 68px, sheets bigger.
     If Rob wants iPad portrait to render the desktop sidebar
     instead, see the carry-over item below.
   - **Desktop ≥1024px** — untouched by design. Bounded media
     query. `.bn-tab min-height: 68px` does NOT leak into the
     desktop sidebar rows.

2. **Spec literal vs. intent follow-up** — see the two "shrinks on
   wide phone" values above (action-stepper-value 32px, rh-back-btn
   14px). Confirm or correct.

3. **iPad portrait breakpoint decision** (carried from v0.22.7+) —
   still open. iPad portrait currently gets the scaled phone layout,
   not the sidebar.

4. **iPhone SE grid overflow** (carried from v0.22.8) — the 300px
   grid minimum in `.planner-subjects` / `.rl-body` could overflow
   SE's 288px content area. Not touched this session.

5. **Dead source files** (carried, untouched):
   - `packages/dashboard/src/tools/planner/components/SettingsSheet.{jsx,css}`
   - `packages/dashboard/src/components/Dashboard.css`, `Header.css`

6. **Import merge bug** (inherited from v0.22.3) — still open.

7. **Chunk size** — dashboard JS bundle ~640 KB. Known.

---

## What the next session should start with

1. Read CLAUDE.md + HANDOFF.md (standard).
2. Smoke test v0.22.9 on a Galaxy-class 412px phone and an iOS phone
   in Safari (for the 16px zoom-guard check).
3. Confirm or correct the two "shrinks on wide phone" spec values:
   `.action-stepper-value 32px` and `.rh-back-btn font-size: 14px`.
4. Decide on the iPad portrait breakpoint (carry-over).
5. When ready to split oversized files, start with HomeTab.css (the
   only file that crossed the 300 limit purely this session).
   Others were already over before this session.

---

## Key file locations (updated this session)

```
packages/dashboard/
├── package.json                                                    # v0.22.9
├── src/
│   ├── App.css                                                     # + @media 400-1023 shell padding
│   ├── components/
│   │   └── BottomNav.css                                           # + nav 68px, icon 24, label 12
│   ├── tabs/
│   │   ├── HomeTab.css                                             # + scaled block (crosses 300)
│   │   └── SettingsTab.css                                         # + scaled block (over 300)
│   └── tools/
│       ├── planner/components/
│       │   ├── AddSubjectSheet.css                                 # + scaled block (over 300)
│       │   ├── DayStrip.css                                        # + scaled block
│       │   ├── EditSheet.css                                       # + scaled block
│       │   ├── Header.css                                          # + scaled block (~140px header)
│       │   ├── PlannerLayout.css                                   # + scaled block (over 300)
│       │   ├── SubjectCard.css                                     # + scaled block
│       │   └── UploadSheet.css                                     # + scaled block (over 300)
│       └── reward-tracker/components/
│           ├── ActionSheet.css                                     # + scaled block
│           ├── LogPage.css                                         # + scaled block
│           ├── RewardHeader.css                                    # + scaled block
│           └── RewardLayout.css                                    # + scaled block (.sc-* classes)
packages/shared/package.json                                        # v0.22.9
packages/te-extractor/package.json                                  # v0.22.9
```
