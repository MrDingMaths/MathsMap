# Booklet tools

Current workflow: **source evidence → semantic content → editable Projects → optional banks/assembly → export**.

Read [direct compact import](../../docs/booklet-direct-compact-import.md), the [feedback checklist](../../docs/booklet-transcription-feedback-checklist.md) and [cross-session rules](../../docs/booklet-cross-session-rules.md) before authoring. See [document editing](../../docs/booklet-document-editing.md) and [bank sync](../../docs/booklet-bank-auto-sync.md) for ongoing changes.

```powershell
npm run booklet:prepare -- --pdf SOURCE.pdf --docx SOURCE.docx --pages 1-12 --run-id source-v1
node scripts/booklet/create-compact-booklet.mjs --run-id source-v1 --input CONTENT.json --project-id booklet-v1
node scripts/booklet/create-compact-booklet.mjs --run-id source-v1 --input CONTENT.json --project-id booklet-v1 --apply
node scripts/booklet/check-content-coverage.mjs --project booklet-v1 --out .booklet-work/coverage/booklet-v1
node scripts/booklet/check-teaching-presentation.mjs --project booklet-v1 --out .booklet-work/presentation/booklet-v1
node scripts/booklet/check-compact-exercises.mjs --project booklet-v1 --out .booklet-work/layout/booklet-v1
node scripts/booklet/check-compact-navigation.mjs --project booklet-v1 --out .booklet-work/navigation/booklet-v1
node scripts/booklet/export-pdf.mjs --project-id booklet-v1 --mode with-short --out output/pdf/booklet-v1.pdf
```

`check-compact-exercises.mjs --visibility-reviews FILE.json` uses a run-local
`reviews` object keyed by exact native diagram code hashes. Omitting it retains
the historical visibility register. An explicit missing or malformed file stops
the check; accepted review decisions do not override detected geometry defects.
The export report retains the input file and hash.

The lower-level `npm run booklet:import` also requires an explicit `--input` candidate and supports `--mode compact|exact`. Source history cannot create a project. Projects use v4; existing schemas remain readable. Export editions are `student`, `short`, `worked`, `with-short` and `with-worked`.

PDF-only sources may omit both Word companions; select question, teaching-context and answer pages separately. Practice-only assembly keeps teaching evidence external and accepts an answer-book discrepancy only when its explicitly cited, question-specific workflow decision has current hashed evidence. The original discrepancy remains in provenance.

Authored solution diagrams receive explicit derived inventory mappings to their independently inventoried whole question. These mappings do not increase the printed-question or printed-diagram counts, and do not import answer-book or teaching regions. Reviewed compact correction materialisation remains valid through bank ownership/classification attachment; content, source evidence and captured presentation changes still invalidate it.

For transactional bank publication, `check-compact-exercises.mjs --project-file STAGED.json` may produce final manifests only after that exact staged project has a current review-first settlement. All content, presentation, geometry and five-edition review gates still apply. Freeze the stage before final review and publish its verified bytes; `--draft` never establishes final acceptance.

An interrupted bank stage can be reused in a new output directory with `import-project-bank.mjs --resume-from OLD_STAGE --resume-assessments OLD_REVIEW.json`, alongside the current project and assessments. The importer verifies the previous source review, unchanged original source hashes and question inventory, bank revisions and ownership, and unchanged classifications and captured presentation. It copies verified promotions, uses the ordinary owner save to reconcile newly reviewed content, then promotes the remaining questions. Previous staging stays untouched; its evidence is retained and hashed inside the new stage. Edited bank records, stale reviews, changed source bytes, classification changes and presentation changes require a fresh stage. Current source fidelity, final exports and explicit visual acceptance remain required before publication.

Final review defaults to [unique-layout acceptance](../../docs/booklet-review-first-workflow.md#unique-layout-final-acceptance): inspect the three standalone layouts, reuse exact PDF-pixel matches for duplicate combined bodies, and explicitly review combined composition and exceptions. `visual-review.mjs describe` retains comparison rasters; `status` separates pending inspection, awaiting reuse and pending composition. `fullVisual: true` in the descriptor retains the full-manual fallback. Routine edits follow the [scoped change runbook](../../docs/booklet-change-runbook.md).

Keep source preparation/extraction, candidate validation, correction checks, source inspection, answer calibration, bank transactions, editor checks and export QA reusable. `candidate-validation.mjs` contains pure prompt/validation helpers extracted from retired benchmarks. `codex-transcription.mjs` remains an optional explicit batch-authoring helper with coverage and model-contract tests, independent of Studio.

New runs use the [bounded assignment, shared PDF raster and verification-register contracts](../../docs/booklet-import-efficiency.md#new-run-pipeline-policy-17-september-2026) and the [canonical bounded Sol 6.1 medium stage guidance](../../docs/booklet-bounded-workflow.md). Use `run-workflow next` for compact ownership/dependency handoffs, `prepare-stage|run-stage|record-stage` for substantive review, and `link-session|weekly-usage|receipt` for complete-job accounting. Representative approval, exact-field repairs and closeout remain register-derived; `check-import-harness` combines the isolated UI scenario. `prepare-pipeline-pilot` freezes existing whole questions for reusable tooling regressions and cannot authorize a live bank import. Stop after required checks, publication, readback and repeat-import pass.

PDF/editor checks require a local Vite server and the tools documented in the direct workflow. Run relevant regressions and one production build after shared changes settle. Browser checks should intercept writes or use isolated stores. Completed one-off pilots, applied repair commands and benchmark runners are retired; useful originals are in ignored local recovery storage, not production commands.
