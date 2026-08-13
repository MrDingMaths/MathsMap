# Content-generation queue

Ordered queue of **topics** to mass-generate per-skill teaching content
(`public/content/{id}.json`) and quizzes (`public/quizzes/{id}.json`) for, one topic per
session, via the workflow in [content-generation.md](content-generation.md).

## Stage 3 backfill campaign (GPT-5.6 generation provenance)

**Scope:** 139 incomplete Stage 3 skills: 137 theory-only files, the missing
`identify-base-perpendicular-height` content file, and `order-decimals-3dp` (practice absent;
existing q1-q4 retained unless a gate requires repair). The 10 already-complete Stage 3 skills
are out of scope. Existing theory is preserved byte-for-byte except for the one missing file.

**Campaign-only model provenance:** generation uses OpenAI `gpt-5.6-sol` at high reasoning;
independent blind checking remains `gpt-5.6-luna`. This is a Stage 3 exception only: it does not
change the standing Opus generation workflow or any historical provenance below. Baseline target-file
SHA-256: `8b4fadc6686bbd53433bec05b4c0b6480c7112443f2408eb04a8066f01e8f3e3` on a 438-entry dirty
worktree; unrelated Wave 2 changes are preserved and remain out of scope.

| Round | Lane | Topics | Skills | Status |
|---|---|---|---:|---|
| 1 | S3-1 | t-s3-rn-a, t-s3-rn-b | 15 | in-review |
| 1 | S3-2 | t-s3-ar-a, t-s3-ar-b | 8 | in-review |
| 1 | S3-3 | t-s3-mr-a | 17 | in-review |
| 2 | S3-4 | t-s3-mr-b | 13 | in-review |
| 2 | S3-5 | t-s3-rqf-a, t-s3-rqf-b | 14 | in-review |
| 2 | S3-6 | t-s3-gm-a | 9 | in-review |
| 3 | S3-7 | t-s3-gm-b | 12 | in-review |
| 3 | S3-8 | t-s3-2ds-a, t-s3-2ds-b | 7 | in-review |
| 3 | S3-9 | t-s3-3ds-a, t-s3-3ds-b | 12 | in-review |
| 4 | S3-10 | t-s3-nsm-a, t-s3-nsm-b | 10 | in-review |
| 4 | S3-11 | t-s3-data-a, t-s3-data-b | 12 | in-review |
| 4 | S3-12 | t-s3-chan-a, t-s3-chan-b | 10 | in-review |

**Campaign result (2026-08-13).** The 139 skills now contain 841 foundation, 841 development,
418 mastery-practice, and 880 quiz items (2,980 authored items total). The 138 inherited theory
blocks match their original raw JSON; `identify-base-perpendicular-height` received the one new
theory block. `order-decimals-3dp` retained q1-q4 and added q5-q6. The isolated manifest delta is
+1 content and +138 quizzes; the rebuilt repository manifest is 614 content / 614 quizzes because
unrelated Wave 2 work continued from the recorded dirty baseline.

**Automated QA and blind check.** All six deterministic gates pass on the campaign with zero
warnings or hard defects: schema, equivalent options, duplicate stems/value signatures, option
hygiene, figure scale, and angle arms. The duplicate audit has 96 non-blocking diagram-template
similarity advisories. Luna completed all 139 blind packets with 1,298/1,298 items covered. The
first comparison produced 11 answer mismatches and 79 flags; every item was adjudicated, including
checker arithmetic/legend errors and valid distractor paths. Targeted repairs touched 62 items.
A second blind pass across the 41 affected skills had zero answer mismatches and complete coverage;
its seven flags led to five final wording refinements (`round-to-estimate` q3/q5/q7,
`units-for-capacity` m1, `identify-misleading-data` m1) and one rejected false positive
(`estimate-products` q8). Those five refinements are explicitly retained for human spot-check under
the two-round stopping rule.

**Repository verification.** Full validation passes with zero errors (247 warnings, all outside
this campaign). The unscoped duplicate regression reports two unrelated Wave 2 defects in
`order-operations-roots` and `evaluate-index-notation`/`zero-index`; the campaign contributes none.
Tests pass 114/114, the manifest rebuild passes, and the Vite production build passes. The worktree
remains deliberately uncommitted.

**Review samples:** S3-1 `order-decimals-3dp`; S3-2 `multistep-add-subtract-problems`; S3-3
`multiply-area-model-distributive`; S3-4 `order-of-operations`; S3-5
`compare-fractions-area-discrete`; S3-6 `recognise-angle-relationships`; S3-7
`coordinates-translation-reflection`; S3-8 `identify-base-perpendicular-height`; S3-9
`nets-of-3d-objects`; S3-10 `duration-problems`; S3-11 `identify-misleading-data`; S3-12
`assign-probabilities-unequal`.

**Required manual TikZ review (content + quiz block counts; 52 skills / 632 blocks):**

- S3-1: `place-decimals-number-line` 29; `percent-meaning` 3;
  `equivalent-percent-decimal-fraction` 3.
- S3-3: `multiply-area-model-distributive` 25; `multiply-2-digit-by-2-digit` 11.
- S3-5: `fraction-whole-comparison` 1; `compare-unit-fractions-half` 1;
  `order-unit-fractions` 2; `order-fractions-related-denominators` 1;
  `compare-fractions-area-discrete` 1; `whole-from-fractional-part` 2;
  `unit-fraction-of-quantity` 2; `non-unit-fraction-of-quantity` 2.
- S3-6: `plot-points-first-quadrant` 31; `read-coordinates-first-quadrant` 16;
  `perimeter-2d-shapes` 30; `sides-needed-for-perimeter` 14; `measure-angles-protractor` 11;
  `estimate-angles-benchmarks` 15; `construct-angles-protractor` 15.
- S3-7: `plot-points-four-quadrants` 15; `coordinates-translation-reflection` 6;
  `perimeter-area-same-comparison` 8; `length-perimeter-problems` 12;
  `recognise-angle-relationships` 21; `perpendicular-lines` 17; `angles-add-to-90` 15;
  `angles-add-to-180` 15; `angles-add-to-360` 15.
- S3-8: `symmetry-quadrilaterals` 13; `regular-irregular-polygons` 9;
  `area-units-hectare-km2` 1; `rectangles-same-area-different-dimensions` 2;
  `describe-transformations` 19; `dissect-rearrange-shapes` 18;
  `identify-base-perpendicular-height` 29.
- S3-9: `compare-prisms-pyramids` 8; `name-prisms-pyramids` 6; `sketch-3d-views` 27;
  `nets-of-3d-objects` 11; `volume-by-displacement` 6; `construct-3d-models` 6;
  `volume-layers-structure` 3; `volume-rectangular-prism` 9.
- S3-11: `construct-column-graph-scale` 28; `draw-timeline` 26;
  `interpret-line-graphs` 17; `interpret-tables-graphs` 8;
  `interpret-side-by-side-graphs` 18; `compare-displays-range-mode` 15;
  `interpret-media-data` 6; `identify-misleading-data` 8.
- S3-2, S3-4, S3-10, and S3-12 are diagram-free.

Human visual review and commit remain owner actions.

**One batch per session.** Work top to bottom. After a batch's samples are approved,
`node scripts/validate.mjs` + `npm run manifest` are clean, and the status is set here,
move to the next `pending` row — do not skip ahead. **Statuses are set by the
orchestrator; do not commit** (the human commits).

Wave 1 covered the **16 Stage-4-course topics** (`courses` contains `s4`) — COMPLETE.
Wave 2 covers the 41 Stage-5 topics (see the Wave 2 section). Stage 6 follows as Wave 3.
From Wave 2 on, one queue row may merge several same-family topics into one batch.

**Status vocabulary:** `pending` → `generated` (both files written, `validate --only`
clean per skill) → `checked` (blind check adjudicated) → `validated` (batch
`validate.mjs` clean, manifest rebuilt) → `in-review` (human-review samples out) →
`committed`.

**Skill counts** are the number of skills whose `dotPointIds` resolve to the topic
(`data/dotpoints.json` → `topicId`). The parenthetical is the **stage-3 subset** — skills
with `stage: 3` living on a Stage-4-course dot point; these already have a content file,
so their `theory` is copied **byte-for-byte** and only practice + quiz are added (STAGE 3
rule). The named stage-3 skills are listed under each affected batch.

**Booklet paths** in Wave 1 are relative to `booklets/Stage 4/` (Wave 2 rows carry
explicit `Stage 5`/`Stage 5 Core`/`Stage 5 Path` prefixes) and were cross-checked against the
TRIAGE KEEP / ALREADY-ATOMISED list — every file below is a surviving booklet in that
folder. `anchor: none` skills (booklet under-covers the skill; generated from the syllabus
dot point) are recorded per batch by the orchestrator as they surface.

**Batch order — pilot first.** Batches 1–6 are the **pilot**: `t-s4-alg` (symbol-only
pipeline shakedown — no diagrams to debug) followed by the five highest-risk topics,
chosen to surface failure modes early:

- `t-s4-ang` — pure TikZ stress (parallel lines, transversals, labelled angles);
- `t-s4-lin` — coordinate-plane graphs (axes/pgfplots risk) + difficulty drift risk
  (gradient/intercept creeping past Stage 4 scope);
- `t-s4-dat` — statistical displays are the hardest TikZ (column graphs, stem-and-leaf,
  dot plots) and interpretation questions are hardest to MCQ well;
- `t-s4-pyt` — triangle diagrams everywhere + difficulty drift risk (surds,
  exact-vs-rounded answers overshooting Stage 4);
- `t-s4-frc` — densest prerequisite cluster, biggest difficulty-calibration risk,
  richest misconception space (best distractor-quality stress test), fraction area-model
  diagrams.

**Batches 7–16 do not start until the human reviews the pilot outcomes** and confirms
the prompts/pipeline need no revision. Remaining 10 topics then run in curriculum order.

---

## Wave 1 — Stage 4

### Pilot (batches 1–6)

| # | Topic id | Topic title | Skills (stage-3 subset) | Mapped booklet file(s) | Status | Review samples | Anchor gaps |
|---|---|---|---|---|---|---|---|
| 1 | t-s4-alg | Algebraic techniques | 16 (0) | `Algebraic Techniques 1_Introduction to Algebra.md`<br>`Algebraic Techniques 2_Simplifying Expressions.md`<br>`Algebraic Techniques 3_Expanding Brackets.md`<br>`Algebraic Techniques 4_Factorise Expressions.md` | committed | `factors-of-algebraic-term`, `factorise-negative-common-factor`, `identify-parts-of-expression` | `factors-of-algebraic-term`, `factorise-negative-common-factor` (booklet under-covers; generated from dot point). Blind check: 99/101 MCQ agree; 1 checker index slip (hcf q4, adjudicated agree); 1 genuine defect repaired (identify-parts-of-expression q6+m1 constant-term-of-none ambiguity → replaced with signed-constant twist, round-2 check 7/7) |
| 2 | t-s4-ang | Angle relationships | 7 (0) | `Angle Relationships.md` | committed | `unknown-angles-parallel`, `transversal-angle-pairs`, `geometry-notation` | ChatGPT-generated. 68 TikZ fields; all 68 compile and user visual review approved. Quiz figures added to diagram-reading items. Blind check: MCQ 31/31 agree, 0 unanswerable; original auxiliary-line defect repaired and rechecked. Two visual sweeps made 16 targeted figure repairs (ray endpoints, on-line parallel marks, angle-pair positions, right-angle splits, reflex-arc selection, missing rays, and label collisions); fresh blind bundles generated for touched skills. **Diagram-conversion pass (2026-07-19, post-commit):** 19 wordy no-diagram practice cards across `unknown-angles-parallel` (11: f1–4, d0–4, m1–2), `unknown-angles-point` (3: d3, d4, m1), `parallel-line-angle-properties` (5: d0–2, m0–1) rewritten as diagram-based — configuration moved into a labelled TikZ figure, prose trimmed to a short instruction. `unknown-angles-parallel` m1 (self-scaffolding auxiliary-parallel reflex item) REPLACED with an in-scope transfer-then-straight-line item (x=75°); m2 (triangle-scope risk) REDRAWN as pure parallel transfer (x=73°). Genuinely conceptual cards left verbal (`angle-pairs-point` m1, `transversal-angle-pairs` m1, `parallel-line-angle-properties` f3/d3/d4). One fresh blind checker re-solved all 19 (+quizzes): **all agree, 0 mismatch**. Removed a pre-existing bare-restatement straggler in `unknown-angles-point` m0. Validate + full-repo clean, manifest rebuilt. **STILL VERBAL/self-scaffolding, flagged for decision:** `unknown-angles-parallel` m0 + quiz q5 remain "auxiliary line through P" items (already diagrammed, so outside this wordy pass). **19 new diagrams need manual visual review before re-commit.** |
| 3 | t-s4-lin | Linear relationships | 12 (0) | `Linear Relationships.md` | committed | `graph-linear-relationship`, `intersection-of-lines`, `pattern-to-equation` | ChatGPT content discarded (archived at git tag `archive/t-s4-lin-chatgpt`); regenerated fresh with Opus, one agent per skill. `validate.mjs` clean; blind check 68/68 MCQ agree, 0 UNSURE, 0 mismatches. Visual diagram gate pending (done manually by human).  |
| 4 | t-s4-dat | Data classification and visualisation | 8 (0) | `Data Visualisation.md` (dp-1, classification)<br>`Data Classification and Visualisation 2_Display data using graphical representations relevant to the purpose of the data.md` (dp-2)<br>`Data Classification and Visualisation 3_Interpret data in graphical representations.md` (dp-3) | committed | `statistical-variable`, `misleading-graphs`, `represent-data-graphs` | `statistical-variable` (booklet under-covers — only a variable-vs-value table, no "which/name the variable" drills; the variable-vs-value / name-the-variable / variable-vs-individual items authored fresh from the dot point → closer review). Generated fresh with Opus, one agent per booklet section (3 generators + 3 fresh blind checkers, per pared workflow). All 8 `validate --only` clean. Blind check: **40/40 quiz MCQ agree**, all mastery items agree, 0 UNSURE, 0 mismatches, 0 figure-mismatch flags — no repairs. **Automated vision gate retired (per updated runbook); diagram skills flagged for manual human visual review:** `represent-data-graphs` (9 tikz), `graph-conventions` (5), `choose-graph-type` (1), `interpret-graphs-conclusions` (17), `misleading-graphs` (19); the 3 classification skills are diagram-free. `graph-conventions` mastery omitted (single-step recognition; masteryOmitted recorded). **Diagram-revision pass (post first human review):** all data-display figures rewritten to fix (a) title/y-axis-label collision and (b) scenario/column/line-shape monotony — anti-collision placement rule + variety rule + copy-ready templates added to `docs/tikz-prompt.md` (Data displays) and pointed to from the runbook, so batches 5–6 inherit it. Scenarios now disjoint across skills (pizza/shoes/books/cars/rainfall/grades/plants; concert/goals/museum/temperature/battery/populations/sales/exam-marks), column counts 3–7, line graphs non-linear. Re-validated clean + re-blind-checked (26/26 revised MCQ + mastery agree, 0 flags). **Second placement fix (post 2nd human review):** x-axis name was colliding with the last category/tick label at the arrow tip; hand-moved all 45 axis-name nodes to a centred lower line `(xmid, -1.0)` off the `y=0` baseline (coordinate-only, answers untouched → no re-check), and updated the `tikz-prompt.md` rule + templates so future graphs place the x-label there. **Third fix (crowding, post 3rd human review):** cramped small-scale figures had y-label overlapping wide `%`/4-digit ticks, long category words touching, and long titles overrunning the y-axis; hand-applied fit knobs (scale→0.85 min, wide-tick y-label→x−2.0, long category labels→`\tiny`, over-long titles→`\scriptsize`) across 5 files (font/scale only, no data change), and added a "Sizing & fit" rule to `tikz-prompt.md`. Re-validated clean. Committed as 49463fb. |
| 5 | t-s4-pyt | Right-angled triangles (Pythagoras) | 7 (0) | `Right-angled Triangles.md` | committed | `converse-pythagoras`, `pythagoras-problems`, `pythagoras-multistep` + **full diagram list (all 7) for manual visual review** | none (all 7 booklet-covered) — see notes for two deliberate scope/figure decisions |
| 6 | t-s4-frc | Fractions, decimals and percentages | 34 (2) | `Fractions Decimals Percentages 1_Comparing Fractions.md`<br>`Fractions Decimals Percentages 2_Decimals.md`<br>`Fractions Decimals Percentages 3_Converting FDP.md`<br>`Fractions Decimals Percentages 4_Operations with FDP.md`<br>`Fractions Decimals Percentages 5_Percentage Increase Decrease Change.md`<br>`Fractions Decimals Percentages 6_Percentages Problems.md` | in-review | `convert-fractions-decimals-percentages`, `reverse-percentage-problems`, `financial-percentage-problems` + **full diagram list (2: `equivalent-fractions`, `locate-irrationals-number-line`) for manual visual review** | none (all 34 booklet-covered) |

**Batch 5 (t-s4-pyt) notes.** Generated fresh with Opus, pared workflow — 3 section-owning
generators (A: `hypotenuse`+`pythagoras-theorem-statement`+`converse-pythagoras`;
B: `pythagoras-find-side`+`pythagoras-find-shorter-side`; C: `pythagoras-problems`+
`pythagoras-multistep`) then 3 fresh blind checkers (one per group). atomTypes: `hypotenuse`=T,
`pythagoras-theorem-statement`=F, `converse-pythagoras`=Cat, the four compute/apply skills=R.
All 7 `validate --only` clean; whole-batch + full-repo validate clean (0 warnings); manifest
rebuilt. **Blind check: 32/32 quiz MCQ agree, 21/21 mastery-practice items agree, 0 UNSURE,
0 defect flags, 0 figure-mismatch flags — no repairs.** (One formatting-equivalence accepted:
checker gave `5√3` where the `pythagoras-problems` mastery key shows the unsimplified `√75` —
equal; surds are deliberately left unsimplified per the exact-vs-rounded rule.) Cross-skill
dedupe scan: no near-duplicate stems (shared triples like 6-8-10 / 5-12-13 appear only as figure
labels across identify/judge/compute skills — different tasks, not duplicate questions).
Difficulty-drift watch held: exact-vs-rounded followed per question (surds where "exact form"
asked, decimals where "round to N d.p." asked; intermediates carried exact, rounded once at the
end); no reach into dependents (no 3D, coordinate-distance, trig, or area-as-task).
**Automated vision gate retired — diagram skills flagged for manual human visual review (ALL 7
carry inline `[tikz]`):** `hypotenuse` (content 11 / quiz 5), `pythagoras-theorem-statement`
(10 / 3), `converse-pythagoras` (6 / 2), `pythagoras-find-side` (11 / 4),
`pythagoras-find-shorter-side` (11 / 4), `pythagoras-problems` (11 / 4), `pythagoras-multistep`
(11 / 3) — 96 `[tikz]` blocks total; eyeball via
`http://localhost:5173/#/tikz-check?topic=t-s4-pyt`. **Two deliberate decisions to note at
review:** (1) the booklet's touching-circles right-angle proof (image114) was NOT authored — it
is a converse-of-Pythagoras task with no genuine Pythagoras step, out of `pythagoras-multistep`
scope; (2) the quadrant+triangle mastery figure (image116) was reduced to its defining right
triangle (sides 6/10, radius r) with the three-quarter arc described in text, because the
booklet composite could not be reproduced self-consistently and a figure contradicting its
answer would be a defect. Committed to master (batch content + manifest + this status flip).

**Batch 6 (t-s4-frc) notes.** Generated fresh with Opus, pared workflow — **7 section-owning
generators** (author-per-section, booklet 4 split fraction/decimal for load), then **7 fresh blind
checkers** (one per section):
A `Comparing Fractions` = hcf-two-numbers, lcm-two-numbers, simplify-fractions,
compare-order-fractions, equivalent-fractions[S3];
B `Decimals` = round-decimals[S3], approximation-notation, round-decimals-carry,
recurring-decimal-notation, classify-terminating-recurring;
C `Converting FDP` = rational-numbers, convert-fractions-decimals-percentages,
improper-mixed-numbers, irrational-numbers, locate-irrationals-number-line,
order-fractions-decimals-percentages;
D `Operations`/fractions = add-subtract-fractions, find-reciprocal, multiply-divide-fractions,
effect-multiply-by-fraction, fraction-decimal-quantity-problems;
E `Operations`/decimals = place-decimal-point-product, decimal-divisor-to-whole,
multiply-divide-decimals;
F `Percentage Increase Decrease Change` = quantity-as-fraction-percentage, percentage-of-quantity,
percentage-increase-decrease, percentage-multiplier, percentage-change;
G `Percentages Problems` = interpret-percentage-represented, unitary-method-percentages,
reverse-percentage-problems, repeated-percentage-change, financial-percentage-problems.

**STAGE 3 rule applied to both stage-3 skills.** `round-decimals` (content theory-only + quiz
already present) and `equivalent-fractions` (content theory-only, quiz absent): `theory` object
copied **byte-for-byte**; only practice tiers added, and the `equivalent-fractions` quiz created
fresh. Pre-existing `round-decimals` quiz left untouched and re-validated.

All 34 `validate --only` clean; whole-batch + full-repo `validate.mjs` clean (0 warnings);
manifest rebuilt (238 content / 85 quiz). **Blind check: 171/171 quiz MCQ agree, all
mastery-practice items agree, 0 UNSURE, 0 mismatches, 0 figure-mismatch flags — no repairs.**
(One formatting-equivalence accepted: `multiply-divide-fractions` m1 checker gave `25/6` where the
key shows `4⅙` — equal.) atomTypes recorded per skill in generator reports (recognition skills
`rational-numbers`/`irrational-numbers`/`approximation-notation` = Cat; notation/transform skills
`improper-mixed-numbers`/`find-reciprocal`/`place-decimal-point-product`/`decimal-divisor-to-whole`/
`percentage-multiplier`/`recurring-decimal-notation` = T; `effect-multiply-by-fraction` = Com;
remainder = R). **masteryOmitted** (single-step, no in-skill twist): `approximation-notation`,
`recurring-decimal-notation`, `decimal-divisor-to-whole`. No `anchor:none` — the six FDP booklets
cover all 34 skills. Difficulty-drift watch held on the flagged densest prereq cluster: each atom
kept to its own scope (interpret-percentage-represented only names the percentage; reverse uses
unitary+interpret in service; percentage-increase-decrease framed via (100±x)% not the multiplier;
decimal point-placement / divisor-shift kept to their single step). Cross-skill dedupe scan: no
near-duplicate stems between section-mates.

**Automated vision gate retired — diagram skills flagged for manual human visual review (only 2
carry inline `[tikz]`; the other 32 are number skills, diagram-free):** `equivalent-fractions`
(1 content bar area-model + 1 quiz) and `locate-irrationals-number-line` (20 content number-lines +
5 quiz) — **27 `[tikz]` blocks total**; eyeball via
`http://localhost:5173/#/tikz-check?topic=t-s4-frc`. Number-line placements use position = value×1.5
(√2≈1.41, √3≈1.73, √5≈2.24, √7≈2.65, π≈3.14, and negatives); the blind checker read the TikZ
coordinates and agreed every marked position. **Committed as `caafc5c`** (batch 6).

**Pilot gate: human review of pilot outcomes before batch 7 starts.**

### Post-pilot (batches 7–16)

| # | Topic id | Topic title | Skills (stage-3 subset) | Mapped booklet file(s) | Status | Review samples | Anchor gaps |
|---|---|---|---|---|---|---|---|
| 7 | t-s4-int | Computation with integers | 9 (1) | `Computation with Integers.md` | in-review | `compare-order-integers`, `add-subtract-integers`, `order-of-operations-integers` + **diagram list (4: `locate-integers-number-line`, `compare-order-integers`, `add-subtract-positive-integers`, `add-subtract-integers`) for manual visual review** | none (all 9 booklet-covered) |
| 8 | t-s4-rat | Ratios and rates | 22 (0) | `Ratios and Rates 1_Recognise and simplify ratios.md`<br>`Ratios and Rates 2_Solve problems involving ratios.md`<br>`Ratios and Rates 3_Recognise and simplify rates.md`<br>`Ratios and Rates 4_Solve problems involving rates.md`<br>`Ratios and Rates 5_Interpret and construct distance–time graphs from authentic data.md` | in-review | `divide-quantity-in-ratio`, `construct-distance-time-graphs`, `ratios-vs-rates` + **full diagram list (11 skills, 173 `[tikz]`) for manual visual review** | none (all 22 booklet-covered); `ratios-vs-rates` weakest-anchored (definitional prose only — mastery from the dot point) |
| 9 | t-s4-ind | Indices | 14 (0) | `Indices.md` | committed | `surd-product-rule`, `index-laws-establish`, `apply-index-laws-numerical` + **diagram list (4: `estimate-roots`, `prime-factorisation`, `square-cube-roots`, `sqrt-via-prime-factorisation`) for manual visual review** | `surd-product-rule` (booklet under-covers — two calculator items on one number pair; theory and all items beyond those generated from the dot point) |
| 10 | t-s4-equ | Equations | 11 (0) | `Equations 1_Solve 2 step equations.md`<br>`Equations 2_Formulas.md` | committed | `quadratic-two-solutions`, `solve-quadratic-ax2`, `model-word-problems-equations` + **diagram list (2: `equations-from-formulas`, `quadratics-from-formulas`) for manual visual review** | `quadratic-two-solutions`, `solve-quadratic-ax2` (neither booklet teaches the ±/two-solutions reasoning; generated from `dp-s4-equ-3`) |
| 11 | t-s4-len | Length | 10 (1) | `Length 1_Solve problems involving the perimeter of various quadrilaterals and simple composite figures.md`<br>`Length 2_Describe the relationships between the features of circles.md` | committed | `perimeter-composite-arc-figures`, `find-missing-sides-rectilinear`, `circle-features` + **full diagram list (all 10 skills, 263 `[tikz]`) for manual visual review** | none (all 10 booklet-covered) |
| 12 | t-s4-are | Area | 18 (4) | `Area 1_Units Rectangles Parallelograms Triangles.md`<br>`Area 2_Circles and Sectors.md`<br>`Area 3_Quadrilaterals.md` | committed | `area-composite-circles`, `area-using-pythagoras`, `convert-area-units` + **diagram list (17 of 18 skills, 435 `[tikz]`) for manual visual review** | none (all 18 booklet-covered) |
| 13 | t-s4-vol | Volume | 8 (0) | `Volume 1_Describe the different views of prisms and solids that have been formed from prism combinations.md`<br>`Volume 2_Develop and apply the formula to find the volume of a prism to solve problems.md`<br>`Volume 3_Develop the formula for finding the volume of a cylinder and apply the formula to solve problems.md`<br>`Volume 4_Choose appropriate units of measurement for volume and capacity and convert between units.md` | committed | `views-of-prisms`, `volume-capacity-problems`, `find-dimension-from-volume` + **diagram list (7 of 8 skills, 178 `[tikz]`) for manual visual review** | none (all 8 booklet-covered; `find-dimension-from-volume` anchored on scattered Volume 2/3 items rather than a dedicated section) |
| 14 | t-s4-geo | Properties of geometrical figures | 9 (2) | `Properties of Geometrical Figures 1_Classify triangles according to their side and angle properties.md`<br>`Properties of Geometrical Figures 2_Classify quadrilaterals and describe their properties.md`<br>`Properties of Geometrical Figures 3_Apply the properties of triangles and quadrilaterals.md` | in-review | `unknown-sides-angles-figures`, `quadrilateral-hierarchy`, `convex-nonconvex` + **full diagram list (all 9 skills, 185 `[tikz]`) for manual visual review** | none (all 9 booklet-covered) |
| 15 | t-s4-dan | Data analysis | 14 (0) | `Data Analysis.md` | in-review | `skew-and-measures` (`anchor: none`), `draw-conclusions-data` (thin anchor), `summary-stats-frequency-table` + **diagram list (10 of 14 skills, 129 `[tikz]`) for manual visual review** | `skew-and-measures` (booklet never states the mean/median/mode ordering rule — only the mechanism; ordering generated from `dp-s4-dan-3`); `draw-conclusions-data` **partial** (2 of its 6 structural types have a booklet exemplar; the other 4 from `dp-s4-dan-3`) |
| 16 | t-s4-pro | Probability | 7 (0) | `Probability 1_Determine probabilities for chance experiments.md`<br>`Probability 2_Determine probabilities for complementary events.md` | committed | `theoretical-probability`, `probability-range`, `complementary-probability` | — |

**Total: 206 skill-content pairs across 16 topics** (10 of them stage-3 skills → theory
copied byte-for-byte, practice + quiz added).

**Batch 7 (t-s4-int) notes.** First post-pilot batch, and first run at the **new higher
counts** (Part A: foundation/development 6–8, mastery 3–4, quiz 6–8, variety-first;
`coverageNote` escape-hatch available). Generated fresh with Opus, pared workflow — **4
section-owning generators** by dot point: A dp-1 `locate-integers-number-line`[S3] +
`compare-order-integers`; B dp-2 `rewrite-touching-signs` + `add-subtract-positive-integers`
+ `add-subtract-integers` + `directed-number-sentences`; C dp-3
`determine-sign-product-quotient` + `multiply-divide-integers`; D dp-4
`order-of-operations-integers`. (B and C were cut off by a session limit mid-run and
**resumed from transcript** to finish — no quality impact; all files re-validated.) Then
**one fresh blind checker for the whole batch**. atomTypes: `compare-order-integers` &
`locate-integers-number-line` = R; `rewrite-touching-signs` = T;
`determine-sign-product-quotient` = Cat; remainder = R. **STAGE 3 rule** applied to
`locate-integers-number-line` (theory copied byte-for-byte from its existing content file,
verified identical; only practice tiers added + quiz created fresh). No `masteryOmitted`, no
`coverageNote` — every skill reached target honestly (all 9 validate at **0 warnings**).
Final counts landed at foundation 6–8 / development 6–8 / mastery 3–4 / quiz 7 across the
batch.

All 9 `validate --only` clean; whole-batch + full-repo `validate.mjs` clean (0 errors; the
248 repo warnings are the Part-A pilot-backfill targets, not this batch); manifest rebuilt
(238 content / 94 quiz, +9 quizzes — the 9 int content files pre-existed as stage-3/stub
theory). **Blind check: 64/64 quiz MCQ agree, all 40 mastery-practice items agree, 0 UNSURE,
0 mismatches, 0 figure-mismatch flags — no repairs.** The checker read the number-line TikZ
coordinates and agreed every marked position/scale.

**Diagram support extended (post-review human request, 2026-07-19):** the human approved the
batch-7 number lines and asked for **more diagram support in the foundation + development
practice QUESTIONS** to help students. Added, to every foundation + development card of the
three number-line skills: a **blank support number line** in `question_text` (scaled, labelled,
arrowheads, no marks — a scaffold the student uses) and a **worked figure** in `solution_text`
(compare-order: integers marked as dots in order; add/subtract: jump arcs to the answer). Reused
the original section agents so the house style matches. Coverage: `compare-order-integers` 12
question scaffolds + 12 marked solutions (was 0 diagrams → now diagram-bearing);
`add-subtract-positive-integers` 15 + 15; `add-subtract-integers` 16 + 16 (its solution jumps
show the **post-rewrite** movement). Mastery tiers, quizzes, theory, and every answer/working
value left unchanged; all three re-validate `--only` clean, full-repo clean, manifest rebuilt
(238/94, unchanged — only figures added, no card-count change). **Foundation/development cards
are not in the blind bundle (checker sees quiz + mastery only) and no answers changed, so no
re-blind-check was needed** — but the new figures DO need the human's manual visual review.

**Diagram skills flagged for manual human visual review (now 4 carry inline `[tikz]`; the
other 5 are number/word skills, diagram-free):** `locate-integers-number-line` (18 content
number-lines + 7 quiz), `compare-order-integers` (24 content), `add-subtract-positive-integers`
(30 content), `add-subtract-integers` (32 content) — **104 content + 7 quiz `[tikz]` blocks
total**; eyeball via `http://localhost:5173/#/tikz-check?topic=t-s4-int`. Number-line jump arcs
bow upward, filled dot at the start, move labelled above; blank question scaffolds carry no
marks. Watch the wide-range add/subtract figures (highest tick-label density) and the four
two-arc chain figures (reversing move drawn below the line). Not committed — awaiting human
review + commit.

**Batch 8 (t-s4-rat) notes.** Largest batch so far (22 skills), first batch under the **new
standing question-side diagram rule** (see below). Generated with Opus, **5 section-owning
generators** by dot point: A dp-1 `ratios-compare-quantities` + `ratio-part-as-fraction` +
`equivalent-ratios` + `simplify-ratios` + `simplify-ratios-different-units` +
`simplify-ratios-fractions-decimals`; B dp-2 `unitary-method-ratios` +
`divide-ratio-given-difference` + `ratio-real-life-problems`; C dp-3 `ratios-vs-rates` +
`simplify-rates` + `convert-rate-units`; D dp-4 `rate-problems` + `best-buys` +
`related-rates-problems`; E dp-5 `speed-from-distance-time` +
`construct-distance-time-graphs` + `convert-time-decimal-sexagesimal` +
`average-speed-journey` + `calculate-speed-distance-time`. The two remaining skills
(`divide-quantity-in-ratio`, `interpret-distance-time-graphs`) came from the generation-agent
bake-off below. atomTypes: `ratios-vs-rates` = Cat (steps deliberately omitted — "don't force a
procedure"); `ratios-compare-quantities`, `ratio-part-as-fraction`, `equivalent-ratios`,
`convert-time-decimal-sexagesimal` = T; remainder = R. **`masteryOmitted`** (one):
`convert-time-decimal-sexagesimal` ("single-step transformation in either direction"). No
`coverageNote` — every other skill reached target honestly. Final counts: foundation 6–8 /
development 6–7 / mastery 3 / quiz 6–8. All 22 `validate --only` clean; whole-batch and
full-repo `validate.mjs` clean at **0 errors** (the 248 repo warnings are the pre-existing
Part-A backfill targets, unchanged by this batch); manifest rebuilt (**260 content / 116
quiz**, +22/+22).

**Blind check — 2 checkers on whole-skill slices** (22 skills sits at the ~25 threshold but the
bundles are TikZ-dense): checker 1 = sections 1–2 (10 skills), checker 2 = sections 3–5 (12).
**162/162 quiz MCQ and 66/66 mastery items agreed on the first pass — zero answer mismatches
and zero figure mismatches across the batch.** Checker 2 silently omitted
`calculate-speed-distance-time` from its report; that skill was re-checked by a fresh agent
rather than assumed (7/7 + 3/3 agree). **Eight defects were found and repaired, none of them a
wrong answer** — all were classes the validator cannot see:

1. **Equivalent-option ambiguity (2 items).** `simplify-ratios` q2 keyed `8:5` while offering
   `1.6:1`; `simplify-ratios-different-units` q4 keyed `2:5` while offering `1:2.5`. Both
   distractors are *equal* to their key, and sibling skills in this same batch teach the `1:n`
   decimal form as legitimate. Fixed by pinning the stems ("simplest whole-number form"), which
   keeps each distractor's misconception live.
2. **Quiz items cloning their own mastery card (4).** `unitary-method-ratios` q7 ≡ m2,
   `divide-ratio-given-difference` q7 ≡ m1, `simplify-ratios-different-units` q7 ≡ m1,
   `simplify-ratios-fractions-decimals` q7 ≡ m1 — zero extra assessment coverage. Quiz items
   replaced (mastery cards kept); replacements given fresh contexts and, where possible,
   different answers so practice recall gives nothing.
3. **Under-determined construction (1).** `construct-distance-time-graphs` m3 never said *when*
   Cal's 30-minute stop occurred, so many graphs satisfied the stem while the solution showed
   one. Stem now pins the stop; round-2 check confirms exactly one polyline satisfies it.
4. **Physically implausible scenarios (3).** A swimmer at 12 km/h (→ kayak), "Dana's walk" at
   8 km/h (→ time axis rescaled to 4 km/h), Tomas "walking" 2.5 km in 20 min (→ 30 min, 5 km/h).
   Arithmetic was correct in all three; only credibility was wrong.

Plus an **option-equality sweep**: ratio questions are unusually prone to distractors that equal
each other (infinitely many written forms denote one ratio), letting a student eliminate a pair
without doing any maths. All 22 quiz files were audited by canonicalising every ratio-form option
to lowest terms — **0 distractor-equals-distractor collisions and 0 key-equal options under an
unpinned stem** remain; the 12 surviving key-equal options are intentional "did not simplify"
misconceptions, each under a stem that pins the required form.

**Diagram skills flagged for manual human visual review (11 of 22 carry inline `[tikz]`; the
other 11 are rate/number/word skills, deliberately figure-free):** `ratios-compare-quantities`
(8 content / 3 quiz), `ratio-part-as-fraction` (5/1), `equivalent-ratios` (3/1),
`simplify-ratios` (2/1), `unitary-method-ratios` (17/3), `divide-quantity-in-ratio` (11/4),
`divide-ratio-given-difference` (14/2), `ratio-real-life-problems` (3/1),
`interpret-distance-time-graphs` (19/8), `speed-from-distance-time` (21/7),
`construct-distance-time-graphs` (30/9) — **133 content + 40 quiz = 173 `[tikz]` blocks**;
eyeball via `http://localhost:5173/#/tikz-check?topic=t-s4-rat`. Highest-risk first: the
multi-line shared-axes graphs (two ferries, Robyn/Stewart, Bea and Cal, Amara/Kwame — colour +
dash + on-line labels), the 3-panel matching figures using `\begin{scope}[xshift=…]`, the 15
blank/partial construction grids paired with their completed plots, and the 11-cell
Terry/Ash/Felicity bar model at `scale=0.6`.

**Two items left deliberately, for the human to rule on at review:**
- `interpret-distance-time-graphs` m3 (booklet's Robyn/Stewart): Stewart sustains **8 km/h for
  3 h** on a forest track against Robyn's 4 km/h walk. Answer unaffected. Left alone because the
  skill had already had its two repair rounds and the scenario is the booklet's own; lengthening
  Stewart's leg to 4 h (6 km/h) is the fix if wanted.
- `construct-distance-time-graphs` m3: Cal drives at **120 km/h**, above the 110 km/h national
  maximum. Grid-compatible alternative on record: 90 km/h arriving 11:30 am keeps every vertex
  on the existing grid.

**Taxonomy gap found (not a batch defect).** The booklet's **"Combined Rates"** chapter (adding
work rates, `1/20 + 1/25` — two people working together) has **no owning skill in
`data/skills.json`**. It is neither a single-rate application (`rate-problems`) nor a
multiplicative chain (`related-rates-problems`), so it was left unauthored rather than forced
into a neighbouring atom. Candidate new skill for the atomisation queue.

**Booklet erratum.** `Ratios and Rates 1`, §4 Q4c gives `24:60 → 1:2.4`; `60 ÷ 24 = 2.5`, so the
booklet answer is wrong. Different numbers were used rather than reproduce it.

**Committed as `9b8e1fd` at the human's request, ahead of the visual review** (unlike earlier
batches, which were committed only after it). The 173-diagram checklist above is therefore
still outstanding — review it and repair in place on top of that commit.

**Generation-agent bake-off: Opus vs ChatGPT/codex (run inside this batch).** Two independent
agents authored the **same two skills** (`divide-quantity-in-ratio`, a plain number skill, and
`interpret-distance-time-graphs`, TikZ-heavy) from an identical spec, into scratch dirs; a third
Opus agent that had authored nothing reviewed both **with the arm labels stripped**.

- **Both arms validated clean at 0 errors / 0 warnings on the first pass.** Codex needed **zero
  continuations** — one MCP call, ~12 min, no sandbox refusals, no writes outside its output dir
  — and it genuinely read the repo docs (its figures used repo-idiosyncratic Data-displays
  conventions, not generic TikZ). Pipeline compliance was not the problem.
- **The blind reviewer picked Opus on both skills, 6 of 8 criteria.** Codex's hard defects: a bar
  model drawn with **unequal cell widths** (depicting ~1:2.4 for a stated 2:15); a total brace
  drawn along **one bar only**, asserting one share = the whole (3 cards); a practice card asking
  "which story matches the graph?" **with no stories supplied**; **0 of 7 quiz stems carrying
  figures** while its practice siblings did; a likely y-label double-rotation on **all 22**
  pgfplots figures; and **six distractor `why`s naming errors that do not produce the option they
  sit on**. Its 12 foundation+development cards covered only 3 structural types.
- Opus's own defect was one blocking but mechanical item: its distance–time quiz **recycled the
  practice set** (8/8 figures byte-for-byte, 6/8 stems verbatim). Rebuilt on fresh journeys
  before promotion, verified programmatically to share nothing with the content file.
- **Verdict: codex is not yet viable as a generation agent for this pipeline.** It follows the
  runbook and hits the schema; what it lacks is the self-checking that catches a figure
  disagreeing with its own numbers and a distractor rationale that doesn't reach its option —
  precisely the defects that survive review and reach students. (Consistent with the earlier
  ChatGPT batches: row 2 shipped only after heavy repair, row 3 was discarded and regenerated.)
- One transferable lesson was encoded into `docs/tikz-prompt.md`: **never add `rotate=90` to a
  `pgfplots` `ylabel style`** — pgfplots already rotates it and the rotations compose, flipping
  the label upside-down. The raw-TikZ data-display templates remain the house idiom.

**Batch 9 (t-s4-ind) notes.** First **low-diagram** batch since the standing question-side
figure rule came in — and the first to exercise it as a *judgement*, not a quota. Indices are
number/algebra skills; 10 of the 14 are deliberately **figure-free** and the generators were told
in terms that a manufactured decorative figure is a defect, not compliance. Generated with Opus,
**3 section-owning generators by dot point**: A dp-1 `index-notation-terms` +
`evaluate-index-notation` + `order-operations-indices` + `divisibility-tests` +
`prime-factorisation` + `sign-of-powers`; B dp-2 `square-cube-roots` + `estimate-roots` +
`surd-product-rule` + `order-operations-roots` + `sqrt-via-prime-factorisation`; C dp-3
`index-laws-establish` + `zero-index` + `apply-index-laws-numerical`. One generator per dot point
was right-sized at 14 skills on a single booklet. atomTypes: `index-notation-terms`,
`evaluate-index-notation`, `square-cube-roots`, `zero-index` = T; `divisibility-tests` = Cat;
`surd-product-rule` = F; remainder = R. **No `masteryOmitted`, no `coverageNote`** — every skill
reached target honestly. Final counts: foundation 7–8 / development 7–8 / mastery 4 / quiz 7–9.
All 14 `validate --only` clean; whole-batch and full-repo `validate.mjs` clean at **0 errors, 0
warnings on the batch** (the 248 repo warnings are the pre-existing Part-A backfill targets);
manifest rebuilt (**274 content / 130 quiz**, +14/+14).

**Scope lines held.** The three flagged risks all came through: (1) `index-laws-establish` derives
every law by expansion/cancellation, `apply-index-laws-numerical` cites and moves on — checkers
confirmed both sides independently; (2) `order-operations-indices` and `order-operations-roots`
were dealt disjoint exemplars and a programmatic scan found **0 near-duplicate stems** between
them; (3) `surd-product-rule` is held to $\sqrt a\times\sqrt b=\sqrt{ab}$ verification only — no
$a\sqrt b$ simplification, no rationalising, no unlike-surd addition. `sign-of-powers` owns every
negative-base item in the batch; `evaluate-index-notation` is positive-bases-only. Stage-5
material excluded throughout (the booklet is riddled with it): negative, fractional and decimal
indices — including the `x^{0.5}=√x` derivation at L3428–3451 — algebraic bases/indices, and
re-basing to a common prime base (`express-common-prime-base`).

**Equivalent-option audit (new step 3) run before every check:** 111 questions / 432 options, 61%
canonicalised, **0 defects, 0 intended key-equal options**. The indices equivalence trap never
opened because form-pinning stems ("as a basic numeral", "in index form", "as a single power", "as
a single square root") are applied consistently; all three checkers verified this by hand as well.

**Blind check — 3 rounds, 358 items re-solved, ZERO answer mismatches.** Round 1: one fresh
checker over all 14 skills, 167 items. Round 2: fresh checker over the 11 repaired skills, 132
items. Round 3: fresh checker over the 5 further-repaired skills, 59 items. One apparent
disagreement was adjudicated as a **checker slip, not a content defect** (`sign-of-powers` m4: the
round-1 checker named only $-3^{18}$ as negative where the key correctly names $(-3)^{17}$ **and**
$-3^{18}$). No figure contradicted its answer in any round — checkers decoded the `estimate-roots`
number line coordinate-by-coordinate (point B at 4.90 against $\sqrt{24}=4.899$) and confirmed
every factor tree multiplies back.

**The yield was entirely in the cold read, and it was one systematic defect: quiz items cloning
their own practice cards.** Batch 8 saw 4 such clones; batch 9 had **21**. The generators wrote
the mastery-tier quiz item by copying the mastery card verbatim in 7 of 14 skills, and additionally
cloned foundation/development cards. Worst case: `prime-factorisation` q9 ≡ m3 **including a
byte-identical TikZ figure**. Note the blind bundle only exposes quiz + mastery, so the
foundation/development clones were invisible to the checkers and were caught by an orchestrator-side
programmatic stem scan — **that scan should become a standing step**; an early run of it with a
minimum-stem-length filter hid a second cluster (five of eight quiz items in
`order-operations-indices`), so run it with no length filter and with figures included.
Also repaired: `square-cube-roots` q2/q4 both resolving 216→6; the $\sqrt{9+16}$ counterexample
duplicated across `surd-product-rule` m3 and `order-operations-roots` q8; six distractors no
identifiable slip produces; `apply-index-laws-numerical` q4 asking the student to *name* a law
(the `index-laws-establish` side of the split); and `sign-of-powers` m1's algebraic base
($x^{2}=564$), rephrased without the pronumeral to keep clear of the excluded $\pm$ reasoning.

**Repair budget exhausted on 8 skills — remaining flags left for the human, deliberately not
looped.** The runbook's 2-round cap proved itself: round 1 replaced a dead `square-cube-roots` q6
distractor ($4$) with $36$, and round 3 flagged $36$ as equally unreachable. Repairs had begun
generating fresh instances of the class they fix, which is exactly the "a rewrite reintroduces new
defects" failure the cap exists to stop. **Outstanding, all construction-quality, none affecting an
answer:**
- `evaluate-index-notation` q2 ($10^{5}\to100\,000$) and q5 ($1\,000\,000\to10^{6}$) are one fact
  run forwards and backwards, each holding the other's key as a distractor. Fix: renumber q5.
- `order-operations-indices` q1 distractor $33$ — no nameable slip.
- `sign-of-powers` m1 uses $564$, not a perfect square, inviting a hunt for an integer that does not
  exist. Fix: $564\to576$ throughout; reasoning unchanged.
- `square-cube-roots` q5/q6 are adjacent roots-of-powers-of-3 sharing 3 of 4 option values, **each
  item's key sitting as the other's distractor**; q6 distractor $36$ unreachable from $\sqrt[4]{81}$;
  q2 distractor $8$ is q4's key.
- `order-operations-roots` q1 and q3 both answer $10$ and both offer $10$ and $14$; q8's roots are
  decorative (a power substitutes with no change to the reasoning), so it arguably belongs to
  `order-operations-indices`; q8 distractor $81$ weak.
- `divisibility-tests` q6's answer pre-supplies m3's key step ($4$ and $5$ ⇒ $20$).
- Option counts vary 3 vs 4 within some quizzes (`order-operations-roots` q3, `divisibility-tests`
  q5/q6).

**Checker flags adjudicated as NOT defects** (recorded so they are not re-raised): (a) a quiz item
sharing a *structural type* with a mastery card but using different numbers and a different answer
is required coverage, not duplication — only verbatim clones were repaired; (b)
`apply-index-laws-numerical` m2's use of $4^{0}$ is in scope — `zero-index` is its **direct prereq**
and is generated in this same batch; (c) the higher roots in `square-cube-roots` q6/m3
($\sqrt[4]{81}$, $\sqrt[10]{1024}$) are the booklet's own Cube Roots Q4/Q5 — pure root notation, not
fractional indices; (d) the re-basing in `index-notation-terms` q8/m2 ($3^{4}\to9^{2}$,
$2^{6}\to4^{3}$) is booklet Square Roots Q11 (write 64 four ways) — Stage 4, and distinct from the
stage-5 common-prime re-basing. **(c) and (d) are the two rulings most worth the human confirming.**

**Automated vision gate retired — diagram skills flagged for manual human visual review (only 4 of
14 carry inline `[tikz]`; the other 10 are number/symbolic skills, deliberately figure-free):**
`estimate-roots` (26 content number lines + 2 quiz), `prime-factorisation` (13 factor trees + 3
quiz), `square-cube-roots` (8 + 4), `sqrt-via-prime-factorisation` (8 + 0) — **55 content + 9 quiz
= 64 `[tikz]` blocks**; eyeball via `http://localhost:5173/#/tikz-check?topic=t-s4-ind`. The
`estimate-roots` lines follow the batch-7 idiom (blank scaled support line in every foundation +
development question, bounding interval and marked point added in the solution). Highest-risk
first: the relabelled `square-cube-roots` q4 cube ($512\text{ cm}^{3}$ ↔ 8 cm edge — verified in
source by two checkers but not yet by eye), the new `prime-factorisation` q9 three-leaf tree
authored during repair, and the wide-range number lines with the densest tick labels.

**Booklet erratum.** `Indices.md` L2255–2257 (Evaluate Expressions with Roots, Foundation Q1i)
prints $\sqrt9\times\sqrt{64}\div\sqrt{36}$ with answer $2$; the correct value is $4$
($3\times8\div6$). Authored as $4$. Also noted, all in stage-5 material and therefore unused:
Index Law of Division Q3 has duplicated part labels with a misaligned answer column, and Mixed
Practice Q3g gives $6^{-5}$ for $6^{-3}\times6^{2}$ (should be $6^{-1}$).

**Taxonomy note.** The booklet's `HCF and LCM using Prime Factorisation` chapter (L3568–3798) was
deliberately not authored — `hcf-two-numbers` / `lcm-two-numbers` shipped in batch 6 (`t-s4-frc`).
**Committed as `560fa20`** (batch 9). Diagram checklist above still outstanding — review and repair in place on top of that commit.

**Batch 10 (t-s4-equ) notes.** **First batch on the revised pipeline** — deterministic gate
before any checker, and the blind check on a *different* model (`gpt-5.6-luna` via `codex exec`).
Generated with Opus, **5 section-owning generators**: A `expression-vs-equation` +
`solve-one-step-equation` + `verify-solutions-substitution` (E1 §Algebraic Equations, §Inspection,
§Equivalent Equations, §Inverse Operations, §One-Step); B `solve-linear-2-step` +
`solve-equation-negative-coefficient` (E1 §Two-Step, §Negative Coefficients, §Grouping,
§Expanding Method, §Mixed Practice); C `solve-equation-x-both-sides` +
`model-word-problems-equations` (E1 §x on Both Sides, §Writing Equations from Scenarios,
§Problem-Solving, §Further Problem-Solving, + E2 §Challenge Exercise); D `equations-from-formulas`
+ `quadratics-from-formulas` (E2 §Substitution into Formulas, §Solving for an Unknown after
Substitution); E `quadratic-two-solutions` + `solve-quadratic-ax2` (dot point). atomTypes:
`expression-vs-equation` and `quadratic-two-solutions` = Cat; remainder = R. **No stage-3 subset**
— all 11 were fresh generates with no pre-existing content file. **No `masteryOmitted`, no
`coverageNote`** — every skill reached target honestly. Final counts: foundation 7–8 /
development 7–8 / mastery 3–4 / quiz 7–8. Full-repo `validate.mjs` clean at **0 errors, 0 warnings
on the batch** (the 248 repo warnings are the pre-existing Part-A backfill targets); manifest
rebuilt (**285 content / 141 quiz**, +11/+11).

**Figure policy — deliberate, confirmed with the human before generation.** Only agent D's two
formula skills are figure-bearing (**18 `[tikz]` blocks total**); the other 9 skills are
symbolic and **deliberately figure-free**. E1's balance-scale images (image3–image6) were ruled
decorative for symbolic solving cards and the equivalence idea is carried in prose. A/B/C/E were
told in their spawn prompts not to open `docs/tikz-prompt.md` at all — the batch-9 finding that
"just in case" reads of it cost ~150k duplicated tokens.

**Deterministic gate (new step 3) — clean batch-wide on the first run.** 281 items / 86 quiz
questions / 342 options; validate 0 warnings, equivalent-options 0 defects (39% of options
canonicalised, 0 intended key-equal), duplicate-stems 0 across all four classes **including 0
near-dup advisories**, option-hygiene 0 leaked keys / 0 vague `why`s. **The batch-9 clone class
did not recur** — the generators cleared the gate on their own skills before reporting, and three
of them self-repaired near-dups mid-run (agent E reworded a `x^2=-49` quiz stem and re-cut
`4x^2=36`→`9x^2=36`; agent C re-cut a mastery MCQ to `4(x+3)=6(x-1)`). The gate is the reason
this batch needed one check round instead of three.

**Blind check — luna, one packet per skill, `--resolve-mode figures-first`. All 11 OK, zero
retries. 125/125 items re-solved, ZERO answer mismatches, `itemsAnswered == itemsReceived` on
every skill.** This is the first batch where a mismatch would have been meaningful evidence (a
different model, not a correlated reasoner) — there were none. One formatting-equivalence
accepted: `equations-from-formulas` q5, luna's `$11\text{ cm}$` vs the key's `$11$ cm`.

**7 flags — 4 adjudicated INVALID, 3 valid. Majority-invalid round → repairs applied, no second
check round spawned** (runbook stopping rule; batch 9's round 3 is the measured precedent).

INVALID (recorded so they are not re-raised):
- `solve-linear-2-step` q8 (`3(x+4)+5x=44`) and m2 (`4(x-5)+4x=20`) flagged **scope** as "beyond
  two-step". Both are the booklet's own §Expanding Method material — the worked example is
  `3(x+5)+4x=29` (L2741) and m2 is practice item 217d **verbatim** (L2913). All x-terms sit on one
  side (this is not `solve-equation-x-both-sides`), and after collecting it *is* a two-step
  equation. NOT-A-DEFECT rule: booklet-anchored content is in scope near a stage boundary.
- `solve-equation-negative-coefficient` q4 (`$x=-64$`) and q5 (`$x=-7$`) flagged as
  **unreachable distractors**. Both are produced by the standard move-the-constant-with-the-wrong-
  sign slip — q4: $-\frac{x}{4}=10+6=16 \Rightarrow x=-64$; q5: $20+8=28=-4x \Rightarrow x=-7$.
  Luna's suggested alternative for q5 ($x=3$) is already the *other* distractor.

VALID — all three repaired, all **stem-wording only** (no option value, key or answer changed, so
no misconception→derivation chain was owed):
1. `quadratics-from-formulas` q3 — `$v^2=u^2+2as$` with `v` a bare symbol, no units and no context,
   so $v=\pm10$ is defensible while the skill's convention is to justify the positive root *from
   context*. Stem now reads "gives the final speed $v$ m/s of an object".
2. `quadratics-from-formulas` m4 — same defect; its solution already said "since a speed cannot be
   negative" while the stem never said these were speeds. Stem now names $u$, $v$ as speeds in m/s.
3. `quadratics-from-formulas` m1 — the rectangle's **horizontal** side is the labelled 24 cm, so
   "find the width" pointed at the given value rather than the unknown. Changed to "find the
   height" (solution reason updated to match). Answer unchanged at 10 cm.

Plus one wording tightening luna's flag indirectly surfaced: `solve-equation-negative-coefficient`
q4's `why` said "Added $6$ to both sides" while its stated derivation line is
$-\frac{x}{4}=16$ — reworded to "Moved the $6$ across as $+6$ instead of subtracting it". Value
unchanged. Full deterministic gate re-run after every edit, clean.

**Orchestrator-side reword sweep** (the class the byte-level gate cannot see): all 86 quiz stems
scored against every practice card of the same skill. 17 pairs above 0.55 Jaccard, **all of them
the required-coverage pattern** (same structural type, fresh numbers, different answer value) —
the 1.00 scores are bare "Solve $\frac{x}{5}+4=9$"-style stems whose token sets normalise
identically. Closest genuine pair hand-checked: `equations-from-formulas` d0 vs q5 both use the
trapezium and $A=72$ cm², but ask for **different unknowns** ($h$ vs $b$), carry different figures
and different answers (9 vs 11), and all three q5 distractor chains derive correctly. No rewording
defects.

**Diagram skills flagged for manual human visual review (only 2 of 11 carry inline `[tikz]`; the
other 9 are symbolic, deliberately figure-free):** `equations-from-formulas` (6 content + 3 quiz),
`quadratics-from-formulas` (6 content + 3 quiz) — **12 content + 6 quiz = 18 `[tikz]` blocks**;
eyeball via `http://localhost:5173/#/tikz-check?topic=t-s4-equ`. Highest-risk first, per the
authoring agent: (1) the **stepped T-shape** (`equations` dev card 3) — hand-built 8-vertex layout,
no fixed template, seven labels in two notch regions, and the only figure whose proportions were
re-derived after a number change ($p=8, q=3$) so the drawing would not imply $q>p$; (2) the
**irregular hexagons** (`equations` dev card 2 and quiz q8) — coordinates solved by hand so the
alternating edge lengths match the answer ratio, `node[midway,right]` labels on the two right-hand
slants most likely to collide; (3) the **annulus pair** (`quadratics` dev card 7 and quiz q5) —
check the `8 cm` radius label does not sit on the inner circumference; (4) the **trapezium
solution figure** (`equations` dev card 1) — dashed perpendicular height plus a right-angle square
at the foot.

**Anchor gaps.** `quadratic-two-solutions` and `solve-quadratic-ax2` are **`anchor: none`** —
verified by grep, not assumed: `Equations 1` mentions $x^2$ only in its expression-vs-equation
classification tables (L270, L284), and `Equations 2`'s squared items ($V^2=gR$, $S=2\pi r^2$,
$v^2=u^2+2as$, L574–586) are physical contexts that take the positive root **silently**. Both
skills were generated from `dp-s4-equ-3` / MA4-EQU-C-01, using the booklet only for the rounding
convention ("2 decimal places where appropriate") and difficulty register; no booklet numbers,
formulas or scenarios were reproduced. The generator deliberately converted the booklet's silent
positive-root drop into **explicit rejection with a stated reason**. House form for a ± answer,
used consistently across both files: `$x=\pm 6$` — never `$6, -6$`. Both are in the review samples.

**Scope lines held.** No symbolic transposition of formulas anywhere (agent D substitutes first,
then solves — the Stage-5 change-of-subject line); no simultaneous equations; no $x^2+bx+c=0$
solving (E1's `x^2+4x+4=0` at L284 is used **only** as a classification exemplar); no factorising,
quadratic formula or completing the square. Agent boundaries held on inspection: B carries zero
negative coefficients in `solve-linear-2-step` and zero word problems; C carries no bare two-step
drill; A used bare equations only, no formulas; D authored no bare $ax^2=c$ drill and cites rather
than re-derives E's two-solutions reasoning; E authored no formula-substitution card.

**Booklet errata found (5, none reproduced).**
- `Equations 1` §Expanding Method Foundation Q1 (L2775–2792): prompt says "Compare these two
  methods of solving $3(x+1)=18$" but both worked methods use $3(x+1)=15$ and give $x=4$.
- `Equations 1` §Equations with Grouping Q2 (L2596–2605): student named "Jerry" in the stem and
  "Jericho" in part (a).
- `Equations 1` §Two-Step Q7b (L1951–1953): after dividing first, writes $x=\frac{15}{5}=3$ where
  the line should read $x=\frac{17}{5}-\frac{2}{5}$; the final answer $3$ is correct.
- `Equations 1` §Solving Equations by Inspection (L235): "Verify whether $x=6$ is a solution of
  $15=3x$" has no answer printed; it is **not** a solution. Authored as a false case.
- `Equations 1` §Problem-Solving Q22: gives `x + x + (x+4) + (x+4) = 13 cm`, setting the equation
  equal to the *answer* rather than the perimeter 60; the correct model is `2x + 2(x+4) = 60`,
  giving `x = 13`. The corrected form was authored.

**Cost, vs batch 9's 49 min / 1.04M.** Wall clock **24m45s** (02:09:46Z → 02:34:31Z) — **half of
batch 9** — at **~0.75M tokens** (663k across the five generation agents: A 129k, B 124k, C 157k,
D 159k, E 95k; plus orchestrator; luna's tokens are external to the Claude budget). The saving is
structural, not luck: one check round instead of three (the gate caught the clone class before any
model read the items), and four of five agents skipping `tikz-prompt.md` entirely. The 11-skill
batch is also smaller than batch 9's 14, so the per-skill figure is ~68k vs batch 9's ~74k;
**the round count is where the win is.** Luna wall-clock: 24s–126s per skill at concurrency 4,
zero retries, no fallback to a Claude checker needed.

**`--resolve-mode` A/B not run** (owner instruction — the human is judging output quality by hand
this batch), so `figures-first` is exercised but not yet measured against `full`.

**Committed as `092ed41`** (batch 10), together with the pipeline commit `1bbcf96` (deterministic gate + luna checker). Diagram checklist above still outstanding — review and repair in place on top of that commit.

**Batch 11 (t-s4-len) notes.** First **fully figure-bearing** batch under the revised pipeline
(every one of the 10 skills carries inline `[tikz]`, so all four generators read
`docs/tikz-prompt.md` — the opposite of batch 10). Generated with Opus, **4 section-owning
generators**: A `Length 1` §Units of Length + §Perimeter of Polygons + §Perimeter of L-Shapes =
`perimeter-2d-shapes`[S3] + `find-missing-sides-rectilinear` + `perimeter-composite-figures`;
B `Length 1` §Solving Perimeter Problems = `find-side-from-perimeter`; C `Length 2` §Features of
Circles + §Circumference (incl. the Pi investigation) = `circle-features` + `pi-definition` +
`circumference-circle`; D `Length 2` §Arc Length + §Finding the Radius given Circumference +
§Perimeter of a Sector + §Perimeter of Shapes Involving Arc Length = `arc-length-perimeter-sector`
+ `find-radius-from-circumference` + `perimeter-composite-arc-figures`. atomTypes:
`circle-features` = Cat, `pi-definition` = F, remainder = R. **No `masteryOmitted`, no
`coverageNote`** — every skill reached target honestly. Final counts: foundation 6–9 /
development 6–8 / mastery 3–4 / quiz 7–8. Whole-batch `validate.mjs` clean at **0 errors, 0
warnings**; full-repo clean (the 248 repo warnings are the pre-existing Part-A backfill targets);
manifest rebuilt (**294 content / 151 quiz**, +9 content — `perimeter-2d-shapes` already existed —
and +10 quizzes).

**STAGE 3 rule applied to `perimeter-2d-shapes`.** Its content file held `skillId`/`atomType`/
`theory` only. The `theory` object was copied byte-for-byte (orchestrator re-verified against
`git show HEAD:` — identical); only `practice` was added and the quiz created fresh.

**Two owner decisions taken before generation.**
1. **Mixed units: FULL coverage.** The `Length 1` "perimeter involving different units" material is
   authored as real content in `perimeter-2d-shapes` (T5, 6 cards) and `perimeter-composite-figures`
   (C6, 3 cards) plus 3 cards in `find-side-from-perimeter`, accepting the overlap with the stage-3
   `length-perimeter-problems` atom (kept apart by being figure-anchored polygon/composite
   perimeters, not worded length problems). **Every mixed-unit stem states the required answer
   unit**, so no `1.08 m` vs `108 cm` equivalence opens — the equivalent-option audit canonicalised
   72% of options with 0 defects.
2. **Sector angles: exterior-angle derivation allowed.** `arc-length-perimeter-sector` dev cards 1–2
   and quiz q3 mark the exterior angle ($100^{\circ}\to260^{\circ}$, $90^{\circ}\to270^{\circ}$,
   $120^{\circ}\to240^{\circ}$); a clear minority. Because the prereq `sector-interior-angle`
   (`t-s4-are`, batch 12) has **no content file yet**, the angles-at-a-point-sum-to-$360^{\circ}$
   fact is stated in one line of that skill's `theory.facts`.

**Deterministic gate clean batch-wide on the first run** (259 items / 80 quiz questions / 318
options): validate 0 warnings, equivalent-options 0 defects and 0 intended key-equal, duplicate-stems
0 across all four classes **including 0 near-dup advisories**, option-hygiene 0 leaked keys / 0 vague
`why`s. Generators cleared it on their own skills first; agent A self-repaired one near-dup mid-run
(a regular-hexagon quiz stem re-cut as a mixed-unit rhombus), and agent C split its
`circle-features` quiz `structure` slugs per case because a shared `name-straight-line-feature` slug
made each item's vocabulary distractor another item's key.

**Blind check — luna, one packet per skill, `figures-first`. All 10 OK, zero retries. 112/112 items
re-solved, coverage complete on every skill (`itemsAnswered == itemsReceived`), ONE answer
mismatch.**
- `perimeter-composite-figures` q8 — luna chose $470$ cm, key $520$ cm. **Adjudicated: checker slip,
  content correct.** The eight sides are $30+50+50+50+40+90+120+90=520$; the unlabelled notch top is
  $120-30-40=50$ (and the figure's uniform scale agrees, $0.5$ units against $0.3$ units ↔ $30$ cm).
  $470$ is exactly the item's own modelled "left the notch width out" distractor.

**15 flags — 12 adjudicated INVALID, 3 valid. Majority-invalid round → the 3 fixes applied, no
second check round spawned** (runbook stopping rule).

INVALID (recorded so they are not re-raised):
- **`perimeter-2d-shapes`, 7 scope flags** (pentagon q3, quadrilateral q4, rhombus q7, trapezium q8,
  m1, regular octagon m2, kite m3 — "outside the skill's stated focus on squares, rectangles and
  triangles"). Luna judged against the skill card's **stage-3 blurb**. The content is anchored on
  `dp-s4-len-1`, whose text is *"perimeter of various **quadrilaterals** and simple composite
  figures"*, and on the booklet's §**Perimeter of Polygons** (which drills pentagons and regular
  polygons). NOT-A-DEFECT: booklet-anchored content is in scope. **For the human:** the skills.json
  blurb ("squares, rectangles and triangles") is now stale for this skill's Stage-4 role — a blurb
  update is the right fix, not a content cut.
- **`find-radius-from-circumference`, 4 scope flags** (q7, m1, m2, m3 — "requires the arc-length
  formula, outside this skill and its prerequisites"). These are the booklet's own §Finding the
  Radius given Circumference mastery items (radius from a given arc length; the frisbee item bends
  an arc into a new circumference), so they are booklet-anchored and kept. **But luna's underlying
  observation is a real data gap and is left for the human:** `arc-length-perimeter-sector` is a
  *sibling* in this batch, not a listed prereq of `find-radius-from-circumference` — consider adding
  it to that skill's `prereqs` in `data/skills.json` (no cycle: arc-length's prereqs are
  `circumference-circle`, `sector-interior-angle`, `fraction-decimal-quantity-problems`).
- **`perimeter-composite-arc-figures` q8 unreachable distractor** ($13.72$ m). Reachable and stated:
  omitting the $8$ m straight end gives $2x=40-12.566=27.43$, $x=13.72$. The other two also derive
  ($19.43$ = not halved; $3.43$ = full $\pi d$ for the cap).

VALID — all three repaired, **no option value, key or answer changed**, so no
misconception→derivation chain was owed:
1–2. `find-missing-sides-rectilinear` q8 and mastery m2 said "the two **dashed** sides are equal"
   while the figures draw solid sides carrying tick marks. Reworded to "the two sides marked with
   dashes are equal" (the booklet's own vocabulary — "Dashes show equal lengths"). The
   "The dashes show…" solution lines and the `perimeter-2d-shapes` usages were already unambiguous
   and left alone.
3. `pi-definition` q2 duplicated q1 — same `compute-c-over-d` task, same $2$ d.p. pin, only the
   numbers differed. **Deleted** rather than re-cut: q1 and q3 (radius-marked case) still cover the
   type, every structural type retains ≥1 MCQ, and the quiz lands at 7 items, above the warn floor.
   A replacement item would have introduced four fresh option values for no coverage gain.
Full deterministic gate re-run after the edits — clean.

**Scope lines held.** No area anywhere (`area-of-circle`, `sector-interior-angle`,
`halve-diameter-for-radius` are batch 12); no radians; no circle angle theorems; no cylinders; no
Pythagoras inside a composite (the $9$–$12$–$15$ / $5$–$12$–$13$ / $6$–$8$–$10$ triples in agent D's
figures are stated, never derived). Agent boundaries held on inspection:
`find-missing-sides-rectilinear` answers are always a **side**, `perimeter-composite-figures` always
a **perimeter**, `find-side-from-perimeter` always starts from a **given perimeter**;
`pi-definition` carries no circumference-formula drill and `circumference-circle` no solve-for-$r$
item. Two booklet items were deliberately **cut**: §Perimeter of a Sector Q9 (find $r$ from $P$ and
$\theta$ — needs $r$ factored out, above Stage 4) and §Circumference Q12 (a mass spun through
$4230^{\circ}$, i.e. a partial revolution = an arc length, which belongs to
`arc-length-perimeter-sector`).

**Taxonomy note (not a batch defect).** `Length 1` §**Units of Length** (choose the appropriate
unit; convert mm↔km) has **no owning skill in this topic** — it is `convert-length-units` (stage 3,
`t-s3-gm-b`, content already shipped). The chapter was therefore not authored; only unit conversion
*in service of* a perimeter appears.

**Booklet errata found (8, none reproduced).**
- `Length 1` §Solving Perimeter Problems worked-example figure (`image86`) marks a right angle on a
  $16$/$34$/$25$ triangle, which Pythagoras contradicts; the right-angle mark was dropped.
- `Length 1` §Units of Length Q7 answers "$40$ mm $\div 500 = 0.08$ mm" without showing the
  $4$ cm $\to 40$ mm step; the answer is right.
- `Length 2` §Circumference Q7 answer prints "125 66 m" for $12\,566$ m; Q8's answer says "20 cm
  radius" where the question says $20$ mm; Q4's answer says "a radius of $9$ m is the same as a
  diameter of $18$ **cm**" (should be m); Q15's working labels the sea-level case "At 5000 feet".
- `Length 2` §Perimeter of a Sector Q7 solution prints
  $40=\frac{\pi}{360}\times20\pi+20$ — `\pi` where `\theta` belongs; the final $114.6^{\circ}$ is
  correct.
- `Length 2` §Finding the Radius Q9 sums $40077.2974-40071.043$ (should be $40071.0143$); the
  $\approx2\pi$ answer still holds.

**Automated vision gate retired — diagram skills flagged for manual human visual review: ALL 10
carry inline `[tikz]`, 263 blocks total** (195 content + 68 quiz): `perimeter-2d-shapes` (22/8),
`find-missing-sides-rectilinear` (29/8), `perimeter-composite-figures` (27/8),
`find-side-from-perimeter` (22/8), `circle-features` (14/7), `pi-definition` (7/2),
`circumference-circle` (12/6), `arc-length-perimeter-sector` (26/8),
`find-radius-from-circumference` (10/5), `perimeter-composite-arc-figures` (26/8); eyeball via
`http://localhost:5173/#/tikz-check?topic=t-s4-len`. Highest-risk first: (1) the **rectilinear
L/U/T/staircase figures** with `tickmark`-decorated equal sides (`find-missing-sides-rectilinear`,
`perimeter-composite-figures`) — check the tick marks read as dashes and that no notch label
collides; (2) the **arc composites** (`perimeter-composite-arc-figures`) — semicircular caps vs
notches, the quadrant-removed square, and the four-semicircle figure, where a concave arc drawn
convex would contradict its answer; (3) the **sector figures** with a marked exterior angle
(`arc-length-perimeter-sector` d1/d2, q3) — the arc must span the *interior* region, not the marked
one; (4) `circle-features` multi-label figures (tangent touching without entering, segment vs sector
shading).

**Committed as `60f1793`** (batch 11). The 263-block diagram checklist above is outstanding —
review and repair in place on top of that commit.

**Visual-review repair #1 (2026-08-02, during batch 12).** The human's eyeball pass caught the
central-angle figures in `perimeter-composite-arc-figures`: quiz q7 (`16` cm base, `6` cm sides,
`r=10`, `106.3^{\circ}`) and development[3] (`10` mm base, `12` mm sides, `r=13`, `45.2^{\circ}`).
Both drew the labelled central angle with **only one bounding radius** — the arc mark had no
visible second arm, so the marked sector was ambiguous — and both let the angle label collide with
the radius label, because text renders at a fixed point size and these pictures were drawn small
(`scale` `1.0` / `1.15`). Repaired per [tikz-prompt.md](tikz-prompt.md): **both** radii now drawn
dashed to the two top corners (which are exactly the polar points `36.87:2`/`143.13:2` and
`67.38:2.08`/`112.62:2.08` — verified, they land on `(±1.6,1.2)` and `(±0.8,1.92)`), the angle arc
widened and kept on the bisector, the radius label moved further out along its own arm with
`fill=white`, both labels dropped to `font=\small`, and the pictures enlarged to `scale` `1.5` /
`1.6`. **No dimension, angle or answer changed** ($46.55$ cm and $44.26$ mm both re-derived), so no
re-check was owed. An angle-arm audit was then run over **all 22 degree-labelled figures in
`t-s4-len` and all 38 in `t-s4-are`** — these two were the only offenders; every other figure draws
both arms or uses `\pic` (which constructs its own). Gate + full-repo validate clean after the fix.

**Batch 12 (t-s4-are) notes.** Largest fully figure-bearing batch so far (17 of 18 skills carry
inline `[tikz]`), and the batch with the **biggest stage-3 subset** (4). Generated with Opus,
**7 section-owning generators**: A `Area 1` §Converting Units of Area = `choose-area-units` +
`convert-area-units`; B `Area 1` §Squares and Rectangles + §Parallelograms + §Triangles =
`area-of-rectangle`[S3] + `area-of-parallelogram`[S3] + `area-of-triangle`[S3]; C `Area 1`
§Mixed Practice + §Composite Figures + §Finding Unknown Sides Given the Area =
`area-composite-figures`[S3] + `find-unknown-side-from-area`; D `Area 2` §Area of a Circle +
§Area of a Sector = `halve-diameter-for-radius` + `area-of-circle` + `sector-interior-angle` +
`area-of-sector`; E `Area 2` §Mixed Practice + §Composite Figures involving Circles + §Finding
the Radius Given the Area + §Challenge = `area-composite-circles` + `find-unknown-from-circle-area`;
F `Area 3` §Kites and Rhombuses + §Trapezium = `area-kite-rhombus` + `area-trapezium` +
`find-unknown-from-trapezium-area`; G `Area 3` §Composite Figures with Special Quadrilaterals +
§Problems involving Pythagoras' Theorem = `area-composite-quadrilaterals` + `area-using-pythagoras`.
atomTypes: `choose-area-units` = Cat, `halve-diameter-for-radius` and `sector-interior-angle` = T,
remainder = R. **One `masteryOmitted`:** `sector-interior-angle` ("Atom is the single subtraction
$360^{\circ}-$ exterior angle; every harder twist needs equation solving or the sector-area
routine, both outside this atom") — the correct result, not a shortfall, and nothing was reached
in from `area-of-sector`. No `coverageNote`. Final counts: foundation 8–12 / development 7–10 /
mastery 3–4 / quiz 8–10. Whole-batch `validate.mjs` clean at **0 errors, 0 warnings**; full-repo
clean (the 248 repo warnings are the pre-existing Part-A backfill targets); manifest rebuilt
(**308 content / 169 quiz**, +14 content — the four stage-3 files already existed — and +18
quizzes).

**STAGE 3 rule applied to all four stage-3 skills** (`area-of-rectangle`, `area-composite-figures`,
`area-of-parallelogram`, `area-of-triangle`). Each content file held `skillId`/`atomType`/`theory`
only and had no quiz. The `theory` objects were copied byte-for-byte and the orchestrator
**re-verified all four independently against `git show HEAD:`** — identical, `atomType` unchanged,
`practice` the only added key. Quizzes created fresh.

**Two `data/skills.json` fixes carried in from batch 11, both approved by the owner before
generation.**
1. `perimeter-2d-shapes` blurb → *"Find the perimeter of squares, rectangles, triangles and other
   polygons."* The old blurb ("squares, rectangles and triangles") was stale for the skill's
   Stage-4 role on `dp-s4-len-1` and was the sole cause of luna's 7 false scope flags in batch 11.
2. `find-radius-from-circumference` prereqs → `arc-length-perimeter-sector` added. Graph-legal
   (both stage 4, no cycle, no dependents downstream); makes that skill's booklet-anchored
   arc-based mastery items honestly reachable and retires the recurring false scope flag.

**Carried-forward ruling: `arc-length-perimeter-sector` KEEPS its inline 360° line.** Now that
`sector-interior-angle` has content, `arc-length-perimeter-sector`'s `theory.facts[3]` ("Angles at
a point add to $360^{\circ}$ …") stays as **reinforcement** rather than being deleted. It is a
one-line in-service statement of a prereq fact — house style — carries no drill, and removing it
would strand that skill's own exterior-angle dev cards (d1/d2, q3) with unmotivated working.
`sector-interior-angle` is nonetheless the owning atom for the routine. Do not re-litigate.

**Deterministic gate clean batch-wide on the first run** (512 items / 155 quiz questions / 612
options): validate 0 warnings, equivalent-options 0 defects and 0 intended key-equal (25% of
options canonicalised), duplicate-stems 0 across all four classes **including 0 near-dup
advisories**, option-hygiene 0 leaked keys / 0 vague `why`s. Generators cleared it on their own
skills first; agent D self-repaired one near-dup mid-run (a `sector-interior-angle` quiz item that
reworded its own quadrant foundation card with a byte-identical figure, re-cut as a re-oriented
quadrant asking for the *exterior* angle).

**Form-pinning was the batch's headline instruction and it held.** Area is the equivalent-option
trap ($1\text{ m}^2=10\,000\text{ cm}^2$, plus exact-vs-rounded on every circle answer). Every
stem names the answer unit and either the decimal places or "in exact form, in terms of $\pi$";
the audit needed the intended-key-equal escape hatch **zero** times.

**Blind check — luna, one packet per skill, `figures-first`. All 18 OK, zero retries. 199/199
items re-solved, coverage complete on every skill (`itemsAnswered == itemsReceived`), ONE answer
mismatch.**
- `convert-area-units` q10 — luna chose $2500$ and $2\,500\,000$; key $25\,000$ and
  $2\,500\,000$. **Adjudicated: checker slip, content correct.** $2.5\text{ m}^2\times100^2 =
  25\,000\text{ cm}^2$, then $\times10^2 = 2\,500\,000\text{ mm}^2$. Luna picked the item's own
  modelled "used $1000$ for the first step" distractor, which coincidentally lands on the same
  *final* value — it checked the second gap and not the first.

**11 flags — 9 adjudicated INVALID, 2 valid. Majority-invalid round → the accepted fixes applied,
no second full check round spawned** (runbook stopping rule).

INVALID (recorded so they are not re-raised):
- **`area-of-triangle`, 6 unreachable-distractor flags** (q1, q2, q3, q5, q7, q8 — the
  $\tfrac12(b+h)$ "average" option). The slip is real, named, and derives *exactly* the option
  value: substituting $+$ for $\times$ inside $A=\tfrac12 bh$, and each `why` states it
  ("Added the base and the height and halved the sum"). **But luna surfaced something real
  underneath the wrong claim, and it is left for the human:** that one decoy appears in **6 of
  the 9** quiz items, which makes it guessable and wastes distractor space. Re-cutting four of
  them is the fix if wanted; it was not done here because the round was majority-invalid and
  each replacement would introduce four fresh option values for no coverage gain.
- **`area-composite-figures` q5/q6 scope** ("requires triangle area, not a listed prereq").
  The booklet's own §Area of Composite Figures step 1 reads *"Split the composite figure into
  squares, rectangles, **and triangles**"*, and the section drills rectangle+triangle composites.
  NOT-A-DEFECT: booklet-anchored content is in scope. **But luna's underlying observation is a
  real data gap, left for the human** (same class as batch 11's `find-radius-from-circumference`):
  `area-composite-figures`'s `prereqs` list only `area-of-rectangle` while the section it is
  anchored on requires triangle area — consider adding `area-of-triangle` to its `prereqs` in
  `data/skills.json` (graph-legal: both stage 3, and `area-of-triangle` does not depend on any
  composite skill, so no cycle).
- **`area-of-triangle` q7 duplication of q1.** Same structural type, fresh numbers, different
  units and a different answer ($22.5\text{ km}^2$ vs $42\text{ cm}^2$) — required coverage under
  the Quiz-independence rule, not duplication.

VALID — both repaired:
1. `area-of-rectangle` m1 — "how many times **larger**" is genuinely ambiguous (factor $4$ vs
   increase of $3$), and the card's own solution already said "$4$ times the original". Reworded
   to "how many times **as large**". **Stem wording only, no option/key change.** The orchestrator
   then swept the batch for the same phrasing and fixed three more instances luna could not see
   (`area-of-parallelogram` mastery, `area-of-circle` development, `area-of-circle` quiz) — all
   stem-only, no answers touched.
2. `area-of-triangle` q4 — the left side is labelled $8$ cm but the coordinates $C=(3.5,6)$ draw
   it $6.95$ long: **the figure contradicted its own labels.** Re-derived $C=(5.29,6)$ so
   $|AC|=8.00$ exactly with the height still $6$ and the foot inside the base; dashed height,
   right-angle mark and both labels moved with it. Area unchanged at $30\text{ cm}^2$.

**Orchestrator-side figure-scale sweep (new, and it earned its keep).** Luna only ever sees quiz +
mastery, so a figure defect on a foundation/development card is invisible to every checker. A
deterministic scan was written that, for each `[tikz]` block, matches every hand-placed
`N cm/m/mm/km` label to the nearest drawn segment midpoint and flags any label whose implied
coordinate-to-unit scale disagrees with the figure's median by >12%. Over 54 multi-label figures
it found **3 more instances of the exact class luna caught once**, all slant-side decoys drawn
shorter than their label:
- `area-of-parallelogram` d1 — slant labelled $10$ cm, drawn $8.60$. Re-derived $D=(7.14,7)$,
  $C=(23.14,7)$ so $|AD|=10.00$; question and solution figures both updated. Area unchanged
  ($16\times7=112$).
- `area-of-triangle` d1 — slant labelled $6$ cm, drawn $5.00$. Re-derived $C=(4.47,4)$ so
  $|AC|=6.00$. Area unchanged ($\tfrac{9\times4}{2}=18$).
- `area-of-parallelogram` q3 — slant labelled $12$ cm, drawn $8.60$. **The only repair in the
  batch that changed option values.** A $12$ cm slant against the $7$ cm height forces a rise of
  $\sqrt{95}\approx9.75$, leaving a $0.25$-unit overlap for the dashed height line — an unreadable
  figure — so the decoy was relabelled $9$ cm with $D=(7,5.66)$, giving $|AD|=\sqrt{49+32}=9.00$
  exactly. Two distractors derive from the slant and moved with it, **with derivations**:
  $120\to90$ (multiplies the two side lengths, $10\times9=90$) and $84\to63$ (pairs the
  perpendicular height with the slant instead of its base, $7\times9=63$). Key $70=10\times7$ and
  the triangle-formula slip $35$ unchanged; all four values distinct.
The sweep re-runs clean at **0 suspects**. It is worth promoting to a standing gate script.

**Targeted re-check of the two edits that changed geometry or option values** (not a new round —
verification of the edits): `blind-for-check.mjs --items` on `area-of-parallelogram` q3 and
`area-of-triangle` q4, then a fresh luna call. **Both agree, 0 flags.** The stem-only rewordings
were not re-checked (no key or option changed — batch-10 precedent).

**Scope lines held.** `halve-diameter-for-radius` computes no area anywhere and
`sector-interior-angle` no arc and no area — the two difficulty-1 atoms were the ones most at risk
of being padded out of scope, and neither was. `area-of-circle` is whole circles only;
`area-of-sector` owns quadrants/semicircles/sectors; the three inverse skills are split linear
(`find-unknown-side-from-area`, `find-unknown-from-trapezium-area`) vs square-root
(`find-unknown-from-circle-area`); `area-using-pythagoras` is the only skill that derives a length,
every other agent states them. Unit selection and conversion stayed entirely in agent A — no
mixed-unit area drill leaked into the formula skills. No perimeter or arc length anywhere (batch
11 owns those), no volume, no surface area, no radians, no circle theorems, no trigonometry.

**Booklet errata found (22 across the three booklets, none reproduced).** The two that changed
authored content: `Area 3` §Area of a Trapezium figure (a) labels its slanting side $4$ cm while
the other three labels force $5$ cm (the printed answer $15\text{ cm}^2$ matches the labels, not
the $4$) — authored with the consistent $5$ cm; and `Area 1` §Area of Composite Figures'
subtraction worked example does all working in metres but prints the answer as $94\text{ cm}^2$.
The rest are unit typos (`30\,000` cm**m**², `m^2s^`, areas labelled `cm`/`m` instead of `cm²`/`m²`
in `Area 1` §Finding Unknown Sides Q5 and `Area 2` §Composite Q10), rounding slips (`Area 2`
§Finding the Radius Q10 gives $r=11.283$ where $\sqrt{400/\pi}=11.284$; `Area 2` §Area of a Sector
Foundation Q2 says 2 d.p. but prints five answers to 1 d.p.), question/answer mismatches
(`Area 1` rectangle Q14b asks a perimeter and answers an area, Q10d answers the opposite of what
is asked, §Finding Unknown Sides Mastery Q10 asks a perimeter under a "find the missing side"
heading, `Area 1` §Converting Units Q11 says "rectangle" then "this triangle", triangle Q8 compares
area with perimeter), heading errors (the parallelogram identify box is headed "…of a
**trapezium**"), duplicated item letters (`Area 1` §Mixed Practice restarts at `g.` twice), and
several **reused media images across items with different answers** (`Area 1` composite Q5 and
Foundation h/i; `Area 2` Mixed Practice Q1 reuses `image58` for six different pie charts; `Area 3`
Pythagoras Q8 b/c/d share `image113`) — those figures are unusable as design references.

**Automated vision gate retired — diagram skills flagged for manual human visual review: 17 of 18
carry inline `[tikz]`, 435 blocks total** (320 content + 115 quiz): `area-composite-figures`
(36/9), `area-using-pythagoras` (32/9), `area-composite-quadrilaterals` (30/8),
`area-composite-circles` (25/8), `find-unknown-side-from-area` (19/10),
`find-unknown-from-circle-area` (19/9), `area-of-triangle` (18/7), `area-of-sector` (18/7),
`area-kite-rhombus` (18/6), `area-trapezium` (16/7), `find-unknown-from-trapezium-area` (16/7),
`halve-diameter-for-radius` (15/6), `area-of-parallelogram` (14/6), `area-of-rectangle` (14/5),
`sector-interior-angle` (14/5), `area-of-circle` (12/5), `convert-area-units` (4/1);
**`choose-area-units` is deliberately figure-free** (a drawn region cannot inform "which unit
suits a paddock" unless it carries dimensions, and that is a different skill's material — every
figure there would be decorative). Eyeball via
`http://localhost:5173/#/tikz-check?topic=t-s4-are`. Highest-risk first: (1) the **five repaired
figures** above — three slant decoys re-derived, one quiz decoy relabelled, and `area-of-triangle`
q4 — all coordinate-level edits that have been verified arithmetically but **not yet by eye**;
(2) the **arc composites** (`area-composite-circles`) — semicircular caps vs notches, the
quadrant-removed square, the annulus and sector-annulus pair, where a concave arc drawn convex
would contradict its answer; (3) the **Pythagoras figures** (`area-using-pythagoras`) — kite and
rhombus diagonals that must read as genuinely perpendicular, and the $6$–$8$–$10$ / $5$–$12$–$13$ /
$7$–$24$–$25$ triangles drawn in true ratio; (4) the **rectilinear composites**
(`area-composite-figures`, 36 blocks — the densest file in the batch) with dashed split lines and
$A_1$/$A_2$ labels in notch regions; (5) the **reflex sectors** (`sector-interior-angle`,
`area-of-sector`, `find-unknown-from-circle-area` d5) which use computed start/end arcs rather than
`\pic` — check the arc sweeps the region the label names.

**Committed as `7169d15`** (batch 12, together with the first batch-11 visual-review repair). The
435-block diagram checklist above is outstanding — review and repair in place on top of that
commit.

**Batch 13 (t-s4-vol) notes.** First batch to draw **3D solids**, and the first to use
`tikz-3dplot` at all — the corpus had **zero** prior `\tdplot` blocks, so this batch is the
reference for the idiom. Generated with Opus, **5 generators in two waves** (the wave split is
forced by in-batch prereqs: `volume-of-prism` → `volume-of-cylinder` → {`find-dimension-from-volume`,
`volume-capacity-problems`}, and read-first item 6 requires each prereq's content file to exist).
Wave 1: A `Volume 1` §Drawing Prisms + §Cross-Section = `views-of-prisms` + `cross-sections-prisms`;
B `Volume 2` + `Volume 3` = `volume-of-prism` then `volume-of-cylinder` (one agent in sequence, so
the cylinder **cites** $V=Ah$ instead of re-deriving it); C `Volume 4` §Converting Units + §Units of
Capacity = `volume-capacity-units` + `convert-volume-capacity-units`. Wave 2: D
`find-dimension-from-volume`; E `volume-capacity-problems`. atomTypes: `cross-sections-prisms` and
`volume-capacity-units` = Cat, remainder = R. **No `masteryOmitted`, no `coverageNote`** — every
atom, including the two difficulty-1 recognition skills, reached its tiers honestly. Final counts:
foundation 7–12 / development 6–11 / mastery 3–4 / quiz 8–10. Whole-batch `validate.mjs` clean at
**0 errors, 0 warnings**; full-repo clean (the 248 repo warnings are the pre-existing Part-A
backfill targets); manifest rebuilt (**316 content / 177 quiz**, +8/+8).

**Two batch-12 data gaps ruled on before generation.**
1. **`area-composite-figures` prereqs → `area-of-triangle` added** (`data/skills.json`). 6 of its 21
   practice cards compute a triangle area (`$=8\times6+\frac{8\times5}{2}$` and five more), and the
   anchored booklet section's step 1 says "squares, rectangles, **and triangles**". Graph-legal:
   both stage 3, `area-of-triangle` depends on `area-of-parallelogram`, no cycle. `theory` untouched
   — it is honestly rectangle-first and the triangle cards use it in service. Retires luna's
   recurring false scope flag on q5/q6. **Note left for the owner:** that skill's *blurb* ("Split or
   rearrange an **L-shaped** figure to find its area") is now the same kind of stale-scope text that
   caused batch 11's seven false flags on `perimeter-2d-shapes`; a blurb widening needs owner
   approval and was **not** made here.
2. **`area-of-triangle`'s $\tfrac12(b+h)$ decoy cut from 6 of 9 items to 3.** Each instance was
   individually correct (reachable, correctly named), so this was a *pattern* defect, not an option
   defect: at two-thirds saturation a student eliminates "the small halved-sum one" without doing
   any maths. Three replaced, three kept (q1, q3, q7 — the from-figure/obtuse items whose `why`
   cites the drawn labels); replacing all six would mint six new values for zero coverage gain.
   Replacements with derivations: **q2** $9.5\to98\text{ m}^2$ (uses the longer side as both base
   and height, $\tfrac12\times14\times14$ — the planned $17.5$ was already taken by that item's
   "halved twice" option); **q5** $12.5\to9\text{ mm}^2$ (halves the base and stops, $18\div2$);
   **q8** "$A$, $11$ vs $10$" $\to$ "$A$, $96$ vs $48\text{ cm}^2$" (forgets to halve $A$'s product,
   $16\times6$ against $\tfrac12\times12\times8$). Gate clean after.

**The two batch-12 orchestrator-side sweeps are now standing gate scripts** — the gate is **six**
commands, and `docs/content-generation.md` step 3 is updated to match.
- **`scripts/audit-figure-scale.mjs`** — the batch-12 figure-scale sweep. Labels bind to segments by
  inline `node[midway]` syntax where present (the dominant idiom in `t-s4-len`), else by proximity;
  a subdivided edge offers each of its sub-spans, so a "14 m"/"6 m" pair on one drawn base matches
  its parts rather than the whole. **Two design points differ from the batch-12 sketch, both because
  the sketched version would have been wrong:** (a) 3D figures are compared on **true 3D lengths**
  taken from the `(x,y,z)` coordinates — projection never enters, so nothing is foreshortened; the
  planned direction-class bucketing would have missed a mislabelled slant, whose class has one
  member. A solid hand-projected into 2D coordinates is skipped and counted, never flagged. (b) a
  figure needs **≥3 matched labels**: with two, the "median" is their mean, so one bad label drags
  the reference and both ends flag symmetrically — which is what a 2-label circle figure (diameter +
  radius, or a circumference value that is not a straight edge) produces.
- **`scripts/audit-angle-arms.mjs`** — the batch-11 defect the human caught by eye, encoded. Only
  junctions (≥2 incident segments) and **drawn arc centres** count as vertices; a bare ray tip does
  not, which is what stops a label sitting between two rays from being assigned to the nearer ray's
  far end. `\pic {angle=A--B--C}` builds its own arms and is exempt.
- Both are pinned by **`tests/figure-audits.test.js`** (8 tests) against reconstructions of the
  original defects, so a future refactor cannot silently blind them. Controls: `t-s4-are` (161
  multi-label figures / 682 labels) and `t-s4-len` (113 / 548) both re-run at **0 suspects**;
  angle-arms is clean repo-wide (36 node-labelled angles checked, 44 `\pic`-built). Not added to
  `package.json` — none of the existing three audits have an npm script either.
- **One pre-existing defect found repo-wide, outside this batch and NOT repaired:**
  `equations-from-formulas` development[0] **solution** figure labels the trapezium height $9$ cm but
  draws it $2.00$ coordinate units where the $10$ cm and $6$ cm parallel sides set the scale at
  $0.5$ units/cm — the height is drawn shorter than the $6$ cm top side. Same class as batch 12's
  slant decoys. It is committed batch-10 content; the fix is to redraw at $4.5$ units, no answer
  change.

**Deterministic gate clean batch-wide on the first run** (245 items / 74 quiz questions / 295
options / 178 `[tikz]` figures): validate 0 warnings, equivalent-options 0 defects and **0 intended
key-equal** (38% of options canonicalised — and **80%** on `volume-capacity-problems`, the highest
of any skill in any batch, because every option in an item is written in the key's unit),
duplicate-stems 0 across all four classes including 0 near-dup advisories, option-hygiene 0 leaked
keys / 0 vague `why`s, figure-scale 0 suspects over 45 compared multi-label figures, angle-arms 0.

**Form-pinning held, and it mattered more than in batch 12.** Volume and capacity overlap
($1\text{ cm}^3=1\text{ mL}$, $1\text{ m}^3=1\text{ kL}=1000\text{ L}$), so $2.5$ L, $2500$ mL and
$2500\text{ cm}^3$ are three spellings of one answer. Every stem names the required unit and, where
a decimal is possible, the decimal places — or "in exact form, in terms of $\pi$" for cylinders — and
**every option inside an item is written in the key's unit**, which is the rule that actually closes
the trap. The escape hatch was needed **zero** times.

**Blind check — luna, one packet per skill, `figures-first`. All 8 OK, zero retries. 101/101 items
re-solved, coverage complete on every skill, ONE answer mismatch and 5 flags. 4 of 5 flags
adjudicated INVALID → majority-invalid round, so the accepted fixes were applied and no second full
round was spawned** (runbook stopping rule).

INVALID (recorded so they are not re-raised):
- **`find-dimension-from-volume` q8** — luna claimed $r\approx3.46$ against the key $3.45$.
  **Checker slip:** $r^2=300/(8\pi)=11.936621$, $r=3.454941$, which rounds to $3.45$ at 2 dp.
- **`volume-capacity-units` q9** — "a soft-drink bottle could be mL or L; a suburb's supply could be
  kL or ML". The stem asks for the **most appropriate** set and each distractor changes exactly one
  slot to a defensible-but-worse choice; that is the design of a unit-selection item, not ambiguity.
- **`volume-capacity-units` m3** — "a catalogue's unit convention is not mathematically determined".
  The card asks *which and why* and its solution gives the reasoning; a Cat-atom judgement card is
  not under-determined for having a judgement in it.
- **`views-of-prisms` m3 scope-adjacent under-determination** — see below; the content is right, only
  the stem was loose.

VALID / repaired:
1. **`views-of-prisms` m3** — luna: "a front view and a side view alone do not uniquely determine
   the solid". True as generic drafting; within this atom's conventions (prism combinations, internal
   edges drawn as lines, and no internal line in the given side view) the solid *is* pinned. Fixed by
   naming the convention in the stem: "…of a solid **made from rectangular prisms**". Stem only, no
   figure, answer or option changed, so no re-check owed.
2. **The A/B/C/D panel-label collision — found via the answer mismatch, and the batch's most
   transferable finding.** `views-of-prisms` q1/q3/q6 pose "which shape is the top view?" with four
   candidate views drawn as a labelled panel in the stem and options `$A$`–`$D$`. But quiz options
   *already* render with position keys A–D, and `blind-for-check.mjs` shuffles them — so after the
   shuffle a student sees "A. $C$", "B. $A$", … and luna answered the panel label while the driver
   read it as a position. Repaired by renumbering the panels **$1$–$4$** and the options to
   "Shape $1$"–"Shape $4$", which cannot collide with the position keys; solution text and every
   `why` moved with them. Targeted re-check (`--items q1,q3,q6` + a fresh luna call): **3/3 agree,
   0 flags** — confirming the mismatch was the collision and nothing else.

**Renderer constraint discovered and written into the schema doc.** A `[tikz]` block renders in
`question_text` and `solution_text` **only** — never inside a quiz option's `text` or `why`.
`QuizQuestion.svelte` renders the stem/solution through `InlineContent` but each option through
`Math.svelte`, which is KaTeX-only, so a figure in an option renders as literal `[tikz]…` source.
The labelled-panel-in-the-stem pattern above is now the documented workaround
(`docs/content-schema.md`, "Inline TikZ").

**Scope lines held.** Conversion lives entirely in agent C's two skills; the formula skills use one
unit per figure; `volume-capacity-problems` is the single skill that legitimately crosses
volume↔capacity because that crossing *is* its atom. `cross-sections-prisms` computes no area and no
volume; `views-of-prisms` draws no nets. `find-dimension-from-volume` splits **17 linear / 6
square-root** practice cards (6/4 in the quiz), mirroring batch 12's three inverse skills. Stage-5
material excluded throughout: nets, composite solids/prisms, prisms with curved cross-sections,
pyramids, cones, spheres, surface area.

**Taxonomy gap found (not a batch defect).** The booklet's find-a-missing-dimension items include
**cube-root** cases (`Volume 2` §Part 1 items 2d/2f, and items 5 and 8 — solve $V=s^3$ for a cube's
edge). `find-dimension-from-volume` rejected them because cube root is in **neither** of its prereqs
(`equations-from-formulas` and `quadratics-from-formulas` cover linear and square-root only), so
under the scope rule they need an untaught skill. They are therefore **unowned by any skill** — same
class as batch 8's "Combined Rates" gap. Candidate for the atomisation queue.

**Two agents independently verified `tikz-3dplot` before trusting it** (it was unproven here). Agent
A probe-rendered it, fitted the projection empirically (`\tdplotsetmaincoords{70}{125}` → +x
lower-left, +y lower-right, +z up; the coordinate-space minimum corner is the occluded one) and
generated every solid with **per-face normal-vs-camera visibility**, so hidden edges are computed
rather than guessed. It then caught a content defect by re-deriving each view analytically: **the
side view of a flat-top hexagonal prism is a rectangle with a line across it, not a plain
rectangle** — the max-y vertex sits at an interior height, so the crease projects inside the outline.
That invalidated quiz q2's key and q7's given side view; both were corrected before reporting.
Agents B and C rendered and repaired their figures similarly (leader arrows moved off the solid,
`fill=white` on length labels, ellipse aspect made proportional so a small-radius roller stopped
reading as a sphere; C rebuilt its three cubes after finding the wrong vertex dashed).

**Booklet errata found (18 across the four booklets, none reproduced).** The costliest are
structural rather than typographical: `Volume 1`'s "Identify prisms" example is **unusable as
printed** (items a, b, c, f, g, j have no image at all; d, h and l each carry two or three images in
one cell, so the a–l labelling does not match the figures), its named-prisms table stacks all three
solids in one column so no name lines up with its figure, its Foundation Q1 reuses one image for
five sub-questions, and its Foundation Q2 answer key marks differently-cropped regions of one
composite image "yes" and "no". Answer-key errors: `Volume 4` §Units of Capacity answers "890 ML to
kL" as $0.89$ kL (that is the answer to *890 mL to L*; correct is $890\,000$ kL); `Volume 4` Q17a
computes "$A = 20\text{ m}\times20\text{ m}=400\text{ cm}^2$"; `Volume 3` item 4 prints a m³ answer
as cm³; `Volume 3` items 8a and 13c are the same figure and question printed twice. The rest are
unit typos (volumes labelled cm²/m² in `Volume 2` Q1b and Q1g, `Volume 3` Check Your Understanding
Q2–Q5, and the `Volume 4` worked example), an inverted rate label (`1.5 ha × 10000 ha/m²`), a
"18 friends" stem whose solution multiplies by 19, duplicated item letters, and `Volume 3` Q7 calling
two cylinders "prisms".

**Automated vision gate retired — diagram skills flagged for manual human visual review: 7 of 8
carry inline `[tikz]`, 178 blocks total** (128 content + 50 quiz): `views-of-prisms` (35/12),
`volume-of-prism` (21/7), `find-dimension-from-volume` (19/7), `volume-capacity-problems` (18/6),
`cross-sections-prisms` (17/11), `volume-of-cylinder` (16/6), `convert-volume-capacity-units` (2/1);
**`volume-capacity-units` is deliberately figure-free** (choosing a unit is a benchmarking judgement
— every figure there would be decorative, exactly as batch 12 shipped `choose-area-units`). Eyeball
via `http://localhost:5173/#/tikz-check?topic=t-s4-vol`. Highest-risk first, and this batch's risks
are new: (1) **hidden-edge dashing on every 3D solid** — the whole batch rests on one empirically
fitted projection, so check that the dashed edges are the ones actually occluded and that no solid
reads inside-out; (2) the **four candidate-view panels** in `views-of-prisms` q1/q3/q6 and the
hexagonal-prism side views — the crease-inside-the-outline case above is subtle enough that it was
missed on the first pass and only analytic re-derivation caught it; (3) the **cylinders**, drawn as
ellipse-ended 2D figures — check the ellipse aspect reads as a circle in perspective rather than a
sphere or a disc, and that the radius/height labels clear the curve; (4) `convert-volume-capacity-units`'
**three subdivision cubes** ($10^3$, $100^3$, and the 10 cm cube holding 1 L), rebuilt once already
for a dashed-vertex error; (5) the **unknown-dimension arrows** in `find-dimension-from-volume`,
which must show a variable and never the value.

**Committed as `80e562c`** (batch 13, together with the two promoted gate scripts, the
`area-composite-figures` prereq fix and the `area-of-triangle` decoy re-cut). The 178-block
diagram checklist above is outstanding — review and repair in place on top of that commit.

**Batch 14 (t-s4-geo) notes.** Generated with Opus, **5 generators in two waves** (the wave split is
forced by in-batch prereqs). Wave 1: A `PGF1` §Classifying Triangles = `classify-triangles`[S3];
B `PGF2` §Labelling + §Diagonals + §Convex + §Properties of Special Quadrilaterals =
`classify-quadrilaterals`[S3] + `quadrilateral-properties` + `convex-nonconvex`; C `PGF3` §Angle Sum
of a Triangle + §Exterior Angle Theorem + §Angle Sum of a Quadrilateral = `angle-sum-triangle` then
`exterior-angle-triangle` then `angle-sum-quadrilateral` (one agent in sequence, so the latter two
**cite** the $180^{\circ}$ sum instead of re-proving it). Wave 2: D §Hierarchy of Quadrilaterals =
`quadrilateral-hierarchy`; E §Mixed Practice + §CYU = `unknown-sides-angles-figures`. atomTypes:
`convex-nonconvex` and `quadrilateral-hierarchy` = Cat, remainder = R. **No `masteryOmitted`; one
`coverageNote`** (`convex-nonconvex` — every candidate third mastery card needed the $360^{\circ}$
sum, which is a sibling's atom). Final counts: foundation 7–10 / development 6–9 / mastery 2–4 /
quiz 7–10. Whole-batch `validate.mjs` clean at **0 errors, 0 warnings**; manifest rebuilt
(**323 content / 186 quiz**, +7 content — the two stage-3 files already existed — and +9 quizzes).

**Two `data/skills.json` blurb fixes, both approved by the owner before/during generation.** Both are
the batch-11 `perimeter-2d-shapes` staleness class — a blurb written against the skill's Stage-3 dot
point and never revisited when a Stage-4 dot point was added, which checkers then read as the scope
contract.
1. `area-composite-figures` → *"Split a composite figure into rectangles and triangles to find its
   area."* (was L-shape-only; commit `4eefcd8`, carried in from batch 13's prereq fix.)
2. `classify-quadrilaterals` → the full **six** shapes, adding trapezium and kite (was four; commit
   `edb7d4d`). Caught mid-run and passed to agent B, which then gave trapezium 6 cards and kite 5 as
   first-class structural types rather than edge cases.

A **parallel owner-run audit session** then landed `509b36c` (the dual-role `courses` fix — three
skills carried a Stage-4 dot point but listed only `s3`, so `skillsForTopic` filtered them out of the
Stage-4 Area topic; pinned by a new `tests/skill-courses.test.js`) and `8b29656` (26 further blurb
widenings of the same class). One of those 26 touched this batch: `classify-triangles` →
*"Name triangles and their sides using vertex letters, and classify them by side lengths and by angle
size."* It landed **after** agent A had authored, but widened *towards* what the agent had already
written (vertex-letter naming plus both classification axes), so no rework was needed — verified by
re-reading the shipped cards against the new text. Full validate and the test suite are clean with
both sessions' work in the tree.

**STAGE 3 rule applied to both stage-3 skills** (`classify-triangles`, `classify-quadrilaterals`).
Each content file held `skillId`/`atomType`/`theory` only and had no quiz; `theory` copied
byte-for-byte and **re-verified by the orchestrator against `git show HEAD:`** (`JSON.stringify`
equal, `atomType` unchanged, `practice` the only added key). Quizzes created fresh.

**NEW FINDING — the STAGE 3 rule's assumption fails for a widened atom, and it is left for the
owner.** Both stage-3 skills in this batch have frozen `theory` that teaches **less than their
Stage-4 role**, in exactly the same shape as the stale blurbs above:
- `classify-triangles` — `theory` covers only the **side** axis (equilateral/isosceles/scalene). Its
  dot point `dp-s4-geo-1` and blurb also own the **angle** axis (acute/right/obtuse), so roughly half
  the practice set has no theory behind it.
- `classify-quadrilaterals` — `theory` names **four** shapes; the content now teaches six.
Both agents correctly copied rather than extended, per the rule. The rule assumes the stage-3 theory
is complete for the atom, which holds only where the Stage-4 dot point did not widen it. A carve-out
(or a one-off theory extension for these two) needs an owner ruling. **The other eight dual-role
stage-3 skills should be audited for the same thing.**

**Gate bug found and fixed mid-batch (`bd8f4a1`).** Agent C reported that
`scripts/lib/tikz-blocks.mjs` `parseFigure` never tokenised a bare `-- cycle` — `TOKEN_RE` only
captured a point inside parentheses, so the `cycle` branch was unreachable for the standard TikZ
spelling, and `(cycle)` (invalid TikZ) appears **zero** times in the corpus against **387** bare
occurrences across 22 skills. The closing edge of every closed polygon was therefore dropped: angle-arms
read one arm short at each polygon's first vertex, and figure-scale left the closing edge's label
unmatched, which can drop a figure below its 3-matched-label floor and skip it **silently**. Fixed and
pinned by a new fixture + test. Coverage widened corpus-wide: **angle-arms ~80 → 171 labelled angles
checked; figure-scale 274 → 345 figures, 1230 → 1472 matched labels.** Both still clean, so the
widening exposed no new defects — but batch 13's "clean controls" over `t-s4-are` and `t-s4-len` were
measured through this blind spot and the re-run at full coverage is what actually clears them. The one
surviving suspect repo-wide is the known, already-documented `equations-from-formulas` trapezium
height (batch 10, unrepaired by prior decision).

**Packaging defect in batch 13's commit, fixed here.** `80e562c` shipped `audit-figure-scale.mjs` and
`audit-angle-arms.mjs` but **not** `scripts/lib/tikz-blocks.mjs`, which both import — the file was
untracked, so from a clean checkout both gate scripts crashed. Now tracked; all script imports
verified against `git ls-files`.

**Deterministic gate clean batch-wide on the first run** (253 items / 78 quiz questions / 307 options /
186 `[tikz]` figures): validate 0 warnings, equivalent-options 0 defects and 0 intended key-equal (9%
canonicalised), duplicate-stems 0 across all four classes **including 0 near-dup advisories**,
option-hygiene 0 leaked keys / 0 vague `why`s, figure-scale 0 suspects, angle-arms 0 over 142 checked
angles. Generators cleared it on their own skills first; agents D and E additionally ran cross-skill
duplicate-stems against their prereq siblings (108 and 225 items, 0 duplicates).

**Blind check — luna, one packet per skill, `figures-first`. All 9 OK, zero retries. 106/106 items
re-solved, coverage complete on every skill, ONE answer mismatch and 8 flags. 6 of 8 flags valid — a
majority-VALID round, so the repairs were applied AND a targeted re-check was run** (unlike batches
10–13, which all stopped on the majority-invalid rule).

- **Answer mismatch — `exterior-angle-triangle` q4. Adjudicated: checker slip, content correct.**
  Verified numerically: $|AC|=|BC|=3.092$ (genuinely equal as marked), $A$/$C$/$D$ collinear so the
  side is truly produced, and the exterior angle at $C$ measures $95.98^{\circ}$. So $96=x+x$,
  $x=48^{\circ}$. Luna chose $42^{\circ}$ — the item's own modelled "halved $180-96$ instead of the
  exterior angle" distractor.

INVALID (recorded so they are not re-raised) — both are luna testing reachability **against the
correct method** rather than against the named slip:
- **`angle-sum-triangle` q6, distractor $100$.** Derives exactly from using $360^{\circ}$ as a
  triangle's angle sum: $3x+60=360 \Rightarrow x=100$. A live confusion in a batch that also teaches
  the quadrilateral sum. Luna's own wording gives it away — "does not correspond to a plausible
  calculation from $x+(2x+9)+51=180$", i.e. it assumed the correct sum.
- **`angle-sum-triangle` q9, distractor $12^{\circ}$.** Derives from the stated sign slip:
  $5x+20=180 \Rightarrow x=32$, giving angles $32/96/12$, smallest $12$.

VALID — all five repaired, then re-checked:
1. **`angle-sum-triangle` q4, distractor $113^{\circ}$ → $112^{\circ}$.** The stated slip ("treated
   $34^{\circ}$ as one of the two equal base angles") yields $180-34-34=112$, not $113$ — off by one,
   so no student reached that option. Misconception → derivation → value now stated in the `why`.
   ($113$ is legitimate in **q1** of the same quiz, where it is $180-67$; only q4's was wrong.)
2. **`quadrilateral-properties` q1 — figure under-determined its own key.** The key asserts "**each**
   diagonal bisects the two vertex angles it passes through", but only diagonal $AC$'s four halves
   were marked, leaving distractor "only one of the diagonals bisects a vertex angle" defensible from
   the drawing. Added the four $b^{\circ}$ marks at $B$ and $D$ (bisector-direction placement at
   radius $0.85$) and split the stem into $a^{\circ}$/$b^{\circ}$ groups — the two families must be
   distinct letters because $\angle A=58^{\circ}$ and $\angle B=122^{\circ}$, so the halves are
   $29^{\circ}$ and $61^{\circ}$ ($a+b=90$, verified). No option value or key changed.
3. **`convex-nonconvex` q4 — the key was mathematically false and the figure had been drawn to hide
   it.** The dashed "diagonal" ran $(0,0)$ to $(4.1,1.783)$, which is $AC$ **extended** past $C$ by a
   factor of $1.783$; the diagonal *segments* intersect at $t=1.783>1$, i.e. they do not meet at all.
   So "the diagonals meet outside it" is wrong under the standard segment definition. Redrew the
   diagonal to stop at $C$ and re-keyed to the honest test, "one of the diagonals lies outside it" —
   verified by ray-casting that the midpoint of $BD$, $(3.3,2.3)$, is outside the quadrilateral. The
   stale "crossing point" `why` on the convex distractor was reworded to match.
4. **`convex-nonconvex` q6 — two defensible answers.** The distractor "convex, because its opposite
   sides are equal" is a *sound* argument: for a simple quadrilateral both pairs of opposite sides
   equal $\Rightarrow$ parallelogram $\Rightarrow$ convex. Replaced with "convex, because all four of
   its sides are straight", whose reason genuinely fails (every quadrilateral has straight sides,
   dented ones included) — a named misconception rather than a second correct answer.
5. **`angle-sum-quadrilateral` q2 — duplicated q1.** Same `find-fourth-angle` slug, same "Find the
   value of $x$" stem, same task, only the numbers differing. **Deleted** rather than re-cut (batch
   11's `pi-definition` q2 precedent): every structural type retains $\geq 1$ MCQ, both mastery items
   survive, and the quiz lands at 8, above the warn floor. A replacement would have minted four fresh
   option values for zero coverage gain.

**Targeted re-check of the four edited items** (`blind-for-check.mjs --items` on
`quadrilateral-properties` q1, `convex-nonconvex` q4+q6, `angle-sum-triangle` q4, then a fresh luna
call): **4/4 agree, 0 flags.** Full deterministic gate re-run after every edit, clean.

**Scope lines held.** Agent C's three atoms each apply **one** property once; agent E's composite
skill chains two or more, and it named the properties each of its eight foundation cards combines to
prove no card collapses into a sibling. `classify-triangles` computes no missing angle;
`classify-quadrilaterals` draws no diagonal; `quadrilateral-properties` owns every diagonal property;
`convex-nonconvex` is the single convexity judgement; `quadrilateral-hierarchy` draws **zero**
diagonals in any of its 13 figures and never runs a plain name-this-shape drill. Excluded throughout:
congruence, similarity, the polygon angle-sum formula $(n-2)\times180^{\circ}$, Pythagoras,
trigonometry, circle theorems, coordinate geometry, area and perimeter.

**Booklet errata found (17 across the three booklets, none reproduced).** Answer-key and reasoning
errors: `PGF1`'s summary flowchart PNG defines an acute-angled triangle as "all angles acute
($<60^{\circ}$)" — should be $<90^{\circ}$ (the prose table is right); `PGF2`'s property table is
**column-corrupted** in extraction, giving Rectangle "adjacent sides equal: Y" and Rhombus "adjacent
sides perpendicular: Y", both false and evidently swapped; `PGF2` Mastery Q10's proof concludes
$\angle BCE$ where $\angle EBC$ belongs and asserts $BC=AD=BE$ without justifying $AD=BE$; `PGF3`
§Angle Sum of a Triangle Q5 prints the garbled working $a=74+74=180^{\circ}$, $a=2^{\circ}$ (the
answer $2^{\circ}$ is right); `PGF3` §Angle Sum of a Quadrilateral Mastery Q15 says co-interior angles
are "equal" where *supplementary* is meant (the arithmetic that follows is correct); `PGF3` Mixed
Practice Q13 argues its justification backwards (assumes the parallelogram, then verifies), so M3 uses
the direct form. Structural/extraction damage: `PGF2` Foundation Q1's per-cell answers are scrambled
relative to their image panels (right answer set, wrong mapping); `PGF2`'s §Hierarchy diagram PNG is
truncated mid-arrow with the rhombus/rectangle/square boxes cut off, so agent D authored from the
complete §Summary image; `PGF2` §Diagonals' worked example has no figures for parts a–e and g–i;
`PGF3` §CYU Q5≡Q7 and Q6≡Q8 are byte-identical duplicates with **no answer key printed** for that
section; `PGF3` Mixed Practice Q7/Q17/Q18 print figures with no answers. The rest are wording slips
("why every angle **is** an equilateral triangle", "trangle", "quadrilaterial" ×2, "angle sum of
straight line", a stray escaped `$` in an answer field, `PGF3` Q3a/b mixing pronumeral values and
angle sizes indistinguishably, and duplicated item letters).

**Owner ruling MADE — trapezium is INCLUSIVE.** Recorded as a house convention in
[content-generation.md](content-generation.md) ("House mathematical conventions"), which overrides
the booklet for all future batches: a trapezium has **at least** one pair of parallel sides, so every
parallelogram is a trapezium. Two definitional statements contradicted it and were repaired — quiz
`classify-quadrilaterals` q6, whose key read "**Exactly** one pair of opposite sides is parallel"
(false under inclusive, since a parallelogram is a trapezium with two pairs) → "**At least** one
pair", with the "both pairs" distractor's `why` reworded to keep its misconception live; and, outside
this batch, `area-trapezium`'s `theory` fact (batch 12, committed) which asserted "exactly one pair".
Everything else that reads "only one pair" is *describing a specific figure* rather than defining the
class, which stays correct under inclusive. The original finding follows.

**The contradiction, for the record.** `PGF2`'s summary and
hierarchy diagrams define a trapezium as "**at least** one pair of parallel sides" and derive
parallelogram *from* trapezium (the **inclusive** convention, under which every parallelogram is a
trapezium), but Foundation Q1's answer key gives the rectangle panel as "quadrilateral, parallelogram,
rectangle", omitting trapezium (the **exclusive** convention). Both readings are defensible in NSW
Stage 4 and nothing shipped is wrong either way, because agent D **never tests the
parallelogram/rectangle/square ↔ trapezium relationship** and lets "trapezium" appear in a candidate
list only where its verdict is uncontested. The question is deferred, not resolved: the next batch
touching quadrilaterals will hit it again.

**Taxonomy gaps found (4, none a batch defect).**
- **Constructing a figure from a description** — `PGF1` Foundation Q4 ("draw $\triangle ABC$ isosceles
  with $AB=BC$…") and `PGF2` Foundation Q6 ("sketch a trapezium $ABCD$ with $\angle ABC$ acute"). A
  *drawing* routine, not a classification one; no skill owns it. Both agents covered the reasoning in
  a non-drawing form instead.
- **Reflection / fold symmetry** — `PGF3` Mixed Practice Q6 ("Juna folds rectangular strips of paper")
  needs the fold to map one angle onto another. No skill in `t-s4-geo` teaches it and no prereq
  supplies it; left unauthored rather than smuggling in an untaught property.
- **The isosceles trapezium** — agent D **refuted** the gap for `PGF2` (the term appears nowhere in
  that booklet) and **confirmed** it for `PGF3` Q6, which asserts "adjacent angles in isosceles
  trapeziums are equal" and then asks for angle values. No atom teaches the isosceles trapezium or
  that base-angle property. (The booklet states it loosely too: it is the base angles at each end of a
  *parallel* side that are equal, not any adjacent pair — agent E's D3 uses the precise wording.)
- **Rhombus side from its two diagonals** (`PGF2` Q11/Q12) sits between `quadrilateral-properties` and
  Pythagoras, owned by neither.

**One judgement call flagged for review.** Agent E kept two general-pronumeral proofs
(`unknown-sides-angles-figures` M2 and q9) that sit on the seam with the Stage-5 dependent
`angle-properties-plane-shapes`. Its reasoning is that they chain only in-scope triangle/quadrilateral
properties; it notes a reviewer may prefer them one level up.

**Automated vision gate retired — diagram skills flagged for manual human visual review: ALL 9 carry
inline `[tikz]`, 185 blocks total** (133 content + 52 quiz): `unknown-sides-angles-figures` (28/10),
`classify-triangles` (21/7), `exterior-angle-triangle` (15/8), `angle-sum-quadrilateral` (14/6),
`angle-sum-triangle` (13/7), `convex-nonconvex` (12/5), `classify-quadrilaterals` (11/3),
`quadrilateral-hierarchy` (10/3), `quadrilateral-properties` (9/3); eyeball via
`http://localhost:5173/#/tikz-check?topic=t-s4-geo`. Agents C and E generated every figure from its
stated angles with a coordinate solver (triangle from two angles; quadrilateral by closing an
exterior-turn walk) and asserted the drawn sweep equals the stated value at each labelled vertex, so
the arithmetic risk is low and the residual risk is **rendered layout**. Highest-risk first: (1) the
**three repaired figures** — `quadrilateral-properties` q1's four new $b^{\circ}$ labels (placed on
computed bisectors at radius $0.85$, never yet seen rendered, and the likeliest collision in the
batch) and `convex-nonconvex` q4's shortened diagonal; (2) the **reflex-angle figures**
(`convex-nonconvex`, `angle-sum-quadrilateral` reflex cases, agent E's $900^{\circ}$/$1080^{\circ}$
mastery items) — a reflex arc drawn on the wrong side contradicts its answer; (3) agent E's
**composite chains** (38 blocks, the densest file) where several marked properties share one figure;
(4) the **exterior-angle figures** — the side must read as genuinely *produced*; (5) the
**tick-mark/arrow-heavy quadrilaterals** in agent B's three skills, where equal-side and parallel
marks must stay legible at `scale=0.75`–`0.8`.

**Committed as `f0ddd8e`** (batch 14, together with the inclusive-trapezium ruling, the non-convex diagonal-test correction and the `area-trapezium` fix carried in from batch 12). The 185-block diagram checklist above is outstanding — review and repair in place on top of that commit.

**Batch 15 (t-s4-dan) notes.** Generated with Opus, **8 generators in three waves** — the largest
single-booklet batch so far (`Data Analysis.md`, 5,196 lines, 24 content sections, 14 skills, all
new; **no stage-3 subset**, so the STAGE 3 rule did not apply anywhere). Wave 1: A §Summary
Statistics/§Range/§Mode/§Mean/§Median/§Median Position/§Summary Statistics from a List/§Analysing
Stem-and-Leaf = `calculate-mean-median-mode-range` → `measures-of-centre` → `find-value-from-mean`
(§Mean Problems); E §Surveys + §Bias in Sampling + §Questionnaire Design = `census-vs-sample` →
`identify-survey-bias`. Wave 2: B the five frequency-table sections + §Median from Cumulative
Histograms + §Analysing Dot Plots = `summary-stats-frequency-table`; C §Shape of a Distribution =
`modality` + `shape-of-distribution`; D §Clusters, Gaps, Outliers + §Comparing Datasets =
`clusters-gaps-outliers` → `compare-datasets-measures`. Wave 3: F §Impact of Adding and Removing +
§Relative Merits = `effect-on-measures-centre` → `choose-measure-of-centre`; G `skew-and-measures`;
H `draw-conclusions-data`. The wave split is forced by Read-first item 6 (each prereq's content file
must exist on disk); chained skills stayed with **one** agent so the later ones CITE rather than
re-derive. atomTypes: `calculate-mean-median-mode-range`, `find-value-from-mean`,
`summary-stats-frequency-table`, `compare-datasets-measures` = R; `effect-on-measures-centre` = Com;
the remaining nine = Cat. **No `masteryOmitted` except `measures-of-centre`** (single classification
decision; the harder in-context work is `choose-measure-of-centre`'s atom); **zero `coverageNote`**.
Final counts: foundation 6–10 / development 6–10 / mastery 3–4 (one 4) / quiz 7–10. Manifest rebuilt
(**337 content / 200 quiz**, +14 and +14). `npm test` 103/103 green.

**Two ownership rulings made by the orchestrator, both against the suggested split.**
(1) **§Analysing Dot Plots → `summary-stats-frequency-table`**, not `calculate-mean-median-mode-range`,
because the booklet's own dot-plot mean there is $\frac{(4\times1)+(3\times2)+(2\times3)}{9}$ — the
$\sum fx/\sum f$ routine, not a list routine. §Analysing Stem-and-Leaf stayed with the list skill.
(2) **§Median from Cumulative Histograms → `summary-stats-frequency-table`, UNGROUPED ONLY** (the
booklet says "for ungrouped data the median is simply the number"); grouped/ogive estimation is
`grouped-summary-statistics` [s6]. Verified after the fact: **no class interval appears anywhere in
the batch.**

**Owner rulings confirmed before generation.** The §Summary Statistics using Spreadsheets gap is
*reported only* — its comparison questions were dealt to `compare-datasets-measures` as ordinary
non-spreadsheet material and **no file mentions Excel or any formula syntax**. The §Comparing
Datasets boundary is **compare = compute and compare the statistics; conclusions = the inference on
top** (`draw-conclusions-data`), which is why `draw-conclusions-data` never computes a statistic —
they are always given or read off a display.

**Dual-role scope check — the batch-11 stale-blurb class is ABSENT here.** Seven of the 14 skills
carry a `dp-s6st11-data-*` dot point and list `s6-std11`. Every S6 extra clause resolves to a
*different* owning skill, so no blurb under-describes its union: `dp-s6st11-data-6`'s "including
standard deviation" → `standard-deviation` [s5] and `grouped-summary-statistics` [s6];
`dp-s6st11-data-5`'s "interpret a range of data displays" → `interpret-graphs-conclusions` and
`misleading-graphs` [both s4, `t-s4-dat`]; `dp-s6st11-data-8`'s "impact of outliers on measures" →
`effect-on-measures-centre` (this batch) and `identify-outliers-iqr` [s6]. All five agents holding a
dual-role skill re-checked independently and **all agreed; `data/skills.json` was not edited.**

**Deterministic gate clean batch-wide on the FIRST run** (386 items / 121 quiz questions / 472
options / 129 `[tikz]` figures): validate 0 errors 0 warnings, equivalent-options 0 defects (27%
canonicalised), duplicate-stems 0 across all four classes, option-hygiene 0 leaked keys 0 vague
`why`s, figure-scale 0 suspects, angle-arms 0 defects. Generators cleared it on their own skills
first, and agents B/C/D/F/G/H each additionally ran duplicate-stems against every already-authored
skill (up to 301 items), which is what kept a 14-skill single-booklet batch collision-free.
**Note `audit-figure-scale` compared 0 multi-label figures** — data displays carry no segment-length
labels, so this batch sits outside that gate's reach by design, and the weight shifts to the human
visual review.

**Two NEAR-DUP advisories, both adjudicated INVALID and left in place.** `modality` d4 ≈ m2 (0.87):
d4 is three separated peaks ⇒ multimodal, m2 turns on an *adjacent tie* counting as one peak ⇒
bimodal — different case, different answer, and neither is automatic from the other. `modality` q2 ≈
`shape-of-distribution` f4 (0.85): different scenarios (bus arrivals vs exam marks) and different
questions (modality vs skew); the similarity is only the shared frame "The dot plot shows… Describe
the …", which is irreducible for a recognition atom.

**Blind check — luna, one packet per skill, `figures-first`. All 14 OK, zero retries. 162/162 items
re-solved, coverage complete on every skill, THREE answer mismatches and NINE flags. Only ONE flag
valid — a majority-invalid round, so the accepted fix was applied and no further round was spawned**
(the batch-9 stopping rule).

VALID (1, repaired):
- **`choose-measure-of-centre` q6 — the key asserted something false.** Prices (thousands) $540, 560,
  580, 950, 950, 950, 970$; median $950$. The key read "The median, $\$950\,000$, **equals the three
  dearest prices**" — but the three dearest are $950, 950, 970$, and $970 \neq 950$. Reworded to the
  true statement "**has only one price above it**, so it sits near the top of the data", and the
  matching line in `solution_text` ("The median equals the three dearest prices") to "Only
  $\$970\,000$ is above the median, and two more prices equal it". **No option value and no key
  changed** — a false justification replaced by a true one. Full gate re-run clean. Luna's companion
  complaint on the same item (that "the median is not a central value" is wrong because the median
  *is* the central ordered value) is invalid: that is the booklet's own sense of "not central" —
  not representative of the centre of the spread — and it is what the skill teaches.

INVALID (8 flags + all 3 answer mismatches; recorded so they are not re-raised):
- **The no-mode convention accounts for FOUR flags across three skills** —
  `calculate-mean-median-mode-range` m1 and `summary-stats-frequency-table` m3 ("the mode" singular
  on a bimodal set: both solutions correctly report *both* modes, which is the house rule), and
  `skew-and-measures` q8 + m4 and `modality` q7 (uniform data: luna calls "no mode" vs "every value
  is a mode" convention-dependent). The house convention is settled and now recorded in
  content-generation.md, and in every case the rival reading is supplied as a *modelled distractor*
  with a rebuttal. Worth noting for future batches: **an outside model reads this convention as
  genuinely contested, which is precisely why it is written down.**
- **`shape-of-distribution` q2 "figure contains 30 dots, not the stated 31"** — luna miscounted.
  The TikZ has $1+1+2+4+\mathbf{6}+8+6+3 = 31$ dots; luna read the $x=10$ stack as 5 when six
  `\fill` commands are present. Verified by counting the source.
- **`clusters-gaps-outliers` q1 distractor $19^{\circ}$C "not reachable"** — it is exactly the range,
  $36-17=19$, and its `why` says so. This is luna's known false class: judging reachability against
  the *correct* method rather than against the named slip.
- **`choose-measure-of-centre` q3 "mean and median are both $720\,000$, so two options are
  defensible"** — the stem asks which is *most appropriate to report* and the reason clauses
  separate them; the rival option gives a definition ("half sold for less") rather than a reason to
  prefer the median. The weakest of the eight; the item would be crisper if that distractor's reason
  were false rather than merely irrelevant. Left as authored.
- **Three answer mismatches, all checker slips, all verified numerically.** `modality` q2 (luna chose
  Bimodal; the two equally tall stacks at $3$ and $4$ are adjacent with no dip, which the file
  teaches as one peak in D2 and M2 — luna made the item's own modelled slip); `modality` q7 (luna
  chose "Multimodal; six modes", the modelled six-equal-columns slip); `skew-and-measures` q5 (luna
  chose $17$; the curve peaks at $x\approx1.9$ with a long right tail, so it is positively skewed and
  the mean is the largest, $32$ — luna made the item's own "gave the mode instead" slip). In all
  three the checker landing on a modelled distractor is *evidence the distractor is reachable*.
- Six `--compare` **shuffle-sanity WARNs** on `draw-conclusions-data` and `compare-datasets-measures`
  are formatting only — luna dropped the `$…$` around bare numerals when echoing the option text.

**Booklet errata found (20+, none reproduced).** Answer-key arithmetic: §Summary Statistics
Foundation Q1 prints the median as **$22$**, which is the median *position* $\frac{43+1}{2}$, not the
median (true value $4$); §Summary Statistics Development Q8b prints the mean as $-5.\dot{3}$ when the
table gives $\frac{-15}{80} = -0.1875$ — not the mean of that table at all; §Impact Foundation Q6
prints the netball-heights mean as $151.67$ cm when it is $150.\overline{6}$ (transposed digits).
**A wrong rule, not just a wrong answer:** §Median from a Frequency Table states the median as "the
value where cumulative frequency first equals or exceeds $Mp$" **with no even-$n$ caveat**, which is
false whenever $n$ is even and the two middle scores differ (it returns the upper one instead of
their mean) — agent B taught the correct formulation and built M2 and q8 on exactly that failure
case. Extraction damage: §Shape of a Distribution Foundation Q1 references a **single** PNG
(`image173` for panels a–i, `image174` for j–u) while printing a different answer per panel, panel
**m** has no answer at all, Q2 reuses `image175`/`image176` across pairs with different keys, and
Q3's curve panel is unrecoverable because the images sit inside option (e) — so agents C and G
authored **all** their distributions from the intact concept box (`image166`–`image172`). Wording:
§Surveys heads its choice column "Census | **Survey**" throughout where it means "Census | Sample";
§Surveys Q1(e) keys an automatic entrance counter as a census, which holds only if the population is
that day's entrants (agent E pinned the population in its own stems); "bimondal" for bimodal;
§Relative Merits Foundation Q1's stem says "Find the median" then asks for all three; §Relative
Merits Q2a's reason is garbled (the mode $8$ is the *smallest* value, not "a central value");
§Mean Problems' worked example writes $\overline{\overline{x}}$ and its Q12 uses $x$ for both a mean
and a total; §Mean Q7 mixes cm and mm and prints a unitless answer. **Weak verdicts not reproduced:**
§Comparing Datasets' Guided Practice keys Sampson "the more serious learner" off a 1-mark mean gap
(57 vs 58) while ignoring a 32-vs-60 range gap, and §Spreadsheets Q2d calls Brent better "despite a
slightly larger range" of 42 vs 40 — agent H's F2/D7/M1 teach *against* exactly this. Recurring-dot
answers throughout ($18.\dot{3}$, $26.\dot{6}$, $8.\dot{3}$, …) are excluded by the form ruling.

**Taxonomy gaps found (5, none a batch defect).**
- **Summary statistics with digital tools** (§Summary Statistics using Spreadsheets, `=AVERAGE`,
  `=MEDIAN`, `=MODE`, `=MAX-MIN`) — **confirmed unowned**. Nearest is `standard-deviation` [s5]
  ("using digital tools"), a different atom. Reported per owner ruling; nothing taught.
- **Causation vs correlation / experimental design** (§Comparing Datasets Q3: "what other
  information would convince you the programme *caused* the change… we need a control group") —
  raised by agent D, ruled by agent H: **out of scope and unowned**; `plan-statistical-inquiry` [s5]
  is nearest but covers aim/collection/reporting, not controls. The weaker in-scope form *was*
  authored ("the means rose $42 \to 58$, so more was recycled is supported; the posters caused it is
  not"), including one mastery item where the causal claim fails on the figure's own evidence —
  entries *fell* the year the scheme began. No card mentions control groups or fair tests.
- **Sample size and the reliability of an estimate, positive form** ("a bigger representative sample
  gives a better estimate") — `identify-survey-bias` names small sample size as a *bias*, but the
  positive statement has no home.
- **Reading the mode(s) off a display as a routine** — `calculate-mean-median-mode-range` works from
  lists and stem-and-leaf, `summary-stats-frequency-table` from tables; agent C used it only in
  service (uniform ⇒ no mode).
- **The $\Sigma f$ vs $\Sigma fx$ interpretation routine** (the booklet's "Ed says there are 44
  passengers" review — how many were surveyed vs what is the total) had no owner; agent B absorbed
  it as a `totals-from-table` structural type, which is right because it is meaningless outside a
  frequency table.

**Two blurb-widening candidates for the owner — NEITHER edited, both the batch-11 staleness class.**
(1) `identify-survey-bias` names selection, volunteer, survivorship and questioning bias but **not
small sample size**, which the booklet's bias table, its exemplars (2 of 500 farmers) and the
diagnosis practice all require; agent E taught it as a fourth label. (2) `draw-conclusions-data` —
"Draw conclusions from data collected by census or sampling" does not reach the ~half of the atom
that judges a conclusion against **what was measured** rather than how it was collected, which
`dp-s4-dan-3` does license; suggested widening: "Judge whether a conclusion is supported by the data,
including data collected by census or sampling." Also noted: `census-vs-sample` and
`identify-survey-bias` both hang off `dp-s4-dan-3` ("Analyse datasets… and draw conclusions"), whose
text covers neither census/sample nor bias — the real anchor for both is the booklet.

**NEW PIPELINE CONSTRAINT — bold answer lines collide with `theory.steps`.** `extractProcedureLabels`
(`src/lib/inline-content.js`) matches `\*\*([^*]+)\*\*\s*$`, i.e. **any line ending in a bold
segment** is read as a procedure step header and validated against `theory.steps`. The house
bold-answer style used across the data siblings (`**Selection bias.**`, `**Census.**`, cf.
`classify-numerical-categorical.json`) therefore hard-errors — agent E hit 54 errors on one file.
Two clean workarounds: put the full stop **outside** the bold (`**Census**.`), or omit `steps`
(correct anyway for a recognition atom, per "Don't force a procedure"). Six of the 14 skills here
omit `steps` on that basis; `skew-and-measures` keeps three genuine steps and simply keeps bold off
line-ends. **This will bite the first skill that wants both real staged headers and bold answers.**

**Scope lines held.** Every one of the four statistics is computed in exactly two places by design —
from a list (`calculate-mean-median-mode-range`, which also owns stem-and-leaf) and from a frequency
table (`summary-stats-frequency-table`, which also owns dot plots, histograms and ungrouped ogives) —
and every other skill *consumes* them. `measures-of-centre` classifies and never calculates;
`clusters-gaps-outliers` identifies but never quantifies an outlier's effect;
`compare-datasets-measures` stops at the statistical verdict and never awards a prize;
`draw-conclusions-data` never computes; `choose-measure-of-centre` never asks for a change in a
statistic; `skew-and-measures` never asks which measure to report; `modality` counts peaks and
`shape-of-distribution` reads tails, and neither relates skew to the mean/median/mode ordering.
Excluded throughout and verified absent: quartiles, IQR, box plots, five-number summary, standard
deviation, grouped-data/class-centre estimation, ogive estimation for grouped data, bivariate and
scatter work, the formal IQR outlier rule, the sampling-method taxonomy, population parameter vs
sample statistic, statistical-inquiry design, and the normal distribution. `represent-data-graphs`
and `compare-displays-range-mode` are prereqs, so no skill ever *constructs* a display — they only
read one.

**Scenario collision control.** With 14 skills on one booklet all about the same four statistics,
each skill was given an exclusive context domain in its spawn prompt (basketball points; shoe sizes;
test marks; counts per unit; bus arrivals and café orders; exam marks and incomes; temperatures and
house prices; two-brand/two-player comparisons; club-member ages; salaries and T-shirt sizes;
reaction and marathon times; census/factory/wildlife; shopping-centre and online polls; school
recycling and canteen surveys) **and** an exclusive display type (stem-and-leaf → A; dot plots,
histograms and ogives → B; shape curves and modality columns → C; number lines and paired columns →
D; before/after columns → F; curves with marked measures → G; survey columns and line graphs → H).
Result: 0 cross-skill duplicate stems over 386 items, with only the two frame-level advisories above.

**Automated vision gate retired — diagram skills flagged for manual human visual review: 10 of the
14 skills carry inline `[tikz]`, 129 blocks total** (94 content + 35 quiz):
`shape-of-distribution` (23/8), `modality` (23/6), `skew-and-measures` (15/4),
`summary-stats-frequency-table` (9/4), `clusters-gaps-outliers` (6/4),
`calculate-mean-median-mode-range` (5/2), `draw-conclusions-data` (5/2),
`effect-on-measures-centre` (4/2), `compare-datasets-measures` (3/2),
`choose-measure-of-centre` (1/1). The four figure-free skills are `measures-of-centre`,
`find-value-from-mean`, `census-vs-sample` and `identify-survey-bias` — all correctly so (a display
there would be decorative). Eyeball via `http://localhost:5173/#/tikz-check?topic=t-s4-dan`.
Highest-risk first: (1) **`skew-and-measures`'s marked-measure figures** — eight carry `$P$/$Q$/$R$`
or named `Mode/Median/Mean` dashed lines, and four drop the x-axis label to $-1.4/-1.5$ to clear a
mark-label row at $-0.35/-0.95$; that two-row arrangement is new this batch and is the likeliest
collision. (2) **The ogives in `summary-stats-frequency-table`** — the $50\%$ read-off must visibly
land inside the right column span (verified in source: crossing at $x\approx2.94$ within $[2.5,3.5]$,
but it must *look* right). (3) **The dense dot plots** in `modality` and `shape-of-distribution` —
tall stacks near the title, and `\tiny` category labels. (4) **`clusters-gaps-outliers`'s number-line
value displays** — one cross per value, so a cluster must read as a cluster at `scale=0.85`.
(5) **The paired/before-after column graphs** in `compare-datasets-measures` and
`effect-on-measures-centre`, where two series share one axis and a legend. Note again that
`audit-figure-scale` has **no reach** over data displays, so the human eye is the only check on
these 129 renders.

**Not committed** — left for the human, per the standing instruction.

**Batch 16 (t-s4-pro) notes.** LAST Stage-4 batch — **Wave 1 (Stage 4) is complete.** 7 skills, all
new, no stage-3 subset. **5 generators in two waves.** Wave 1: A §Outcomes and Sample Space +
§Calculating Probability = `sample-space` → `theoretical-probability` (chain, one agent). Wave 2
(parallel): B P2 §Complementary Events + §Using the Complement = `complement-of-event` →
`complementary-probability`; C §Expected Frequency = `expected-frequency`; D §Relative Frequency +
§Law of Large Numbers = `observed-probability`; E §Overview + §Describing Probability =
`probability-range`. The wave split is forced by Read-first item 6 (every wave-2 skill has
`theoretical-probability` in its prereq chain). atomTypes: `probability-range`, `complement-of-event`
= Cat (both omit `theory.steps` per the bold-answer-trap ruling); the other five = R. No
`masteryOmitted`, no `coverageNote`. Practice 6–8 F / 7–8 D / 3 M per skill; quizzes 8–9 questions
(62 total, 243 options); 23 `[tikz]` blocks. Manifest rebuilt (**344 content / 207 quiz**, +7/+7).
`npm test` 103/103 green (one flaky Windows EPERM in `dq-qa-jobs` filesystem-lock test on the first
run, unrelated to content; clean on rerun).

**Equivalent-options result (the batch's named top risk): clean on the first strict run** — 92/243
options canonicalised (38%), 0 defects, 0 key-equal pairs. Every probability stem pins its form; a
new house convention **"Written form of a probability"** (fraction in simplest form by default,
stem-pinned; decimals/percentages stay in the given form) was recorded in
`docs/content-generation.md` §House mathematical conventions.

**Scenario split held**: A dice + marble jars (+letter cards); B card packs + weather/daily-life;
C spinners + coin runs with trial counts; D recorded tallies (dice/coins/drawing pin/bottle top) +
LLN convergence graphs; E everyday likelihood events + lolly jars + 0–1 number line. 0 cross-skill
duplicate stems over 182 items.

**Luna blind check: 0 answer mismatches across all 62 blind items, but 5 flags and — unlike batch
15 — ALL FIVE VALID** (the first majority-valid round since batch 14): four quiz-copies-practice
duplicates that `audit-duplicate-stems` missed because the stems were reworded while values were
identical (`sample-space` q9/m2, `expected-frequency` q9/m1, `complementary-probability` q8/m2 and
q9/m1 — three of the four were the agents' own earlier dedup fixes that landed on their mastery
cards), plus one genuine ambiguity (`theoretical-probability` m1: Y-as-vowel in PROBABILITY).
Repairs: fresh values/props for the four quiz items with the same misconception→derivation→value
chains; a "counting only A, E, I, O and U as vowels" clarifier in m1. Full six-command gate re-run
clean; targeted luna recheck (`blind-for-check --items`) on the 5 changed items: all re-solved,
0 flags. One repair round total. **Audit-gap note for the tooling backlog:** QUIZ-COPIES-PRACTICE
matching is stem-based and blind to same-values-different-wording duplicates — a value-signature
comparison would have caught all four.

**Ownership/taxonomy findings.** (1) **Law of Large Numbers is absorbed, not unowned**:
`observed-probability` now carries the formal "relative frequency approaches theoretical probability
as trials increase" statement, the convergence graphs and observed-as-estimate;
`expected-vs-observed-trials` (Stage 3) already held the informal version. No dedicated LLN skill
needed. (2) **"Event" as a defined term** (dp-s6adv11-probdata-2 "Define experiments, sample spaces
and events"): defined in `theoretical-probability`'s theory (booklet L556 wording); experiments /
outcomes / sample spaces defined in `sample-space`. Covered, but neither blurb advertises it.

**Blurb-widening candidates for the owner (skills.json untouched, batch-11 staleness class):**
`sample-space` could mention defining experiments/outcomes/events (Advanced dot point);
`complementary-probability`'s two-event phrasing understates its n-outcome sum-to-1 coverage;
`observed-probability` could add "and predict frequencies" (f = rf × trials);
`probability-range` could mention the 5-term likelihood language. **Data defect for the owner:**
`expected-frequency`'s blurb in `data/skills.json` has a mojibake character ("trials � probability").
Also noted: `probabilities-sum-to-one` (Stage 3) has a P(not) = 1 − P(event) fact that slightly
overlaps Stage-4 `complementary-probability`.

**Booklet errata found (taught correctly, none reproduced):** P1 L594/578 `P(black)` for
`P(blue)`; P1 image53 scaffold multiplier 4 instead of 20; P1 Q13a missing ×10 in printed working;
P1 L1402/Q8 corrupted render (stray `$`/HTML around "135"); P2 image2 marks picture/number cards
complementary (ace-ambiguous — replaced with red/black); P2 unsimplified booklet answers (2/10,
995/1000) simplified under pinned stems; P2 Q23 answer omits the probability its stem asks for.

**Diagram checklist — 5 of 7 skills, 23 blocks (16 content + 7 quiz), review at
`http://localhost:5173/#/tikz-check?topic=t-s4-pro` — ranked highest-risk-first:**
1. `observed-probability` (1+1, both DATA DISPLAYS): rf line graphs converging to 0.5 (coin) and
   0.4 (bottle top) — check jittered non-constant slope, label anti-collision, no pre-marked answer.
2. `expected-frequency` (5+2): seven spinners incl. 7-, 8- and 10-sector — check sector count,
   even radial spacing, arrow tip not on an asked sector.
3. `sample-space` (4+2): listing spinners (G,G,G,B,B,R idiom) + number-card figures.
4. `theoretical-probability` (3+1): marble jar, equal 6-sector spinner, Jackson two-spinner
   comparison (shaded blue sectors are GIVENS — confirm they read as data, not answer).
5. `probability-range` (3+1): 0–1 scale strips with descriptor words; A/B/C(/D) arrow scales —
   asked positions must carry numeric anchors only.
Human samples suggested: `theoretical-probability` (dual-role, defines "event"),
`probability-range` (Stage-4-only Cat atom, steps omitted), `complementary-probability`
(two repaired quiz items). No `anchor: none` skills in this batch.

**Committed as `95a8962`** (batch 16, together with the "Written form of a probability" house
convention). The 23-block diagram checklist above is outstanding — review and repair in place on
top of that commit. Batch 14's and 15's diagram checklists remain outstanding alongside it.

### Stage-3 skills per batch (STAGE 3 rule — copy `theory` byte-for-byte)

- **t-s4-int (1):** `locate-integers-number-line`
- **t-s4-frc (2):** `round-decimals`, `equivalent-fractions`
- **t-s4-len (1):** `perimeter-2d-shapes`
- **t-s4-are (4):** `area-of-rectangle`, `area-composite-figures`, `area-of-parallelogram`,
  `area-of-triangle`
- **t-s4-geo (2):** `classify-triangles`, `classify-quadrilaterals`

(All ten already have a `public/content/{id}.json`. Confirm the file is present before
copying; if a listed skill's content file is missing, treat it as a normal generate and
flag it to the human.)

### Mapping notes / uncertainties

- **Skill-count method.** A skill is counted under a topic when **any** of its
  `dotPointIds` maps to that topic. A handful of skills sit on more than one dot point; if
  one spans two Stage-4 topics it is counted in both and should be generated **once** (in
  whichever batch runs first) — the orchestrator skips an already-generated id.
- **t-s4-dat** is the one multi-purpose mapping: `Data Visualisation.md` covers only
  classification (`dp-s4-dat-1`); `Data Classification and Visualisation 2/3` cover
  display (`dp-2`) and interpretation (`dp-3`). Per-skill, pick the section matching the
  skill's own dot point. Both DCV2/DCV3 are TRIAGE **KEEP** (partial-overlap, not
  superseded) — confirmed present in `booklets/Stage 4/`.
- **t-s4-pyt** — topic id is `t-s4-pyt` (Right-angled triangles / Pythagoras); its single
  booklet is `Right-angled Triangles.md`.
- No topic is unmapped and no booklet path is ambiguous — every Stage-4 topic title maps
  cleanly onto same-named booklet file(s), so **no `?` flags** were needed. The only
  split-coverage case is `t-s4-dat` (noted above).

---

## Wave 2 — Stage 5

**Scope:** all 41 Stage-5 topics (18 `s5-core`, 23 `s5-path`) — 297 topic-skill rows /
296 unique skills (`expand-binomial-products` spans t-s5c-alg-a and t-s5p-alg-b; generate
once, in W2-2). **289 net-new**: 7 stage-4 skills tagged into Stage-5 topics were fully
generated in Wave 1 and are **skipped per the ALREADY-COMPLETE rule** (verify both files
exist, count as done): `expand-brackets` (W2-2); `model-word-problems-equations`,
`verify-solutions-substitution`, `equations-from-formulas` (W2-5);
`graph-linear-relationship`, `point-satisfies-line` (W2-7); `linear-real-life` (W2-7).
No theory-only STAGE-3-rule files in this wave.

**Wave-2 conventions (differences from Wave 1):**
- **Batches merge same-family topics** (owner decision 2026-08-03) — one queue row may
  span 2–4 topics, capped ~20 skills. Order = curriculum order (`booklets/QUEUE.md`
  rows 8–45), with `t-s5c-mag` inserted at its topics.json position (it was never in the
  atomisation QUEUE) and the two zero-booklet topics last.
- **Booklets span three directories** — `booklets/Stage 5/` (NEW-origin, supersedes),
  `booklets/Stage 5 Core/`, `booklets/Stage 5 Path/` (per `booklets/TRIAGE.md`). Paths
  below are explicit full filenames; do **not** glob by topic title — five filenames
  don't match their topic (`Financial Maths B…`, `Data Anaylsis A 3…` [sic, typo kept],
  `Functions 2_Graph Regions`, `Variation and Rates of Change 1/2` [no A/B letter]).
- **Stage-6 scope-drift watch** on NEW/Path booklets (analog of Wave 1's stage-5
  exclusions in `Indices.md`).
- Pipeline = the batch-10+ revision throughout, plus the value-signature duplicate class
  (`QUIZ-COPIES-PRACTICE-VALUES`) added to `audit-duplicate-stems.mjs` before W2-1.

**Rounds plan (owner-approved 2026-08-05, plan file `continue-content-generation-campaign-immutable-aho.md`):**
remaining batches run as parallel multi-lane rounds, ~3 generation batches + optional
remediation row per round, one round per session. Lane orchestrators are Opus subagents;
main session is sole writer of this file, the manifest, and skills.json. Trigger for the
next session: **"Run the next content-generation round — follow the rounds plan in
docs/content-queue.md"**.

| Round | Lanes | Constraints honoured |
|---|---|---|
| 1 | W2-4 · W2-5 · W2-15 · R2 | **done 2026-08-05, in-review** — see batch rows + Round-1 notes below |
| 2 | W2-6 · W2-7 · W2-16 | **done 2026-08-11, in-review** — see Round-2 notes below |
| 3 | W2-8 · W2-9 · W2-17 · R3 | **done 2026-08-11, in-review** — see Round-3 notes below. Wave regression 110→55 |
| 4 | W2-10 · W2-11 · W2-19 · R4 | **done 2026-08-12, in-review** — see Round-4 notes below. Wave regression 55→2 (all pre-existing) |
| 5 | W2-12 · W2-13 · W2-18 | **done 2026-08-12, in-review** — see Round-5 notes below. Wave regression held at 2 (both pre-existing residuals) |
| 6 | W2-14 · W2-20 · W2-21 | **done 2026-08-13, in-review** — see batch rows below. Wave regression held at 2 (both pre-existing) |
| 7 | W2-22 · W2-23 | **done 2026-08-13, in-review — LAST ROUND, Wave 2 (Stage 5) now COMPLETE.** See batch rows below. Wave regression held at 2 (both pre-existing, unchanged) |

Per round the main session re-runs each batch gate, full-repo validate, the **unscoped
wave regression** (baseline after W2-3: 60/4/1/102), rebuilds the manifest once, updates
this file, and hands the human review samples + consolidated diagram checklist. Human commits.

| # | Batch | Topic id(s) | Skills | Mapped booklet file(s) | Status | Notes |
|---|---|---|---|---|---|---|
| W2-1 | Financial mathematics A+B | t-s5c-fin-a, t-s5c-fin-b | 12 | `Stage 5 Core/Financial Mathematics A 1_Solve problems involving earning money.md`<br>`Stage 5 Core/Financial Mathematics A 2_Solve problems involving simple interest.md`<br>`Stage 5 Core/Financial Mathematics A 3_Solve problems involving spending money.md`<br>`Stage 5/Financial Maths B Compound Interest Depreciation.md` | in-review | Stage-5 shakedown. 6 generators, gate clean first run, luna 151/151 agree, **0 flags, 0 repair rounds**. Samples: `progressive-income-tax`, `compare-simple-compound`, `earning-money` + **diagram list (3 skills, 23 `[tikz]`)**. No `anchor: none`. See notes below |
| W2-2 | Algebraic techniques A+B+C | t-s5c-alg-a, t-s5p-alg-b, t-s5p-alg-c | 15 | `Stage 5 Core/Algebraic Techniques A 1_Apply the 4 operations to simplify algebraic fractions with numerical denominators.md`<br>`Stage 5 Core/Algebraic Techniques A 2_Apply the distributive law to the expansion of algebraic expressions, and collect like terms where appropriate.md`<br>`Stage 5 Path/Algebraic Techniques B_1 Apply the 4 operations involving algebraic fractions with pronumerals in the denominator.md`<br>`Stage 5 Path/Algebraic Techniques B_2 Factorise algebraic expressions by taking out a common algebraic factor.md`<br>`Stage 5 Path/Algebraic Techniques B_3 Expand binomial products and factorise monic quadratic expressions.md`<br>`Stage 5 Path/Algebraic Techniques C_1 Operate with algebraic fractions involving binomial numerators and numerical denominators.md`<br>`Stage 5/Algebraic Techniques C 2_Further Expansion and Factorisation.md`<br>`Stage 5/Algebraic Techniques C 3_Further Algebraic Fractions.md` | in-review | **15 = topic-skill ROWS; there are 14 UNIQUE skills** (`expand-binomial-products` spans alg-a/alg-b and is counted twice — generated once). `expand-brackets` was listed ALREADY-COMPLETE but is a **DIRTY SKIP** — repaired inline, see notes. **3 skills carry a Stage-6 Advanced dp** (`dp-s6adv11-functions-1`): `expand-brackets`, `factorise-special-products`, `simplify-fractions-by-factorising` — governing dp is the batch topic's, per Read-first item 9 |
| W2-3 | Indices A+B | t-s5c-ind-a, t-s5p-ind-b | 9 | `Stage 5/Indices A 1_Index Laws.md`<br>`Stage 5/Indices A 2_Negative Index.md`<br>`Stage 5 Path/Indices B_1 Apply index laws to algebraic expressions involving negative-integer indices.md` | in-review | NEW Indices A files supersede all 3 OLD Core files. 6 generators, gate clean batch-wide, luna 127/127 agree, 4 flags all valid → 1 repair round, round 2 clean. **Zero `[tikz]` in the batch — no visual-review checklist.** Samples: `establish-negative-indices`, `power-of-product-quotient`, `negative-integer-indices`. No `anchor: none`. See notes below |
| W2-4 | Indices C | t-s5p-ind-c | 14 | `Stage 5 Path/Indices C_1 Describe surds.md`<br>`Stage 5 Path/Indices C_2 Apply knowledge of surds to solve problems.md`<br>`Stage 5 Path/Indices C_3 Describe and use fractional indices.md` | in-review | 14/14 generated (445 items), 3 generators, gate clean incl. VALUES 0 (gate-storm brief worked). Luna 14/14 coverage, 1 mismatch (checker slip), 8 flags → 3 valid (stem pins: "whole-number"→"integer"; two "a,b integers" pins on rationalise-binomial), 5 invalid; targeted re-check 3/3 clean. **Post-round unscoped sweep caught 5 CROSS-SKILL-DUPs vs committed neighbours (irrational/rational-numbers, square-cube-roots, convert-FDP) — repaired W2-4-side only, re-checked clean.** Samples: `real-numbers`, `rationalise-binomial-surd-denominator`, `surd-index-conversion`. **Diagram checklist: real-numbers 24, simplify-surds-operations 7, define-surds 6 (37 blocks; 11 skills figure-free).** Excluded as out-of-scope: Euler's e, root-spiral construction, simultaneous/quadratic-in-disguise exponentials |
| W2-5 | Equations A+B | t-s5c-equ-a, t-s5p-equ-b | 10 | `Stage 5 Core/Equations A 1_Solve linear equations involving up to 3 steps.md`<br>`Stage 5 Core/Equations A 2_Solve linear equations involving one algebraic fraction.md`<br>`Stage 5 Core/Equations A 3_Solve linear equations arising from word problems and substitution into formulas.md`<br>`Stage 5 Path/Equations B_1 Solve monic quadratic equations.md`<br>`Stage 5 Path/Equations B_2 Solve cubic equations.md`<br>`Stage 5 Path/Equations B_3 Solve linear inequalities and graph their solutions on a number line.md` | in-review | 7 net-new generated (296 items, 51 tikz), 5 generators. Skips three-way: 2 clean (`model-word-problems-equations`, `verify-solutions-substitution`), **`equations-from-formulas` DIRTY — figure-scale defect** (trapezium height at half scale), coordinate-only repair. Gate clean; luna 95/95, 3 flags → 2 invalid, 1 valid scope flag (`solve-monic-quadratic-factors` m2 rational-denominator wrapper → replaced with squared-binomial, same roots), targeted re-check clean. One duplicate section agent (B_1, from the concurrency incident) replaced 2 quiz stems safely — spot-check `solve-monic-quadratic-factors` q3/q4. Samples: `represent-inequalities-number-line`, `solve-monic-quadratic-factors`, `solve-cubic-axcubed`. **Diagram checklist: represent-inequalities-number-line 35, equations-from-formulas 9, solve-linear-inequalities 7 (51 blocks).** |
| W2-6 | Equations C | t-s5p-equ-c | 18 | `Stage 5 Path/Equations C_1 Solve linear equations involving algebraic fractions and equations of more than 3 steps.md`<br>`Stage 5 Path/Equations C_2 Rearrange literal equations.md`<br>`Stage 5/Equations C_3 Quadratic Equations.md`<br>`Stage 5/Equations C 4_Simultaneous Equations.md` | in-review | largest batch; NEW `Equations C 4_Simultaneous Equations.md` supersedes OLD Path `Equations C_4…`. Round 2 — see notes |
| W2-7 | Linear relationships A+B | t-s5c-lin-a, t-s5c-lin-b | 16 | `Stage 5/Linear Relationships A 1_Coordinate Geometry.md`<br>`Stage 5/Linear Relationships A 2_Graphing Lines.md`<br>`Stage 5/Linear Relationships B Gradient-Intercept Form.md` | in-review | graph-heavy; 2 clean skips (`graph-linear-relationship`, `point-satisfies-line`); **`linear-real-life` was a DIRTY skip → repaired**. Round 2 — see notes |
| W2-8 | Linear relationships C | t-s5p-lin-c | 9 | `Stage 5/Linear Relationships C 1_Coordinate Geometry Formulas.md`<br>`Stage 5/Linear Relationships C 2_General and Point Gradient Form.md`<br>`Stage 5/Linear Relationships C 3_Coordinate Geometry Problems.md`<br>`Stage 5 Path/Linear Relationships C_3 Use various forms of the equation of a straight line.md`<br>`Stage 5 Path/Linear Relationships C_5 Identify line and rotational symmetries.md`<br>`Stage 5 Path/Linear Relationships C_6 Describe translations, reflections in an axis, and rotations through multiples of 90 degrees on the Cartesian plane, using coordinates.md` | in-review | 6 booklets, 6 dp; NEW `C 2` overlaps OLD `C_3` — map per dot point. Round 3 — see notes |
| W2-9 | Non-linear relationships A+B+C | t-s5c-nli-a, t-s5c-nli-b, t-s5p-nli-c | 17 | `Stage 5 Core/Non-Linear Relationships A 1_Examine the connection between algebraic and graphical representations of quadratics and exponentials.md`<br>`Stage 5 Core/Non-Linear Relationships B 1_Graph and examine quadratic relationships.md`<br>`Stage 5 Core/Non-Linear Relationships B 2_Graph and examine exponential relationships.md`<br>`Stage 5 Core/Non-Linear Relationships B 3_Distinguish between linear, quadratic and exponential relationships by examining their graphical representations.md`<br>`Stage 5 Path/Non-Linear Relationships C_1 Graph parabolas and describe their features and transformations.md`<br>`Stage 5 Path/Non-Linear Relationships C_2 Graph exponentials and describe their features and transformations.md`<br>`Stage 5 Path/Non-Linear Relationships C_3 Graph hyperbolas and describe their features and transformations.md`<br>`Stage 5 Path/Non-Linear Relationships C_4 Graph circles and describe their features and transformations.md`<br>`Stage 5 Path/Non-Linear Relationships C_5 Distinguish between different types of graphs by examining their algebraic and graphical representations and solve problems.md`<br>`Stage 5 Path/Non-Linear Relationships C_6 Graph and compare polynomial curves and describe their features and transformations.md` | in-review | graph-heavy (pgfplots). Round 3 — see notes |
| W2-10 | Numbers of any magnitude | t-s5c-mag | 7 | `Stage 5 Core/Numbers of Any Magnitude 1_Identify and describe very small and very large measurements.md`<br>`Stage 5 Core/Numbers of Any Magnitude 2_Find absolute and percentage error.md`<br>`Stage 5 Core/Numbers of Any Magnitude 3_Estimate and round numbers to a specified degree of accuracy.md`<br>`Stage 5 Core/Numbers of Any Magnitude 4_Express numbers in scientific notation.md` | in-review | 7/7 (pre-generated by an earlier partial session, untracked). ALREADY-COMPLETE gate CLEAN on all 7 first pass; luna 7/7 coverage, **0 flags, 0 mismatches, 0 repairs**. 6 figure-free number skills + `absolute-error` (4 [tikz]). Samples: `scientific-notation`, `percentage-error`, `round-significant-figures`. No `anchor: none`. Round 4 — see notes |
| W2-11 | Polynomials | t-s5p-pol | 10 | `Stage 5 Path/Polynomials_1 Define and operate with polynomials.md`<br>`Stage 5 Path/Polynomials_2 Divide polynomials.md`<br>`Stage 5 Path/Polynomials_3 Apply the factor and remainder theorems to solve problems.md`<br>`Stage 5 Path/Polynomials_4 Graph polynomials.md` | in-review | 10/10 (pre-generated, untracked). ALREADY-COMPLETE gate CLEAN first pass; luna 10/10 coverage, 0 answer mismatches. 1 repair: `graph-polynomials-factored` q8 distractor `-13`→`-1` (value contradicted its own `why` "added the constants": sum = −1). INVALID flags recorded: `find-equation-polynomial-graph` 9 figure-flags = schematic vertical-compression convention (curve scaled to window, y-intercept **labelled its true value**, roots at true x, leading-coeff hint — Round-3 `graph-power-curves` precedent); `polynomial-roots-multiplicity` q2 (standard cut/bounce/inflect taxonomy). **DEFERRED to human**: `factor-theorem` q8 (max-zeroes of degree 5) + m4 ($x^n-1$ divisible by $x-1$, arbitrary $n$) name degrees beyond the card's "degree ≤4" — conceptual, no degree-5 factoring performed; owner to rule whether to pin in-scope. Samples: `factor-theorem`, `graph-polynomials-factored` (repaired), `find-equation-polynomial-graph` (schematic graphs). 3 diagram skills (71 [tikz]). Round 4 — see notes |
| W2-12 | Logarithms | t-s5p-log | 9 | `Stage 5 Path/Logarithms_1 Examine logarithms both numerically and graphically.md`<br>`Stage 5 Path/Logarithms_2 Establish and apply the laws of logarithms to solve problems.md` | in-review | 9/9 net-new, 4 generators. Gate clean batch-wide (VALUES 0 — literal-poor log family pre-empted by re-basing quiz literals). Luna full coverage, 0 answer mismatches, 1 valid repair (`laws-of-logarithms` q8 stem form-pin) + 1 invalid (domain-restriction over-reach). Samples: `graph-log-functions`, `laws-of-logarithms`, `logarithmic-scales`. **Diagram checklist: graph-log-functions 23, logarithmic-scales 2 (25 blocks; 7 skills figure-free).** No `anchor: none`. Round 5 — see notes |
| W2-13 | Functions and other graphs | t-s5p-fnc | 14 | `Stage 5 Path/Functions and Other Graphs_1 Define relations and functions, and use function notation.md`<br>`Stage 5 Path/Functions and Other Graphs_2 Find the domain and range of a function and graph functions.md`<br>`Stage 5/Functions 2_Graph Regions.md` | in-review | 14/14 net-new, ~5 generators. Gate clean batch-wide (0 across all dup classes). Luna full coverage, **339/339 items, 0 answer mismatches**, 1 valid repair (`domain-and-range` q5 figure arrow `<->`→`->` for restricted domain) + 6 invalid (5 booklet-anchored `solve-function-equation` scope + 1 luna arithmetic slip). 3rd dp covered by NEW `Functions 2_Graph Regions.md`. Samples: `domain-and-range`, `graph-region-multiple-inequalities`, `reflect-function-graphs`. **Diagram checklist: 9 skills, 178 blocks — domain-and-range 39, graph-linear-inequalities-region 30, graph-region-multiple-inequalities 25, vertical-line-test 25, relations-and-functions 11, inequality-from-region 22, graph-function-transformations 10, dilate-function-graphs 8, reflect-function-graphs 8; 5 symbolic skills figure-free.** No `anchor: none`. Round 5 — see notes |
| W2-14 | Variation and rates of change A+B | t-s5p-var-a, t-s5p-var-b | 13 | `Stage 5/Variation and Rates of Change 1_Direct and Inverse Proportion.md`<br>`Stage 5/Variation and Rates of Change 2_Graphs of Rates of Change.md`<br>`Stage 5 Path/Variation and Rates of Change B_2 Analyse the relationship between graphs and variable rates of change.md` | in-review | NEW filenames lack the A/B letter — mapping above is authoritative. 13/13 net-new, 5 section generators (define/represent: `describe-direct-variation`, `describe-inverse-variation`, `variation-from-table`; direct-variation+conversion graphs: `graph-direct-variation`, `conversion-graphs`; inverse-variation graphs+solving: `graph-inverse-variation`, `solve-variation-equation`; constant-rate+speed-time: `constant-rate-graphs`, `speed-time-graph-acceleration`, `distance-from-speed-time-area`; variable/qualitative rate+construction: `variable-rate-distance-time`, `qualitative-rate-of-change`, `construct-rate-of-change-graphs`). Gate clean batch-wide (265 figures scanned). Wave regression held at 2 (pre-existing, untouched). Luna full coverage (151/151), 2 answer mismatches (1 repaired, 1 luna arithmetic slip verified correct — no change), 8 flags → **6 valid repairs / 2 invalid**. Repairs: `variation-from-table` q6 (ambiguous true-both-ways distractor made factually false), `graph-direct-variation` m3 (multiplicative-vs-additive wording), `solve-variation-equation` q2/q7 (stem pinned "in terms of"), `conversion-graphs` m3 (quoted student claim reworded), `speed-time-graph-acceleration` q3 (implausible 216 km/h "taxiing" → take-off roll, numbers unchanged). Invalid: `describe-inverse-variation` q4/q5 (both ruled working-as-designed). `anchor: none`: `constant-rate-graphs` (booklet coverage thin/indirect). No `masteryOmitted`/`coverageNote`. **House-convention flag (unsettled, owner to rule):** booklet mixes "constant of variation"/"constant of proportionality" for $k$ interchangeably — standardised on "constant of variation" this batch. Samples: `constant-rate-graphs` (anchor:none), `variation-from-table` (repaired), `speed-time-graph-acceleration` (repaired). **Diagram checklist: 10 of 13 skills, 265 blocks** — `constant-rate-graphs` 36, `distance-from-speed-time-area` 35, `graph-inverse-variation` 33, `construct-rate-of-change-graphs` 32, `speed-time-graph-acceleration` 27, `graph-direct-variation` 26, `conversion-graphs` 25, `variable-rate-distance-time` 25, `qualitative-rate-of-change` 24, `solve-variation-equation` 2; `describe-direct-variation`/`describe-inverse-variation`/`variation-from-table` figure-free. Final `validate --only` clean. Round 6 — see notes |
| W2-15 | Trigonometry A+B | t-s5c-trg-a, t-s5c-trg-b | 15 | `Stage 5 Core/Trigonometry A 1_Demonstrate and explain the constancy of trigonometric ratios for a given angle in right-angled triangles.md`<br>`Stage 5 Core/Trigonometry A 2_Apply trigonometry to solve right-angled triangle problems.md`<br>`Stage 5 Core/Trigonometry B 1_Solve right-angled triangle problems involving angles of elevation and depression.md`<br>`Stage 5 Core/Trigonometry B 2_Solve right-angled triangle problems involving bearings.md` | in-review | 15/15 generated (422 items), 6 generators (A1/A2 split two ways each). Gate clean; figure-scale note: script matched 0 labels in section A1 (unit-less side numbers, outside its `N cm` regex) — generator hand-verified 21 figures ≤2% deviation; **script-reach gap logged for tooling backlog**. Luna 177/177, 2 mismatches + 1 shuffle warning all invalid (checker misread rotated triangles / rounded early — the distractors' own traps), 2 valid ambiguity flags repaired (`find-angle-from-ratio` q8 round-once-at-end key 56°→55° + new option set; `define-trig-ratios` m1 stem pin), targeted re-check clean. Two booklet errors found, not propagated (A2 DMS example 84.78→83.78; B2 Q18 36°36′). Samples: `bearings-problems`, `identify-elevation-depression`, `find-angle-from-ratio` + priority eyeball on `define-trig-ratios` rotated triangles. **Diagram checklist: 13 skills, 338 blocks — bearings-problems 47, bearing-between-two-points 37, identify-elevation-depression 32, label-trig-sides 30, elevation-depression 29, trig-practical-problems 28, trig-find-side 27, trig-find-angle 25, trig-ratio-constancy 24, define-trig-ratios 23, trig-find-side-denominator 21, bearings 12, evaluate-trig-ratio 3.** |
| W2-16 | Trigonometry C | t-s5p-trg-c | 11 | `Stage 5/Trigonometry C 1_3D Trigonometry.md`<br>`Stage 5/Trigonometry C 2_Non-Right-Angled Trigonometry.md` | in-review | 3D figures — tikz-3dplot territory. Round 2 — see notes |
| W2-17 | Trigonometry D | t-s5p-trg-d | 13 | `Stage 5/Trigonometry D Circle Trigonometry.md` | in-review | 1 booklet, 2 dp, 13 skills — deal sections carefully. Round 3 — see notes |
| W2-18 | Area/SA + Volume A+B | t-s5c-are-a, t-s5p-are-b, t-s5c-vol-a, t-s5p-vol-b | 19 | `Stage 5 Core/Area and Surface Area A 1_Solve problems involving areas and surface areas.md`<br>`Stage 5 Core/Area and Surface Area A 2_Develop and apply the formula for surface areas of cylinders.md`<br>`Stage 5 Core/Area and Surface Area A 3_Solve problems involving surface areas of cylinders and related composite solids.md`<br>`Stage 5 Path/Area and Surface Area B_1 Solve problems involving surface areas.md`<br>`Stage 5 Core/Volume A 1_Solve problems involving composite solids consisting of right prisms and cylinders.md`<br>`Stage 5 Path/Volume B_1 Solve problems involving volumes.md` | in-review | 19/19 net-new, 6 section generators. Gate clean batch-wide (0 across all dup classes; 261 figures scanned by figure-scale). Luna full coverage, **0 answer mismatches after repairs**, **13 valid repairs / 4 invalid**. Valid repairs incl. **2 genuine key arithmetic errors** (`surface-area-partial-cylinder` q3 284.16→284.20, q5 253.50→253.52) and **1 impossible solid rebuilt** (`surface-area-pyramid` q2: base 10×6 + slants 8/9 gave contradictory heights → base 18×10, slants 13/15, h=12, key 564, figure to-scale). Others: unreachable-distractor rederivations (`surface-area-pyramid` q9, `surface-area-cone` q7, `volume-prism-curved-cross-section` q6), not-to-scale figure fix (`surface-area-cone` q2), under-determined stems (`volume-sphere` m2, `volume-prism-curved-cross-section` m1), mis-rounded distractor values (`volume-composite-solids` q1/q2), de-dup (`nets-of-prisms` q7 hex→pentagonal). Samples: `surface-area-composite-pyramid-cone-sphere`, `surface-area-pyramid` (rebuilt q2), `volume-composite-solids`. **All 19 carry [tikz] (261 blocks) — full visual-review checklist.** `coverageNote` on 4 single-formula atoms (surface-area-sphere/-hemisphere, volume-sphere/-hemisphere). Round 5 — see notes |
| W2-19 | Geometrical figures A+B+C | t-s5c-geo-a, t-s5p-geo-b, t-s5p-geo-c | 20 | `Stage 5 Core/Properties of Geometrical Figures A 1_Identify and describe the properties of similar figures.md`<br>`Stage 5 Core/Properties of Geometrical Figures A 2_Solve problems using ratio and scale factors in similar figures.md`<br>`Stage 5 Path/Properties of Geometrical Figures B_1 Identify and explain congruence.md`<br>`Stage 5 Path/Properties of Geometrical Figures B_2 Develop and use the conditions for congruent triangles.md`<br>`Stage 5 Path/Properties of Geometrical Figures B_3 Develop and apply the minimum conditions for triangles to be similar.md`<br>`Stage 5 Path/Properties of Geometrical Figures B_4 Establish and apply properties of similar shapes and solids.md`<br>`Stage 5 Path/Properties of Geometrical Figures B_5 Apply logical reasoning to numerical problems involving plane shapes.md`<br>`Stage 5 Path/Properties of Geometrical Figures C_1 Construct formal proofs involving congruent and similar triangles.md`<br>`Stage 5 Path/Properties of Geometrical Figures C_2 Apply logical reasoning to proofs involving plane shapes.md` | in-review | 20/20. **8 pre-generated** (geo-a 4 + geo-b congruence/similar-tests 4, untracked, gate-clean) + **12 authored this round** (5 section agents: A2, B4, B5, C1, C2). Luna full coverage on all 20, 0 answer mismatches. Repairs: `congruent-triangle-tests` q7 stem pin (SAS-via-alternate-angles alt path); `prove-congruent-triangles` m3 stem fixed (labels contradicted figure+solution: A,D,C collinear/B apex); `prove-properties-triangles-quadrilaterals` q1/q6 options reworked (order-only twin of key + undefined-point-E distractors → 4 distinct well-defined pairs); `prove-quadrilateral-tests` q5/q6/q9/m1/m2/m3 figures redrawn to-scale (markers contradicted coordinates; converse-pythagoras precedent) + q9 stem pinned "most specific type" + 2 latent F5/D1 figures fixed; `interior-angle-regular-polygon` q2 figure octagon→16-gon. INVALID (NSW convention): `congruent-triangle-tests` q6/q9 (NSW **AAS = 2 angles + 1 side, no separate ASA test**; theory.facts confirms). **DEFERRED to human**: `exterior-angle-regular-polygon` q5/q7/m1/m2 use the interior↔exterior supplementary link not named in the blurb (elementary, ruled in-service — owner to confirm or push to `interior-angle-regular-polygon`); `exterior-angle-sum-polygon` q5/q6 same type different regime (n=8 vs n=29). House conventions honoured (inclusive trapezium, true non-convex diagonals). `exterior-angle-regular-polygon` + `angle-properties-plane-shapes` carry a quiz `coverageNote`. Samples: `prove-quadrilateral-tests` (repaired figs), `prove-congruent-triangles` (repaired m3), `angle-properties-plane-shapes` (multi-step). No `anchor: none`. **All 20 carry [tikz] (347 blocks) — full visual-review checklist.** Round 4 — see notes |
| W2-20 | Circle geometry | t-s5p-cir | 9 | `Stage 5 Path/Circle Geometry_1 Prove and apply angle and chord properties of circles.md`<br>`Stage 5 Path/Circle Geometry_2 Prove and apply tangent and secant properties of circles.md` | in-review | pure TikZ stress (circles, chords, tangents). 9/9 net-new, 2 section generators (Section A dp-1: `circle-angle-terminology`, `chord-properties`, `circle-angle-properties`, `cyclic-quadrilateral-properties`, `apply-chord-angle-properties`; Section B dp-2: `tangent-secant-properties`, `alternate-segment-theorem`, `intersecting-chords-secants`, `apply-tangent-secant-properties`). Gate clean batch-wide (216 figures scanned, 13 NEAR-DUP advisory only). **Systemic figure defect found pre-luna and repaired**: 77 of 96 `[tikz]` blocks across the 4 Section-A skills referenced the circle centre as `(O)` without ever defining `\coordinate (O)` — a hard TikZ compile error that would have rendered as "⚠ Diagram failed to render"; fixed mechanically (all 77) plus centre-dot/boundary added where missing (39). A mandated re-verification pass on top found 28 total geometry defects. Wave regression held at 2 (pre-existing). **Luna 2 full rounds + 2 targeted re-checks, 100% coverage, final: 0 mismatches, 0 flags.** Round 1 valid repairs: `circle-angle-properties` q1/q4/m3 (drawn angles 10-15° off their stated values, recomputed exact); `apply-chord-angle-properties` 1 mismatch + 1 under-determination + 5 figure-contradicts-answer (q1 rebuilt — new target OM with a full misconception→derivation→value chain; q6-q8/m1/m2 angle/length fixes); `tangent-secant-properties` m1 (circular tick-mark removed) + m2/q9 (mutually-inconsistent length/angle givens decoupled). Round-1 invalid: `alternate-segment-theorem` q5 (checker fell for the item's own modelled misconception, key verified correct by hand, no change). Round 2+: `tangent-secant-properties` q2 (label/coordinate mismatch, valid); `apply-tangent-secant-properties` q8 (why-wording, valid), q9/m3 (missing secant + a geometrically-impossible PA=5cm given — min reachable ≈7.00cm — PA→8cm, fully re-derived); `circle-angle-terminology` q7/q9 duplication flag ruled **invalid** (distinct structural types: construct-the-name vs discriminate-decoys vs vertex-order notation). Final rounds: `intersecting-chords-secants` q8/m1 (nonstandard `|||` "is similar to" → house `\sim`, matching 53 existing uses across `prove-similar-triangles`/`similarity-statements`) and q9/m3 (stale off-circle coordinate + an "at the surface" wording contradicting the stated height, both fixed). No `anchor: none`, no `masteryOmitted`/`coverageNote`. **NSW convention reaffirmed**: AAS = 2 angles + 1 side in any position, no separate ASA test (live in this batch's proofs, no luna override needed). **New house-notation ruling**: similarity uses `\sim`, never `|||`. **Standing generator-brief addition for future tangent/secant batches**: verify any two of {radius, OP, tangent length, half-angle} are mutually consistent before adding a third as an independent given — this batch's recurring failure mode. Samples: `apply-chord-angle-properties` (heaviest repair, q1 rebuilt), `circle-angle-properties` (O-bug + angle fixes), `apply-tangent-secant-properties` (missing secant + impossibility fix). **All 9 skills carry [tikz] (216 blocks) — full visual-review checklist**: `circle-angle-terminology` 24, `chord-properties` 26, `circle-angle-properties` 24, `cyclic-quadrilateral-properties` 23, `apply-chord-angle-properties` 23, `tangent-secant-properties` 24, `alternate-segment-theorem` 24, `intersecting-chords-secants` 24, `apply-tangent-secant-properties` 24. Final `validate --only` clean. Round 6 — see notes |
| W2-21 | Data analysis A+B | t-s5c-dat-a, t-s5c-dat-b | 17 | `Stage 5/Data Analysis A 1_Standard Deviation.md`<br>`Stage 5/Data Analysis A 2_Quartiles and Box Plots.md`<br>`Stage 5/Data Anaylsis A 3_Grouped Data.md`<br>`Stage 5/Data Analysis B_Bivariate Data.md` | in-review | third filename has the "Anaylsis" typo — keep as-is, path above is exact. 17/17 net-new, no `anchor: none`, 5 section generators (Standard Deviation: `standard-deviation`, `effect-of-changes-on-sd`; Quartiles core: `five-number-summary`, `five-number-summary-from-displays`, `quartiles-from-cumulative-histogram`, `interquartile-range`; Box plots: `box-plots`, `box-plot-percentages`, `compare-box-plots`, `skewness-from-displays`; Bivariate foundational: `bivariate-data`, `independent-dependent-variables`, `scatter-plot`, `line-of-best-fit`; Bivariate interpretation: `describe-association`, `interpolation-extrapolation`, `outlier-effect-line-best-fit`). **The "Anaylsis A 3_Grouped Data" booklet is confirmed NOT used by any of the 17** — its grouped-frequency/mean/median material maps to Stage-6 skills outside this batch; `quartiles-from-cumulative-histogram`'s own blurb pins ungrouped data. Gate clean batch-wide (339 figures scanned, 226 NEAR-DUP advisory only), run twice before/after repair. Wave regression held at 2 (pre-existing, untouched). Luna full coverage (100%), 8 of 17 skills clean round 1; 8 repaired, `compare-box-plots` needed 2 rounds. **12 valid repairs** (each with a misconception→derivation→value chain where a value changed): `standard-deviation` q3/q7 (unreachable distractor + an impossible-max scenario fixed), `five-number-summary` q8/m3 (impossible exact-quartile-match reframed as a threshold question), `interquartile-range` q2 (near-dup → sign/zero-crossing case), `compare-box-plots` q8 (boundary-touch wording), `skewness-from-displays` q6 (a missing box-plot figure added, reverse-engineered from the solution's own stated values) + q7 (why-text clarified), `line-of-best-fit` q1 (why clarified) + q4 (implausible "vintage cars" → "second-hand cars"), `outlier-effect-line-best-fit` q6 (duplicate figure → reversed-direction outlier case) + m1 (under-determination fixed), `describe-association` q4 (**genuine mislabel** — computed $r\approx-0.86$, corrected key "moderate"→"strong") + q2/q6 (boundary/duplicate datasets replaced with verified $r$ values so weak/moderate/strong are now three genuinely distinct cases). **Invalid** (checker error or defensible taught convention, not repaired): `five-number-summary-from-displays` q2/q6 (checker arithmetic slip, keys independently re-verified correct), `skewness-from-displays` q5 + m2 (checker applied an untaught box-half heuristic against the card's own taught whisker-shape rule — m2 exists specifically to correct this misconception), `scatter-plot` q6 vs q3 (legitimate on-gridline vs interpolated-point case variety, not duplication), `line-of-best-fit` m1 ("different resale values" claim independently verified false; by-eye construction ambiguity is inherent to the taught skill). **RULED by owner (2026-08-13):** `compare-box-plots` q5 — key stays "exactly half the time". Matches the median-is-a-50/50-split convention already used elsewhere in the batch; "cannot be determined" (luna's position, hinging on odd-n/tie edge cases a box plot can't reveal) would require reasoning outside this skill's scope. No file change. No `masteryOmitted`/`coverageNote` anywhere. **Unrelated pre-existing bug flagged in passing, not part of this batch**: `inverse-operations-number-sentences` quiz was reported with a JSON parse error. Re-checked 2026-08-13 (`JSON.parse` + `validate.mjs --only`) — does not reproduce, 0 errors. Likely already fixed by the concurrent Stage-3-backfill campaign (the file is untracked, outside this batch's skill set). No action taken. Samples: `standard-deviation`, `five-number-summary`, `interquartile-range`, `compare-box-plots` (**priority — unresolved q5 needs a ruling**), `skewness-from-displays` (verify new q6 figure renders), `line-of-best-fit`, `outlier-effect-line-best-fit`, `describe-association`, plus `box-plot-percentages`/`quartiles-from-cumulative-histogram`/`scatter-plot` as zero-flag sanity-check additions. **Diagram checklist: 11 of 17 skills, 339 blocks** — `box-plot-percentages` 45, `compare-box-plots` 45, `skewness-from-displays` 45, `box-plots` 34, `scatter-plot` 32, `interpolation-extrapolation` 27, `line-of-best-fit` 26, `describe-association` 25, `quartiles-from-cumulative-histogram` 21, `five-number-summary-from-displays` 20, `outlier-effect-line-best-fit` 19; `standard-deviation`/`effect-of-changes-on-sd`/`five-number-summary`/`interquartile-range`/`bivariate-data`/`independent-dependent-variables` figure-free. Final `validate --only` clean. Round 6 — see notes |
| W2-22 | Probability A+B | t-s5c-pro-a, t-s5p-pro-b | 13 | `Stage 5 Core/Probability A 1_Describe multistage chance experiments involving independent and dependent events.md`<br>`Stage 5 Core/Probability A 2_Solve problems for multistage chance experiments.md`<br>`Stage 5 Path/Probability B_1 Solve problems involving Venn diagrams and 2-way tables.md`<br>`Stage 5 Path/Probability B_2 Use the language, 'if … then', 'given', 'of' and 'knowing that', to examine conditional statements and identify common mistakes in interpreting the language.md`<br>`Stage 5 Path/Probability B_3 Describe mutually and non-mutually exclusive events using specific language and calculate related probabilities.md` | in-review | pro-a has 3 dp vs 2 booklets — `dp-s5c-proa-3` (simulations) has **no booklet section at all**, so `probability-simulations` is `anchor: none` (generated from the dot point + `observed-probability.json` for voice). 13/13 net-new (402 items), 5 section generators. Gate clean batch-wide (189 figures scanned; 2 NEAR-DUP advisories on `conditional-probability` ruled legitimate — condition reversed, different denominators/answers). Luna full coverage (159 items), 0 answer mismatches, 4 flags → 3 valid / 1 invalid, 1 repair round, targeted re-check clean, **no DEFERRED items**. Repairs: `multistage-outcomes` m3 (duplicate of q8 — q8 rebuilt to 6-cards-without-replacement, distractors re-derived), `probability-independent-events` m3 (necessity-vs-sufficiency wording), `independent-dependent-events` q4 (under-determined stem pinned). Invalid: `complementary-multistage` q1 (luna mis-modelled 4-battery scenario as binary — the option's own `why` already covers it). **Real bug caught by an optional render smoke-test** (this batch authors the repo's first Venn diagrams): `\fill[pattern=north east lines]` compiles under TikZJax but renders invisible — 55 fills across `set-notation-events`/`conditional-probability`/`compound-event-probability` were silently blank; fixed to `fill=gray!35` (81 shipped precedents) and re-verified, 0 compile failures over 98 diagrams. **New house convention: shade Venn/region diagrams with `fill=gray!35`, never `pattern=…`.** Also caught and fixed 2 wrong answers in the B_3 booklet's own "Your Turn" key (not reproduced). House rulings: `P(A \mid B)`, working as `n(A∩B)/n(B)`; `A'` as the sole complement form; conditional probability defined for any events (B_2's "only applies if dependent" overridden); no addition rule/inclusion-exclusion/independence test (Stage 6). Samples: `probability-simulations` (mandatory, anchor:none), `set-notation-events` (first Venn shading + only `atomType: T`), `compound-event-probability` (heaviest figures). **Diagram checklist: 10 of 13 skills, 189 blocks** — `compound-event-probability` 34, `set-notation-events` 30, `venn-diagrams-two-way-tables` 29, `conditional-probability` 21, `probability-independent-events` 19, `probability-dependent-events` 18, `multistage-outcomes` 16, `complementary-multistage` 12, `multistage-probability-by-counting` 7, `mutually-exclusive-events` 3; `independent-dependent-events`/`probability-simulations`/`multiplication-principle` figure-free. Round 7 — see notes |
| W2-23 | Networks + Data analysis C | t-s5p-net, t-s5p-dat-c | 7 | **none — no booklet exists for either topic** | in-review | **whole-batch `anchor: none`** — generated from `data/dotpoints.json` + skill records, no booklet to cross-reference (full dot-point→scope mapping recorded in Round-7 notes below). 7/7 net-new (236 items), 2 section generators (networks / data-analysis-C). Gate clean batch-wide (122 figures scanned), run 3 times across 2 repair rounds; generators self-cleared 6 defects pre-report (a leaked key, 2 `QUIZ-COPIES-PRACTICE-VALUES`, a shared-option-pool leak). **Cross-skill backstop**: re-ran the gate over these 7 plus 9 adjacent stats skills (435 items) — 0 defects, confirming no leak into `census-vs-sample`/`misleading-graphs`/etc. Luna full coverage (91/91 items, 100%), 0 answer mismatches, 8 flags → 3 valid / 5 invalid (majority-invalid rule fired, no 3rd full round), 1 further flag from a targeted re-check (1 valid), **no DEFERRED items**. Repairs: `planar-graphs` q4 (twice — an originally-true-either-way option, then a self-contradictory replacement distractor, both re-derived with full misconception chains), `evaluate-sampling-methods` q6 (stem pinned to stratified aim; distractor rebuilt with a genuine derivation) + m2 (referential ambiguity fixed), `critique-statistical-reports` m1 (ask narrowed to match the solution's own ranking). Invalid: `planar-graphs` q9/q4-round-2 (luna misread deliberate before/after and labelled-graph conventions), `evaluate-sampling-methods` q4/q5/m1 (luna applied university-level allocation theory against the skill's own taught rule that equal-per-subgroup ≠ stratified — same class as the W2-21 `skewness-from-displays` ruling: **luna sees the card, not the `theory` block**). `critique-statistical-reports` deliberately omits `theory.steps` (no genuine multi-stage method — a checklist would be the vacuous-procedure defect). Samples: `planar-graphs` (heaviest figures + repaired item), `evaluate-sampling-methods` (2 repair rounds + the overruled luna flag, worth an owner sanity-check), `critique-statistical-reports` (2 repair rounds, no theory.steps) — **all 7 are `anchor:none` and belong in the human sample set**, these three concentrate the risk. **Diagram checklist: 6 of 7 skills, 122 blocks** — `planar-graphs` 39, `describe-networks` 35, `eulerian-trails-circuits` 29, `eulers-formula` 11, `plan-statistical-inquiry` 4, `critique-statistical-reports` 4; `evaluate-sampling-methods` figure-free (7 KaTeX tables instead). **All 114 network figures built from `tikz-prompt.md`'s general construction rules — no fixed template exists for node/edge graphs — needs unusually careful eyeballing**, priority: the Königsberg multigraph (`eulerian-trails-circuits` D4/M1, 4 Bézier bridges), loops/multi-edges as Béziers, two-panel comparison figures (esp. the just-edited `planar-graphs` q4), $K_5$/$K_{3,3}$ dense drawings, deliberate non-vertex crossings, directed mid-line arrows. Round 7 — see notes |

**Total: 297 topic-skill rows = 289 to author + 7 ALREADY-COMPLETE skips + 1 cross-topic
duplicate generated once.**

**Round-1 notes (2026-08-05, W2-4 + W2-5 + W2-15 + R2, all in-review, uncommitted).**
- **Wave regression (unscoped, post-round): 23 / 1 / 1 / 87 = 112** (baseline 60/4/1/102 = 167;
  every class ≤ baseline). Remaining debt = R3 (57) + R4 (59) pockets minus overlap, plus the
  one pre-existing `evaluate-index-notation`/`zero-index` CROSS pair. Full-repo validate clean
  (248 warnings, unchanged); manifest 414/277; tests 105/105.
- **New gate lesson: the `--only`-scoped batch gate is blind to CROSS-SKILL-DUP against
  out-of-batch skills.** W2-4's C_1 skills shipped 5 stem collisions with committed
  neighbours (`irrational-numbers`, `rational-numbers`, `square-cube-roots`, `convert-FDP`)
  that the batch gate could not see; the per-round unscoped sweep caught them and they were
  repaired W2-4-side (values + stem rewords, full option rederivation, luna re-checked).
  Standing rule: generators of skills with close committed neighbours should read the
  neighbour's quiz/content values; the round-end unscoped sweep is the backstop.
- **Tooling backlog:** `audit-figure-scale` only parses unit-bearing labels (`8 cm`) — the
  trig booklet convention is unit-less side numbers, so section A1's green was vacuous
  (generator hand-verified 21 figures instead). Extend the regex to bare numeric side labels.
- **Consolidated diagram checklist for human visual review: 19 skills, 426 [tikz] blocks** —
  W2-15 (13 skills, 338), W2-5 (3 skills, 51), W2-4 (3 skills, 37). Priority eyeballs:
  `define-trig-ratios` (two luna misreads of rotated triangles), `equations-from-formulas`
  (re-scaled trapezium), `bearings-problems` (47 blocks, crowded vertices).
- **skills.json / practice-card observations for owner** (report-only, nothing edited):
  1. Prereq suggestions: `trig-practical-problems` +`trig-find-side`;
     `identify-elevation-depression` +`unknown-angles-parallel`; `elevation-depression`
     lists harder `trig-practical-problems` (difficulty inversion); `surd-domain-conditions`
     +`square-cube-roots` (explicit); `factorise-index-expressions` + an algebra-factorising
     prereq (DOTS mastery); `factorise-common-factor` lists `factorise-negative-common-factor`
     as prereq — teaches negative case first, inverted vs booklet.
  2. Blurb gaps: `rationalise-binomial-surd-denominator` omits the dominant `a/(n±√c)` form;
     `define-surds` omits the n≥2 / even-index-positive conditions; `real-numbers` blurb
     near-restates `locate-irrationals-number-line`.
  3. R2 pocket practice-card debt (batch-1 vintage, not repaired — practice edits out of
     remediation scope): `translate-expressions` m1–m3 false-continuation solution lines +
     q4 unflagged clone of d3; restated-answer trailing lines in `translate-expressions` d5,
     `algebraic-notation` q6, `factorise-common-factor` d5; `factorise-negative-common-factor`
     solutions skip the divide-out line vs its own theory.steps; whole pocket sits at 5+5
     cards under the 6-card warn floor with no coverageNote (pre-dates higher-count rule).
  4. Two booklet errata (not propagated): Trig A2 DMS worked example cos(51°38′) ⇒ 84.78
     (should be 83.78); Trig B2 Q18 prints 36°36′ where 67°36′ is implied.
  5. Borderline calls held: surd-domain M2/q7 enumerate-values items (kept — no interval
     notation); W2-15 base/height figures instead of booklet's Pythagoras-dependent isosceles
     (untaught-prereq risk); `surd-index-conversion` M3 single-power translation (kept);
     `fractional-indices` m4 degenerate a=1 case (luna flag ruled invalid, recorded).
- **Orchestration lessons (for rounds 2-7):** lane orchestrators must spawn generators with
  run_in_background:false (background children orphan to the main session when the lane
  stops); session-wide cap is 20 concurrent subagents — stagger lane spawns so ~6 generators
  per lane fit; one duplicate-generator incident (W2-5 B_1) was benign but is the failure
  mode to avoid.

**Round-2 notes (2026-08-11, W2-6 + W2-7 + W2-16, all in-review, uncommitted — human commits).**
Three parallel lanes, Opus lane orchestrators + section-owning Opus generators, luna blind
check on all 43 ids, one adjudication round. **42 net-new skills authored + `linear-real-life`
dirty-skip repaired; 2 clean ALREADY-COMPLETE skips left untouched.**

- **Gate:** every lane cleared the full 6-command gate batch-wide; the combined 43-id gate is
  clean (0 defects in every class; the only validate warnings are the 2 pre-existing
  `linear-real-life` practice-tier shortfalls, foundation/development 5 cards each — Wave-1
  content, out of the quiz-only remediation scope).
- **Luna (43 skills, `--resolve-mode figures-first`, 0 retries, coverage complete on every
  skill): exactly 1 answer mismatch** (`trigonometry-3d` q9 — luna slip, 59.49°→59° is the
  correct key), and a flag set that adjudicated to **10 genuine repairs**; the rest were
  invalid or deferred (below).
- **10 repairs applied, targeted luna re-check of only the changed items came back 0/0:**
  1. `cosine-rule` q3 — value error, key `11.23`→**`11.22`** (√125.999=11.2249) + x² distractor `126.02`→`126.00`.
  2. `cosine-rule` q6 — figure vertices `V,A,B` relabelled `A,B,C` to match the stem (angle ABC, side AC); answer 196 m unchanged.
  3. `area-rule-triangle` q9 — quadrilateral was geometrically impossible (diagonal AC = 55.9 from △ABC vs 64.8 from △ACD); △ACD sides `48,36`→**`43,29`** so AC agrees; total area `1885`→**`1648`** m² + distractors.
  4. `area-rule-triangle` m1 (mastery card) — same shared-diagonal inconsistency; △XYZ `4.5,5.4`→**`4.3,5.3`** so XZ agrees; total `27.3`→`26.5` km².
  5. `trigonometry-3d` q7 — top-down bearing figure drew the rays reversed vs the stem; redrawn to match. AB unchanged.
  6. `pythagoras-3d` q2 — stem said "shaded" face but no shading; reworded to name the face `BCGF`.
  7. `interpret-3d-trig-context` q5 — "which **edge** is the sloping **surface**" contradiction; reworded to "which edge … is the sloping edge".
  8. `quadratic-formula` q8 — unreachable distractor `-1±2√5` (why cited dropping `a`, but a=1) → **`x=-1`** (student computes only −b/2a and stops).
  9. `simultaneous-equations-graphically` m1 — ambiguous "can these be solved simultaneously?" → "do these two lines have a common solution (a point of intersection)?".
  10. `linear-real-life` q6 (quiz-only, remediation contract) — candle clone of practice m2 → fresh **battery** scenario `y=80−8x`, x=12 → −16% (model-limitation), different value.
  (`quadratic-word-problems` m1 was flagged as non-factorable but is already `x²+8x−20`→(x+10)(x−2) on disk — luna misread; no change.)
- **Wave regression (unscoped `audit-duplicate-stems.mjs --strict`, whole repo): 22 / 1 / 1 / 86 =
  110** over 7917 items / 456 skills — **at or below the post-R1 baseline 23/1/1/87 = 112 in every
  class.** Round 2 contributed **zero** new duplicate defects (2 fewer, from the `linear-real-life`
  repair). Full-repo validate 0 errors (248 pre-existing backfill warnings). **Manifest 456/319**
  (+42/+42). **Tests 114/114.**

**Consolidated diagram checklist for manual human visual review — 24 of 43 skills carry inline
`[tikz]`, 652 blocks** (the other 19 are symbolic/figure-free). Highest count first:
`space-diagonal-3d` 49, `pythagoras-3d` 46, `simultaneous-equations-graphically` 42,
`interpret-3d-trig-context` 42, `trigonometry-3d` 40, `horizontal-vertical-lines` 38,
`equation-from-graph` 38, `parallel-lines-equal-gradient` 38, `distance-between-points` 34,
`identify-intercepts` 34, `gradient-of-interval` 33, `graph-using-gradient-intercept` 33,
`midpoint-of-interval` 32, `non-right-triangle-problems` 32, `sine-rule` 23, `sine-rule-angles` 19,
`cosine-rule` 18, `cosine-rule-angles` 17, `area-rule-triangle` 17, `label-triangle-sides-angles` 15,
`equation-from-gradient-intercept` 5, `linear-real-life` 4, `slope-intercept-interpret` 2,
`perpendicular-gradient` 1. **Priority eyeballs:** the repaired figures (`cosine-rule` q6,
`trigonometry-3d` q7, `area-rule-triangle` q9/m1); `trigonometry-3d`'s **15 hand-projected 3D
solids** (audit-figure-scale skips these by design — hand-verified only, so they carry the most
figure risk); the tdplot cuboids/cubes in `space-diagonal-3d`/`pythagoras-3d`; and the many
pgfplots coordinate/line graphs in the W2-7 lane. Eyeball via
`http://localhost:5173/#/tikz-check?topic=t-s5p-equ-c` (and `…t-s5c-lin-a`, `…t-s5c-lin-b`, `…t-s5p-trg-c`).

**Review samples (per batch):** W2-6 — `simultaneous-equations-graphically` (only diagram skill),
`split-linear-numerator`, `quadratic-word-problems`. W2-7 — `distance-between-points`,
`perpendicular-gradient`, `linear-real-life` (repair). W2-16 — `trigonometry-3d` (hand-projected
3D), `area-rule-triangle` (repaired), `non-right-triangle-problems` (12-item quiz, coverageNote).

**TWO BLURB-vs-CONTENT SCOPE DECISIONS FOR THE OWNER (deferred, not auto-fixed — the content is
mathematically sound; the question is the skill boundary):**
1. **`split-linear-numerator`** — blurb reads single-denominator `(px+q)/(x+r) → a+b/(x+r)`, but 6
   quiz/mastery items (q7, q8, q10, m1, m2, m4) do **two-factor partial fractions**
   (`12/((x−2)(x+4)) → 2/(x−2) − 2/(x+4)`). The booklet section (p63, "distinct linear factors")
   anchors the two-factor form, so the content is defensible — **but the blurb under-describes it.**
   Choose: widen the blurb to include distinct-linear-factor partial fractions, or narrow the items
   to single-denominator only. (The two horizontal-asymptote items q9/m3 are in-scope applications
   of the single-denominator split and were left.)
2. **`pythagoras-3d`** — blurb says "rectangular prisms", but 6 items (q4, q5, q6, q7, q9, m2) use
   **cones and cylinders** (still 3D right-triangle Pythagoras, and within the broad governing dp
   `dp-s5p-trg-c-1`). Choose: widen the blurb to "3D solids", or move the cone/cylinder items to a
   dedicated skill.

**Other owner items (report-only, nothing edited):**
- **Prereq/data gap:** `identify-slant-perpendicular-height` (a prereq of `interpret-3d-trig-context`)
  has **no content file** — flag for the atomisation/generation queue.
- **`linear-real-life` residual debt** (Wave-1 content, out of the quiz-only remediation scope):
  foundation & development tiers sit at 5 cards each (below the 6-card warn floor, no coverageNote);
  and practice mastery card **m3 is physically implausible** (a tank that "holds 20 L" starting at
  20 L then filling to 30 L). Both need a practice-side edit the human can make.
- **`sine-rule-angles` "obtuse" items kept** (owner ruling 2026-08-11): an item that explicitly states
  the angle is obtuse is unambiguous, so q2/q4/q6/q8/m1/m3 are legitimate despite the sibling
  `sine-rule-obtuse` skill (dp-s6st12) and the "ambiguous case excluded" blurb. Luna's 6 scope flags
  there were ruled invalid.
- **Booklet errata found (none reproduced):** Equations C_1 binomial-numerator example `7x−15=45`
  (should be `7x+15`, answer x=30/7 not 60/7); Equations C_2 answer-key sign/typo slips
  (`y=−y√a`→`x=`, `2p±14`); Equations C_3 Q13 `4p²−0` vs `4p²−9`; Linear A1 midpoint example final line
  `M=(3,2.5)` (should be `(−0.5,−2)`); Linear "point on line" example concludes `(−2,5)` for a
  substituted `(−2,−5)`; Gradient-intercept `Q7d (0.56)`→`(0,56)` and `m=3/2. c=2` stray period;
  Trig "Selecting a Method" table `sinB/B`→`sinB/b`; Cosine-Angles Dev Q8b `7²`→`7`; Trig booklet
  reports angles in DMS (converted to house decimal-degree form). Trig A2 DMS example and B2 Q18
  errata from Round 1 still stand.

**Round-3 notes (2026-08-11, W2-8 + W2-9 + W2-17 + R3, all in-review, uncommitted — human commits).**
Four parallel lanes (three generation batches + the R3 remediation pocket), main session orchestrating,
Opus section-owning generators, luna blind check on all 39 generated ids, one adjudication round.
**39 net-new skills authored + 55 R3 quiz clones re-authored.**

- **Cross-batch gate (all 39 generation ids, comma `--only`, `--strict`): CLEAN** — validate 0
  warnings, equivalent-options 0, duplicate-stems **0/0/0/0** (103 advisory NEAR-DUP), option-hygiene 0,
  figure-scale 0 (470+ figures), angle-arms 0. R3 pocket (27 ids) audit **0/0/0/0**.
- **Wave regression (unscoped `--strict`, whole repo): 15 / 1 / 1 / 38 = 55** over 8975 items / 495
  skills — **down from the post-R2 baseline 110** (R3 cleared its entire in-pocket 55; the three
  generation batches added **zero** new duplicate debt). Full-repo validate 0 errors (248 pre-existing
  backfill warnings, unchanged). **Manifest 495/358** (+39/+39). **Tests 114/114.**
- **Luna (39 generated skills, `figures-first`, full coverage everywhere, 0 retries): 4 answer
  mismatches + flags, adjudicating to 6 genuine repairs.** Highlights:
  - **`circle-equation-general` q11 — genuine KEY ERROR** (W2-9): keyed `k>4` but the point-circle at
    `k=4` (radius 0) is not a circle either → answer is `k≥4`; solution rewritten, boundary stated.
  - **`identify-graph-from-equation` q6/q7 — figure-contradicts-answer** (W2-9): decoy exponential
    panels carried a −0.5 vertical shift (asymptote off the x-axis) and a too-wide parabola; both TikZ
    rebuilt to match their equations. Answers unchanged.
  - **`complementary-trig-relationships` m2 — under-determination** (W2-17): `sin(3θ−10)=cos(θ+20)` had
    two acute roots (θ=20° and 60°); recoefficiented to `sin(2θ+5)=cos(θ+25)`, unique acute θ=20°.
  - **`hyperbola-transformations` q6** wording pin (W2-9); **general-form-answer stems** across
    `general-gradient-intercept-form`/`point-gradient-form`/`parallel-perpendicular-any-form` pinned with
    "and no common factor" (W2-8, wording only, no value changed).
  - Rejected as invalid: several modelled-distractor "mismatches" (luna picked the trap), the
    compressed-cubic vertical-scaling convention on `graph-power-curves`, and boundary/scope flags on
    `exact-trig-ratios` (0°/90° are booklet-anchored) and `coordinate-geometry-problems` (½·leg·leg from
    perpendicular gradients, all prereqs).
- **R3 remediation:** 55 flagged quiz items (7 QUIZ-COPIES-PRACTICE + 48 VALUES) across 19 of the 27
  linear/Pythagoras/data skills, re-authored against the Wave-1 booklets. VALUES triage found the
  expected figure-template false positives (hypotenuse, several linear grid-template items) — re-authored
  anyway to clear the audit. One valid luna fix (`converse-pythagoras` q1 figure). **No `public/content/`
  file modified** (verified: 0 tracked content files changed; 20 quiz files changed). `linear-real-life`
  left as-is (clean from R2).

**Consolidated diagram checklist for manual human visual review — 31 of the 39 generated skills carry
inline `[tikz]`, plus R3's one repaired figure. Highest count first:**
- **W2-9 (all 17, 254 blocks):** `nonlinear-real-life-simultaneous` 39, `intersection-line-curve` 33,
  `graph-quadratic-exponential-tech` 29, `sketch-parabola-from-equation` 27, `hyperbola-transformations`
  18, `graph-power-curves` 16, `graph-quadratic-features` 15, `exponential-transformations` 15,
  `graph-exponential-features` 14, `circle-equation-origin` 9, `identify-parabola-exponential` 9,
  `identify-graph-from-equation` 6, `distinguish-linear-quadratic-exponential` 6, `parabola-transformations`
  6, `circle-equation-general` 4, `parabola-intercepts-axis-vertex` 4, `find-equation-parabola-features` 4.
- **W2-17 (8 of 13, 112 blocks):** `related-angles` 22, `gradient-as-tan-inclination` 18,
  `graph-trig-functions` 17, `exact-trig-ratios` 16, `trig-ratios-quadrant-forms` 16,
  `unit-circle-definitions` 11, `ambiguous-case-sine-rule` 6, `tan-as-sin-over-cos` 5,
  `complementary-trig-relationships` 1. (Figure-free: `rewrite-angle-within-revolution`,
  `trig-obtuse-relationships`, `astc-sign-of-ratio`, `solve-trig-equations`.)
- **W2-8 (6 of 9):** `midpoint-formula`, `gradient-formula`, `distance-formula`,
  `coordinate-geometry-problems`, `symmetry-of-graphs`, `transformations-coordinates`. (Figure-free: the
  three line-form skills.)
- **R3:** `converse-pythagoras` q1 (repaired figure).
- **Priority eyeballs:** the repaired figures (`identify-graph-from-equation` q6/q7, `converse-pythagoras`
  q1); `graph-power-curves` q9/m1 (compressed-cubic convention, true-value labels — luna could not judge);
  `graph-trig-functions` tan-asymptote renders; the two-branch hyperbolas and reflected/negative-window
  exponentials; `symmetry-of-graphs` pinwheel/Greek-cross figures. `audit-figure-scale` is blind to
  unit-less trig side labels (hand-verified ≤0.05%) — those rely on the eyeball.

**Review samples (per batch):** W2-8 — `coordinate-geometry-problems`, `transformations-coordinates`
(11-item quiz), `symmetry-of-graphs`. W2-9 — `circle-equation-general` (k≥4 fix),
`identify-graph-from-equation` (rebuilt panel), `nonlinear-real-life-simultaneous` (densest figures).
W2-17 — `graph-trig-functions` (tan asymptotes), `related-angles`, `complementary-trig-relationships`
(repaired m2), `ambiguous-case-sine-rule`.

**OWNER ITEMS (report-only, nothing edited in skills.json):**
- **Missing prereq content file:** `graph-inverse-variation` (prereq of `hyperbola-transformations`) has
  **no `public/content/` file** — flag for the generation queue. (`distance-formula`, flagged by the W2-9
  lane, now exists — authored in W2-8 this round.)
- **Blurb-vs-content scope (defer, not auto-fixed):** `exact-trig-ratios` blurb says "30°, 45° and 60°"
  but content legitimately includes the booklet's 0°/90° boundary values — widen the blurb.
  `identify-graph-from-equation` blurb omits power/cubic curves though the skill recognises them minimally
  — widen the blurb or confirm cubic stays minimal (and whether `graph-power-curves` should be a prereq
  rather than a sibling).
- **Booklet errata found (none reproduced):** Trig D Graphs Q9 `sinx=cosx` given "45° and 135°" (correct
  45°/225°); Exact-values key `tan90°=0` (undefined) and `tan0°=1` (0); Complementary Q4b uses a
  non-complementary 57°/53° pair; NLR C_5 intersection worked example gives (−2,16) for what is (−6,16);
  NLR C_6 `y=x³` table prints y=−8 at x=2; Linear C 1 midpoint example final line `(3,2.5)` for
  `(−0.5,−2)`; plus several copy-paste header/label slips in the Non-Linear C and Linear C booklets.
  Full lists in the lane reports.

**Round-4 notes (2026-08-12, W2-10 + W2-11 + W2-19 + R4, all in-review, uncommitted — human commits).**
Continued from a prior partial session that had **pre-generated W2-10 (7), W2-11 (10) and 8 of
W2-19's 20 skills** (geo-a 4 + geo-b congruence/similar-tests 4) as untracked files but never
luna-checked them, ran no R4, and left the queue at `pending` and the manifest stale. This session
treated the 25 pre-generated files under the **ALREADY-COMPLETE rule** (they all cleared the full
`--strict` 6-command gate on entry → verified as generated, not regenerated), authored the **12
missing W2-19 skills** (5 section-owning Opus agents: A2, B4, B5, C1, C2), luna-checked all 37, and
closed out.

- **Deterministic gate (all 37 ids, comma `--only`, `--strict`): CLEAN** — validate 0 warnings,
  equivalent-options 0, duplicate-stems **0/0/0/0**, option-hygiene 0, figure-scale 0, angle-arms 0.
- **Wave regression (unscoped `--strict`, whole repo): 0 / 1 / 1 / 0 = 2** over 9961 items / 532
  skills — **down from the post-R3 baseline 15/1/1/38 = 55; every class ≤ baseline, Round 4 added
  ZERO duplicate debt.** The 2 residual are pre-existing practice-side and untouched by Round 4 (see
  R4 row). Full-repo validate 0 errors (248 pre-existing backfill warnings, unchanged). **Manifest
  532/395** (+37/+37 — the 25 pre-generated files had never been folded into the R3 manifest).
  **Tests 114/114.**
- **Luna (37 skills, `figures-first`, full coverage on every skill, 0 retries after a transient
  network drop was retried): ZERO answer mismatches across all 37.** Two mismatches luna *reported*
  were luna falling into a modelled distractor (`add-subtract-multiply-polynomials` q3 sign slip →
  key correct; `angle-properties-plane-shapes` q4 → key 95° correct from 40°+55° alternate angles)
  and were adjudicated invalid.
- **9 repairs applied, all re-checked clean:** `graph-polynomials-factored` q8 (distractor value
  ↔ its `why` mismatch, −13→−1); `congruent-triangle-tests` q7 (stem pin, SAS alt-path);
  `prove-congruent-triangles` m3 (stem relabelled to match figure+solution — A,D,C collinear/B apex);
  `prove-properties-triangles-quadrilaterals` q1+q6 (order-only-twin-of-key and undefined-point-E
  distractors → 4 distinct well-defined pairs); `prove-quadrilateral-tests` q5/q6/q9/m1/m2/m3
  (figures redrawn to-scale so marks match coordinates; converse-pythagoras precedent) + q9 stem pin
  ("most specific type") + 2 latent foundation/development figures (F5,D1); `interior-angle-regular-polygon`
  q2 (figure octagon → regular 16-gon to match the stem).
- **Key adjudication — NSW congruence taxonomy.** `congruent-triangle-tests` q6/q9 luna-flagged as
  "ASA not AAS" were ruled **INVALID**: NSW/`theory.facts` defines **AAS = two angles + one side in
  ANY position; there is no separate ASA test**, so an included-side case is correctly AAS. Recorded
  as a standing NOT-A-DEFECT for future geometry batches.
- **INVALID flags recorded (not repaired):** `find-equation-polynomial-graph` 9 figure-flags =
  schematic vertical-compression convention (curve scaled to the window, **y-intercept labelled its
  true value**, roots at true x, "leading coefficient 1" in the stem → equation fully determined;
  Round-3 `graph-power-curves` precedent); `polynomial-roots-multiplicity` q2 (standard
  cut/bounce/inflect taxonomy, "cuts straight through like a line" pins the simple-root case);
  several required-coverage "duplication" flags (same type, different numbers/answer).
- **DEFERRED to human (scope-borderline, mathematically sound):**
  1. `factor-theorem` q8 (max zeroes of a degree-**5** polynomial) and m4 (prove $x^n-1$ divisible by
     $x-1$ for **every** positive integer $n$) name degrees beyond the card's stated "degree ≤4" — both
     conceptual, no degree-5 polynomial is actually factored. Pin in-scope or narrow.
  2. `exterior-angle-regular-polygon` q5/q7/m1/m2 lean on the interior↔exterior supplementary link,
     which the blurb (`E=360/n` and its rearrangement) does not name. Ruled in-service (elementary
     straight-line angle) but the owner may prefer to name it in the blurb or move interior-given items
     to `interior-angle-regular-polygon`.
  3. `exterior-angle-sum-polygon` q5/q6 are the same structural type (`irregular-sides-from-exterior`)
     at very different regimes (n=8 vs n=29); kept as a small-vs-large case, flagged as borderline.
- **House conventions honoured** in the geometry lane: **inclusive trapezium** (isosceles-trapezium
  counterexample for insufficient conditions) and **true non-convex diagonals** (no "diagonals meet
  outside" test).
- **Booklet errata found (none reproduced):** Geo A_2 similar-figure vs scale-drawing ratio-table
  conventions differ (`original:image` vs `image:original`) — kept the two skills' domains disjoint;
  Geo C_1 similarity Q6 cables answer "40 m" (correct 7.5 m), Q8 "∠BAD common" impossible in the stated
  triangles; Geo C_2 diagonals-bisect proof lists a *property* (AB=CD) as a *given*; Geo B_4 Q18b drives
  an **area** from a **volume** proportion (dimensionally wrong) — replaced with the correct cube-root→square
  route; Geo B_5 exterior-angle table has a malformed pentagon expansion. Full lists in the lane reports.

**Consolidated diagram checklist for manual human visual review — 24 of the 37 skills carry inline
`[tikz]`, 422 blocks** (the other 13 are number/symbolic, figure-free). Highest count first:
- **W2-19 (all 20, 347 blocks):** `prove-properties-triangles-quadrilaterals` 33, `congruent-triangle-tests`
  28, `similar-triangle-tests` 28, `angle-properties-plane-shapes` 27, `prove-similar-triangles` 26,
  `identify-congruent-figures` 25, `prove-congruent-triangles` 25, `similar-figure-practical-problems` 23,
  `prove-quadrilateral-tests` 22, `find-sides-similar` 18, `similar-figures-properties` 17,
  `exterior-angle-sum-polygon` 13, `interior-angle-sum-polygon` 12, `similarity-statements` 10,
  `congruence-statements` 9, `scale-factor` 7, `interior-angle-regular-polygon` 7,
  `area-volume-similar-figures` 6, `exterior-angle-regular-polygon` 6, `scale-drawings` 5.
- **W2-11 (3 of 10, 71 blocks):** `graph-polynomials-factored` 28, `find-equation-polynomial-graph` 23,
  `polynomial-roots-multiplicity` 20. (Figure-free: the 7 algebra/number polynomial skills.)
- **W2-10 (1 of 7, 4 blocks):** `absolute-error` 4. (6 number skills figure-free.)
- **Priority eyeballs:** the repaired figures — `prove-quadrilateral-tests` q5/q6/q9/m1/m2/m3 + F5/D1
  (redrawn to-scale rhombi/squares), `prove-congruent-triangles` m3, `interior-angle-regular-polygon` q2
  (new 16-gon); `find-equation-polynomial-graph`/`graph-polynomials-factored` compressed-cubic graphs
  (true-value labels — luna cannot judge the render); the proof figures across C_1/C_2 (arc-mark and
  right-angle-marker legibility at render size). Eyeball via
  `http://localhost:5173/#/tikz-check?topic=t-s5c-geo-a` (and `…t-s5p-geo-b`, `…t-s5p-geo-c`,
  `…t-s5p-pol`, `…t-s5c-mag`).

**Review samples (per batch):** W2-10 — `scientific-notation`, `percentage-error`, `round-significant-figures`.
W2-11 — `factor-theorem` (degree-scope deferral), `graph-polynomials-factored` (repaired q8),
`find-equation-polynomial-graph` (schematic graphs). W2-19 — `prove-quadrilateral-tests` (repaired figures),
`prove-congruent-triangles` (repaired m3), `angle-properties-plane-shapes` (multi-step figure reasoning).

**Round-5 notes (2026-08-12, W2-12 + W2-13 + W2-18, all in-review, uncommitted — human commits).**
No remediation (R) row — the R1–R4 pockets are exhausted; Rounds 5–7 carry none. All **42 skills
net-new** (verified absent from disk and `git status` before generation — unlike Round 4's
pre-generated untracked batch). Three Opus lane orchestrators (one per batch), each spawning
section-owning generators (opus, foreground, ≤3 concurrent — the run_in_background:false orphan rule
held; no lane stalled).

- **Deterministic gate — each batch clean batch-wide, comma `--only`, `--strict`:** validate 0
  warnings, equivalent-options 0, duplicate-stems **0/0/0/0** per batch, option-hygiene 0, figure-scale
  0 (W2-18 scanned 261 figures, W2-13 178, W2-12 25), angle-arms 0. The literal-poor log family's
  expected `QUIZ-COPIES-PRACTICE-VALUES` storm was pre-empted (W2-12 generators re-based quiz literals;
  0 at batch level).
- **Wave regression (unscoped `--strict`, whole repo): 0 / 1 / 2 = held at 2** — but the raw run first
  showed **3**: a **new CROSS-SKILL-DUP** surfaced that the `--only` batch gate is blind to —
  `solve-exponential-equations` q1 (committed neighbour) == `solve-exponential-log-equations` d3 (new
  W2-12), both "Solve $5^{x}=625$". Repaired **new-batch-side only** (Round-1 backstop rule):
  `solve-exponential-log-equations` d3 re-based to `Solve $7^{x}=343$` ($x=3$), verified non-colliding
  against every `solve-exponential-equations` stem; gate re-run clean, regression back to **2**. The 2
  residual are the documented pre-existing practice-side pair (`order-operations-roots` f8/d1 bracket
  false-positive; `evaluate-index-notation` d2 / `zero-index` f7 `$0^5$`), untouched this round —
  **generation added zero duplicate debt.** Full-repo validate 0 errors (248 pre-existing backfill
  warnings, unchanged). **Manifest 574/437** (+42/+42). **Tests 114/114.**
- **Luna (`figures-first`, full coverage on every skill, 0 answer mismatches across all 42 after
  repairs).** 23 flags total → **15 valid (repaired), 8 invalid.**
- **15 repairs, all re-checked clean.** W2-18 (13): **2 genuine key arithmetic errors**
  (`surface-area-partial-cylinder` q3 284.16→284.20, q5 253.50→253.52); **1 impossible solid rebuilt**
  (`surface-area-pyramid` q2 — base 10×6 + slants 8/9 gave contradictory heights → base 18×10, slants
  13/15, h=12, key 564, distractors + figure redrawn to scale); unreachable-distractor rederivations
  (`surface-area-pyramid` q9 680→620, `surface-area-cone` q7 770π→399π, `volume-prism-curved-cross-section`
  q6); not-to-scale figure (`surface-area-cone` q2 apex lowered to true height); mis-rounded distractor
  values (`volume-composite-solids` q1 294.9→294.8, q2 636.2→637.5); under-determined stems
  (`volume-sphere` m2, `volume-prism-curved-cross-section` m1/q8); de-dup (`nets-of-prisms` q7
  hex→pentagonal prism). W2-13 (1): `domain-and-range` q5 figure arrow `<->`→`->` (restricted domain
  x≥1 must not imply continuation). W2-12 (1): `laws-of-logarithms` q8 stem form-pin ("expand **fully**
  … bringing any index down").
- **INVALID flags recorded (not repaired):** W2-13 — `solve-function-equation` q7/q8/m1/m2/m4 scope
  cluster is **booklet-anchored mastery** (Book 1 Q17/19–22; find-unknown-coefficient items are the same
  skill, checker reads the blurb narrowly) — see owner-deferred; `graph-region-multiple-inequalities` m2
  = luna arithmetic error ((W,F)=(2,4) satisfies 4W+3F=20). W2-18 — `surface-area-cylinder` q2/q6 and
  `composite-area-problems` q8 (all reachable via the modelled misconception / correct rounding);
  `surface-area-partial-cylinder` q6 luna clerical index slip. W2-12 — `laws-of-logarithms` q8 round-2
  domain-restriction request (over-reaches Stage-5 register; booklet assumes positive pronumerals,
  never annotates domains).
- **Standing NOT-A-DEFECT reused:** schematic compressed-graph convention (curve scaled to window,
  intercepts/points labelled TRUE values, roots at true x) accepted for log/function graphs — luna
  cannot judge the render, human eyeball only. Figure markers must never contradict drawn coordinates
  (redraw to-scale — applied to the W2-18 cone/pyramid figures above).
- **Booklet errata found & corrected in content (none propagated):** W2-13 — Book 1 Function Notation
  worked example $f(x+1)=(x+1)^2+5(x+1)$ printed "$x^2+6x+6$" (correct $x^2+7x+6$); Book 2 Natural Domain
  example for $1/(x-2)$ stated "except $x=0$" (correct $x\ne 2$). Both authored correctly.
- **DEFERRED to human:**
  1. W2-13 `solve-function-equation` q7/q8/m1/m2/m4 — ruled in-scope booklet mastery, but the items
     return an unknown **coefficient** (find $a$/$p$, simultaneous $b,c$) rather than an input $x$; owner
     to confirm or split off a "find unknown coefficient" skill.
  2. W2-18 `composite-area-problems` — **anchor:none candidate.** The A1 booklet is a nets/surface-area
     booklet with no worked plane-composite-area examples; the section agent authored from the dot point
     + `area-composite-circles` conventions. Reached target on genuine variety but under-anchored —
     owner to confirm recording `anchor: none`.
  3. W2-12 `laws-of-logarithms` q8 domain-restriction flag (rejected invalid, noted).

**Consolidated diagram checklist for manual human visual review — 32 of the 42 skills carry inline
`[tikz]`, 464 blocks** (the other 10 are symbolic, figure-free). Highest count first:
- **W2-18 (all 19, 261 blocks):** every solid/net skill; quiz-side figures on
  `identify-slant-perpendicular-height` (8), `surface-area-pyramid` (7), `surface-area-cone` (7). All
  curved solids use the silhouette rule; prisms use tikz-3dplot true coords.
- **W2-13 (9 of 14, 178 blocks):** `domain-and-range` 39, `graph-linear-inequalities-region` 30,
  `graph-region-multiple-inequalities` 25, `vertical-line-test` 25, `inequality-from-region` 22,
  `relations-and-functions` 11, `graph-function-transformations` 10, `dilate-function-graphs` 8,
  `reflect-function-graphs` 8. (Figure-free: function-notation, interval-notation,
  evaluate-function-algebraic-argument, solve-function-equation, natural-domain-from-equation.)
- **W2-12 (2 of 9, 25 blocks):** `graph-log-functions` 23, `logarithmic-scales` 2. (7 symbolic skills
  figure-free.)
- **Priority eyeballs:** the repaired figures — `surface-area-pyramid` q2 (rebuilt 18×10 base),
  `surface-area-cone` q2 (to-scale apex), `domain-and-range` q5 (single-arrow restricted domain);
  `surface-area-composite-pyramid-cone-sphere` (hidden-contact-circle subtraction, hardest atom);
  the region-shading half-planes (`graph-region-multiple-inequalities` tall/narrow windows,
  intercept-label collisions); `graph-log-functions` compressed-curve labels (true-value, luna-blind).
  Eyeball via `http://localhost:5173/#/tikz-check?topic=t-s5p-log` (and `…t-s5p-fnc`, `…t-s5c-are-a`,
  `…t-s5p-are-b`, `…t-s5c-vol-a`, `…t-s5p-vol-b`).


files, **no `anchor: none`** — all three booklets cover their skills densely. Generated with
Opus, **6 section-owning generators**: A `Indices A 1` §Multiplication/§Division/§Power of a
Power/§Zero = `index-laws-variables` + `zero-index-algebraic`; B `Indices A 1`
§Coefficients/§More than One Variable/§Mixed Basic = `simplify-index-products-quotients`;
C `Indices A 1` §Power of a Product/§Power of a Quotient/§Mixed =
`power-of-product-quotient`; D `Indices A 2` (whole booklet) = `negative-integer-indices`;
E `Indices B_1` §Negative Index with Variables/§Negative Indices in the Denominator =
`establish-negative-indices` + `convert-negative-positive-indices`; F `Indices B_1`
§Negative Index as the Reciprocal/§Mixed Practice = `index-laws-negative-indices` +
`reciprocal-index-expressions`. atomTypes: `zero-index-algebraic` and
`convert-negative-positive-indices` = T; the other seven = R. No `masteryOmitted`, no
`coverageNote` — every skill reached target honestly. Final counts: foundation 10–12 /
development 8–12 / mastery 4 / quiz 9–12.

**Figure-free batch — zero `[tikz]` blocks across all 18 files, so step 7's visual-review
checklist does not apply.** All six generators were told in their spawn prompts that the
section is figure-free and that a manufactured decorative figure is a defect; none opened
`docs/tikz-prompt.md` or the booklet media PNGs (the batch-9 ~150k duplicated-read cost
avoided again, this time across six agents). Descending-powers pattern tables in
`negative-integer-indices` and `establish-negative-indices` are KaTeX `array`s inside `$…$`
per the Table rule, never pictures.

**Deterministic gate clean batch-wide on the first orchestrator run** — 318 items / 91 quiz
questions / 363 options; validate 0 warnings, equivalent-options 0 defects (21%
canonicalised, 0 intended key-equal), duplicate-stems 0 across all four classes including 0
near-dup advisories, option-hygiene 0 leaked keys / 0 vague `why`s. **The
`QUIZ-COPIES-PRACTICE-VALUES` class did all the work at the agent level:** four of six
generators hit it on their own first gate run and self-repaired before reporting (C: 9
flags, E: 4, F: 8, plus A's INTRA-FILE-DUP where `7a^{0}` and `(7a)^{0}` normalise
identically). Index-law stems are **literal-poor** — the value signature is the numeric
multiset, so $(m^2n^3)^4$ collides with $(3a^2)^4$ regardless of pronumeral or answer. That
is a true positive by construction but it fires often on this family; agents re-based the
colliding quiz items onto unused literal sets with recomputed keys and re-derived
distractors. Two latent equivalent-options defects were also caught by agents pre-report
(a $t^0$ distractor equal to the key $1$; $\frac{4x^2}{14y^2}$ reducing to another option).

**Blind check — luna, one packet per skill, `--resolve-mode figures-first`. All 9 OK, zero
retries. 127/127 items re-solved, ZERO answer mismatches, `itemsAnswered == itemsReceived`
on every skill.** 4 flags, **all 4 adjudicated VALID** (no invalid flags this batch — first
time), repaired in one round; a fresh luna round 2 over only the 4 changed items returned
**0 mismatches, 0 flags**:
1. `index-laws-variables` q5 — "cannot be written as a single power" was ambiguous:
   $a^{4}\times b^{6}=(a^{2}b^{3})^{2}$ is a single power with a composite base. Stem pinned
   to "a single power **of one pronumeral**". Options untouched.
2. `simplify-index-products-quotients` m4 — "true for every value of $m$" includes $m=0$,
   where $\frac{km^{a}}{4m^{3}}$ is undefined. Now "every **non-zero** value of $m$".
3. `establish-negative-indices` q10 ≡ m1 — a **reworded clone**: both derived
   $\frac{a^{m}}{a^{m+n}}$ two ways to the same general conclusion, which the byte-level and
   value-signature gates both miss (general indices carry no numeric literals). This is the
   class the checker exists for. q10 replaced with the concrete-index derivation
   $\frac{x^{4}}{x^{9}}\Rightarrow x^{-5}=\frac{1}{x^{5}}$; structure slug
   `derive-from-division-law` and the `mastery: true` flag preserved, and each distractor
   re-derived on the new numbers (misconception → derivation → value: cancel with the
   numerator index $4$ → $\frac{1}{x^{4}}$; read the negative index as a sign → $-x^{5}$;
   subtract $9-4$ instead of $4-9$ → $x^{5}=\frac{1}{x^{5}}$).
4. `establish-negative-indices` m3 — the stem claimed $\frac{1}{a^{-n}}=a^{n}$ is
   "$a^{-n}=\frac{1}{a^{n}}$ used **twice**", but the working uses it once plus
   reciprocal-of-a-reciprocal, as its own last line admitted. Stem now says the rule
   "follows from" it, "so no new rule is needed"; solution line reworded to match. No answer
   changed.

**Scope lines held (three at once).** (1) `dp-s5c-inda-3` says *numerical* — every
pronumeral item in `Indices A 2_Negative Index.md` was converted to a numerical instance and
the algebraic side left entirely to the four Path skills. **One judgement call for the human:**
`negative-integer-indices` m3 uses the *numerical* fraction base $\left(\frac{3}{4}\right)^{-2}$
(booklet Q9p/Q16 sit it squarely in that chapter); the algebraic $\left(\frac{a}{b}\right)^{-n}$
form stays exclusively in `reciprocal-index-expressions`, and the item appears in practice
only, never in a quiz. (2) The Indices-A skills are dealt disjointly by *shape*: bare-law
terms (A) / coefficient-and-multi-pronumeral products and quotients (B) / anything with a
bracket raised to a power (C) — 0 cross-skill duplicates over 318 items. (3) Fractional
indices, surds, scientific notation and index *equations* excluded throughout (batch W2-4
owns Indices C). Per-question exclusions applied inside otherwise in-stage exercises, per
the Wave-2 interleaving rule: `Indices A 1`'s Power-of-a-Power development set hides
$(2^{5})^{-1}$, $(3^{1/2})^{2}$, $(p^{1/9})^{2/5}$; `Indices B_1` Q5 (L628) is HSC-Advanced-tagged
and was excluded, while its three NAPLAN-tagged items were used as difficulty references
with fresh numbers. Denominator-heavy quotients in the Indices-A skills are answered in the
booklet's $\frac{1}{\text{base}^{n}}$ form, never as $x^{-n}$ — that keeps
`establish-negative-indices` intact as the atom that *introduces* the negative index.

**Wave regression check (unscoped `audit-duplicate-stems.mjs --strict`), run after this
batch:** `QUIZ-COPIES-PRACTICE: 60, INTRA-FILE-DUP: 4, CROSS-SKILL-DUP: 1,
QUIZ-COPIES-PRACTICE-VALUES: 102` (167 total, 222 advisory) over 5741 items / 378 skills.
**Every class is at or below the 2026-08-04 baseline** (160 / 4 / 2 / 132 = 298) — the drop
is R1's repairs; W2-3 contributed **zero** new defects. Full-repo `validate.mjs` clean at 0
errors (the 248 warnings are the pre-existing Part-A backfill targets, unchanged); manifest
rebuilt (**378 content / 241 quiz**, +9/+9).

**Booklet errata found (none reproduced).**
- `Indices A 1_Index Laws.md` L424 — the division-law exemplar prints
  $\frac{x^{2}}{x^{7}}=\frac{1}{x^{7}}$; correct is $\frac{1}{x^{5}}$ (its sibling
  $\frac{x^{20}}{x^{70}}=\frac{1}{x^{50}}$ is right).
- Same file L1042 — the zero-index exemplar prints $3+a^{0}=3+1=3$; the stated total should
  be $4$.
- Same file, Mixed Practice Q2g/Q2l — `$3m^{3n}$` and `$8x^{3y}$` are Pandoc superscript
  slips for $3m^{3}n$ and $8x^{3}y$; Q3 also restarts its part labels at `a.`, and Q10
  mislabels parts (a, b, e, c) and prints $27\times10^{11}$ un-normalised.
- `Indices A 2_Negative Index.md` §Negative Indices with Coefficients Q3g — $8\times7^{-3}$
  keyed $\frac{8}{243}$; correct is $\frac{8}{343}$ ($243=3^{5}$). Same chapter's
  "**Rewrite** using a negative index" panel instructs "Write using a positive index".
  Chapter 1 Q7/Q9 are internally inconsistent on required form (sometimes $\frac{1}{12}$,
  sometimes $\frac{1}{9^{2}}$) — content pins the form in every stem instead.
- `Indices B_1…md` L243–245 item r — $-(-7x^{2}y^{n})^{-4}$ keyed
  $\frac{-1}{2401x^{4}y^{4n}}$; the $x$ index should be $8$ (item q on the same row has
  $x^{8}$). Found independently by two agents. Also L259 item k carries a stray trailing
  `\$` (Pandoc artefact), and Chapter 2 Q2 reuses the label `a.` for its 27th part.

**Note for the human at review.** `establish-negative-indices`'s descending-powers *pattern*
cards were generated from the dot point's "patterns" bullet rather than the booklet, whose
own derivation is thin (it argues from the division law and fraction division). Not
`anchor: none` — the chapter's reasoning prompts and its four student-work critique tasks
(Kelly / Danice / Maya / Andy) anchor the rest of the skill — but the pattern-table cards are
the least booklet-tied content in the batch, which is why the skill is a review sample.
**Not committed** — awaiting the human.

---

## Remediation queue (R-rows)

`node scripts/audit-duplicate-stems.mjs --strict` **unscoped** over the whole repo, run
2026-08-04, reports **298 non-advisory defects across ~95 skills** (5036 items, 356
skills, 219 quiz files):

| Class | Count |
|---|---|
| `QUIZ-COPIES-PRACTICE` (byte-identical after `normaliseStem`) | 160 |
| `QUIZ-COPIES-PRACTICE-VALUES` (same value signature, reworded) | 132 |
| `INTRA-FILE-DUP` | 4 |
| `CROSS-SKILL-DUP` | 2 |
| NEAR-DUP (advisory — **ignored by design**, legitimate same-type-different-numbers) | 222 |

**This is a fixed pocket, not a leak.** Everything from batch 10 onward is near-zero — the
debt stops dead where the duplicate gate starts. It is not visible to the per-batch gate
because that gate is `--only`-scoped; hence the unscoped wave regression check in
[content-generation.md](content-generation.md) step 3.

| # | Pocket | Batches | Skills | Defects | Status | Notes |
|---|---|---|---|---|---|---|
| R1 | Fractions, decimals & percentages | 6 (`t-s4-frc`) | 31 of 34 | 121 → **0** | in-review | done 2026-08-04 — see notes below |
| R2 | Algebraic techniques | 1 | 16 | 55 → **0** | in-review | done 2026-08-05 (Round 1). Actual pocket 55 non-advisory (not 62): Q-C-P 37, VALUES 15, INTRA 3. 50 quiz items replaced across 13 skills; `expand-brackets` verified clean (repaired in W2-2), 2 more clean untouched. VALUES triage: 6 reworded clones, 7 thin permutations (treated real), 2 false positives (re-authored anyway). Luna targeted 50/50 agree, 1 flag invalid (R1 lesson verbatim). Practice cards/structure/mastery/ids byte-identical. 9 report-only practice-card observations in Round-1 notes |
| R3 | Linear, Pythagoras, data | 3, 5, 4 | 19 of 27 | 55 → **0** | in-review | done 2026-08-11 (Round 3). Actual pocket 55 (Q-C-P 7, VALUES 48), not 57 — `linear-real-life` already clean from R2. 55 quiz items re-authored across 19 skills; 3 parallel section agents (Linear/Pythagoras/Data). Luna targeted, 1 valid fix (`converse-pythagoras` q1 figure drew a literal right angle for a not-right answer → redrawn to-scale), 6 flags/1 mismatch adjudicated invalid. 2 pre-existing gate fixes in passing (`represent-data-graphs` q1 LEAKED-KEY). Structures/mastery/ids preserved; **no content file touched**; only `public/quizzes/` changed |
| R4 | Integers, ratios, probability + tail | 7, 8, 16, 9–15 | ~25 | 59 → **0 quiz** | in-review | done (Round 4). Quiz pocket **already cleared in this untracked tree** by the earlier partial session — repo-wide `QUIZ-COPIES-PRACTICE 0`, `VALUES 0` on entry. Only **2 defects remain repo-wide, both pre-existing practice-side and untouched by Round 4** (confirmed via `git status`): (a) `order-operations-roots` f8/d1 `INTRA` = **false positive** (`$12+4\times\sqrt9$`=24 vs `$(12+4)\times\sqrt9$`=48; normaliser strips brackets — distinct answers); (b) `evaluate-index-notation` d2 == `zero-index` f7 `CROSS` (`$0^5$`) = the documented pre-existing pair (Round-1 notes, deliberately left). Both are practice cards, **outside the quiz-only remediation contract**, and sit AT the post-R3 baseline (INTRA 1, CROSS 1) — no Round-4 regression. Left for the human (a practice-side content edit) |

**Interleaving:** R1 → W2-2 (+ inline `expand-brackets` repair) → R2 → W2-3 → R3 → W2-4… →
R4. One remediation session per ~3 generation batches. Four sessions clear ~95%.

**Status vocabulary** is the same as the generation queue (see top of this file):
`pending` → `generated` → `checked` → `validated` → `in-review` → `committed`. The human
commits.

### Remediation contract (how an R-session runs)

This is **authoring against the booklet**, not find-and-replace. It reuses the normal
batch pipeline in [content-generation.md](content-generation.md) § Workflow.

1. **Scope + triage** (orchestrator, before spawning anything).
   `node scripts/audit-duplicate-stems.mjs --only <batch skill ids>`.
   - `QUIZ-COPIES-PRACTICE` — **no adjudication needed**, byte-identical after
     normalisation, all genuine.
   - `QUIZ-COPIES-PRACTICE-VALUES` — **triage, never repair blind.** The batch-16 dry run
     ran roughly 1-in-5 false positive. The signature is `sortedNumbers|canonicalAnswer`
     (`scripts/audit-duplicate-stems.mjs:135-142`) over bare `\d+(?:\.\d+)?` matches, so
     it degrades when (a) the numbers came from a shared `[tikz]` template's coordinates
     rather than the maths, or (b) the answer is non-numeric and `canonicalise` collapses
     distinct items. Pre-filter deterministically, then read the surviving stem pairs.
   - NEAR-DUP advisory — ignore.
2. **Repair — parallel agents, one per booklet section**, partitioned so shared exemplars
   are dealt disjointly (same treatment as a generation batch). Each agent:
   - **Replaces quiz items only — never practice cards.** The practice card is what the
     student studied; the quiz is what is meant to be new. Fix the assessment side. Edits
     are confined to `public/quizzes/<skill>.json`.
   - **Re-authors against the booklet section**, not by perturbing numbers off the
     practice card — a renumbered clone still leaks the method.
   - **Preserves full structural-type coverage**: every `structure` value the file had,
     and the `mastery: true` count `validate.mjs` cross-checks against the content's
     mastery tier.
   - **Keeps item `id`s stable** so `blind-for-check.mjs --items` can target them.
   - **Clears the full six-command gate on its own skill ids before reporting.**
3. **Gate** — six commands over the whole batch id list, plus the unscoped regression run.
4. **Targeted blind check — never a full re-send.**
   `node scripts/blind-for-check.mjs <skillId> --items <changed item ids>` (the `--items`
   flag is on `blind-for-check.mjs`, not on `run-luna-check.mjs`), then
   `run-luna-check.mjs --skills` / `--compare`. Unchanged items still surface as
   `siblingContext`. Max 2 repair rounds per skill; full gate re-run after every edit.
5. **Close out** — `npm run manifest`, human-review samples, update the R-row status
   here. Do not commit.

### R1 (Fractions, decimals & percentages) notes — 2026-08-04

**Scope:** 121 defects across **31 of the batch's 34 skills** (94 `QUIZ-COPIES-PRACTICE`,
26 `QUIZ-COPIES-PRACTICE-VALUES`, 1 `CROSS-SKILL-DUP` — `irrational-numbers` q2 ==
`rational-numbers` q4, repaired on the `irrational-numbers` side only). Clean:
`approximation-notation`, `rational-numbers`, `locate-irrationals-number-line`.

**Triage:** all 26 VALUES hits adjudicated **genuine — zero false positives.** The
signature's known degradation mode is `[tikz]` template coordinates polluting the number
extraction, and FDP items carry almost no figures, so it did not apply here. Batches with
figure-heavy skills should still expect the ~1-in-5 FP rate seen in the batch-16 dry run.

**Repair:** 7 opus section agents in parallel on the **same A–G booklet partition batch 6
originally used**, so shared exemplars stayed dealt disjointly:
A Comparing Fractions 19 · B Decimals 11 · C Converting FDP 19 · D Operations/fractions 15
· E Operations/decimals 13 · F Percentage Inc/Dec/Change 21 · G Percentages Problems 23.
Nine files were fully flagged and so became whole-file rebuilds — **structure lists
verified identical before and after** on every one. F and G each assigned their five
skills an exclusive context domain (sport / cooking / utilities / transport / wildlife;
sport / lab / travel / agriculture / trades) to stop five percentage skills on one booklet
converging.

**Two pre-existing defects surfaced by the gate and fixed in passing** (both DISTRACTOR-
PAIR, options equal in value): `find-reciprocal` q1 (`$0.8$` == `$\frac{4}{5}$`) and
`simplify-fractions` q3 (`$\frac{6}{8}$` == `$\frac{9}{12}$`). Stems, ids, structures and
keys untouched.

**Gate:** all six commands exit 0 batch-wide. **Regression check (unscoped):
298 → 177 defects**, i.e. −121 exactly, with no new defect anywhere else in the repo —
`QUIZ-COPIES-PRACTICE 160→66`, `VALUES 132→106`, `CROSS-SKILL-DUP 2→1`,
`INTRA-FILE-DUP 4→4` (all 4 sit outside batch 6). NEAR-DUP advisory unchanged at 222.

**Blind check:** targeted — `blind-for-check.mjs --items` on only the 121 changed items
(+ the 2 option-only fixes), 31 skills, `figures-first`. **0 answer mismatches, coverage
full on every skill (itemsAnswered == itemsReceived), 0 retries.** 8 flags, **all 8
adjudicated invalid**, so the majority-invalid stopping rule applied and no second round
ran:
- 6 × `unreachable-distractor` — every one has an exact misconception → derivation → value
  chain the checker cannot see (it never receives `why`): additive-equivalence 5+12=17 /
  9+8=17 / 8+3=11 (`equivalent-fractions` q1/q2/q6); partial carry leaving the tenths at 9
  (`round-decimals-carry` q3); 1.40 × 0.95 = 1.33 (`repeated-percentage-change` q3);
  550 ÷ (2500+1950) = 12.36% (`financial-percentage-problems` q4).
- 2 × `duplication` (`unitary-method-percentages` q2/q5) — same `structure`, different
  numbers and answers; NOT-A-DEFECT rule 1, and that structure list is the file's original
  design, preserved deliberately.

**Manifest rebuilt** (356 content / 219 quiz). **No `public/content/` file was modified** —
verified with `git status`: 31 quiz files changed, 0 content files. **Not committed.**

**Human-review samples:** `convert-fractions-decimals-percentages`,
`repeated-percentage-change`, `decimal-divisor-to-whole` (a whole-file rebuild from each of
three different sections), plus `find-reciprocal` and `simplify-fractions` for the two
pre-existing option fixes. No TikZ in the repaired set, so no diagram list is required.

**Batch W2-2 (Algebraic techniques A+B+C) notes.** 14 unique skills = **13 fresh generates
+ 1 inline repair**. Generated with Opus, **7 section-owning agents** on the batch's 8
booklet sections (the two numerical-denominator skills, which sit in different booklets but
are one routine family, were given a single owner so they could not converge):
R `expand-brackets` (repair, AT-A2);
A `simplify-algebraic-fractions-numerical` + `add-subtract-binomial-fractions` (AT-A1 +
AT-C1); B `simplify-algebraic-fractions-indices` +
`operate-algebraic-fractions-denominator` (AT-B1); C `factorise-common-algebraic-factor`
(AT-B2); D `expand-binomial-products` + `factorise-monic-quadratic` +
`expansion-factorisation-problems` (AT-B3); E `special-products` +
`expand-simplify-special-products` + `factorise-special-products` (AT-C2);
F `simplify-fractions-by-factorising` + `simplify-compound-fractions` (AT-C3).
**atomType `R` for all 13.** Tier counts 7–9 foundation / 7–10 development / 3–4 mastery;
quizzes 8–11 (several run past 10 on the type-coverage-wins rule). No `masteryOmitted`, no
`coverageNote`. **Zero TikZ in the whole batch** — algebra is symbolic, and the booklets'
images are decorative or review-of-prior-knowledge, so no diagram list is required.

**`expand-brackets` was a DIRTY SKIP — the first live test of the tightened
ALREADY-COMPLETE rule.** Under the old presence-only test the queue had recorded the skip
as valid on 2026-08-04 ("both files present"). Under the tightened rule the gate is run
too, and it failed: **10 duplicate-stem defects — all six quiz items cloned a practice
card** (q1==f1, q2==f2, q3==d1, q4==d3, q5==m1, q6==m2, plus 4 value-signature hits). The
whole quiz was rebuilt under the remediation contract (quiz side only, ids and `structure`
stable, Stage-4 single-bracket difficulty held — no drift into binomial products, which is
a separate skill in this same batch). Had the rule not been tightened first, this would
have shipped untouched.

**Scope exclusions (per question, not per chapter).** Two HSC-tagged Band 3/4 items in
AT-B1 (reciprocal of `1/a + 1/b - c/ab`; the two-workers rate problem) used as difficulty
reference only, not reproduced. Surd factorisations and surd expansions, algebraic-fraction
expansions, and sum/difference-of-cubes excluded from AT-C2. The Challenge Exercise and
identity-proof sets excluded from AT-C3. Non-monic factorising kept out of
`factorise-monic-quadratic` except where the booklet's own mastery reaches it after a
common factor leaves a monic trinomial. `factorise-special-products` and
`simplify-fractions-by-factorising` were authored to their Stage-5 dot point; the Stage-6
Advanced `dp-s6adv11-functions-1` on their records was ignored per Read-first item 9.

**Gate clean batch-wide on the orchestrator's first run.** The only validate warnings are
two pre-existing below-floor tier counts on the `expand-brackets` **content** file (5
foundation / 5 development), left alone under the no-content-edits rule. Agents caught and
self-repaired 9 `QUIZ-COPIES-PRACTICE-VALUES` collisions between their own draft quiz items
and their own practice cards before reporting — the gate working as designed at the agent
level. **Regression check (unscoped): 177 → 167**, i.e. −10 exactly (the `expand-brackets`
repair); **the 13 new skills introduced zero new duplicate defects.**

**Blind check:** 14 skills, `figures-first`, 0 retries, coverage full on every skill.
**1 answer mismatch + 7 flags; 2 defects accepted, 6 flags rejected.**
- **Accepted — `special-products` q1 (ambiguity, surfaced as the mismatch).** "Identify $a$
  and $b$ for $(6x-5y)^2$" did not state the form: reading it as $(a-b)^2$ gives $b=5y$,
  as $(a+b)^2$ gives $b=-5y$. Stem now pins the form and the term order. Key unchanged.
- **Accepted — `add-subtract-binomial-fractions` q2 (unreachable distractor).** Its `why`
  claimed "subtracted 3 from each term", but that yields $6x-9$, not the $6x-3$ shown — the
  derivation did not land on its own value. Option corrected to $\frac{6x-9}{5}$ with the
  arithmetic spelled out.
- **Rejected — `expand-binomial-products` q6/q7/m2 (scope ×3).** Binomial×trinomial and
  triple products are **booklet-anchored**: AT-B3 lines 333–341 carry
  $(2x+1)(2x^2-x+4)$, $(x^2-x+1)(x+3)$ and $(x+1)(x+2)(x+3)$ verbatim. NOT-A-DEFECT rule 3.
- **Rejected — 3 × unreachable-distractor** (`simplify-algebraic-fractions-indices` q7;
  `add-subtract-binomial-fractions` q5, q10). Each has an exact derivation the checker
  cannot see, because checkers never receive `why`: $8y+4y=12y \Rightarrow
  \frac{20x^2y}{12y}=\frac{5x^2}{3}$; $(x+4)\cdot3+(x-2)\cdot4 = 7x+4$; mis-scaling
  $\frac{x}{6}$ by 6 instead of 2 $\Rightarrow 7x+5$.

6 of 7 flags invalid → the majority-invalid stopping rule applied; the two accepted fixes
were made, the full gate re-run, and only the two changed items were re-sent
(`blind-for-check --items`). Re-check: **0 mismatches**, and a residual commutativity
quibble on q1 (that $a=-5y, b=6x$ also squares correctly) closed by pinning term order —
no option offered that reading, so it could never have misgraded.

**Manifest rebuilt** (369 content / 232 quiz). **Not committed.**

**Human-review samples:** `expansion-factorisation-problems` (the applied/multi-step atom,
the one most at risk of collapsing into its two section-mates),
`simplify-compound-fractions` (hardest routine in the batch), `expand-brackets` (the
repaired dirty skip), plus `factorise-common-algebraic-factor` — its agent reported **five
answer-key errors in the booklet itself** (Q2b `−7a−14b → −7(a+2y)`, Q2j `−6x+8 →
−2(3y−4)`, Q2l `−60x+45 → −15(4x+3)`, Q5n `8x(6−x²+2y)`, Q7i paired with an unrelated
`5xy(...)`) and authored the correct maths instead; worth a human eye on that call.
`anchor: none` gaps: none — all 14 skills are booklet-covered.

**Batch W2-1 (Financial mathematics A+B) notes.** First Wave-2 batch and the Stage-5
shakedown. **12 skills, all fresh generates — 0 ALREADY-COMPLETE skips and 0 STAGE-3-rule
copies** (verified: no `public/content/{id}.json` and no quiz file existed for any of the
12 before this batch). Generated with Opus, **6 section-owning generators**:
A `earning-money` (FMA1 earning chapters L88–2461);
B `progressive-income-tax` + `taxable-income-tax` + `medicare-levy` + `tax-refund-or-owing`
(FMA1 tax chapters L2462–end);
C `simple-interest` (FMA2);
D `buying-on-terms` (FMA3);
E `compound-interest-repeated` + `compound-interest-formula` + `compounding-frequency`
(FMB L52–1125);
F `depreciation` + `compare-simple-compound` (FMB L1126–end, reading FMA2 for the SI side).
**atomType `R` for all 12** — every atom is a genuine multi-stage routine. **No
`masteryOmitted`, no `coverageNote`** — every skill reached target honestly. Final counts:
foundation 7–12 / development 7–12 / mastery 3–4 / quiz 8–10.

**Deterministic gate clean batch-wide on the FIRST run** — 366 items, 110 quiz questions,
439 options: validate 0 warnings, equivalent-options 0 defects (83% of options
canonicalised, 0 intended key-equal), duplicate-stems **0 in all four classes including the
new `QUIZ-COPIES-PRACTICE-VALUES`**, option-hygiene 0 leaked keys / 0 vague `why`s,
figure-scale and angle-arms 0 over 23 figures. All six generators cleared the gate on their
own skills before reporting, so the orchestrator's batch-wide re-run found nothing new.

**Blind check — luna, one packet per skill, `figures-first`. All 12 OK, zero retries.
151/151 items re-solved, ZERO answer mismatches, ZERO flags, `itemsAnswered ==
itemsReceived` on every skill. No repair rounds.** Per the runbook's "do not fish for
flags", the batch was accepted as a clean result.

**New tooling finding — the shuffle-sanity WARN is unusable on money content.** 29 WARNs
fired across 5 skills. They are **benign**: `compareOneSkill` decides agreement on
`chosenIndex === shuffledIndexOfCorrect` (an index comparison, fully authoritative) and the
WARN can only fire in the `else if` branch *after* the index already matched. The cause is
transcription — luna re-types the option in plain text, stripping `$…$` and rendering `\,`
as a comma (`"$1,381.80"` vs the key's `"$\$1\,381.80$"`). Two WARNs run the other way
(`medicare-levy` q7, `buying-on-terms` q3) where luna *added* a spurious `\$` before a
percentage; both quiz sources were inspected directly and are correct (`$7.4\%$`,
`$10\%$`). **Every money-heavy Wave-2 batch will produce this noise**; the fix is to
normalise LaTeX out of both strings before the sanity comparison, or drop the check.

**House convention added:** "Written form of a money answer" in `docs/content-generation.md`
§House mathematical conventions, written **before** generation so all six agents read one
authority. Three agents independently converged on the same three refinements, now folded
in: the rule governs computed answers and option texts (not stem-given round prices,
which stay `\$4000`); "to the nearest dollar" pins whole dollars; thousands take a thin
space, never a comma.

**Runbook corrections applied from the shakedown (3, all factual):**
1. **Read-first item 8 media path was wrong for all of Wave 2** — five of six agents
   reported it independently. Wave 2 nests one level deeper
   (`<booklet-dir>/media/<booklet-stem>/media/imageN.png`). Rewritten to say "resolve the
   booklet's own image link relative to the booklet's directory", with both layouts stated
   and an explicit figure-free skip (item 8 had no carve-out where item 1 does).
2. **Step 3 contradicted itself** — "Four commands" / "all four commands" in prose against
   six listed and named. Both now read six.
3. Money convention refinements above.

**Runbook issues REPORTED, deliberately NOT changed — these are owner policy calls:**
- **"≥1 MCQ per structural type" fights the 8–10 quiz ceiling on type-rich Stage-5 skills.**
  Raised independently by agents A and B. `earning-money` honestly enumerates **9**
  structural types and `progressive-income-tax` 9–11, so the quiz is all coverage and has
  zero room for the case variety the same section requires. Agent A covered all 9 types +
  1 mastery item; agent B **folded three types into cases to fit under 10**. The runbook is
  silent on which wins, and the pressure is toward *under-reporting* types. The ceiling was
  tuned on Stage-4 geometry, which is far less type-rich than financial maths. **Needs a
  ruling before W2-2** — several Wave-2 batches will hit this.
- **No "Table rule" to match the "TikZ rule".** Four of the twelve skills are figure-free
  but *table*-bearing (tax tables, growth tables), and the only guidance is one line in
  `content-schema.md`. Nothing says where a table goes in a stem, whether it must be
  restated per card (agent B restated an identical 6-row tax table across 28 stems), or how
  that interacts with `audit-duplicate-stems` — it did not flag, but agent B is right that
  this is luck, not design.
- **Data displays vs function graphs.** Agents C and F both report that the "Data displays"
  rules in `tikz-prompt.md` are written for *categorical* displays and mislead on plotted
  function graphs: "x-axis label under the categories" has no meaning with numeric ticks,
  and the "line graphs must have a non-constant slope" rule **directly contradicts** a
  simple-interest graph, whose constant slope is the point of the skill. The y-label offset
  `x≈-2.0` is calibrated at scale 0.5–0.6 and detaches at the mandated `scale ≥ 0.85`.
  Agent C also notes **no copy-ready template exists for a gridded coordinate graph** even
  though four shipped skills use the identical hand-rolled idiom.
- **Skills whose `dotPointIds` span stages.** The "Upper-stage scope drift" bullet addresses
  booklet *chapters*, but the actual Stage-5 pattern is that the **skill record itself**
  carries both (`["dp-s5c-fina-3","dp-s6st11-managing-2"]` — true for 11 of these 12).
  Read-first item 9 calls the dot point "the source of record", which points an agent
  straight at the Stage-6 one. Every spawn prompt carried "ignore the Stage-6 dp" by hand.
  Needs a sentence: **the batch's topic id selects the governing dot point.**
- **Stage-6 material interleaves rather than appends.** Unlike Stage-4 `Indices.md` where
  it sat in trailing chapters, FMA1 drops HSC-tagged items *inside* Stage-5 mastery tiers,
  so the exclusion is **per-question, not per-chapter**. Agent E suggests "HSC-tagged
  questions in a Stage-5 booklet are Stage-6 by default unless the routine is identical".
- **`npm run dev` has a `predev` hook that rewrites `public/content-manifest.json`**, so
  `shoot-tikz.mjs` (the "optional local aid") dirties a tracked file mid-batch. Agent F hit
  this; step 8's `npm run manifest` settled it, but the runbook should warn.
- Minor: `content-schema.md`'s validator warn text still says "target is 6–8" where the
  runbook says the ceiling is 10–12.

**Stage-6 scope drift excluded (the watch held).** Simple-interest **multi-line** rate
comparison graphs (FMA2 Q4/Q5 — that is Stage-6 `simple-interest-graphs`; all six of agent
C's figures carry exactly ONE line); continuous compounding and $e$ (FMB Q19); solving for
$n$ **with logarithms** anywhere (authored only as booklet-style guess-and-check);
annuities, reducing-balance loans, credit cards and FV/PV interest-factor tables;
straight-line (prime-cost) depreciation and any method comparison (Stage-6
`compare-depreciation-methods`); depreciation at 8% per half-year (FMB Q24 — non-annual
periods belong to `compounding-frequency`); Medicare levy thresholds/reductions (booklet
teaches a flat 2%); the tax-table graphing task (FMA1 Q11, a rates-of-change reading); and
five HSC Standard items embedded in FMA1's tax chapters. FMB's superannuation example
(L1038) was kept **only** as a plain future-value context, with no contribution stream.

**Scope lines held between siblings.** `simple-interest` authored zero compound interest;
`compound-interest-*` authored zero depreciation and zero simple-vs-compound; agent E's
three-skill chain is disjoint by method (explicit repeated `\times(1+r)` factors, capped at
2–4 periods / the formula at 4–25 years / the matching step as every card's first line);
`buying-on-terms` excluded the flat-annual-rate-from-a-terms-deal family because
rearranging $I=Prn$ for $r$ is `simple-interest`'s thing-being-tested; agent B's four tax
skills never make the student compute gross pay (always given) and the tax table appears in
`taxable-income-tax` **not at all**, in `medicare-levy` and `tax-refund-or-owing` only in
mastery. Exclusive scenario domains were assigned per skill (trades/hospitality · four
separate taxpayer professions · savings-goal · consumer purchases · short-term savings ·
term deposits · accounts quoting a compounding period · vehicles/machinery · bank offers) —
**0 cross-skill duplicate stems over 366 items**, the batch-15 method holding at Stage 5.

**Tax table.** One table throughout agent B's four skills — the ATO **"Resident tax rates
2022–23"** (Nil / 19c / \$5092+32.5c / \$29 467+37c / \$51 667+45c), read from FMA1's
`image15.png` and cross-verified against nine booklet answer keys. Rendered as a KaTeX
`array`, restated in every stem needing it. Four deliberately different fictional-country
tables appear only in the unknown-table-value items.

**Diagram checklist — 3 of 12 skills, 23 blocks (16 content + 7 quiz), review at
`http://localhost:5173/#/tikz-check?topic=t-s5c-fin-a` and `?topic=t-s5c-fin-b`. The other
9 skills are word/number/table skills and are deliberately figure-free.** Ranked
highest-risk-first:
1. `compare-simple-compound` (4 content + 2 quiz): **two-line shared-axes comparison
   graphs** — a straight simple line and an exponential compound curve. Highest risk: the
   crossover cards (`development[2]` crossing just before $n=8$; quiz q5 crossing at year
   6) must *visually* cross where the key says, and quiz q4 deliberately **swaps the A/B
   labels** relative to the practice figure. Also check the white-filled crossover label
   sits clear of both lines.
2. `simple-interest` (8 content + 4 quiz): six single-line SI graphs, each drawn twice
   (blank support in the question, dashed read-lines added in the solution). Every reading
   was deliberately landed **on a gridline**; confirm no question figure pre-marks its
   answer, and check the rotated y-label "Interest (dollars)" against the wide 3-digit
   ticks at `scale=0.85`.
3. `depreciation` (4 content + 1 quiz): three decay curves with y-ticks chosen so the read
   values sit on gridlines ($8000$s and $7500$s). Agent F rendered all 11 of its figures
   via `shoot-tikz` (0 compile failures) and eyeballed them; agent C's 12 were not
   shot-rendered, so they carry the higher unverified risk despite the lower ranking.
**New TikZ idiom worth recording in `tikz-prompt.md`:** agent F used
`exp(x*ln(k))` inside `\addplot` for exponential growth/decay — previously unused anywhere
in `public/`, compiles cleanly under TikZJax, and is safer than `k^x`; gotcha is that raw
JS floats leak artefacts (`ln(0.8200000000000001)`) unless rounded.

**Booklet errata found (23 across the four booklets, none reproduced).** FMA1: a bonus
example whose stem says 6% while the working uses `0.03`; a leave-loading example that
never states its final answer; three Leave Loading mastery questions printed with **no
answers**; two wrong-name/pronoun mismatches; four question sets answerable only from the
image; a Medicare-levy working line transposing `88 420`→`88 402`; a tax key silently
rounding `\$13 958.975` up; a refund question requiring an unstated 26-fortnight
assumption; a sign convention used but never stated; a PAYG example carrying a rounded
intermediate. FMA2: mangled `$` delimiters in the syllabus dot point; Q15 giving only one
of the two answers asked; a 2019 HSC MCQ whose options exist only inside the image; graph
readings presented as exact. FMA3: `$I=PRN$` vs the house `$I=Prn$`; docx debris placing
`r = 0.16` above the question; **rounding never pinned on any of nine non-terminating
answers**; a BNPL part under-determined standalone. FMB: the rowing-machine table **off by
one** ($n=1$ row holds $V_0$); Q16b answering \$9000 where the exact value is \$8580 (a
graph read presented as exact); the Depreciation chapter printing $FV=PV(1-r)^n$ in every
prompt while its own theory box says $S=V_0(1-r)^n$; Q17f internally muddled on rate
periods; a comma thousands-separator against the booklet's own thin space; question
numbering jumping 15→19.

**Not committed** (runbook step 10). Working tree carries the 24 new content/quiz files,
the rebuilt manifest (**356 content / 219 quiz**, +12/+12) and the `docs/` edits.

**Wave-1 backlog surfaced by the new value-signature audit (human to rule on, not a
Wave-2 blocker — the gate only ever runs batch-scoped):** dry-running
`QUIZ-COPIES-PRACTICE-VALUES` over committed batch 16 found **8 genuine reworded
foundation/development clones** that both the stem gate and luna (blind to F/D tiers)
missed: `complementary-probability` q5≡d1, q6≡d4, q7≡d5; `complement-of-event` q6≡d8;
`observed-probability` q7≡d3; `sample-space` q3≡f3; `theoretical-probability` q3≡f3;
plus `theoretical-probability` q4≡f4 (genuine but now a known **false negative** — the
quiz mirrors part b of a multi-part foundation card while the audit's answer heuristic
reads the last solution line, part c). Sits alongside the earlier 160-hit historical
QUIZ-COPIES-PRACTICE advisory list.

**Two known false positives on committed batch 16 (recorded so batch orchestrators
recognise the pattern):** `sample-space` q3≡d1 and `complement-of-event` q6≡f7 — both
have non-numeric answers (a set / free text) so the signature degrades to numbers-only,
and shared tikz-template coordinates or a shared card-count scenario collide. If a
Wave-2 batch hits this pattern (same numbers, genuinely different question), adjudicate
INVALID and record it in the batch notes.

**Audit limitation on record:** multi-part practice cards — the value signature takes
the LAST solution line as the card's answer, so a quiz item cloning an earlier sub-part
can escape (the q4≡f4 case). Tooling backlog: per-part answer extraction.

---

## Round 7 notes (W2-22, W2-23) — LAST round, Wave 2 (Stage 5) now COMPLETE

Done 2026-08-13, in-review, uncommitted. 2 lane orchestrators (Opus, foreground section
generators throughout — no orphan incidents this round). Full detail is in the W2-22/W2-23
batch rows above; this section carries what doesn't fit there.

**Post-round main-session steps, all clean:** manifest rebuilt **634/634** content/quiz
(+20/+20). Full-repo `validate.mjs`: 0 errors, 247 warnings (identical pre-existing set —
no new warnings from either batch). `npm test`: 114/114. Unscoped
`audit-duplicate-stems.mjs --strict` wave regression: **held at 2** — confirmed the same
two pre-existing defects as every round since R4 (`order-operations-roots` f8≡d1
bracket-form false positive; `evaluate-index-notation` d2 ≡ `zero-index` f7 on
`$0^5$`), zero new debt from either batch.

**W2-23 dot-point → scope mapping** (no booklet to cross-reference, recorded in full since
future Stage-6 networks/data work will collide with these boundaries):
- `describe-networks` → `dp-s5p-net-1`: vertices/edges, degree (loop=2, multi-edge counted
  separately), directed/weighted networks at identify-level, "same graph redrawn" (no
  geometric meaning to a drawing), handshake sum as a described check. Excludes: adjacency
  matrices, network-from-table, weight optimisation, trees, flow (all Stage 6).
- `planar-graphs` → `dp-s5p-net-2` (planar half): planarity as a network property (not a
  picture), redrawing to remove crossings, face counting **including the outer region**,
  $K_5$/$K_{3,3}$ at ID level. Excludes: $v-e+f=2$ itself (→ `eulers-formula`), Kuratowski
  proof, colouring, isomorphism (all comparisons use labelled vertices).
- `eulers-formula` → `dp-s5p-net-2` (formula half): verify/find-missing on $v-e+f=2$ only.
  Excludes: planarity testing, $e\le3v-6$, polyhedra, disconnected graphs.
- `eulerian-trails-circuits` → `dp-s5p-net-3`: walk/trail/path/circuit/cycle, odd-degree
  tests, connectivity precondition, Königsberg (appears only here). Excludes: Hamiltonian
  paths (no Stage-5 dot point covers them), Fleury's/Hierholzer's construction algorithms,
  weighted/Chinese-postman, trees, flow.
- `plan-statistical-inquiry` → `dp-s5p-dat-c-1`: inquiry-cycle stages (question → hypothesis
  → population/variable type → instrument → ethics → organisation → display choice →
  reporting). Excludes: any computed statistic (mean/median/IQR/correlation — that's Data
  Analysis A/B, W2-21); question-wording bias (owned by `design-survey` S3 /
  `identify-survey-bias` S4); experimental design.
- `evaluate-sampling-methods` → `dp-s5p-dat-c-2`: simple random/systematic/stratified/
  self-selected — definitions, execution (systematic $k$, proportional stratum sizes),
  sample-size effects. Excludes: formal representativeness justification, data-collection
  faults/confounders/blinding (Stage 6), margin of error/confidence/significance,
  `census-vs-sample` (S4, assumed not tested).
- `critique-statistical-reports` → `dp-s5p-dat-c-2`, disjoint from the above: judging a
  published claim — beyond-the-group, beyond-what-was-measured, correlation-as-causation,
  missing information, funding/conflict, recruitment, non-response, headline-vs-finding,
  selected comparison, what a decision-maker should do. Excludes: `misleading-graphs`/
  `identify-misleading-data` (all four figures here are fairly drawn — the fault is always
  in the wording, not the graph), `interpret-media-data` (no card is answered by reading a
  graph value), `bivariate-data`'s definitional correlation/causation distinction.

**Not committed** (runbook step 10, as every round). Working tree carries the 20 new
content/quiz files plus the rebuilt manifest and these `docs/` edits. Diagram checklists for
W2-14/W2-20/W2-21/W2-22/W2-23 are all still owed one combined human visual-review pass
before commit — none of these five batches are committed yet.

**Wave 2 (Stage 5) is now complete: all 23 batches (W2-1 through W2-23) generated,
gate-clean, luna-checked.** Wave 3 (Stage 6) would be the next campaign to plan — not
started here; see "Later waves" below.

---

## Later waves (placeholder)

Stage 6 topics will be appended here as a further wave once Wave 2 (Stage 5) is complete,
in the same curriculum-then-course order used by `booklets/QUEUE.md`.
