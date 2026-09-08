# Editable mathematical graphs — completed 2026-09-07

Saved `linear-relationships-complete-v1` as revision **73**, retaining revision 71 in the project's revision history.

## Changes

- Replaced **93 image records** with native TikZ/PGFPlots: 91 Cartesian graphs, plotting grids and scatter diagrams, plus two coordinate-rectangle diagrams on p12.
- Regenerated **150 existing TikZ records** from editable mathematical data. This includes 20 legacy solution overlays; those are part of the record count, not additional printed questions.
- The resulting inventory is **268 TikZ records and 46 image records**. The 243 migrated records retain mathematical models; the other 25 TikZ records include existing coordinate geometry, number lines and schematic figures.
- Function curves use explicit equation-valued `\addplot` expressions. Domains are calculated from equations and visible axis bounds, retaining arrowheads at clipping boundaries. Vertical lines use parametric plots. Scatter data remains discrete.
- Added graph controls for slopes, intercepts, vertical lines, domains, colours, bounds, tick intervals, points, labels and rectangle dimensions. Changes regenerate the live preview. Linked solution points and equation captions follow equation edits; independent source data stays fixed.
- Retained source images/code in each migrated record's `spec.originalGraph`. Preserved diagram IDs, roles, widths, question/solution visibility, text and layouts. Corrected the 20 legacy overlay references and verified their bounds and dimensions match their base grids.
- The remaining images are illustrations, matchstick/geometric patterns and instructional software screenshots. The full Desmos interface and equation-entry screenshots remain images; its standalone graph crops were reconstructed. P12 Q16d has no supplied left x coordinate, so its adjustable schematic width is explicitly described in the editor.

The original cause was a generator that calculated mathematically correct endpoints but saved only fixed paths, together with image-retention fallbacks and missing model editing controls. The shared generator, reconstruction prompts, ingestion and validation now preserve equation-based graph data.

## Verification

- All **243 migrated records / 197 distinct prepared graphs** compiled successfully with the application's bundled TikZJax TeX/WASM engine and the same `prepareTikz` package/preamble configuration.
- All **20 combined question-grid/solution-overlay figures** compiled successfully; representative composites were visually inspected.
- Inspected the 93 source images and rendered replacements, including blank student grids, unequal scales, half-unit subdivisions, multi-graph labels, coordinate captions and steep-line arrowheads. Reviewed contact sheets of the 150 existing TikZ replacements.
- Migration assertions verify unchanged non-diagram content, valid project structure, matching model/generated code, preserved original diagram evidence, and matching overlay bounds and dimensions.
- **135 targeted tests pass**, including graph edits, dependent point/label updates, model round trips, invalid drafts, source models, rectangle dimensions, minor grids, booklet layouts, persistence, equation alignment, and Svelte compilation. Production build succeeds (existing large-bundle warning).
- Reloaded revision 73 from disk and verified every migrated graph's prepared code key against the successful compilation record.

Verification used standalone SVG renders from the actual TeX engine. An automated end-to-end Studio browser session was unavailable in this environment; this is not a claim of full browser or PDF pagination verification.

Per-record conversion details and retained-image inventory: [booklet-graph-repair-records.json](booklet-graph-repair-records.json). Runtime render and compilation evidence is under `output/graph-repair/`.

## Editing

Open a migrated diagram in Booklet Studio. Use **Graph equations** and **Axes and grid** beside its live preview, then **Save**. Use the graph selector for multi-panel diagrams. **Generated PGFPlots code** exposes the generated source; **Switch to manual TikZ editing** deliberately detaches the mathematical controls.

The earlier text/layout fixes remain in place: shared normal/edit arrangements, blue theory solutions, side-by-side content editing with live drafts, hidden Studio site footer, independent left-aligned simultaneous-equation prompts, and fraction-aware inline line boxes.
