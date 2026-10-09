# Graph typography convention — September 2026

Axis numbers target **8.5 pt**, with **8 pt** permitted for crowded scales. Axis names, coordinates and equations target **10 pt**. These are final printed sizes after the SVG is fitted into its diagram slot; calibration allows 0.1 pt measurement tolerance. Mathematical subscripts and superscripts retain their normal relative sizing.

The side-by-side comparison of the user's examples (source pages 85 and 90) supports 8.5 pt over the old enlarged text. Use separate targets for ticks and other labels. Where 8 pt still crowds, give the diagram more room and verify the page layout. Move colliding labels rather than reducing equation or coordinate text below 10 pt.

Preserve source presence or absence of numerical axis scales and tick marks. Do not add scales automatically. Keep grid spacing independent of scale visibility. Source page 74 has unnumbered axes: its ten graphs retain grids, axes, arrows and x/y labels, with `ticks:false` and `tickLabels:false`. The compiler uses a nonempty `\relax` label expression because PGFPlots interprets an empty expression as its default numbering.

## Implementation and future transcription

- `public/libs/maths-editor/house-style.mjs` supplies the shared house-style prompt and defaults. The editor sync preserves this host-owned convention.
- Production `scripts/booklet/codex-transcription.mjs::runTranscriptionTasks` appends that prompt through `src/lib/booklet-house-style.js`. Fresh reconstruction and dedicated diagram stages also receive it through `scripts/booklet/candidate-validation.mjs::reconstructionPrompt`. The active files are `scripts/booklet/prompts/reconstruction-v4.md` and `scripts/booklet/prompts/diagram-reconstruction-v4.md`; both state the rule explicitly. Historical pinned inputs remain unchanged.
- `src/lib/graph-model.js` supplies separate tick and label sizes, preserves scale visibility on regeneration and uses supported 10 pt Computer Modern fonts with separate node scaling. This avoids the renderer's snapping of arbitrary requested font sizes.
- Preview and PDF export share final-size checks and a tick-collision check using painted glyph bounds, rather than the empty space in a font's em box. Checks reject oversized text as well as undersized text. Normal TeX superscripts and subscripts are assessed through their surrounding base text. The old blanket 11 pt growth scripts are retired.

## Reproduction

`scripts/booklet/calibrate-graph-typography.mjs` builds a candidate and measurements without changing the saved project. Its `--refine` pass applies reviewed crowding exceptions and label placements. Review the candidate before saving through `saveBookletProject` with its expected revision.

The comparison, compiled SVGs, contact sheets, measurements and before/candidate snapshots are in `output/graph-typography`. `compare-graph-typography.mjs` renders the 8/8.5/9 pt comparison; `review-graph-typography.mjs` produces contact sheets with unique SVG IDs.

## Confirmed adoption and verification

Linear Relationships was saved as **revision 146**, preserving revision 145 in the revision store. The source evidence, original raster images, mathematical bounds, lines, coordinates and unrelated project content are unchanged. The save was checked against revision 145 and verified to alter only the candidate content and revision metadata.

The comparison confirms 8.5 pt as the default; 8 pt is used for dense scales. All 268 TikZ diagrams were reviewed, including overlays and panels: 126 have 8.5 pt ticks, 107 have 8 pt ticks, and 35 contain no tick text. Base labels measure 9.90–10.10 pt. Label placement and tick spacing were adjusted where necessary; stored print-width overrides were included in the measurements. On source page 92, the questions now sit beside the larger graph to retain answer space and footer clearance.

| Verification | Result |
| --- | --- |
| Automated tests, including prompt assembly and regeneration | 446 passed |
| Vite production build | Passed |
| Student/worked preview checks | 198 checks, zero issues |
| Student PDF | 99 pages, 175 graph instances, zero QA issues |
| Worked-solution PDF | 99 pages, 107 graph instances, zero QA issues |
| Short-answer PDF | 34 pages, 59 graph instances, zero QA issues |
| Source page 74 regeneration | Ten graphs retain grids, axes, arrows and x/y only |

PDF verification includes both browser layout/style checks and Poppler checks of the final printed geometry. All graph contact sheets and representative full PDF pages were visually reviewed. Final artifacts are `output/graph-typography/before-after.png`, `size-comparison.png`, `measurements.json`, `verification.json`, and the three `output/pdf/linear-relationships-*-typography.pdf` files. The size comparison isolates the font choice; the before/after examples also include the final placement and layout refinements.

For reproducible browser checks, use the explicit `http://127.0.0.1:5173` base with the isolated verification config in `output/graph-typography/vite.config.mjs`. This avoids a separate localhost server and temporary HTML files affecting dependency discovery. The project source configuration was not changed for this workaround.
