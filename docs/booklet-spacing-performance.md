# Question-spacing feedback

Implemented 15 September 2026. This changes shared editor scheduling and cache reuse; it does not change booklet content, spacing defaults or pagination rules.

## Measured result

Local headless Chromium, real current projects in isolated in-memory save routes, Questions and short answers edition. Twenty alternating 2/30 mm answer-space commits per project, measured from the control's change event through the updated preview's paint, independently of autosave.

| Project | Before median / p95 | After median / p95 |
| --- | --- | --- |
| Linear Relationships v1 | 3236 / 3395 ms | 269 / 377 ms |
| Non-Right-Angled Trigonometry v1 | 1078 / 1289 ms | 145 / 177 ms |

Both meet the warm-edit target of median below 300 ms and p95 below 500 ms. A first uncached layout can take longer. The benchmark includes its first change; it does not discard slow samples.

## Changes

- Explicit whole-question spacing commits bypass the typing debounce. Composition, typing debounce and cancellation remain active.
- Warm measurements are read synchronously from memory. Misses are measured directly; opening and edition changes retain persistent-cache reads. Writes update memory immediately and persist in coalesced background transactions.
- Compact answer pagination ignores question-only spacing overrides, while retaining answer diagram-width and other relevant invalidation.
- Incremental continuation cannot reuse a partial page containing a changed question. Repeated unchanged answer runs retain their checkpoint metadata.
- Missing DOM measurements are retried after paint and rejected if still unavailable. They cannot become cached zero-height results.
- Every validation request still hashes renderer and asset bytes. Bounded parallel reads and request-local sharing reduce validation time without time-based or file-stat-based acceptance.
- Preview metrics include scheduling, validation, cache I/O, measurement, pagination, rendering, paint and cancelled work.

## Reproduction and evidence

Run `node scripts/booklet/check-spacing-performance.mjs --project linear-relationships-v1 --verify` (and repeat with `non-right-angled-trigonometry-v1`). Use `--out` for a new local evidence directory and `--capture` for affected-page PDFs. Run `node scripts/booklet/check-spacing-editor.mjs` for live typing/composition, cancellation and failure handling.

Evidence is retained under `.booklet-work/spacing-performance/`: `baseline-*`, `settled-linear`, `settled-trig`, `editor`, `linear-visual`, and `trig-final`. Reports include source hashes, every timing sample, complete fragment/page/heading maps, cache metrics and verification checks. Baseline timing reports predate the non-empty fragment-map assertion and are timing evidence only; final maps are compared against fresh pagination at both spacing values.

Validation covers fits and splits across page boundaries, following content moving backwards, diagrams, vertical gap, rapid edits, undo/redo, save/reopen, unavailable storage, blocked storage writes, superseded pagination, typing/composition and failed asset validation. All 72 focused editor/cache/pagination tests pass. Production build passes with the existing large-chunk warning.

The five-edition trigonometry export check passed for 64 student, 4 short-answer, 35 worked-answer, 68 combined-short and 99 combined-worked pages: 270 pages, zero reported DOM/print geometry issues, valid navigation and diagram-label checks. All pages were visually reviewed in contact sheets, with a detailed check of the previously affected worked-answer start. This was draft layout QA because existing source-review metadata is incomplete; it is not a new transcription-fidelity acceptance. Export readiness checks remain in place. The final export phase took 55,236 ms, excluding manual review.

Development retries are retained locally. They include outdated harness selectors, correction of initially empty page-map evidence, rejection of file-stat hash caching after a same-size/timestamp regression, and repair of an unavailable-measurement fallback exposed by the combined-worked export. The older smooth-editing script has an obsolete layout selector; the new focused browser script covers this task's live-editor cases.
