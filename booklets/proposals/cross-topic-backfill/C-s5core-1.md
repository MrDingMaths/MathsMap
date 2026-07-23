# Cross-topic backfill proposal — C-s5core-1

## Summary
9 pairs examined · 8 accepted · 1 rejected · 7 skills modified (8 edges added — `surface-area-prism` receives 2)

## TARGET: Algebraic techniques A `t-s5c-alg-a`

### Multiplicative relations A `t-s3-mr-a` → ACCEPT
- **Edge:** `multiply-area-model-distributive` → `expand-binomial-products`
- **Why constitutive:** The booklet (`Algebraic Techniques A 2`, "Expanding Binomial Products") opens with an explicit Investigation: *"Calculate the following using the area model (do not use the algorithm!)"* with numeric examples `6×58 = 6(50+8)` and `5×13 = 5(10+3)`, immediately followed by *"We can expand binomial products using the area model."* The arithmetic area-model-partitioning technique is deliberately re-used as the on-ramp into the algebraic routine — it isn't incidental dressing, it's the taught method.
- **Bar:** distinctive ✓ (area-model partitioning is a specific technique, not generic multiplication fact recall) · at-risk ✓ (a stage-5 student can easily have forgotten the stage-3 partitioning method) · stage-proximity: **relaxed — constitutive** (source is stage 3, target is stage 5, a 2-stage gap) · non-redundant ✓ (checked `expand-binomial-products` → `expand-brackets` → `multiply-divide-algebraic-terms`/`distribute-negative-multiplier`: no MR-A skill anywhere in that chain)

### Multiplicative relations A `t-s3-mr-a` → REJECT (remaining candidates)
- **Why:** `expand-brackets` only calls on single-digit multiplication facts (e.g. `3×4=12`) — ambient arithmetic every stage-5 student already uses everywhere, not the distinctive multi-digit techniques MR-A actually teaches (area model, formal algorithm, factorise-to-multiply). No MR-A skill is a literal required step.
  `simplify-algebraic-fractions-numerical`'s own booklet Review of Prior Knowledge asks students to "simplify these fractions" and "find the lowest common denominator (LCD)" — the genuine missing machinery is HCF/LCM-based fraction work, which lives in **Fractions, decimals and percentages** (`t-s4-frc`), not in Multiplicative relations A. MR-A (whole-number × and ÷ facts/algorithms) has no LCM/fraction-reduction skill to anchor on, so no valid MR-A edge exists for this skill. (Not proposing an out-of-pack FDP edge here since FDP isn't an expected source topic for this target.)

## TARGET: Area and surface area A `t-s5c-are-a`

### Right-angled triangles (Pythagoras' theorem) `t-s4-pyt` → ACCEPT
- **Edge:** `pythagoras-find-side` → `surface-area-prism`
- **Why constitutive:** `Area and Surface Area A 1` ("Surface Area of a Triangular Prism without a Net") instructs, repeatedly: *"Calculate the missing length using Pythagoras' Theorem, then calculate the surface area"* and *"Use Pythagoras' Theorem $h^2=a^2+b^2$ to find unknown lengths and hence calculate the surface area."* Finding the triangular face's missing dimension via Pythagoras is a literal step of the routine, not context dressing.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 4 → stage 5) · non-redundant ✓ (checked `surface-area-prism` → `nets-of-prisms`/`area-of-triangle` chains: no Pythagoras skill present)

### Volume `t-s4-vol` → ACCEPT
- **Edge:** `cross-sections-prisms` → `nets-of-prisms`
- **Why constitutive:** `Area and Surface Area A 3` generalises surface area with *"The formula for calculating any solid with **uniform cross-section**"* — building a prism's net requires first recognising which two faces are the congruent, uniform cross-section (vs. the lateral rectangles that wrap its perimeter), which is exactly what `cross-sections-prisms` teaches. Anchoring at `nets-of-prisms` (the root of the surface-area chain) lets the edge propagate to `surface-area-prism`/`-cylinder`/`-partial-cylinder`/`-composite-solids` without duplicating it at each step.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 4 → stage 5) · non-redundant ✓ (checked `nets-of-prisms` → `nets-of-3d-objects` → `name-prisms-pyramids`: no cross-section skill present)

### Equations A `t-s5c-equ-a` → ACCEPT
- **Edge:** `solve-linear-3-step` → `surface-area-prism`
- **Why constitutive:** `Area and Surface Area A 1` Mastery tier: *"The surface area of this rectangular prism is 376 cm². Work out the value of x"* → `376 = 2(60+6x+10x)` → `188 = 60+16x` → `x = 8` — a bracketed, both-sides-collected linear equation, i.e. exactly `solve-linear-3-step`'s routine, used as the final step to answer a surface-area question.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 5 = stage 5; Equations A is sequenced before Area and Surface Area A in the Stage 5 Core program, so direction is sound) · non-redundant ✓ (checked `surface-area-prism` → `nets-of-prisms`/`area-of-triangle` chains: no equation-solving skill present)

### Notes on other TARGET skills
`composite-area-problems` was checked against all three source topics — the booklet's only composite-shape content is a Review-of-Prior-Knowledge item (rectangle/triangle/circle areas), with no Pythagoras, volume, or equation-solving step evidenced. No edge proposed for it.

## TARGET: Data analysis B `t-s5c-dat-b`

### Linear relationships B `t-s5c-lin-b` → ACCEPT
- **Edge:** `slope-intercept-interpret` → `outlier-effect-line-best-fit`
- **Why constitutive:** The booklet (`Data Analysis B_Bivariate Data`) inserts a dedicated **Review** block — *"Identify gradient and y-intercept in a linear equation"* — immediately before the outlier/gradient content, then repeatedly asks students to reason about *"what would happen to the gradient of the line of best fit"* when an outlier is removed. You cannot explain a change in gradient without the gradient concept itself.
- **Bar:** distinctive ✓ (gradient-as-rate-of-change interpretation, not generic number sense) · at-risk ✓ · stage-proximity ✓ (stage 5 = stage 5) · non-redundant ✓ (checked `outlier-effect-line-best-fit` → `line-of-best-fit` → `scatter-plot` → `bivariate-data`/`plot-points-cartesian`: no gradient-interpretation skill present)

### Notes on other TARGET skills
`bivariate-data`, `independent-dependent-variables`, `scatter-plot`, `line-of-best-fit`, `describe-association`, `interpolation-extrapolation` don't call on gradient/equation machinery in the booklet — they're graphical/descriptive. No edges proposed for them.

## TARGET: Equations A `t-s5c-equ-a`

### Algebraic techniques A `t-s5c-alg-a` → REJECT
- **Why:** This looked like the textbook constitutive case (`solve-linear-3-step` needs bracket expansion), and the booklet confirms brackets are used (`Equations A 1`, "Equations with Brackets and Unknown on Both Sides"). But checking the *existing* prereq chain first: `solve-linear-3-step` → `solve-linear-2-step`, and `solve-linear-2-step` **already lists `expand-brackets` as a direct prereq** (its own blurb example is `3(x+1)=15`). So `expand-brackets` is already transitively reachable from `solve-linear-3-step` — adding it again would violate the non-redundancy bar. This topic pair is already correctly wired at the stage-4 level; nothing to backfill. Checked `solve-linear-algebraic-fraction`, `model-word-problems-equations`, `verify-solutions-substitution`, `equations-from-formulas` too — no bracket/binomial/algebraic-fraction content found for any of them in the booklets.

## TARGET: Financial mathematics A `t-s5c-fin-a`

### Equations A `t-s5c-equ-a` → ACCEPT
- **Edge:** `equations-from-formulas` → `simple-interest`
- **Why constitutive:** `Financial Mathematics A 2`'s Review of Prior Knowledge opens with *"Solve these equations"* (`16=2x`, `12x=62`, `5×4x=12`) directly before teaching $I=Prn$ — signalling that substituting into and solving a formula for an unspecified variable (P, r or n) is treated as required background, exactly matching `equations-from-formulas`'s routine.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 4 → stage 5) · non-redundant ✓ (checked `simple-interest` → `percentage-of-quantity`/`substitute-into-expressions` chains: no equation-solving skill present)

### Notes on other TARGET skills
Checked `earning-money` and `buying-on-terms` (spending-money) booklets directly for equation-solving content — none found (both are direct-substitution/comparison routines). `taxable-income-tax`, `progressive-income-tax`, `medicare-levy`, `tax-refund-or-owing` are formula-plug-in and arithmetic-only (tax = base + rate × excess, straightforward subtraction) with no reverse-solving step evidenced. No edges proposed for these.

## TARGET: Financial mathematics B `t-s5c-fin-b`

### Linear relationships `t-s4-lin` → ACCEPT
- **Edge:** `graph-linear-relationship` → `compare-simple-compound`
- **Why constitutive:** `Financial Maths B Compound Interest Depreciation` has students fill in *"The graph of simple interest is a ....... line. The graph of compound interest is an ....... curve"* and then, in a worked problem, *"Draw the two graphs on the same axis to show how the value of the investment changes."* Simple interest genuinely is linear in time, and graphing/recognising it as a straight line to contrast against the compound-interest curve is a literal step of the comparison routine.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 4 → stage 5) · non-redundant ✓ (checked `compare-simple-compound` → `simple-interest`/`compound-interest-formula` chains: no linear-graphing skill present)

### Notes on other TARGET skills
`compound-interest-repeated`, `compound-interest-formula`, `compounding-frequency`, `depreciation` compute via formula/repeated multiplication only — they don't graph, so no linear-relationships edge applies to them.

## TARGET: Indices A `t-s5c-ind-a`

### Fractions, decimals and percentages `t-s4-frc` → ACCEPT
- **Edge:** `find-reciprocal` → `negative-integer-indices`
- **Why constitutive:** `Indices A 2_Negative Index` states outright *"Negative index means to take the reciprocal of the base"* and, just before extending the rule further, inserts a **Review** item: *"Identify the reciprocal of a number."* Negative indices are defined via reciprocal ($a^{-n} = 1/a^n$); the routine cannot be established without it.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 4 → stage 5) · non-redundant ✓ (checked `negative-integer-indices` → `apply-index-laws-numerical` → `zero-index` → `index-laws-establish`: no reciprocal skill present)

### Notes on other TARGET skills
`index-laws-variables`, `zero-index-algebraic`, `simplify-index-products-quotients`, `power-of-product-quotient` were checked against `Indices A 1_Index Laws` — no fraction-simplification/HCF/reciprocal content found; they only use variable index manipulation. No edges proposed for these.

## Patch (apply after review)
| skill id | current prereqs | add | resulting prereqs |
|---|---|---|---|
| `expand-binomial-products` | `expand-brackets` | `multiply-area-model-distributive` | `expand-brackets`, `multiply-area-model-distributive` |
| `surface-area-prism` | `nets-of-prisms`, `area-of-triangle` | `pythagoras-find-side`, `solve-linear-3-step` | `nets-of-prisms`, `area-of-triangle`, `pythagoras-find-side`, `solve-linear-3-step` |
| `nets-of-prisms` | `nets-of-3d-objects` | `cross-sections-prisms` | `nets-of-3d-objects`, `cross-sections-prisms` |
| `outlier-effect-line-best-fit` | `line-of-best-fit` | `slope-intercept-interpret` | `line-of-best-fit`, `slope-intercept-interpret` |
| `simple-interest` | `percentage-of-quantity`, `substitute-into-expressions` | `equations-from-formulas` | `percentage-of-quantity`, `substitute-into-expressions`, `equations-from-formulas` |
| `compare-simple-compound` | `simple-interest`, `compound-interest-formula` | `graph-linear-relationship` | `simple-interest`, `compound-interest-formula`, `graph-linear-relationship` |
| `negative-integer-indices` | `apply-index-laws-numerical` | `find-reciprocal` | `apply-index-laws-numerical`, `find-reciprocal` |

## Notes / judgement calls
- **Equations A ← Algebraic techniques A** is the one pair I want a human sanity-check on: it's a REJECT, but for an unusual reason (already correctly wired one stage down, not "ambient" or "grafted"). Worth confirming that's the intended reading of the non-redundancy bar rather than a case where the reviewer would still want the edge stated explicitly at the stage-5 skill for graph-legibility reasons.
- `surface-area-prism` picks up two new prereqs from two different source topics (Pythagoras + Equations A) in the same pass — both independently evidenced, not double-counting the same routine step, so I kept both rather than trying to force it down to one.
- All cycle/redundancy checks were run programmatically (BFS over `data/skills.json`, both directions) rather than by eye, per the brief's script.
