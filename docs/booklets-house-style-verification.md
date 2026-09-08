# Booklet Studio house style and direct editing — 6 September 2026

Implemented structured editing on the selected booklet content, keeping the focused editor for complex work. Text/maths, table boundaries and tabs use MathsEditor; answer-space and diagram handles offer keyboard adjustments. Related source blocks move together. Inline drafts survive transfer to the focused editor, and navigation is guarded until saved or cancelled.

House style 1.0.0 is shared from the standalone MathsEditor project and pinned in MathsMap's editor release 1.4.0. It supplies named colours, table defaults, dotted response leaders and 1.5 Key Ideas spacing. Project details offers explicit, undoable adoption; existing projects are not rewritten on load. Structured documents, stable IDs, local overrides and source evidence remain stored. Transcription instructions include the same house rules and source-feature requirements.

The 93-page Linear Relationships repair starts from preserved revision 11 in `output/linear-feedback/before.json`. The reproducible repair script creates a candidate first and only saves with `--adopt`, checking both the baseline file and revision. The 52-item [feedback register](linear-booklet-feedback-2026-09-06.json) records source pages, stable targets, changes and evidence. Repairs include native table arrows and skipped columns, recovered headings/attributions, source-based graphs, hanging labels, suitable response space, and the pattern/table/equation/graph arrangements on pages 59–64 and 67–70.

## Validation

- All 408 repository tests passed. After the final formatter/component cleanup, all 15 relevant style, inline-content and Svelte-warning checks passed again. The production build succeeds; the existing large-bundle advisory remains.
- Standalone MathsEditor: 15 tests passed. `check-document-editor.mjs` passed rich editing, tables, image crop, tabs, clipboard, history, reload, read-only and print checks. `check-studio-workflow.mjs` passed the Studio workflow, including conflict recovery, proposals, batch undo and teaching-answer visibility.
- `check-linear-feedback.mjs --all --interaction --image-check` used the actual 93-page candidate, intercepted persistence into an isolated in-memory project, and found zero page overflows, diagram failures or browser exceptions. Final changed pages 35, 37, 38 and 89 were checked again. Ordinary editing mounts no hidden print pages and only one selected MathsEditor.
- The full-book drag test measured 16.76 ms median and 25.04 ms maximum per Playwright pointer/animation-frame sample. Movement writes nothing; release writes once; one Undo restores the gesture. Escape cancels without writes. Redo and direct typing survive save/reload. These are local machine measurements, not cross-device guarantees.
- The repeatable `verify-linear-repair.mjs` checks all 93 source references, stable answer-bearing IDs, preserved source/assets, 598 populated answer records and recurring scaffold classes. Median isolated commit costs were approximately 15.3 ms for the undo snapshot, 0.03 ms for settings update and 0.49 ms for approval reconciliation. The initial supplied measurement was approximately 402 ms before rendering. These operations now occur on release, never on each pointer movement.
- Crop and grayscale match between booklet and focused image editor, including save/reload. Unrelated approvals remain current; changed content/layout invalidates dependent approvals. Saving gives immediate status and queues changes made during an in-flight save.
- Student and worked-solution exports each contain 93 pages; the short-answer key contains 30 physical pages. All pages were visually inspected across the export passes, with final changed pages rechecked. Final print metrics contain zero detected collisions and no TikZ failures. Source page references remain available in all arrangements.

## Outputs and remaining review

- [Student booklet](../output/linear-feedback/linear-relationships-student.pdf)
- [Short answers](../output/linear-feedback/linear-relationships-short-answers.pdf)
- [Worked solutions](../output/linear-feedback/linear-relationships-worked-solutions.pdf)
- Full browser evidence: `output/linear-feedback/browser-acceptance.json`; final page checks: `browser-metrics.json`; timing: `performance.json`; repair groups: `repairs.json`.

This remains a review draft. The 143 retained source-image records carry an explicit `needs-review` status and retention reason; source evidence is preserved where faithful native conversion has not been verified. Implementation/layout checks do not grant human mathematical, diagram or curriculum approvals. Teaching-answer switches retain their independent settings. Arbitrary free positioning is outside this iteration.

To reproduce: run `node scripts/booklet/repair-linear-feedback.mjs`, `node scripts/booklet/verify-linear-repair.mjs`, and the browser check above against the local Vite server. Use `scripts/booklet/export-pdf.mjs --project output/linear-feedback/candidate.json` with each export mode. Do not run `--adopt` again against a changed active revision; merge new saved edits first.
