# Worked-example completion run

User authorised on 11 October 2026 for `worked-examples-2026-09`. This is an examples-only continuation of the completed 1,056-skill audit. Missing examples and missing assessed-method coverage are required work for this run. The deliberate `survey-bias-ethics` publication hold remains in force; complete its examples in staging only.

## Content boundary

Preserve accepted practice, quizzes, non-example theory, completed reviews and historical evidence. Classify retained assessments by the distinct methods they assess without repeating their mathematical audit. Preserve suitable examples; add only missing coverage and repair genuine existing-example defects. Store ordered `theory.workedExamples` with explicit editable `question_text` and `solution_text`, preserving useful extension fields when converting the legacy singular field.

Use mapped booklet worked examples or exercises, with different values and the taught method. Keep the target skill central and introduce no more advanced skills. Reuse only recorded syllabus source exceptions. Missing teaching context is a source blocker, not permission to invent an exception.

## Presentation and review

Question text is black. All solution prose and mathematics render in `#268cff`; diagrams retain ordinary black ink and the standing semantic palette. Apply the [equals-sign gutter](booklet-transcription-feedback-checklist.md#equals-sign-gutter-10-october-2026-user-requested) to a bare opening expression followed by relation-led calculations. The supported per-example `equationAlignment: {mode: 'continuation'}` uses the shared Studio alignment parser for separate all-maths prompt/solution fields; mixed prose uses authored phantom gutters. Independent equations retain their relations and receive no phantom.

Include diagrams where they materially support the method. Keep question givens separate from derived solution annotations, use shared templates where supported, and follow the [typography](booklet-diagram-typography.md), [palette](booklet-standard-palette.md) and [solid visibility](solid-visibility.md) contracts.

Independently review every new or substantively changed example, including source/method alignment, calculations, final answer and diagram consistency. Preserve valid reviews of unchanged content; formatting-only repairs receive scoped preservation checks. Inspect representative examples before bulk authoring, every changed diagram before publication, and changed rendered examples within their affected scope. Automated rendering checks alone do not establish actual visual acceptance.

## Execution

The reusable examples-only route keeps separate resumable records and candidates, and reuses source selection, worker dispatch and publication transactions. Record actual call results, source/candidate hashes, method coverage, review findings and actual visual inspections; never alter old lean audit records to claim new acceptance.

Run `node scripts/content/examples-route.mjs run --publish --concurrency 5` (or `lean-route.mjs run --examples-only ...`). Use `--ids a,b` for a cohort; `status` reports live and staged coverage. Normal reruns resume interrupted stages and reuse matching completed calls. For a diagnosed pending defect, use `run --ids a --repair --finding "specific diagnosed issue" --publish`. Completed publications recover through the shared transaction journal after an interruption. The held survey skill never publishes through this route.

Workers receive current conventions and renderer capabilities inline. Blue styling is automatic; keep explanatory prose as prose rather than wrapping it in coloured mathematics. Optional author `templateRequests` are expanded by the shared diagram generator into supported editable TikZ strings before independent review. Every new template diagram still requires actual visual inspection. Useful supplementary existing examples remain even if their method is not assessed in the retained questions.

Use `gpt-6.1-sol` at low reasoning with the workers' read-only sandbox. The task-specific ceiling is **five active model workers total**, counting authors, reviewers, repairs and visual reviewers together across dispatchers. This does not change the default campaign limit or authorise unrelated workers. Launch authorised Windows runners with `require_escalated` from the first attempt. Keep publication serialized and revision-safe; concurrent changes require reconciliation rather than overwriting.

Resume incomplete stages, retain completed calls, and allow one automatic bundled repair/recheck. Diagnose remaining findings before any further scoped repair. Preserve unrelated active booklet jobs and remote Studio. Do not prune run folders while other import or feedback work is in flight.

Accepted mathematical candidates resume directly at rendering/inspection. `--reinspect` rechecks the selected completed skills without repeating their mathematics; `--verify-published` includes earlier publications in a full resumed queue. For a diagnosed cohort, `--diagnoses path.json` takes unique `{skillId, finding}` entries and processes those scoped repairs first within the same five-slot pool. A repair of already published examples captures the current live revision and retains its original baseline and prior publication/inspection evidence.

Capture settles all theory diagrams and disables scroll anchoring in its private browser so lazy diagram compilation cannot shift a screenshot onto a neighbouring example. Element captures and separate hidden-solution captures show the actual renderer. The coordinator binds accepted visual indices to candidate/diagram hashes; model hash transcription is not evidence. Run `node scripts/content/check-example-coverage.mjs` at completion to verify frozen membership, protected data, current source approvals, accepted method coverage, actual diagram inspections and the survey hold. `--progress` permits incomplete stages while still reporting integrity failures.

Native Chromium clips use atomically measured document coordinates and require stable target bounds before/after the screenshot, avoiding the element/scroll-offset race. Worked-example source tables render through the shared native document table model while their ordered cells remain editable in the separate source fields. This table option is scoped to worked examples; other InlineContent callers retain their existing rendering.

Worked-example drawing slots cannot flex-shrink away calibrated label reservations. A wide slot is horizontally accessible; full-diagram inspection images release only the overflow clipping and preserve its existing geometry and glyph size. Capture checks require each compiled diagram to have visible, positive dimensions, not merely an SVG node. Native-table renderer repairs also receive scoped inspections when their source mathematics is unchanged.

The focused gutter validator reuses Studio's report-only checker and also detects a phantom in the wrong aligned column. It ignores wrapped continuations of an existing equation. `run --ids a,b --format-gutters --publish` mechanically inserts/moves only the required gutter controls, proves exact reversibility of those insertions, and independently checks and renders the affected examples. It preserves prose, mathematical values and diagram bytes; ambiguous source occurrences require a diagnosed author repair instead.

Completion reports distinguish live coverage from the held staged skill, examples added, existing-example repairs, checks and genuine unresolved source gaps.

The queue automatically reinspects completed examples when an affected renderer dependency or required inspection changes. A narrowly scoped fraction-clearance CSS repair preserves earlier non-fraction inspections only when removing that exact rule reproduces the recorded component hash; affected fraction examples receive fresh actual inspection. No inspection records or historical hashes are rewritten.

Diagnosis entries may request `reinspect:true` for accepted candidates, `questionLines:[indices]` for mathematically identical inline question equations placed on separate lines, or `restoreStage:'repair'` to recover a larger complete candidate from that skill's canonical accepted repair call. Recovery preserves the replaced candidate and requires independent review before publication. Repair output cannot silently discard staged examples. Valid individual mathematical reviews remain reusable even when a different example or overall method coverage still needs repair. Solid review workers identify supplied zero-based check indices; the coordinator binds exact diagram hashes, refusing ambiguous or unrelated references.

Chromium can quantize SVG layout by 1/64 pixel during rasterization. Capture first keeps the exact rounded-bounds check. A mismatch permits only raw geometry movement within 1/16 CSS pixel, followed by another capture of the enclosing rectangle and a fresh stability/containment check. Meaningful movement remains a failure. This exact producer upgrade changes framing only; its explicitly registered hash preserves already inspected artifacts while refusing every other producer edit. Renderer, candidate, source and artifact hashes remain independently checked.
