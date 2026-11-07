# Pedagogy audit v2 (plan, 5 November 2026)

Status: plan with James's decisions recorded (5 November 2026). Implemented 5 November 2026 in `pedagogy/audit-v2.mjs`, `pedagogy/audit-v2-plan.mjs` and `pedagogy/audit-v2-prompts.mjs`; pilot status and the implementation notes are at the [end](#implementation-notes-5-november-2026).

**Scope: booklet masters only (James, 5 November 2026).** The audit is for booklet masters, the booklets listed in the programme ledger (`rows` of `.booklet-work/end-goal-20261028/coverage-status.json`). It is not for imports in progress, candidate pools, bank projects or other copies. The runner refuses a booklet that is not in the ledger; `--allow-non-master` overrides this only when James asks.

**Stage 4 masters are eligible (James, 7 November 2026).** The ledger lists only Stage 5 and Stage 6 booklets, but every Stage 4 master (`library.courseId: "s4"`, `library.category: "master"`, not archived) is also in scope. Until the runner reads that, run them with `--allow-non-master`.

It replaces the single-call topic audit (task 3 of the 3 November Claude workflow brief) and makes the archetypes, coverage-challenge, principles and review+challenge passes legacy. Their code and records stay.

## Aims

For each exercise in a booklet:

1. Routine questions rated above 65 move to the Challenge exercise. Exam questions stay in the Exam section. Dependent parts move together.
2. Routine questions are ordered by difficulty. Reordering comes first, because it's free; new questions fill only the gaps that remain.
3. Every question is mapped to a question type (archetype), including Exam questions.
4. Each type has at least 3 independent routine practice items. A multipart question counts as one item unless it already has a reviewed `practiceItems` grouping (30 October rule); v2 never creates groupings or reorders parts within a question. Exam questions don't count toward this. Gaps are filled with bespoke generated practice. A type that is genuinely untaught gets a proposed worked example and guided practice in the theory section.
5. Difficulty rises smoothly. Neighbouring routine items differ by at most 15 points, and routine stays under 65. Gap filling never pushes an exercise's top score above its original routine maximum (`routineUpperScore` where reviewed), and larger original counts are kept. (15, not 10, because scores carry about 4–8 points of noise each; see the [jump limit](#jump-limit-james-5-november-2026).)
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

- Routine items above 65 move to the end-of-booklet Challenge exercise, in score order. Exam-section questions never move. If the booklet has no Challenge exercise, one is created as the last end section (end sections run Mixed review → Exam questions → Challenge) the first time a question needs to move.
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
- Count independent routine items per type (Aim 4's rule) and flag types below 3. Exam questions are mapped but don't count.
- Jumps inside a named progression exception are not flagged.
- No slot targets a score above the exercise's original routine maximum.
- Walk each exercise in order and flag neighbouring scores more than 15 apart. Only applied scores count; an unverified derived score is treated as absent, and the walk skips over it. A flagged gap gets the fewest evenly spaced slots that bring every step to 15 or under, each targeting its share of the gap. A slot that would leave a step under 6 points is not added.
- **Slot windows (James, 6 November 2026).** A jump slot is filled by a question that lands strictly between its neighbours: the two questions either side of the gap, or, for one of several slots in a gap, the targets of the slots either side. Other slots (type count, worked-example practice, varied items) accept scores between the nearest applied scores below and above their target, and at least ±3. The earlier ±3 window around the target was narrower than the steps comparison scoring can produce: a placement between two references can only score a quarter, half or three quarters of the way, so in pilot 2 a correctly placed question failed two times in three. Comment-only status still follows the target (target + 3 reaching 60).
- A Challenge type, one whose every non-Exam question is in the Challenge exercise or rates above 65, has no minimum count (James, 6 November 2026). Challenge questions are meant to be unfamiliar.
- Add a slot after each worked example whose `exampleMatches` is `none`, of that example's type, at a difficulty just above the example.
- Merge these into one slot list per exercise. Each slot names a type and a target score range, so one new question can fill a count gap and a difficulty gap at once. There is no cap on slots.
- Near-copy (`spread`) findings add slots for varied items. Existing items are never deleted.
- A slot whose type is untaught isn't filled; it supports the `missing` proposal.
- A slot whose target range reaches 60 or more is marked **comment-only**: it is drafted and blind-solved as usual, but posted as a comment rather than inserted, since a derived score there isn't applied.

### Stage 5. Challenge and drafting

**5a. Challenge (Sonnet medium, one fresh call per booklet).**
- Inputs: teaching judgements only (accidental duplicates, spread, bridge, missing, prerequisite and extension intents, theory `definition` and `wording` proposals), each with the passages it cites. It never sees the audit call's rationale or the whole booklet.
- Errors aren't challenged here; the blind solve tests them directly. Counts, jumps, moves, spelling and bolding are not challenged.
- For a definition, the challenger tries to break it, looking for a case the wording wrongly includes or excludes. It also checks the proposed text keeps the source's method and essential steps.
- Verdicts: `confirmed`, `rejected` or `unchecked`. An unchecked finding goes back once with the topic it names; a second `unchecked` becomes a comment marked unverified, with no drafted question.

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

### Applying approved comments (James, 6 November 2026)

Comments are never applied until James has reviewed them. He reviews in Studio, deletes the ones he rejects and names the rest in chat ("all look good" means every open v2 comment). Then:

```
node pedagogy/review.mjs audit-v2 apply-comments --project ID --comments all|ID,ID [--dry-run]
```

- The audit stores each comment's change with it in `booklets/provenance/pedagogy-review/audit-v2/ID.proposals.json`, keyed by comment id: the full drafted block (both answers, skill, working space, its comparison rating), where it goes, theory replacement text, error corrections, held ratings and bold terms. Every approvable finding is drafted during the audit, including repeated parts and unverified findings, so applying makes no drafting call.
- Placement: prerequisite items join the opening Review box of the topic that needs them, which is created at the start of the topic if it does not exist; bridges and extensions go after the question they follow; an extension rated 65 or more goes to the Challenge exercise; duplicate replacements replace the repeated part only. Theory text is written onto the block's existing paragraphs and table cells, keeping ids, alignment and cell colours.
- A change to a block that has been edited since the audit is not applied; nor is new teaching (worked example and guided practice). These stay open and are listed for a hand repair.
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
