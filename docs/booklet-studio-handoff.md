> Historical design: workflow and approval/proposal instructions below are superseded by [Booklet Studio: human editing workflow](booklet-human-workflow.md), 7 September 2026. Teaching and source-evidence principles still apply.

# Booklet Studio handoff — 6 September 2026

Use the following as the continuation prompt. This snapshot supersedes older progress counts and pending-approval statements in the chronological implementation log.

---

Continue implementing Booklet Studio in `D:\WebApps\MathsMap`. Start with the retained Linear Relationships transcription drafts, then complete the outstanding acceptance work below. Work through concrete changes and checks; do not stop at proposing another plan.

## Read first

- `docs/booklet-implementation-log.md` — implemented features and chronological evidence; the final entry gives current transcription status.
- `docs/agy-transcription-performance.md` — working direct-input transport and measured concurrency.
- `docs/maths-editor-integration.md` — standalone source of truth, structured API and remaining editor limitations.
- `docs/booklet-pedagogy-contract.md` and `docs/booklet-calibration-findings.md` — teaching principles, calibration and unresolved source issues.
- Applicable repository instructions, current git status, and the batch review inventory below.

The workspace has extensive uncommitted implementation work and source documents. Preserve existing changes, original booklets, bank records, evidence, prompts, IDs and user edits. Do not reset or clean the workspace. Do not patch MathsMap's copied editor runtime independently of the standalone source.

## Current state: generation is complete, review is not

Full import: `.booklet-work/full-imports/linear-relationships-studio-v1`.

- There is draft material for all **93 source pages**.
- The exact lane contains **15/31 task results, representing 45/93 pages**. These are adopted drafts, not a fully approved booklet. Full-import page approvals remain **0**.
- The other **16 tasks / 48 pages** are retained under `.booklet-work/transcription-batches/linear-remaining-high-10-v1`.
- Those tasks cover pages **43–48 and 52–93**. Task 017/pages 49–51 already existed and was skipped.
- The whole remainder ran successfully with **Gemini 3.8 Flash High, effort high, concurrency 10**, in **369.328 seconds**. Peak active workers was 10; all 16 returned candidates; no request failed and no automatic retry was needed.
- **No transcription job is running. Do not regenerate this batch.** Its initial outcome was nine `validated-draft` packets and seven `draft-needs-repair` packets. Initial validation is not mathematical, content or layout approval.
- Deeper inventory found question-model errors in five packets, 20 presentation flags across 13 packets, 24 TikZ records, and 112 model-supplied diagram approval labels. Model labels are not accepted review decisions. Every referenced local evidence asset was found.
- The Full booklet UI now displays all 93 pages through a read-only **Draft preview** before merge. `scripts/booklet/transcription-preview.mjs` combines existing exact results and batch drafts without adopting or approving them. This fixes the previous empty-view message. Editing/approval still use the merged workflow; do not mistake preview availability for completed repair or merge.

Read `batch.json`, `summary.json` and `review-inventory.json` in that batch directory. Each task has a `direct` folder with the immutable raw candidate, execution manifest, pinned inputs and ledger. Candidate hashes and exact errors are in the inventory.

Regenerate the local inventory without a model call:

```powershell
node tmp/agy-transcription-diagnostics/report-batch.mjs .booklet-work/transcription-batches/linear-remaining-high-10-v1
```

## Priority 1: repair and integrate the full transcription

1. Inspect the errors against source page PNGs, Word graphics and teacher evidence. Review all new packets, including initial passes. Issues include answer dots, malformed tables, possible graph/table duplication, missing worked-answer evidence, currency/maths delimiters and heading/table treatments. The repeated section ID in task 028 may be legitimate shared metadata: investigate the validator before changing identities or weakening duplicate-content protection.
2. Preserve raw candidates. Make local repairs in new files with explicit before/after records and hashes. Preserve source lineage, stems, part labels, dependencies and source image bytes. Reuse tasks 013/014 as examples of recorded repairs, not as unquestioned templates.
3. Separate unreviewed TikZ alternatives from current source-image rendering to prevent duplicate diagrams. Remove model self-approval from repaired drafts while retaining it in raw evidence. Verify graph equations/domains and geometry constraints; never invent an equation to match an image. Keep original imagery where faithful reconstruction is uncertain, and use the existing pinned TikZ prompt pipeline for later proposals.
4. Align student and teacher evidence by question identity and mathematical content, not pagination. Student images govern visible prompts and answers: extracted student PDF text can include invisible practice answers. Preserve visible teaching solutions; keep practice answers in answer fields. Flag absent or contradictory teacher evidence instead of inventing a supplied solution.
5. Check structural/question validation and render each repaired source-page container. Verify all parts, numerical answers, tables, diagram assignments, cropping, scaffolds and answer visibility. Local render containers are not final paginated PDF validation.
6. Adopt repaired drafts into the exact lane with execution/repair provenance after checks. Preserve existing results and reviews. Audit the earlier 45 pages as part of the complete booklet; adoption alone is not evidence they all passed fidelity review.
7. Reconcile cross-page question continuations and build the complete reviewable project through the current import flow. Keep content, mapping, sequence and layout decisions separate and revision-bound.

Useful local tools:

```powershell
node tmp/agy-transcription-diagnostics/check-packet-result.mjs DIRECT_DIR RESULT_FILE
node tmp/agy-transcription-diagnostics/render-packet-result.mjs DIRECT_DIR RESULT_FILE OUTPUT_SUBDIR
```

Read the scripts before use. The checker defaults to task 013 if the result argument is omitted. The render helper needs the local Vite app and intercepts project writes. `adopt-task-013-draft.mjs` is a diagnostic helper, not a general production adoption API: it assumes a repair chain and candidate-file ledger field that successful direct executions do not always record. Adapt and validate provenance handling before applying it to the new batch; never fabricate visual-inspection receipts.

Previous repair evidence is under `.booklet-work/transcription-benchmarks/task-013-direct-high-v7` and `task-014-direct-high-v1`.

## Priority 2: finish editor acceptance

Cleanup and the initial rich-editor integration are implemented. The source of truth is `D:\WebApps\MathsEditor`; MathsMap consumes a hash-pinned 1.0.0 release through a thin Svelte adapter.

Remaining editor work includes true image insertion inside a prose run and smoother merged-table row/column operations. Current image crop/resize is numeric and beside-text placement follows document flow; the current “inline” option is a figure between blocks. Verify the intended direct, keyboard-friendly editing experience on representative booklet content, including selection, clipboard, undo/redo, save/reload and print fidelity. Make changes in the standalone project, verify its fixtures, then sync the pinned release. Preserve `.document` structured storage; `.value` is only the legacy text/maths projection. AI/OCR and free page positioning remain later scope.

## Priority 3: complete calibration and pedagogical audit

The full extracted text of the percentage (61 pages), index-laws (63) and non-right-angled-trigonometry (59) exemplars has been reviewed. Complete visual calibration of their **183 pages** is still outstanding, especially image-only content and suspected source mistakes listed in the findings document.

Use the existing unified workspace and proposal mechanism to audit theory blocks and question parts: teaching atoms, prerequisites, rationale, teaches/practises/assesses roles, splits, merges and mapping corrections. Preserve shared dependencies and separately review content, mappings, sequence and layout. Teaching atoms remain distinct from public MathsMap skills; public graph changes follow their existing separate proposal rules.

Examples should expose essential decisions with simple arithmetic, distinguish plausible wrong methods, vary one essential feature in contrasts, and avoid accidental shortcuts. Guided work must not introduce an untaught routine. Resolve source contradictions through traceable proposals.

## Priority 4: complete controlled revisions and assembly acceptance

Revision-bound proposals, individual decisions, dependent acceptance units, stale-conflict protection and guarded batch undo are implemented and tested. Exercise them on real booklet revisions and a live gap-generation path; a fake-provider test does not establish live provider functionality.

The small assembled pilot contains **18 questions (16 MathsMap, two imported)** and **21 explicit review/coverage gaps**. Resolve these and audit full Linear Relationships coverage. Prefer MathsMap for theory/guided/blocked work; generate reviewed candidates only for identified gaps. Imported questions are preferred cumulative candidates subject to suitability checks. Keep the bank's combined coverage broader than individual booklet scope.

Use the agreed recipe within the selected NSW content grouping: theory → guided → blocked per teaching chunk; intermediate foundation/development mixed reviews; cumulative interleaved practice; challenge. Support any number of chunks, editable quantities, optional mastery and an archetype × difficulty matrix with justified not-applicable decisions. Keep extensions explicit, prerequisites taught, and dependent question groups intact; avoid unintended repeats.

The source pilot `project-linear-relationships-studio-sample-v1` is at recorded revision 9 with a pending proposal joining page 17 question 2 to its page 18 continuation. Inspect current revisions before acting. The existing assembled project `project-linear-relationships-assembled-pilot-v1` and reviewed PDFs remain pinned to source revision 8 / assembled revision 5; do not silently retarget them.

## Priority 5: complete exports and measurement

The small-pilot student/short/worked PDFs in `.booklet-work/studio-pilot` were inspected, but this does not validate the full booklet. Known remaining pilot limitations include sparse pagination, repeated labels and coverage gaps.

Complete import → audit → revise → assemble → student/short-answer/worked-solution exports for the full sample. Inspect every exported page for mathematical correctness, practice-answer leakage, omissions, clipping, pagination and diagram fidelity. Use the current project export path, not the obsolete local-storage workflow.

Record hands-on minutes by stage, corrections/page/question, diagram replacements, AI retries and acceptance rates. Earlier agent correction counts exist, but human minutes are unknown and agent-authored accepted repairs are not a measured acceptance rate for fresh AI proposals. Do not invent these measurements. Use the actual bottleneck to choose the next investment before scaling imports.

## Execution preferences and checks

Continue authorized local repairs and verification without repeatedly asking permission. The user explicitly approved transmitting the entire prepared 48-page remainder with its selected Word/teacher/graphic evidence to AGY/Gemini; that batch is finished. Keep any future necessary transcription at High effort and concurrency 10 unless evidence warrants discussing a change. Do not rerun completed candidates or use the old exploratory lane command from historical log entries. Respect actual environment approval blocks; prior batch approval is not a reason to bypass them or to publish bank/public-graph changes.

Latest recorded verification: **384 tests passing and production build passing**, with an existing bundle-size advisory. The live draft-preview endpoint returns 93 pages; browser checks on pages 1, 46 and 93 found no page errors or missing displayed images. Standalone-editor and Studio browser checks previously passed. Run checks appropriate to new changes; do not represent old runs as fresh results. On Windows use `npm.cmd test` / `npm.cmd run build` where PowerShell blocks `npm.ps1`. Document-only updates do not need a full test rerun.

Keep the implementation log current. Distinguish generated candidates, structurally valid drafts, adopted drafts, reviewed content and published records. Finish with concrete outcomes, validation evidence and remaining acceptance work.
