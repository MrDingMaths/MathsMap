# Pedagogy audit v2 (plan, 5 November 2026)

Status: plan with James's decisions recorded (5 November 2026). Implemented 5 November 2026 in `pedagogy/audit-v2.mjs`, `pedagogy/audit-v2-plan.mjs` and `pedagogy/audit-v2-prompts.mjs`; pilot status and the implementation notes are at the [end](#implementation-notes-5-november-2026).

**Scope: booklet masters only (James, 5 November 2026).** The audit is for booklet masters, the booklets listed in the programme ledger (`rows` of `.booklet-work/end-goal-20261028/coverage-status.json`). It is not for imports in progress, candidate pools, bank projects or other copies. The runner refuses a booklet that is not in the ledger; `--allow-non-master` overrides this only when James asks.

**Stage 4 masters are eligible (James, 7 November 2026).** The ledger lists only Stage 5 and Stage 6 booklets, but every Stage 4 master (`library.courseId: "s4"`, `library.category: "master"`, not archived) is also in scope. The runner reads this itself (`isStage4Master`, 8 November 2026); `--allow-non-master` is no longer needed for them.

**Verified findings are applied automatically (James, 8 November 2026).** After reviewing the pilot comments, James approved every verified finding. `--apply` now applies them in its single save, and each one still leaves its Studio comment, open and headed "Applied automatically", so James can review the work quickly. See [automatic application](#automatic-application-of-verified-findings-8-november-2026). Batches run with `pedagogy/audit-v2-batch.mjs`.

It replaces the single-call topic audit (task 3 of the 3 November Claude workflow brief) and makes the archetypes, coverage-challenge, principles and review+challenge passes legacy. Their code and records stay.

## Aims

For each exercise in a booklet:

1. Routine questions rated 60 or above (the first chilli) move to the Challenge exercise (James, 9 November 2026; `LIMITS.routineCeiling` is 59). Exam questions never go to Challenge: they all belong in the Exam section, including an exam-titled question still in an exercise. Dependent parts move together.
2. Routine questions are ordered by difficulty. Reordering comes first, because it's free; new questions fill only the gaps that remain. A question that builds on an earlier one in the same exercise (method support, a backfill's source anchor) stays after it, and the rest of the exercise still sorts around the pair: the next question is always the easiest one whose support is already placed (`polish/score-order.mjs`, 10 November 2026, user requested). Before this, one such pair held the whole exercise, and new questions added at the end stayed there (Data Analysis 1: Standard Deviation). Support pointing backwards in the current order is not enforced.
3. Every question is mapped to a question type (archetype), including Exam questions.
4. Each type has at least 3 independent routine practice items. Each part a student answers on its own counts, at most 3 per question; a scaffolded chain of steps in one problem counts once, and a reviewed `practiceItems` grouping (30 October rule) still wins ([count rules, 8 November 2026](#count-rules-parts-and-synonyms-james-8-november-2026)). v2 never creates groupings or reorders parts within a question. Exam questions don't count toward this. Gaps are filled with bespoke generated practice. A type that is genuinely untaught gets a proposed worked example and guided practice in the theory section.
5. Difficulty rises smoothly. Neighbouring routine items differ by at most 15 points, and routine stays at 59 or below. Gap filling never pushes an exercise's top score above its original routine maximum (`routineUpperScore` where reviewed), and larger original counts are kept. (15, not 10, because scores carry about 4–8 points of noise each; see the [jump limit](#jump-limit-james-5-november-2026).)
6. Every worked example is followed by practice of the same type.
7. Routine practice for a type is varied, not near-copies.
8. Mathematical errors and within-booklet duplicates are found, but only in content not already checked. New questions are never duplicates of existing ones.
9. Confirmed errors are corrected automatically, after a blind solve agrees.
10. Bridges are scaffolded questions that gently raise difficulty, in the booklet's tone and notation. Cues, one-off hints and mid-exercise worked examples are not used as bridges.
11. Extension prompts guide students to a named insight.
12. Prerequisites that an exercise needs are proposed as retrieval items for the topic's opening review, never as new worked examples.
13. Theory sections are checked for watertight definitions and the theory style rules.
14. A challenge pass confirms the teaching judgements. Confirmed ones become Studio comments.

## Writing rules for new questions (James, 5 November 2026)

These apply to every generated question: backfill, bridges, extensions, prerequisite items, duplicate replacements, proposed worked examples and guided practice, and comment drafts. They go into the drafting contract word for word, and the blind-solve call checks them.

- **Bespoke to the gap.** Each question is written for its exercise and slot. Don't take questions from the question bank. Duplicates are matched at bank publication as usual.
- **Draw the diagram; don't describe it.** If the question depends on a figure, the draft includes the actual editable native diagram, with the givens marked on it (a circle with its radius marked 4 cm, not "a circle has radius 4 cm"). A prose description, a diagram specification or "draw a diagram" is not a deliverable. The exception is a task that assesses students drawing their own diagram. This applies the existing [diagram requirement](booklet-pedagogy-review.md#booklet-pedagogy-review) to generation.
- **Match the booklet's tone.** Copy the length and phrasing of the existing questions of the same type. Use the same command words ("Simplify", "Solve", "Find") and the same notation.
- **Don't state conditions the exercise already assumes.** Conditions belong in the theory, once. A question doesn't repeat them unless the condition is what the question is testing. For example, a logarithm question doesn't say the base is positive and not 1; an exercise on domain restrictions may.
- **One task per part.** No added caveats, "assume that…" clauses or notes unless the existing questions of that type use them.
- **Australian contexts and spelling.** Use metric units, dollars and local settings in word problems.
- **Use the taught method.** Questions and worked solutions use the method the booklet teaches for that type (for example labelled PSF for factorising), never a different one.
- **Complete questions.** Each draft includes both answers (short and worked), a skill classification, the per-part working-space estimate and diagram sizing under [diagram sizing](booklet-diagram-sizing.md), so it passes the existing checks without a second round.

A draft that describes a needed diagram in words, is noticeably longer than its neighbours, or states conditions the existing questions leave out is redrafted once, then dropped.

## Theory style rules (James, 5 November 2026)

These apply to teaching text: definitions, explanations, key ideas and worked-example narration.

- **Watertight definitions.** A definition says exactly what is included and excluded, with every condition the mathematics needs, stated once. Use no wording a student could read two ways. Example: "\(\log_a x = y\) means \(a^y = x\), where \(a > 0\), \(a \ne 1\) and \(x > 0\)." This is where conditions live, so the questions don't repeat them.
- **Concise.** Cut repeated narration, filler and sentences that only restate the one before.
- **Active voice where it reads better** ("Subtract 3 from both sides", not "3 is subtracted from both sides").
- **Keep the technical vocabulary.** Keep terms like *coefficient*, *vertex* and *reciprocal*, but explain them in plain words the first time, and keep everything else simple.
- **Bold key vocabulary and concepts** where they are defined or first introduced. Don't bold them again afterwards.
- **Australian English spelling** (for example *factorise*, *centre*, *colour*, *metre*).

Definition and wording rewrites become Studio comments with the exact replacement text. Spelling and bolding are applied automatically.

Precedence: for this audit, these rules widen the 22 October [theory-text principles](booklet-cross-session-rules.md#theory-text-source-fidelity-and-cognitive-load-22-october-2026-user-approved). Conciseness and style are now valid findings, not just preferences. The rest of those principles still hold: keep the source's taught method and essential steps and scaffolds, and record departures from the source in the correction log.

## Roles

| Role | Who | Does |
|---|---|---|
| Find | Script | stale blocks, counts, difficulty jumps, ordering, Challenge moves, duplicate candidates (existing and new), spelling (US-to-Australian word list) |
| Judge | Sonnet audit | question types, worked-example matches, near-copies, errors, duplicate verdicts, theory, proposal intents |
| Challenge | Sonnet, fresh | teaching judgements only |
| Draft | Sonnet | bespoke new questions, for slots and for confirmed proposals |
| Verify | Sonnet, blind | answers of new questions and claimed errors, writing rules, ratings of new and corrected questions |
| Decide | James, in Studio | comments only |

Every model role in this audit uses exactly `claude-sonnet-5-5` at medium effort (Decision 10). No fallback is implicit.

## Content fingerprints: what counts as changed

Each check is recorded against a **content fingerprint**: a hash of what a student reads and answers, and nothing else. A check is reused while the fingerprint is unchanged.

| Change | Fingerprint | Effect |
|---|---|---|
| Spacing, response space, columns, page breaks, flow pins, layout overrides | unchanged | nothing re-checked |
| Reordering questions (for pagination or difficulty) | unchanged | only the free script checks re-run (order, jumps) |
| Display numbers, stored labels, comments, classification, source references | unchanged | nothing re-checked |
| Bold or italic in text, whitespace outside maths | unchanged | nothing re-checked |
| Templated diagram (number line, fraction bar, grid…): size or proportions | unchanged | nothing re-checked |
| Templated diagram: values, ticks, labels, shading | changed | that block only |
| Free-form TikZ diagram: any code change, even moving a label | changed | that block only (raw TikZ can't tell presentation from mathematics) |
| Wording, maths, answers or worked solutions of a question | changed | that block only: its errors, type, rating and duplicate pairs |
| Teaching text | changed for that passage | that passage's theory check and the topic's worked-example matches; practice checks are not repeated |
| New, removed or rewritten worked example | changed | the topic's question-type map and worked-example matches |

The basis is the same normalised question content the existing rating hash uses (`reasoningTaskHash` in `scripts/booklet/reasoning-ratings.mjs`), extended to theory passages and with emphasis markup removed.

Existing records: ratings already use a content-only hash and are reused as they are. Stored question-type maps use `archetypeSourceHash`, which hashes the whole block, layout included, so any formatting change marks them stale. On first run, v2 recomputes content fingerprints from each map's reviewed snapshot where that file still exists, and reuses every block whose content is unchanged. Blocks whose snapshot has been pruned are re-mapped once.

**What v2 records after its own changes.** A check is recorded as current only against the content it actually ran on.
- Spelling and bolding fixes don't change the fingerprint, so every check stays current.
- A new question's rating, type and duplicate check all ran on its final text (Stage 6), so all are recorded.
- An applied correction changes the fingerprint. Stage 6 re-rates the corrected block and re-runs its duplicate check. Its type and error check are carried forward only when the correction changed the answer or worked solution and left the question wording alone; if the wording changed, they stay stale for the next run.

## Pipeline

One command: `node pedagogy/review.mjs audit-v2 --project ID [--topics a,b] [--dry-run]`. It writes a candidate and a report. A separate `--apply` makes the one save. The runner is pre-approved in project settings, so a booklet runs unattended from start to save.

Every model reply is validated against its schema and retried once if malformed; a second failure becomes a blocker for the items in that reply.

### Stage 0. Preflight (script, no model)

- Load the live project at its revision. Refuse if an import or feedback repair is in flight for the booklet.
- Compare content fingerprints with recorded checks: mark each block's rating, type, error check, duplicate check and theory check as current or stale.
- Find duplicate *candidates* across the whole booklet, using the existing duplicate-check normalisation. Only pairs involving a stale block go forward.
- Fix spelling with the word list (presentation-only, applied in the candidate).
- Collect unresolved Studio comments and earlier finding states. List the pending v1 pedagogy comments that v2 will replace, for withdrawal in Stage 7.
- `--dry-run` stops here and prints what would be re-checked, the prompt sizes and a provisional slot count per exercise (Stage 4 run on current types and ratings). A booklet with nothing stale and no gaps exits here at no model cost.

### Stage 1. Fill missing ratings (Sonnet medium, by comparison, only stale or missing)

Stale or missing ratings are filled by [rating by comparison](#rating-by-comparison-james-5-november-2026), in one batch per booklet. Derived scores of 60 or more are not applied (see that section).

### Stage 2. Moves and provisional order (script)

- Routine items rated 60 or above move to the end-of-booklet Challenge exercise, in score order. Exam-section questions never move. If the booklet has no Challenge exercise, one is created as the last end section (end sections run Mixed review → Exam questions → Challenge) the first time a question needs to move.
- Each exercise's routine questions are sorted by score under the [29 October ordering rules](booklet-exam-marks-and-order.md), using `polish/score-order.mjs`. Whole questions move; parts within a question keep their order (James commissions part reorders by hand). Dependent groups move together, using their highest part's score. Fixed in place: teaching and deliberate contrast activities already flagged, `keep` entries from earlier audits, and the [named progression exceptions](booklet-progression-exceptions-20261031.md) while their task hashes match. Pagination departures that have recorded page evidence are kept. Ratings are never adjusted to produce an order.
- **Teacher-protected blocks** (a dated teacher comment or authorised feedback repair, as `teacherBlocks` in `polish/guards.mjs` finds them) may be reordered and moved to Challenge. Their content is never changed automatically: corrections, spelling and bolding on them become comments.
- **Holds become comments.** Where `score-order.mjs` holds a segment (a `keepWithNext` pin or layout row the sort would split, an unresolved printed reference or dependency, an unverified rating, a whole-question pagination request against an explicit or protected layout), that segment is left in its current order and the hold is posted as one Studio comment on the exercise, naming the blocks, the hold kind and what would release it.
- This order is provisional: it is what Stage 3 sees. The final order is set in Stage 4, after Stage 3 has named any further sequences to keep.

### Stage 3. Topic audit (Sonnet medium, fresh `claude -p` calls)

Topics are packed into calls by size (about 60,000 tokens of topic material per call) instead of strictly one call per topic, so small booklets need only one or two calls. A topic too big for one call goes alone. Fully current topics are not sent.

**Prompt cap.** Every v2 call (audit, challenge, drafting, blind solve, rating) refuses a prompt over 280,000 characters before sending, and never truncates. A single topic over the cap is split by exercise, each part carrying the topic's teaching and worked examples; an exercise still over the cap is a blocker in the report. This mirrors the Codex worker's 300,000-character `PEDAGOGY_PROMPT_LIMIT` (`scripts/booklet/codex-transcription.mjs`), which doesn't apply to `claude -p`, and leaves headroom for the fixed contract.

Prompt order for caching (fixed working directory outside Git, no tools):

1. Fixed contract, finding schema, rating rubric, writing rules, theory style rules, comment-format and native-diagram rules.
2. Booklet style sheet: title, notation conventions and two or three representative teaching passages.
3. The packed topics: teaching, worked examples, routine practice in Stage 2's provisional order (with the pre-sort position of each item), Exam questions, stored types and ratings, duplicate candidate pairs, and the list of stale blocks and passages.

The call returns one JSON object, validated together:

- `archetypes`: types for stale blocks and Exam questions. Current entries are passed in as data and returned unchanged.
- `exampleMatches`: for each worked example, the practice items of its type that follow it, or `none`.
- `spread`: types whose routine items are near-copies, with the item IDs.
- `errors`: stale blocks only. Each names the wrong answer or step and the proposed correction.
- `duplicates`: a verdict on each candidate pair (`accidental` or `deliberate`, with reason). An accidental pair names which item to replace and the type and difficulty its replacement should have.
- `bridges`, `missing`, `prerequisites`, `extensions`: proposal *intents* under Aims 10–12 (where, what it should achieve, the type and target difficulty). The questions themselves are drafted in Stage 5c, after the challenge.
- `keep`: extensions, variation sequences and contrast activities that sorting and later repairs must not break up.
- `theory`: for each stale theory passage, `ok` or a complete replacement tagged `definition`, `wording` or `bold`.

### Stage 4. Final order and gap plan (script)

- Re-sort each exercise as in Stage 2, now also holding fixed the new `keep` entries and `deliberate` duplicate pairs. Printed question references are updated. Display numbers recompute from order; stored labels are untouched. Moves and reordering are automatic and listed in the report.
- Count independent routine items per type (Aim 4's rule, with synonymous types grouped) and flag types below 3. Exam questions are mapped but don't count.
- Jumps inside a named progression exception are not flagged.
- No slot targets a score above the exercise's original routine maximum.
- Walk each exercise in order and flag neighbouring scores more than 15 apart. Only applied scores count; an unverified derived score is treated as absent, and the walk skips over it. A flagged gap gets the fewest evenly spaced slots that bring every step to 15 or under, each targeting its share of the gap. A slot that would leave a step under 6 points is not added.
- **Slot windows (James, 6 November 2026).** A jump slot is filled by a question that lands strictly between its neighbours: the two questions either side of the gap, or, for one of several slots in a gap, the targets of the slots either side. Other slots (type count, worked-example practice, varied items) accept scores between the nearest applied scores below and above their target, and at least ±3. The earlier ±3 window around the target was narrower than the steps comparison scoring can produce: a placement between two references can only score a quarter, half or three quarters of the way, so in pilot 2 a correctly placed question failed two times in three. Comment-only status still follows the target (target + 3 reaching 60).
- A Challenge type, one whose every non-Exam question is in the Challenge exercise or rates 60 or above, has no minimum count (James, 6 November 2026). Challenge questions are meant to be unfamiliar.
- Add a slot after each worked example whose `exampleMatches` is `none`, of that example's type, at a difficulty just above the example.
- Merge these into one slot list per exercise. Each slot names a type and a target score range, so one new question can fill a count gap and a difficulty gap at once. Count slots are capped per exercise (`LIMITS.countSlotsPerExercise`, 3 since 8 November 2026); other slots are not.
- Near-copy (`spread`) findings add slots for varied items. Existing items are never deleted.
- A slot whose type is untaught isn't filled; it supports the `missing` proposal.
- A slot whose target range reaches 60 or more is marked **comment-only**: it is drafted and blind-solved as usual, but posted as a comment rather than inserted, since a derived score there isn't applied.

### Stage 5. Challenge and drafting

**5a. Challenge (Sonnet medium, one fresh call per booklet).**
- Inputs: teaching judgements only (accidental duplicates, spread, bridge, missing, prerequisite and extension intents, theory `definition` and `wording` proposals), each with the passages it cites. It never sees the audit call's rationale or the whole booklet.
- Errors aren't challenged here; the blind solve tests them directly. Counts, jumps, moves, spelling and bolding are not challenged.
- For a definition, the challenger tries to break it, looking for a case the wording wrongly includes or excludes. It also checks the proposed text keeps the source's method and essential steps.
- Verdicts: `confirmed`, `rejected` or `unchecked`. An unchecked finding goes back once with the topic it names; a second `unchecked` becomes a comment marked unverified, with no drafted question.
- **The challenge sees what a finding is for (7 November 2026, user-requested).** In batch 1 (Rounding Decimals, Equations 1A, Area 1, Differentiation with Logarithmic Functions) almost every unverified comment had the same cause: a bridge cited only the block before the gap, and a missing type only its teaching, never the question the finding was about, and the retry added teaching but no questions, so it could not succeed. Now the audit gives `neededBy` for bridges, missing types and extensions (ids resolved to their questions, unknown ids dropped); without it `challengeTargets` cites the next `LIMITS.challengeFollowing` (4) questions in the same exercise for a bridge or extension, or the topic's exercise questions of that type for a missing type. The retry carries the teaching and exercise questions of the judgement's topic, of the topic the checker named (from the `topics` list it is given) and of its exercise. An unverified comment now states the finding (the auditor's reason, which an empty checker comment used to hide) and the checker's reason for not settling it, not a stock line. A diagram-only part in a drafted question prints as "(with a diagram)", not "undefined".

A challenge prompt over the cap is halved (the judgements are independent) rather than refused.

**5b. Slot drafting (Sonnet medium, at most 5 requests per call), in parallel with 5a.**
- Draft bespoke questions for the Stage 4 slots, with the booklet style sheet, the type's worked example and its existing items, under the writing rules.
- Each slot request names its two neighbours (`placeBetween`), whose text is in the prompt: the question must be clearly harder than one and clearly easier than the other. The drafter is told that an independent rater checks this.
- **Two versions per slot (James, 6 November 2026).** Each slot is drafted twice: a `lower` version a little harder than the lower neighbour and an `upper` version a little easier than the upper one, as genuinely different questions. Both go through the blind solve and placement; every version that passes is inserted, and the final sort orders them. A version is redrafted only if the other version for its slot also failed, or if the other version passed but landed in the top third of the window (James, 6 November 2026): then the failed version is redrafted once to land between the bottom of the window and 6 points below the passed version, so the slot narrows its jump rather than only splitting it near the top. Reason: in the first run after the slot-window change, all three first drafts came out harder than their window. Slot drafting takes 6 requests (3 slots) per call.
- The 5-request limit (6 November 2026) keeps replies short: pilot 2's nine-request proposal reply ran to 38,000 output tokens and came back as broken JSON. The same limit applies to 5c and to redrafts.
- The slots come from the script, so this doesn't wait for the challenge.

**5c. Proposal drafting (Sonnet medium, at most 5 requests per call), after 5a.**
- Draft the questions for confirmed proposals only: bridges, prerequisite items, extension prompts, duplicate replacements, and the worked example and guided practice for `missing`. Same inputs and writing rules as 5b.
- A booklet with no confirmed proposals skips this call.

### Stage 6. Blind solve (Sonnet medium, one fresh call per booklet)

The call gets questions **with their answers removed**, works each one out from scratch, and a script compares its answers. It never sees a drafting or audit call, a claimed error or a proposed fix.

What goes in, and nothing else:
- every question drafted in 5b and 5c (including the practice in a proposed worked example; the worked example itself is solved as a question);
- every question or worked example the audit claims has an error. For a claimed step error in a worked example, it gets the steps before that step and works out the next one.

Questions whose answers are already confirmed (checked at import or in an earlier audit, with an unchanged fingerprint) are never solved again. Questions with no error claim are not solved at all.

Outcomes:
- New question: if the solved answer matches the drafted answer, the question is accepted. If not, it's redrafted once and solved once more, then dropped.
- The same one redraft is given when a slot question lands outside its window (the redraft is told where it was placed, why, and whether to make it more or less demanding) or repeats a question already in the booklet. The slot's neighbours are always on its rating ladder, so the rater can place it between exactly those questions.
- Claimed error: if the solved answer matches the proposed correction, the correction is applied. If it matches the booklet's existing answer, the claim is dropped. If it matches neither, it becomes a Studio comment marked "unresolved", with all three results.

The same call also checks the new questions against the writing rules, and rates new questions and applied corrections by comparison. Then the script:
- runs the Stage 0 duplicate check on every accepted new question against the booklet (including the other new questions) and drops any that match;
- drops slot questions that still miss their slot's window after the redraft, rather than forcing them;
- sends any new slot question that derives 60 or more to a comment, as for comment-only slots;
- Challenge moves always go through. The depletion guard was removed on 6 November 2026 (James): a routine type left below 3 items is a count gap like any other, and a Challenge type has no minimum;
- runs the Stage 4 order and gap checks once more on the final order. Gaps that remain are listed in the report; they are not refilled in this run.

### Stage 7. One save and one render

- `classify-change.mjs` sorts the candidate's changes and picks the checks and pages. Applied corrections count as mathematical changes.
- `render-check.mjs`: local checks, then one feedback-pages run on changed pages, including rendered new diagrams at final size. Budget: one render plus one repair render. Comment-only changes need no render.
- `scripts/booklet/publish-project.mjs` dry run, then `--apply`, with readback. In one save it:
  - applies moves, reordering, new slot questions, solved corrections, spelling and bolding;
  - posts confirmed teaching findings (with their verified drafts), comment-only and 60-plus drafts, and unresolved errors as Studio comments, one per finding, merged with any open comment on the same block and kind;
  - withdraws the replaced v1 pending comments (as `pedagogy/review.mjs withdraw` does), archiving their findings.
- Each applied correction records old and new text in the correction log.
- Provenance: one record under `booklets/provenance/pedagogy-review/`, with model, effort, usage and elapsed time per call, and the content fingerprints now checked, per check (see [what v2 records](#content-fingerprints-what-counts-as-changed)).

## Rating by comparison (James, 5 November 2026)

The spot checks (see [Appendix](#appendix-rating-evidence-5-november-2026)) showed that Sonnet orders questions much as Sol does (correlation 0.95), but its absolute scores run 6–15 points lower and stop short at the top. So Sonnet never supplies a number. It places each question among questions that Sol has already rated, and the score comes from where it lands. Every stored score stays on Sol's scale. The existing rubric (`mathsmap-cognitive-demand-v1`) defines demand.

**What Sonnet sees:**
- The rubric (cached).
- A reference ladder for the question: about 8–12 Sol-rated questions with their scores. They are taken from the same exercise first, then the same topic, and they always include the booklet's Challenge questions (if any) and the standing anchors at the top and bottom, so every question has something above and below it. A changed question never sees its own old score.

**What Sonnet returns** for each question:
- `easierThan` and `harderThan`: the two reference questions it sits between, or `equalTo` one reference;
- `closerTo`: which neighbour it is nearer, or `middle`;
- `difficultyReason`: the usual task-specific reason.

**How the score is made (script):**
- Between A and B: the midpoint of their scores, or a quarter of the way from the nearer one when `closerTo` is given. It is rounded to a whole number.
- Equal to A: A's score.
- Harder than the top reference (or easier than the bottom one): the reference's score plus or minus 5, capped to 0–100, and flagged in the report.
- If A and B are in the wrong order (Sonnet's lower reference has the higher Sol score), the call is retried once. If it is still inconsistent, it becomes a blocker and the question stays unrated.

**What is stored:** `assessment.method: "comparison-v1"`, the model and effort, both reference IDs with their scores at the time, `closerTo`, and the reason. That is enough to recompute the score, or to redo it if a reference's score changes later.

**Effects downstream:**
- Ordering: a new question's placement gives its position directly.
- Derived scores below 60 are stored and used like any other score.
- **Derived scores of 60 or more are not applied (James, 5 November 2026).** The leave-one-out test showed Sonnet runs about 11 points below Sol there and disagrees on which hard questions are harder. These go to Studio instead:
  - A new question that derives 60 or more isn't inserted. It is posted as a comment on its target exercise, with the full draft, the derived score, the two references it was placed between, and the reason.
  - A changed existing question keeps its current position and isn't moved to Challenge. It gets a comment with the derived score and placement; its stored rating stays unverified until James decides.
  - Moves of questions whose stored Sol score is current are unaffected and stay automatic.

**Leave-one-out result (5 November 2026, 20 questions).** Run folder: `compare-loo.mjs` and `results-loo.json`. There were 20 targets stratified across the score range (11 below 60, 9 at 60 or above). For each one, Sonnet 5.5 medium placed it, with its Sol score hidden, among the other spot-check questions from its booklet and the 16 standing anchors (a cached system prompt of 10,726 tokens). That was 20 calls averaging 13 s, with no failures and no inconsistent placements.

| Method, compared with Sol (October) | All 20: mean diff | Mean abs diff | Within 10 | Cross 65 | Sol < 60: mean diff | Sol ≥ 60: mean diff |
|---|---|---|---|---|---|---|
| Sonnet by comparison | −5.6 | 8.3 | 15 | 3 | **−1.1** | −11.1 |
| Sonnet absolute + anchors | −8.8 | 9.1 | 13 | 3 | −5.4 | −12.9 |
| Opus absolute + anchors | −7.0 | 7.3 | 14 | 2 | −4.7 | −9.7 |
| Sol re-run | −3.4 | 4.7 | 17 | 2 | −2.2 | −4.8 |

- Below 60, comparison removes Sonnet's offset. The mean difference drops to −1.1, and 10 of 11 land within 10 points, as good as Sol's own re-run. Most routine practice and backfill sits here.
- At 60 and above, comparison doesn't help much. Sonnet places hard questions below references that Sol rated lower. For example, it put the \(2^x+2^y=2^z\) proof (Sol 84) below a 64 anchor. This is a real disagreement about which question is harder, not just a different use of the scale, so no derivation can fix it.
- The booklet references were only the other spot-check questions from the same booklet (6 per booklet), not the whole exercise, which is thinner than v2's planned ladder.

**Check before rollout (waived by James, 6 November 2026, on the strength of the 20-question leave-one-out test above):** a leave-one-out test on all 63 spot-check questions, with the full planned ladder. Each question's Sol score is hidden, Sonnet places it among the others, and the derived score is compared with Sol's. Pass: most within about 10 points, no consistent shift below 60, and few crossing 65.

## Jump limit (James, 5 November 2026)

The limit for Aim 5 is 15 points, not 10. Sol differs from itself by about 4–5 points between runs, so the gap between two neighbours can be off by roughly 7–8 points; comparison-derived scores are noisier still (about 8 on average, about 5 below 60). At 10, many flagged jumps would be noise, and with no cap on slots each becomes an unneeded drafted, solved and rendered question. Above 15 a jump is unlikely to be noise, and real 15–20 steps are still caught. The 6-point floor stops near-duplicates being squeezed into small gaps. The dry run's slot counts on the first booklets confirm the setting before rollout.

## Learning from James's decisions

`status` already reconciles finding states from comments. v2 adds a running tally per finding kind (kept, deleted, edited) across booklets. A kind James mostly deletes gets its contract rule tightened, or stops being raised, at the next contract revision. Contract changes are recorded with the tally that prompted them.

## What James reviews

Only Studio comments: bridges, new teaching, prerequisite review items, extension prompts, duplicate replacements, theory definition and wording rewrites, unresolved errors, unverified (twice-unchecked) findings, ordering holds, content changes to teacher-protected blocks, comment-only slot drafts, and new or changed questions whose comparison score is 60 or more. Everything else is applied automatically and listed in the report.

### Automatic application of verified findings (8 November 2026)

- **What is applied by `--apply`.** Confirmed bridges, extensions, prerequisite review items and duplicate replacements, confirmed theory definition and wording rewrites, confirmed Key ideas boxes, and confirmed new teaching (a worked example with its guided practice; James, 8 November 2026). The audit marks these payloads `autoApply`. `--apply` runs the same placement code as `apply-comments` (`applyComments({auto:true})`) on the run's candidate, then does one rating call if needed, one render and one save. `--no-auto-apply` leaves them as proposals.
- **How new teaching is placed (8 November 2026).** A confirmed "missing" finding stores a `teaching` change: a `worked-example` block in the house shape, headed by the draft's `title`, followed by its guided practice. The guided practice is marked `guided-practice` and kept together on one page. Both go after the teaching block the finding names. They skip past that block's own guided practice, even when it opens the next section of the lesson, and always land before the lesson's Key ideas. The worked solution is blue (`#268cff`), text and maths, while the question stays black. Operations the draft colours red (`\color{#ef6068}`, applied to both sides) keep their colour, and the drafting contract asks for them. Working written only as maths `\text{}` rows becomes plain sentences (`textRows`). Every new multipart question gets the booklet's grid layout (`partLayout`): 4 columns for parts of up to 24 characters, 2 for up to 60, and a list for longer parts or parts with diagrams. The pilots' new review items had no layout and listed one-line parts down half a page. A draft whose worked example came back nested inside `content` is now unwrapped. Before this, Equations 1A j9 and j10 lost their worked examples that way.
- **What stays a proposal.** Unverified findings, content changes to teacher-protected blocks, comment-only and 60-plus drafts, unresolved errors, and question-wording errors (not blind-solved). The same applies to any change the placement code cannot make. That comment stays open and says "Not applied automatically: reason".
- **How theory rewrites are placed (8 November 2026).** The replacement is in the editor's source text, the form the audit saw (`theoryOnto`, `pedagogy/audit-v2-apply.mjs`).
  - When it has as many lines and cells as the block, each paragraph takes its own lines. This includes paragraphs in lists, scaffold layouts and table cells, so ids and layout are kept, and an unchanged paragraph is not touched.
  - Otherwise, a block of plain paragraphs and plain lists is rebuilt. Paragraphs may be added, merged or dropped, an unchanged paragraph is kept whole, and a changed one takes the formatting of the paragraph it replaces.
  - Colour, underline and links carry over when the styled text survives word for word, such as the orange "⚠ " of a caution note.
  - In a worked example or numbered key ideas, the audit names the part (`nodeId`). If it does not, the rewrite goes to the only part it fits, else to the part whose text is clearly closest.
  - A rewrite pinned to a block that lacks the text goes to a sibling text block in the same teaching box (same `sourceAtom.id`), if it fits there exactly. For example, Area 1 p22's rewrite was attached to the box's two diagrams. Formula cards and other non-text siblings are never used, so a definition sentence is never pushed into a quarter-width card.
  - These still stay comments: a table whose rows change, images, annotated equations, and styled text the rewrite changes.
  - The audit contract asks for the passage's own structure. In the Rounding Decimals and Equations 1A replays, 16 of 17 rewrites now place correctly. Before, 9 placed, and 3 of those went to the wrong place.
  - Bug fixed: before this, a cloze key-ideas group's rewrite went into the group's empty root prompt, which would have printed the sentence twice.
- **Comments.** An applied finding's comment stays open, headed "[Pedagogy audit v2 · Applied automatically · …]" with an "Applied:" line, and is flagged `autoApplied`. Each exercise also gets one "Applied automatically" summary of its new slot questions, Challenge moves, bolding and spelling. Each corrected block gets a comment with the old and new text. `apply-comments` never applies an `autoApplied` comment or an `applied` payload again. To undo one, James says so in chat; deleting the comment does not revert the change.
- **Earlier comments are superseded (James, 8 November 2026).** At each run, open v1 comments are withdrawn as before. An open v2 comment is withdrawn when this run re-checked what it is about:
  - a theory comment: its passage was stale;
  - an error comment: its question was stale;
  - a duplicate comment: its question was stale;
  - any other comment: its block is in a topic this run sent.

  "Applied automatically" comments stay open for review, and James's own comments (no audit kind) are never touched. Withdrawn comments are archived in `booklets/provenance/pedagogy-review/audit-v2/archive/ID-withdrawn-DATE.json`. A comment the run did not re-check stays, because nothing would replace it.
- **Booklets audited before 8 November.** `apply-comments --project ID --verified [--dry-run]` applies their verified findings by the same rule: a verified comment's insert, review item, theory rewrite or replacement, not on a teacher-protected block. It does one render and one save. Its comments stay open, marked "Applied automatically", and its proposals are marked applied. It was used on the three pilots (Rounding Decimals, Equations 1A, Area 1) on 8 November.
- **Bank-owned questions (James, 8 November 2026).** An applied change to a question that owns a bank entry syncs to the bank, as a Studio save does: `--apply` and `apply-comments` save with `allowBank`. Before this, the first live batch stopped at the save for Area 2 p20-q5 (duplicate replacement) and Angle Relationships 1 p9-q6 (answer correction).
- **Fixes from the first live batch (8 November 2026).**
  - A whole-question replacement gives each new diagram its predecessor's id when the counts match, so a saved arrangement still holds. When they differ, the block's stale arrangement is dropped. Area 2 p20-q5's render check failed on `missing-arrangement-ref`.
  - Several new teaching changes after the same block keep their order. A new Key ideas box is placed after them, at the end of the lesson. In Area 2, the box and two worked examples (j7, j8) all landed straight after p24's guided practice in reverse order, with the box first.
  - New teaching stops only at a Key ideas box that comes after the block it follows. In Angle Relationships 1, the p22 lesson opens with a rule box tagged `key-ideas`, and j13 was pulled to the start of the lesson.
  - A new worked example carries the draft's figure (`examples[0].questionDiagrams`). Before this, Area 2 j7–j9 and Angle Relationships 1 j9–j12 said "this sector" and so on with no figure.
  - In a lesson with no teaching block, new teaching goes before the first question that needs it (`before`). Its comment is on that question. In Angle Relationships 2, j4 (angle equations, `after: ""`) blocked the run with "no target for comment".
  - A whole-question replacement drops the old block's title. Area 2 p20-q5's new question still carried "2009 HSC Standard 2 Band 4".
  - A theory rewrite goes first to the block holding the node the audit names, if that is a sibling in the same teaching box. On a question block, a rewrite is applied only when it keeps at least half the words of one of the question's prompts. Otherwise it stays a comment ("may be meant for an answer or the box text").
    - Area 2 p10: a sector definition replaced the instruction "Identify the interior angle in these sectors", and the definition printed twice.
    - Area 2 p22: the Review heading replaced the question "Solve for r. Give an exact answer…".
    - Angle Relationships 2 p63: a guided practice's worked solution replaced its question and showed students the answer.
  - Steps sent as a bare `\begin{align*}` with no `$$` are set as maths. Angle Relationships 1 j13 printed raw LaTeX.
  - New teaching whose worked example has no figure, while its guided practice has figures, stays a comment. Angle Relationships 1 j13's drafter gave no figure.
  - **Render check.**
    - Layout issues the live booklet already has do not fail the audit's save. The same blocks of the live booklet are checked, and only new issues fail. In Computation with Integers 2, five short clozes on untouched questions failed the first try.
    - Blocks whose structural issue (such as an arrangement naming nodes that no longer exist) the live booklet already has are left out of the check (Data Analysis 3 p74-q5-block).
    - When the check fails only on pages holding audit-made blocks, those changes are taken out and the apply runs once more. Apply payloads stay comments ("Not applied automatically: it did not print cleanly"). The audit's own new questions are removed, with a note on the comment that lists them. All audit blocks on a failing page go, so a sound neighbour can go too: Data Analysis 3 lost slots 10 and 11 to slot 10's over-wide table. The check's printed issues number PDF pages; they are mapped to booklet pages through the PDF footers.
    - Overflow past the page (printed geometry) is compared with the live booklet as well, by kind and text. An overflow found on a page with no audit block is blamed on the audit blocks of the page before it, where it spilled from (Data Visualisation 1: column-graph slots too tall for the page).
    - A replaced part whose saved arrangement names document ids the block's content no longer has loses the arrangement (Data Visualisation 1 p4-q1-b). Only the content is checked; the correction record keeps the old prompt.
    - Page breaks are left out of the checked blocks, because they render nothing and failed as "unknown-block".
  - **Batch.**
    - Applies run one at a time, because an apply refuses to start while another page check runs.
    - A `.booklet-work/pedagogy-audit-v2/PAUSE` file stops new audits before any model call, and the batch records them as blocked "Paused". Runs already started, and `--apply`, finish normally. Remove the file and run the batch again with the paused booklets to resume.
  - **Replies.** A reply that closes each array element with an extra `}` is read with the stray braces dropped (Comparing Fractions' rating, twice).
  - **Maths that will not render.** Any maths in a new block that the booklet renderer cannot set (`renderMath`) leaves that change as a comment, and the rest applies. Data Analysis 2 j4's `\multicolumn` stem-and-leaf plot failed the whole page check.
  - **Figure colours.** Light xcolor tints in audit-made figures (`blue!25`) become the house fill of their hue (`houseTints`); strong colours are left for the palette check to report (Converting FDP j19).
  - **Tables.** Tab-separated rows whose first row is plain headings become a bordered table with a shaded bold header, wide enough for the heading words. Other tab rows stay borderless aligned working (Computation with Integers 2 j2).
  - **Worked-example working.**
    - Sentences mixed with maths rows in one aligned display become plain paragraphs between the maths runs, including rows with inline maths.
    - Row breaks with extra space (`\\[6pt]`) drop the spacing hint (Computation with Integers 2 j5 and j6; Angle Relationships 1 j11).
  - **Key ideas.** A blank written inside maths is lifted out of the maths. Computation with Integers 1 printed "−([a+b|0])".
  - Area 2, Angle Relationships 1 and Angle Relationships 2 were repaired after their save, with revision-checked saves: figures (from the accepted redraft), title, order, p10, p22, p63 and j13's working. The p22 and p63 comments were reopened as proposals.
  - The blind solve requires a placement only for new items. A corrected question may come back unplaced, and it then keeps its rating. Both Angle Relationships booklets were blocked when the solver followed the contract and placed only new items.
- **Repeat `--apply`.** The pre-apply candidate is kept as `candidate-before-auto.json`, and a repeated `--apply` starts from it.
- **Batch.** `node pedagogy/audit-v2-batch.mjs --stage4 [--parallel 3] [--dry-run] [--no-apply] [--projects a,b]`. Booklets run side by side; the worker limit applies per booklet. The driver skips booklets whose record already checked the live revision. It records every step in `.booklet-work/pedagogy-audit-v2/batch.jsonl` (or `batch-dry-run.jsonl`). A booklet with blockers is not applied. Start it, and `--apply` or `apply-comments`, from PowerShell. In Git Bash, `pdftotext` resolves to xpdf, which has no `-bbox`, so every page check fails and nothing is saved (8 November 2026).
- **Challenge prompts.** Each passage is printed once (`views`, `teaching`), and judgements cite it by id. Area 1's 62 judgements fell from 3.04 million characters across 16 calls to about 0.61 million. A reply that leaves judgements out is kept, and only the missing ones are sent again.

### Overhead cuts before the Stage 4 campaign (8 November 2026)

Measured on the pilot calls: 70 calls cost $33.92. The challenge cost $13.73 (before its deduplication), proposal drafting $6.03, slot drafting $5.67 and the audit $4.60. The CLI adds almost nothing per call: a 1,716-character prompt was billed about 1,800 tokens.

- **No prompt caching.** Audit prompts are used once. Claude Code writes them to the cache at twice the input price (measured: 4,425 tokens cost $0.0178 cached and $0.0089 uncached). The pilots wrote 6.2 million tokens to the cache and read back 0.45 million, about a third of their cost. `spawnClaude` sets `DISABLE_PROMPT_CACHING=1`.
- **Diagram summaries.** TikZ source was 21–42% of every audit packet (Volume: 386,000 of 922,000 characters).
  - The audit, challenge, ratings and solve references now see each diagram's description, mathematics and printed labels (`auditView`, `tikzLabels`), without its code.
  - Spec metadata (`sourceRegion`, `answerVisibility`, `sourcePage`) is dropped from those views.
  - Drafting views keep the code, because the drafter copies the booklet's diagram style. `studentView` keeps its default for `exam-batch.mjs`.
  - Across the 43 Stage 4 masters, audit input fell from 17.98 million to 9.79 million characters, and from 102 to 57 calls. The one over-cap Linear Relationships topic now fits.
- **Own changes recorded as checked.** Blocks produced by an apply were checked on the way in: blind solve and duplicate check for questions, challenge for teaching. Both `--apply` and `apply-comments` now record them (`appliedChecks`). `apply-comments` also moves `checkedRevision` forward when nothing else changed the booklet. Before this, a re-run resent every topic the audit had touched: 880,000 characters for Area 1. The pilots' audit-made blocks were recorded by hand on 8 November. Their re-runs now send 25,000 (Rounding Decimals), 42,000 (Equations 1A) and 234,000 (Area 1) characters, for edits made elsewhere and the Key ideas check.
- **Key ideas only.** A topic sent only for its Key ideas check carries its teaching, not its exercises.
- **Not changed:** two versions per slot (James, 6 November) keep slot drafting output-bound, at about 300 s and 17,000 output tokens per call.

### Key ideas in every conceptual lesson (8 November 2026)

James: every lesson should have a Key ideas section whenever it teaches something conceptual.

- **Find.** `keyIdeasLessons` lists each lesson (topic) that has teaching, review items aside, but no Key ideas box, identified by `pedagogyRole` or `sourceAtom.kind` `key-ideas`. The check is recorded per lesson as `checks['keyideas|TOPIC']`, against a fingerprint of the lesson's teaching. A lesson is judged again only when its teaching changes. The 8 November dry run found 127 such lessons across the 43 Stage 4 masters; 126 lessons already have a box.
- **Judge (audit task 9).** The audit packet includes these lessons even when nothing else in them is stale. For each one, the audit returns `needed` or `not-needed`. A needed lesson gets 2–4 numbered statements with `[[answer]]` blanks, in the style of up to two existing boxes from the booklet (`keyIdeasExamples`).
- **Challenge.** A judgement of kind `key-ideas` is checked against the lesson's teaching. It is confirmed only if the lesson is conceptual and every statement is accurate, in the lesson's own terms, and blanks a key word.
- **Place.** `keyIdeasBlock` builds the house shape used by 109 of the 141 existing Stage 4 boxes: a cloze list group with `scaffold` parts and blank widths from the house style. The paragraph settings are copied from the booklet's own boxes. The box carries `flow.keepTogether`, so a short box never splits across a page. It goes after the lesson's last teaching block. A confirmed box is applied automatically with a "Key ideas" comment for review; an unverified one stays a comment.

### Count rules: parts and synonyms (James, 8 November 2026)

James judged the first Stage 4 batch's count questions largely unnecessary. In Expanding Brackets Exercise 1, Q1 "Complete the table" has five tile-diagram rows, yet the audit added two more tile-diagram questions because Q1 counted as one item. The per-exercise cap also held back 344 count questions over 202 types in 14 booklets, much of it one skill under two type names.

- **Parts count (`practiceItemCount`, `pedagogy/audit-v2-plan.mjs`).** Each part a student answers on its own counts as one item, at most 3 per question. A part joins the item before it when it leans on an earlier one ("hence", "your answer", "part (a)", "from (b)"), or when it has no numbers, maths or figure of its own under a shared stem: the next step of one problem. Answer cells in the stem's table ("Complete the table") count as separate rows. A reviewed `practiceItems` grouping still wins.
- **Synonym groups (`labelTypeRoles`, contract `roleGroupContract`).** The `3b-roles` call now also groups types solved by the identical method. It sees every type in the booklet with its description and one question (two for short types), and labels roles only for short types that have none. It may group across topics (a lesson's type and its summary copy), and a group's items then count across the booklet. Groups name existing types, a type is in at most one, and unknown or overlapping entries are dropped. Every merge is listed in the report ("Types counted together") and in each exercise's "Practice counts" comment, which James can overrule ("Say if any of these should be counted apart"). If the call fails, the roles-only call runs and nothing is grouped (`typeGroupsFailed` in the report).
- **Cap and order.** `LIMITS.countSlotsPerExercise` is 3 (was 2). Count slots go round by round: each short type gets its first new question before any type gets a second, taught types first, then the fewest items.
- **Recount of the 8 November booklets** (`.booklet-work/pedagogy-audit-v2/recount-20261108.mjs`, no drafting; $0.96 in roles calls for 17 booklets, plus $0.73 for a first pass that allowed groups only within a topic and found few). Grouping found 6 merges: Converting FDP `decimal-to-fraction-simplify` + `decimal-to-simplified-fraction` and `percent-to-fraction` + `percent-to-simplified-fraction`; Angle Relationships 2 three parallel-line pairs; Equations 1A `identify-inverse-operation(s)`. With no cap, taught short types would want at most 3 count questions in most exercises (largest 5, in four exercises), which set the cap at 3.
- **Count questions removed** (`review-tools/remove-count-slots.mjs`, revision-checked saves with `allowBank`). 87 audit-added `type-count` questions whose type meets the minimum under the new count were removed from the 14 booklets and the three pilots. Expanding Brackets lost `v2-cf2349-p5-practice-slot-1` and `slot-2`. One was kept because removing it opened a 30→46 jump (Data Analysis 3 `v2-075f9-p90-practice-slot-14`). None owned a bank entry. Each exercise's "Applied automatically" summary marks the removed questions, and is resolved when every one it lists was removed. Ordering holds drop the ids, and a comment on a removed block moves to the next question. Every changed page was rendered and looked at. The only issue was two short clozes on Computation with Integers 2 p19, which were already in the booklet.

### Variation sequences (James, 8 November 2026)

A variation sequence is a planned short run, usually 3–5 steps, that starts from a routine question and changes one feature at a time to draw out a contrast the lesson needs. Example: expand $3(x+4)$, then $-3(x+4)$, then $3(x-4)$, then $-3(x-4)$. It is not a `spread` finding (near-copies), not a `keep` entry (an existing run) and not an extension (one insight). It mirrors extensions end to end:

- **Audit.** Task 6b returns `variations`: where the run goes (`after` a routine question), the feature `varied`, what is `fixed`, the `contrast`, the type, a target score and `neededBy`. A variation is proposed only where the booklet lacks the contrast, later questions need it, and no run of it already exists. The key is optional in the reply.
- **Challenge.** Confirmed only if each step changes exactly the named feature, the cited later questions need the contrast, and the booklet does not already teach or practise it.
- **Draft and check.** Drafted with `claude-sonnet-5-5` as one multipart question whose parts are the steps, laid out by `partLayout`. It is blind-solved (`matchesIntent` against the contrast) and rated by comparison.
- **Apply.** Inserted after the cited routine question, with a comment of kind `proposal-variation` ("Variation") and the usual "Applied automatically" marking. Recorded in `appliedChecks`. One rated 65 or more goes to Challenge, as an extension does. The report and `review-tools/summary.cjs` give per booklet how many were proposed, confirmed and applied.

### Count top-up (James, 8 November 2026)

`node pedagogy/review.mjs audit-v2 --project ID --top-up-counts`, or `audit-v2-batch.mjs --projects … --top-up-counts`, gives booklets audited before the [count rules](#count-rules-parts-and-synonyms-james-8-november-2026) the count questions the old limit of 2 per exercise held back. It also checks them once for variation sequences.

- It reuses the latest full audit's `audit.json` (types, roles, keep runs, deliberate duplicates) and does not redo the topic audit or its other findings.
- The roles-and-groups call runs again (grouping only).
- One variations-only call covers all topics (`variationContract`, `auditPackets(…,{variationsOnly:true})`), followed by the challenge of those findings only.
- `gapPlan(…,{countsOnly:true})` plans count slots only. Jumps, worked-example practice and spread were handled by the booklet's audit.
- Slot ids are prefixed `topup-`, so a new question never takes the id of a count question removed earlier.
- Drafting, blind solve, comparison rating, apply, render check and one save are as usual.
- Open "Practice counts" comments are superseded, because the top-up recounted.
- The batch driver runs a top-up once per booklet, whatever the audit record says (ledger rows marked `topUp`).

### Fixes from the 8 November review of the resumed batch

- **Worked examples solved from their own question and figure.** Worked examples drafted without a figure their question needs recurred: Data Visualisation 1-2 p25, then Introduction to Algebra p16 and j4 ("Draw a diagram to represent $3x+4$", applied with no drawing). The blind solve now gets each new worked example's question and figure, without the working, and returns `workedExampleSolvable` and `workedExampleMissing`. An example that refers to a figure, table or data it does not give is redrafted once, then left as a comment. So is a figureless example whose answer is a drawing (draw, sketch, construct, plot); one whose figure shows the finished drawing is fine. Introduction to Algebra j4 was taken out and its comment reopened ("Not applied automatically …"; `review-tools/repair-unapply-teaching.mjs`).
- **Key ideas blanks beside maths.** The step that lifts a blank out of maths matched from the closing `$` of one maths span to the opening `$` of the next. A blank between two maths spans printed as `[[substitute|0]]` (Linear Relationships 2, two boxes). Now only real maths segments are lifted. Repaired: `review-tools/repair-cloze-markup.mjs`.
- **Aligned working.** Row-spacing hints (`\\[2mm]`) are dropped from every aligned display, not only those rewritten. Numbered steps (`{\color{#ef6068}1.}\quad …&=…`) align after the number, not at "=". Right-aligning the left column staggered the numbers across the page (Formulas j4). Repaired with `review-tools/repair-rowspacing.mjs`: Angle Relationships 1 j14, Area 2 j10, Data Visualisation 1-2 j4 and Formulas j4.
- **Tab-row tables.**
  - Multiple-choice options (first cells A–F) stay a borderless list; option A had printed as a shaded header row.
  - Values laid out across, where every row starts with a word label and there are 3+ columns ("Week | 1 | 2 …" over "Savings | 40 | …"), are a bordered table with the label column shaded. The first row may be data ("Kiara | 12 | …"), so it is not shaded as a header.
  - Repaired: `review-tools/repair-tables.mjs`, in Data Visualisation 1 (3 questions) and Data Analysis 3 (1).
- **Grid columns.**
  - `partLayout` counts printed characters: 4 columns only up to 10, 3 up to 24 and 2 up to 60. The Expanding Brackets variation's parts ran into each other in 4 columns.
  - A sibling's layout was applied to a discarded copy of the content, so it never reached the block, though `layoutFrom` named the sibling. That was the long-failing test "a drafted question takes the layout of a same-type sibling". It is now applied, capped by the part-length rule.
  - Repaired: `review-tools/repair-columns.mjs`, Data Analysis 2 and Expanding Brackets.
- **Apply retry without auto-applied proposals.** The page check renders `candidate.json`, which was rewritten only when proposals were auto-applied. A retry that took out a block in a run with none checked the old candidate again (Data Visualisation 1 top-up). The pre-apply candidate is now always kept, and the candidate is always written before the render.

### Fixes from the 8 November evening run (Stage 4 batch 2 resumed)

Each has a test in `tests/pedagogy-audit-v2.test.js`, and a dry-run-first repair script in `.booklet-work/pedagogy-audit-v2/review-tools/` for booklets saved before the fix.
- **Check failures the live booklet already has.** The render check's live baseline compared only layout issues. Any other check failure the live booklet has, with the same edition, kind and message, is no longer the audit's (`baselineVerdict`). Examples are answer coverage and missing answer diagrams. A run that threw, or left editions incomplete, still fails. Operations with Decimals 3 failed because p79-q1's derived solution diagram never prints in the short edition, live and candidate alike.
- **Code is never respelt.** The Australian spelling pass changed `align=center` to `align=centre` inside an answer's inline TikZ figure (`[tikz] … \end{tikzpicture}` in a worked answer string). TikZ rejects that key, so the short edition stopped on "Mathematics failed to render" (Operations with Decimals 1 p100-q7). It did the same to Length 1 p27, saved earlier. `australianSpelling` now leaves inline TikZ and command names (`\color`) alone. Repair: `repair-tikz-spelling.mjs`.
- **Tables of values labelled by their variables.** Tab rows labelled `$x$` and `$y$` printed as bare rows, because the label rule wanted a word. They now get the bordered table with a shaded label column, as the booklets draw them. The labels must be distinct single variables, with no `=` in a value cell, so aligned working stays borderless. This affected Linear Relationships 1 (j9, j10, slots 12–14) and Linear Relationships 2 (j5, slot-3). Repair: `repair-tables.mjs`, which now covers worked examples as well as questions.
- **Stem-and-leaf plots under bold headings.** A `**Stem**` heading was read as a word heading, and the plot became a shaded grid (Data Analysis 2 j3). Markup is now read through.
- **A gridded question's own stem.** `partLayout` copies the root when it sets a grid, and the root prompt was converted after the copy. A stem table therefore stayed a plain string and printed as run-together rows (Linear Relationships 1 slot-11-lower Q8; also Data Analysis 2 j3). Prompts are now converted first. Repair: `repair-stem-prompts.mjs`.
- **Grids under rescaled axes.** With `x=0.43cm`, TikZ's default grid step stays 1 cm on the page, so grid lines fell every 2.3 units under ticks every unit. `gridSteps` gives such a grid `step=1`; `xstep`, `ystep` and `scale` are left alone. Figures are now normalised (`houseTints`, `gridSteps`) on every apply, not only when proposals were auto-applied. Linear Relationships 2 slot-3's grid also dropped its labels 2–7, from the tick loop `{-7,...,-1,1,...,7}`. It now takes page-64-q15's house grid (`repair-copy-diagram.mjs`). Repair: `repair-grid-steps.mjs`.
- **Table cells on one line in model views.** In editor source text, a cell's line break ends the table row. So a drafter copying a booklet table with two-line headings ("Red counter / chosen") produced broken rows, and Probability j9's results table printed in pieces. Views now print each cell on one line (`oneLineCells`), and the booklet itself is unchanged. Repaired by hand: `repair-split-table.mjs`.
- **Key ideas numbered once.** Drafted statements that began "1. " or "(b) " printed "1. 1. …" in the numbered box (Ratios 2, three boxes). `keyIdeasBlock` drops the drafted number. Repair: `repair-keyideas-numbers.mjs`.
- **Figures drawn too small for their labels.** Pythagoras j5's chord figures were a 36 mm circle carrying four labels. No code rule was added for this; they were enlarged 1.7 times with `repair-figure-scale.mjs`.
- **Replaced parts written like their siblings.** A duplicate replacement repeated the stem's command, so "Simplify $\frac{3n}{8n}$." and "Convert $22$ m/s to kilometres per hour." sat among bare siblings (Simplifying Expressions, Rates 1, Factorising Expressions). The command is dropped when all of these hold (`bareLikeSiblings`):
  - the stem gives the same command;
  - at least half the siblings are bare;
  - what remains is maths.

  Any stem tail it repeats goes too. Worded prompts ("Find the unknown value …") are left alone. Repair: `repair-bare-parts.mjs`, 6 parts in 3 booklets, synced to the bank.
- **Empty guided practice steps.** In Solve 2-Step Equations 2 (age and coin problems), guided practice that mirrors the example's numbered steps printed parts b, c and d as bare labels. `fillEmptySteps` gives each empty part the instruction of the example's matching step: its words before the first ":" or ".", and a "Check" step reads "Check your answer." A step with maths, "=" or the example's own numbers is replaced by "Write an equation." or "Solve the equation." The first try copied "Value of 20c coins plus value of 50c coins …" into a guided practice about 10c and 20c coins, which was set by hand to "Write an equation for the total value in cents." Repair: `repair-empty-steps.mjs`.
- **Theory rewrites moved to a sibling must resemble it.** A rewrite whose own block has no editable text went to the only sibling it fitted, and that sibling was the wrong block:
  - Volume p19: the formula display V = lwh was replaced, and the box printed its closing note twice;
  - Pythagoras p6: the box's two GeoGebra links were replaced.

  A sibling now takes a rewrite only when its own words (maths aside) share at least 30% of the rewrite's (`siblingRewriteFits`). Otherwise the rewrite stays a comment. Both blocks were restored from the run's pre-apply candidate, and their comments were reopened with the reason (`repair-unapply-theory.mjs --flag-block … --reason …`). A scan of every earlier run's sibling redirects found only these two.
- **After each booklet:** `review-tools/after-booklet.ps1 ID…` recounts, dry-runs the count removal and every repair scanner, and prints only what would change.

### Stage 4 campaign results (8 November 2026)

Every Stage 4 master on the campaign list is now audited and saved. Per-booklet results are in [the 8 November report](pedagogy-audit-v2-stage4-report-20261108.md): cost, changes applied, comments left and why, variations, top-up additions and removals, repairs, and issues for James.
- **Batch 2:** 20 booklets, $45.83.
- **Count top-up:** 14 booklets, $10.94.
- **Recount and removal:** 12 surplus count questions were removed after the recount.
- **Final state:** all 45 audited booklets rescan clean with the repair scanners, apart from two 3→2 column cases left by choice.

**Recount after a fresh top-up.** A fresh top-up's own questions are kept (`keep-topup-slots.mjs`). Its roles call and the recount's can group types differently, and removing what the top-up just planned is churn.

### Settling the Stage 4 comments (James, 8 November 2026)

James: resolve each comment whose change was made, otherwise apply it or delete it, leaving only comments that need his decision (2–3 per booklet at most). Results per booklet: [comments report](pedagogy-audit-v2-stage4-comments-20261108.md). Tools are in `.booklet-work/pedagogy-audit-v2/review-tools/`.
- **Applied automatically:** `triage-comments.mjs ID` checks each change is in the live booklet (inserted block ids, replacement text, listed slot questions or "Taken out before saving"), then the comment is resolved with "Checked".
- **Over-cap count drafts** ("New question to decide"): applied only where the type is taught in the booklet and has at most one practice item (James), else deleted (`newq-classify.mjs`). On 8 November all 132 failed the rule and were deleted: 126 were for types not taught in the booklet, and 6 types were no longer short.
- **Ordering holds:** `hold-causes.mjs ID` reruns the planner and names each hold's block and quote. One unresolved printed reference anywhere holds every exercise. An exercise held only by a reference elsewhere that does not point into it is sorted into the audit's difficulty order; a local cause (a reference in or naming the exercise, a linked run, a pin) keeps the teacher's order. An exercise already in order is resolved. Hold comments now name their cause ("Held by: … (outside this exercise)") and give plain release text.
- **Practice counts:** resolved, since the count decisions above settle them.
- **Proposals:** placeable ones through `apply-comments`; drafts that failed the page check repaired in their stored payload (`fix-proposals.mjs`: house TikZ colours, an escaped `%`, grid columns, figure widths, empty clozes, a blank inside maths shown as $\square$ with the blank beside it) and then applied; theory rewrites the placement code could not map applied by hand (`settle-20261108/ID.patch.mjs`).
- **Hand edits and sorts** go through `settle-comments.mjs ID DECISIONS [--apply]`: one revision-checked save that resolves, deletes (archived in `booklets/provenance/pedagogy-review/audit-v2/archive/ID-deleted-20261108.json`), patches and reorders, after a page check of the changed blocks against the live baseline.
- **A paragraph added to a box with a saved arrangement** must be listed in that arrangement too, or it does not print (Ratios 2 p29). `patch-lib.mjs` `addParagraphAfter` does both.
- **Left for James:** new teaching, bridges and variations with no usable draft (the drafter failed, usually for want of a figure). Writing them is new content for `claude-sonnet-5-5`.
- **Worked examples carry figures (James, 9 November 2026).** The 16 comments left for James failed for one shared reason. The drafter's worked-example shape had no figure slot, so an example either had no figure or asked students to draw with nothing drawn, and the blind solve rejected it.
  - `proposalContract` now takes `questionDiagrams` (the figure the example's question gives) and `solutionDiagrams` (the finished drawing when the answer is a drawing). A guided-practice part that asks for a drawing carries its drawing as the part's `solutionDiagrams`.
  - `teachingBlocks` prints the drawing with the working (`examples[0].solutionDiagrams`).
  - The solve sees the drawing as `solutionFigure`, and the contract now counts a drawing answer as solvable when the drawing is complete and correct.
  - An example with a figure keeps its working in `theorySolution`, as the house examples do, so the figure prints between the question and the working.
  - A finished drawing that completes the question figure is an overlay (`overlayOf`), with the same picture options and bounding box. The figure then prints once with the drawing on it. The first Data Analysis 2 draft printed the cumulative frequency graph twice, ran 35 mm past the footer and did not print.
  - A part's drawing goes in `answer.solutionDiagrams`, where the booklets keep it. `newBlock` moves one drafted on the part itself.
  - A TikZ diagram with no description or mathematics (a new draft's figure) keeps its code in summary views. Its labels alone dropped the plotted line, and the solve could not read Rates 2's drafted fuel graph.
  - The 16 comments were redrafted from their audit requests by `review-tools/redraft-figures-20261109/redraft.mjs`, then applied with `apply-comments`.
- **Hand edits written through a Bash heredoc lose one level of backslashes** in this environment (`\\circ` became `circ`, `\\therefore` a tab). Write patch files with the file tool.
- **Page-check limits found by hand edits:** a cloze's required width comes from its answer text (about 2.3 mm a character), so a long whole-word blank near a line end fails even with a narrow width set; table label cells must not wrap; step-number cells in `worked-rows` examples are 7 mm label columns, not empty steps (Pythagoras p26).

### Feedback on Polynomials 1A (James, 9 November 2026)

Each rule has a test in `tests/pedagogy-audit-v2.test.js`.
- **Challenge moves carry dependants, not prerequisites.** p14-q9 (monomial division, rated 37) went to Challenge because p14-q10 (rated 70) recorded `flow.dependsOn: p14-q9`, and a linked group moved whole. Now a question rated 65 or above moves with the questions that depend on it and those tied to it (continuation, pairing, `keepWithNext`), but never the questions it depends on. A prerequisite left behind still comes before Challenge (`goesWith`, `challengeMoves`). A scan of every audited booklet's runs found only this case; p14-q9 is back at the end of Exercise 2.
- **Guided practice.**
  - A guided practice with no parts prints without a part letter. Teaching boxes letter every response leaf unless it is labelled `""` with an unlabelled source response (`teachingLabels`); `unletterLoneGuided` sets both, as the house blocks have them. 57 audit-made guided practice blocks in 24 booklets printed a lone "a": 56 were repaired (`repair-lone-guided.mjs`, one revision-checked save per booklet) and Polynomials 1A j6 was removed (below).
  - New guided practice is drafted as one question with 2 to 4 parts that vary the example's features, so students meet a range of cases; one part only when the method has a single case. The 56 single-question blocks already saved were redrafted the same day (James): `review-tools/redraft-guided-20261109/redraft.mjs draft` (one `claude-sonnet-5-5` medium call per booklet, blind solve, one redraft) then `apply --save` (page check of the changed blocks in the student and worked editions, one revision-checked save per booklet). All 56 passed the solve first time, for $3.46 in total.
    - Each keeps its id, place and teaching atom, with parts named after the block (`-a`, `-b`, …). The old content is kept in `sourceReview.guidedRedraft.previousContent`, and an "Applied automatically · Guided practice redrafted" comment shows it.
    - Layout is at most two columns, as the booklets' own guided practice, and parts with figures sit two to a row. Polynomials 1A's four coefficient parts overflowed three columns, and its three graph parts ran 59 mm past the footer in a list.
    - Two parts were dropped because they alone overflowed the page (`--drop`): Area of Parallelograms and Triangles j14 d and Data Visualisation 1 j13 c.
    - A page-check failure the live booklet already has is not the redraft's (Operations with Decimals 3, p79-q1 answer coverage).
    - Review of all 56 (James asked): Data Visualisation 1's worked example j12 and its guided practice part b called a rounded measurement (time to the nearest minute, rainfall to the nearest millimetre) numerical discrete, against the booklet's p4 teaching; both now say numerical continuous (`fix-dv1-continuous.mjs`). James confirmed that times recorded as one of 30, 35, 40 or 45 s (v2-ion--p6-foundation-j4) are numerical discrete. Rounding Decimals j5's bracketed hints gave the answers away and were removed (James); part a became 0.40400400040000400000…, whose digits visibly never repeat (`redraft-rounding-a.mjs`, `save-rounding-a.mjs`). The proposal contract now forbids bracketed hints that state the answer.
    - `houseTints` now also maps tints mixed with white (`orange!20!white`, Volume j8 and its worked example).
- **The Challenge boundary is 65 or above** (p30-q10, rated exactly 65, had stayed in Exercise 4). `LIMITS.routineCeiling` is 64, so every "above the ceiling" test now includes 65; an extension or variation rated 65 still goes to Challenge. `review-tools/challenge-65-20261109.mjs` moved the 44 routine questions rated exactly 65 in 21 audited booklets, each with an "Applied automatically · Moved to Challenge" comment. `challenge-65-refs.mjs` first checked that no remaining question refers to a moved one.
- **Then 60 or above** (James, the same day: the first chilli is at 60). `LIMITS.routineCeiling` is 59; `review-tools/challenge-60-20261109.mjs` moves the 60–64 questions and returns exam questions found in a Challenge exercise to the Exam section.
  - `isExamQuestion` (`polish/end-section-role.mjs`) now also reads a course before "Sample" ("HSC Standard 2 Sample Question Band 4"). Ratios 2 p57-q12 had been read as routine and moved to Challenge at 65.
  - Applications of Calculus 3 p15-q9 ("2013 HSC Advanced Band 6") was also in Challenge and went back to the Exam section.
  - Booklets with a built candidate in the exam regroup run (`.booklet-work/exam-regroup-20261109`) were held until James paused that run, then moved: 21 questions rated 60–64 in 17 booklets in all. Their regroup candidates are now behind the live revision and must be rebuilt before that run saves them.
  - A booklet can have its own source Challenge topic as well as the audit's Challenge exercise (Ratios 2). The script looks for exam questions in every Challenge section, and inserts each one into the Exam section in difficulty order.
- **Challenge order and spacing (James, 9 November 2026).**
  - Every Challenge exercise is sorted by difficulty with the exercise rules (`sortChallengeSections`, run after the final order in every audit). It uses the audit's own plan: verified ratings, whole questions, dependants together, support edges, pins and keep runs.
  - An unresolved printed reference elsewhere in the booklet no longer holds Challenge. Only a hold naming one of its own questions does, and so does a Challenge question that a printed reference points to, since renumbering belongs to the planner. The report gives the Challenge order and its holds.
  - Challenge questions print with the Exam section's 10 mm gap (`examQuestionGapMm`, `src/lib/booklet-section-options.js`). It applies to any practice section with the Challenge role, in every booklet, not only Stage 4.
  - `review-tools/sort-challenge-20261109.mjs` sorted the Stage 4 masters' Challenge exercises: 15 booklets saved, 10 already in order, and 3 segments held by a hold on their own questions. Those were Area of Circles and Sectors (p34-q13 reference), Operations with Decimals 1 (p100-q7 unverified rating; p108-q37/38 pinned together) and Stage 4 Indices 1 (p95-q85 reference; p83-q41 unverified rating).
- **Holds resolved (James, 9 November 2026).** The order step had held Polynomials 1A and three Stage 4 Challenge sections. Each cause was fixed at its source, then the audit's order was applied (`review-tools/apply-order-20261109.mjs`): exercises, Exam and Challenge sorted, open hold comments resolved, and a page check of every reordered question.
  - **Own teaching rewrites.** The audit's own theory rewrites had cut questions off their reviewed type: a reworded teaching anchor failed the reviewed-method check. Teaching never moves and only covers, so in `orderCandidate` a teaching block counts as unchanged.
  - **Presentation edits.** Paragraph indent and line height, figure alignment, an empty `mathematicalModel` and an added `source` attribution no longer count as changes (`diagramEquivalent`).
  - **Confirmed types.** A question whose current audit type check matches its content keeps its reviewed support (`typeCheckedIds`).
  - **Printed references.** `polish/exercise-references.mjs` now resolves "the diagram/graph/figure below" for a question's only figure, on its stem or in an unlabelled group under it, and "the diagrams below" for several figures on the stem. A figure on a lettered part, an inline figure, or a singular noun for two figures stays held, as before. "For example 23832" is no longer read as Example 2. Wording fixed: Area of Circles p34-q13 ("the diagrams below") and an Exam question ("of the figure below").
  - **Pin.** Operations with Decimals 1 p108-q38 is recorded as depending on p108-q37, whose prompt shows its method, so the pinned pair sorts as one unit.
  - **Ratings.** Sol low rated the two reworded questions and Stage 4 Indices p83-q41; p100-q7 reused its recorded rating. `rate-studio-questions.mjs` needs `BOOKLET_CODEX_BIN` when `codex` is not on PATH. Audit-made Polynomials slot-12-lower and slot-14 were re-rated by Sonnet comparison (`rateChanged`, now exported).
- **Blue curves in worked examples (James, 9 November 2026).** A worked example's plotted curve uses `curveBlue` (#268CFF), with black axes, as the booklets' own examples do. The proposal contract says so, and `review-tools/blue-curves-20261109.mjs` recoloured the one audit-made example with a plotted curve (Polynomials j7); braces and containers drawn with `controls` are left alone. Polynomials j7's "−2" and its guided practice's "3" moved off the curve.
- **Later-lesson check of earlier audits** (`review-tools/taught-later-20261109.mjs`, $1.50 of `claude-sonnet-5-5` medium). All 112 audit-made worked examples in 42 booklets were checked; 5 were flagged and none held up on inspection, so nothing moved.
  - Comparing Fractions j13–j15: the later lesson has no teaching, so these examples are what its exercise relies on.
  - Area of Parallelograms and Triangles j14: base = 4 × height gives 4x² = 64, which the later linear "unknown sides" lesson does not teach.
  - Converting FDP j10: its own lesson's p20-q3 asks for 0.5% and 12.5% as a/b.
- **Methods a later lesson teaches.**
  - The audit no longer proposes new teaching (`missing`) for a method a later lesson of the booklet teaches. It returns a `relocate` finding instead: whole questions to move to that lesson's exercise, with the later lesson's teaching cited.
  - The challenge confirms a relocation only if each question needs what the later lesson teaches, its own lesson and the earlier ones do not, and it sits naturally in the later exercise.
  - A confirmed relocation is applied in the run before the final sort, with an "Applied automatically · Moved to a later lesson" comment. An unverified one stays a comment.
  - Slot drafting requests carry `laterLessons` (titles and teaching headings), and the drafter must not need what they teach.
  - Polynomials 1A had a touch-or-cross worked example added to the graphs lesson, and a new graph-matching question with double roots added to Exercise 3. The next lesson, Multiplicity of Roots, teaches both. The example and its guided practice were removed. Exercise 3 Q2 (part a has a double root) and the matching question moved to Exercise 4. The factorising Review item added for Q2 moved with it and replaced the multiplicity lesson's narrower one.

### Applying approved comments (James, 6 November 2026)

Comments are never applied until James has reviewed them. He reviews in Studio, deletes the ones he rejects and names the rest in chat ("all look good" means every open v2 comment). Then:

```
node pedagogy/review.mjs audit-v2 apply-comments --project ID --comments all|ID,ID [--dry-run]
```

- The audit stores each comment's change with it in `booklets/provenance/pedagogy-review/audit-v2/ID.proposals.json`, keyed by comment id: the full drafted block (both answers, skill, working space, its comparison rating), where it goes, theory replacement text, error corrections, held ratings and bold terms. Every approvable finding is drafted during the audit, including repeated parts and unverified findings, so applying makes no drafting call.
- Placement: prerequisite items join the opening Review box of the topic that needs them, which is created at the start of the topic if it does not exist; bridges and extensions go after the question they follow; an extension rated 65 or more goes to the Challenge exercise; duplicate replacements replace the repeated part only. Theory text is written onto the block's existing paragraphs and table cells, keeping ids, alignment and cell colours.
- A change to a block that has been edited since the audit is not applied. It stays open and is listed for a hand repair. New teaching was also left for a hand repair until 8 November 2026. It now has a stored `teaching` change. The pilots' 10 comments got theirs from their saved drafts, with headings from one Sonnet call, and were applied with `--verified`.
- Ratings: questions whose content changed, and inserted questions whose stored rating no longer matches, are rated by Sonnet comparison in one call. Audit content is never sent to the Codex Sol rater (`rate-studio-questions.mjs`).
- Then one page check of the changed blocks (student, short and worked), one revision-checked save, and each applied comment is resolved with what was done. Studio's Resolve button only marks a comment done; it applies nothing.
- `--dry-run` builds the candidate and report under `.booklet-work/pedagogy-audit-v2/ID/STAMP-apply-comments/` with no model call and no save. A replay of the pilot's 10 comments applied all 10, matching the hand repair, and passed the page check.

## Cost per booklet

- First run: about 5–7 calls: 1–2 audit, 1 challenge (plus 1 return for unchecked findings, if any), 1 slot drafting and 1 proposal drafting (only if proposals are confirmed), each one call per 5 requests, 1 blind solve, plus 1 rating batch only if ratings are missing. Redrafts and their second solve add one drafting and one solve call when any draft fails. Malformed replies and inconsistent placements are retried once.
- Booklets without gaps, confirmed proposals or errors skip drafting and the blind solve.
- Later runs: only topics with stale content are sent. A booklet with nothing stale costs no model calls.

## Doc updates needed when approved

- `docs/booklet-pedagogy-review.md`: the line "Do not plan around provider prompt caching" was measured on Codex; replace it for the Claude route.
- AGENTS.md: the 5 November rating line and the 30 October Models section were updated for Decision 10 on 5 November 2026, with a pointer to this plan.

## Decisions (James, 5 November 2026)

1. Exam questions are mapped but do not count toward the minimum of 3 per type.
2. No cap on new routine questions per exercise.
3. Confirmed error corrections are applied automatically after a blind solve agrees. Answers already confirmed are never solved again.
4. Ratings use Sonnet by comparison (see Rating by comparison), chosen after three rounds of absolute-score spot checks and Opus and Sol comparisons. There's no Codex or Opus exception. Derived scores of 60 or more become Studio comments and aren't applied.
5. New questions are bespoke to the gap (no question-bank reuse), draw real diagrams, match the booklet's concise tone, don't repeat conditions the exercise assumes, use Australian contexts and are complete.
6. Theory sections are checked for watertight definitions, concision, active voice, plain language around technical terms, bolded key vocabulary and Australian spelling. Definition and wording rewrites stay as Studio comments; spelling and bolding are applied automatically.
7. Blind solve, the role split, packed audit calls and content fingerprints are adopted. Superseded v1 comments are withdrawn, and keep/delete decisions feed back into the contract.
8. Reordering by difficulty is part of v2 and runs before gap filling.
9. The neighbour jump limit is 15 points, with evenly spaced slots and a 6-point floor (see [Jump limit](#jump-limit-james-5-november-2026)). This replaces the programme's 28 October maximum step of ten; the 31 October named progression exceptions stay fixed.
10. Models: the pedagogy audit uses `claude-sonnet-5-5` medium for every call (ratings by comparison, audit, challenge, drafting, blind solve). Outside the audit, review, rating and challenge calls during booklet imports use `gpt-6.1-sol` low. This supersedes the AGENTS.md 5 November rating line and the Terra High review rule for these two cases.
11. Multipart questions count as one practice item unless already grouped by reviewed `practiceItems`. v2 doesn't reorder parts; James commissions part reorders by hand.
12. The 31 October named progression exceptions stay fixed, and gap filling never raises an exercise's top routine score.
13. ~~Depletion guard: a Challenge move is undone if it would leave its exercise below the minimum without an accepted replacement.~~ Removed 6 November 2026 (James): Challenge questions are unique and unfamiliar, so few share a type. Moves always go through, and a type that only exists at Challenge level has no minimum.
14. Teacher-protected blocks may be reordered and moved; content changes to them become comments. Ordering holds are posted as comments.
15. Generated questions and solutions use the booklet's taught method.

## Appendix: rating evidence (5 November 2026)

The absolute-score spot checks that led to Decision 4. Run folder: `.booklet-work/rating-spot-check-20261105/`. The plan was a report-only re-rating of already-rated routine questions with Sonnet on the same rubric, with agreement meaning most items within about 10 points, no systematic shift and few crossings of 65.

**Round 1, no anchors: not passed.** 21 text-only questions (no diagrams or linked questions) from `concept-maths-adv11-ch01`, `enrichment-maths-1-part6-20261008` and `stage4-indices-v1`. Sonnet 5.5 medium was given Sol's exact stored prompt and inputs, in 3 calls of 18–31 s each, with no blockers.
- Ranking agrees well: correlation 0.90.
- Sonnet scores on average 12 points below Sol (mean absolute difference 14). Only 8 of 21 were within 10 points, and 10 of 21 were in the same band.
- The gap grows with difficulty. Every Sol score of 69 or more came out 15–32 points lower. 5 of 21 cross the 65 line, all from above to below.
- Sonnet's reasons often describe Challenge-band demand ("unsignposted proof", "ordered search") but still score in Mastery: it under-uses the top of the scale rather than misreading the questions.
- Sonnet used no thinking tokens at medium effort.

**Round 2, 11 anchors: much closer, top still compressed.** The system prompt held the rubric, a calibration paragraph (use the whole range; unsignposted decisive insight belongs in 80–100) and 11 Sol-rated anchors scored 6–94, from booklets not in either sample. Round 1 plus a fresh sample (`iceem-8-ch03-20261015`, `further-quadratic-equations-v1`, `iceem-7-ch10-20261015`): 6 calls, 12–22 s each, no blockers; the 8,133-token system prompt was cached after the first call.

| Measure | Round 1, no anchors | All 42, anchored |
|---|---|---|
| Correlation | 0.90 | 0.93 |
| Mean difference | −12.0 | −7.3 |
| Mean absolute difference | 14.2 | 9.4 |
| Within 10 points | 8 of 21 (38%) | 27 of 42 (64%) |
| Same band | 10 of 21 | 29 of 42 (69%) |
| Cross 65 | 5 of 21 (24%) | 3 of 42 (7%) |

Sonnet's scores stopped at 66 for questions Sol rated 84–90 (6 scored exactly 66). There were only 2 anchors above 74.

**Round 3, 16 anchors (5 more at 78–94): no further gain.** An 11,521-token cached system prompt. All earlier samples plus a top-weighted sample (`enrichment-maths-2-part7-20261009`, `enrichment-maths-1-part10-20261008`, `concept-maths-x11-ch04`): 9 calls of 10–23 s, no blockers.

| Measure | All 63 | Sol < 60 (39) | Sol ≥ 75 (13) |
|---|---|---|---|
| Correlation | 0.95 | 0.93 | 0.49 |
| Mean difference | −9.1 | −6.0 | −14.9 |
| Within 10 points | 40 (63%) | 28 (72%) | 6 (46%) |
| Cross 65 | 9 (14%) | 0 | 3 |

- On the 42 earlier questions, results were the same or slightly worse (mean −8.7, 6 crossing 65).
- The gap is systematic: re-rating the same 42 changed Sonnet's scores by only 2.5 points on average (at most 9).

**Opus 5.5 (one-off, James requested, outside the 3 November model rule).** Same 63 questions and 16-anchor prompt, `claude-opus-5-5` medium: 9 calls of 12–23 s. One malformed JSON reply was retried once and parsed.

| Questions Sol rated | Model | Correlation | Mean difference | Within 10 | Cross 65 |
|---|---|---|---|---|---|
| All 63 | Opus | 0.97 | −7.5 | 43 (68%) | 6 |
| | Sonnet | 0.95 | −9.1 | 40 (63%) | 9 |
| Below 60 (39) | Opus | 0.94 | −6.6 | 30 | 0 |
| | Sonnet | 0.93 | −6.0 | 28 | 0 |
| 60–74 (11) | Opus | 0.48 | −9.2 | 7 | 6 |
| | Sonnet | 0.47 | −13.3 | 6 | 6 |
| 75 or higher (13) | Opus | 0.69 | −8.7 | 6 | 0 |
| | Sonnet | 0.49 | −14.9 | 6 | 3 |

Opus keeps hard questions above 65 and orders them better, but still scores a near-constant 7–9 points below Sol; every crossing went from Sol's 68–74 to below 65. Opus and Sonnet agree with each other far more than with Sol (mean absolute difference 4.3, 58 of 63 within 10), so part of the gap may be Sol scoring high.

**Sol repeatability (James requested).** Same 63 questions re-rated with `gpt-6.1-sol` low through Codex (`runAstraTask`, explicit `reviewFallback` recorded), exact October prompt without anchors: 9 calls of 14–21 s. Each sent 25–40k input tokens, of which only Codex's own 12,416-token prefix was cached. `BOOKLET_CODEX_BIN` had to point at `codex.exe`.

| Comparison | Correlation | Mean difference | Mean absolute difference | Within 10 | Cross 65 |
|---|---|---|---|---|---|
| Sol (October) vs Sol (today) | 0.97 | −2.8 | 4.4 | 54 of 63 | 4 |
| Sol (October) vs Opus | 0.97 | −7.5 | 8.3 | 43 | 6 |
| Sol (October) vs Sonnet | 0.95 | −9.1 | 10.0 | 40 | 9 |
| Sol (today) vs Opus | 0.97 | −4.6 | 5.9 | 54 | 2 |

Sol varies by about 4 points between runs, half the gap to the Claude models, so that gap is real. But the 65 line is noisy for Sol too: 4 of the 11 questions Sol rated 60–74 in October crossed it (72→57, 73→60, 68→63, 68→64).

Conclusion: anchors can't bring Sonnet's absolute scores into line with Sol's, but Sonnet is self-consistent and agrees on order across the range, so comparison was chosen over absolute scores.

## Implementation notes (5 November 2026)

Commands:

```
node pedagogy/review.mjs audit-v2 --project ID [--topics a,b] [--dry-run]
node pedagogy/review.mjs audit-v2 --project ID --apply [--run DIR]
```

A run writes `before.json`, `candidate.json`, `audit.json`, `report.json`, `report.md` and every call's prompt and reply under `.booklet-work/pedagogy-audit-v2/ID/STAMP/`. The report records wall-clock time per stage and, per call, elapsed time, input, cache-write, cache-read and output tokens and cost; totals are summed. `--apply` repeats the revision and in-flight checks, renders the changed blocks once with `check-feedback-pages.mjs --blocks` (student, plus short and worked when answers changed), publishes through `publish-project.mjs` (dry run, then apply with readback and a ledger row in `.booklet-work/pedagogy-audit-v2/publications.jsonl`) and writes the provenance record `booklets/provenance/pedagogy-review/audit-v2/ID.json`. Withdrawn v1 comments are archived beside it.

Calls go through `claude -p --model claude-sonnet-5-5 --effort medium` with no tools, safe mode, no fallback model and a fixed working directory outside Git. The contract is the system prompt, so it is cached across calls. A reply from any other model is rejected. Calls take a slot in the booklet's three-worker limit when the booklet has a canonical run directory.

Where the implementation departs from, or fills in, the plan:

- `classify-change.mjs` and `render-check.mjs` do not exist. Stage 7 uses the lean local-repair checks: one `check-feedback-pages.mjs --blocks` run on the added, changed and moved blocks, then `publish-project.mjs`.
- Answer comparison: the script first compares normalised LaTeX. Pairs that differ go to one extra Sonnet call that sees only the two final answers per part, never the question, the draft or the claim, and says whether they are equivalent. LaTeX equivalence cannot be decided reliably by script.
- Error corrections are applied only to string fields (question prompts and short and worked answers). A claimed error in an editor-document field, such as a worked example's working, or in a question's wording, becomes a comment.
- Stored question types are reused when the map's reviewed snapshot (found by its SHA-256 in the map folder) has the same content fingerprint as the live block.
- Reviewed method support from a teaching block is treated as coverage, not as an ordering prerequisite, because teaching always precedes its exercise.
- A Challenge exercise created by the audit uses the existing convention: `topicId: "challenge"`, title "Challenge exercise", `workingSpace: "none"`, placed last.
- Spelling fixes on a rated question rebind its rating to the new task hash with `assessment.spellingReuse` (old hash, changes, fingerprint), since spelling is presentation-only.
- 6 November 2026: drafted questions keep their `dependsOn` links when their part ids are renamed (the apply replay found dependent parts pointing at the draft's old ids). Proposal block ids carry the run stamp, so a later run cannot collide with an earlier insertion.
- 6 November 2026, after pilot 2 (Similar Triangles): slot windows between neighbours, neighbours in the drafting request and on the rating ladder, one redraft for a placement miss or a repeat, diagram-aware part duplicates (a stem's diagrams and tables are part of what defines its parts; pilot 2 dropped two new questions because their part (a) shared the house wording "Identify why the two triangles are similar" with an existing question), at most 5 drafting requests per call, halving an over-cap challenge, Challenge types exempt from the minimum, and no depletion guard. Replaying pilot 2's drafts and placements through the new checks: slot-2 (42, window 24–44) and slot-3 (50, window 49–64, comment-only) are accepted; slot-1 (55, window 29–47) and slot-4 (39, window 23–32) get a redraft; none is a duplicate.
- 6 November 2026: a booklet with an unsettled printed question reference keeps its current order (the score-order plan holds every exercise and reference renumbering refuses to run), and the holds become comments. Before this guard, 49 of the 130 masters stopped in the rollout dry run with "Reference holds must be settled before applying".
- 6 November 2026, topic splitting: a topic over the 240,000-character packing size is split by exercise, and an exercise over it by question; every part carries the topic's teaching and worked examples, and is told it is a part. Only the first part answers for the teaching's stale theory and type checks; worked-example matches are merged across parts, and "missing" findings are kept once per type. The Exam and Challenge questions travel with the last topic when they fit, otherwise in their own chunks. A single question over the cap is still a blocker. Embedded base64 image data in a view is replaced by "[embedded image, N KB]", since the calls are text-only. With these, every one of the 130 masters' packets fits (the dry run had found three over the cap: 759,000, 617,000 and 321,000 characters).
- 6 November 2026: a new block whose id is already in the booklet gets a numeric suffix (a second run reuses slot names).
- **Diagram-only changes (James, 6 November 2026).** A change confined to free-form TikZ or SVG drawing code is not a change to the question: there is almost no reason to change a diagram in a way that significantly changes the question. Its rating is kept (rebound to the new task hash with `assessment.diagramReuse`, found through the rating's stored `diagramBlindHash` or by its task hash in this audit's run folders, the revision snapshots or the last commit), and its reviewed type and method support still count for ordering (`reviewedMethodSupport` takes an optional `equivalentContent`; the audit passes diagram-blind equality). The text a diagram prints (side lengths, angles, vertex names, from TikZ `node` labels or SVG `<text>`) is still content, so changing a printed value does count; coordinates, sizes, styling and comments do not. Templated diagrams keep their mathematical model as content. Every comparison rating now stores `diagramBlindHash`.
- **Ordering holds (6 November 2026).** Similar Triangles was never sorted: one held segment covered the whole exercise because of (1) p7-q6 and p7-q7, whose diagrams were edited after the 29 October type review, (2) p7-q5's reviewed support from p4-q1 part c, which the audit did not decide (it decided only teaching support), and (3) two ratings invalidated by diagram spacing fixes. (1) and (3) are covered by the diagram rule; for (2) the audit now treats support from an earlier practice question as a prerequisite, so the sort keeps it first and only a real conflict holds.
- **Drafted questions print like their siblings (7 November 2026, Stage 4 batch 1).** The drafter sees questions as editor source text (`toSource`: `_italic_`, `**bold**`, `[[answer|width]]` blanks, tables as tab-separated rows) and wrote that markup into plain string prompts, which printed it literally ("_2.718 …_") or ran blanks together. `newBlock` now turns a marked-up prompt into an editor document (`promptFromSource`: tab-separated rows become a borderless table, and every blank is at least the house handwriting width for its answer). Layout and columns are presentation that the drafter never sees, so six-part drafts printed as one column. A draft now takes the arrangement of a same-type sibling in its exercise, then of its slot neighbours (`layoutSibling`, recorded as `sourceReview.layoutFrom`). Both happen before the rating's task hash is taken.
- **A failed run never costs its successful calls again (James, 7 November 2026).** The first Area 1 run spent $12.18 and then failed at proposal drafting, with nothing reusable. Every accepted reply is now kept in `.booklet-work/pedagogy-audit-v2/ID/reply-cache/`, keyed by model, effort, system prompt and prompt. A later run of the same booklet that sends an identical request reuses the reply at no cost (logged as `NN-stage-reused`, with `reused.from` and `savedUsd`; the report header gives the count and the saving). Identical replies produce identical later prompts, so a re-run resumes where the last one failed. Calls from runs before the cache existed are matched by stage and exact prompt text when they are newer than the prompt contracts. Only replies that passed validation are reused, and a kept reply is re-validated before use. `--fresh-calls` turns reuse off. The prompt cap never ends a run (`splitByCap`). Every batched call (ratings, challenge, slot and proposal drafting, blind solve, answer comparison and the apply-comments rating) halves an over-cap batch; a split batch carries only the references its own items need. A single item that still does not fit is not sent and is set aside with a reason: a draft is not inserted, a claim or judgement becomes an unresolved or unverified comment, and a rating stays missing. An over-cap audit packet was already recorded as a blocker for its topics only. A run stopped by hand leaves its worker lease in the booklet's `workflow/worker-slots`: check the owner pid is gone, then remove that one file.
- **Count rule after Stage 4 batch 1 (James, 7 November 2026).** Batch 1 planned 124 type-count slots across three booklets. 90 were for types no worked example teaches, nearly all deliberate one-off questions the audit had typed on their own, and difficulty jumps were barely touched. The rule now:
  - **Core or enrichment.** After the audit, one small call (stage `3b-roles`, `roleContract`) labels each type that is short of the minimum: core (a method students must carry out on their own) or enrichment (a deliberate one-off: explain, critique, puzzle, investigation, insight). It labels core when in doubt, and an unlabelled type counts as core. Only core types have the minimum.
  - **Topic-wide counts.** A topic's exercises are tiers of the same skills, so a type's items count across them, and a short type is topped up in the tier holding the fewest of it.
  - **Merged names.** Names that differ only in plurals, stop words or token order are one type for counting (`typeKey`). Stored and audited types are never rewritten.
  - **Untaught core types.** One the booklet does not teach is drafted as a comment-only proposal (`teachingNeeded`), not inserted.
  - **One version.** Only difficulty-jump slots get two versions. Every other slot gets one, redrafted once if it fails.
  - **Soft cap.** At most `LIMITS.countSlotsPerExercise` (2) new count questions per exercise, taught types first. What the cap leaves out goes into `report.capped`.
  - **Summary comment.** One Studio comment per exercise (`type-gaps`) lists core types still short and the types exempted as enrichment, so nothing the rule leaves alone is silent.

  Replayed on the batch 1 runs (`roles-preview.mjs`), slots fall from 6 / 42 / 85 to 4 / 17 / 21 and drafts from 12 / 30 / 50 to 4 / 19 / 27, with 1 / 8 / 15 types labelled enrichment. James agreed the labels, and the earlier insertions were pruned to the rule the same day (`.booklet-work/pedagogy-audit-v2/prune-to-count-rule.mjs`; approved proposals and difficulty-jump pairs untouched): Rounding Decimals r90 (10 → 4), Equations 1A r469 (19 → 9), Area 1 r292 (30 → 12), Differentiation with Logarithmic Functions r19 (6 → 4). Similar Triangles holds only jump insertions and is unchanged.
- Not yet implemented: pagination-departure page evidence (Stage 2) and the keep/delete tally across booklets (learning from decisions).

### Worked-example working moved (James, 9 November 2026)

The 24 audit-made worked examples that had a figure and kept their working in the prompt (applied on 8 November, before the `theorySolution` fix) printed the figure after the working. Their working now sits in `theorySolution`, so the figure prints between the question and the working.
- **Scope:** every `v2-` worked example whose example has `questionDiagrams` and no `theorySolution`: 24 examples in 12 Stage 4 booklets (Angle Relationships 1 and 2, Area of Circles and Sectors, Area of Quadrilaterals, Comparing Fractions, Computation with Integers 1, Data Visualisation 1 and 1–2, Length 1 and 2, Pythagoras' Theorem, Volume). The 70 audit-made examples without a figure were left alone.
- **Split rule:** the question is the leading plain paragraphs; the working starts at the first block with a coloured inline or a list (`review-tools/move-working-20261109/patch.mjs`, run through `settle-comments.mjs`: one revision-checked save per booklet and a page check of the student, short and worked editions).
- **Result:** all 12 saved and passed the page check; a rescan finds no figure example with its working in the prompt. Rendered pages looked at for Angle Relationships 2, Length 2 and Volume.
- Run these tools from PowerShell, not Git Bash (wrong `pdftotext`).

### Working always in theorySolution ("Show theory solutions", 10 November 2026)

"Show theory solutions" hides only an example's solution fields, so the working of the 70 audit-made examples without a figure, kept in the prompt, still printed with the box unticked (Polynomials 1A j5).
- **Drafter:** `teachingBlocks` now always puts the working in `theorySolution`. Without a figure it also sets `solutionOwnStyle: true`, so the working keeps the formatting it had in the prompt (test in `tests/pedagogy-audit-v2.test.js`).
- **Existing booklets, imports included:** `.booklet-work/show-theory-solutions-20261110/move-working.mjs` moved the trailing working blocks of 317 examples in 89 booklets. Working means every inline is blue (`#268cff`) or red (`#ef6068`). The script renamed 180 saved-arrangement refs (`…/prompt#node` → `…/theorySolution#node`), then `mark-own-style.mjs` set `solutionOwnStyle`. Both made revision-checked saves. Sampled pages render identically with solutions shown, and page counts are unchanged.
- **Left for a hand decision** (`run-apply-main/report.json`, `skipped`): question and working on one line or in one table (72), question text after the working (51), plain-text prompts (11), definition panels (46), and working that would print below a figure without a saved arrangement (33).
- **Guard:** `structuralPreflight` reports `working-in-prompt` for the pattern that moves cleanly (`scripts/booklet/worked-example-working.mjs`).

### Stage 5 batch 2 fixes (10 November 2026)

- **Key ideas maths in `$…$`:** two replies wrote statements with bare maths ("For y = k·a^x + c"), which printed as plain text (Further Non-linear Relationships 1, five boxes; Circle Trigonometry 2, three). The prompt now asks for `$…$` with blanks outside the dollars (`$x=$ [[$b$]]`), and `validateAudit` rejects a reply whose key ideas carry bare maths (`bareMaths` in `audit-v2-prompts.mjs`: a letter beside a relation, a power, square, root or dot; units such as "km/h" do not count). Checked on all 744 statements audited so far: 15 flagged, all real. The 8 boxes were rebuilt with the same wording (`review-tools/repair-keyideas.mjs --items review-tools/keyideas-maths-20261110.json`).
- **Content rules before saving** (`pedagogy/audit-v2-rules.mjs`, called by the apply before its page check): every block the audit added or changed is checked against four rules, judging only nodes whose prompt differs from the live booklet. (1) No maths as plain text (`bareMaths`; money, units and TikZ lines excepted). (2) A part does not restate its stem: a line of the part shares 4+ consecutive words with the stem covering half its words, among siblings at least half of which are bare (an item or four words at most); "Hence …" excepted. (3) No label lost: a node's label emptied, or a one-part shell ("vv") losing its part; a whole question replaced by one new question is by design. (4) In a long lettered run (aa, ccc …) no new repeated label and no new numbered question. A breaking block is held back by `holdBack` (shared with the render retry): its change stays a comment with the reason, or its new question is taken out and noted on its comment; the apply then runs once more. A breaking block the audit did not make stops the apply with nothing saved. Each run writes `rules.json`. Checked on 153 saved runs: 29 flags, all real (every late find of 8–10 November, plus six still live: Linear Relationships 1 p14 Q2e, Compound Interest g "V₀ − S", Quartiles p14 Q4g, Surface Area p15 Q2b, Length 2 p56 Q5a, Rearrange Formulas p10 Q4b, a different formula under the stem's).
- **Restated stem, fifth shape:** a replaced part that repeats the stem's later lines word for word ("Sketch the circle $(x+3)^2+y^2=9$.\nLabel the coordinates … DESMOS." under "Sketch the following circles.\nLabel the coordinates …") drops those lines and keeps its item (`bareLikeSiblings`; Further Non-linear Relationships 1 Exercise 5 Q3a). A part that adds its own instruction is left alone.

### Stage 5 batch 3 fixes (10 November 2026)

- **Answer drawings on questions without parts:** Further Parabolas 1's new slot question ("Sketch $y=(3-x)(2x+4)$ …", no parts) carried its answer graph in `sharedSolutionDiagrams`, copied from the booklet's grouped questions. A shared drawing prints only on a question with parts, so the graph never printed and the short and worked answer checks failed. `answerFiguresOnLeaves` (`audit-v2.mjs`) moves a shared drawing on any question or part without parts into `answer.solutionDiagrams`, the exam figure pass's rule (`exam-figures.mjs`). `newBlock` calls it on every draft (a one-part draft collapsed into its question keeps the drawing), and the apply calls it on the audit's own `v2-` blocks and payloads, so runs drafted earlier re-apply with it and log "answer figures: N … moved". No saved booklet had the defect (all of `booklets/projects/` scanned).
- **Simultaneous Equations 2 saved with a failed page check, by design:** its baseline comparison found no new layout issue or check failure; every issue it printed (grey grid strokes on exam graphs) is in the live booklet too.
- **Blank table rows:** a new question copying a table question ("Determine the values of $a$, $b$ and $c$" with the equations in its table) left its rows unlabelled, so a bare "a b c …" printed under the table (Further Quadratic Equations Exercise 5 Q2, Q3). `tableRowsAsScaffold` gives parts with no prompt and no figure, under a prompt holding a table, the teacher's row shape: label `""`, `responseSpace:"scaffold"`, no answer space.
- **Angle labels without arcs:** new figures labelled angles with `\pic["$\theta$",…]` and no `draw`, so the label sat a centimetre into the triangle naming no angle (Non-right-angled Trigonometry 2 Exercise 3 Q3). `arcsOnAngleLabels` adds `draw` to every labelled `\pic` in the audit's figures, and the drafting format asks for it. Batches 1 and 2 have the same in Angle Relationships 2 and Circle Trigonometry 1 (labels close to the vertex, accepted on review); left for James.
- `answerFiguresOnLeaves`, `tableRowsAsScaffold` and `arcsOnAngleLabels` run in `newBlock` and again on the audit's own blocks when a run is re-applied (logged "answer shape: N fix(es)").
- **Replaced figure parts restating the stem:** "Find the equation of this line using an appropriate method." under "Find the equation of these lines …", beside parts that are figures alone (General and Point-Gradient Form p13-q2 d and f; Length 2 p56-q5 a). `bareLikeSiblings` takes `{figure}` and leaves such a part its figure alone when every word is the stem's (this/these and plurals read alike) and every sibling is bare or restates the stem the same way.
- **Slot pairs in score order:** a difficulty-jump slot's two versions were each inserted straight after the same anchor, so the upper version printed before the lower one. `afterInserted` places a new question after the new questions already put after its anchor with a score at or below its own. 76 saved pairs are upper-first, 58 of them harder-first, in 29 booklets (`.booklet-work/pedagogy-audit-v2/slot-order-20261110.json`); not reordered yet.

### Workflow changes before Stage 6 (10 November 2026)

From the Stage 5 cost review (`docs/pedagogy-audit-v2-stage5-report-20261110.md`). Stage 5 spent about $150 on 963 model calls; the time went mostly to finding defects after saving and to rendering the same pages again.

- **Figure findings recorded by the apply.** The page check's figure findings (`diagramVisualFindings`: a label on a line, past the figure's edge, or on another label) in figures the audit made or changed go into `render.json` as `figureFindings` (`figureFindings` in `audit-v2.mjs`). They do not fail the check, since teacher figures have them too. On batch 3 they named nearly every figure defect found by eye, plus two missed ones, one of them in the short answers, which the review did not show.
- **Review sheets start with the flags.** `review-tools/review-run.ps1` first tiles each flagged page from its own edition (`flag-sheets.mjs`). The run's pages are then split into figure and teaching pages (`focus-blocks.mjs`: the audit's blocks with a figure, and examples, key ideas, theory, guided practice), which are read in full, and text-only pages, which have passed the scanners and can be sampled.
- **Shape scanner in `after-booklet.ps1`.** `review-tools/scan-shapes.mjs` checks each booklet for slot pairs out of score order, angle labels without arcs, bare table rows, shared drawings on questions without parts, restated stems and the apply's content rules, using the audit's own helpers. Arcs are now added across the whole block, so worked-example figures are covered.
- **Split detector without the false alarms.** `split-text-loss.mjs` reports a split block only when parts are missing (a repeated heading alone is a box continued by design). Snippets are a prompt's opening text up to its first maths, searched in both layout and reading-order text. Batches 2 and 3: 23 flags before, 0 after (all 23 were false on inspection); a simulated lost page is still found when the lost parts have text.
- **Recount survives a settle.** `recount-20261108.mjs` stores a fingerprint of what it counts (`review-tools/count-shape.mjs`: each section's question blocks, parts and types). `remove-count-slots.mjs` accepts a recount whose fingerprint still matches, instead of demanding the same revision, which forced a second recount and roles call after every settle.
- **Settled booklets can be settled again.** `settle-20261108/applied-patches.json` records each settle patch by content hash once saved (backfilled for every patch applied so far). `build-decisions.mjs` leaves an applied patch out, so `settle-all.ps1` no longer re-runs old patches. A later repair is a new patch file.

The review tools live in `.booklet-work/pedagogy-audit-v2/review-tools/`, which git does not track.
