# Booklet polish pipeline (23 October 2026, user approved)

## Current completion workflow (24 October 2026)

Imports use [streamlined completion](booklet-three-pass-import.md#streamlined-completion-24-october-2026), coordinated by `lean-review.mjs finish`. Its one five-edition export supplies automated checks and the one source-side Questions review, targeted answers and combined boundaries. No separate student export, second full residual review or final visual rereading is required. This supersedes the import stage sequence and residual-density hold described historically below. ICE-EM retains its explicit direct route.

The standalone polish tool remains available. Its `residual` step now verifies changed pages and neighbours rather than rereading the whole book. Shared completion is `{ready, blockers, warnings}`: unresolved substantive findings and unverified content repairs block readiness individually. A passing export gate or a saved revision does not grant completion; incomplete progress saves remain possible and report `progress: true`. Textbook mode never accepts pre-existing print defects as final import acceptance.

Repair routing follows the required edit. Layout refusals needing scaffold/content structure, diagram creation or TikZ changes reach the existing content-capable repair path, with independent content checks and exact-result visual verification. Preserve resolved teacher decisions and local exceptions. A verified substantive repair may justify page growth; discretionary optimiser trials may not. Standalone pedagogy is opt-in for imports and remains outside the import sequence.

The contracts cover recurring Stage 5 relationships (stem/number, graph/table cell, teaching grouping, scaffold progression, diagram features and difficulty progression); there is no new stage per feedback pattern. Existing Stage 5 content is not automatically migrated or repaired by this tooling change.

This document replaces "Faster verification" of 22 October 2026. It keeps that document's decisions that still hold and drops its machinery: the source-region matcher, the teaching signatures and presets, the role, theory-diff and whitespace checks and `handoff/`.

## Why

Human verification is the bottleneck. Stage 4 drew 145 teacher comments in a week (rates r58 to r326, ratios r90 to r428), over spacing and pagination, block roles, cloze and fraction scaffolds, alignment, layout that does not match the source, arrows, wrapping, part labels, borders and content. The 22 October chain took rates-v1 from 84 to 74 student pages (the teacher's version has 67). A page-by-page review of its output still found teaching pages 50% to 85% empty before forced exercise breaks, oversized answer boxes inside guided practice, outlined boxes where the source and the teacher use `$(   )`, floating centred scaffolds, worked-example steps without the red step gutter, questions alone on a page, one block taller than a page and a changed palette colour. The source-match machinery (regions, then signatures, then presets) made 2 useful repairs out of 54 blocks, and the first-pass review covered a sample of pages.

The polish pipeline is one command for any booklet, a new import or any of the Stage 5 masters. It fixes layout, spacing, pagination, house style and content errors without the user. The only output that reaches the user is a short list of pedagogy suggestions and of exercise breaks that could go.

## Decisions (23 October 2026, user)

1. **Exercise breaks stay forced.** Every exercise starts on a new page in the Questions edition. The pipeline never removes a break. For each forced break that follows a page with 60 mm or more free it makes a suggestion: a Studio comment of kind `polish-break-suggestion` ("Remove the page break before Exercise 3: page 12 has 84 mm free, and removing the break saves about 1 page") with a **Remove page break** button in the Comments pane. The button runs `setPageBoundary(project, firstBlockId, 'remove')`, the Page tab's own action, and resolves the comment. The estimate comes from paginating a copy with that break removed; nothing is kept.
2. **Everything else is autonomous.** Block roles, theory wording against the source, answers and worked solutions, and adding, removing or merging questions are applied without the user. Only extension and bridging-question suggestions (the pedagogy review) go to the user, as Studio comments of kind `pedagogy-suggestion`; nothing in them is applied. A content change is saved only after a second Sol low call, which did not write it, has derived every changed answer itself and accepted it (`polish/content.mjs`).
3. **Reordering never breaks a dependency.** A question that scaffolds the next, refers to an earlier question or shares a stimulus keeps its order. `polish/dependencies.mjs` writes these pairs as `block.flow.dependsOn` (a wording pass, then one Sol low call per exercise, cached by content hash); `exerciseUnits` and the optimiser join the units, so no reorder can separate them.
4. **A scaffold blank matches the source.** Where the source has brackets the booklet has the parenthesised gap `(\rule{0pt}{5mm}\hspace{Nmm})`, the form of the [21 October rule](booklet-cross-session-rules.md#cloze-styles-and-source-tables-4-october-2026); where the source has a box it has an outlined box. The sweep rule `bracket-blank` converts a box already inside parentheses; a box whose brackets were lost at import needs the source, so the full-book review restores them.
5. **Reviewed booklets are included.** The six Stage 5 booklets with teacher comments go through the same pipeline. Teacher comments (a flag with no `kind`), the blocks they name and blocks with a teacher-driven `feedbackRepairs` entry (including `authorisedFeedback`) are protected in every step. Open `first-pass` and `pedagogy-review` comments of earlier runs are re-reviewed by the new run and closed once it has run, with `resolution: "superseded by polish <date>"`.

## Decisions carried forward from 22 October 2026

- **Teaching blocks take their structure from the source; house style sets every measurement.** Theory, worked examples, scaffolds and guided practice keep the source's alignment columns, arrow endpoints, side-by-side or stacked arrangement, indents and grouping; the house presets and spacing scale (1, 2 and 4 mm gaps, the shared arrowhead, widths, palette, cloze style, fraction boxes, equals gutter) set the numbers. This supersedes "source appearance is evidence, not a layout target" (4 October 2026) for teaching blocks only; independent practice keeps the shared presets. It is no longer matched by a region matcher: the full-book review sees each batch's source pages beside the render and reports differences, and the sweep fixes the deterministic one (the red step gutter).
- **The pagination optimiser reorders only within one difficulty band** (`src/lib/booklet-pagination-optimiser.js`) and records each move in `block.flow.autoOrder`. The Questions edition is the objective; Short answers and Worked solutions are guards that may not gain pages. New on 23 October: the **orphan pull** (below) and the hard rejections.
- **Calibrated working space is the default and the floor.** Allowances still equal to their import value in every stored copy are set to the calibrated median fit (0.63 x import mm + 2, short answers 0.22 x import mm + 6, never under 8 mm), both ways. Both the optimiser and Studio's Tighten take the floor from `workingSpaceFloor`; the calibrated floor for an unreviewed booklet, the estimator floor for a teacher-reviewed one. New on 23 October: guided practice and "your turn" areas are included (a block is protected there only by a repair or note about spacing); table body rows stay at their content-sized minimum unless `--fresh-import` says nothing has been edited since import.

## The pipeline

Save-safety review (23 October 2026): live polish saves use Studio's existing revision-checked endpoint, sharing its save queue with teacher autosaves. A CLI-local queue cannot protect against the running Studio process. Milestones preserve the actual start snapshot and serialize pin updates. Protected comments, authorised-feedback blocks and their settings, changed/unknown working-space values, dependencies, difficulty-band crossings and exercise boundaries are checked during repair trials and again before saving. Whole-container layout patches must retain practice labels, arrow labels and answers. Missing export gates refuse a live save. These are safety repairs only; the accepted residual layout defects remain for manual Studio editing.

Textbook imports use `--textbook`: no pedagogy check, challenge or suggestion runs, and historical pedagogy comments remain untouched. This overrides the general-purpose pedagogy step below for textbook imports.

```
node polish/run.mjs --project ID | --candidate FILE [--save] [--skip a,b] [--only a,b] [--no-model]
                    [--out FILE] [--work-dir DIR] [--fresh] [--fresh-import] [--allow-live]
```

The pipeline works on a copy, `<work>/polish/candidate.json`, and is resumable from `<work>/polish/state.json`, which records every step's seconds and result. `<work>` is the booklet's import run folder (or `--work-dir`). `--out` copies the result. `--save` (a live `--project` only) writes it through the revision-checked repair path with the revision recorded at the start, so the save fails if the booklet has moved on. Before it saves, the pipeline refuses to continue if a `lean-import`, `lean-review`, `lean-route` or export process is running for the booklet or the export gate failed, and it pins the start revision as a milestone checkpoint (`booklets/projects/.revisions/milestones.json`) so the pre-polish state stays one undo away. Model calls are GPT-6.1 Sol at low reasoning, at most three workers per booklet, launched with the permitted host launch AGENTS.md describes. The Studio server on 127.0.0.1:5173 is reused, never restarted.

| Step | What it does |
|---|---|
| `snapshot` | The input revision, the page counts and pagination issues of every edition, the open machine comments. |
| `normalise` | The sweep rules (gutter, cloze, empty, ratio and the new `steps`, `scaffold-anchor`, `bracket-blank`) and the calibrated working space, on every block the teacher has not decided. A sweep change that would alter content is dropped for that block. Also (23 October 2026, second review): **source page boundaries inside a topic are cleared** (`clearSourceBreaks`: `flow.sourcePageBreakBefore` goes on every block that is not an exercise start, not the first block of a section opening a new topic and not teacher-decided; a manual `pageBreakBefore: true` or page-break block stays), so only exercise starts and topic banners start a page; the `steps` rule also numbers an example's aligned working (rows of `lhs & = rhs`, the left side dropped where it repeats the given) and several lines of blue working in its solution, never a single answer; `scaffold-anchor` leaves a layout that stacks its slots (fewer columns than slots) or nests layouts alone. |
| `blank-style` | Outlined blanks where the source leaves empty space become the parenthesised gap (`polish/blank-style.mjs`): one Sol low call per block that has an outlined blank in its maths, with the block's source page image(s) attached, asking only whether each piece of maths is drawn with boxes or with space; cached by content in `<work>/polish/blank-style.json`. "Space" pieces are converted deterministically (same width, parentheses added unless already there); "box" and "unclear" stay. Teacher-decided blocks and blocks with a local box exception are not asked. |
| `wrapped-math` | Formulas that wrap, fixed in the teacher's order, each verified by a render (`checks/wrapped-math.mjs`). |
| `dependencies` | Pairs that must keep their order (`polish/dependencies.mjs`). |
| `paginate` | The optimiser through Studio (`paginate/optimise.mjs`): tighten to the floor, best-fit pulls, grids, then the orphan pull. |
| `review` | The full-book first-pass review (every page; `first-pass/review.mjs --source`), then its layout findings applied (`first-pass/apply.mjs`), at most two rounds. |
| `content` | Content findings (roles, theory wording, answers, duplicates, merges) repaired and independently checked (`polish/content.mjs`). |
| `residual` | Scoped verification of changed/reflowed pages and neighbours, with exact previous requests. Every unresolved substantive finding blocks completion. |
| `supersede` | Open machine comments of earlier runs closed as superseded. |
| `breaks` | Every forced exercise break after a page with 60 mm or more free goes to `<work>/polish/break-suggestions.json` with the pages and the mm (`savedMm`, measured at the exercise's last page) removing it would give back; only those that save a whole page become Studio comments (a following forced topic break often absorbs the rest). |
| `export` | The gates (below) and the student PDF, without `--draft`. |
| `sheets` | Contact sheets of every Questions page (`polish/sheets.mjs`), four to a sheet at 60 dpi, in `<work>/polish/sheets/`. |
| `pedagogy` | The pedagogy review (low review and challenge, as required for all polish calls) in suggestions-only mode (`polish/pedagogy.mjs`). |
| `report` | `<work>/polish/report.json` and one line: pages before to after per edition, fixes by step, residual count, pedagogy suggestions, break suggestions and elapsed time. |

### Orphan pull and hard rejections (step `paginate`)

A lone trailing question (or part) on an exercise's last page is pulled back onto the previous page: first by taking the exercise's allowances to the floor, together with a band-limited (+-1) move of that unit to an earlier position, nearest first, within the dependency units. It is kept only if the page goes. It is not tried when the pages before the last cannot hold the question even with the allowances at the floor (`orphan-no-fit`, with the mm needed and free in the report): rates `Exercise 11` Q5 needs 61 mm and has 14 mm free, `Exercise 12` Q13 needs 88 mm and has 77 mm free across three pages. **Short tails of teaching blocks:** a guided practice, example or set-up block that splits across two pages with at most two parts on the second is first tightened to the floor and then marked `flow.keepTogether`; the trial is kept only if the block stops splitting without a page, an issue or another split being gained. Any candidate with an `oversized-content` issue, any new pagination issue, a newly split block or more pages than before is rejected outright; the exercise start stays on a new page.

### Applying the full-book review (steps `review` and `content`)

Each Questions batch is six pages with the source pages of its own blocks attached (up to eight; the run folder's `evidence/pages`). The contract is the [first-pass reviewer contract](booklet-first-pass-review.md), extended on 23 October with the polish rules: teaching blocks match the source's structure; blank style matches the source; no empty interior in guided practice or "your turn" boxes; no floating or centred scaffolds; the red step gutter; palette colours never change; no wrapped display maths; no unexplained vertical gaps; and a page more than half empty needs a forced exercise break before the next block or a fix. The decided cloze and fraction conventions still filter findings.

Layout findings go to `first-pass/apply.mjs`, which refuses any patch that turns a page break on (`addsPageBreak`): the reviewer's "restore the source page break" repairs left teaching pages half empty. The findings that share a block are one **batch**, applied whole or not at all (the rates `p49` failure was a keep-with-next applied without the space reductions that made it fit). A batch that creates a pagination issue or raises any edition's page count is reverted: where several batches were applied together, each is then tried alone and only the safe ones stay. Content findings (`area: content` or `duplicate`) go to `polish/content.mjs`. Extension and opening-review findings (`extension`, `review`) are suggestions and become `pedagogy-suggestion` comments. A finding on a block the teacher decided is never attempted.

### Gates

The deterministic gates before any save: no `oversized-content` issue and no pagination issue the input did not have; the short and worked editions, and the Questions edition, not longer than the input; `scripts/booklet/export-pdf.mjs --mode student` succeeds without `--draft`, which runs `inspectBooklet` (overflow, overlap, clipping, palette), including `layout-content-overlap`: text or a table in one slot of a layout landing on content in another). `checks/wrapped-math.mjs` and the oversized check remain deterministic gates.

## In Studio

- The **Comments** pane shows the two kinds of comment the pipeline leaves: `polish-break-suggestion` with its Remove page break button, and `pedagogy-suggestion`. Resolving either is the teacher's decision.
- The **Source** tab (opt-in, `BookletSourceCompare.svelte`) shows the source page or pages the selected block was transcribed from, beside it, and the polish review queue of the booklet's import run (`polish/report.json`): what the residual review left, the breaks that could go, and the pedagogy findings that were only reported. It no longer draws regions.

## What was removed

`source-match/` (regions, signatures, presets, customs), `src/lib/teaching-signature.js`, `src/lib/booklet-teaching-presets.js`, `TEACHING_SCALE`, `checks/roles.mjs`, `checks/theory-diff.mjs`, `checks/whitespace.mjs` and `handoff/`, with their tests. The step 4 reviewer sees the source and the render directly and covers roles, theory fidelity and gaps. `bench/` stays as a development tool (`bench/benchmark.mjs` arm B runs `polish/run.mjs`); it is not run per booklet.

## Measured so far

The 22 October pilot on rates-v1 (arm A the import at r71, arm B the same snapshot after the old chain, the teacher r326):

| Questions edition | Arm A | Arm B (old chain) | Teacher |
|---|---|---|---|
| Student pages | 84 | 74 | 67 |
| With short answers | 89 | 79 | 72 |
| With worked solutions | 132 | 122 | 116 |

The target for the polish pipeline is no more than 74 student pages before the break suggestions and about three pages from the teacher's 67 with them applied. Smoke-test results of the pipeline on that arm follow.

### Smoke run, 23 October 2026 (arm A, a scratch copy, no save)

Student pages 84 to 71 (the old chain gave 74; the teacher has 67); short answers 5 and worked solutions 48, unchanged. 42 minutes of step time:

- `normalise` 99 blocks (the sweep changed 7: steps 2, bracket-blank 6, scaffold-anchor 5; 242 allowances lowered and 6 raised), `wrapped-math` found 8 and fixed none without gaining a page, `dependencies` found no pair in 13 exercises, `paginate` 76 to 74 with 2 reorders (2 candidates refused for gaining a page);
- `review` (1,122 s) applied 11 layout findings in two rounds and reverted 15; `content` had no content finding; `residual` (602 s) still found 32 (31 layout, 4.3 per ten pages, so held), applied 4 more and lists 28 in the report;
- `supersede` closed 27 older machine comments (14 pedagogy-review, 13 first-pass); `breaks` found 7 forced breaks after a page with 60 mm or more free, of which one would save a page; `pedagogy` (624 s) posted 16 suggestions and reported 6 other findings;
- `export` passed the page checks only as far as the input did (one `graph-tick-overlap` the import already had), which is what the gate compares.

The remaining gap to 67 is mostly the half-empty pages before forced exercise breaks and the 28 listed residual findings.
