# Diagram typography and short-answer ink

Native diagram labels use 10 pt at final printed size, with a measured tolerance of 0.1 pt. This applies to ordinary geometry and graph labels at every diagram width. Graph ticks retain their separate 8.5 pt default and reviewed 8 pt exceptions. Raster labels require separate review; automatic text calibration does not apply to images.

`public/libs/maths-editor/house-style.mjs` owns the targets. `src/lib/diagram-typography.js` wraps each complete TikZ node during compilation and calibrates its SVG group. The correction includes fraction rules and scripts, retaining their relative sizes, rotation and anchor. It starts from the uncorrected group each time, removes page zoom from the measurement, and runs through the shared resize/print observer. The preparation participates in the render cache key. `booklet-qa.js` checks both undersized and oversized labels without requiring graph tick metadata.

Practice short answers inherit `#24282d`, including answer numbers, part labels, prose and mathematics. `src/lib/short-answer-style.js` removes known decorative blue declarations from legacy text and structured editor content, while retaining mathematical colour and inline diagrams. The practice renderer and content-edit save path share this policy. Teaching answers, worked solutions and diagram palettes retain their existing colours. Both answer editions remain practice-only.

## Acceptance record — 11 September 2026

The active projects were Index Laws complete v1 revision 203, Linear Relationships v1 revision 4 and Non-Right-Angled Trigonometry v1 revision 69. The trig project advanced from revision 67 through two revision-safe maintenance transactions: 97 decorative-blue short answers repaired, followed by placement adjustments in 35 diagrams. Prior project revisions and original source evidence remain local. A structural comparison against revision 67 confirmed that only these authorised repairs, revision and update time changed. All 317 project/bank links are synced. Repeated maintenance runs produce zero changes.

Intentional departures from source appearance are recorded in `booklets/provenance/diagram-typography-short-answers-2026-09-11.json` and `booklets/provenance/diagram-label-placements-2026-09-11.json`. Label shifts, and the three reviewed narrow-angle label placements, preserve mathematical values, geometry, colours and orientation. Existing pagination settings, IDs, classifications and local layouts are retained.

| Project | Questions | Short answers | Worked solutions | Questions + short | Questions + worked |
| --- | ---: | ---: | ---: | ---: | ---: |
| Trigonometry | 73 | 4 | 35 | 77 | 108 |
| Index Laws | 63 | 15 | 68 | 78 | 131 |
| Linear Relationships | 92 | 14 | 47 | 106 | 139 |

All 15 final exports (1,050 pages) passed screen and printed layout QA, with zero reported issues. Native label measurements passed in every edition; ordinary printed base labels measured approximately 9.997–9.998 pt, reflecting PDF font-size rounding. DOM group measurements also check the nominal base size, so small scripts cannot conceal undersized labels. Graph tick exceptions remained 8 pt or 8.5 pt.

Every ordinary short-answer text run passed the shared colour check: 18,916 rendered runs across the short and combined-short editions. An independent PDF paint-operation audit of all three short-answer PDFs found only `(36,40,45)` outside native diagram text, plus the existing grey footers. All internal PDF link targets resolved to pages in their document. Answer page maps contained only practice block IDs.

Visual review covered all 315 distinct trig native diagrams, the remaining nine native geometry diagrams in other projects, all five final trig editions, all Linear question/short/worked pages, all Index short-answer pages, Index diagram page 53 and its neighbours, and the other books' combined-edition covers and answer transitions. The 450 other-book combined page bodies matched their corresponding standalone pages pixel-for-pixel after excluding the footer strip. Checks covered label collisions and clipping, writing space, footer clearance and navigation. Raster content was retained without automatic label resizing or a claim of 10 pt raster compliance.

The complete regression suite passed: 643 tests. The production build passed with the existing bundle-size advisory. Real editor checks passed repeated widths, page zoom, fresh compilation, cached rendering, save/reopen, and mixed prose/maths short-answer editing. The typography regression additionally exercises scripts, fractions, rotation and repeated serialization.

## Repeatable checks

- `node --test tests/diagram-typography.test.js tests/booklet-qa.test.js tests/tikz-prepare.test.js`
- `node scripts/booklet/check-diagram-typography-editing.mjs`
- `node scripts/booklet/check-short-answer-editing.mjs`
- `node scripts/booklet/normalise-short-answer-colours.mjs` (dry run; add `--apply` for the revision-safe transaction)
- `node scripts/booklet/repair-diagram-label-placement.mjs` (dry run; exact source guards prevent applying stale repairs)
- `scripts/booklet/check-diagram-colours.mjs` and `scripts/booklet/review-diagram-colour-editions.mjs` accept `BOOKLET_DIAGRAM_REVIEW_OUT` and optional `BOOKLET_REVIEW_PROJECT` for isolated review output.

Detailed PDFs, page images, font/colour measurements, editor receipts and logs are retained locally under `.booklet-work/diagram-typography/`; final trig exports are under its `trig/editions/` directory. These caches and run artifacts are not release files. Follow the shared transcription feedback checklist for future imports.
