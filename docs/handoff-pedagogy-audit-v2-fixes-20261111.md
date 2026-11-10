# Handoff: pedagogy audit v2 fixes before Stage 6, and the Stage 4–5 retrofit (11 November 2026)

Written for a new session. It follows a review of the audit v2 workflow against the 76 Stage 5 runs. No code or booklet was changed by the review. Nothing here is started.

Read first: `AGENTS.md`, `docs/booklet-pedagogy-audit-v2.md` (the workflow, with "Workflow changes before Stage 6"), `docs/pedagogy-audit-v2-stage5-report-20261110.md`.

## Goal

1. Fix the audit so Stage 6 (89 unaudited masters) runs without the faults below.
2. Bring the 43 Stage 4 and 76 Stage 5 booklets already saved up to the same standard (James, 11 November: "We need to fix stage 4 and 5 as well").

Do part A, prove it on a pilot, then part B and the Stage 6 batch.

## What the review found

Figures are from the run folders in `.booklet-work/pedagogy-audit-v2/` and from replanning the live booklets. The scripts that produced them are in `.booklet-work/pedagogy-audit-v2/review-tools/review-20261111/` (read-only, no model calls):

- `hold-causes-by-stage.mjs s4|s5|s6`: held exercises and their causes.
- `stage5-costs-outcomes.cjs`: cost by stage, challenge verdicts, dropped drafts, comments, what the apply left.
- `open-comments-and-stage6-profile.mjs`, `saves-and-count-items.mjs`.

### 1. Exercises left unsorted (the main fault)

| | Booklets | Exercises with 2+ questions | Held | Held and out of score order | Routine questions in those |
| --- | --- | --- | --- | --- | --- |
| Stage 4 (audited) | 43 | 359 | 158 | 58 | 856 of 3,777 |
| Stage 5 (audited) | 76 | 463 | 253 | 161 | 1,918 of 5,091 |
| Stage 6 (not yet audited) | 89 | 403 | 269 | 157 | 2,065 of 6,051 |

Causes of the out-of-order holds:

| Cause | Stage 4 | Stage 5 | Stage 6 |
| --- | --- | --- | --- |
| Only a stale type-map link, a reference elsewhere in the booklet, or both | 4 | 94 | 119 |
| Something in the exercise itself, alone or with the above | 54 | 67 | 38 |

- **A reference anywhere holds the whole booklet.** `orderCandidate` (`pedagogy/audit-v2.mjs`) has `if(referenceResolution.holds.length)return {project:candidate,plan};`. Booklets affected: 8 in Stage 4, 24 in Stage 5, 34 in Stage 6. `sortChallengeSections` already applies holds per section; exercises do not.
- **Stale type-map links.** `reviewedMethodSupport` (`polish/score-order.mjs`, about lines 80–108) reads each question's `classification.archetypeReview.mapFile`. The "-2" booklets from the 6 November split point at the parent's map, so every question throws "review project differs" and gets `review-context-unverified`. Others throw "review snapshot absent" or "review snapshot hash not found in map directory". In Stage 5, 696 of the 710 questions held this way have a current type check in the audit's own record (`booklets/provenance/pedagogy-review/audit-v2/ID.json`, `checks[id].type`). Booklets affected: 0 in Stage 4, 17 in Stage 5, 22 in Stage 6.
- **`typeCheckedIds` reads the saved record**, which does not exist on a first run, so Stage 4 of the pipeline never counts the types the run has just returned.
- **Stage 4's local holds are not yet broken down.** Its 54 are mostly kinds other than references (`rating-unverified`, `noncontiguous-semantic-unit`, `unresolved-dependency`, `unresolved-method-anchor`, layout pins). Tally them by kind before deciding which are real.
- **The settle misreported the cause.** 169 of Stage 5's 284 hold comments were resolved as "teacher order kept, because a changed question has not had its type re-checked".
- **Knock-on.** 67 of 158 difficulty-jump slots in Stage 5 were planned in booklets with a reference hold, on an unsorted order. After the runs, 80 of 145 jumps over 15 and 297 of 670 count gaps remain, and nothing schedules a second pass.

### 2. Errors the audit did not raise

26 error claims in 76 booklets, 7 corrected. Three teacher-content defects were found by eye on changed pages, with no claim from the audit: Algebraic Fractions (algebraic denominators) p19 worked example gives 1/(10xy⁴) for 1/(10xy²); Simultaneous Equations 2 p15 Q18 prints its answer in the question; Simultaneous Equations 1 p36 parts c and e are the same. Worked examples are blind-solved only when the audit claims an error.

### 3. Answer editions not looked at

`review-tools/review-run.ps1` tiles only the student PDF. Worked solutions and answer figures of new questions are seen only when a figure finding flags them (one such defect was missed in batch 3).

### 4. Theory rewrites the apply cannot place

77 confirmed rewrites stayed comments in Stage 5: about 25 for a line or cell count that differs, 13 no editable text, 11 annotated equations, 10 a sibling that does not resemble the rewrite, 6 no matching prompt. They are 78 of the 135 audit comments still open on Stage 5.

### 5. Overhead after the save

- 280 saves for 76 booklets (median 3, most 7).
- 1,684 audit comments were posted and then resolved by the settle with no decision from James: 318 applied summaries, 228 practice counts, 284 ordering holds, the rest "Applied automatically". 86 settle saves.
- 37 count questions were drafted, solved, rendered and saved, then removed after the recount's second roles call (27 saves).
- Count slots are planned one per missing item (`gapPlan`, `need=LIMITS.minimumItems-k.items`): 530 slots for 439 short types. A new question with 2–3 parts counts as 2–3 items; the 315 live count questions supply 510 items.
- About 30 slot requests came back "blocked by drafter: type has no description, worked example or existing questions". 14 drafts were dropped for off-palette colours. 132 drafts were dropped for landing outside their slot window.

### Working as intended (leave alone)

Blind solve of new questions; the challenge (19–53% of bridges, extensions, relocations, prerequisites and near-copies rejected; it is 7% of cost); Key ideas (136 boxes applied); content rules and figure findings; the reply cache. Cost was $155 for 963 calls, about $2 and 12 minutes a booklet. Expect about $180 for Stage 6.

## Decisions

| | Decision | Status |
| --- | --- | --- |
| 1 | Fix Stage 4 and 5 as well as the workflow | **James, 11 November: yes** |
| 2 | When the 29 October map link is unusable, the audit's own type check, keep runs and dependency links are enough to sort an exercise | Recommended yes. **Ask James before A1b**; A1a does not depend on it |
| 3 | Applied changes are written already resolved, replacing the 8 November rule that they leave an open comment | Recommended yes (his later instruction that day was to leave only comments needing a decision). **Ask James before A3** |
| 4 | Keep variation sequences (4 applied from 38 proposals in Stage 5) | Recommended keep. No work either way |
| 5 | In part B, generate new content (jump and count questions) for Stage 4–5 exercises that are newly sorted | Recommended no: sort, report the remaining gaps, let James choose booklets for a top-up. **Ask James before B3** |

## Part A: fix the workflow

Each item gets a test in `tests/pedagogy-audit-v2.test.js`. Record the changes in `docs/booklet-pedagogy-audit-v2.md` under a new "Workflow changes before Stage 6 (11 November 2026)" section.

**A1. Sort every exercise that has no hold of its own.**
- a. In `orderCandidate`, apply reference holds per exercise: a reference holds only the exercise it sits in or points into. `sortChallengeSections` and `review-tools/hold-causes.mjs` (`local` rule) show the test. Printed-reference renumbering still refuses to run for a booklet with unresolved references, so a sorted exercise must not contain or be the target of one; check this explicitly.
- b. Where a map link is unusable (wrong project, snapshot absent or not found), a question with a current audit type check is not held. Pass the run's in-memory types to `orderCandidate` (`typeChecked`) at Stage 4 instead of relying on the saved record. Questions with neither stay held.
- c. `holdComments` names the real cause, including "type-map link belongs to another booklet".
- Check: rerun `hold-causes-by-stage.mjs`. Out-of-order held exercises should fall to about the local-cause rows above (67 in Stage 5, 38 in Stage 6). Look at the proposed order of ten exercises by hand, including a "-2" booklet, for a broken teaching sequence.

**A2. Report what is left.** Add jumps over 15 and count gaps still open to each booklet's `batch.jsonl` row (they are already in `report.remaining`).

**A3. Settle inside the apply** (`pedagogy/audit-v2-apply.mjs`, `applyAuditV2`).
- Applied summaries, practice counts and holds on exercises already in order go to the report, not Studio.
- "Applied automatically" comments are saved resolved once the readback confirms the change (`review-tools/triage-comments.mjs` has the checks).
- Run the count recount on the candidate before the save, with the run's own type groups and no second roles call (`recount-20261108.mjs`, `remove-count-slots.mjs` have the logic, including the "bridges a jump" exception).
- Check: a pilot booklet needs no settle save and no removal save.

**A4. Catch more errors.**
- Blind-solve every worked example and guided practice whose answer has not been solved before, not only those with an error claim. A mismatch follows the existing claimed-error path (correction where the field is a string, otherwise a comment). Estimated $10–20 across Stage 6.
- `review-run.ps1`: add the short and worked answer pages of the run's new questions and corrected blocks.

**A5. Fewer unplaceable theory rewrites.** In the audit packet mark each passage rewritable or comment-only (no editable text document, annotated equation, image text), and ask for the same number of lines and cells on rewritable ones. Check by replaying the 77 unplaced Stage 5 rewrites through `theoryOnto`.

**A6. Trim slot drafting** (`gapPlan`).
- One count slot per short type, asking for as many independent parts as the type is short (at most 3).
- No slot for a type with no description, worked example or existing question; list it in the report.
- Normalise off-palette colours (`houseTints`) instead of dropping the draft.

**Pilot.** Dry-run all 89 Stage 6 masters (free) and compare holds and slots with the figures above. Then run three: a "-2" split booklet, one with a reference hold, one Extension 1. Look at every changed page, answer editions included. Pass: no settle save, no post-save repair, exercises sorted except for local causes.

## Part B: Stage 4 and 5 booklets already saved

Start after the pilot passes. One revision-checked save per booklet, with a page check of every moved block against the live baseline. `review-tools/apply-order-20261110.mjs` is the template (it re-sorted exercises released from method-support holds).

**B1. Re-sort.** Replan each booklet with the fixed `orderCandidate`, using its latest run's `audit.json` for keep runs and deliberate duplicate pairs. Sort the released exercises; post one comment per booklet listing old and new order; correct the wording of resolved hold comments that named the wrong cause. Expect about 94 exercises in Stage 5 and few in Stage 4.
- Run `review-tools/scan-runs.mjs` afterwards: a reorder inside a continued lettered run moves its letters (Circle Geometry 1, 10 November).
- Check no remaining question refers to a moved one by number.

**B2. Stage 4's local holds.** Tally the 54 by kind. Release those that are bookkeeping (for example a rating left unverified by a presentation edit) at their source, as on 9 November ("Holds resolved"); leave real teaching sequences held.

**B3. Gaps after sorting.** Recompute jumps and count gaps on the sorted booklets and report them per booklet. Remove audit-made jump questions only if James asks. New content waits for decision 5.

**B4. Errors.** Run the A4 worked-example blind solve over all 119 booklets as a standalone pass (no other audit stage). Corrections and comments as in A4. Estimated $15–25.

**B5. Answer editions.** For each booklet, tile the short and worked pages of its audit-made questions (`review-run.ps1` after A4) and look at those with a solution figure in full.

**B6. Open theory comments.** Replay the 78 open Stage 5 theory comments, and Stage 4's, through the A5 placement. What still cannot be placed stays for James.

**B7. Surplus count questions.** Recount with parts counted. Report the surplus; remove only on James's word, since removal changes booklets he may have reviewed.

Report: `docs/pedagogy-audit-v2-retrofit-report-<date>.md`, per booklet: exercises re-sorted, holds left and why, gaps remaining, errors found, comments placed.

## Working rules that bit in Stage 5

- Shared checkout: check for running `lean-import.mjs`, `lean-review.mjs` and export processes before editing `pedagogy/`, `polish/` or `scripts/`, and before each batch of saves.
- Run applies, settles and page checks from PowerShell. In Git Bash `pdftotext` resolves to Xpdf and every page check fails.
- Studio must be running for page checks (`mathsmap-dev` launch configuration only; reuse it if it is up).
- Write patch files with the file tool, not a Bash heredoc (backslashes are halved).
- All model calls are `claude-sonnet-5-5` medium. Audit-made questions are rated by Sonnet comparison, never the Codex rater.
- `.booklet-work/pedagogy-audit-v2/PAUSE` stops new audits. Replies are cached per booklet, so a rerun costs nothing for calls already made.
- Look at the rendered pages before reporting a booklet as done.
- `npm run repo:check` before committing; commit with explicit paths; do not push.
