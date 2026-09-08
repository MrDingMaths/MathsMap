# Graph stroke convention — September 2026

Graph strokes use physical point sizes after the diagram is fitted into its page slot.

| Drawing role | Final weight |
| --- | --- |
| Plotted relationships and geometry outlines | 0.8 pt |
| Axes and number lines | 0.5 pt |
| Tick marks | 0.4 pt |
| Major grid | 0.25 pt |
| Minor grid | 0.15 pt |
| Construction guides and annotation pointers | 0.4 pt |

Dashed relationships retain the plot weight. Dash patterns, colours, point positions, labels and arrowhead types are preserved. Existing graph typography remains 8.5 pt ticks (8 pt for reviewed crowded scales) and 10 pt labels.

## Implementation

`public/libs/maths-editor/house-style.mjs` owns the frozen `graphs.strokes` defaults and authoring prompt. Its existing 1.1.0 document style stays compatible; the stroke convention has its own version, 1. The graph compiler emits explicit widths and SVG metadata instead of relative `thin`/`thick` weights. Reconstruction prompts and the TikZ authoring guide specify the same rule.

The bundled TikZJax driver preserves numerical stroke widths in SVG units. `src/lib/graph-strokes.js` identifies the declared widths in opted-in SVGs, retains each physical target on the path, and compensates for the actual SVG transform and booklet page zoom. It recalibrates after compilation, cache insertion, slot resizing and print layout. This avoids cumulative scaling and keeps text and mathematical geometry intact. Filled point markers retain their original size. Untagged SVG artwork is not restyled by the renderer.

Preview and PDF export use the same calibration. Shared booklet QA checks the final widths to a 0.05 pt tolerance. The renderer cleans up its observers on cancellation or removal. The compiler can still recover earlier generated graph models without accepting hand-edited equations as authoritative model data.

## Migration and reproduction

`node scripts/booklet/migrate-graph-strokes.mjs` creates before snapshots, candidates and per-drawing role audits in `output/graph-strokes`. It visits active project content, including overlays and panels, while excluding original evidence and review snapshots. A structural guard permits changes only to diagram code. Current editable graphs are regenerated; older compiler output is edited by drawing role to retain its existing typography. Mathematical models and layout settings are unchanged.

With a local Vite server running, use:

```text
node scripts/booklet/check-graph-strokes.mjs --base http://127.0.0.1:5173
node scripts/booklet/check-graph-stroke-resizing.mjs --base http://127.0.0.1:5173
```

The first command compiles every candidate and baseline with the bundled engine, checks multiple widths and repeat calibration, and creates contact sheets. The second exercises live resizing, page zoom, cached SVG insertion and synchronous print layout. After reviewing candidates, `node scripts/booklet/migrate-graph-strokes.mjs --save` compares them against a fresh migration, requires the expected project revision and uses `saveBookletProject` to retain the previous revision.

The compiler check also writes an isolated `cache-state.json` for the exporter's `--cache-state` option. Cached SVG identifiers are prefixed with their source key so clip paths cannot collide across different diagrams.

Export student, worked and short editions using the existing `export-pdf.mjs` command and candidate project. `check-graph-stroke-pdfs.mjs` checks physical vector widths on representative exported pages through Poppler, independently of the application calibration. Verification PDFs are in `output/pdf/linear-relationships-{student,worked,short}-strokes.pdf`; measurement reports and review PNGs are in `output/graph-strokes`.

## Verification

- All 584 active project graph records / 456 distinct sources compiled and passed checks at their stored width, 40 mm and 90 mm. Maximum browser stroke error: 0.000004 pt.
- 456 automated tests passed; production build passed.
- Browser resizing, 60% page zoom, cache insertion, repeat calibration and print transition passed.
- Student PDF: 99 pages, 175 graph instances, no layout/style or printed-page issues.
- Worked PDF: 99 pages, 107 graph instances, no layout/style or printed-page issues.
- Short-answer PDF: 34 pages, 59 graph instances, no layout/style or printed-page issues.
- Independent vector measurements on 17 PDF pages checked 116 coloured graph strokes; maximum target error was 0.000105 pt.
- Representative before/after graphs and printed pages were visually reviewed for weight, arrowheads, labels and page clearance.

## Saved adoption

| Active project | Previous revision retained | Saved revision | Graphs |
| --- | --- | --- | --- |
| Linear Relationships bank working | 345 | 346 | 268 |
| Linear Relationships complete | 157 | 158 | 268 |
| Linear Relationships revision selection | 13 | 14 | 25 |
| Linear Relationships revision | 5 | 6 | 23 |

Each saved project was compared with its reviewed candidate, allowing only revision and update metadata changes. Each retained revision was compared with its original before snapshot. All comparisons matched exactly. Historical archives and source evidence were not migrated.
