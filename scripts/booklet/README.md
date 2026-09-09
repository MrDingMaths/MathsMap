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

The lower-level `npm run booklet:import` also requires an explicit `--input` candidate and supports `--mode compact|exact`. Source history cannot create a project. Projects use v4; existing schemas remain readable. Export editions are `student`, `short`, `worked`, `with-short` and `with-worked`.

Keep source preparation/extraction, candidate validation, correction checks, source inspection, answer calibration, bank transactions, editor checks and export QA reusable. `candidate-validation.mjs` contains pure prompt/validation helpers extracted from retired benchmarks. `codex-transcription.mjs` remains an optional explicit batch-authoring helper with coverage and model-contract tests, independent of Studio.

PDF/editor checks require a local Vite server and the tools documented in the direct workflow. Run `npm test` and `npm run build` after shared changes. Browser checks should intercept writes or use isolated stores. Completed pilots, applied repair commands and benchmark runners are retired; useful originals are in ignored local recovery storage, not production commands.
