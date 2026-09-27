# Diagram typography and short-answer ink

Native diagram labels use 10 pt at final printed size, with a measured tolerance of 0.1 pt. This applies to ordinary geometry and graph labels at every diagram width. Graph ticks retain their separate 8.5 pt default and reviewed 8 pt exceptions. Raster labels require separate review; automatic text calibration does not apply to images.

`public/libs/maths-editor/house-style.mjs` owns the targets. `src/lib/diagram-typography.js` wraps each complete TikZ node during compilation and calibrates its SVG group. The correction includes fraction rules and scripts, retaining their relative sizes, rotation and anchor. It starts from the uncorrected group each time, removes page zoom from the measurement, and runs through the shared resize/print observer. The preparation participates in the render cache key. `booklet-qa.js` checks both undersized and oversized labels against their semantic target; numeric graph ticks need the explicit marker below.

## Explicit native graph tick roles

A TeX declaration such as `\fontsize{8.5}{10}` does not identify a tick to the shared calibrator. Wrap the complete numeric, time or measurement tick label, including its units and scripts, inside the node:

```tex
\node[anchor=east,font=\fontsize{8.5}{10}\selectfont] at (-2,\y) {
  \special{dvisvgm:raw <g data-graph-text="tick">}\v\special{dvisvgm:raw </g>}
};
```

Apply this to practice questions, short answers, worked solutions and teaching graphs. Nominal category names such as A-D remain ordinary 10 pt labels. A font declaration or a passing measurement against the wrong target is not tick acceptance: confirm the semantic role, the rendered `tick` flag and the actual PDF font size. Preserve coordinates, scale values, widths and current answer-style bindings when adding markers. `scripts/booklet/graph-tick-roles.mjs` applies reviewed node ranges with exact source guards; its offsets are Unicode code points. Final visual review still checks placement and readability.

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


## SVG paint bounds — 14 September 2026

Fixed-size native labels may extend beyond the original TeX SVG viewport after calibration. The shared calibration sets the root SVG overflow to visible so complete 10 pt glyphs remain painted, without changing the diagram viewport, coordinates, stored dimensions or pagination. Actual clipping by an ancestor or printed page remains a failing preflight. Viewport spill is reported separately for final-size visual review, alongside label overlaps; it is never accepted solely because the font size is correct.

The Word-workspace acceptance run found and reviewed these occurrences across the current books. Regression fixtures distinguish a visible SVG viewport from an actual clipping container, including repeated resizing, zoom and cache reopen. Source geometry and project/bank content were retained. Evidence is local under .booklet-work/word-studio/final/ and .booklet-work/word-studio/clipping/.

## Print transition — 16 September 2026

The PDF menu used to prepare diagrams inside a `display:none` print copy. Chromium can fire `beforeprint` before switching to print layout, so that copy still had zero measurable width. Label calibration also removed the existing correction before discovering that measurement was unavailable. The reported right-angle label therefore printed at about 16 pt instead of 10 pt, with its 0.8 pt lines enlarged to about 1.29 pt. Export scripts that settled print media first concealed the failure.

`BookletProjects.svelte` now gives the prepared copy its final page dimensions offscreen, exclusively in screen media. After diagrams, images and fonts are ready, `settleBookletMeasurement` synchronously calibrates labels and strokes before `window.print()`. Existing revision/edition guards and cleanup are retained. `calibrateDiagramTypography` preserves prior corrections when layout cannot be measured and restores them if recalculation fails. Diagram sources, stored dimensions, content, pagination settings, APIs and saved-data formats are unchanged.

Verification:

- `node scripts/booklet/check-print-transition.mjs` checks the supplied right angle, complete fractions/scripts, rotated labels, graph ticks at 8 and 8.5 pt, and answer widths. It exercises the PDF menu, Ctrl+P, repeated printing, 50/75/100% preview zoom, a fresh compile and cached reopening. A stubbed dialog return checks cancellation/close cleanup; actual Chromium PDFs separately exercise the immediate print-media transition.
- All five fixture editions have pixel-identical immediate and settled PDFs at 144 dpi. Native base labels measure about 9.9975 pt; scripts retain their relative size, ticks measure about 7.995/8.4975 pt, and the right-angle main lines remain 0.8 pt. `pdf-diagram-geometry.py` checks actual PDF fonts and strokes with 0.1 pt and 0.05 pt tolerances respectively. The regression needs Chrome, Poppler (`pdftotext`, `pdftoppm`) and Python with PyMuPDF; `BOOKLET_TEST_BASE`, `BOOKLET_PRINT_TEST_OUT`, `BOOKLET_PDF_PYTHON` and `BOOKLET_PYTHON_LIBS` support local installations.
- The 48 relevant unit/browser tests and production build pass. Editor checks retain 10 pt labels through resizing, zoom, fresh/cached rendering and save/reopen. Additional legacy flow and fixed-source-page fixtures also produce pixel-identical immediate/settled PDFs.
- All five trig editions pass rendering checks (64/4/35/68/99 pages). All 103 standalone pages were visually inspected. Exact RGB PDF-body comparisons support reuse of 160 combined-page bodies; unmatched pages, covers and answer boundaries were inspected in full, with every combined footer reviewed separately. Existing incomplete `sourceReview` metadata required review exports (`--draft`); this rendering verification does not grant source-fidelity acceptance.
- Across the other eight current projects, all 40 editions pass native label/stroke measurements (37,787 label occurrences), and 453 selected pages per transition pass actual PDF font checks. Visual review covers 179 standalone affected/neighbor pages plus six Angle Relationships warning pages. Small raster differences in Angle Relationships, Data Visualisation, Logarithms and Volume were inspected without finding enlarged text.
- Logarithms was initially reviewed at revision 38. A concurrent revision 39 changed the width of `p41-q5-a-solution-graph` from 110 to 128.1 mm. Its affected page and both neighbours were rechecked in all four answer editions: 12 pages, with passing font/stroke checks and pixel-identical immediate/settled PDFs. These pages were also visually inspected; no project content was changed by this fix.

Angle Relationships revision 483 retains 13 pre-existing clipping warnings across three diagrams (`p54-q2-d-diagram`, `p67-q8-d-diagram`, `p67-q8-e-diagram`), including missing page content around physical pages 55 and 68. Running the previous calibration produces the same warnings and identical transforms for all 2,280 groups. These layout defects are not accepted or repaired by this print-sizing change.

Logarithms' horizontal-translation graph (`p41-q5-a-solution-graph`) also retains crowded legend rows in its answer editions; the vertical-translation graph's legend is tight at short-answer width. These are visible in the revision 38 and 39 review PDFs, and the previous calibration produces identical transforms for all 44 worked-answer groups. They require a separate placement/content correction. Passing font-size measurements does not accept this legend layout.

Source hashes, actual phase timings, retries, PDFs and visual-review receipts are retained locally under `.booklet-work/print-typography-fix/`; `receipt.json`, `trig/visual-metrics.json` and `books/summary.json` describe the evidence. Generated artifacts remain outside Git.
