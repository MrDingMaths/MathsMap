# 3D visibility correction acceptance — 12 September 2026

The loading ramp regression was stored in content. Commit `5e0bb759` changed its front/back styles and dimension attachment without changing the view. Source repairs now cover **302 occurrences (284 distinct drawings) in 38 content/quiz files**, including rectangular, triangular, trapezoidal and concave prisms, pyramids, cone tangencies, curved prisms and composite solids.

The correction register is `booklets/provenance/solid-visibility-2026-09-12.json`. It retains each location, original and repaired source hashes/code, mathematical labels, decision and visual evidence reference. Originals and render receipts remain local under `.booklet-work/solid-visibility/`. A comparison against the saved originals confirms that all 38 files contain only the registered diagram changes; question prose, values, units, solutions and other fields are unchanged.

## Construction and prevention

- `src/lib/solid-geometry.js` provides explicit vertices/faces/view, outward-normal classification for closed convex solids and occlusion splitting for concave/open solids. Checked curved templates distinguish silhouettes from hidden arcs. Labels are separate paths, and angle marks use projected points.
- Generation, repair, booklet candidate validation and final compact-booklet acceptance share the visibility audit. Changed vertices, stale metadata, missing boundaries, additional unmodelled geometry and unsupported constructions require review. Retained-image decisions are bound to asset hashes. Reviews cannot waive a detected visibility defect.
- The canonical MathsDatabase TikZ source sections and their MathsMap mirror are reconciled. Existing local network, typography, colour, palette and graph-stroke guidance was retained. No database records were changed or deployed.

## Review coverage

The inventory traversed theory, practice, solutions, quizzes, active projects and the reusable bank, including answer-specific overrides. It examined hand-projected code as well as tdplot code and retained images. The intentionally broad classifier also selected planar figures, nets, graphs and construction diagrams; their exact hashes have recorded review decisions.

All 284 distinct repaired drawings were compiled and visually inspected at 78 mm width; individual duplicate locations remain in the register. Mathematical label multisets match exactly before and after. Final repaired variants have 10 pt native labels, with no detected label overlaps or clipping at that width. Eight shared templates and mirrored-view examples were separately rendered and inspected. All 49 distinct retained image assets were visually reviewed and kept intact.

No confirmed visibility defect required editing an active booklet project or bank record. Their current visibility acceptance passed. Existing revisions, local layouts, pagination and source evidence were preserved; a full five-edition trig export was therefore not triggered.

An isolated in-memory project exercised the real editor using the repaired ramp: fresh preview, 50/75/100% page zoom, repeated 40/110/55/78 mm resizing, draft edit, save, reload, reopen and cached rendering. The 40 mm check exposed insufficient outer label clearance; a guarded final refinement fixed it. All tested widths now retain 10 pt black labels without clipping or overlap. The final three-page question/short-answer PDF was inspected visually and with printed bounds; navigation and footer clearance passed. This test wrote no project or bank files.

The public Volume of a prism skill page was also checked after its lazy TikZ compilation settled. Its Development question 1 now shows the labelled triangular cross-section solid, with the obscured rear edges dashed. The screenshot and 16.445-second browser-check receipt are retained locally. Earlier screenshot attempts caught the loading placeholder; the final check explicitly waits for compiled output.

## Final checks and measured work

- **673 tests passed**, zero failed; final suite wall time 4.023 seconds.
- **One production build passed**, wall time 5.327 seconds.
- Full visibility audit: zero unresolved defects/reviews.
- Guarded repair dry run after saving: zero changes; repeated after the ramp clearance refinement: zero changes.
- All applicable content gates passed except the **pre-existing practice-bank manifest count mismatch**. The same validation failure was captured before and after these changes; it is outside this diagram repair.

Measured render/QA receipt intervals (engine initialization excluded): early representatives 8.797 s; retained images 0.797 s; broad structural review 348.655 s; initial repair review 189.617 s; expanded repair compilation/QA 174.925 s; changed-drawing review 13.243 s; final five-drawing review 4.231 s; final template review 4.765 s. Valid SVG caches were reused during the changed-drawing checks.

There were no failed diagram compilations in those batches. The editor harness had one failed attempt because it measured the screen SVG after print CSS hid it; the corrected harness prepares and checks the print DOM. Two successful PDF proofs bracketed the final clearance refinement. An initial PowerShell `npm` invocation was blocked by execution policy; the checks used `npm.cmd`/Node thereafter. Full-suite testing ran twice as implementation and regression coverage settled. These are actual receipts, not estimated efficiency savings.

The machine-readable register contains the final timing receipts, audit counts and scope snapshot. All changes are local; deployment was not performed.
