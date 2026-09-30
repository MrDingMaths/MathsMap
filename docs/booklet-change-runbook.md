# Booklet change runbook

Accepted 11 September 2026; feedback verification narrowed by user request on 16 September 2026. Use for booklet content, renderer, editor and house-style changes. Ordinary feedback uses the scoped checks below, not a new transcription settlement. The [cross-session rules](booklet-cross-session-rules.md) and [acceptance checklist](booklet-transcription-feedback-checklist.md) supply applicable quality requirements; the full [review-first workflow](booklet-review-first-workflow.md) applies to new imports and required full acceptance.

## 1. Establish scope once

- Record the requested behaviour, current project revisions and existing local edits. Preserve source evidence, IDs, classifications, layouts and pagination settings unless their change is authorised.
- Inventory all applicable occurrences across active books. Fix shared causes centrally and repair repeated content defects throughout the affected scope.
- Map affected patterns to questions, diagrams, physical pages and editions. Include pagination neighbours, inserted/deleted pages, shifted tails, answer-section transitions and navigation when affected.
- Record the required checks and final review coverage at the start. Do not automatically export every edition of every book for a local change; do not narrow a shared change to the user's named example.

### Minimum verification for feedback maintenance

Choose checks from the actual change, not the number of comments. Combine comments sharing a cause into one repair and verification group. Record the reason before adding a check outside this matrix.

| Change | Required coverage |
| --- | --- |
| Documentation or review metadata only | Check edited text, links or saved review fields. No application build, browser test or PDF export. Resolving a comment does not itself invalidate content renders. |
| Local content, maths or spacing | Compare changed content with source and taught methods. Inspect final-size changed pages and immediate pagination neighbours in affected layouts. Check further pages only while pagination differs; stop when it rejoins the accepted page map. |
| Editor behaviour without a render change | Reproduce the fixed interaction and verify the result. For writes, wait for save acknowledgement and reopen once. Add fragment, undo/redo, rapid-edit, failed-save or mode cases only where the changed mechanism can affect them. No PDF export unless stored/rendered output can change. |
| Shared renderer or template | Audit all applicable occurrences and book-specific exceptions once. Check every distinct affected arrangement at final size; reuse checks for equivalent cases. Inspect changed pages in affected books, not every page of every book. Exercise each affected edition path; duplicate wrappers need only a focused integration check unless composition changes. |
| Pagination, covers, footers, numbering, links or export | Check changed page maps, transitions and navigation in the affected editions. Inspect affected boundaries and footers. Widen to the whole affected edition when renumbering or layout changes propagate throughout it. |
| Diagram content, context, dimensions or rendering | Run the applicable shading, colour, typography and geometry checks for affected figures. Run 3D visibility only for affected solids/viewing dependencies. Check fresh/cache parity only when cache or calibration behaviour changed. Inspect final-size output in each affected layout. |
| Project or bank writes | Use the revision-safe transaction, read back the changed fields and check applicable bank sync/pins. Test the transaction mechanism separately only if it changed. |
| New import or required full acceptance | All five automated checks once after settlement; full standalone visual review and combined acceptance under the unique-layout policy. Also use this coverage for an explicit full-review request or a global pagination/export change whose impact cannot be bounded. Touching a shared file alone is not that trigger. |

For maintenance, full PDF-pixel comparison and complete combined-footer sheets are not default tasks. Use pixel comparison when it is needed to reuse an actual inspection or to investigate a difference. Do not render two complete books merely to prove that an unrelated edit had no effect. Source/DOM hashes identify dependencies and candidates for review; they do not establish visual inspection. Full acceptance retains its exact-pixel and composition requirements.

An edition path check is not a claim to have inspected every page. Record inspected pages, reused evidence and checks outside scope accurately. If a shared dependency has unknown reach, widen the relevant check rather than guessing that it is unaffected.

### Existing-booklet transfers to the question bank

Identify each question's main assessed skill using the booklet's stage, topic, exercise heading and relevant teaching examples together with the student-facing task. Use this teaching context to distinguish the intended assessment from supporting calculations or incidental skills. Do not classify a question from its wording or solution alone. Record the context and rationale supporting the primary skill in the assessment register; assign secondary skills only when directly assessed. If the context is missing or conflicts with the task, flag the classification for review rather than guessing.

Transfer current editable content directly; this is not a new transcription. Reuse valid source evidence and corrections rather than extracting or authoring the source again. Read the bank assessment and automatic-sync contracts. Establish one revision/hash snapshot, whole-question inventory, individual assessment register and required-check list. Include all parts, answers, dependencies, assets and saved presentation overrides; exclude teaching content when publishing practice questions.

Use `import-project-bank.mjs --project ID --assessments FILE --out .booklet-work/RUN` to stage through ordinary promotion. The assessment JSON binds each block's content hash to its classification and rationale. Repeating this command reuses verified staging only while source, bank, assessments, assets and implementation signatures match. Use the same arguments with `--apply` to publish that exact staging through the shared transaction helpers. Do not regenerate bank IDs or repeat promotion between review and publication. Stale inputs or edited staging require a new output directory and renewed dependent checks; never overwrite concurrent work.

Compare every normalized bank question and captured presentation with the settled original. Check ownership, manifest/filter visibility, repeat-run idempotency and an isolated save/sync round trip. Inspect representative bank questions and solutions covering every distinct rendering pattern. Content or rendering repairs still require affected-page/neighbour checks and the applicable final edition reviews; unchanged transfer metadata does not by itself require a new transcription review. Reuse another session's evidence only when its inputs and coverage match. Hashes do not replace visual review.

Keep verbose payloads and evidence local. Show compact counts, hashes, durations and actionable exceptions; read full questions only for assessment or investigation. One local run receipt records staging reuse, final artifacts, timings and retries; durable provenance records source-to-bank IDs, classifications and intentional repairs. Record unavailable token metrics as unavailable, and do not infer time or token savings without a comparable measured baseline.

For an already accepted master booklet whose component source workflow cannot
represent its current scoped maintenance, the assessment register may include
`existingTransferReview` with profile `existing-booklet-transfer-v1`. Bind it to
the current project hash, hashed current/baseline project snapshots, the booklet's
earlier completed edition-acceptance record, current maintenance artifacts and
individual whole-question answer/skill/method checks with observations. The
importer verifies unchanged practice content, presentation and source evidence,
and rechecks these artifacts before publication. This route retains historical
workflow registers; new imports and Import review candidates still require their
full import gates. Record the scoped review in the durable bank receipt.

After an implementation-only repair, `--reverify-stage` rechecks unchanged stage
artifacts, complete normalized content/presentation, classifications, ownership
and sync, and records the updated implementation signature without repeating
promotion. Source, taxonomy, assessment, asset or live-bank changes remain stale
inputs, and edited stage artifacts are rejected. Complete the affected UI/visual
checks separately before publication; this flag grants no visual acceptance.

## 2. Prove representative cases before bulk work

For new imports, use the [efficiency tools](booklet-import-efficiency.md) to plan
the complete representative coverage before bulk authoring, extract exact fields
for targeted repairs, and smoke-test the isolated editor/save harness. Use its
compact receipt and bounded preview diagnostic during execution.

Use the smallest set covering the failure mechanisms and source exceptions at final printed size. Include contrasting cases that could regress: related versus independent equations, text versus figure labels, short versus worked sizing. Typography and editor stress cases are required only when the changed path can affect them; do not replay the entire historical checklist for every repair.

Run focused regressions and inspect representatives against source and intended appearance. Check mathematical correctness separately from layout. Resolve shared failures before compiling or repairing the remaining occurrences. Bundle source questions and editorial decisions; continue unaffected work while required decisions are pending.

## 3. Iterate on affected output

Render changed pages and their pagination neighbours during development. Use the existing development route where applicable:

```text
node scripts/booklet/check-compact-exercises.mjs --project PROJECT --out .booklet-work/RUN/PROJECT --development
```

Before starting a development export, inspect the existing page baseline and planned editions. The command now stops before rendering if a baseline is absent or has a different renderer signature, and it stops before printing if the page comparison selects the entire edition. For a deliberate full development render, pass `--full-development-reason "WHY"`; the reason is recorded in the run report. For ordinary maintenance, reuse a valid baseline and avoid duplicate student/combined exports when their affected page bodies are the same. A missing baseline does not by itself justify a full-book check.

Use `--editions student` for a question-only representative checkpoint when appropriate; include answer editions whenever they are affected. Missing baselines and global dependencies can legitimately require wider coverage. Development output remains separate from final acceptance.

Reuse valid compiled diagrams. Cache validity must include relevant source, preparation/renderer version, fonts, assets, settings and dimensions. A renderer change invalidates dependent results even if the diagram's source text is unchanged. Exercise both fresh and cached paths where the change could affect their parity.

For isolated PDF exports, `export-pdf.mjs --save-cache-state FILE` saves browser state including the IndexedDB diagram cache after a successful export. Reuse it with `--cache-state FILE`. Ordinary browser storage-state capture omits IndexedDB unless explicitly enabled; a settings-only state file is not evidence of diagram-cache reuse. The export receipt includes TikZ counters when saving the cache.

Use page hashes to find changes, not to certify appearance. A missing baseline or conservative global hash may make the development tool export more pages than the repair needs; that does not require manually rereading every exported page. Inspect the established scope and expand it for observed shifts. For full acceptance, only the [unique-layout comparison](booklet-review-first-workflow.md#unique-layout-final-acceptance) can transfer standalone inspection to combined bodies; composition remains separate.

## 4. Settle changes before final verification

Finish content repairs, implementation and focused checks before starting final exports. Save through the revision-safe project/bank workflow; verify applicable sync state and preserve concurrent user edits.

Record the exact project revisions, changed files and relevant renderer/assets/settings dependencies. Test a stable snapshot. If shared files are being edited concurrently, use an isolated copy containing the current authorised changes, including uncommitted work; a clean HEAD checkout alone is not that snapshot. Preserve current project/bank revisions when saving.

At closeout, compare live changes with that snapshot once. A whole-`src` signature mismatch is a prompt to inspect the diff, not a reason to restart all exports. Unrelated changes leave the repair's evidence valid; relevant changes invalidate only their dependent checks. Never relabel stale tool evidence as current or bypass a full-acceptance guard. If overlapping work continues, state the verified snapshot and precise unverified integration delta rather than repeatedly chasing each file save or certifying another session's work. Any regression introduced by this repair still requires correction.

Independent read-only checks may run with bounded concurrency. Keep separate output directories and reports for each project/edition or worker, then aggregate after completion. Do not let concurrent exports overwrite a shared report. Do not add agents unless separately authorised by the applicable instructions.

## 5. Perform final checks once on the settled result

New PDF imports prepared under `pdf-import-efficient-v1` enforce the
[verification register](booklet-import-efficiency.md#new-run-pipeline-policy-17-september-2026).
Use bounded assignments and exact-field repairs, approve all representative
coverage before bulk work, and reuse final PDF rasters for images/comparisons/footer
sheets. One register generates the checklist and receipt. Once required checks pass
and no task-caused issue remains, publish, verify readback and repeat-import
idempotency, then finish. Existing-run and ordinary-maintenance scope remains as above.

- Run the selected relevant regressions once after implementation settles, plus one production build for application-code changes. Rebuild only if build inputs change. Content/docs/review-only edits do not require a build.
- Run the scoped source, interaction and rendered-output checks selected above. Use one combined scenario for the same editor state path; do not repeat an already-covered save/reopen in each duplicate edition.
- Run broader diagram/bank audits only for shared changes affecting their scope. An unrelated pre-existing finding is recorded once; it does not trigger repeated global audits or block an otherwise verified local repair. New findings caused by the repair must be fixed.
- Run `repo:check` before committing or when adding/removing assets, dependencies or generated content that changes storage risk. It is not a mandatory repeat for every prose or spacing adjustment.
- After a failure, fix the cause and repeat only invalidated checks. New imports and explicitly required full reviews retain all five automated checks and the [unique-layout policy](booklet-review-first-workflow.md#unique-layout-final-acceptance); ordinary feedback does not re-enter that settlement workflow.

**Stop when** each requested issue has its necessary source/content, behaviour and affected-output evidence; the revision-safe save/readback has passed where applicable; and no finding caused by the repair remains. Resolve comments against that evidence, retaining originals. Do not add extra export, audit, build or inspection passes simply because earlier checks passed quickly. Report unrelated limitations once.

## 6. Record evidence and actual costs

Use the [bounded Sol workflow](booklet-bounded-workflow.md) for compact next-work
handoffs, current exercise teaching summaries and explicit session links. Its
complete-job receipt separates known/missing model usage, active elapsed time,
human waiting and concurrent call durations. Supply `--run-dir` to export checks
to record actual PDF creation and verified reuse automatically; no export receipt
is a visual inspection.

Keep one compact run receipt under `.booklet-work/RUN/` with:

- Input revisions/hashes, affected occurrence/page/edition coverage and representative cases.
- Check results, artifact paths/hashes, cache reuse and invalidation reasons.
- Automatically captured command/phase durations and run start/end times. Do not create retrospective timing work; unavailable manual timings stay unavailable. Concurrent phase durations must not be added and presented as wall time.
- Diagram cache hits/misses, pages exported, pages visually reviewed and pages compared automatically. Distinguish those forms of evidence.
- Failures, repeated work and why each repeat was necessary; actual token usage when available. Mark unavailable metrics as unavailable.

Reuse an existing correction register rather than duplicating editorial decisions in the receipt. Retain durable acceptance summaries and intentional source departures with project provenance; keep render caches and run logs local. Report measured savings only against a comparable measured baseline. Do not invent retrospective timings.

Keep tool output to changed fields, compact check summaries and actionable failures. Read required guidance once, then only relevant sections. Open source/output images only for the scoped visual decisions; batch useful contact sheets and enlarge uncertain details. Reuse existing verification tools instead of building several one-off export/comparison/closeout scripts. Await export completion before starting dependent raster or comparison work. Progress updates should report a finding or decision, not repeatedly announce another final pass.

Completion requires the agreed quality gates to pass, not merely a faster run. Report what changed, the verification result and any real limitations concisely.
