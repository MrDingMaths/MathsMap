# Exam completion: closure record, one proposal, guarded save (3 November 2026, user requested)

James asked for a completion-first Exam workflow after the 3 November investigation. It found that coverage closure had no tracked implementation and some closures reused historical exclusions. Superseding proposals piled up with out-of-date statuses, and saves stopped writing ledger rows. This page governs how a programme master's Exam section is declared complete. It changes no content, guard or verification cut.

## The current screen is the pool

Each master gets one closure record (`pedagogy/exam-closure.mjs`) built on the **current** source screen. At present that is the 29 October v2 rescreen, `.booklet-work/end-goal-20261028/phase4/external-read-campaign/source-rescreen-20261029-v2/masters/<projectId>.json`. The record has one row per pool question and carries the live revision and sha256 and the screen file and sha256. Rows the screen marks `excluded-provider` or `excluded-difficulty` start as `ineligible`, with basis `screen:<status>`. Every other row starts `pending`.

The current screen replaces reused historical exclusions. An earlier per-master ledger is imported by source id with an explicit mapping of its disposition strings. An unmapped string stays `pending` and is reported, and a class is never guessed. A prior decision about a row the current screen excludes is reported and does not override the screen.

```text
node pedagogy/exam-closure.mjs skeleton --project-id ID --out FILE
node pedagogy/exam-closure.mjs check --record FILE --project booklets/projects/ID.json [--candidate FILE]
```

## Classes

Every row has exactly one class.

| Class | Required fields | Meaning |
| --- | --- | --- |
| `ineligible` | `basis` | Screen exclusion, or a recorded scope ruling |
| `duplicate` | `duplicateOf` | The same question as a row or owner in the **same** booklet |
| `represented` | `representedBy`, `basis` | Its whole ask is covered by named Exam owners |
| `selected` | `ownerId` | It is an Exam owner |
| `faulty` | `fault` (quoted, specific), `action` (`fixed`/`parked`) | A concrete defect in the source; a flag or warning alone is never faulty |
| `cosmetic` | `issue` and the underlying `coverageClass` | Only a label or presentation is held. Never blocks; the coverage class still applies |
| `unused-eligible` | `basis` | Eligible and not yet covered. Blocks closure until a new owner or a ruling settles it |

## Closure criteria

`checkClosure` returns `{closed, blocking, nonBlocking, counts, coverage}`. A master closes when all of the following hold:

1. The record's rows are exactly this master's screen rows (same count and ids), and the screen sha256 matches.
2. No row is `pending` or `unused-eligible`, and every row has its required fields.
3. Every `selected.ownerId` and `represented.representedBy` id is a question in the checked project's Exam section.
4. `validateProgrammeExamSection` holds nothing for **new** owners. For existing owners, a label-only mismatch is listed as `cosmetic-label`, and other attribution holds are listed as `existing-owner-attribution`. Neither blocks.
5. The Exam section has `workingSpace: "none"`.
6. Every Exam owner's rating is bound to its current task (`verifiedRating`).
7. The record's `liveRevision` and `liveSha256` match the live project. A candidate must be built on that revision.

Cosmetic holds and practice-phase holds (phases 5 and 6, and rating bindings for ordinary practice) are reported as `nonBlocking` and never block Exam closure. James chose "Sample Question" as the canonical undated label on 3 November 2026: undated official samples print as `HSC <paper> Sample Question` (or `HSC Sample Question` with no paper). Other existing wordings remain cosmetic until normalised.

## One open proposal per master

`pedagogy/exam-proposals.mjs` keeps one JSON per master in `.booklet-work/end-goal-20261028/exam-proposals/`, holding at most one `open` proposal. Adding or replacing questions **amends** the open proposal: the old candidate moves into `history` and James still has one question for that master. Opening a second proposal is refused. `list --open` prints the queue for one approval decision. Sealed `*-unsent-*.json` files stay as history and are never rewritten. `importLegacy` may record "superseded by saved commit X" only when the live revision and owners prove that the content was saved.

## Saves and commits

Saves go through `pedagogy/exam-publish.mjs`, which calls `scripts/booklet/publish-project.mjs` with `--ledger .booklet-work/end-goal-20261028/publications.jsonl`, so every save writes a ledger row. It runs a dry run by default. `--apply` needs `--approved-by "<quote of James's chat approval>"` and a closed check on the candidate, and it records the quote in the proposal history. After the save it checks closure on the read-back file under a rebased record (`…closure.r<new>.json`) and marks the proposal `saved`.

```text
node pedagogy/exam-publish.mjs --project-id ID
node pedagogy/exam-publish.mjs --project-id ID --apply --approved-by "QUOTE"
```

Commits are taken from the **live** file. The wrapper prints the exact `git add` paths and the saved sha256 to compare first, and it never commits. Git HEAD is not a record of live content.

## Batch Exam completion (7 November 2026, user requested)

James asked for a faster, leaner Exam pass, starting with the 43 Stage 4 masters and then topping up Stage 5/6. `pedagogy/exam-batch.mjs` runs it for many booklets at once, in place of one hand-written script per booklet. Run state lives in `.booklet-work/exam-batch-20261107/<projectId>/`.

```text
node pedagogy/exam-batch.mjs run --all-s4 [--parallel 6] [--until select|rate|build]
node pedagogy/exam-batch.mjs run --projects ID,ID --mode topup
node pedagogy/exam-batch.mjs save --projects ID,ID --approved-by "QUOTE"
node pedagogy/exam-batch.mjs report
```

- **Up to two per archetype.** This replaces one. `selectExamCandidates` takes `mapping.perArchetype` (default 2). A top-up counts existing owners towards the two.
- **Pool.** For Stage 4 the pool is every MathsBase row classified under the booklet's `stage4` subtopics (`s4-subtopics.json`, read once into `s4-rows.json`). For a top-up it is the existing v2 screen. The batch writes its screen in the closure format, so `exam-closure.mjs` checks it unchanged.
- **Archetypes reused.** `archetype-index.json` lists the archetype recorded for every MathsBase id by earlier runs and live owners. The selection call is given these labels and keeps them.
- **One Sonnet call per booklet** (`claude-sonnet-5-5` medium, verified from the reply's model usage, with no separate ping). It classes every eligible row and adapts the chosen ones.
- **One rating call per booklet** (`gpt-6.1-terra` high until 8 November; `gpt-6.1-sol` low from 9 November, see below). It checks fidelity, solves each question, and rates difficulty on the cognitive-demand rubric against the booklet's own rated questions as anchors. A rejected adaptation is dropped: it is `represented` when its archetype has another owner, and deferred otherwise.
- **Deferred, not dropped.** Rows that need a source figure, and rejected adaptations without another owner, are classed `ineligible` with basis `scope:deferred-20261107` and listed for a later pass. School labels that are not yet approved stay `source-label-hold`.
- **Split pairs** run in sequence, so the second half never prints a source the first already uses.
- **Tables are bordered.** Tab-separated rows in an answer become a bordered `array` (`tabRowsToArray`); in a prompt they become a native bordered table with 1 mm padding and centred cells (`borderPromptTables`), since Exam prompt tables are source data. Saved booklets were repaired by `fix-answer-tables.mjs` and `fix-prompt-tables.mjs` in the run folder (presentation only; the Terra rating is rebound with the old task hash recorded).
- **Verification.** One scoped `check-feedback-pages.mjs --blocks <new owners> --editions student,worked` render per booklet, with the Exam pages looked at. There are no five-edition runs, baseline renders or hand-written inspection files.
- **Nothing to add still closes** (9 November 2026). A booklet with no eligible text-only rows, nothing selected or nothing accepted still gets a closure record on its live revision (`state.closureRecord`), with no candidate and no save. The figure pass reads that record, so these booklets' figure rows are no longer skipped.
- **Saves** go through `exam-publish.mjs` under James's blanket approval of 7 November 2026 ("Blanket approval": each booklet saves once its closure check, rating and render check pass). James reviews in Studio afterwards.

### Figure pass (7 November 2026, user requested)

James: "please redraw the source image. Implement your recommendation". `pedagogy/exam-figures.mjs` takes the rows the batch deferred because they need a figure, for the booklets whose Exam section is thin (fewer than 8 questions and at least 10 such rows; `node pedagogy/exam-figures.mjs thin` lists them). Run state lives in `.booklet-work/exam-figures-20261107/<projectId>/`.

```text
node pedagogy/exam-figures.mjs run  --projects ID,ID|thin [--until select|author|preview|rate|build]
node pedagogy/exam-figures.mjs save --projects ID,ID --approved-by "QUOTE"
```

- **Select** (Sonnet, text only): figures appear as placeholders or their TikZ. Existing Exam questions count towards the two per archetype, so only task types the booklet lacks get drawn.
- **Author** (`claude-sonnet-5-5` through `generateSonnetDraft`, source images attached): the native question plus every figure redrawn as TikZ under the import's diagram rules (`reconstructionPrompt('diagrams')` and the TikZ manual). Figures go in `questionDiagrams` / `solutionDiagrams` with a `spec` recording the source figure, its mathematics and what is deliberately not shown. Rows with an illegible, contradictory or non-mathematical figure, or a missing given, are held.
- **Preview**: every redraw is compiled through Studio (`scripts/shoot-tikz.mjs`). A redraw that does not compile goes to the fix loop with the compile error.
- **Rate** (source images and redraw PNGs attached): text fidelity, figure fidelity, legibility, answers and difficulty. House-style departures (decorative shading removed, labels moved, drawn to the stated measurements) are not grounds for rejection.
- **Fix** (8 November 2026, James: the checker fixes a rejected figure itself, up to 3 fix-and-recheck rounds, instead of rejecting it). A rejected item, or one whose redraw did not compile, goes to a fix call with its source, images, current adaptation and TikZ, the issues, `AUTHOR_INSTRUCTIONS`, `reconstructionPrompt('diagrams')` and the TikZ manual. The reply fixes every issue or holds the item when the defect is in the source. The fix goes through normalisation, compile and the label check (a failure there becomes the next fix's issues and makes no check call), then a fresh stateless check. A row stops after 3 fixes, or when a check repeats the previous check's issues. **This is an explicit exception, for this pass only, to the rule that new content comes only from `claude-sonnet-5-5`.** Sonnet still writes every first draft; an accepted fixed version records `sourceReview.generation.revisedBy: {model, effort, kind: 'exam-figure-fix', rounds, evidence}`.
- **Author retries.** A failed Sonnet author batch is retried once with one row per call; a row missing content or diagrams is retried alone once; busy worker slots wait 60 s and retry instead of holding the row.
- **Build and save**: as in the batch, with earlier decisions carried over into the closure record; figure rows not selected stay deferred.
- `Stealth` tips shorter than 2 mm are raised to 2 mm: shorter tips print with a stroke width outside the house-style roles, and the print QA reports them as unclassified graph strokes.
- **Solution figures** (10 November 2026). A leaf's solution figure goes in `answer.solutionDiagrams`, a group's in `sharedSolutionDiagrams`. Before this date the build put them on the node itself, where the question model drops them, so they never printed; `.booklet-work/exam-figures-20261107/solution-diagram-repair-20261109/repair.mjs` moved them for the 140 saved questions (64 booklets) with a scoped render each. In worked answers a solution figure wider than the 55 mm cap keeps its drawn width, and a graph gets at least 62 mm (both up to `MAX_FIGURE_MM`), through `settings.compactAnswers.diagramWidths`.
- **Page-review drops.** `<run>/drops.json` (`{"<MathsBase row id>": "reason"}`) holds an accepted row on the next build, for a duplicate found on the pages. A duplicate already saved is removed with `.booklet-work/exam-figures-20261107/dupfix-20261110/dupfix.mjs`, which records the closure row as `duplicate`.
- **TeX line breaks.** `\\[` followed by anything other than a length is written `\\{}[`, so a bracket after a line break is not read as row spacing.
- Each redraw is saved with the width it was drawn at, from the preview viewBox. Drawing scaffolds keep at least 78 mm (`spec.sizing.purpose: "drawing"`). Before the rating step, a mechanical label-collision check (`pedagogy/figure-label-check.mjs`) sends a collided redraw back to Sonnet once without a check call (it does not use a fix round). Status and resume steps for the paused run are in the [handoff](handoff-exam-figure-pass-20261107.md).

### Exam pass closed (10 November 2026)

James closed the exam pass on 10 November 2026 ("close out the exam pass"). Final commits: c0103f2f, e944881a and 1ebea077. All 210 live masters were checked against the live booklets:

- **Closure.** Every master's newest closure record closes, rebased to the live revision. That includes five masters that have no exam proposal; their batch records close (graph-regions, linear-equations-with-fractions, s6adv-sequences-and-series-1, simple-cubic-equations, volume-of-composite-solids). The orphan proposal for the removed `s6adv-working-with-functions-7-constructing-and-using-functions-v1` was dropped.
- **Ratings.** No Exam question lacks a verified rating.
- **Regroup.** No exam question is left in an exercise. The only exceptions are the three scaffolded rewrites listed in `exam-regroup-20261109/holds.json` (inequalities p20-q11, radians p19-q26 and p18-q23).
- **Figure pass.** Every booklet ended saved or in a finished state. The second sweep is done.

The checks are in `.booklet-work/exam-figures-20261107/tools-20261109/`:
- `closure-all.mjs` covers every live master (`closure-survey.mjs` only reads masters that have a proposal);
- `exam-audit.mjs` checks closure, ratings, regroup and figure state;
- `deferred-why.mjs` explains the deferred rows.

**Deferred by design, not part of this pass.** About 2,370 figure rows still carry a `deferred-20261107` basis in the closure records, which closure accepts:
- about 1,100 are already printed, either in that master or in another master that shares the subtopic (the record was not rewritten);
- about 950 were decided by the 4 November pass, mostly as represented;
- about 50 failed the checker after three fix rounds, or were held for source defects;
- about 280 are figure or image questions left for a later redraw pass. About 100 of these are printed elsewhere; about 160 could not be checked against the local MathsBase snapshots.

A later redraw pass starts from those rows. It is a new task, not a reopening of this one.

**Page review.** Every save after 19:00 on 10 November was page-reviewed, as were the hold moves and the figure fixes. The 27 figure-pass saves made on 10 November between 07:37 and 13:24 were reviewed by that session, and only spot-checked afterwards.

### Sol 6.1 low for every exam-pass Codex call (9 November 2026, user requested)

James: "Instead of terra 6.1 high, all codex calls should use sol 6.1 low." From 9 November the batch rating, the figure check and the figure fix all run on `gpt-6.1-sol` low, passed explicitly as a recorded review fallback (`examPassConfiguration()` in `exam-batch.mjs`), never as an automatic fallback. This supersedes the AGENTS.md models row "Exam questions: checks and difficulty ratings" for this pass only; other reviews keep their settings. Check replies Terra gave before 9 November stay cached and keep Terra as their recorded rater.

### Exam questions out of exercises (9 November 2026, user requested)

James: "Stage 4 booklets still have exam questions in the exercises, I want them moved to the exam section", with the top-up booklets, to finish the exam pass for every master. `scripts/booklet/regroup-exam-sections.mjs` now covers Stage 4 masters as well. NAPLAN-titled questions stay in practice. A question that is already an Exam owner (the same MathsBase id or the same prompt text) is held, never doubled. The run folder `.booklet-work/exam-regroup-20261109/` holds `apply.mjs` (`plan`, `build`, `save`) and `render.ps1`. Build orders the Exam section by verified difficulty, keeping logical units together. Render covers the moved questions and their former neighbours. Save publishes through `publish-project.mjs` with the ledger, refusing a live booklet changed since the build. Ratings move with the questions unchanged.

**Gap between Exam questions.** Every booklet prints a 10 mm gap between consecutive questions in an Exam section, but not above the first question on a page (`EXAM_QUESTION_GAP_MM`, `src/lib/booklet-section-options.js`). Pagination measures the rendered page, so it counts the gap too. No project data changes.

## Per new master (11 November 2026, user approved)

A booklet imported after 10 November, when the campaign above closed, runs this pass once. It runs after import and before the audit (see [import pipeline v2](booklet-import-pipeline-v2.md#hand-off-to-the-exam-pass)), and import changes none of its content. For one project, with the same tools and guards as above:

```text
node scripts/booklet/regroup-exam-sections.mjs --out .booklet-work/RUN/exam-candidates   # stages candidates and before-snapshots only; see booklet-exam-sections.md
node pedagogy/exam-batch.mjs run --projects ID --mode topup
node pedagogy/exam-figures.mjs run --projects ID
```

Save through `pedagogy/exam-publish.mjs` as in "Saves and commits". The pass uses `gpt-6.1-sol` low for ratings and checks, from 9 November. On textbook chapters run only the mark-removal step, never regrouping or top-up.
