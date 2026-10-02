# Bounded Sol import, review and repair stages

> Future runs with `textbook-three-pass-v1` use [three-pass imports](booklet-three-pass-import.md), which supersede conflicting approval stages and exhaustive visual/audit requirements here. Historical runs keep their existing policy.

This is the stage handoff guide for the existing efficient import workflow. It
does not change accepted projects, question-bank schemas or historical run
policies. Use it with the [import efficiency guide](booklet-import-efficiency.md)
and the [change runbook](booklet-change-runbook.md). The current instructions in
`AGENTS.md`, including their dated precedence, remain authoritative.

## One coordinator, small fresh contexts

Future authoring follows the [graph sizing convention](booklet-cross-session-rules.md#graph-sizing-and-user-directed-compact-layouts-2-october-2026): routine supplied question graphs start around 70 mm wide and simple short-answer graphs around 50 mm, with larger sizes where readability or drawing needs require them. Do not stretch graphs to fill available width, reduce label fonts or discard mathematical features. Keep short/worked widths independent and preserve manual overrides. Include this concise guidance in relevant authoring assignments and use existing early/selected layout checks; introduce no extra sizing-review call. Compact-spacing tuning remains user-directed.

The coordinator reads `run-workflow next` and handles exceptions. As of
2 October 2026, all booklet transcription, authoring, dispatch, bookkeeping,
mathematical, teaching-method, question and visual review, and repair work uses
exclusively Sol 6.1 (`gpt-6.1-sol`) with `medium` reasoning. Do not substitute another
model or effort, or automatically escalate to high or xhigh. The user selected
medium for the production workflow on 2 October 2026, superseding the previous
high default. Historical run settings, completed evidence, trial overrides and
recorded model usage remain unchanged; do not silently migrate existing runs.
All use Standard speed, ephemeral contexts and the same
three-worker pool. Do not fork the conversation history into a worker. Provide
the current ticket, relevant source images, taught context, approved decisions
and exact ownership only. Preserve whole questions, shared stems and meaningful
exercise/category boundaries. Publication still uses the existing serialized
project/bank transactions.

Fresh runs use medium without a reasoning override. Retain the earlier
`reasoningOverride: {effort: "medium", reason: "User-requested trial"}` records
and CLI compatibility as historical provenance. All worker roles, repair calls,
immutable tickets, generation dependency hashes and usage receipts must use the
recorded configuration. Historical runs with other settings remain pinned;
the current runner rejects incompatible execution rather than rewriting them.
Standard speed, the three-worker cap and quality gates remain.

Worker queue waits default to 30 minutes. For a sustained import whose three
owners are verified to be progressing, a coordinator may set the process-local
`MATHSMAP_BOOKLET_WORKER_QUEUE_TIMEOUT_MS` before launching resumed work (for
example `7200000` for two hours). It accepts a positive integer up to 12 hours;
explicit `withWorkerSlot` timeouts take precedence. Record the diagnosed queue
failure and chosen limit in the run receipt. This changes only the wait for a
free slot, never the three-worker cap, model execution limit or lease ownership.
The lease records the selected timeout. Preserve completed outputs and resume
only assignments that never generated output; reconcile interrupted owners
before restarting their work. Do not silently change historical run settings.

Essential assignment diagram and supplemental guidance travels inline in a
stable prompt prefix; its retained file references are provenance. Count that
guidance within the 24,000-character variable budget and report an explicit
exception for an indivisible question or teaching context. Do not trade away
required instructions when a worker cannot read a linked file. This delivery
rule follows actual read-command policy rejections in the September paired
trial; the frozen trial prompts predate the correction.
Relevant corrected field values also travel inline, with their register references.
Available source-page images accompany visual-review batches; any additional
inaccessible source or composition evidence must remain a reported blocker.

`scripts/booklet/bounded-stages.mjs` exports these executable interfaces:

- `nextBoundedWork({runDir, selectedPages?, projectFile?, config?, configFile?, stages?, visualConcurrency?, visualPageLimits?})` derives pending jobs,
  ownership, dependency hashes, evidence references, blockers and the verification
  checklist from the current register and visual queue. It does not grant review
  credit or write an alternative checklist.
- `prepareBoundedStage(options, jobId)` reserves the ownership and writes one
  immutable request ticket. It returns `ticket`, `prompt`, `images`, `cwd`,
  `runDir`, `out` and `profile: "review"` for the generic booklet runner (legacy `runAstraTask` export name).
- `runBoundedStage(options, jobId, {runner?})` prepares, invokes the fresh review
  worker, saves its output, and submits the explicit result to the existing
  review APIs. Attempts, failures and usage use the existing attempt ledger.
- `recordBoundedStage(options, {ticket, result | resultFile})` records a supplied
  result without another model call. `ticket` is the returned `{path,hash}`.
  `cancelBoundedStage(options, {ticket, reason})` explicitly releases interrupted
  work without granting inspection credit.
- `registerFeedbackScope(options, record)` saves a reviewed grouping of existing
  pending issues with their named shared cause and exact fields. Its record needs
  `expectedRevision`, `sharedCauseId`, `issueIds`, `targets`, `occurrenceAudit:true`,
  actual `reviewer`, observations in `note`, and current hashed `artifacts`.
  Targets are `{scope, page, targetId, fields:["/exact/pointer"]}`. Scope is
  `inventory`, `author` or `project`. Unrelated findings are never grouped merely
  because their kinds or page numbers match.

For visual-only dispatch, the JavaScript API accepts a nonempty, distinct
`stages` subset of `['visual','composition']`. This skips unrelated job/prompt
construction while retaining the complete verification checklist; omitted stages
receive no acceptance. Omission preserves the full default dispatch. Stage scope
and `visualConcurrency` are captured in each immutable ticket. Execute, record
and cancel inherit omitted options from the ticket and reject explicit changes.
These opt-ins do not add CLI flags.

For normalization of an already retained result, the `runSemanticPackets` API
accepts `localReplay: true` with an explicit local runner. The runner must report
`metrics: {provider: 'local-replay', externalModelCalls: 0, usage: null}`. This
does not acquire a model-worker lease; input hashes, immutable attempts, all
validators and revision-safe serialized publication still apply. Authoring
replays must select `pageReplay: true` rather than dispatch new assignments.
The default model runner and ordinary external runners retain the worker pool.

`visualPageLimits` optionally sets per-edition batch limits from one to eight
pages, for example `{short:2, 'with-short':2}` for dense answers. Other editions
retain the eight-page limit. When supplied, batches preserve edition boundaries
and page order. The immutable ticket captures this map; execution, recording and
cancellation inherit omitted values and reject explicit changes. Page coverage
and inspection requirements are unchanged. Count the complete delivered prompt,
including custom source supplements, against the variable budget; record any
indivisible exception rather than silently omitting evidence.

CLI stage actions use `--run-id RUN`, `--job JOB_ID`, and, when reviewing an
unsettled assembled project, `--project-file PROJECT.json`. `record-stage` and
`cancel-stage` receive their record through `--input RECORD.json`. Request and
result artifacts remain under the ignored run directory; keep them for recovery,
not in Git.

Use `--config CONFIG.json` for the current run configuration. A `configFile`
reference is read again before recording or reusing work, so changing an
exercise's teaching-page selection invalidates that exercise's evidence. An
in-memory `config` is captured as a frozen ticket input. `feedback-scope` records
the reviewed shared-cause scope using `--input`.

## Substantive stage contracts

**Mathematical inventory review.** Inspect each independent source inventory
against the actual page image. Check arithmetic, stated precision, ambiguity and
numerically testable geometry. Retain redundant measurements. Existing editorial
findings must be resolved first. A successful worker returns the actual reviewer,
observations, `sourceCompared:true`, `mathematicsVerified:true`, and the assigned
`pages:[{page,key}]`. `recordMathReview` remains the gate. A newly discovered
ambiguity returns `outcome:"needs-review"` with specific findings, leaving the
ticket visibly blocked and the mathematical review unapproved. New findings are
stored in the ordinary issue register with their assigned source scope, job hash
and actual evidence; cancelling a ticket cannot delete or resolve them.

**Teaching-method review.** Review the exercise's teaching blocks, worked examples,
Key Ideas, scaffolds and explicitly mapped context once. Methods must have concise
`statement` text and source references `{pageNumber,targetId?}`. An accepted
summary requires `outcome:"accepted"` and `sourceCompared:true`. Missing or
contradictory context remains `outcome:"needs-context"`. The register stores the
summary in `verification.teachingContexts`; its content, source dependencies and
evidence must still match before reuse. This summary cannot approve an answer or
replace question-level review. See the [worked-solution contract](booklet-worked-solution-style.md).

Practice-only imports use source references instead of imported teaching blocks.
The projection preserves configured `teachingPages`/`pageTeachingPages`, individual
`teachingContext.pdfPages` and method/mapping notes, including grouped questions'
constituent provenance. When present, the retained provenance
`teaching-context-index.json` contributes only the exercise's selected external
references and inspected page records. PDF/image hashes must match. These older
observations are context for a new review, never an automatic fresh approval.
Stored teaching records bind the selection, original source artifacts and relevant
index content; unrelated exercise changes preserve reusable work.

**Question assessment.** Review at most four complete question blocks per job.
Check every part's short/worked answer, classification and taught method; include
units, precision, native editability and requested reasons. Return exactly the
pending `question:BLOCK_ID` records, each with `outcome:"passed"` or `"failed"`,
observations and the `answer`, `skillMapping`, `taughtMethod` checks. Records go
through `recordVerification`; current successful question records are reused only
when their question and teaching dependencies and evidence are unchanged. A
reviewed theory summary is passed by its current methods and hashed evidence,
without the preceding coordinator conversation.

**Feedback.** Establish a shared cause and audit every applicable occurrence.
Record exact field targets, preserving book-specific content and boundaries.
Review the existing issues, source evidence, active corrected values and approved
decisions. Return complete structured `corrections` and `resolutions` in the
existing `applyDecisions` format. Foreign pages, unresolved owned issues and
out-of-scope fields are rejected. Additional occurrences or dependent fields must
be added to the reviewed scope before acceptance. Approved corrections are
preflighted and materialized through the existing register helpers; propagate
them to the current project using the normal revision-safe project/bank save.
Never overwrite a canonical packet or live project from a worker.

**Visual review.** Each job owns at most eight actual rendered pages. Preparing
it begins the existing queue's timed inspection. The default remains one active
visual job. The JavaScript API may opt in with `visualConcurrency:2` or
`visualConcurrency:3` for disjoint page batches in the same immutable queue
snapshot. Include these workers in the shared three-worker limit; mathematical,
teaching or other review workers consume the same pool. Inspect each whole page
against the source at final size, including
all labels, answer parts, footers, writing space, arrangements and pagination.
Return `outcome:"accepted"` or `"needs-change"`, actual observations, and explicit
`sourceCompared`, `contentVerified`, `presentationVerified` checks. Neither the
worker model's presence nor a dependency hash establishes inspection.

To run a visual wave, call `nextBoundedWork(options)`, select at most the available
worker count of disjoint, unblocked visual jobs, and run
`Promise.allSettled(jobs.map(job => runBoundedStage(options, job.id, {runner})))`.
For sustained work, refill each free worker slot as soon as a result is recorded;
do not wait for the slowest worker in a wave. Preparation, result recording and cancellation share the bounded mutation lock;
only the independent worker executions overlap. Each result rechecks current
project, renderer, source, page evidence and ownership before serialized recording.
Overlapping claims, a fourth claim and stale snapshots are rejected. Existing or
default single-review claims remain exclusive: let them finish or explicitly
cancel them before opting in. Completed inspection records are preserved.

Before changing dispatch policy or pinned guidance, request a graceful drain:
stop assigning new jobs, let active workers finish, and serialize their results.
Confirm that no stage or page claims remain before restarting. Recover completed
immutable output with `record-stage`; do not repeat the model call.

For direct queue calls, `beginPageReview` accepts the same `visualConcurrency`
option and returns `startedReviewId`. Status exposes every claim in
`activeReviews`; the legacy `active` pointer remains the first outstanding claim
so old callers still see a busy queue. Refresh `expectedRevision` and
`sessionKey` for every direct mutation. Cancellation must identify `reviewId`
when multiple claims exist; bounded cancellation selects its own ticket's claim.
A cancellation grants no inspection credit. Keep failed batches and their
findings visible while independent batches continue, then repair and inspect the
affected pages before acceptance. The final gate waits for every claim to finish
and every required page to pass.

Combined composition is a separate, exclusive job per edition after pending page inspection.
It cannot overlap any page claim or another composition claim.
It explicitly checks covers, contents, transitions, numbering, every footer and
links. The existing final queue and acceptance APIs still require complete
coverage: all standalone pages, combined exceptions and boundaries, exact PDF
pixel evidence for reused bodies, both combined compositions, and all five
automated edition checks. Eight-page batches never reduce that coverage. See the
[unique-layout acceptance policy](booklet-review-first-workflow.md#unique-layout-final-acceptance).

## Complete-job accounting

Measure the whole accepted import and feedback cycle, including coordinator work,
failed attempts, substantive review, repairs and exports. Do not infer the full
job's cost from transcription workers alone. All accounting commands below accept
`--run-id RUN` or `--run-dir RUN_DIRECTORY` and an explicit `--input RECORD.json`.

At the start, link each participating local session with `link-session`. Its
record is `{sessionId, role, stage, rolloutPath}`, where `role` is `coordinator`,
`transcription` or `review`. Link the actual coordinator and review rollouts as
well as independently recorded worker attempts. Optional `startedAt`/`endedAt`
boundaries attribute disjoint stage windows within one session; overlapping stage
links are rejected. Optional `attemptIds` connect known worker attempts to their
session evidence for deduplication. A nonexistent historical log remains explicitly
unavailable; do not replace it with guessed token counts or a different session.

Record real allowance observations before and after the same job with
`weekly-usage`. Each record includes `{id, at, resetAt, windowMinutes:10080,
usedPercent, limitId, unrelatedConcurrentUsage, unrelatedSessionIds?}`. Use the same
weekly reset window and limit identity for a comparison. Label concurrent usage
as `none`, `present` or `unknown`; list unrelated session identities only when
known. A reset crossing or concurrent use cannot support an attributable weekly
saving. Never convert a weighted token proxy into a measured allowance percentage.

Use `wait-start` when human feedback begins waiting and retain its returned `id`;
call `wait-end` with that `id` when work resumes. Include a concise reason or note
in those input records. These are observed boundaries, not retrospective estimates.
The receipt separates active elapsed time, human waiting, review time, calendar
span and the sum of concurrent model-call durations. Overlapping workers do not
multiply active wall time.

Run the existing `check-compact-exercises.mjs` export/check command with
`--run-dir RUN_DIRECTORY` so actual generated/reused PDF observations are recorded
with their artifact hashes, edition and dependency keys. `export-observation`
accepts explicit equivalent evidence using `{id, edition, reused, artifact,
dependencyKey, phaseId?}`. An existing PDF file, phase label or cache path alone
never establishes export reuse.

Save the complete receipt using:

```text
node scripts/booklet/run-workflow.mjs receipt --run-id RUN --out RECEIPT.json
```

Inspect full `completeJob` metadata as well as the compact display. `missingRoles`
alone is insufficient: examine `unavailableSessions`, `partialSessions`,
`unavailableByMetric`, duplicate/overlap diagnostics and unfinished session,
attempt, phase and waiting intervals. Unknown cached input, output, tool counts
or timings must remain unknown; partial coverage cannot be reported as a complete
total. Keep the original artifact references and actual failed/retried work.
Completed tool calls and rejected tool attempts are separate observations; policy
rejections can appear in stderr without a completed call in the JSON event stream.
Compare measured accepted work on the paired trial and next required full import;
the approximately two-hour/10%-allowance goals remain targets until verified.

## Concurrent edits, interruption and stopping

Work ownership is stored with the register under `verification.stageClaims`.
An active claim prevents duplicate workers. The ticket binds its relevant source,
content, evidence and ownership. Results are checked again under the existing
workflow transaction. An unrelated register revision may be rebased only when all
owned dependencies still match; a source, question, taught-method, target-field or
visual-session change rejects the stale result. A rejected batch grants no
partial workflow approval.

Failed or stale output remains available beside its immutable request. Correct
the structured result and use `record-stage` when the evidence itself is still
current. Do not repeat a model call just to recover existing output. A result
that identifies unresolved editorial choices remains a blocked active ticket;
resolve those choices through the register, or explicitly cancel before preparing
the corresponding feedback job. New findings, failed question checks and missing
teaching context remain ordinary pending issues after cancellation. Resolve them
through the existing reviewed `retained` or `corrected` decision API. Later worker
contexts carry the relevant decision reasons and evidence. There is no silent
lease expiry or automatic acceptance. Cancel a
visual ticket before preparing a different snapshot; cancellation credits no
inspection.

Use the runbook's minimum verification matrix for feedback: changed occurrences,
affected pages and pagination neighbours, and only changed behaviours or
dependencies. Full five-edition acceptance remains required for a new settlement
or unbounded global change. Preserve authorised current edits in the settled
snapshot, reuse passing evidence with unchanged dependencies, and invalidate only
what changed. Once required checks and task findings pass, publish, read back,
check repeat-import idempotency, and stop. The time and allowance targets remain
unproven until comparable accepted imports, including repairs, are measured.
