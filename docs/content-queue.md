# Content-generation queue

Ordered queue of **topics** to mass-generate per-skill teaching content
(`public/content/{id}.json`) and quizzes (`public/quizzes/{id}.json`) for, one topic per
session, via the workflow in [content-generation.md](content-generation.md).

**One batch per session.** Work top to bottom. After a batch's samples are approved,
`node scripts/validate.mjs` + `npm run manifest` are clean, and the status is set here,
move to the next `pending` row — do not skip ahead. **Statuses are set by the
orchestrator; do not commit** (the human commits).

This first wave covers the **16 Stage-4-course topics** (`courses` contains `s4`). Later
waves (Stage 5, Stage 6) are appended to this same queue once Stage 4 is through.

**Status vocabulary:** `pending` → `generated` (both files written, `validate --only`
clean per skill) → `checked` (blind check adjudicated) → `validated` (batch
`validate.mjs` clean, manifest rebuilt) → `in-review` (human-review samples out) →
`committed`.

**Skill counts** are the number of skills whose `dotPointIds` resolve to the topic
(`data/dotpoints.json` → `topicId`). The parenthetical is the **stage-3 subset** — skills
with `stage: 3` living on a Stage-4-course dot point; these already have a content file,
so their `theory` is copied **byte-for-byte** and only practice + quiz are added (STAGE 3
rule). The named stage-3 skills are listed under each affected batch.

**Booklet paths** are relative to `booklets/Stage 4/` and were cross-checked against the
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
coordinates and agreed every marked position. Not committed — awaiting human review + commit.

**Pilot gate: human review of pilot outcomes before batch 7 starts.**

### Post-pilot (batches 7–16)

| # | Topic id | Topic title | Skills (stage-3 subset) | Mapped booklet file(s) | Status | Review samples | Anchor gaps |
|---|---|---|---|---|---|---|---|
| 7 | t-s4-int | Computation with integers | 9 (1) | `Computation with Integers.md` | in-review | `compare-order-integers`, `add-subtract-integers`, `order-of-operations-integers` + **diagram list (4: `locate-integers-number-line`, `compare-order-integers`, `add-subtract-positive-integers`, `add-subtract-integers`) for manual visual review** | none (all 9 booklet-covered) |
| 8 | t-s4-rat | Ratios and rates | 22 (0) | `Ratios and Rates 1_Recognise and simplify ratios.md`<br>`Ratios and Rates 2_Solve problems involving ratios.md`<br>`Ratios and Rates 3_Recognise and simplify rates.md`<br>`Ratios and Rates 4_Solve problems involving rates.md`<br>`Ratios and Rates 5_Interpret and construct distance–time graphs from authentic data.md` | in-review | `divide-quantity-in-ratio`, `construct-distance-time-graphs`, `ratios-vs-rates` + **full diagram list (11 skills, 173 `[tikz]`) for manual visual review** | none (all 22 booklet-covered); `ratios-vs-rates` weakest-anchored (definitional prose only — mastery from the dot point) |
| 9 | t-s4-ind | Indices | 14 (0) | `Indices.md` | pending | — | — |
| 10 | t-s4-equ | Equations | 11 (0) | `Equations 1_Solve 2 step equations.md`<br>`Equations 2_Formulas.md` | pending | — | — |
| 11 | t-s4-len | Length | 10 (1) | `Length 1_Solve problems involving the perimeter of various quadrilaterals and simple composite figures.md`<br>`Length 2_Describe the relationships between the features of circles.md` | pending | — | — |
| 12 | t-s4-are | Area | 18 (4) | `Area 1_Units Rectangles Parallelograms Triangles.md`<br>`Area 2_Circles and Sectors.md`<br>`Area 3_Quadrilaterals.md` | pending | — | — |
| 13 | t-s4-vol | Volume | 8 (0) | `Volume 1_Describe the different views of prisms and solids that have been formed from prism combinations.md`<br>`Volume 2_Develop and apply the formula to find the volume of a prism to solve problems.md`<br>`Volume 3_Develop the formula for finding the volume of a cylinder and apply the formula to solve problems.md`<br>`Volume 4_Choose appropriate units of measurement for volume and capacity and convert between units.md` | pending | — | — |
| 14 | t-s4-geo | Properties of geometrical figures | 9 (2) | `Properties of Geometrical Figures 1_Classify triangles according to their side and angle properties.md`<br>`Properties of Geometrical Figures 2_Classify quadrilaterals and describe their properties.md`<br>`Properties of Geometrical Figures 3_Apply the properties of triangles and quadrilaterals.md` | pending | — | — |
| 15 | t-s4-dan | Data analysis | 14 (0) | `Data Analysis.md` | pending | — | — |
| 16 | t-s4-pro | Probability | 7 (0) | `Probability 1_Determine probabilities for chance experiments.md`<br>`Probability 2_Determine probabilities for complementary events.md` | pending | — | — |

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

## Later waves (placeholder)

Stage 5 and Stage 6 topics will be appended here as further waves once Wave 1 (Stage 4) is
complete, in the same curriculum-then-course order used by `booklets/QUEUE.md`.
