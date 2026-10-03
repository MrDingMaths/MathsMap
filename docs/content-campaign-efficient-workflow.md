# Efficient MathsMap skill-content campaign

Approved by the user on 2 October 2026 for `worked-examples-2026-09`. This policy supersedes conflicting campaign orchestration requirements, while preserving content standards and historical evidence. It does not change booklet-import workflows.

## Lean execution precedence (3 October 2026)

The user requested faster, leaner execution. Prioritize ready content authoring, independent review and serialized batch publication. Complete the already-tested repair metadata blocker fix, then stop further workflow development unless a demonstrated blocker prevents content work. Do not build new evidence-reuse systems or add speculative test coverage.

Keep one compact handoff and completion report per related cohort; generate receipt structure and hashes mechanically. Preserve normal per-skill acceptance, full independent mathematical/source review, all parts/options, booklet voice and stage boundaries. Repair substantive defects and preserve good content; optional cosmetic changes and additional audit narratives do not delay publication.

Switch worker roles to match the queue: use two authors and one reviewer when more content is needed, and one author and two reviewers when staged work is waiting. A worker never reviews their own content. Start review as soon as a skill is staged and publish accepted skills without waiting for the rest of a cohort.

Use existing guarded reuse for unchanged source readings, mathematical outcomes and diagram captures. Reconcile stale rendering once shared runtime changes settle, before final campaign acceptance, rather than repeatedly refreshing earlier skills during authoring. Inspect distinct changed diagrams and materially different containers; retain valid inspections through scoped repairs. Run applicable focused checks and one build after shared code settles. Progress snapshots are for meaningful batch milestones or requested status, not every operation.

## Delivery

### Single assessment audit and lean handoffs (3 October 2026)

For new assignments, the author reads retained assessments to classify actual methods and check source/style/stage boundaries. The author derives every new example and changed answer, but does not write a second full mathematical audit of unchanged assessments. A different reviewer performs the complete independent mathematical/source audit of all retained assessments, examples, requested parts, options and explanations. `coverage.items[].audited` records complete author method/scope classification, not a second independent arithmetic review. Retain accepted outcomes only through the canonical hash-bound prior-review mechanism; review repairs within their affected scope. Scripts never invent independent acceptance.

Keep the same author and reviewer with a booklet family across several ready cohorts. Share their own unchanged, hash-bound complete teaching evidence once. Adapt source example patterns and familiar setout, changing values deliberately. Different contexts, signs or values do not alone establish distinct methods; use multipart contrasts where the actual taught method is shared. Preserve coverage of genuinely different assessed routes.

Send one coordinator handoff naming the author, reviewer and immutable staging locations. Authors deliver ready stages and evidence directly to the assigned reviewer; reviewers return concise accepted stages or one repair bundle. Workers do not wait for coordinator permission to read ready evidence or acquire normal guarded ownership. The coordinator handles exceptions and serialized revision-safe publication. Straightforward cohorts continue separately from unresolved source or diagram work; affected skills remain pending.

Compact review input retains explicit independent answers, whole-item decisions and ordered option truths. Shared option-set observations require the reviewer's explicit confirmation that every option and explanation was checked, with explicit exceptions. Expansion supplies structure and hashes only. Cohort UI sampling and context-only prerequisite reconciliation require separately verified opt-in guards and complete applicable evidence; otherwise retain ordinary safeguards. Historical configurations and receipts remain immutable.

- Aim for 4–8 ready, related skills by booklet teaching section. Use smaller cohorts when prerequisites or source context leave fewer ready skills; do not pad a batch or delay useful work. Use one author and a different independent reviewer per batch, with at most three active workers. Keep publication serialized and dependency ordered.
- Give each worker one complete, hash-bound shared teaching bundle and only the relevant skill deltas. Read unchanged sources and prerequisite Theory once per worker and teaching context; reuse that actual reading only while its dependencies match. Never substitute a summary for missing teaching evidence.
- Author questions, solutions, examples and method coverage together. Independently check every retained assessment, requested part, MCQ option and explanation against the source, scope and mathematical answers.
- Return straightforward repairs together. The author repairs the batch; the independent reviewer checks changed items and affected dependencies. Preserve passing checks elsewhere. Escalate only consequential uncertainty.
- Retain booklet language, notation, taught methods and stage boundaries. Repair defective practice before choosing examples; preserve valid tasks and legitimate narrow coverage. Use manageable numbers that expose structure.

## Evidence and verification

- Scripts generate hashes, IDs, item/option receipt structure, dependency comparisons, manifests and progress counts. Workers provide mathematical derivations, decisions and concise findings rather than reproducing candidate content or writing hashes manually. Scripts must never generate independent mathematical acceptance from candidate answers or correct markers.
- Validate complete receipt structure before handoff. Record one compact result per batch plus scoped repair deltas; preserve per-skill acceptance and recoverable publication transactions.
- Review each distinct new or changed diagram once, then inspect materially different containers or layout occurrences. Reuse exact matching content/render evidence. Mathematical equality, source identity and final-size readability still require appropriate checks.
- Handle shared application defects separately. Continue unaffected content work. Invalidate only demonstrably affected evidence; use tested dependency/applicability rules rather than globally repeating source or mathematics reviews after a renderer edit.
- Do not bypass existing validators, independent-worker rules, revision locks or stale-publication guards. Implement and test equivalent scoped mechanisms before retiring broader checks. Preserve historical profiles and receipts.
- Run relevant tests after shared changes settle, then one final application build and repository check. Do not trigger unchanged booklet imports or PDF exports.

## Efficiency control

Measure one representative batch before scaling: actual duration, recorded jobs, retries, repair count, reused evidence and available usage. Report unavailable token/inference measurements as unavailable. Do not claim savings before measurement.

Use concise worker instructions and event-based handoffs. Report meaningful completed work, decisions or blockers; avoid repeated unchanged status messages. Resume successful assignments and accepted content rather than restarting them.

Runtime batching, automatic receipts and scoped invalidation must be implemented and verified when Windows command execution is restored. This document is the approved policy, not a claim that those runtime capabilities already exist.

## Opt-in lean runtime pilot

The standalone CLI uses `--profile lazy-campaign-delta-v1`; existing campaign commands, contracts and historical preparations keep their recorded policy. This is a grouping and receipt tool, not another scheduler or an acceptance authority.

```powershell
node scripts/content/campaign-lean-cli.mjs plan --profile lazy-campaign-delta-v1 --out .agywork/lean-plan.json
node scripts/content/campaign-lean-cli.mjs check --profile lazy-campaign-delta-v1 --input .agywork/one-batch.json
node scripts/content/campaign-lean-cli.mjs claim --profile lazy-campaign-delta-v1 --input .agywork/one-batch.json --skill SKILL --worker UNIQUE-WORKER --native-actor /root/ACTUAL_ACTOR
```

`plan` returns `batches` of 1–8 author-ready skills sharing a mapped booklet and topic (individual teaching spans remain bound), plus explicit skipped skills. These mapped sources are suggestions until normal source preparation confirms the complete teaching units. Save one returned batch object for `check`/`claim`. `--ids` is an optional comma-separated filter and `--size` is 1–8; `--minimum-size` defaults to 1. Set it to 4 to reproduce legacy grouping. New manifests bind the explicit minimum; historical manifests retain their original four-skill contract. Every campaign prerequisite must be published even when outside that filter. Plans bind each frozen baseline, live content/quiz bytes, source/scope/full prerequisite context, complete parent content/quiz bytes and the prospective execution profile. Changed members are skipped without rewriting the immutable manifest; unchanged members remain available. Publication remains dependency ordered and serialized.

Small source-related groups are returned directly rather than discarded for having fewer than four members. The coordinator can then dispatch a smaller genuinely related cohort through the existing assignment guards and use the lean receipt tools for each prepared assignment. Manual selection does not establish source acceptance or bypass prerequisites.

`claim` claims only the named skill through normal `nextAssignment`, with the stale-plan check inside its existing ledger lock. Normal native lineage, existing ownership and three-active-assignment gates remain in force. The same held assignment can resume through its normal captured-lineage gates; complete/release it before claiming the next member. Preparation, complete evidence reading, native provenance, independent review and all normal staging/publication guards still apply. Neither planning nor checking acquires ownership or marks sources read.

For an already prepared native assignment, obtain its current binding:

```powershell
node scripts/content/campaign-lean-cli.mjs binding --profile lazy-campaign-delta-v1 --skill SKILL --out .agywork/binding.json
node scripts/content/campaign-lean-cli.mjs expand-author --profile lazy-campaign-delta-v1 --skill SKILL --input .agywork/author-delta.json --out .agywork/expanded-author.json
node scripts/content/campaign-lean-cli.mjs preflight-review --profile lazy-campaign-delta-v1 --skill SKILL --input .agywork/review-receipt.json --out .agywork/checked-review.json
```

Author input is `{profile,binding,edits,result,derivations?}`. Each edit is an explicit guarded JSON pointer rooted at `/content/` or `/quiz/`. Default replacement uses `{path,before,value}`; add uses `{operation:"add",path,beforeAbsent:true,value}` for an absent object property; remove uses `{operation:"remove",path,before}`. This supports adding workedExamples and removing legacy workedExample. Insertions/deletions/reorders inside arrays require deliberate replacement of the entire array. No edit generates a value or silently removes an item. Each final assessment/example requires a supplied coverage mapping `{where,methods,audited:true}` affirming the author has audited the complete item. Candidate solution working is retained; do not retranscribe it into a second receipt. Optional `{where,working}` derivations can record additional reasoning absent from the candidate. `result` contains the normal author decisions (coverage methods/items, sourceReview, removals, substantiveCorrections), without a candidate pair. Expansion preserves everything outside the supplied edits and uses `normalizeWorkerResult` for coverage/source/removal hash binding. Workers remain responsible for all mathematics and source/method decisions.

Reviewer input is `{profile,binding,result}` with the normal review result. Every current whole practice/quiz/example requires an explicit verdict, independentSolution and observation; every MCQ requires its complete ordered options array, each with an explicit boolean mathematicallyCorrect and a nonempty observation checking whether it answers the stem and whether its why is valid. This pilot preflight requires complete explicit outcomes; existing scoped reuse remains available through the normal workflow rather than a new reuse mechanism. It binds hashes through `normalizeWorkerResult` but never derives option truth, changes a verdict, generates acceptance or grants visual credit. Theory/source observations are mandatory. Preflight shares the ledger's canonical outcome/option, removal, unavailable-illustration and changed-step/header checks, together with captured preparation, parent-reading and native provenance validation. Include actual worker metrics or the actual reviewerProfile in `result` for strict native assignments; preflight cannot invent actor identity or exposed runtime settings. These remain checks of supplied decisions and evidence, not independent mathematical review.

Positive visual receipts require an explicit boolean `solid3d`, observation, geometryObservation and paletteObservation; solid diagrams also require visibilityObservation. Retained paint (including styles, white masks and markers detected by the shared shading scanner) requires a worker-supplied purposefulFillObservation. Scripts bind omitted field and block hashes mechanically. Each receipt must name an actually changed field or a canonical field explicitly selected in flaggedDiagrams; unknown flags and extra unchanged inspections fail before handoff. Actual render references remain mandatory, and the normal ledger still validates capture bytes, renderer applicability and visual evidence before granting any credit. Negative inspections stay in findings and flaggedDiagrams for a batch repair; preflight does not turn findings into edits.

The expanded/checked envelope contains `.result` for the normal handoff, the exact assignment/actor/profile/evidence binding and `receiptStructureOnly:true`. Keep the envelope and original worker delta (and any optional derivations) together; use the normal worker-profile/proof and native ledger route. `--out` uses exclusive creation and refuses to overwrite historical files. No renderer, candidate, source or ledger bytes change during expansion or preflight. Record actual pilot duration, retries and reuse before claiming efficiency gains.

Use one process for a sequential batch of normal guarded operations:

```powershell
node scripts/content/campaign-lean-cli.mjs batch --profile lazy-campaign-delta-v1 --input .agywork/batch-operations.json --out .agywork/batch-receipt.json
```

Input is `{profile,campaignId,operations}`. Each operation names `command` and `skillId`. Supported commands are `binding`, `prepare` (explicit current workerId and optional arguments), `acknowledge-read` (explicit current workerId and the actual acknowledgment), `expand-author`/`preflight-review` (input worker envelope), `stage`/`review` (input retained expanded or checked envelope), and `publish` (exact current stageHash and publisher). Stage/review recheck the current assignment binding; every mutation calls the existing per-skill ledger guard. Publication is awaited sequentially through the recoverable transaction, retaining live-byte and dependency checks. Batch execution neither claims several skills nor manufactures a reading acknowledgment; the normal ownership and three-worker limits still apply.

The compact batch receipt records every operation as complete, failed or not-run and retains the result of each completed operation. Failure stops the remainder; resume only required operations with a fresh immutable receipt after diagnosing the failure. An existing `--out` file is rejected before any batch mutation. The receipt is an orchestration record, not cohort acceptance or an atomic multi-skill transaction. Preserve per-skill historical receipts and collect full independent findings before asking the author for a batch repair. No automatic scheduler or semantic repair generation is introduced.
