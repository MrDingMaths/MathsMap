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
| 2 | t-s4-ang | Angle relationships | 7 (0) | `Angle Relationships.md` | committed | `unknown-angles-parallel`, `transversal-angle-pairs`, `geometry-notation` | ChatGPT-generated. 68 TikZ fields; all 68 compile and user visual review approved. Quiz figures added to diagram-reading items. Blind check: MCQ 31/31 agree, 0 unanswerable; original auxiliary-line defect repaired and rechecked. Two visual sweeps made 16 targeted figure repairs (ray endpoints, on-line parallel marks, angle-pair positions, right-angle splits, reflex-arc selection, missing rays, and label collisions); fresh blind bundles generated for touched skills. |
| 3 | t-s4-lin | Linear relationships | 12 (0) | `Linear Relationships.md` | committed | `graph-linear-relationship`, `intersection-of-lines`, `pattern-to-equation` | ChatGPT content discarded (archived at git tag `archive/t-s4-lin-chatgpt`); regenerated fresh with Opus, one agent per skill. `validate.mjs` clean; blind check 68/68 MCQ agree, 0 UNSURE, 0 mismatches. Visual diagram gate pending (done manually by human).  |
| 4 | t-s4-dat | Data classification and visualisation | 8 (0) | `Data Visualisation.md` (dp-1, classification)<br>`Data Classification and Visualisation 2_Display data using graphical representations relevant to the purpose of the data.md` (dp-2)<br>`Data Classification and Visualisation 3_Interpret data in graphical representations.md` (dp-3) | committed | `statistical-variable`, `misleading-graphs`, `represent-data-graphs` | `statistical-variable` (booklet under-covers — only a variable-vs-value table, no "which/name the variable" drills; the variable-vs-value / name-the-variable / variable-vs-individual items authored fresh from the dot point → closer review). Generated fresh with Opus, one agent per booklet section (3 generators + 3 fresh blind checkers, per pared workflow). All 8 `validate --only` clean. Blind check: **40/40 quiz MCQ agree**, all mastery items agree, 0 UNSURE, 0 mismatches, 0 figure-mismatch flags — no repairs. **Automated vision gate retired (per updated runbook); diagram skills flagged for manual human visual review:** `represent-data-graphs` (9 tikz), `graph-conventions` (5), `choose-graph-type` (1), `interpret-graphs-conclusions` (17), `misleading-graphs` (19); the 3 classification skills are diagram-free. `graph-conventions` mastery omitted (single-step recognition; masteryOmitted recorded). **Diagram-revision pass (post first human review):** all data-display figures rewritten to fix (a) title/y-axis-label collision and (b) scenario/column/line-shape monotony — anti-collision placement rule + variety rule + copy-ready templates added to `docs/tikz-prompt.md` (Data displays) and pointed to from the runbook, so batches 5–6 inherit it. Scenarios now disjoint across skills (pizza/shoes/books/cars/rainfall/grades/plants; concert/goals/museum/temperature/battery/populations/sales/exam-marks), column counts 3–7, line graphs non-linear. Re-validated clean + re-blind-checked (26/26 revised MCQ + mastery agree, 0 flags). **Second placement fix (post 2nd human review):** x-axis name was colliding with the last category/tick label at the arrow tip; hand-moved all 45 axis-name nodes to a centred lower line `(xmid, -1.0)` off the `y=0` baseline (coordinate-only, answers untouched → no re-check), and updated the `tikz-prompt.md` rule + templates so future graphs place the x-label there. **Third fix (crowding, post 3rd human review):** cramped small-scale figures had y-label overlapping wide `%`/4-digit ticks, long category words touching, and long titles overrunning the y-axis; hand-applied fit knobs (scale→0.85 min, wide-tick y-label→x−2.0, long category labels→`\tiny`, over-long titles→`\scriptsize`) across 5 files (font/scale only, no data change), and added a "Sizing & fit" rule to `tikz-prompt.md`. Re-validated clean. Committed as 49463fb. |
| 5 | t-s4-pyt | Right-angled triangles (Pythagoras) | 7 (0) | `Right-angled Triangles.md` | committed | `converse-pythagoras`, `pythagoras-problems`, `pythagoras-multistep` + **full diagram list (all 7) for manual visual review** | none (all 7 booklet-covered) — see notes for two deliberate scope/figure decisions |
| 6 | t-s4-frc | Fractions, decimals and percentages | 34 (2) | `Fractions Decimals Percentages 1_Comparing Fractions.md`<br>`Fractions Decimals Percentages 2_Decimals.md`<br>`Fractions Decimals Percentages 3_Converting FDP.md`<br>`Fractions Decimals Percentages 4_Operations with FDP.md`<br>`Fractions Decimals Percentages 5_Percentage Increase Decrease Change.md`<br>`Fractions Decimals Percentages 6_Percentages Problems.md` | pending | — | — |

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

**Pilot gate: human review of pilot outcomes before batch 7 starts.**

### Post-pilot (batches 7–16)

| # | Topic id | Topic title | Skills (stage-3 subset) | Mapped booklet file(s) | Status | Review samples | Anchor gaps |
|---|---|---|---|---|---|---|---|
| 7 | t-s4-int | Computation with integers | 9 (1) | `Computation with Integers.md` | pending | — | — |
| 8 | t-s4-rat | Ratios and rates | 22 (0) | `Ratios and Rates 1_Recognise and simplify ratios.md`<br>`Ratios and Rates 2_Solve problems involving ratios.md`<br>`Ratios and Rates 3_Recognise and simplify rates.md`<br>`Ratios and Rates 4_Solve problems involving rates.md`<br>`Ratios and Rates 5_Interpret and construct distance–time graphs from authentic data.md` | pending | — | — |
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
