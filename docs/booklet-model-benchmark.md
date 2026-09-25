# First-pass model transcription benchmarks

The benchmark tools create isolated candidates under `.booklet-work/`. They do not save projects into the booklet library or synchronise the question bank. A valid packet, a valid editable project, a successful PDF export and substantive acceptance are separate outcomes.

## Frozen four-way trial

The 24 September 2026 trial uses Astra Low, Astra High, Sol XHigh and Luna Max, all with the Standard service tier. Its ten source pages and teaching references are declared in `scripts/booklet/benchmark-models.mjs`; Index Laws page 44 uses teaching pages 10 and 16.

Each setting independently inventories and authors each page. Authoring receives that setting's own inventory. The scheduler allows three active calls overall, one per setting, rotates priority, and applies a 15-minute timeout. Calls use fresh ephemeral contexts. Failures remain in the record; an unusable inventory prevents the dependent author call. There are no candidate repairs, generation retries or model substitutions.

The run directory contains frozen source evidence, instructions, schemas, hashes, invocation arguments, prompts, raw event streams, outputs, validation records and measured usage. It is local evidence, not a release artifact. Never overwrite an existing run to repeat a trial.

Use an isolated application snapshot and a fixed font environment for exports. Hash guards detect concurrent changes but do not preserve the original bytes. If a guard stops dispatch, drain existing calls and retain their outcomes; continuation may dispatch only calls with no prior invocation. Record the interruption, restored dependency hashes and any remaining parity limitation. Renderer revalidation is separate from a model retry and must preserve the original diagnostic exports.

The September trial encountered a concurrent workspace edit. Its continuation and renderer evidence are recorded in `runtime-interruption.json` and `renderer-pixel-revalidation.json` inside the run directory. The pinned generation implementation and complete recorded renderer signature were restored exactly. PDF-pixel comparisons additionally check the recorded sample equivalence. Retain the interruption and diagnostic font-access attempts in the evidence rather than charging them to a model.

## Running and evaluating

Use `node scripts/booklet/benchmark-models.mjs --prepare --run-dir <new-directory>` to prepare a trial and `--run` with the same directory to execute it. Verify source locations and the frozen protocol before dispatch. An execution-start receipt prevents accidental restarts. Authentication or unsupported model failures are recorded rather than replaced with another setting.

The rendering tools use the existing application renderer and a read-only candidate route. `benchmark-render-queue.mjs` watches materialized projects and exports all five editions once. A separate teaching diagnostic reveals teaching responses that correctly do not appear in practice-only answer editions. Empty practice-answer editions for teaching-only samples are recorded as empty, not PDF failures.

Independently review source content before assessing the candidates. Inspect actual final-size PDF rasters, mathematics, taught methods, source arrangements, grouping, editable representations and diagram semantics. Combined bodies may reuse standalone inspection only with exact PDF-pixel evidence; inspect covers, boundaries, navigation, composition and footers separately. A full manual inspection of every generated page is also valid. Preserve raw first-pass defects.

Record each candidate's review in its `review.json`, including inspected image hashes, project/output hashes, severity, observations and measured review intervals where available. `complete` means the review is complete; `accepted` must not become true merely because a benchmark review ended. A failed call can have a complete failure audit without source or visual checks.

Run these evidence tools with `--run-dir <directory>`:

- `benchmark-content-audit.mjs`: palette, shading and solid-visibility diagnostics without fabricated acceptance records.
- `benchmark-audit.mjs`: frozen hash parity, requested settings, fresh context, own-inventory handoff and usage presence.
- `benchmark-report.mjs`: completion, validation, rendering, review, timing and token accounting, plus page-level findings.

The report can include a separately reviewed `interpretation.md` in the run directory. Missing measurements stay unknown. Input token totals already include cached input; output totals already include reasoning output. Summed call duration differs from the union of active call intervals. Setup, review and exports are separate phases, and incomplete timing cannot establish accepted-import throughput or subscription savings.

One trial per page and setting supports a practical drafting recommendation, not a statistically established model ranking.

## Canonical calibration and paired reruns

Use `--arms astra-low,sol-xhigh --calibration <file.json>` with `--prepare` for the paired trial. Calibration supplies identical source-specific presentation decisions to both settings; it must not supply canonical answers. Snapshot the canonical projects and inspect their actual PDFs, recording the physical page mapping where compact pagination differs from source numbering. Keep the previous trial immutable.

The shared authoring patterns in `first-pass-patterns.mjs` distinguish topic bands, teaching-group identity, native document references, usable column widths, scaffold space, mathematical cloze strings and graph overlays. Correct header identity through semantic fields rather than recolouring unrelated template kinds. Whole-field arrangement aliases resolve to native blocks before pagination prunes fragment references. Teaching-only slices retain navigation anchors without generating practice Exercise headings; an isolated continuation practice page can still have a wrapper heading that is absent in its full booklet.

Freeze renderer and authoring dependencies before dispatch. Improvements found during review belong in the live application and a separately recorded diagnostic, not in the running trial's snapshot. Retain the original first-pass failure and do not credit a later renderer fix to the frozen result. Record template-icon mapping validation failures separately from missing mathematical diagrams. Printed navigation checks must exclude screen-only question-side Answers links while retaining cover and answer-section links.
