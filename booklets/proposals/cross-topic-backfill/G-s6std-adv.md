# Cross-topic backfill proposal — G-s6std-adv

## Summary
16 pairs examined · 8 accepted · 8 rejected · 7 skills modified (8 edges added — `model-optimisation` receives two)

## TARGET: Algebraic relationships `t-s6st12-algebraic`

### Linear relationships C `t-s5p-lin-c` → REJECT
- **Why:** Every skill in Linear relationships C (`midpoint-formula`, `gradient-formula`, `distance-formula`, `general-gradient-intercept-form`, `point-gradient-form`, `parallel-perpendicular-any-form`, `coordinate-geometry-problems`, `symmetry-of-graphs`, `transformations-coordinates`) is tagged only `s5-path` (+ `s6-adv11` for some) — **none carry `s6-std12`**. Standard-2-bound students never study this topic, so it cannot be assumed prior knowledge. Content-wise there's also no genuine constitutive link: `simultaneous-equations-graphically`'s existing chain (`intersection-of-lines` → `graph-linear-relationship`) already covers graphing a line; none of the coordinate-geometry-C machinery (midpoint/distance/parallel-perpendicular/symmetry) is a required step of any target routine (variation, quadratics, exponentials, simultaneous equations).

### Non-linear relationships C `t-s5p-nli-c` → REJECT
- **Why:** Same pathway problem, more pronounced. All 11 candidate skills (`parabola-transformations`, `sketch-parabola-from-equation`, `exponential-transformations`, `hyperbola-transformations`, `circle-equation-*`, etc.) are `s5-path`/`s6-adv11` only — zero `s6-std12` tags. They are also the *more general/advanced* versions of the same content (full `ax²+bx+c`, translated hyperbolas, circles) rather than machinery the target's simpler forms (`y=kx²+c`, `y=k(a)^x+c`) build on — the dependency would run backwards. The target skills already anchor correctly to their true Standard-pathway prerequisites (`identify-parabola-exponential`, `describe-direct-variation`, `solve-linear-3-step`, `intersection-of-lines`), all `s5-core`/dual-tagged. **This is the "check Standard 2 Algebraic Relationships" case flagged in the brief — investigated in full, verdict is reject on pathway grounds, not oversight.**

## TARGET: Time and location `t-s6st11-time`

### Computation with integers `t-s4-int` → ACCEPT
- **Edge:** `add-subtract-integers` → `latitude-longitude-difference`
- **Why constitutive:** The routine is "subtract on the same side of the Equator/Prime Meridian, add on opposite sides... including wrapping past 90°/180°" — this is literally the directed-number sign-rule procedure (same-side ~ same-sign-style subtraction, opposite-side ~ addition) applied to a new context. The step cannot be executed without applying directed-number addition/subtraction.
- **Bar:** distinctive ✓ (specific sign-convention arithmetic, not generic) · at-risk ✓ · stage-proximity relaxed — constitutive (stage 4→6) · non-redundant ✓ (checked `latitude-longitude-difference`'s full transitive closure — empty of integer skills; verified via script)

### Length `t-s4-len` → REJECT
- **Why:** No target skill involves distance, perimeter or circle measurement — the whole target list (12/24hr conversion, timetables, elapsed time, lat/long, time zones, UTC) is purely temporal/angular. No constitutive contact point; would be ambient at best.

## TARGET: Trigonometry `t-s6st12-trig`

### Right-angled triangles (Pythagoras' theorem) `t-s4-pyt` → REJECT
- **Why:** Checked transitively (via `node` script) — `hypotenuse` (the one clearly relevant Pythagoras-topic skill) is **already reachable** from every candidate target skill through the existing chain `trig-find-side`/`trig-find-angle` → `evaluate-trig-ratio` → `define-trig-ratios` → `label-trig-sides` → `hypotenuse`. Adding it again would violate the non-redundancy bar. The remaining Pythagoras skills (`pythagoras-find-side`, `pythagoras-problems`, etc. — actual theorem computation) appear only incidentally in some practical/bearings word problems, not as a fixed step of any listed routine (sine/cosine rule, area rule, bearings all operate on triangles where side lengths are given or found via trig, not Pythagoras) — grafted context, not constitutive.

## TARGET: Applications of calculus `t-s6adv12-appcalc`

### Area and surface area B `t-s5p-are-b` → ACCEPT
- **Edge:** `surface-area-cone` → `model-optimisation`
- **Why constitutive:** `model-optimisation`'s routine is "form an objective function" — optimisation problems in this topic routinely *are* "minimise the surface area of a [cone/cylinder/prism] given a volume constraint" (confirmed in `booklets/Stage 6 Advanced/Applications of Calculus 2_Optimisation.md`, e.g. "Show that its surface area is S = 2πr² + …", cone-forming problem at line ~1032). Forming that objective function requires applying the surface-area formula as a literal step.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (5→6) · non-redundant ✓ (checked, `model-optimisation`'s closure has no Area-B skill)

### Equations C `t-s5p-equ-c` → REJECT
- **Why:** The one plausible anchor, `solve-quadratic-factorisation`, is **already transitively reachable** for every skill that would need it (`model-optimisation`, `classify-stationary-first-derivative`, `global-maximum-minimum`, `solve-optimisation`, `curve-sketching-calculus` all inherit it via `stationary-points`, whose *existing* direct prereqs are `[increasing-decreasing-functions, solve-quadratic-factorisation]` — verified by script). The remaining target skills (`second-derivative`, `concavity-second-derivative`, rates-of-change/motion/exponential-model skills) don't solve equations as part of their routine at all.

### Volume B `t-s5p-vol-b` → ACCEPT
- **Edge:** `volume-pyramid-cone` → `model-optimisation`
- **Why constitutive:** Same optimisation booklet is full of "show the volume is V = …" setups for cones/pyramids/prisms as the constraint equation that the objective function is then derived from (e.g. cone-folding problem, cylinder-in-sphere problem). Modelling the constraint is not optional — it's the first step of the routine.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (5→6) · non-redundant ✓ (checked, closure empty of Volume-B skills)

## TARGET: Financial mathematics `t-s6adv12-finance`

### Exponential and logarithmic functions `t-s6adv11-explog` → REJECT
- **Why:** The plausible case was `reducing-balance-loan-calculations`/`annuity-problems-gp` needing `solve-exponential-log-equations` to solve for time/duration (the exponent). Checked both source booklets (`Financial Mathematics 1_Reducing balance loans.md`, `Financial Mathematics 2_Annuities.md`) — **zero uses of logs** anywhere in either. The syllabus wording itself is "examine the effect... on time taken to repay a loan, **with or without digital tools** or by using a given graph" — i.e. the routine as taught explicitly permits technology/graph-reading instead of algebraic log-solving. Not a required step → ambient/optional, not constitutive. The real machinery (`geometric-series-sum`, `compound-interest-formula`) is already present.

## TARGET: Graph transformations `t-s6adv11-transform`

### Linear relationships C `t-s5p-lin-c` → REJECT
- **Why:** `circle-equation-general`'s only plausible anchor, `distance-formula`, is **already redundant** — `circle-equation-general`'s existing prereq `circle-equation-origin` already has `distance-formula` as its direct prereq (verified). `transformations-coordinates` (point translation/reflection/rotation) is conceptually parallel to `transform-translations`/`transform-reflections`/`transform-dilations` but is not executed as a step of the substitution-based routine (replacing $x$ by $x-a$ etc. in an equation) — analogous framing, not constitutive machinery.

## TARGET: Integral calculus `t-s6adv12-intcalc`

### Non-linear relationships C `t-s5p-nli-c` → ACCEPT
- **Edge:** `parabola-intercepts-axis-vertex` → `area-under-curve`
- **Why constitutive:** `area-under-curve`'s routine explicitly "accounts for regions below the axis," which requires finding where the curve crosses the x-axis first. Confirmed in `booklets/Stage 6 Advanced/Integral Calculus 3_Further Areas under Curves.md`: "1. Find the x-intercepts by solving f(x)=0. 2. Split the integral at each intercept..." — quadratics are the dominant example type. This pairing is also pathway-correct: Non-linear relationships C is `s5-path` feeding `s6-adv11`→`s6-adv12`, matching Integral calculus's own `s6-adv12` pathway (unlike target #1's mismatch).
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (5→6) · non-redundant ✓ (checked, closure empty)

## TARGET: Introduction to differentiation `t-s6adv11-diff`

### Variation and rates of change B `t-s5p-var-b` → ACCEPT
- **Edge:** `constant-rate-graphs` → `average-rate-of-change`
- **Why constitutive:** `average-rate-of-change`'s current sole prereq is `gradient-formula` — pure coordinate-geometry mechanics, with no prior step establishing that "gradient represents a rate of change." That interpretive leap is exactly what `constant-rate-graphs` ("Interpret the gradient of a straight-line graph as a constant rate of increase or decrease") teaches. Confirmed by the target's own booklet (`Introduction to Differentiation 1_Estimating Change.md`), whose opening investigation re-derives "the rate of change of a linear function is its gradient" from a distance/speed context before ever reaching secants — i.e. the syllabus treats this as continuation, not a fresh introduction. `average-rate-of-change` sits at the root of the topic's derivative-intro subtree (`instantaneous-rate-tangent`, `gradient-secant-limit`, `define-derivative-tangent`, … all descend from it), so one anchor here covers the whole branch — this was the pack's flagged **zero-path** pair.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (5→6) · non-redundant ✓ (checked, closure empty; no cycle)

## TARGET: Random variables `t-s6adv12-randomvar`

### Data classification and visualisation `t-s4-dat` → ACCEPT
- **Edge:** `discrete-continuous-nominal-ordinal` → `continuous-random-variable`
- **Why constitutive:** `continuous-random-variable`'s current prereq `discrete-continuous-random-variables` (stage 6, prereqs: `[]`) asserts the discrete/continuous distinction from scratch with no grounding — but that exact distinction ("describe numerical data as discrete/continuous") is first taught in `discrete-continuous-nominal-ordinal`. The random-variable version is a direct reapplication of the same classification, not new content.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity relaxed — constitutive (stage 4→6) · non-redundant ✓ (checked; note `discrete-probability-distribution` already transitively has `represent-data-graphs` via its `theoretical-probability`/`estimate-probability-relative-frequency` chain, which is why no edge is proposed there — would be redundant)

## TARGET: Trigonometry and measure of angles `t-s6adv11-trig`

### Area `t-s4-are` → ACCEPT
- **Edge:** `area-of-circle` → `sector-area-radians`
- **Why constitutive:** The syllabus dot point (confirmed in `booklets/Stage 6 Advanced/Trigonometry and Measure of Angles 3_Radians.md`) is "**Prove and use** the formula A = ½r²θ" — the proof is via the proportion (area of sector)/(area of circle) = θ/2π, which requires area-of-circle (A=πr²) as the literal reference quantity in the derivation, not just similar content.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity relaxed — constitutive (stage 4→6, proof step) · non-redundant ✓ (checked; `radian-definition`'s own chain runs through `circumference-circle`, not area, so no overlap)

## TARGET: Working with functions `t-s6adv11-functions`

### Computation with integers `t-s4-int` → ACCEPT
- **Edge:** `determine-sign-product-quotient` → `expand-brackets`
- **Why constitutive:** `expand-brackets` depends on `distribute-negative-multiplier` ("Expand when the multiplier is negative, **getting the sign of each product right**") — which currently has **empty prereqs**, i.e. the sign-rule step it names has no grounding anywhere upstream. `determine-sign-product-quotient` ("same signs give positive, different signs give negative") is exactly that rule. Since `distribute-negative-multiplier` itself isn't in this target topic (can't be edited here), the fix is anchored one level up at `expand-brackets`, which is.
- **Bar:** distinctive ✓ (the specific sign rule, not general arithmetic) · at-risk ✓ · stage-proximity ✓ (4=4, direction correct — integers precede algebra pedagogically) · non-redundant ✓ (checked, closure empty)

## Patch (apply after review)
| skill id | current prereqs | add | resulting prereqs |
|---|---|---|---|
| `latitude-longitude-difference` | `latitude-longitude` | `add-subtract-integers` | `latitude-longitude`, `add-subtract-integers` |
| `model-optimisation` | `stationary-points` | `surface-area-cone`, `volume-pyramid-cone` | `stationary-points`, `surface-area-cone`, `volume-pyramid-cone` |
| `area-under-curve` | `fundamental-theorem-calculus`, `definite-integral-geometric` | `parabola-intercepts-axis-vertex` | `fundamental-theorem-calculus`, `definite-integral-geometric`, `parabola-intercepts-axis-vertex` |
| `average-rate-of-change` | `gradient-formula` | `constant-rate-graphs` | `gradient-formula`, `constant-rate-graphs` |
| `continuous-random-variable` | `discrete-continuous-random-variables` | `discrete-continuous-nominal-ordinal` | `discrete-continuous-random-variables`, `discrete-continuous-nominal-ordinal` |
| `sector-area-radians` | `radian-definition` | `area-of-circle` | `radian-definition`, `area-of-circle` |
| `expand-brackets` | `multiply-divide-algebraic-terms`, `distribute-negative-multiplier` | `determine-sign-product-quotient` | `multiply-divide-algebraic-terms`, `distribute-negative-multiplier`, `determine-sign-product-quotient` |

All 8 edges verified by script for: id existence, no stage inversion, no cycle, non-redundancy (target's full transitive closure did not already contain the proposed source skill). See per-edge "Bar" lines above.

## Notes / judgement calls
- **Target 1 (Algebraic relationships, Standard 2)** — the brief's flagged "check within Standard 2" case. Both expected source topics (Linear/Non-linear relationships C) turned out on inspection to be **entirely `s5-path`-tagged content that never reaches `s6-std12`** — every one of their ~20 candidate skills lacks the `s6-std12` course tag. I'm confident this is a genuine pathway mismatch in how the 111 expected topic-pairs were generated (likely matched on strand-name similarity — "non-linear relationships" ~ "algebraic relationships" — rather than actual pathway lineage), not a gap I should force an edge into. Flagging for a human sanity-check in case the topic-to-course mapping itself has a data issue worth fixing upstream (i.e., maybe `t-s6st12-algebraic` was meant to also pull from a "Non-linear relationships B" or similar Standard-pathway topic not in my pack).
- **Target 8 (Introduction to differentiation)** — the other flagged zero-path case. Accepted with one anchor (`constant-rate-graphs` → `average-rate-of-change`) that covers the whole derivative-intro subtree by construction (everything else descends from `average-rate-of-change` in the existing prereq graph). Reviewer may want a second, lower-level anchor (e.g. `qualitative-rate-of-change` → `instantaneous-rate-tangent`, for the "distinguish average from instantaneous" framing) but I judged one sufficient per the "1 is the target" guidance and didn't want to bulk-wire a topic whose conceptual overlap with Variation-B is broad.
- **`model-optimisation`** receives two edges (Area B and Volume B) because both source topics independently supply constitutive machinery to the *same* target skill — this is two separate pair-decisions each staying within the 1-edge-per-pair target, not double-anchoring one pair.
- Rejected pairs where I found a *partial* signal but concluded it didn't clear the bar: Trigonometry `t-s6st12-trig` ← Pythagoras (redundant via existing `label-trig-sides` chain — worth knowing if that chain is ever refactored, the redundancy argument would need re-checking); Financial maths ← exp/log (booklets confirm technology-based method, not log-solving, is what's actually taught).
