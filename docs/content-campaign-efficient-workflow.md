# Efficient MathsMap skill-content campaign

Approved by the user on 2 October 2026 for `worked-examples-2026-09`. This policy supersedes conflicting campaign orchestration requirements, while preserving content standards and historical evidence. It does not change booklet-import workflows.

## Booklet question-type rule (4 October 2026)

The user's purpose for this campaign includes removing practice and quiz questions that do not follow the source booklets. A six-skill comparison found the earlier standard retained them: of 7,109 pre-existing practice and quiz items in the first 298 published skills, 2 were removed. This rule supersedes "preserve good items" for off-booklet question types.

Every practice and quiz item must be a question type that appears in the booklet's teaching, guided practice or exercises for that skill. Type means what the student is asked to do and with what given information, not the context or values.

- Read the booklet's complete exercise set for the skill, not only the teaching span.
- Keep booklet-type items and review them as before. Flattening a multi-part booklet question into stand-alone questions is acceptable site format.
- Replace each off-booklet type with an adapted booklet question of the same tier and new values; record the original in `removals`. Remove or rewrite a worked example that existed only to support it.
- Only what a booklet question or part actually asks is a type. An intermediate step inside a booklet solution (for example interest earned on the way to another answer) is not.
- Follow the booklet's conventions for values and working, and its rounding convention, such as rounding each money amount to the nearest cent before combining where the booklet's solutions do. State the rounding in the question where it changes the answer.
- Remove, with no replacement: recognition questions on a taught term that the booklet never asks, unless recognising it is central to the skill (naming the sink is not; identifying the sampling method is, in a skill about sampling methods); and off-booklet items with no comparable booklet question to adapt.
- Keep Development and Mastery items that are a booklet question type with harder values, even where the booklet section has no exercises of that tier.
- Inspect the booklet images in the `media` folders. A question type shown only in an image counts.
- Use an explicit exception only when the evidence genuinely cannot decide. Do not invent a type.

Runtime: `node scripts/content/campaign.mjs activate-booklet-type --input FILE` with `{request,requestedBy}` records `bookletTypePolicy` (`booklet-question-type-v1`). It applies to author ownership assigned after activation and to reviews of those stages; existing owners, stages, receipts and accepted evidence are unchanged. Each practice/quiz entry in `coverage.items` then needs `bookletType: {sourceRef, question}` or `{exception: true, reason}`, and each accepted practice/quiz review outcome needs the reviewer's own `bookletTypeConfirmed: true`. Scripts never supply either. Reading the complete exercise set is a worker instruction and reviewer check; source selection does not yet enforce it.

Published skills need a style pass under this rule. Skills with no off-type items need no republication.

## Lean route (5 October 2026)

### Audit first (5 October 2026, user approved)

Workflow repair (7 October 2026, user requested): maintenance now independently rechecks a repaired candidate before evaluating its old review findings. Unchanged accepted outcomes remain hash-bound and scoped rechecks retain their normal coverage checks. Stale solution procedure labels use the existing formatting-only call, which cannot change values or mathematical meaning. Workers must evaluate requested numerical answers/options, derive distractor values, verify boundary cases and consistent givens, and keep necessary theory/solution headings aligned. These changes preserve the independent-review, call-limit, source, diagram and revision-safe publication gates.

Continue all unstarted skills with `node scripts/content/lean-route.mjs run --remaining --publish --concurrency 3`. This selects campaign membership with no lean record or an interrupted `running` record, excludes `survey-bias-ethics`, and leaves all completed, source-blocked, needs-attention and diagram-held records untouched. Such records still require diagnosed scoped repair or actual diagram inspection; the dispatcher never grants acceptance or automatically loops repairs. Do not launch a second campaign dispatcher while this one is active.

The user retained the audit of all 1,056 campaign skills and approved dropping mandatory content expansion and redundant verification. New `worked-examples-2026-09` runs now default to `lean-audit-first-v1` through the same `lean-route.mjs run | publish | status` commands. Existing published skills and historical records remain accepted; do not restart them.

One independent auditor checks the existing theory, every practice item, quiz answer/option/explanation and existing example against the relevant booklet evidence. A passing skill takes one model call and is recorded as `accepted: no change needed`, without rewriting or publication. Missing examples or incomplete example coverage are optional improvement work, unless the omission makes the existing teaching misleading or unusable. Do not block on cosmetic preferences or split usable working lines merely for style.

Only defects receive a bundled repair. The independent reviewer then checks changed/open items, removals and any explicitly affected dependencies, preserving accepted answers for unchanged content. Shared mathematical/theory changes still need the full affected review; a local theory wording correction can be checked alone when the auditor explicitly confirms no item dependencies. Incomplete reviews, unresolved source gaps and wrong options still prevent acceptance. Keep one automatic repair round, mechanical checks and revision-safe publication. A diagram hold applies only to new or changed diagram bodies, including theory diagrams; unchanged diagrams do not require another render because surrounding prose changed.

Passing skills normally use one call; defective skills normally use three (audit, repair, affected review), with a formatting-only call if needed. The user subsequently chose **GPT-6.1 Sol low** for future work on 5 October 2026, superseding the earlier medium requirement; the route sets this for audits, repairs and reviews and records actual usage. Preserve the three-worker limit, complete independent mathematical/source review and the booklet question-type rule. Existing minimum-count validation remains in force. No model calls are required simply to adopt this workflow. Booklet-family batching is a future efficiency option, not an extra stage or a claim of measured savings.

This section supersedes the author-first, mandatory-example-coverage and broad re-review instructions below for new campaign work. Historical author-first records keep their recorded policy. The deliberate `survey-bias-ethics` hold remains untouched.

Approved by the user on 5 October 2026 after the efficiency review below. It replaces the guarded ledger route for new work in this campaign. The ledger code and its historical receipts are unchanged and unused by this route.

Why: over 298 skills the independent reviewer found 245 issues in 10,616 item reviews, while the reading acknowledgments, lineage proofs, render receipts and 680 UI inspections rejected nothing in the final records. Claimed author plus review time was about 6 minutes per skill against about 18 worker-minutes of wall time.

```powershell
node scripts/content/lean-route.mjs run --ids skill-a,skill-b,skill-c --publish
node scripts/content/lean-route.mjs run --ids skill-a --section "booklets/mathsmap-sources/Stage 6 Standard/Booklet.md:120-480"
node scripts/content/lean-route.mjs run --ids skill-a --resume --publish
node scripts/content/lean-route.mjs publish --ids skill-a [--diagram-checked]
node scripts/content/lean-route.mjs status
```

Per skill, `run` does the following with GPT-6.1 Sol at medium reasoning, three skills at a time:

1. Author call. The booklet evidence (see below), its images and the live content and quiz are supplied inline with the booklet question-type rule. The author returns the complete corrected pair, a booklet question reference for every practice and quiz item, and the removals with reasons.
2. Mechanical checks: the site validator, a booklet reference on every item, valid removals, and no bare currency sign in changed text. `removed` rows that do not name a whole original item (theory edits, parts of an item) are moved to edit notes for the reviewer without a model call. Formatting errors (delimiters, TeX outside maths, currency) get one fix call per run, sent the candidate and the errors without the booklet; it may only replace existing text fields.
3. Independent reviewer call in a separate session. The reviewer derives every answer, picks the correct option of every quiz question from its own answer, confirms each item's booklet type, and checks the theory and removals. The script rejects a review that omits an item or whose correct option differs from the marked one.
4. At most one repair round. The reviewer then re-checks the changed items and any item the first review left open, or everything if the theory or removals moved, the first review left the theory or a removal open, or no full review has run yet. A run makes at most five calls.
5. Publication through `publishSkill`, which refuses if the live files changed since the baseline was read and keeps a recoverable journal.

It does not publish when findings remain after the repair round (`needs attention`), when nothing changed, or when a changed item contains a diagram (`held for diagram check`; look at the rendered diagram, then `publish --diagram-checked`). A skill with a finished record is skipped on later runs unless `--redo` or `--resume` is passed; a record still marked `running` was interrupted and is run again. Supplied booklet text over 450 KB needs `--section`. The limit counts the numbered text actually supplied after the existing table-padding normalization, preserving the same prompt and limit.

Booklet evidence (5 October 2026 efficiency review). Where the skill's source mapping cites lines, the route supplies each cited booklet's enclosing top-level (`# `) sections plus that booklet's mixed exercise sections (Check your Understanding, Mixed Practice, Challenge Exercise, Exam Practice), with an outline of the booklet's headings. Booklets mapped only as unconfirmed topic suggestions are named but not supplied. Each image in the supplied lines is attached once. Image paths containing commas use byte-identical copies in the isolated call folder because the worker CLI splits comma-separated image arguments; source labels and original evidence remain intact. The author returns a blocker naming the headings it needs when the supplied lines stop short of the skill's exercise set; rerun that skill with `--section`. A skill whose mapping cites no lines still gets its mapped booklets whole.

`--resume` (once per candidate) continues a `needs attention` record from its retained candidate instead of authoring again: mechanical checks, a full review unless one already covers exactly that candidate, one repair round and the re-review. It refuses, leaving the record untouched, when the live files moved since the baseline or the retained candidate does not match the record; use `--redo` for a fresh attempt.

Authorised maintenance (5 October 2026): the user requested autonomous repair of the reported pending issues. `run --repair` starts from the revision/hash-checked retained candidate of a needs-attention record or a diagram hold, including an exhausted resume. It sends the recorded findings and an optional `--finding "diagnosed issue"` to one repair call, then independently reviews the complete result. Findings still prevent publication; diagrams remain held. Failed-author candidates still require `--redo`. This is an explicit maintenance operation, not automatic repeated retries.

The user also approved a documented booklet-source exception for **only** `add-multiple-numbers-place-value`, `add-subtract-decimals` and `add-subtract-strategies`. `run --redo --source-exception` supplies `syllabus/Stage 3 Content.md` instead of unrelated Stage 4 booklets. Each assessment item must explicitly cite that syllabus and carry `sourceException: true`; every independent review outcome, including examples, must carry `sourceExceptionConfirmed: true`. Booklet-type confirmation remains required for all other skills. The record retains the reason and syllabus hash, and publication of a held candidate refuses changed syllabus evidence. All mathematical, option, stage, minimum-count, diagram and revision-safe publication checks remain in force.

Records: one compact file per skill in `booklets/provenance/content-campaign/worked-examples-2026-09/lean/` (status, baseline and candidate hashes, changed items, removals, call times and token usage, publication journal). The record is written after every call, and a later attempt keeps the earlier attempts' calls under `previousAttempts`, so interrupted, redone and resumed work stays counted. Working files are in `.agywork/content-campaign/worked-examples-2026-09/lean/<skill>/`.

Not checked by this route: page layout of text-only skills, and the old ledger's `published`/`pending` counts, which no longer reflect lean work. Use `status` for lean progress.

First live run, `credit-cards`: accepted after one repair round and published; four calls, 12.7 minutes, about 307k input and 23k output tokens.

First-batch checkpoint decision (5 October 2026): the user accepted the comparisons and permits worked examples to adapt booklet exercises when no booklet worked example covers the assessed method. Change the values, keep the target skill as the focus, and do not introduce more advanced skills. The same focus and advanced-skill restriction applies to practice and quiz adaptations. This resolves the exercise-derived worked-example blockers without relaxing the booklet question-type rule or independent review.

## Operating rules from the 4 October 2026 efficiency review

Measured over the first 298 skills: about 6 minutes of claimed author plus review time per skill against roughly 18 worker-minutes of wall time; 851 hand-written one-off scripts; 84 published skills made stale for rendering only by renderer-policy activations; 487 UI capture runs; 29% of skills needing a second author stage. Token use per skill was not recorded. These rules stay within the approved standard.

- Do not write a script per skill. Workers supply plain JSON (author delta, compact review input) and use `campaign-lean-cli.mjs` `expand-author`, `preflight-compact-review` and `batch` (`prepare`, `acknowledge-read`, `stage`, `review`, `publish`), which already cover the whole path.
- No further workflow or renderer-policy changes until the queue is done, unless a diagnosed blocker stops content. Reconcile stale rendering once, at final settlement.
- Capture UI once per stage hash, sampled views where the sampling guard allows, and reuse that capture for review.
- Plan only the next cohorts (`plan --ids`/`--size`), not the whole queue. Write progress snapshots at batch milestones.
- Record explicit structured confirmations in place of repeated "personally read" prose. The author's separate `compact-math-audit.txt` is not required.
- Record per cohort: claim-to-stage and claim-to-review minutes, off-type items found and replaced, second author stages, UI captures, and the account weekly-percent change per published skill.

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

Source-gap exceptions (9 October 2026, user approved): the user approved syllabus-based auditing and complete independent mathematical review for the displayed missing-source gaps. One skill subsequently gained actual booklet evidence, leaving the exact 53 skills listed in `booklets/provenance/content-campaign/worked-examples-2026-09/approved-source-exceptions-20261009.json`. This is a named whitelist, not a general exception. Use each skill's recorded stage/course syllabus; every assessment source citation and independent review must explicitly confirm that syllabus exception. Preserve the syllabus hash and refuse publication if it changes or the approval is no longer present. The historical three Stage 3 exceptions remain valid. Prefer actual booklet questions whenever located. The user approved up to ten parallel workers for this audit task; default campaign limits remain unchanged.