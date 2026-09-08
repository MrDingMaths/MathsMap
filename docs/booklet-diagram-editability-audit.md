# Booklet diagram editability audit

Historical pre-repair inventory. The corrective work is now saved in revision 73; see [the completed repair and verification report](booklet-graph-repair.md).

Audited the current saved `booklets/projects/linear-relationships-complete-v1.json` on 2026-09-07. Traversed section content, including question, worked-example and answer diagrams; excluded source evidence and original-diagram metadata. This is a code/data audit, not a visual or mathematical correctness certification. Unsaved browser drafts are outside scope.

## Inventory

- 314 active diagram records: 175 TikZ (175 distinct IDs), 139 image records.
- 0 TikZ records use PGFPlots axis/addplot commands.
- 7 contain equation-based TikZ plot commands: p16 example; p61 Q5/Q6 solutions; p62 Q7/Q8/Q9 solutions; p63 Q10 solution.
- 89 TikZ records retain a mathematicalModel. Of these, 46 have nonempty line definitions and 51 have nonempty point definitions (overlapping categories).
- The remaining diagrams include blank grids, coordinate exercises, patterns and schematic figures. Lack of an equation plot alone does not establish tracing or mathematical error.

Full record inventory: `booklet-diagram-editability-audit.csv`.

## Confirmed causes

1. `scripts/booklet/prompts/diagram-reconstruction-v4.md:5` explicitly says ?Plot equations and coordinates mathematically, not traced guesses.? It does not require PGFPlots or retention of the equation in generated code.
2. `scripts/booklet/linear-geometry.mjs:19` calculates line endpoints from slope/intercept and graph bounds, then writes fixed `\draw ... (x1,y1) -- (x2,y2)` commands. This is mathematically generated geometry, but its TikZ representation loses the editable equation.
3. `scripts/booklet/repair-linear-feedback.mjs:136` preserves the model alongside the generated code. Other callers, including `correct-pilot.mjs` and `pilot-final-pages.mjs`, save generated code without consistently saving its model.
4. `src/components/DiagramDraftEditor.svelte` exposes TikZ code and physical width, with no equation/model editing controls. `BookletReviewInspector.svelte` displays models as read-only JSON. Editing a saved model therefore does not drive live graph regeneration.
5. `scripts/booklet/source-fidelity.mjs` checks missing answers/sketches, retained rasters and clipping, but does not enforce equation-based graph code or model/code consistency.

## Concrete examples

- p40 Q3 graphs: known slopes/intercepts are supplied to replaceGraph, then serialized as fixed endpoints.
- p73 comparison graphs: equations survive in model data but TikZ uses endpoint segments such as `(-1,-5) -- (4,5)`.
- p90 identification graphs: saved models exist, while code contains decimal endpoints such as `(-0.3333333,7) -- (4.3333333,-7)`.
- p59 Q1 answer graph: `(0,1) -- (7.67,24)` is used for the line intended as y=3x+1. The endpoint is rounded (3*7.67+1=24.01); this illustrates the representation problem, not a completed visual correctness review.

## Corrective direction

Make graph equations, domains, bounds, ticks, points and labels the editable source of truth. Generate PGFPlots axis/addplot code with expressions rather than fixed endpoints for function graphs. First compile a representative example in the actual preview and export engines to establish PGFPlots compatibility. Keep coordinate-defined geometric figures and discrete data as coordinates where appropriate.

Start migration with the 46 diagrams already retaining line models, then recover other known equations from their source questions/generation scripts. Preserve annotations, overlays, student/solution visibility and layout. Add equation/model controls to the editor and a generation gate that flags function graphs reduced to arbitrary fixed segments. Compare regenerated graphs against the source and verify mathematical coordinates independently.

Investigation only: no diagram content or generation behaviour was changed.
