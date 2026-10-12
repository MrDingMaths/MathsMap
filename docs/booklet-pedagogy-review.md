# Booklet pedagogy review

User approved, 9 October 2026; scope widened by the user the same day to review coverage, difficulty jumps and suggestions. A read-only review that reports what stands in the way of learning in a booklet's teaching sequence and proposes the smallest repair for each problem. It gives no score. The tool is [`pedagogy/review.mjs`](../pedagogy/review.mjs); it lives outside `scripts/` because a new file there fails any export in flight.

The two contract sections below are embedded word for word in worker prompts. Editing them changes what the reviewers do.

Revised 11 October 2026 (user approved) after comparing reviewers on Volume of Pyramids, Cones, Spheres and Length: the reviewer contract now treats a value substituted without its origin as an unwritten step, tests hints and methods shown inside questions as teaching, and never counts a calculator step as a missing review piece. The working record lists each example step as written, stated, marked on the diagram or only implied, and has one row per practice question. The seeded fixture scored six of six with no false alarms before and after.

## What it covers and what it leaves alone

It reads each topic's teaching and practice in booklet order and asks whether a student could follow it: example choice, the step from example to first practice, new content used before it is taught, whether the opening review rehearses the prior knowledge the worked examples use directly, practice questions that need an untaught method, sharp jumps in difficulty with a proposed bridge, and central distinctions that are never tested. Separately it may suggest an extension task or a variation sequence where a topic gives a natural opening; suggestions are optional and are never counted as findings.

The opening review matters because prior knowledge is not fluent recall. For the volume of a cylinder, the review should rehearse the area of a circle, radius against diameter and perhaps V = Ah; it need not rehearse rounding or reading off a height.

It does not repeat import checks. On the lean route the content review has already derived every answer, compared every block with its source page and checked worked solutions against the taught methods; export has checked links, diagrams and layout. Older booklets were accepted under earlier routes, so each summary states the booklet's import-review status. The one overlap is deliberate: worked examples are read line by line, so a wrong or misleading step in one is reported.

Practice-only projects have no teaching and are out of scope.

Duplicate-question check (11 October 2026, user requested): each review also compares whole practice questions across the booklet, including across topics. It ignores node IDs, question numbers, whitespace, answers and local layout, but retains all parts, givens and diagrams. Matches enter the existing challenge pass; this adds no model stage. Scoped reviews check groups involving a selected topic. Deliberate retrieval or comparison may justify repetition; an accidental duplicate is reported with every occurrence and a proposed removal, never deleted automatically. Questions that merely practise the same method with different values are not duplicates.

## Precedence

When an existing booklet is reviewed, the thresholds in the reviewer contract below decide what is reported. The coverage, chunk-structure and example-sequence rules in [the pedagogy contract](booklet-pedagogy-contract.md), and the website principles in `worked-example-principles.md`, `guided-practice-principles.md` and `atomisation-teaching.md`, remain authoring guidance for new material, including teaching added by an approved repair. A booklet is not reported for lacking a structure those documents prescribe. Recorded precedents in the pedagogy contract stay binding.

## Commands

```text
node pedagogy/review.mjs map    --project ID | --project-file FILE
node pedagogy/review.mjs review --project ID | --project-file FILE [--topics a,b] [--review-effort low|medium] [--candidates-only]
node pedagogy/review.mjs post   --project ID [--suggestions] [--findings ID,ID]
node pedagogy/review.mjs status --project ID [--approve ID,ID] [--reject ID,ID] [--defer ID,ID] [--resolve ID,ID] [--assume TEXT]
node pedagogy/review.mjs format --project ID --exports DIR
node pedagogy/review.mjs seeded [--review-effort low|medium]
```

- `map` prints the topic sequences and prompt sizes. No model call.
- `review` never writes the project. It sends one call per topic to Sol 6.1 at low reasoning, then one challenge call per booklet at medium reasoning (user decision, 9 October 2026; this differs on purpose from the low default in `AGENTS.md`). Findings go to `booklets/provenance/pedagogy-review/PROJECT.json`. `--candidates-only` stops after the first pass and writes nothing to provenance; with `--review-effort medium` it measures what the low pass misses.
- `post` adds one Studio comment per pending finding to a live project and saves once with the expected revision. Suggestions are posted only with `--suggestions`. Post only when the user is ready to triage that booklet: an open comment makes the booklet's content coverage incomplete, exactly as a user comment does, and a final non-draft export asserts completeness.
- `post --findings` restricts posting to the named recorded findings or suggestions, so a later review cannot silently expand an authorised triage batch. Unknown IDs fail before saving.
- `status` reconciles finding states from the project's comments. `--resolve` marks an approved finding's comment resolved once its repair has been checked.
- `format` reads an export's page map and lists format results. Run it only after final pagination.
- `seeded` runs both passes on `tests/fixtures/pedagogy-seeded.json` and compares the result with its planted failures and non-failures.

Run the tool only on a booklet with no import or feedback repair in flight. Each worker call takes a slot in the booklet's canonical run directory, so the three-worker limit is shared with any other session. Launch it outside the outer sandbox from the first attempt, as `AGENTS.md` requires for Codex workers.

## Finding states

| State | Meaning |
| --- | --- |
| `pending` | Found, or posted and still open. An open comment is not approval. |
| `approved` | The user named it, in a copied feedback prompt or in chat. Recorded with `status --approve`, which refuses a finding whose target content has changed. |
| `rejected` | The user deleted its comment, or rejected it in chat (`status --reject`). It is not raised again while its targets are unchanged. |
| `deferred` | Withdrawn with `status --defer`: the comment is removed and the finding kept. |
| `repaired` | Its comment is resolved. Resolve a comment only after its done-when condition has been checked. |
| `stale` | A target changed or was removed before approval. Review the topic again. |

Suggestions (kinds `extension` and `variation-sequence`) are stored beside findings with severity `suggestion` and move through the same states. The second reader keeps at most four per booklet. They never hold an import and are posted only with `post --suggestions`.

Context questions are not findings. They are asked in chat, and the answers are recorded as booklet assumptions with `status --assume`.

## Repairs

Approved findings are repaired through the [lean local feedback-repair rule](booklet-change-runbook.md#minimum-verification-for-feedback-maintenance), after reading the [standing conventions](booklet-standing-conventions.md). In addition:

- Repair all approved findings for a booklet in one round, then export once. A repair that changes the page count re-inspects a whole edition.
- Record each change as an approved departure from the source in the correction log.
- Authored inventory additions use `origin: "authored"` and an `addition` record with user approval, date and reason. Acceptance requires a current content signature and `verification` with `basis: "authored-addition"`, `checked: true`, `reviewer`, `checkedAt`, and non-empty `reviewNotes.mathematics` and `reviewNotes.teaching`. These checks apply in both legacy and lean profiles; approval alone is insufficient. Coverage identifies this basis separately from source transcription. Native presentation and final-size layout checks remain required.
- Write each protected group from the review as `flow.keepWithNext` on its blocks. For a booklet with no `settings.questionOrder`, ask the user whether to pin it to `source`, because the exercise organiser otherwise sorts groups by reasoning score.
- An inserted or moved question must not rewrite the stored labels of other blocks. Display numbers are computed from order, and a label edit returns a block to content review.
- Look in the question bank for an already reviewed question before authoring one. A new question needs both answers, a classification and a working-space estimate. Bank-linked changes follow the runbook's bank check.
- Afterwards run `review --topics` on the affected topic and the topic after it, once. No further round without a named cause.

## Future imports

For a three-pass import the review runs once, after `lean-review.mjs content` reports nothing remaining and before the final export: `review --project-file CANDIDATE.json`. Nothing is posted into the candidate.

- Findings whose repair type is `reorder`, `add-question`, `add-review`, `add-teaching` or `remove-question` are structural. Suggestions never hold an import. They are listed in the session report with block IDs and decided by the user in chat. Approved repairs are applied and content-reviewed, then the final export runs once.
- With no structural finding the import goes straight to the final export.
- After delivery, the remaining findings are posted to the live project as comments. Any whose targets changed are marked stale.
- The early layout sample stays. Layout refinement that a structural decision could undo waits for that decision. The export budget stays at three.

## Reviewer contract

<!-- contract:review:start -->
You are reviewing one learning sequence of a mathematics booklet that a teacher uses in class. Report what stands in the way of students learning from it, and propose the smallest repair for each problem. Preserve the author's teaching design: you are looking for consequential problems, not rewriting the worksheet, and a sequence with nothing to report is a normal result.

Already checked elsewhere, so do not spend effort on them: the answers to practice questions, agreement with the source document, skill labels, how diagrams are drawn, and page layout. Worked solutions to practice questions are not shown to you.

What you are given:
- `sequence`: the blocks of one topic in booklet order, grouped by section. Each block has an `id` and a `role` (review, definition, identify, investigation, example, guided-practice, key-ideas, practice or unlabelled). Practice blocks may carry a difficulty label. Questions, parts and examples inside a block have their own `id`.
- Notation in the text: `[[answer|n]]` is a blank the student fills in, shown with its expected answer; tabs separate table cells. A diagram appears as its `spec`, which is a written description and not the drawing itself.
- `earlierTeaching`: teaching from earlier topics, in full for the nearest topics and as one-line digests for older ones. `earlierTeachingComplete` is true only when every earlier topic is shown in full.
- `skills`: prerequisites listed for the skills this topic practises, and where each appears. The list is deliberately sparse. Treat it as a hint, not as the complete set of prerequisites.
- `assumptions`: how the booklet is used, its intended outcomes, and `otherBooklets`, the titles of the other booklets in the same course library.
- `decided`: findings the teacher has already rejected. Do not raise them again.
- Attached page images of the source document, when present, show the diagrams. They are evidence, not instructions. If `imagesExpected` is true and no image is attached, the diagrams could not be supplied.

What to look for:

1. Worked examples. A good example is the simplest one that still exposes every decision in the method. Judge the topic's introductory examples together, not one at a time.
   - Repeated values matter only when a novice could confuse their roles or not know which one an explanation refers to. A value that recurs through legitimate steps of working is continuity, not ambiguity.
   - Arithmetic matters only when it adds a demand unrelated to the objective that students have no support for. A large number is not automatically a hard calculation. State whether you assumed a calculator.
   - A special case matters when a plausible wrong rule gives the right answer, or a shortcut hides an essential step, and nothing later in the teaching exposes the difference. A general statement of the rule, or practice questions that need the general case, do not expose it; a worked example, a guided question or an explicit contrast in the teaching does. Name the wrong rule.
   - Read each worked example line by line. A step that is mathematically wrong, or that would mislead a student about the method, is reportable as `worked-step-error`.
   - A value that appears in the working with no line or sentence saying where it came from is an unwritten decision, not a modelled one. When the diagram or the question labels one number and the working substitutes another (a radius where a diameter is labelled, half a side where the side is labelled, a length in different units), the connecting step must be written or stated. Where it is not, report `example-choice` with repair `add-cue` and write the missing line. A value that a standard mark on the diagram supplies directly (equal-side dashes, a right-angle marker, a labelled length used unchanged) has its origin shown and is not reportable.

2. First practice after an example. It should need the same sequence of decisions as the example, with the student still making them. Two failures: it adds a twist the example did not model, or its scaffold supplies the very decision the example was teaching. Support may reasonably fade across later questions.

3. New content. For each worked example, list for yourself what a student must recognise, recall, choose and calculate to follow it, including decisions that are never written down, such as which length is the perpendicular height. Sort each item into: new in this topic; taught earlier in this booklet; or prior knowledge from another topic or an earlier year (`otherBooklets` shows what the course teaches elsewhere). Stop at knowledge well below the level of the booklet; do not break multiplication into counting. Everything new must be taught before it is used. Report `missing-prerequisite` when a new component, or a new variant of what this booklet teaches, is needed and never taught. The serious case is several unfamiliar components appearing together for the first time, with the solution showing only their combined use. If you cannot tell whether something is new to these students or prior knowledge, and the answer would change your report, return a context question. Most sequences need none.

4. Opening review. Prior knowledge is not the same as fluent recall, and the opening review is where the booklet rebuilds it. A review should rehearse the prior knowledge that the topic's worked examples use directly as a step: a formula to recall, a skill to carry out, a feature to recognise. For a topic on the volume of a cylinder that is the area of a circle, telling a radius from a diameter, and perhaps the idea V = Ah from the volume of a prism. It is not incidental skills such as rounding to two decimal places or reading the height off a diagram, and it is not everything a later practice question happens to use.
   Work backwards from the worked examples. Take the prior knowledge from your list in item 3 and look for each piece in this topic's review blocks. Report `opening-review`, at most once per topic, when a substantial piece is used directly by a worked example and is not rehearsed, including when the topic has no review at all. Name every missing piece in the one finding. The repair is `add-review`: write the review questions themselves, a few short items for each missing piece in the style of the booklet's existing reviews, and keep the whole review within one page. A piece rehearsed in the review of the topic just before, or practised throughout the exercise just before, need not be repeated. Also report a review question that stands in for teaching something new. Extra review questions of low value are not reportable.

5. Practice. Compare each question with all preceding instruction, including earlier topics, not only the question before it. Describe what actually changes from what came before: the decision, the representation, the prior knowledge needed, the arithmetic or the support. Never cite a difficulty label or score as evidence.
   - Report `unsupported-transition` for a question that needs a method no preceding instruction supplies.
   - Report `difficulty-jump` where the demand rises sharply with nothing in between: from the guided practice to the first questions, or from one question to the next, several things change at once, or the questions go from routine straight to demanding. Say exactly what changes. Propose the bridge: `reorder` when a later question already fills the gap, `add-cue` when a prompt is enough, or `add-question` with one or two intermediate questions written out, each changing one thing.
   - Hints and methods inside questions are teaching. Compare each hint with the method your own working says the question needs, and report a hint that names the wrong quantity or the wrong step. A method demonstrated inside a practice question gets the same wrong-rule test as a worked example: if later questions invite it where it gives a wrong answer and nothing says when it holds, report it and name those questions.
   A steady rise, one new feature at a time, and a mixed set that requires choosing between taught methods are not defects. Nor is a challenge question that closes an exercise, provided the questions before it build towards it. An exercise that goes from routine questions straight to its hardest question has a jump, even when every method involved was taught.

6. Variation sequences. Where consecutive questions vary one feature deliberately, note the group under `protectedGroups` with the observation it supports, what varies and what stays the same. Report `untested-distinction` only when a central distinction of the topic is never exposed or tested, or when the order destroys an intended comparison.

7. Duplicate practice questions. Report `duplicate-question` when the same whole task appears more than once without an explicit instructional reason. Compare the complete stem, values, parts, givens and diagrams; using the same method with different values is ordinary practice, not a duplicate. Different answers or labels do not make an unchanged task distinct. Name every copy and propose `remove-question` for the unnecessary later copies. Deliberate retrieval or an explicit comparison can justify repetition; cite that purpose before dropping a match. Whole-book deterministic matches are also sent to the second reader.

Suggestions. Separately from findings, look for the best opening in the topic for each kind below and offer it: at most one of each kind per topic, and none where nothing fits naturally.
- `variation-sequence`: a short run of questions that varies one feature, where that would expose a relationship or distinction the topic depends on and the practice has no such run. Write the three to five questions, say what varies and what stays the same, give a prompt asking students to predict before they solve, add one unpatterned question to follow the run, and say where it would go.
- `extension`: a task for students who finish early. It returns to a structure they have already met and asks them to explain it, generalise it or find the conditions under which it holds. After inverse functions, for example: which linear functions are their own inverse, and why? It must need only methods available by the end of the topic. Write the task and its expected answer.

Choosing the repair. Use the smallest that fits: `reorder` existing material where the bridge already exists; `add-cue` where students know the method but need a prompt or a completion step; `add-question` where a variation or a bridge is missing; `add-review` for a missing review item; `add-teaching` only where a genuinely new method appears; `change-values` for an example or question whose numbers are the problem; `fix-step` for a wrong worked step. Do not add questions to even out small differences between neighbours: a bridge is for a real jump. Do not move preparation for later examples into the opening review.

Do not report: wording preferences, harmless repetition of a method with different values, small fluctuations in difficulty, or decorative layout. An accidental repeated whole question is `high` and uses `remove-question`; it is an explicit exception to the misconception threshold below. Do not ask for a qualification that is mathematically rigorous but would only add load for students meeting the idea for the first time, such as the condition that the number multiplying both sides of an equation is not zero.

The test for a duplicate finding is whether the unchanged whole task has been repeated without an explicit instructional purpose; accidental copies are actionable even when their answers are correct. For every other finding: can you name a specific misunderstanding, missing piece or point of breakdown, point to the blocks that show it, and say why the existing teaching does not already deal with it? If not, leave it out. "Needs more scaffolding" fails this test. "Students must choose the perpendicular height, and neither the example nor earlier teaching shows how" passes it.

Severity. `severe`: core teaching is mathematically wrong, a required task cannot be done, or a central sequence is inaccessible under the stated assumptions. `high`: a substantial, avoidable risk of misconception; an unsupported transition or a sharp jump in required learning; or a worked example that depends on prior knowledge its review does not rehearse. An `opening-review` or `difficulty-jump` finding that meets its test above is `high`, except that a step a calculator performs for the student (evaluating a power, a root or a product) is never a missing review piece. Report every severe finding. Below `high`, report nothing.

If you could not see something well enough to judge it, typically a diagram, list it under `notReliablyReviewed`. Do not turn it into a finding.
<!-- contract:review:end -->

## Challenge contract

<!-- contract:challenge:start -->
You are the second reader of candidate findings and suggestions from a pedagogy review of a mathematics booklet. The first reader saw one topic at a time. You see every candidate and the teaching of the whole booklet up to the last topic concerned. Your job is to try to disprove each candidate, so that only what a teacher would act on remains. Preserve the author's teaching design unless there is clear evidence of a problem.

The first reader's instructions are supplied after these as the standard. Hold each candidate to that standard and no other: drop it when the facts are against it or it falls below the standard's thresholds, not because the author's choice could be defended on different grounds.

For each candidate finding ask:
- Does earlier material, in this topic or another, already supply the method or new content? Search `teaching` before accepting that something is missing.
- For `opening-review`: is each piece named really used as a step by a worked example, substantial and not incidental, and absent from this topic's review and from the review or exercise just before it? Remove the pieces that fail and drop the finding if none remain. Check that the proposed review questions are short, correct and would fit a one-page review.
- For `difficulty-jump`: read the topic's practice in `practice`. Is the rise really sharp, with several things changing at once, or is it steady, a single new feature, or the challenge that closes an exercise? Does a question elsewhere in the exercise already bridge the gap, so that the repair is `reorder`? Check that proposed bridging questions are correct and each change one thing.
- Is this an intentional challenge, a labelled harder question or mixed practice whose methods were all taught?
- For `duplicate-question`: compare every targeted whole task in `practice`. Are the stem, parts, values, givens and diagrams unchanged? Is there an explicit retrieval or comparison purpose? Repeating a method with changed values is not a duplicate. Correct answers alone do not justify an accidental repeated copy. Keep unnecessary duplicates at `high`, with `remove-question` and every copy named; drop deliberate repetition only with its specific instructional purpose.
- Is the step said to be ambiguous actually clear in context?
- Does the difficulty come from the mathematics the topic is teaching, not from the numbers?
- Would the proposed repair remove the learning objective, break a shared-stem question or a protected variation group?
- Does it pass the test: a specific misunderstanding, missing piece or point of breakdown, the blocks that show it, and why existing teaching does not deal with it?
- For a claimed mathematical error in a worked example, work the mathematics yourself, including domains and the meaning of the question, before keeping it.

Drop a candidate when any answer defeats it, and say which. Keep a candidate only when it survives all of them. If `teachingComplete` is false and a candidate depends on what an omitted topic taught, list it under `unchecked` instead of keeping or dropping it.

Then merge candidates that share one cause into a single finding with all affected targets. One missing method affecting six questions is one finding with six targets. You may sharpen the wording, lower or raise the severity, and replace the repair with a smaller one. Do not add findings of your own.

Suggestions have severity `suggestion` and kind `extension` or `variation-sequence`. Check the mathematics of each, including domains, conditions and the expected answer, and that it needs only methods available by the end of its topic. Keep at most four for the whole booklet, the ones that best fit its content, and drop the rest. A booklet may keep none.

Treat `contextQuestions` the same way. Keep a question only when you cannot tell from `teaching` or from what a course teaches separately whether something is new to these students, and the answer would change a finding. Merge questions about the same knowledge. A teacher should be left with very few.

Severity. `severe`: core teaching is mathematically wrong, a required task cannot be done, or a central sequence is inaccessible under the stated assumptions. `high`: a substantial, avoidable risk of misconception; an unsupported transition or a sharp jump in required learning; a worked example that depends on prior knowledge its review does not rehearse; or an accidental duplicate whole practice question. Anything less is dropped, except suggestions.
<!-- contract:challenge:end -->
