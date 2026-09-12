# Booklet change runbook

Accepted 11 September 2026. Use for booklet content, renderer, editor and house-style changes. Reduce duplicate compilation, exports and review while retaining the existing quality gates. Follow the [cross-session rules](booklet-cross-session-rules.md), [acceptance checklist](booklet-transcription-feedback-checklist.md) and, for new imports, [review-first workflow](booklet-review-first-workflow.md).

## 1. Establish scope once

- Record the requested behaviour, current project revisions and existing local edits. Preserve source evidence, IDs, classifications, layouts and pagination settings unless their change is authorised.
- Inventory all applicable occurrences across active books. Fix shared causes centrally and repair repeated content defects throughout the affected scope.
- Map affected patterns to questions, diagrams, physical pages and editions. Include pagination neighbours, inserted/deleted pages, shifted tails, answer-section transitions and navigation when affected.
- Record the required checks and final review coverage at the start. Do not automatically export every edition of every book for a local change; do not narrow a shared change to the user's named example.

### Existing-booklet transfers to the question bank

Identify each question's main assessed skill using the booklet's stage, topic, exercise heading and relevant teaching examples together with the student-facing task. Use this teaching context to distinguish the intended assessment from supporting calculations or incidental skills. Do not classify a question from its wording or solution alone. Record the context and rationale supporting the primary skill in the assessment register; assign secondary skills only when directly assessed. If the context is missing or conflicts with the task, flag the classification for review rather than guessing.

Transfer current editable content directly; this is not a new transcription. Reuse valid source evidence and corrections rather than extracting or authoring the source again. Read the bank assessment and automatic-sync contracts. Establish one revision/hash snapshot, whole-question inventory, individual assessment register and required-check list. Include all parts, answers, dependencies, assets and saved presentation overrides; exclude teaching content when publishing practice questions.

Use `import-project-bank.mjs --project ID --assessments FILE --out .booklet-work/RUN` to stage through ordinary promotion. The assessment JSON binds each block's content hash to its classification and rationale. Repeating this command reuses verified staging only while source, bank, assessments, assets and implementation signatures match. Use the same arguments with `--apply` to publish that exact staging through the shared transaction helpers. Do not regenerate bank IDs or repeat promotion between review and publication. Stale inputs or edited staging require a new output directory and renewed dependent checks; never overwrite concurrent work.

Compare every normalized bank question and captured presentation with the settled original. Check ownership, manifest/filter visibility, repeat-run idempotency and an isolated save/sync round trip. Inspect representative bank questions and solutions covering every distinct rendering pattern. Content or rendering repairs still require affected-page/neighbour checks and the applicable final edition reviews; unchanged transfer metadata does not by itself require a new transcription review. Reuse another session's evidence only when its inputs and coverage match. Hashes do not replace visual review.

Keep verbose payloads and evidence local. Show compact counts, hashes, durations and actionable exceptions; read full questions only for assessment or investigation. One local run receipt records staging reuse, final artifacts, timings and retries; durable provenance records source-to-bank IDs, classifications and intentional repairs. Record unavailable token metrics as unavailable, and do not infer time or token savings without a comparable measured baseline.

## 2. Prove representative cases before bulk work

Use the smallest set covering every affected pattern at its final printed size. For typography, include superscripts, subscripts, fractions, rotation, alignment, small/large widths and answer-edition widths. For editor changes, include preview, repeated resizing, zoom, fresh/cached rendering and save/reopen as applicable.

Run focused regressions and inspect representatives against source and intended appearance. Check mathematical correctness separately from layout. Resolve shared failures before compiling or repairing the remaining occurrences. Bundle source questions and editorial decisions; continue unaffected work while required decisions are pending.

## 3. Iterate on affected output

Render changed pages and their pagination neighbours during development. Use the existing development route where applicable:

```text
node scripts/booklet/check-compact-exercises.mjs --project PROJECT --out .booklet-work/RUN/PROJECT --development
```

Use `--editions student` for a question-only representative checkpoint when appropriate; include answer editions whenever they are affected. Missing baselines and global dependencies can legitimately require wider coverage. Development output remains separate from final acceptance.

Reuse valid compiled diagrams. Cache validity must include relevant source, preparation/renderer version, fonts, assets, settings and dimensions. A renderer change invalidates dependent results even if the diagram's source text is unchanged. Exercise both fresh and cached paths where the change could affect their parity.

For isolated PDF exports, `export-pdf.mjs --save-cache-state FILE` saves browser state including the IndexedDB diagram cache after a successful export. Reuse it with `--cache-state FILE`. Ordinary browser storage-state capture omits IndexedDB unless explicitly enabled; a settings-only state file is not evidence of diagram-cache reuse. The export receipt includes TikZ counters when saving the cache.

Use page hashes to find changes and rendered comparisons to confirm equivalence. Record comparison coverage: identical page bodies do not certify omitted footers, covers, links or navigation. Inspect those separately when affected. Hashes and counts cannot establish source fidelity or replace an explicitly required complete visual review.

## 4. Settle changes before final verification

Finish content repairs, implementation and focused checks before starting final exports. Save through the revision-safe project/bank workflow; verify applicable sync state and preserve concurrent user edits.

Record the exact project revisions/hashes, renderer signature, assets and settings used for final verification. Keep these inputs stable for the run. If they change, identify the invalidated checks and rerun those dependencies; apply the review-first re-settlement rules when required. Never report results from a superseded build as current.

Independent read-only checks may run with bounded concurrency. Keep separate output directories and reports for each project/edition or worker, then aggregate after completion. Do not let concurrent exports overwrite a shared report. Do not add agents unless separately authorised by the applicable instructions.

## 5. Perform final checks once on the settled result

- Run relevant regressions and one production build for application changes. Broaden tests when the affected dependency scope, failures or unresolved concerns justify it. A documentation-only change needs document/link checks, not booklet exports or an application build.
- Run the required final edition exports and inspect their actual output. Keep the full five-edition trig review when required. New transcription runs retain the complete final visual review of every page in `student`, `short`, `worked`, `with-short` and `with-worked` under the review-first gates.
- In other existing books, review affected pages, patterns and neighbours in every applicable edition. Expand coverage if a shared change affects the whole book or if the user requires it.
- Check source/content fidelity, presentation and page layout separately. As applicable, verify collisions, clipping, handwriting space, footer clearance, navigation, semantic colours, editor/print parity and practice-only answer sections.
- After a failure, repair the cause and repeat the checks it invalidates. Do not repeatedly run already-passing checks without a new change or unresolved reason. Full acceptance gates still govern when re-settlement requires a complete review.

## 6. Record evidence and actual costs

Keep one run receipt under `.booklet-work/RUN/` with:

- Input revisions/hashes, affected occurrence/page/edition coverage and representative cases.
- Check results, artifact paths/hashes, cache reuse and invalidation reasons.
- Start/end timestamps and elapsed time for inventory, implementation, compilation, export, automated checks, visual review and retries. Record overall wall time separately; concurrent phase durations must not be added and presented as wall time.
- Diagram cache hits/misses, pages exported, pages visually reviewed and pages compared automatically. Distinguish those forms of evidence.
- Failures, repeated work and why each repeat was necessary; actual token usage when available. Mark unavailable metrics as unavailable.

Reuse an existing correction register rather than duplicating editorial decisions in the receipt. Retain durable acceptance summaries and intentional source departures with project provenance; keep render caches and run logs local. Report measured savings only against a comparable measured baseline. Do not invent retrospective timings.

Completion requires the agreed quality gates to pass, not merely a faster run. Report what changed, the verification result and any real limitations concisely.
