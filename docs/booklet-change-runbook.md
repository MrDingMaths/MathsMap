# Booklet change runbook

Accepted 11 September 2026; feedback verification narrowed by user request on 16 September 2026. Use for booklet content, renderer, editor and house-style changes. Ordinary feedback uses the scoped checks below, not a new transcription settlement. The [cross-session rules](booklet-cross-session-rules.md) and [acceptance checklist](booklet-transcription-feedback-checklist.md) supply applicable quality requirements; the full [review-first workflow](booklet-review-first-workflow.md) applies to new imports and required full acceptance.

## 1. Establish scope once

- Record the requested behaviour, current project revisions and existing local edits. Preserve source evidence, IDs, classifications, layouts and pagination settings unless their change is authorised.
- Inventory all applicable occurrences across active books. Fix shared causes centrally and repair repeated content defects throughout the affected scope.
- Map affected patterns to questions, diagrams, physical pages and editions. Include pagination neighbours, inserted/deleted pages, shifted tails, answer-section transitions and navigation when affected.
- Record the required checks and final review coverage at the start. Do not automatically export every edition of every book for a local change; do not narrow a shared change to the user's named example.

### Structural preflight for feedback repairs (16 October 2026)

Before the first repair render, inspect the affected content and its saved presentation together. This is a short inspection within scope discovery, not an extra review stage or export.

Run the read-only structural inventory before rendering:

```text
node scripts/booklet/feedback-preflight.mjs --project-file .booklet-work/RUN/candidate.json --before .booklet-work/RUN/before.json --blocks BLOCK_ID,BLOCK_ID --out .booklet-work/RUN/preflight.json
```

The report includes saved arrangements, fixed widths, table cells and annotations, response owners, dependency links and diagram/presentation overrides. Broken arrangement references and missing dependencies fail the check; stored widths and annotations are reported for inspection, never automatically removed. Table-cell completeness and mathematical correctness still require comparison with the before-snapshot and source.

`check-feedback-pages.mjs --blocks` runs this preflight before launching its browser. Add `--baseline-project-file .booklet-work/RUN/before.json` to enforce repair scope there too. The standalone command's `--before` does the same without rendering. Unnamed block changes, unrelated ordering changes and project settings changes fail. Named blocks may move and their own project-level `blockLayouts` entries may change. Declare any other intentional setting or section-metadata change with a precise, repeatable `--allow-path /settings/compactAnswers/diagramWidths/DIAGRAM_ID` JSON pointer; do not grant a whole settings/sections tree. Paths use JSON-pointer escaping (`~1` for `/`, `~0` for `~`).

`saveRepair` enforces the same guard before its revision-safe transaction using `changedBlockIds` and optional `allowedPaths`. Include precise paths for intentional comment-resolution fields too. It writes `preflight.json` alongside the existing before-snapshot/readback when `runDir` is supplied. Readback compares every persisted field with the transaction's normalized canonical result, including preserved source lineage, bank revisions and ratings. It neither drops metadata from comparison nor repeats the save after a verification failure. These checks strengthen the existing discovery/save steps; they add no review stage.

- Check project-level and block-level layout overrides, including fixed item widths and saved arrangement references. A saved arrangement can constrain a rebuilt table or omit a newly added prompt. Update only the obsolete overrides and references; preserve unrelated manual layout choices.
- Inventory every fragment of a table or answer grid before consolidating it. Include both halves of side-by-side tables, all rows, givens, response owners and answers. Check that the completed answer contains every original cell, rather than assuming the first table is the whole task. Preserve stable answer identities and bank relationships.
- Inspect heading paragraphs for explicit line breaks before changing column widths. Remove an unwanted forced break as part of the authorised repair, then size columns for the complete heading and existing response space. Check the result at final size.
- For detached labels, distinguish the shared renderer's baseline or leading-margin behaviour from local cell padding and vertical alignment. Repair the shared cause centrally, then change local settings only where needed; retain meaningful arrangements and explicit exceptions.
- If automated checks report warnings outside the repair, compare them with the saved before-snapshot once using the smallest relevant check. Match the affected content or block as well as the warning, since physical page numbers may shift. Record confirmed pre-existing findings once; fix new findings caused by the repair and rerun only their dependent checks.

### Minimum verification for feedback maintenance

**Lean local repairs (5 October 2026, user-approved).** A repair confined to named blocks of one booklet uses the first matching row below and nothing more. The 5 October Earning Money repair (7 comments, 8 blocks, 23 minutes) printed 1,070 pages, rasterised 496 and inspected 36; its only automated catches were the first layout check and the answer-coverage check, and its only visual catch was on the answer pages. Studio reopens, the interaction script, readback, the bank comparison, `repo:check` and the combined-edition page inspections found nothing. For these repairs:

- Run `check-feedback-pages.mjs --blocks` once after the changes settle and again only after a failure. Inspect the selected Questions pages. Add `short` or `worked` to `--editions` only when practice answers changed.
- Combined editions get the automated answer-coverage and navigation checks (`--checks-only`, on by default) and are not printed or inspected. Name a combined edition in `--editions` only when covers, contents, answer-section transitions or footers changed.
- Reopen in Studio or script an interaction only when editor code or a Studio control changed. A renderer-only change is covered by the page check.
- Check bank sync only when a changed block is bank-linked. Run `repo:check` only before committing or when assets were added.
- Closeout is the before-snapshot, the revision-safe save and a short report to the user. See [section 6](#6-record-evidence-and-actual-costs).

Widen beyond this only for a reason you can name from the change itself.

Choose checks from the actual change, not the number of comments. Combine comments sharing a cause into one repair and verification group. Record the reason before adding a check outside this matrix.

| Change | Required coverage |
| --- | --- |
| Documentation or review metadata only | Check edited text, links or saved review fields. No application build, browser test or PDF export. Resolving a comment does not itself invalidate content renders. |
| Local content, maths or spacing | Compare changed content with source and taught methods. Inspect the final-size pages carrying the changed blocks, with their immediate neighbours, in the Questions layout; add an answer edition only when answers changed. Check further pages only where the repair visibly moved content. |
| Editor behaviour without a render change | Reproduce the fixed interaction and verify the result. For writes, wait for save acknowledgement and reopen once. Add fragment, undo/redo, rapid-edit, failed-save or mode cases only where the changed mechanism can affect them. No PDF export unless stored/rendered output can change. |
| Shared renderer or template | Audit all applicable occurrences and book-specific exceptions once. Check every distinct affected arrangement at final size; reuse checks for equivalent cases. Inspect changed pages in affected books, not every page of every book. Exercise each affected edition path; duplicate wrappers need only a focused integration check unless composition changes. |
| Pagination, covers, footers, numbering, links or export | Check changed page maps, transitions and navigation in the affected editions. Inspect affected boundaries and footers. Widen to the whole affected edition when renumbering or layout changes propagate throughout it. |
| Diagram content, context, dimensions or rendering | Run the applicable shading, colour, typography and geometry checks for affected figures. Run 3D visibility only for affected solids/viewing dependencies. Check fresh/cache parity only when cache or calibration behaviour changed. Inspect final-size output in each affected layout. |
| Project or bank writes | Use the revision-safe transaction with the expected revision; a rejected save is the conflict check. Check bank sync/pins only for bank-linked changed blocks. Test the transaction mechanism separately only if it changed. |
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

For scoped feedback on an accepted booklet, prefer the single-browser page check, which writes no project, bank or comment. For a repair to named blocks, select pages by block:

```text
node scripts/booklet/check-feedback-pages.mjs --project-file RUN/candidate.json --blocks BLOCK_ID,BLOCK_ID --out RUN/pages
```

This renders no baseline. It runs the full-DOM layout, diagram and navigation checks on the Questions edition, prints and rasterises only the pages carrying those blocks and their neighbours, and runs the same checks plus answer coverage on `with-worked` without printing it (`--checks-only EDITIONS`, or `none`). A renderer change made with the repair therefore cannot select the whole booklet. An unknown block ID fails the run. On Earning Money this took 19 seconds and printed 8 pages, against 70–82 seconds and 359 pages for the page-hash comparison after a renderer change. `--editions` now defaults to `student`.

Use the page-hash comparison when the affected blocks are not known in advance, such as a shared-renderer or style change:

```text
node scripts/booklet/check-feedback-pages.mjs --baseline-project-file RUN/before.json --project-file RUN/candidate.json --editions student,with-short,with-worked --out RUN/pages --cache-state .booklet-work/feedback-pages/cache.json --run-dir RUN
```

It hashes the accepted project's pages without printing them, runs the full-DOM layout, diagram, navigation and answer-coverage checks on the candidate, and prints and rasterises only changed pages, their neighbours and combined-edition boundaries. Both maps come from one runtime in one process. Combined editions take the Questions selection while their body paginates identically and no practice answer changed; otherwise, or with `--baseline-editions all`, they render their own baseline. Pages marked `inspectIn: "student"` are inspected once in the Questions layout; no pixel comparison is performed or claimed. For a shared-renderer change, run `--capture-baseline` before editing the renderer, then rerun without a baseline project; `--runtime-override URL_GLOB=FILE` or `--candidate-css FILE` tests an isolated candidate without touching the live tree and disables diagram-cache reuse when a diagram input is overridden. A whole-edition selection stops unless `--full-reason` is given. `--pages` adds pages for style-only changes that move nothing. The report lists compiles and memory/IndexedDB/server hits per pass; selected pages are not inspected pages.

Use `--editions student` for a question-only representative checkpoint when appropriate; include answer editions whenever they are affected. Missing baselines and global dependencies can legitimately require wider coverage. Development output remains separate from final acceptance.

Reuse valid compiled diagrams. The diagram version covers the TikZ engine directory and the static import closure of the diagram modules (`diagramInputFiles` in `render-cache-server.mjs`); editor-only library files outside that closure no longer invalidate compiled SVGs, and an unresolved or computed import widens the scope to every shared library. Each published version records its inputs in `_inputs.manifest`. Do not reuse SVGs across versions: stored history shows the same diagram key producing different SVG bytes under different versions. IndexedDB state is per origin, so keep `--base` consistent (`127.0.0.1:5173`) between tools sharing a state file. Cache validity must include relevant source, preparation/renderer version, fonts, assets, settings and dimensions. A renderer change invalidates dependent results even if the diagram's source text is unchanged. Exercise both fresh and cached paths where the change could affect their parity.

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

**Local feedback repairs keep less (5 October 2026).** Keep `before.json` for rollback and the one-off repair script in the run folder, not in `scripts/booklet/`. Resolve each comment with one sentence saying what changed and the page inspected. Report the changed blocks, saved revision, what the checks found and the elapsed time to the user in the reply. Do not write a hashed receipt, a provenance copy, extra project snapshots, per-comment check lists or retry accounting; `writeFeedbackReceipt` is optional. Record an intentional departure from the source on the block itself, as before. The fuller receipt below applies to new imports, shared-renderer changes and full-acceptance work.

For that wider work, keep one compact run receipt under `.booklet-work/RUN/` with:

- Input revisions/hashes, affected occurrence/page/edition coverage and representative cases.
- Check results, artifact paths/hashes, cache reuse and invalidation reasons.
- Automatically captured command/phase durations and run start/end times. Do not create retrospective timing work; unavailable manual timings stay unavailable. Concurrent phase durations must not be added and presented as wall time.
- Diagram cache hits/misses, pages exported, pages visually reviewed and pages compared automatically. Distinguish those forms of evidence.
- Failures, repeated work and why each repeat was necessary; actual token usage when available. Mark unavailable metrics as unavailable.

Reuse an existing correction register rather than duplicating editorial decisions in the receipt. Retain durable acceptance summaries and intentional source departures with project provenance; keep render caches and run logs local. Report measured savings only against a comparable measured baseline. Do not invent retrospective timings.

Keep tool output to changed fields, compact check summaries and actionable failures. Read required guidance once, then only relevant sections. Open source/output images only for the scoped visual decisions; batch useful contact sheets and enlarge uncertain details. Reuse existing verification tools instead of building several one-off export/comparison/closeout scripts. Await export completion before starting dependent raster or comparison work. Progress updates should report a finding or decision, not repeatedly announce another final pass.

### Feedback efficiency lessons (4 October 2026)

- Start complete-job timing at the first discovery action. If timing starts later, report that measured window explicitly rather than calling it the whole job.
- Capture the current page map before editing. Prefer a read-only pagination/map capture to a full baseline PDF when only page movement needs comparison; retain an existing compatible baseline where available.
- Check cache origin and relevant signatures before export. Reuse compatible diagram caches and keep the initialized browser/context for successive editions when the tooling supports it. Record actual hits and compilations; never bypass cache validity or export guards to claim reuse.
- For bounded feedback, inspect the changed arrangements and pagination neighbours once in the question layout. Combined editions receive automated checks only unless their covers, transitions or footers changed (superseded 5 October 2026; previously every affected combined-edition path and boundary was inspected). Preserve the full-acceptance exceptions.
- Studio virtualizes offscreen pages. Scroll the affected page into view and wait for its content to mount before asserting table/editor behaviour. The hidden print section is populated only after print preparation; an empty section is not evidence that content is missing.
- Tools for the points above: `check-feedback-pages.mjs` (`--blocks` selection or page map, one browser), `check-feedback-studio.mjs` (only when editor code or a Studio control changed; mounts each named block's page before reading it, then reopens and compares) and `feedback-closeout.mjs` (`startFeedbackJob` at the first discovery action, write-once `snapshotInput`, `saveRepair` with expected revision and block readback, `resolveComments` only against recorded inspected pages or checks, `writeFeedbackReceipt` with recorded work counts and `unavailable` for anything unrecorded).

**Cleanup sequencing (16 October 2026).** Follow [run-folder pruning](booklet-storage.md#pruning-run-folders) only after the repair closes. Preview first, inspect the preview, then check for active import, review and export processes immediately before applying it. Await and inspect that process check before launching cleanup; do not batch the check and mutation or chain them unconditionally. If another session starts work during the preview, defer cleanup. If the process check is unavailable, defer cleanup rather than treating the failure as an empty process list. A deferred cleanup does not invalidate the completed repair.
- Batch source-backed cloze/table repairs with their response mapping and mathematical checks. Reuse the existing repair, transaction and review helpers; avoid ad hoc duplicate closeout scripts. Durable preferences belong in the cross-session guidance and shared authoring prompt, not only a repair receipt.

Completion requires the agreed quality gates to pass, not merely a faster run. Report what changed, the verification result and any real limitations concisely.
