# Cross-topic backfill proposal — A-stage4-1

## Summary
19 pairs examined · 14 accepted · 5 rejected · 15 skills modified · 20 edges added

Verified with a node script (existence, no cycles, no stage-inversion, non-redundant against
existing transitive closure) — all 20 edges pass.

---

## TARGET: Algebraic techniques `t-s4-alg`

### Additive relations B `t-s3-ar-b` → REJECT
- **Why:** Additive relations B is decimal addition/subtraction and multistep *word-problem*
  reasoning. No skill in Algebraic techniques executes decimal arithmetic or word-problem
  combination as a step — `translate-expressions` parses word cues into symbols but doesn't
  compute an answer, and `collect-like-terms`/expand/factorise all operate on integer
  coefficients (covered elsewhere). Ambient/no genuine step-dependency found.

### Multiplicative relations B `t-s3-mr-b` → ACCEPT
- **Edge:** `division-as-fraction` → `algebraic-notation`
- **Why constitutive:** `algebraic-notation`'s routine is "apply conventions for
  multiplication, division and powers in algebra" — writing a pronumeral division as a
  fraction ($x \div y \to x/y$) *is* one of those conventions, and it is literally the same
  notational move `division-as-fraction` teaches at the numeric level ($a\div b = a/b$).
- **Bar:** distinctive ✓ (a specific notational convention, not generic arithmetic) · at-risk ✓
  (students who haven't internalised $a\div b=a/b$ will write $x\div y$ literally) ·
  stage-proximity ✓ (source stage 3 vs target stage 4) · non-redundant ✓ (checked
  `algebraic-notation`'s only current prereq `pronumerals-variables`, which has prereqs `[]`)

---

## TARGET: Angle relationships `t-s4-ang`

### Geometric measure B `t-s3-gm-b` → ACCEPT
- **Edges:**
  - `angles-add-to-90` → `unknown-angles-point`
  - `angles-add-to-180` → `unknown-angles-point`
  - `angles-add-to-360` → `unknown-angles-point`
- **Why constitutive:** Booklet evidence (`Angle Relationships.md`, "Geometry problems
  involving equations", worked examples) shows the routine is literally "write an equation
  using an angle-sum fact, then solve": `x + 70 = 90` (angles in a right angle), `x + 20 + 40
  = 180` (angles on a straight line). `unknown-angles-point`'s title and routine ("find
  unknown angles at a point") is the direct upgrade of `angles-add-to-360`'s stage-3 title
  ("find angles at a point"); the 90°/180° cases are the same routine for the complementary
  and straight-line sub-cases. `angle-pairs-point` (existing prereq) only identifies pair
  *types*; it doesn't supply the numeric sum facts used to solve for the unknown.
- **Bar:** distinctive ✓ (three specific, non-overlapping numeric facts) · at-risk ✓ (a
  student who can name "complementary" may not reliably apply the 90/180/360 facts under
  algebraic dressing) · stage-proximity ✓ · non-redundant ✓ (checked
  `unknown-angles-point` → `angle-pairs-point` → `geometry-notation`/`classify-angles`, none
  of which reach these three ids) · note: 3 edges used (the per-pair max) — justified because
  each anchors a textually distinct sum fact used in the booklet's own examples, not
  bulk-wiring the whole source topic.

### Algebraic techniques `t-s4-alg` → ACCEPT
- **Edge:** `collect-like-terms` → `unknown-angles-parallel`
- **Why constitutive:** Deeper in the same booklet (parallel-line/challenge problems), angle
  equations combine multiple $x$-terms before solving, e.g. `x + 3x = 180` and
  `2x + (360 - 11x) = 180`. Combining these into a single term is exactly
  `collect-like-terms`'s routine. This is qualitatively different from the simple
  `unknown-angles-point` examples (`x + 70 = 90`), which only need constant-term addition, not
  like-term collection of $x$-terms — hence anchored on `unknown-angles-parallel`, not
  `unknown-angles-point`.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage; direction confirmed by
  pack) · non-redundant ✓ (checked `unknown-angles-parallel` → `parallel-line-angle-properties`
  and → `unknown-angles-point` chains — neither reaches `collect-like-terms`)

### Equations `t-s4-equ` → ACCEPT
- **Edges:**
  - `solve-one-step-equation` → `unknown-angles-point`
  - `solve-equation-x-both-sides` → `unknown-angles-parallel`
- **Why constitutive:** The basic point/straight-line examples (`x + 70 = 90`, `x + 60 = 180`)
  are one-step equations once the angle fact is applied — `solve-one-step-equation` is the
  simplest sufficient anchor for `unknown-angles-point`. The parallel-line/challenge examples
  go further, setting two angle expressions equal with $x$ on both sides, e.g.
  `20x - 15 = 16x + 6` (alternate angles) and `5x = x + 64` — this is exactly
  `solve-equation-x-both-sides`'s routine, so it anchors `unknown-angles-parallel` instead of
  being redundantly re-added at the simpler skill.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (verified by script:
  neither id was already reachable from its target)

---

## TARGET: Area `t-s4-are`

### Equations `t-s4-equ` → ACCEPT
- **Edges:**
  - `solve-quadratic-ax2` → `find-unknown-from-circle-area`
  - `solve-linear-2-step` → `find-unknown-from-trapezium-area`
  - `solve-linear-2-step` → `find-unknown-side-from-area`
- **Why constitutive:** All three target skills are explicitly defined as "substitute into
  [formula] and solve for [unknown] using inverse operations" — that *is* an equation-solving
  step. `find-unknown-from-circle-area` rearranges $A=\pi r^2$, an $ax^2=c$ form, matching
  `solve-quadratic-ax2` exactly (its blurb: "giving exact and decimal-approximation answers" —
  same as area-from-radius problems). The trapezium/side-from-area cases rearrange
  $A=\frac h2(a+b)$ / $A=bh/2$, both 2-step linear forms, matching `solve-linear-2-step`
  (which already subsumes `solve-one-step-equation`, covering the $A=lw$ one-step case too).
- **Bar:** distinctive ✓ (the routine's own wording names "solve for using inverse
  operations") · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓ (script-checked;
  note `square-cube-roots` was deliberately **not** also added to
  `find-unknown-from-circle-area` — it's already reachable via
  `solve-quadratic-ax2` → `quadratic-two-solutions` → `square-cube-roots`, which would have
  been a redundant addition)

### Fractions, decimals and percentages `t-s4-frc` → REJECT
- **Why:** Checked all three Area booklets (`Area 1`, `Area 2`, `Area 3`) for percentage or
  distinctive-fraction content — none found. The fraction use in area formulas ($\tfrac12 xy$,
  $\tfrac h2(a+b)$, $\tfrac12 bh$) is ambient halving, not a distinctive FDP-topic skill
  (`percentage-of-quantity`, `simplify-fractions`, etc. never appear).

### Indices `t-s4-ind` → ACCEPT
- **Edge:** `evaluate-index-notation` → `area-of-circle`
- **Why constitutive:** $A=\pi r^2$ requires evaluating $r^2$, which is index-notation
  evaluation. `find-unknown-from-circle-area`'s square-root need is already covered
  transitively via the Equations edge above (through `solve-quadratic-ax2`), so this edge is
  deliberately placed on the forward-computation skill (`area-of-circle`) instead, to avoid
  redundancy.
- **Bar:** distinctive — borderline (see Notes) · at-risk ✓ · stage-proximity ✓ (same stage) ·
  non-redundant ✓ (script-checked)

### Properties of geometrical figures `t-s4-geo` → REJECT
- **Why:** Considered `quadrilateral-properties` → `area-kite-rhombus` (diagonal properties
  underlying $A=\tfrac12xy$), but `Area 3_Quadrilaterals.md` **defines "diagonal" in place**
  ("A diagonal of a shape joins two non-adjacent vertices…") rather than assuming it's already
  known from the Properties topic — evidence the Area routine is self-contained vocabulary,
  not a step that invokes `quadrilateral-properties`' actual verify/describe routine. Also,
  `classify-quadrilaterals` (the more obvious classification candidate) explicitly excludes
  kites and trapeziums from its scope, so it can't anchor `area-kite-rhombus` /
  `area-trapezium` either. No qualifying edge found.

---

## TARGET: Computation with integers `t-s4-int`

### Additive relations B `t-s3-ar-b` → REJECT
- **Why:** Additive relations B operates on decimals and multistep word-problem combination;
  Computation with integers is signed-number rules on whole numbers. No target skill (sign
  rules, number-line moves) executes decimal arithmetic or word-problem combination as a step
  — these are parallel/analogous skills applied to different numeric domains, not one nested
  inside the other. `directed-number-sentences` (modelling contexts with directed numbers)
  looks superficially similar to `multistep-add-subtract-problems` but is a same-level
  re-application to a new domain, not a routine that invokes the stage-3 skill's procedure.

---

## TARGET: Data analysis `t-s4-dan`

### Data B `t-s3-data-b` → ACCEPT
- **Edge:** `compare-displays-range-mode` → `compare-datasets-measures`
- **Why constitutive:** `compare-datasets-measures` ("compare datasets using mean, median,
  mode and range") is a strict superset of the stage-3 skill's routine ("compare distributions
  by their range and most frequent value") — to compare by mean/median/mode/range you
  literally must also compare by mode and range, which is exactly what
  `compare-displays-range-mode` already does.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked
  `compare-datasets-measures`'s only current prereq `calculate-mean-median-mode-range`, prereqs
  `[]`)

### Data classification and visualisation `t-s4-dat` → ACCEPT
- **Edges:**
  - `represent-data-graphs` → `shape-of-distribution`
  - `represent-data-graphs` → `modality`
- **Why constitutive:** Describing a distribution's shape (symmetric/skewed) or modality
  (unimodal/bimodal) is done by reading a graphical display (histogram, dot plot) — you cannot
  perform this without knowing what such a display looks like, which is
  `represent-data-graphs`'s routine. Neither target skill's current prereq
  (`calculate-mean-median-mode-range`) covers graph familiarity.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage; direction confirmed by
  pack) · non-redundant ✓ (both targets' only current prereq is
  `calculate-mean-median-mode-range`, which has prereqs `[]`)

### Equations `t-s4-equ` → ACCEPT
- **Edge:** `equations-from-formulas` → `find-value-from-mean`
- **Why constitutive:** `find-value-from-mean`'s own definition is "find a missing data value
  … using $\overline x=\Sigma x/n$" — substituting known values into a formula and solving for
  the unknown is precisely `equations-from-formulas`'s routine, applied to the mean formula
  instead of a generic one.
- **Bar:** distinctive ✓ (purpose-built match, not generic arithmetic) · at-risk ✓ ·
  stage-proximity ✓ (same stage) · non-redundant ✓ (`find-value-from-mean`'s only current
  prereq is `calculate-mean-median-mode-range`, prereqs `[]`)

---

## TARGET: Data classification and visualisation `t-s4-dat`

### Represents numbers B `t-s3-rn-b` → REJECT
- **Why:** Once the Fractions/decimals/percentages edge below is applied,
  `percent-meaning`, `find-10-percent`, `find-benchmark-percentages` and
  `equivalent-percent-decimal-fraction` all become transitively reachable from
  `represent-data-graphs` via `percentage-of-quantity` (verified: all four are in
  `percentage-of-quantity`'s prereq closure). Adding them directly would be redundant.
  `locate-integers-number-line`/`interpret-integers-context` have no evidenced constitutive
  role (ambient number-line familiarity).

### Fractions, decimals and percentages `t-s4-frc` → ACCEPT
- **Edge:** `percentage-of-quantity` → `represent-data-graphs`
- **Why constitutive:** `Data Classification and Visualisation 2` booklet has explicit pie-chart
  construction content: "Find these percentages of 360" and "What angles would you draw on a
  pie chart to show this information? Won: 153°, Draw: 90°, Lose: 117°" — converting a data
  percentage into a sector angle out of 360° is a direct application of
  `percentage-of-quantity` ("calculate any percentage of a quantity", here quantity=360). This
  is a necessary step for the pie-chart case within `represent-data-graphs`'s "and more".
- **Bar:** distinctive ✓ (booklet-evidenced, purpose-specific application) · at-risk ✓ ·
  stage-proximity ✓ (same stage) · non-redundant ✓ (checked `represent-data-graphs`'s current
  prereq `construct-column-graph-scale`; not connected)

---

## TARGET: Equations `t-s4-equ`

### Multiplicative relations B `t-s3-mr-b` → ACCEPT
- **Edge:** `inverse-operations-number-sentences` → `solve-one-step-equation`
- **Why constitutive:** Near-identical routines: `inverse-operations-number-sentences`
  ("rearrange a number sentence using inverse operations to find an unknown") is the numeric
  placeholder-box version of exactly what `solve-one-step-equation` does with a pronumeral.
  This is the algebra topic's direct numeric antecedent.
- **Bar:** distinctive ✓ · at-risk ✓ (some students solve one-step equations by "seeing" the
  answer rather than by inverse operations, and struggle once numbers aren't friendly) ·
  stage-proximity ✓ · non-redundant ✓ (`solve-one-step-equation`'s current prereqs: `[]`)

---

## TARGET: Indices `t-s4-ind`

### Algebraic techniques `t-s4-alg` → ACCEPT
- **Edge:** `substitute-negative-numbers` → `sign-of-powers`
- **Why constitutive:** `sign-of-powers` ("distinguish $-a^n$ from $(-a)^n$") depends on the
  exact same bracket-around-a-negative-value convention that `substitute-negative-numbers`
  teaches ("substitute negative values … writing each in brackets, then evaluate"). Without
  that convention a student cannot correctly form $(-a)^n$ in the first place.
- **Bar:** distinctive ✓ (specific notational convention) · at-risk ✓ · stage-proximity ✓
  (same stage; direction per pack) · non-redundant ✓ (`sign-of-powers`'s current prereq
  `evaluate-index-notation` doesn't reach it)

### Computation with integers `t-s4-int` → ACCEPT
- **Edge:** `multiply-divide-integers` → `evaluate-index-notation`
- **Why constitutive:** `evaluate-index-notation`'s routine is "write numbers in expanded form
  and evaluate powers" — for a negative base (e.g. $(-2)^3 = -2\times-2\times-2$), correctly
  evaluating the expansion requires multiplying signed integers correctly, which is
  `multiply-divide-integers`'s routine.
- **Bar:** distinctive ✓ (signed-multiplication specifically, not generic arithmetic) ·
  at-risk ✓ · stage-proximity ✓ (same stage; direction per pack) · non-redundant ✓
  (`evaluate-index-notation`'s current prereq `index-notation-terms` has prereqs unrelated to
  integer arithmetic)

### Fractions, decimals and percentages `t-s4-frc` → ACCEPT
- **Edge:** `approximation-notation` → `estimate-roots`
- **Why constitutive:** `estimate-roots`'s output is an approximate value between two known
  roots (e.g. $\sqrt{50}\approx7.1$) — recording that correctly requires the $\approx$
  convention that `approximation-notation` teaches, distinct from an exact "=" statement.
- **Bar:** distinctive ✓ · at-risk ✓ (students often write "=" for an estimate) ·
  stage-proximity ✓ (same stage) · non-redundant ✓ (`estimate-roots`'s current prereq
  `square-cube-roots` doesn't reach it)

---

## Patch (apply after review)
| skill id | current prereqs | add | resulting prereqs |
|---|---|---|---|
| `algebraic-notation` | `pronumerals-variables` | `division-as-fraction` | `pronumerals-variables`, `division-as-fraction` |
| `unknown-angles-point` | `angle-pairs-point` | `angles-add-to-90`, `angles-add-to-180`, `angles-add-to-360`, `solve-one-step-equation` | `angle-pairs-point`, `angles-add-to-90`, `angles-add-to-180`, `angles-add-to-360`, `solve-one-step-equation` |
| `unknown-angles-parallel` | `parallel-line-angle-properties`, `unknown-angles-point` | `collect-like-terms`, `solve-equation-x-both-sides` | `parallel-line-angle-properties`, `unknown-angles-point`, `collect-like-terms`, `solve-equation-x-both-sides` |
| `find-unknown-from-circle-area` | `area-of-sector` | `solve-quadratic-ax2` | `area-of-sector`, `solve-quadratic-ax2` |
| `find-unknown-from-trapezium-area` | `area-trapezium` | `solve-linear-2-step` | `area-trapezium`, `solve-linear-2-step` |
| `find-unknown-side-from-area` | `area-of-triangle` | `solve-linear-2-step` | `area-of-triangle`, `solve-linear-2-step` |
| `area-of-circle` | `pi-definition`, `substitute-into-expressions`, `halve-diameter-for-radius` | `evaluate-index-notation` | `pi-definition`, `substitute-into-expressions`, `halve-diameter-for-radius`, `evaluate-index-notation` |
| `compare-datasets-measures` | `calculate-mean-median-mode-range` | `compare-displays-range-mode` | `calculate-mean-median-mode-range`, `compare-displays-range-mode` |
| `shape-of-distribution` | `calculate-mean-median-mode-range` | `represent-data-graphs` | `calculate-mean-median-mode-range`, `represent-data-graphs` |
| `modality` | `calculate-mean-median-mode-range` | `represent-data-graphs` | `calculate-mean-median-mode-range`, `represent-data-graphs` |
| `find-value-from-mean` | `calculate-mean-median-mode-range` | `equations-from-formulas` | `calculate-mean-median-mode-range`, `equations-from-formulas` |
| `represent-data-graphs` | `construct-column-graph-scale` | `percentage-of-quantity` | `construct-column-graph-scale`, `percentage-of-quantity` |
| `solve-one-step-equation` | *(none)* | `inverse-operations-number-sentences` | `inverse-operations-number-sentences` |
| `sign-of-powers` | `evaluate-index-notation` | `substitute-negative-numbers` | `evaluate-index-notation`, `substitute-negative-numbers` |
| `evaluate-index-notation` | `index-notation-terms` | `multiply-divide-integers` | `index-notation-terms`, `multiply-divide-integers` |
| `estimate-roots` | `square-cube-roots` | `approximation-notation` | `square-cube-roots`, `approximation-notation` |

## Notes / judgement calls
- **`evaluate-index-notation` → `area-of-circle`** is the weakest accepted edge — squaring $r$
  is arguably ambient-enough arithmetic that most stage-4 students handle it before formal
  index notation is taught. Kept it because the pack explicitly names Indices as an expected
  source for Area and no stronger candidate emerged (the square-root need in
  `find-unknown-from-circle-area` is already covered transitively via the Equations edge).
  Flag for a human call: **accept as-is, or downgrade to reject as too-ambient**.
- **`unknown-angles-point` picked up 4 new prereqs** (3 from Geometric measure B + 1 from
  Equations) across two different source-topic pairs, each within its own per-pair cap. This
  is not bulk-wiring — each is a textually distinct fact evidenced in the booklet's own worked
  examples — but the reviewer may want to sanity-check the total.
  `unknown-angles-parallel` similarly picked up 2 (algebra + equations), deliberately split
  from `unknown-angles-point` by problem complexity (single-unknown numeric-fact equations vs.
  multi-term/both-sides algebra), evidenced by two visibly different difficulty tiers in the
  same booklet.
- **Two of the pack's 8 targets (Area, Data classification and visualisation) each had one of
  their two/four expected source pairs reject.** Area rejected FDP (no percentage/fraction
  content found in any of the 3 Area booklets) and Properties-of-geo-figures (booklet
  self-defines "diagonal" rather than depending on the Properties topic). Data classification
  rejected Represents-numbers-B as redundant once the FDP edge is added.
- **Computation with integers had its only expected source (Additive relations B) rejected
  outright** — the two topics operate on different numeric domains (decimals+word-problems vs.
  signed whole numbers) with no step-level dependency found. Worth double-checking this
  against the original topic-graph intent, since it leaves `t-s4-int` with zero backfilled
  in-edges from this pack.
