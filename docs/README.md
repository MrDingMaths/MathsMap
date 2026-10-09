# docs index

Status of every file in `docs/`, from the audit of 9 October 2026. Check a file's group before editing, renaming or moving it.

Rules that apply to the whole folder:

- A doc named in `scripts/`, `src/`, `remote/` or a tracked record under `booklets/` keeps its path. `scripts/` is hash-bound by export evidence, so fixing a path there has a cost.
- Runner-launched Codex workers cannot open files. A rule reaches them only if its text is embedded in the prompt; naming a doc by path is not enough.
- Dated records that nothing else depends on live in [`archive/`](archive/).

## Read by pipelines

Editing these changes worker prompts or parsed data.

| File | How it is used |
| --- | --- |
| [booklet-worked-solution-style.md](booklet-worked-solution-style.md) | Worked-solution contract. Embedded in version 4 reconstruction prompts and the transcription runner by `scripts/booklet/solution-conventions.mjs` |
| [tikz-prompt.md](tikz-prompt.md) | TikZ authoring manual, loaded as the TikZ stage prompt. Generated from MathsDatabase; do not edit it here |
| [content-schema.md](content-schema.md) | Schema for `public/content` and `public/quizzes`. Inlined into every generation task |
| [atomisation-teaching.md](atomisation-teaching.md) | How to break a routine into atoms. Inlined into every generation task |
| [guided-practice-principles.md](guided-practice-principles.md) | We Do principles. Inlined into every generation task |
| [worked-example-principles.md](worked-example-principles.md) | I Do principles. Inlined into every generation task |
| [content-queue.md](content-queue.md) | Generation queue. `scripts/content/campaign-sources.mjs` scans its table rows for topic and source mappings |

## Hash-checked or hash-recorded: do not edit

Their bytes are compared with, or recorded in, accepted review receipts.

| File | Binding |
| --- | --- |
| [content-campaign-render-applicability.json](content-campaign-render-applicability.json) | Checked by `campaign-render-applicability.mjs` |
| [content-campaign-layout-applicability.json](content-campaign-layout-applicability.json) | Checked by `campaign-layout-applicability.mjs` |
| [content-campaign-label-applicability.md](content-campaign-label-applicability.md) | Checked by `campaign-label-applicability.mjs` |
| [content-campaign-scoped-render-dependencies.md](content-campaign-scoped-render-dependencies.md) | Checked by `campaign-render-dependencies.mjs` |
| [content-campaign-context-revalidation.md](content-campaign-context-revalidation.md) | Hash recorded in review receipts |
| [content-campaign-repair-metadata.md](content-campaign-repair-metadata.md) | Hash recorded in review receipts |
| [content-campaign-source-normalization.md](content-campaign-source-normalization.md) | Hash recorded in review receipts, including tracked provenance |
| [content-campaign.md](content-campaign.md) | Guarded-ledger campaign route. Listed in code hash lists; the recorded hashes no longer match |
| [booklet-bounded-workflow.md](booklet-bounded-workflow.md) | Bounded-stage guidance. Attached to bounded-stage jobs as a path and hash |

## Current policy and conventions

| File | Covers |
| --- | --- |
| [booklet-standing-conventions.md](booklet-standing-conventions.md) | September 2026 standing rules moved word for word out of `AGENTS.md`, which tells every agent to read this page before booklet work |
| [booklet-three-pass-import.md](booklet-three-pass-import.md) | New imports: lean cut, lean review route, the three passes |
| [booklet-lean-import-runtime.md](booklet-lean-import-runtime.md) | `lean-import.mjs inventory`, `author` and `sample`, the worker pool and frozen export. Also describes older review and export commands |
| [booklet-import-duration-controls.md](booklet-import-duration-controls.md) | Preparation checks and lessons from earlier imports. Also describes the older ticket route |
| [booklet-direct-compact-import.md](booklet-direct-compact-import.md) | Base import workflow: source inventory, semantic content, compact project |
| [booklet-practice-only-import.md](booklet-practice-only-import.md) | Practice-only PDF imports and shared-stem question groups |
| [booklet-change-runbook.md](booklet-change-runbook.md) | Booklet changes and feedback repairs: scope and minimum verification |
| [booklet-cross-session-rules.md](booklet-cross-session-rules.md) | Register of transcription and rendering conventions |
| [booklet-transcription-feedback-checklist.md](booklet-transcription-feedback-checklist.md) | Acceptance checklist for transcription runs |
| [booklet-table-conventions.md](booklet-table-conventions.md) | Table header roles, statistical alignment, pictograms |
| [booklet-adaptive-short-answers.md](booklet-adaptive-short-answers.md) | Measured short-answer rows: implementation and migration |
| [booklet-question-part-indents.md](booklet-question-part-indents.md) | 7 mm part-label indents |
| [booklet-compact-exercise-trial.md](booklet-compact-exercise-trial.md) | Compact exercise specification |
| [booklet-house-style-1.1.md](booklet-house-style-1.1.md) | House style 1.1: graphs, tables, cloze sizing, release checks |
| [booklet-diagram-colours.md](booklet-diagram-colours.md) | Black diagram ink and purposeful shading |
| [booklet-diagram-typography.md](booklet-diagram-typography.md) | 10 pt labels, graph scales and ticks, stroke weights, short-answer ink |
| [booklet-standard-palette.md](booklet-standard-palette.md) | Standard booklet palette |
| [solid-visibility.md](solid-visibility.md) | 3D diagram visibility contract |
| [booklet-storage.md](booklet-storage.md) | Storage, retention and run-folder pruning |
| [booklet-bank-auto-sync.md](booklet-bank-auto-sync.md) | Booklet and question-bank sync |
| [booklet-human-workflow.md](booklet-human-workflow.md) | One-page overview of the Studio workflow |
| [booklet-pedagogy-contract.md](booklet-pedagogy-contract.md) | Teaching and atomisation contract for booklets |
| [studio-remote-access.md](studio-remote-access.md) | Remote Studio through the Cloudflare Tunnel |
| [content-campaign-efficient-workflow.md](content-campaign-efficient-workflow.md) | Current skill-content campaign policy |
| [content-generation.md](content-generation.md) | Session prompt for generation queue batches |
| [atomisation-principles.md](atomisation-principles.md) | Rubric for building the skill graph in `data/skills.json` |
| [question-bank-assessment.md](question-bank-assessment.md) | How bank questions are assessed and scored |

## Older routes, for runs that already use them

| File | Covers |
| --- | --- |
| [booklet-review-first-workflow.md](booklet-review-first-workflow.md) | Review-first gates and unique-layout final acceptance |
| [booklet-import-efficiency.md](booklet-import-efficiency.md) | Repair, representative and diagnostic tooling |
| [booklet-workflow-controller.md](booklet-workflow-controller.md) | Resumable bounded review dispatch |
| [content-campaign-compact-review.md](content-campaign-compact-review.md) | Compact independent review on the guarded-ledger campaign route |
| [content-campaign-ui-sampling.md](content-campaign-ui-sampling.md) | Cohort UI sampling on the guarded-ledger campaign route |

## Editor reference

| File | Covers |
| --- | --- |
| [booklet-document-editing.md](booklet-document-editing.md) | The Studio editing guide: writing, diagrams, comments, workspace, arrangements, pagination, project library |
| [booklet-arrangement-controls.md](booklet-arrangement-controls.md) | Recipes for adjusting question layouts |
| [maths-editor-integration.md](maths-editor-integration.md) | MathsEditor integration by release, and equation editing |
| [booklet-load-performance.md](booklet-load-performance.md) | Loading, caches and warm spacing edits |

## Records that still hold something in force

Each is the only place a rule, command or decision is written down, or is cited by a tracked record.

| File | Why it stays |
| --- | --- |
| [agy-transcription-performance.md](agy-transcription-performance.md) | Safeguards of `scripts/booklet/transcription-direct.mjs` |
| [booklet-angle-relationships-efficiency-review.md](booklet-angle-relationships-efficiency-review.md) | Shared-diagram rules, metrics and repair commands |
| [booklet-transcription-efficiency-review.md](booklet-transcription-efficiency-review.md) | Version 2 cache metadata requirement |
| [booklet-import-efficiency-plan.md](booklet-import-efficiency-plan.md) | Decision not to run a paid full re-import solely to benchmark |
| [booklet-smooth-editing-acceptance.md](booklet-smooth-editing-acceptance.md) | 1 CSS pixel selection tolerance |
| [question-bank-solutions.md](question-bank-solutions.md) | Show solution behaviour and `check-bank-solutions.mjs` |
| [solid-visibility-acceptance.md](solid-visibility-acceptance.md) | Acceptance record cited by provenance |
| [booklet-feedback-2026-09-13.md](booklet-feedback-2026-09-13.md) | Angle Relationships repairs, cited by the project file |
| [booklet-volume-feedback-2026-09-12.md](booklet-volume-feedback-2026-09-12.md) | Volume repairs and prevention rules |
| [booklet-volume-feedback-r198.md](booklet-volume-feedback-r198.md) | Volume revision 198 repairs: headings and continuation rules |

## Data

| File | Contents |
| --- | --- |
| [linear-relationships-bank-index.json](linear-relationships-bank-index.json) | Source lineage of the Linear Relationships bank, referenced by the bank READMEs |
| [linear-bank-assessment-register.json](linear-bank-assessment-register.json) | 180 individual question assessments, referenced by the assessment doc |

## Archive

| File | What it records |
| --- | --- |
| [booklet-feedback-efficiency-review.md](archive/booklet-feedback-efficiency-review.md) | Why feedback verification was narrowed (16 September) |
| [booklet-standard-palette-acceptance.md](archive/booklet-standard-palette-acceptance.md) | Palette rollout acceptance (11 September) |
| [booklet-graph-typography-2026-09.md](archive/booklet-graph-typography-2026-09.md) | Graph typography adoption; rules now in the diagram typography doc |
| [booklet-graph-strokes-2026-09.md](archive/booklet-graph-strokes-2026-09.md) | Graph stroke adoption; rules now in the diagram typography doc |
| [booklet-flexible-editing.md](archive/booklet-flexible-editing.md) | Merged into the editing guide |
| [booklet-focused-editing.md](archive/booklet-focused-editing.md) | Merged into the editing guide |
| [booklet-workspace-ui.md](archive/booklet-workspace-ui.md) | Merged into the editing guide; holds the UI parity evidence |
| [booklet-word-workspace.md](archive/booklet-word-workspace.md) | Merged into the editing guide; holds the typing benchmarks |
| [booklet-project-library.md](archive/booklet-project-library.md) | Merged into the editing guide |
| [embedded-equation-editing.md](archive/embedded-equation-editing.md) | Merged into the MathsEditor integration doc |
| [booklet-spacing-performance.md](archive/booklet-spacing-performance.md) | Merged into the load performance doc; holds the timings |
| [maths-editor-1.2.0-verification.md](archive/maths-editor-1.2.0-verification.md) | MathsEditor 1.2.0 verification (6 September) |
| [linear-relationships-atomisation-audit.md](archive/linear-relationships-atomisation-audit.md) | Recommendations-only audit of Linear Relationships revision 98 |
| [linear-relationships-atomisation-audit.json](archive/linear-relationships-atomisation-audit.json) | Data for that audit (6.1 MB) |
| [linear-booklet-feedback-2026-09-06.json](archive/linear-booklet-feedback-2026-09-06.json) | Linear Relationships feedback issues (6 September) |
