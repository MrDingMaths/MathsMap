# Faster verification (22 October 2026, user approved)

Human verification is the bottleneck: Stage 4 drew 145 teacher comments in a week (rates r58 to r326, ratios r90 to r428), spread over spacing and pagination, block roles, cloze and fraction scaffolds, alignment, layout that does not match the source, arrows, wrapping, part labels, borders and content. The aim is that Stage 5 needs far fewer comments and a Stage 6 first import is about 99% clean. The measures below add no review stage; they move work the teacher did by hand into tools that run before she looks. Tools live in `bench/`, `source-match/`, `paginate/`, `checks/` and `handoff/` (outside `scripts/` and `vite.config.js`, which export evidence hashes); shared logic is in `src/lib`.

## Decisions

1. **Teaching blocks take their structure from the source; house style sets every measurement.** Theory, worked examples, scaffolds and guided practice keep the source's alignment columns, arrow endpoints, side and label, side-by-side or stacked arrangement, figure side, indents, emphasis, order and relative grouping. House presets and the house spacing scale (1, 2 and 4 mm gaps, the shared arrowhead, widths, palette, cloze style, fraction boxes and equals gutter) set the numbers, and a house rule wins where it conflicts. This supersedes "source appearance is evidence, not a layout target" (4 October 2026) **for teaching blocks only**. Independent practice keeps the shared presets.
   - Mechanism: `source-match/regions.mjs` finds each teaching block's region on its source page (aligned text, then the drawings and pictures in its band; a model "locate" call only below 60% confidence). `src/lib/teaching-signature.js` compares the structure of the region with the rendered block, relationship by relationship, and marks each difference decidable or ambiguous. `src/lib/booklet-teaching-presets.js` is the preset library: two-column worked example, worked rows with right-hand operation arrows, scaffold table with column arrows, ratio table, figure beside working. `source-match/run.mjs` applies the preset the signature calls for, re-renders and keeps the round only if it has fewer differences and no new layout issue, at most three rounds.
   - **Custom to preset route.** A custom arrangement is used only when no preset expresses the source structure, with the reason recorded in `sourceReview.structure` and `sourceReview.customArrangement`. `source-match/customs.mjs` lists the customs that recur so they become new presets.
   - Sol 6.1 at low reasoning is called only for what is ambiguous (a located region, arrow anchors, a borderline gap, an alignment column): one call per batch with the source crop and closed questions, returning signature corrections and never patches or numbers. At most three workers per booklet.
   - Opt-in authoring: `authoringPreferences: "house-presets-v2"` (`scripts/booklet/house-authoring.mjs`, `semantic-workflow.mjs`) tells new authoring to choose a teaching preset from the source structure. Runs without it, and recorded runs, keep their input hashes.

2. **The pagination optimiser reorders only within one difficulty band.** `src/lib/booklet-pagination-optimiser.js` may move a question at most one band either way, never across `dependsOn`, `keepWithNext` or `pairedBlockId`, and records every move in `block.flow.autoOrder` (rank, from, band, reason, time, rating hash); `organiseExercises` keeps the rank until the rating hash changes. The Questions edition is the objective (pages, then trailing whitespace on non-final pages, then inversions); Short answers and Worked solutions are guards that may not gain pages. It runs as "Optimise pagination" in the Page tab and headlessly as `paginate/optimise.mjs`, one undo step.

3. **Calibrated working space is the default and the floor for new imports and unreviewed booklets.** After authoring, allowances still equal to their import value (in every stored copy: the part, `layoutOverrides.answerSpaces` and a saved arrangement's space item) are set to the calibrated value (`calibratedWorkingSpace`, refitted by `paginate/working-space.mjs calibrate` on the teacher's final allowances); `tightenStages` and the optimiser never go below it. Both take the floor from one helper, `workingSpaceFloor` in `src/lib/booklet-working-space.js` (same width and table-cell context): the **calibrated** floor for an unreviewed booklet, and for a teacher-reviewed booklet (a `studio.flags` entry with no `kind` and an `at`) the **estimator** floor Studio's Tighten always used, so named tightening of a reviewed booklet goes no deeper than before. The optimiser lowers only allowances still equal to their import value; a value the teacher or a repair changed is left alone (17 October rule). Table body rows keep their content-sized minimum: the data supports no fit for them (78% unchanged), so `working-space apply` leaves them alone unless `--table-rows` is passed, and then only rows the revision history shows unchanged since the first revision (no history means no change). This replaces the three-pilot limit of 17 October 2026. A reviewed booklet changes only when the teacher names it (`--named`). **Decided by the user ("match me on average"):** the fit is the least-absolute-deviation (median) fit to the teacher's final allowances, not a fit that keeps 95% of rows at or above them, so about half of allowances land a little under what she would set and half a little over. Working space is 0.63 x import mm + 2, short answers 0.22 x import mm + 6, never under 8 mm. `working-space apply` moves allowances both ways (it raises as well as lowers); `--no-raise` opts out and lowers only.

4. **Proof: rates-v1 is the only pilot.** Its import-final snapshot (arm A, r71) is run through the new pipeline (arm B, a scratch copy) and compared with the teacher's corrected version. `bench/benchmark.mjs` reports layout-field agreement and error in mm, page counts of all five editions, and for each teacher comment whether the arm avoided it, a check caught it, or it was missed. Pipeline bookkeeping (`flow.autoOrder`) is excluded from the layout-field comparison, and a block the handoff sweep already repaired is credited as caught for the rules that repaired it (once repaired, the detector no longer fires on it). See the rates-v1 pilot results below.

## The handoff chain

`handoff/run.mjs` runs before the teacher sees a new import or an unreviewed booklet, on a working copy, and is resumable (`handoff-state.json` records each step's seconds and result):

1. `working-space`: calibrated working space, both ways (`--no-raise` opts out of raising; table rows are untouched).
2. `sweep`: the pre-review sweep of standing conventions (`sweep/rules.mjs`). It records its repairs in `feedbackRepairs` with `source: 'handoff'` (or the note "Pre-review sweep ..."); those entries do not protect spacing from the optimiser, which only teacher-driven or authorised feedback does.
3. `regions`: the source regions of the teaching blocks (`source-match/regions.mjs`), built before the checks so `roles` can read the words above a region; `source-match` reuses and extends the same file.
4. `roles`, `wrapped-math`, `whitespace`: the checks below, with safe fixes applied and each fix verified by a new render.
5. `source-match`: teaching blocks follow their source structure.
6. `theory-diff`: teaching text against the source, report only.
7. `optimise`: the pagination optimiser.
8. `first-pass`: the first-pass review with the source pages attached (`review.mjs --source`).
9. `apply`: queues a and b applied (`apply.mjs`); queue c stays with the teacher.
10. `queue`: one combined `review-queue.json`, lowest source confidence first, shown in Studio's Source tab.
11. `export`: only with `--export`, the final lean-review export, so the three-export budget is kept.

`--save` on a live booklet writes through the revision-checked repair path with the revision the run started from (`handoff-state.json` `input.revision`), so the save fails if the booklet changed during the run, and the settings the run changed are named to the repair scope from the actual diff. Model-calling steps are launched with the permitted host launch AGENTS.md describes; a worker's own read-only sandbox is never disabled. `source-match/run.mjs --allow-live` applies the same live-work hold as the optimiser and the checks.

Every step can be skipped (`--skip`), and a step that cannot proceed says so rather than guessing.

## Checks aimed at the teacher's comment categories

- `checks/roles.mjs`: a block's role against the source group's kind and header band (and the words above its source region), and solutions that would show in the Questions edition on a guided or your-turn block. Fixes use `changeBlockRole`; an ambiguous case is one Sol low call per batch of four, a closed list of kinds.
- `checks/wrapped-math.mjs`: a line of maths and blanks that wraps where the source does not. Fixes in the teacher's order: one column fewer, the diagram above the prompt, a wider column; each verified by re-rendering, and a fix that adds a page or does not help is reverted.
- `checks/whitespace.mjs`: every vertical gap over 6 mm between blocks or inside a teaching block, explained with `layoutSpaceChain`. A gap no field accounts for is an unattributable gap, a renderer bug to fix centrally, never papered over in a booklet. A source page boundary that is not an exercise start and leaves its page short is removed.
- `checks/theory-diff.mjs`: a token comparison of teaching text with the source region, excluding recorded intentional departures and source corrections. It never edits.
- Cloze and fraction decisions (`src/lib/booklet-cloze-convention.js`) are in the sweep `cloze` rule and in the first-pass contract: a full fraction scaffold keeps two boxes and a vinculum; a blank inside parentheses in a numerator or denominator is empty space with no box and no dots; dotted or invisible components become boxes; every other blank is a dotted cloze. A first-pass finding is dropped before the teacher sees it only when it **contradicts** these (replace a fraction box or full scaffold with dots; add a box or dots to a parenthesised fraction blank). A finding that agrees ("a dotted denominator should be an outlined box") or is about something else (width, overlap, alignment) is kept. Checked against the 136 rejected first-pass findings on file: 57 of the 92 rejected response findings are still dropped, and none of the 1,237 repaired, 662 pending, 38 closed or 4 stale findings would be.

The corpus (`bench/corpus.mjs`) turns every teacher comment into a regression case; a new rule must raise the catch rate without adding false alarms. Replay measures deterministic detectors only; model checks are sampled.

The Source tab (`BookletSourceCompare.svelte`, in the Spacing panel) shows the source page with the selected block's region highlighted, the relationships that still differ, and the review queue. It reads `source-match/regions.json` and `review-queue.json` of the import run through the existing `/__booklet/full-imports/<run>/files/` endpoint; without them it says which command makes them.

## rates-v1 pilot results

Arm A is the import as delivered (r71), arm B the same snapshot after the handoff chain (a scratch copy, Sol low workers), the teacher the final version (r326). Pipeline bookkeeping (`flow.autoOrder`) is excluded from field agreement.

| Questions edition | Arm A | Arm B (first chain run) | Arm B (after the review fixes) | Teacher |
|---|---|---|---|---|
| Student pages | 84 | 75 | 74 | 67 |
| With short answers | 89 | 80 | 79 | 72 |
| With worked solutions | 132 | 123 | 122 | 116 |
| Short answers, worked solutions | 5, 48 | 5, 48 | 5, 48 | 5, 49 |
| Fill (body pages) | 75% | 76.3% | 77% | 84.4% |
| Wasted pages | 8 | 3 | 2 | 2 |
| Trailing mm on non-final exercise pages | 2410 | 1734 | 1450 | 848 |
| Answer-space error against the teacher (MAE) | 5.58 mm | 4.06 mm | 4.15 mm | - |

Teacher comments on rates (10 with a recorded fix): arm A 0 avoided, 4 caught, 6 missed; arm B 0 avoided, 4 caught, 6 missed. Counterfactual: the teacher's answer spaces alone give 74 pages; all her layout categories together give 70. The chain takes the Questions edition from 84 to 74 pages, as many as her answer spaces alone give and about 60% of the way to her 67.

Notes on the numbers:

- A comment the sweep fixes before the detector runs is credited as caught for the sweep rule that fixed it. On `p31-example-block` the sweep wrote a phantom of the box (it keeps the box's occupied size, per the 21 October rule) where the teacher wrote a bare rule-and-space gap about 2 mm tighter, so the fix values differ from hers although the printed result matches in kind.
- The `flow` group agrees on 95%. What remains: `keepWithNext` on two teaching blocks she did not set, and, set only by her, `keepTogether` and `sourcePageBreakBefore` on the two `p29` rate bridges, `exercisePageBreakBefore` on `p8-q1` and `tableOnly` on `p54-q1-block`.
- Roles: arm B changes `p11-example-group` from example to guided practice where she keeps it as an example, and does not mark the two `p29` bridges as questions as she did.
