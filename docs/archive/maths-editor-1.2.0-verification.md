# MathsEditor 1.2.0 verification

Verified on 6 September 2026 against the current `linear-relationships-pilot-v1` project, revision **6**, without saving test edits to it. The project's contents match the fresh read-only snapshot used for export.

- 400 application tests and 10 standalone model tests pass.
- `check-document-editor.mjs` passes native inline-image insertion, typing around the image, width editing without focus loss, rich clipboard identity remapping, undo/redo, reload, missing-image feedback, decode failures, keyboard properties, logical merges/splits, numeric and pointer/keyboard widths, one history step per drag, annotations, readonly and print.
- `check-studio-workflow.mjs` passes image Cancel and Save/reload, proposal acceptance/undo, deterministic stale TikZ completions, invalid/valid recovery, width-only updates, independent student/answer/teaching drafts, and two-browser-session revision conflicts. Disjoint edits merge; overlapping edits require a choice. All writes use the intercepted fixture server.
- The same workflow check also uses the real TikZ engine on current source-page 7, 9, 16 and 28 diagrams, testing compile errors, preserved previous output, recovery and Cancel.
- `check-fidelity-v3.mjs`, current-project `check-pilot-layout.mjs`, and the production build pass.
- All 33 pinned runtime files match standalone and their release SHA-256 checksums.

## PDF inspection

The actual project renderer exported `output/pdf/editor-1.2.0-pilot-student.pdf`, `output/pdf/editor-1.2.0-pilot-short.pdf` and `output/pdf/editor-1.2.0-pilot-worked.pdf`. Every page was rendered with Poppler and visually inspected: **36 pilot pages** in total. Layout checks report zero page/footer collisions or diagram/math errors in all modes. Question labels remain on the first stem line; rotated substitutions, annotation boxes, plotted answers, long number lines and square Cartesian diagrams remain visible.

`output/pdf/editor-1.2.0-edited-fixture.pdf` contains three inspected pages (cover plus two content pages) generated from an isolated fixture. It includes prose/math/inline-image ordering with a 2:1 graphic, a narrow rotated table, mixed horizontal/vertical spans, and a wide annotated table. The standalone browser harness also exports and verifies one page at `tmp/studio-verification/editor.pdf`.

Geometry results are in `output/linear-pilot/house-style/browser-verification.json`; screenshots, fresh input snapshots and intermediate renders are in `tmp/studio-verification/`. This is editing and rendering verification, not a new mathematical/fidelity approval or a reassessment of benchmark provenance.

## Deliberate behavior

Plain-source projection is lossy and reports it; rich JSON is authoritative. Splitting retains all current merged prose in the surviving cell and restores formatting to newly empty cells. Column insertion preserves existing absolute widths and requires room for at least a 5 mm new track. Saving a diagram creates a pending repair proposal, never an approval. No publication, transcription job, database changes or live pilot edits were performed.
