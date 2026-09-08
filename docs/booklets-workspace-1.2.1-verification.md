# Booklets workspace / MathsEditor 1.2.1 verification

Verified on 6 September 2026. The fresh read-only pilot snapshot is `linear-relationships-pilot-v1`, revision **6**, with source pages 1, 2, 3, 7, 9, 13, 14, 16, 24, 28, 29 and 33.

## Delivered behavior

- A 240 px collapsible navigator and paper canvas replace the permanent three-column workspace. Navigation becomes a drawer below 1100 px. The compact header contains project selection, save status, Undo/Redo, comparison, Review, PDF, Project and Tools.
- Paper-only Fit width, Fit page, 100% and incremental zoom; fixed-page previews use a top-left scaling origin without the former centering translation; previous/next page controls; contextual page/block actions and readable content labels.
- Native modal content and diagram editing outside the scaled paper, with visible Save/Cancel, dirty-close confirmation, focus trapping/restoration, a keyboard/pointer resizable editor-preview divider, and mounted Edit/Preview tabs below 1000 px. Source evidence occupies an optional preview tab.
- Review tabs and a conditional 360 px dock, diagram summaries opening the focused editor, a PDF drawer, and dedicated full-width assembly/measurement views.
- Opt-in standalone `controls="contextual"` groups Format, Insert, common properties and Advanced controls. Narrow-screen Format controls collapse. Table widths and boundary handles stay directly available. Dark-theme mathematical input uses readable ink on white paper.
- Draft, proposal, conflict, persistence and approval semantics remain in place. Workspace preferences use session storage. Diagram recovery identifies the project, target, path and diagram.

## Checks

| Check | Result |
| --- | --- |
| Application tests | 400 passed; active Svelte components compile without warnings |
| Standalone document model | 10 passed |
| Document-editor browser check | Passed default and contextual controls, image insertion/failures, mixed clipboard identity remapping, history, tables, annotations, keyboard properties, readonly and print |
| Studio workflow browser check | Passed focused image Save/Cancel/reload, numeric and pointer table widths, one history entry per drag, merge/split, proposal acceptance/undo, and two-session disjoint/overlapping 409 recovery |
| Responsive workspace | Passed 1920×1080, 1440×900, 1280×800, 1024×768 and 390×844; no shell overflow; visible Save/Cancel; unscaled controls; navigation, comparison scroll restoration, zoom, panel toggles and draft retention |
| Keyboard and themes | Native modal focus trap/restoration, dirty Escape/Keep editing/Discard, divider arrows and Shift+arrows, mounted tabs, dark maths contrast, light-theme rendering and touch-sized mobile actions |
| 200% reflow | Emulated a 1440×900 display using a 720×450 CSS viewport and device pixel ratio 2; Save/Cancel remain accessible |
| TikZ | Deliberately reordered mock completions, valid/invalid/valid recovery, width-only updates, independent student/answer/teaching diagrams, proposal Save/Cancel; real source 7/9/16/28 diagrams also exercise errors, retained output and cached recovery |
| Fidelity browser check | Passed the separate Full booklet workflow and annotation resizing |
| Fixed-page screen geometry | Passed 18 combinations across six viewport sizes (including 883 px) and Fit width/Fit page/100%; paper left edge and width match the frame, with no shell overflow |
| Current pilot layout | All three answer modes passed; 12 pages, 12 footers, zero page/footer collisions and zero maths/diagram errors |
| Production build | Passed; existing large-bundle advisory remains |
| Shared release | Version 1.2.1; all 33 runtime files match standalone and their SHA-256 checksums |

The existing browser scripts use intercepted fixture APIs and reject unmatched non-GET booklet requests. The bank-manifest GET is also intercepted because the development endpoint regenerates its index. Verification does not save to the live pilot.

## PDF regression inspection

The actual project renderer produced:

- `output/pdf/editor-1.2.1-pilot-student.pdf` — 12 pages.
- `output/pdf/editor-1.2.1-pilot-short.pdf` — 12 pages.
- `output/pdf/editor-1.2.1-pilot-worked.pdf` — 12 pages.
- `output/pdf/editor-1.2.1-edited-fixture.pdf` — 3 pages, including inline prose/math/image ordering, mixed spans, a rotated table and annotation geometry.

All **39 pages** were rendered with Poppler, visually inspected and compared with the 1.2.0 exports at a 1600 px page dimension. All 39 were pixel-identical. Pagination, content, answer visibility, rotated substitutions, graphical answers, line/plot geometry, first-line labels, annotation anchors and footer spacing are unchanged. The standalone browser check also exports and inspects its one-page fixture.

Snapshots, logs, responsive screenshots, per-page comparisons and rendered contact sheets are in `tmp/ux-verification/`. Integration behavior and source-export limits are documented in `docs/maths-editor-integration.md`.

## Preservation

The pilot matches the pre-task snapshot byte for byte. Question-bank manifest content matches the pre-task snapshot (SHA-256 `08e83878004871eea72867a7453481507e1bec6549828117343a6527e60165bd`), excluding `generatedAt`. The existing development endpoint regenerates that timestamp when the live workspace loads; its current timestamp is retained. No question entries were changed. The public content manifest retains SHA-256 `971fa46d38f3b254a08f00417db0cbe443f847c1d043ef1c425d4de7492d13b3`. Existing project URLs, separate Booklets/Full booklet workflows, project schema and backend APIs are unchanged.

No deployment, database changes, transcription jobs, benchmark comparisons or broad source repair were performed. Compilation and rendering verification do not grant mathematical or fidelity approval.
