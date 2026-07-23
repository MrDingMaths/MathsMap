# Cross-topic backfill proposal — B-stage4-2

## Summary
12 pairs examined · 10 accepted (14 edges) · 2 rejected · 12 skills modified

## TARGET: Length `t-s4-len`

### Equations `t-s4-equ` → ACCEPT
- **Edge:** `solve-one-step-equation` → `find-radius-from-circumference`
- **Why constitutive:** the routine is "substitute into C = πd or C = 2πr and solve for the diameter/radius using inverse operations" — after substitution this is always a one-step isolate (÷π or ÷2π). This is the reference case named in the brief.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `find-radius-from-circumference` → `circumference-circle` → `pi-definition`/`substitute-into-expressions`; no equations skill in that chain)

- **Edge:** `solve-one-step-equation` → `find-side-from-perimeter`
- **Why constitutive:** booklet routine ("Length 1", Solving Perimeter Problems) is write the perimeter equation, substitute, combine like terms, solve. Combining like terms collapses every worked example (`75 = 16+34+x` → `75 = 50+x` → `25 = x`; `4x = 50`) to a single inverse operation. This is the other half of the reference case named in the brief.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `find-side-from-perimeter` → `perimeter-2d-shapes` → `add-multiple-numbers-place-value`; no equations skill in that chain)

### Fractions, decimals and percentages `t-s4-frc` → ACCEPT
- **Edge:** `fraction-decimal-quantity-problems` → `arc-length-perimeter-sector`
- **Why constitutive:** the arc-length formula *is* "find a fraction of a whole" — booklet ("Length 2", Arc Length of a Circle) states the routine as "the arc length is a ___ of the circumference; first find the ___ of the circumference the arc represents (θ/360), then ___" and annotates the worked example with "*To find a fraction of a whole...*". θ/360 × 2πr cannot be executed without the fraction-of-a-quantity technique.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `arc-length-perimeter-sector` → `circumference-circle`/`sector-interior-angle` and their ancestors; no FDP skill present). `perimeter-composite-arc-figures` inherits this via its `arc-length-perimeter-sector` prereq, so no separate edge needed there.
- **Considered and rejected:** `round-decimals` — nearly every numeric-answer skill in this stage asks for 2 d.p., so rounding is ambient here, not distinctive to arc length specifically.

## TARGET: Linear relationships `t-s4-lin`

### Geometric measure A `t-s3-gm-a` → REJECT
- **Why:** already transitively reachable and not redundant to duplicate. `plot-points-cartesian` → `plot-points-four-quadrants` (Geometric measure B) → `read-coordinates-first-quadrant` → `plot-points-first-quadrant`, and `plot-points-four-quadrants` also lists `locate-integers-number-line` directly — both GM-A skills named in the pack are already ancestors of every coordinate-dependent skill in this topic (`linear-representations`, `graph-linear-relationship`, `point-satisfies-line`, `solve-equation-graphically`, `intersection-of-lines`, `compare-linear-equations`, `linear-real-life`). On the topic map this already renders as a two-hop path GM-A → GM-B → Linear relationships. A direct GM-A edge would be a transitive-reduction violation (bar 4). No other Linear-relationships skill (pattern/table/equation-of-line skills) touches GM-A content (perimeter, angles, metre/km).

### Computation with integers `t-s4-int` → REJECT
- **Why:** same shape of redundancy. `construct-table-of-values` → `substitute-negative-numbers` → `substitute-into-expressions` → `order-of-operations-integers` (an explicit `t-s4-int` skill named in the pack), and `order-of-operations-integers` → `multiply-divide-integers` also named in the pack. `graph-linear-relationship`, `linear-real-life`, `solve-equation-graphically`, `intersection-of-lines`, `compare-linear-equations` all descend from `construct-table-of-values`/`graph-linear-relationship`. Separately, `plot-points-cartesian` already reaches `locate-integers-number-line` via `plot-points-four-quadrants`. Topic map already shows a two-hop path Computation-with-integers → Algebraic Techniques → Linear relationships. Adding a direct edge duplicates an existing chain (bar 4).

## TARGET: Probability `t-s4-pro`

### Fractions, decimals and percentages `t-s4-frc` → ACCEPT
- **Edge:** `fraction-decimal-quantity-problems` → `expected-frequency`
- **Why constitutive:** f = np is literally "multiply a quantity by a fraction/decimal" — booklet ("Probability 1", Expected Frequency) worked example is `100 × 1/2 = 50`, with the annotation prompt "How did we know to do 100 × 1/2?" pointing straight at this technique.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `expected-frequency` → `theoretical-probability` → `sample-space`/`probability-as-fraction` → stage-3 `fraction-as-division`; no `t-s4-frc` skill present)

- **Edge:** `add-subtract-fractions` → `complementary-probability`
- **Why constitutive:** P(E') = 1 − P(E) routinely requires subtracting a fraction (or sum of fractions) from 1 with a common denominator — booklet ("Probability 2") drills exactly this: `1 − 5/7`, `1 − 2/6 − 1/6`, `1 − (3/10 + 1/5)`.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `complementary-probability` → `complement-of-event` → `theoretical-probability` chain; no `t-s4-frc` skill present)
- **Considered and rejected:** simplifying the favourable/total fraction in `theoretical-probability` — no booklet evidence this is drilled as a distinct required step; leaving it out keeps the anchor set minimal.

## TARGET: Properties of geometrical figures `t-s4-geo`

### Equations `t-s4-equ` → ACCEPT
- **Edge:** `solve-linear-2-step` → `angle-sum-triangle`
- **Why constitutive:** "apply the angle sum" means writing and solving an angle equation — booklet ("Properties 3") worked examples at this exact point are `a + 130 = 180` (one-step) and `2a + 26 = 180` (two-step, isolate-then-divide), and the general procedure box says "1. Write an equation using angle relationships. 2. Simplify... 3. Solve." `solve-linear-2-step`'s own prereq chain includes `solve-one-step-equation`, so this single edge covers both forms.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `angle-sum-triangle` → `parallel-line-angle-properties` → `transversal-angle-pairs`/`parallel-perpendicular-notation`/`geometry-notation`; no equations skill present)
- **Minimal anchor:** placed on `angle-sum-triangle` (earliest point of need) rather than `exterior-angle-triangle`, `angle-sum-quadrilateral`, or `unknown-sides-angles-figures` — all three already descend from `angle-sum-triangle`, so they inherit the edge for free; a direct edge on any of them would be redundant.

## TARGET: Ratios and rates `t-s4-rat`

### Equations `t-s4-equ` → ACCEPT
- **Edge:** `solve-one-step-equation` → `rate-problems`
- **Why constitutive:** booklet ("Ratios and Rates 4", Rates Problems) states the method as "1. Write the given information as an equation... 2. Solve for the unknown. If the unknown is in the denominator, take the reciprocal of both sides," with worked examples like `360/30 = x/120` solved by "× 120 both sides" — a one-step isolate.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `rate-problems` → `simplify-rates` → `ratios-vs-rates` → `ratios-compare-quantities`; no equations skill present). `related-rates-problems` inherits this via its `rate-problems` prereq.

### Volume `t-s4-vol` → ACCEPT
- **Edge:** `convert-volume-capacity-units` → `best-buys`
- **Why constitutive:** step 1 of the best-buy method is "convert both rates to the same units if different" — booklet ("Ratios and Rates 4") gives a worked comparison of `$3.85 for 1 L` vs `$11.40 for 12×300 mL`, which cannot be compared without a mL↔L conversion.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `best-buys` → `simplify-rates` → `ratios-vs-rates` → `ratios-compare-quantities`; no volume skill present)
- **Considered and rejected:** `related-rates-problems`' drip-rate example (drops/time = drops/volume × volume/time) uses "volume" only as a dimensional label in a rate chain, not the geometric routine (V = Ah / V = πr²h) — grafted context, not constitutive.

## TARGET: Right-angled triangles (Pythagoras' theorem) `t-s4-pyt`

### Fractions, decimals and percentages `t-s4-frc` → ACCEPT
- **Edge:** `irrational-numbers` → `pythagoras-find-side`
- **Why constitutive:** the routine explicitly branches on whether the root is exact/surd or decimal — booklet ("Right-angled Triangles") has a dedicated step "Identify whether to leave a root in exact form: square roots that do not make a nice terminating decimal should be left as a root (exact/surd form)." Recognising which roots are irrational is exactly `irrational-numbers` ("numbers such as √2 that cannot be written as a/b").
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `pythagoras-find-side` → `pythagoras-theorem-statement`/`square-cube-roots`/`solve-quadratic-ax2` and full ancestor set — `quadratic-two-solutions`, `evaluate-index-notation`, `index-notation-terms`, `hypotenuse`; no FDP skill present)

### Length `t-s4-len` → ACCEPT
- **Edge:** `perimeter-2d-shapes` → `pythagoras-problems`
- **Why constitutive:** several core "practical problem" items are explicitly "find the missing side(s), then find the perimeter" (booklet "Right-angled Triangles", e.g. Q4, Q11) — summing the found side with the given sides is the perimeter-of-a-triangle routine.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (`perimeter-2d-shapes` is stage 3 in origin but is also a member of `t-s4-len` via `dp-s4-len-1`, matching the pack's own listing of it as a Length-topic skill) · non-redundant ✓ (checked `pythagoras-problems` → `pythagoras-find-side` and its full ancestor set; no length/perimeter skill present). `pythagoras-multistep` inherits this via its `pythagoras-problems` prereq.
- **Considered and rejected:** the one HSC-extension question mixing a quadrant (arc) into a Pythagoras problem — a single hard composite item, not the routine itself; treated as grafted, not anchored.

## TARGET: Volume `t-s4-vol`

### Equations `t-s4-equ` → ACCEPT
- **Edge:** `equations-from-formulas` → `find-dimension-from-volume`
- **Why constitutive:** finding a missing height/base from `V = Ah` (given V and A) is a linear equation arising from substituting into a formula — exactly `equations-from-formulas`'s definition.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `find-dimension-from-volume`'s full ancestor set — `volume-of-cylinder`, `volume-of-prism`, `area-of-circle`, `area-of-rectangle`, `substitute-into-expressions` and its algebra/integer ancestors; no equations-from-formulas/solve-linear-2-step in that set)

- **Edge:** `quadratics-from-formulas` → `find-dimension-from-volume`
- **Why constitutive:** finding a missing radius from `V = πr²h` requires rearranging to `r² = V/(πh)` and taking a root — a quadratic equation arising from a formula, exactly `quadratics-from-formulas`'s definition, and the same pattern already used to anchor `pythagoras-find-side`.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (same ancestor check as above; `quadratics-from-formulas` and `equations-from-formulas` are siblings, not ancestor/descendant, so neither edge makes the other redundant)
- **Two edges kept (not one)** because the skill's own blurb covers both the linear case (`V = Ah` → h) and the quadratic case (`V = πr²h` → r), and neither formula subsumes the other's solving technique.

### Indices `t-s4-ind` → ACCEPT
- **Edge:** `evaluate-index-notation` → `convert-volume-capacity-units`
- **Why constitutive:** cubic-unit conversion scales by the linear factor cubed — booklet ("Volume 4") worked items are literally `20 m³ × 100³`, `5000 mm³ ÷ 10³`, `150 000 mm³ ÷ 10³ ÷ 100³`. Evaluating `100³`/`10³` is `evaluate-index-notation`'s routine.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked `convert-volume-capacity-units` → `volume-capacity-units`/`decimal-times-divide-powers-10` → `decimal-place-value-x10` → `partition-decimals-place-value`/`express-thousandths-decimals`; no indices skill present)
- **Considered and rejected:** a second edge onto `volume-of-cylinder` for squaring r in `V = πr²h` — squaring a given number is ambient arithmetic used everywhere in this stage (including in `area-of-circle`, already a prereq without an indices link), not distinctive to Volume.

## Patch (apply after review)
| skill id | current prereqs | add | resulting prereqs |
|---|---|---|---|
| `find-radius-from-circumference` | `circumference-circle` | `solve-one-step-equation` | `circumference-circle`, `solve-one-step-equation` |
| `find-side-from-perimeter` | `perimeter-2d-shapes` | `solve-one-step-equation` | `perimeter-2d-shapes`, `solve-one-step-equation` |
| `arc-length-perimeter-sector` | `circumference-circle`, `sector-interior-angle` | `fraction-decimal-quantity-problems` | `circumference-circle`, `sector-interior-angle`, `fraction-decimal-quantity-problems` |
| `expected-frequency` | `theoretical-probability` | `fraction-decimal-quantity-problems` | `theoretical-probability`, `fraction-decimal-quantity-problems` |
| `complementary-probability` | `complement-of-event` | `add-subtract-fractions` | `complement-of-event`, `add-subtract-fractions` |
| `angle-sum-triangle` | `parallel-line-angle-properties` | `solve-linear-2-step` | `parallel-line-angle-properties`, `solve-linear-2-step` |
| `rate-problems` | `simplify-rates` | `solve-one-step-equation` | `simplify-rates`, `solve-one-step-equation` |
| `best-buys` | `simplify-rates` | `convert-volume-capacity-units` | `simplify-rates`, `convert-volume-capacity-units` |
| `pythagoras-find-side` | `pythagoras-theorem-statement`, `square-cube-roots`, `solve-quadratic-ax2` | `irrational-numbers` | `pythagoras-theorem-statement`, `square-cube-roots`, `solve-quadratic-ax2`, `irrational-numbers` |
| `pythagoras-problems` | `pythagoras-find-side` | `perimeter-2d-shapes` | `pythagoras-find-side`, `perimeter-2d-shapes` |
| `find-dimension-from-volume` | `volume-of-cylinder` | `equations-from-formulas`, `quadratics-from-formulas` | `volume-of-cylinder`, `equations-from-formulas`, `quadratics-from-formulas` |
| `convert-volume-capacity-units` | `volume-capacity-units`, `decimal-times-divide-powers-10` | `evaluate-index-notation` | `volume-capacity-units`, `decimal-times-divide-powers-10`, `evaluate-index-notation` |

All 14 edges verified with a node script: every id exists, no cycles (source does not transitively depend on target), no stage inversions, and no redundancy (target does not already transitively reach source through its existing prereq chain).

## Notes / judgement calls
- The two REJECTs (Linear relationships ← Geometric measure A / Computation with integers) are the most consequential calls in this pack: they reject "expected" pairs not because the relationship is false, but because it's already represented on the topic map via an existing intermediate-topic hop (GM-A→GM-B→Linear-relationships; Computation-with-integers→Algebraic-Techniques→Linear-relationships). If the reviewer's audit tool that generated the "expected" list only checks for a *direct* topic edge, it will keep flagging these as missing even though the map already shows the path — worth confirming the audit tool (or a human) is fine treating a two-hop path as satisfying the intent, otherwise these two would need to be manually whitelisted as "satisfied indirectly" rather than re-examined every pass.
- `find-dimension-from-volume` and (earlier, structurally identical) `pythagoras-find-side`/`find-radius-from-circumference` show a recurring pattern worth flagging generally: several Stage-4 measurement "solve for a dimension" skills split into a one-step/linear case and a root-taking/quadratic case depending on which formula variable is unknown. This pack anchored each occurrence independently from the booklet evidence available (`solve-one-step-equation` vs `equations-from-formulas` vs `quadratics-from-formulas` vs `solve-quadratic-ax2`) rather than assuming one canonical choice — worth a light consistency pass across all backfill packs once every group is in, since another author might have picked a different granularity for an equivalent case.
- `perimeter-2d-shapes` is stage-3-origin but double-tagged into `t-s4-len` (`dp-s4-len-1`); I used it as the Length-topic anchor for the Pythagoras edge on the strength of that tag (matches how the pack itself lists it under Length), not its `stage` field.
