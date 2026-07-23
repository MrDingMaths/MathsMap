# Cross-topic backfill proposal — D-s5core-2

## Summary
12 pairs examined · 9 accepted · 3 rejected · 9 skills modified

## TARGET: Linear relationships A `t-s5c-lin-a`

### Algebraic techniques `t-s4-alg` → REJECT
- **Why:** No target skill has a genuine gap once the Equations edge below is applied.
  `graph-linear-relationship`, `identify-intercepts` and `horizontal-vertical-lines`
  already reach `substitute-into-expressions` transitively (via `construct-table-of-values`).
  The one skill that lacked it, `point-satisfies-line`, is best anchored on
  `verify-solutions-substitution` (Equations) — and that skill's own prereqs already
  include `substitute-into-expressions`. Adding it again from Algebra would be redundant
  (transitive-reduction violation).

### Data analysis `t-s4-dan` → ACCEPT
- **Edge:** `calculate-mean-median-mode-range` → `midpoint-of-interval`
- **Why constitutive:** The syllabus itself frames this step as "Apply the process for
  calculating the mean to find the midpoint" (confirmed in
  `booklets/Stage 5/Linear Relationships A 1_Coordinate Geometry.md`, "Midpoint" section,
  Review box: "Identify the midpoint of numbers using the mean"). The midpoint formula
  $\left(\dfrac{x_1+x_2}{2}, \dfrac{y_1+y_2}{2}\right)$ is literally the mean of the two
  x-values and the mean of the two y-values.
- **Bar:** distinctive ✓ (booklet explicitly names it as the mean process, not generic
  arithmetic) · at-risk ✓ (review includes negative-number pairs students get wrong) ·
  stage-proximity ✓ (stage 4 → stage 5) · non-redundant ✓ (checked `midpoint-of-interval`'s
  only prereq `plot-points-cartesian` and its closure — no statistics skill present)

### Equations `t-s4-equ` → ACCEPT
- **Edge:** `verify-solutions-substitution` → `point-satisfies-line`
- **Why constitutive:** `point-satisfies-line`'s worked routine in
  `booklets/Stage 5/Linear Relationships A 2_Graphing Lines.md` ("Checking if a Point Lies
  on a Line") is: separate LHS/RHS, substitute x and y into both sides, compare — this is
  exactly `verify-solutions-substitution`'s routine ("check a solution by substituting it
  back into the equation"), applied to a line's equation instead of a bare equation. The
  booklet's own Review box for this section is titled "Verify solutions to algebraic
  equations."
- **Bar:** distinctive ✓ · at-risk ✓ (students conflate "evaluate" with "compare LHS=RHS")
  · stage-proximity ✓ (stage 4 → stage 4) · non-redundant ✓ (checked — `point-satisfies-line`'s
  only prereq `linear-representations` and its closure contain no equations skill)

### Ratios and rates `t-s4-rat` → REJECT
- **Why:** No target skill in this topic distinctively needs ratio/rate machinery.
  `gradient-of-interval`'s "simplify the fraction if you can" step
  (`booklets/Stage 5/Linear Relationships A 1_Coordinate Geometry.md`, "Gradient Formula")
  is ambient fraction-simplification, not the comparison/unitary-method/rate-conversion
  content that makes `t-s4-rat` distinctive — and no booklet section for this topic cites
  ratios or rates as review material (checked "Gradient", "Gradient from Coordinates",
  "Midpoint", "Distance" sections).

## TARGET: Linear relationships B `t-s5c-lin-b`

### Equations `t-s4-equ` → ACCEPT
- **Edge 1:** `solve-linear-2-step` → `linear-real-life`
- **Why constitutive:** `linear-real-life`'s worked example in
  `booklets/Stage 5/Linear Relationships B Gradient-Intercept Form.md` ("Constructing
  Linear Models") derives an equation (e.g. $300 = 1.5n + 100$) and then must solve it for
  the unknown — a plain 2-step isolation. `linear-real-life`'s current prereq chain
  (`graph-linear-relationship` → ... → `substitute-into-expressions`) never reaches an
  equation-solving skill.
- **Edge 2:** `solve-equation-negative-coefficient` → `rearrange-to-gradient-intercept`
- **Why constitutive:** The "Rearranging to Gradient-Intercept Form" section requires
  isolating $y$ from equations like $3y+15-2x=0$ and $-2x-5y=3$, including dividing by a
  negative coefficient of $y$ — exactly `solve-equation-negative-coefficient`'s routine.
  Picked over the simpler `solve-linear-2-step` because negative-coefficient division is
  used in the guided practice and is the step students actually trip on; `solve-linear-2-step`
  is already its prereq, so this is the minimal *sufficient* single anchor.
- **Bar (both edges):** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 4 → stage 5) ·
  non-redundant ✓ (checked both targets' full prereq closures — neither reaches any
  equation-solving skill currently)

### Fractions, decimals and percentages `t-s4-frc` → ACCEPT
- **Edge:** `round-decimals` → `linear-real-life`
- **Why constitutive:** The HSC-sourced problem in the same booklet ("A clubhouse uses
  four long-life light globes...") explicitly instructs "Find the value of $d$ (correct to
  three decimal places)" after solving $250 = 24 + 7300d$ — rounding a non-terminating
  decimal answer to a specified number of places is a required step of the real-life
  linear-model routine, not optional presentation.
- **Bar:** distinctive ✓ (specific decimal-place rounding, not "give a sensible answer") ·
  at-risk ✓ (rounding-place errors are common) · stage-proximity ✓ (stage 4 → stage 4) ·
  non-redundant ✓ (checked `linear-real-life`'s closure — no rounding skill present)

## TARGET: Non-linear relationships A `t-s5c-nli-a`

### Indices A `t-s5c-ind-a` → ACCEPT
- **Edge:** `negative-integer-indices` → `graph-quadratic-exponential-tech`
- **Why constitutive:** The booklet's own "Review of Prior Knowledge"
  (`booklets/Stage 5 Core/Non-Linear Relationships A 1_...md`) asks students to evaluate
  $3^{x}$ at $x=-2$ before the graphing content begins — building a table of values for an
  exponential relationship over a domain that includes negative $x$ requires evaluating
  negative indices.
- **Bar:** distinctive ✓ · at-risk ✓ (negative indices are a well-known error source) ·
  stage-proximity ✓ (stage 5, same stage — ordering is sound: indices is taught before
  non-linear graphing) · non-redundant ✓ (checked `graph-quadratic-exponential-tech`'s
  prereqs `substitute-into-expressions`, `plot-points-cartesian` and their closures — no
  index skill present)

## TARGET: Numbers of any magnitude `t-s5c-mag`

### Indices A `t-s5c-ind-a` → ACCEPT
- **Edge:** `negative-integer-indices` → `scientific-notation`
- **Why constitutive:** Writing small numbers in scientific notation ($0.00435 = 4.35\times
  10^{-3}$) and converting back requires understanding negative powers of 10 — the
  booklet's own Review of Prior Knowledge
  (`booklets/Stage 5 Core/Numbers of Any Magnitude 4_...md`) explicitly reviews "which
  powers of 10 are negative" immediately before the scientific-notation content, and
  negative exponents appear throughout the worked examples and practice.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 5, same stage — indices
  taught first) · non-redundant ✓ (checked `scientific-notation`'s prereq
  `decimal-times-divide-powers-10` and its closure — no index skill present;
  `order-scientific-notation` and `calculations-scientific-notation` inherit this via
  `scientific-notation` so were not given a separate edge)

## TARGET: Properties of geometrical figures A `t-s5c-geo-a`

### Properties of geometrical figures `t-s4-geo` → ACCEPT
- **Edge:** `angle-sum-triangle` → `similar-figures-properties`
- **Why constitutive:** The "Determining whether Two Figures are Similar" section
  (`booklets/Stage 5 Core/Properties of Geometrical Figures A 1_...md`) opens with "Find
  the size of the remaining angle in each of these triangles" as a required step before
  comparing corresponding angles to establish similarity — i.e. a missing triangle angle
  must be found via the angle sum before the similarity comparison can be made.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 4 → stage 5) ·
  non-redundant ✓ (checked `similar-figures-properties`'s only prereq `simplify-ratios`
  and its closure — no angle skill present)

## TARGET: Trigonometry A `t-s5c-trg-a`

### Equations A `t-s5c-equ-a` → ACCEPT
- **Edge:** `solve-linear-algebraic-fraction` → `trig-find-side-denominator`
- **Why constitutive:** `trig-find-side-denominator`'s routine (e.g. $\sin35°=\dfrac{5}{x}$,
  multiply by $x$ then divide by the ratio) is precisely an "unknown in the denominator"
  equation. The booklet's own Review of Prior Knowledge
  (`booklets/Stage 5 Core/Trigonometry A 2_...md`) states the rule explicitly: "To solve an
  equation with an unknown as the denominator we can first multiply both sides by that
  unknown," with practice items of the exact form $\dfrac{4}{x}=2$. `solve-linear-algebraic-fraction`
  is the closest-fit skill in the Equations A source list for this "algebraic fraction"
  form (the simpler numerator case in `trig-find-side` is one-step and stage-4 material
  outside this pack's scope).
- **Bar:** distinctive ✓ · at-risk ✓ (denominator-unknown equations are a known sticking
  point) · stage-proximity ✓ (stage 5, same stage) · non-redundant ✓ (checked
  `trig-find-side-denominator`'s prereq chain through `trig-find-side` →
  `evaluate-trig-ratio` → `define-trig-ratios` → `label-trig-sides` → `hypotenuse` — no
  equation-solving skill present)

## TARGET: Trigonometry B `t-s5c-trg-b`

### Angle relationships `t-s4-ang` → ACCEPT
- **Edge:** `unknown-angles-parallel` → `bearing-between-two-points`
- **Why constitutive:** The "Calculating Bearing Between Two Locations" worked examples
  (`booklets/Stage 5 Core/Trigonometry B 2_...md`) explicitly walk through finding the
  angle at the second point via "alternate angles on parallel lines" (Step 1) then adding
  "angles at a point sum to 360°" (Step 2) to get the true bearing. `unknown-angles-parallel`
  is the minimal sufficient single anchor: its own prereqs are `parallel-line-angle-properties`
  and `unknown-angles-point`, so one edge covers both steps of the worked routine.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 4 → stage 5) ·
  non-redundant ✓ (checked `bearing-between-two-points`'s only prereq `bearings` and its
  closure — no angle-relationship skill present)

### Right-angled triangles (Pythagoras' theorem) `t-s4-pyt` → REJECT
- **Why:** Already redundant. `hypotenuse` (the most basic Pythagoras-topic skill) is
  already reachable transitively from every Trigonometry B target skill via
  `trig-practical-problems` → ... → `label-trig-sides` → `hypotenuse`. No worked example in
  either `Trigonometry B 1` (elevation/depression) or `Trigonometry B 2` (bearings) uses
  Pythagoras' theorem itself (e.g. no problem asks for a straight-line distance via two
  perpendicular legs) — every problem is solved with a single trig ratio. No non-redundant
  anchor exists.

## Patch (apply after review)
| skill id | current prereqs | add | resulting prereqs |
|---|---|---|---|
| `point-satisfies-line` | `linear-representations` | `verify-solutions-substitution` | `linear-representations`, `verify-solutions-substitution` |
| `midpoint-of-interval` | `plot-points-cartesian` | `calculate-mean-median-mode-range` | `plot-points-cartesian`, `calculate-mean-median-mode-range` |
| `linear-real-life` | `graph-linear-relationship` | `solve-linear-2-step`, `round-decimals` | `graph-linear-relationship`, `solve-linear-2-step`, `round-decimals` |
| `rearrange-to-gradient-intercept` | `slope-intercept-interpret` | `solve-equation-negative-coefficient` | `slope-intercept-interpret`, `solve-equation-negative-coefficient` |
| `graph-quadratic-exponential-tech` | `substitute-into-expressions`, `plot-points-cartesian` | `negative-integer-indices` | `substitute-into-expressions`, `plot-points-cartesian`, `negative-integer-indices` |
| `scientific-notation` | `decimal-times-divide-powers-10` | `negative-integer-indices` | `decimal-times-divide-powers-10`, `negative-integer-indices` |
| `similar-figures-properties` | `simplify-ratios` | `angle-sum-triangle` | `simplify-ratios`, `angle-sum-triangle` |
| `trig-find-side-denominator` | `trig-find-side` | `solve-linear-algebraic-fraction` | `trig-find-side`, `solve-linear-algebraic-fraction` |
| `bearing-between-two-points` | `bearings` | `unknown-angles-parallel` | `bearings`, `unknown-angles-parallel` |

## Notes / judgement calls
- **`linear-real-life` gets two new prereqs** (one per source topic pair, `t-s4-equ` and
  `t-s4-frc`), both independently evidenced from the same worked examples in the booklet.
  Flagging in case the reviewer would rather cap it at one.
- **`t-s4-alg` → `t-s5c-lin-a` rejected as redundant, not as "no relationship exists."**
  There is a real algebra dependency (substitution) — it's just already satisfied through
  the `t-s4-equ` edge I added (`verify-solutions-substitution` has `substitute-into-expressions`
  as its own prereq). Worth double-checking this reasoning if the equations edge is
  rejected on review — if `verify-solutions-substitution` → `point-satisfies-line` is cut,
  `substitute-into-expressions` → `point-satisfies-line` becomes the fallback edge for
  `t-s4-alg`.
- **`t-s4-rat` → `t-s5c-lin-a` and `t-s4-pyt` → `t-s5c-trg-b` are the two "expected but not
  found" rejections** — both expected pairs from the pack where I could not find
  distinctive, non-redundant constitutive machinery in either the skill blurbs or the
  source booklets. Worth a second look if there's booklet content I didn't check (I read
  the Stage 5 / Stage 5 Core booklets for these two topics but not every section
  exhaustively).
- **`negative-integer-indices` is stage 5**, same stage as both its targets
  (`graph-quadratic-exponential-tech`, `scientific-notation`). No stage inversion, but
  flagging since it's not the usual "1 stage below" shape — the ordering relies on Indices A
  being taught before Non-linear relationships A / Numbers of any magnitude within stage 5,
  which matches the topic numbering (`t-s5c-ind-a` conventionally precedes both) but wasn't
  independently verified against a course sequence document.
