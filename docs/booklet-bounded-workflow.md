# Bounded Astra import and review stages

This is the stage handoff guide for the existing efficient import workflow. It
does not change accepted projects, question-bank schemas or historical run
policies. Use it with the [import efficiency guide](booklet-import-efficiency.md)
and the [change runbook](booklet-change-runbook.md). The current instructions in
`AGENTS.md`, including their dated precedence, remain authoritative.

## One coordinator, small fresh contexts

The coordinator reads `run-workflow next` and handles exceptions. Authoring and
bookkeeping use Astra Low; mathematical, teaching-method, question and visual
reviews use Astra High. All use Standard speed, ephemeral contexts and the same
three-worker pool. Do not fork the conversation history into a worker. Provide
the current ticket, relevant source images, taught context, approved decisions
and exact ownership only. Preserve whole questions, shared stems and meaningful
exercise/category boundaries. Publication still uses the existing serialized
project/bank transactions.

`scripts/booklet/bounded-stages.mjs` exports these executable interfaces:

- `nextBoundedWork({runDir, selectedPages?, projectFile?})` derives pending jobs,
  ownership, dependency hashes, evidence references, blockers and the verification
  checklist from the current register and visual queue. It does not grant review
  credit or write an alternative checklist.
- `prepareBoundedStage(options, jobId)` reserves the ownership and writes one
  immutable request ticket. It returns `ticket`, `prompt`, `images`, `cwd`,
  `runDir`, `out` and `profile: "review"` for the generic Astra runner.
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

CLI stage actions use `--run-id RUN`, `--job JOB_ID`, and, when reviewing an
unsettled assembled project, `--project-file PROJECT.json`. `record-stage` and
`cancel-stage` receive their record through `--input RECORD.json`. Request and
result artifacts remain under the ignored run directory; keep them for recovery,
not in Git.

## Substantive stage contracts

**Mathematical inventory review.** Inspect each independent source inventory
against the actual page image. Check arithmetic, stated precision, ambiguity and
numerically testable geometry. Retain redundant measurements. Existing editorial
findings must be resolved first. A successful worker returns the actual reviewer,
observations, `sourceCompared:true`, `mathematicsVerified:true`, and the assigned
`pages:[{page,key}]`. `recordMathReview` remains the gate. A newly discovered
ambiguity returns `outcome:"needs-review"` with specific findings, leaving the
ticket visibly blocked and the mathematical review unapproved.

**Teaching-method review.** Review the exercise's teaching blocks, worked examples,
Key Ideas, scaffolds and explicitly mapped context once. Methods must have concise
`statement` text and source references `{pageNumber,targetId?}`. An accepted
summary requires `outcome:"accepted"` and `sourceCompared:true`. Missing or
contradictory context remains `outcome:"needs-context"`. The register stores the
summary in `verification.teachingContexts`; its content, source dependencies and
evidence must still match before reuse. This summary cannot approve an answer or
replace question-level review. See the [worked-solution contract](booklet-worked-solution-style.md).

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
it begins the existing queue's timed inspection. There is only one active visual
queue session, so another visual job waits while mathematical or theory workers
may continue. Inspect each whole page against the source at final size, including
all labels, answer parts, footers, writing space, arrangements and pagination.
Return `outcome:"accepted"` or `"needs-change"`, actual observations, and explicit
`sourceCompared`, `contentVerified`, `presentationVerified` checks. Neither the
worker model's presence nor a dependency hash establishes inspection.

Combined composition is a separate job per edition after pending page inspection.
It explicitly checks covers, contents, transitions, numbering, every footer and
links. The existing final queue and acceptance APIs still require complete
coverage: all standalone pages, combined exceptions and boundaries, exact PDF
pixel evidence for reused bodies, both combined compositions, and all five
automated edition checks. Eight-page batches never reduce that coverage. See the
[unique-layout acceptance policy](booklet-review-first-workflow.md#unique-layout-final-acceptance).

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
resolve those choices through the register, or explicitly cancel and prepare
current work. There is no silent lease expiry or automatic acceptance. Cancel a
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
