# General diagram colour contract

The user requested this house style on 11 September 2026 for **all existing and future booklets**, and confirmed that ordinary labels change along with lines.

Use solid black `#000000` for ordinary outlines, angle marks, ticks, arrows and labels. Keep their geometry, weights, dashes and positions. Preserve colours that communicate mathematical meaning, including highlighted constructions, unknowns, matched objects/equations, compass reference directions and meaningful region shading. Source hue alone is not semantic evidence. Graph series, legends, axes, ticks and grids keep their separate rules. No grayscale filter is used.

## Shared implementation and authoring

`BOOKLET_HOUSE_STYLE.diagrams` owns the default. `src/lib/diagram-colours.js` reads explicit roles from editable TikZ source. `prepareTikz` applies them before compilation and cache-key calculation, so draft editing, save/reopen, browser caches and PDF export use identical source. Ordinary named colour definitions become black; semantic aliases use the standard accent corresponding to their meaning. This also colours arrowheads and TeX glyphs correctly without changing geometry or treating filled regions as outlines.

Begin every new native figure with one JSON comment line:

```tex
% mathsmap-diagram-colours {"version":1,"kind":"geometry","base":["sourceOutline"],"semantic":[{"name":"altitudeRed","hex":"EF6068","reason":"Highlighted perpendicular altitude"}],"reference":"Source page 11, triangle A"}
```

Use `kind: "graph"` for graphs and number lines. New ordinary marks should use black directly (`base: []` is valid). Base aliases must have `\definecolor` definitions. Give two different aliases to an identical source hue when its uses have different meanings. Semantic entries require a six-digit hex value, name, specific reason and diagram reference. Region/material fills are semantic entries as well. Never declare an entire decorative source palette semantic merely to pass QA.

The compiler emits `data-diagram-kind`, base-role and semantic-evidence metadata. Geometry QA checks strokes, fills and text against the shared standard palette; semantic metadata records meaning and cannot authorise source shades. Graph QA also checks standard colours. Original `data-graph-source-palette` metadata stays as source evidence and does not override black geometry defaults.

## Maintenance and evidence

`node scripts/booklet/normalise-diagram-colours.mjs --report <file>` performs a dry run; `--apply` writes a checked transaction. The migration covers active nested diagrams and bank content, skips historical/source evidence, keeps local placement and uses bank sync helpers. Generated graph code excluded from shared content receives a style-only bank revision with reconciled ownership. Conflicting content stops the transaction. A second run must report zero changes.

The reviewed trig aliases distinguish ordinary outlines/labels from response labels, altitudes, highlighted angles/diagonals, compass directions, material silhouettes and shaded regions. Linear's native graphs retain all original colours. Its four raster replacements retain the original `src` and complete original diagram in `spec.originalDiagram`: fence panels (1–3 bays), trapezoidal tables (1–3 tables with 5/8/11 chairs), shaded tiles (1–4 central shaded tiles), and square tables (1–3 tables with 4/7/10 chairs). Geometry and semantic fills are native editable TikZ. Source assets and archived revisions remain unchanged.

`node scripts/booklet/check-diagram-colours.mjs` compiles source and candidate diagrams with the bundled engine, checks every native geometry palette and produces local contact sheets and an isolated cache for PDF verification. Local evidence lives under `.booklet-work/diagram-colours/`; it is not a release asset. Review all affected occurrences, retained-image applicability, editor/save/reopen parity and all five editions before claiming full visual acceptance. Do not stamp old source signatures as current merely because the migration succeeds.

## Accepted maintenance review ? 11 September 2026

All three active projects and reusable bank content were audited. The migration adopted explicit roles on 591 project diagram occurrences, including four retained-image reconstructions. All 324 distinct native general diagrams passed palette QA and visual inspection. The retained-image review covered 53 distinct active assets, preserving mathematical highlights, region/material fills, matchstick material colours and source interface screenshots.

Editor preview, invalid-draft recovery, save/reopen and cached rendering passed. All five editions of each project passed screen/layout and printed-PDF QA; all 1,056 pages were rendered and visually reviewed in 95 contact sheets, alongside the individual diagram review. Graph model recognition and calibrated answer sizes remain compatible with the new metadata. The production build and all 641 tests passed; the final bank timestamp correction additionally passed 29 targeted diagram, palette and sync tests.

The second migration run reports zero changes. All 317 linked bank questions are synchronized. Structural comparisons confirmed that question text, answers, mathematics, source evidence and pagination settings were preserved. Only previously valid source-content/presentation verification signatures affected by this maintenance were refreshed; pre-existing unchecked records remain unchecked.

The durable receipt is `booklets/provenance/diagram-colours-2026-09-11.json`. Per-edition PDFs, page maps, reviewed layout caches, source/candidate comparisons and editor evidence are retained locally under `.booklet-work/diagram-colours/`. Original assets, project histories and recovery evidence remain untouched.


Current palette precedence (11 September 2026): all editable content in every current booklet, bank and future transcription uses the [standard booklet palette](booklet-standard-palette.md). Preserve mathematical meaning through standard accents, rather than retaining source shades. This includes teaching responses, worked solutions, fills and backgrounds. Retain original evidence and raster pixels; restored projects require current palette acceptance before export.
