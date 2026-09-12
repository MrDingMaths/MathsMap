# Smooth booklet editing implementation receipt - 12 September 2026

Scope: shared editor/session ownership, structural editing, on-page layout and paragraph controls, keyboard behavior and compatibility. Existing project/bank content and layout migration were excluded. All browser writes were intercepted in memory. Original project hashes still match the representative-render report.

Implemented optional `preserveEmpty`, explicit rendered-host identity with fragment ownership updates, stable math-preview geometry, actual-parent deletion, table last-track removal, native and booklet arrangements, handles and labelled drop targets, image/column alignment, paragraph controls, fixed 1 cm default tabs and explicit reset of saved custom tabs. History boundaries distinguish typing, deletion and individual structural commands. The pinned editor release records host-owned extensions so upstream synchronization cannot silently overwrite them.

Validation:

- All 708 model tests passed (6,127 ms on the final model run).
- Production build passed; existing large-chunk warning remains.
- Final smooth-editing browser regression passed 16 checks in 15,138 ms, with 22 in-memory saves. It covers Enter before an equation, selected prose deletion, undo/redo, unique IDs, one active host, unchanged equation/neighbour content, reopen, nested deletion, bottom/sole rows, sole column, forward/reverse/merged-cell navigation, composition guard, retained/reset custom tabs, native placement and column resizing as separate undo steps, list indent/outdent, maths insertion and keyboard exit.
- Broader document tools passed (25 in-memory writes); workspace passed (16); text-spacing passed (2). Maths formatting, Symbols palette, focus exit/re-entry, LaTeX editing and Alt+= passed.
- Selection geometry and opening Layout were checked within the required 1 CSS pixel tolerance. Measured initial equation field geometry: `{"before": {"x": 486.296875, "y": 756.53125, "width": 653.859375, "height": 20.53125, "nextY": 792.15625}, "active": {"x": 486.296875, "y": 756.53125, "width": 653.859375, "height": 20.53125, "nextY": 792.15625}}`.
- Actual Volume prism column alignment and capacity-image placement saved and restored exactly with Undo. Preview/PDF screenshots cover selected patterns plus source neighbours and all five editions. Contact sheets were visually reviewed; no clipping, collision or broken navigation was observed. Diagram labels and mathematical content retained their existing rendering.

Representative render counts (student / short / worked / with-short / with-worked):

| Project | Revision | Pages | Measured export/check ms |
| --- | --- | --- | --- |
| index-laws-complete-v1 | 206 | 7 / 1 / 2 / 8 / 9 | 6353 |
| linear-relationships-v1 | 8 | 6 / 1 / 1 / 7 / 7 | 6922 |
| non-right-angled-trigonometry-v1 | 169 | 4 / 1 / 2 / 5 / 6 | 9293 |
| volume-v1 | 99 | 7 / 3 / 5 / 10 / 12 | 12236 |

104 representative/neighbour pages across 20 edition exports; this is not a new full-source transcription acceptance. Local PDFs, PNGs, QA results, hashes and per-edition timings are in `.booklet-work/smooth-editing/projects/`. Rendering evidence was reused after changes limited to editor-only controls, history and shortcuts; current source hashes were checked.

Observed print limitation: Volume representative page 3 (`p4-q1`, drawing response boxes), in student/combined editions, reaches 0.503 mm into the QA gate's reserved 3 mm footer-clearance area (about 2.497 mm remains). No footer ink collision or clipping appears in the reviewed capture. Its saved layout was preserved. The automated report retains this finding; it is not recorded as a clean print-QA pass.

Retries and phase evidence: early keyboard/selection tests exposed tab-caret restoration, duplicate empty-line geometry, list-handle placement and history grouping issues; fixes were followed by focused reruns. Initial representative exports retried after selecting a practice example for answer-only editions and excluding archived `sourceLayoutEvidence` from the current-document audit. The sandbox later failed to create processes with Windows error 1909; an authorized alternate launcher recovered verification. A PowerShell stderr warning initially obscured the build exit status; the final build explicitly returned the subprocess exit code. Raw timings/logs remain local. No overall time or token savings are claimed.
