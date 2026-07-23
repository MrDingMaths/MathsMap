# Cross-topic backfill proposal — F-s5paths-2

## Summary
11 pairs examined · 6 accepted · 5 rejected · 8 skills modified

Target `t-s5p-pol` confirmed correct (Stage 5 Paths Polynomials, not the Ext 1
`t-s6x1y11-polynomials`) — the pack's own skill listing (`define-polynomials`,
`divide-polynomials`, `factor-theorem`, courses `s5-path`) matches the Stage 5
Paths topic throughout, so no flag needed there.

## TARGET: Polynomials `t-s5p-pol`

### Functions and other graphs `t-s5p-fnc` → ACCEPT
- **Edge:** `function-notation` → `polynomial-notation-evaluate`
- **Why constitutive:** `polynomial-notation-evaluate`'s whole content is
  "Apply P(x) notation and evaluate P(c)" — this *is* `f(x)` notation and
  evaluation, renamed to P and restricted to polynomials. A student cannot
  make sense of "$P(x)$ notation" without already having the general
  input/output function-notation convention.
- **Bar:** distinctive ✓ (a specific naming/evaluation convention, not
  generic algebra) · at-risk ✓ (plausible a student hasn't secured `f(x)`
  before meeting `P(x)`, especially since these topics can be sequenced
  either way in delivery) · stage-proximity ✓ (both stage 5; direction is
  general-concept-before-specialisation) · non-redundant ✓ (checked full
  closure of `polynomial-notation-evaluate`: `define-polynomials` →
  `index-notation-terms`; `substitute-into-expressions` →
  `algebraic-notation`, `order-of-operations-integers`. No function-notation
  anywhere in it.)

**Considered and rejected within this pair:** anchoring on
`reflect-function-graphs` / `graph-function-transformations` /
`dilate-function-graphs` → `polynomial-roots-multiplicity` (whose blurb
explicitly lists comparing $y=-P(x)$, $y=P(-x)$, $y=P(x)+c$, $y=kP(x)$ to
$y=P(x)$). Checked `booklets/Stage 5 Path/Polynomials_4 Graph polynomials.md`
— this content appears **only** in the syllabus dot-point line ("Use graphing
applications to compare the graphs of…") and is never worked as a computed
procedure; it's an exploratory Desmos-comparison activity, not an executed
step. Fails the constitutive bar (no procedure execution required), so not
added. Flagged in Notes in case the reviewer has different booklet evidence.

## TARGET: Properties of geometrical figures B `t-s5p-geo-b`

### Ratios and rates `t-s4-rat` → REJECT
- **Why:** Already transitively reachable, so redundant. Checked closures:
  `similar-triangle-tests` → `similar-figures-properties` →
  `simplify-ratios`/`equivalent-ratios`/`ratios-compare-quantities` (all
  `t-s4-rat`), and `area-volume-similar-figures` inherits the same chain via
  `similar-triangle-tests`. For the non-similarity skills
  (`identify-congruent-figures`, `congruence-statements`,
  `congruent-triangle-tests`, the angle-sum-of-polygon family) ratios are not
  used at all. No genuine gap.

### Right-angled triangles (Pythagoras' theorem) `t-s4-pyt` → ACCEPT
- **Edge:** `hypotenuse` → `congruent-triangle-tests`
- **Edge:** `hypotenuse` → `similar-triangle-tests`
- **Why constitutive:** Both congruence and similarity have an RHS test
  ("For a right-angled triangle, **the hypotenuses** and another pair of
  corresponding sides…"). Confirmed in
  `booklets/Stage 5 Path/Properties of Geometrical Figures B_2…md` (RHS test
  table, l.91) and `…B_3…md` (RHS/AAA test table l.101–107, and Q11 "For a
  right-angled triangle, the hypotenuses and another pair of corresponding
  sides in the same ratio"). You cannot apply the RHS test without first
  identifying which side is the hypotenuse.
- **Bar:** distinctive ✓ (specific named term, not ambient) · at-risk ✓
  (stage-4 term, easy to have gone soft by stage 5) · stage-proximity ✓ (1
  stage below, no relaxation needed) · non-redundant ✓ (checked closures of
  both targets — `congruent-triangle-tests` closure is
  `identify-congruent-figures`, `classify-triangles`,
  `describe-transformations` [+ stage-3 shape skills]; `similar-triangle-tests`
  closure is `similar-figures-properties`, `simplify-ratios`,
  `equivalent-ratios`, `ratios-compare-quantities`, `hcf-two-numbers`,
  `find-factors-of-number`. Neither reaches `t-s4-pyt`.)

**Considered and rejected within this pair:** `pythagoras-find-side` as a
second anchor for `similar-triangle-tests`, from B_3 Q11 ("Using Pythagoras'
theorem, show that these two triangles are similar", computing
$AC=\sqrt{7^2+24^2}=25$ before applying RHS). Kept out — it's one worked
example, not the routine itself; `hypotenuse` alone covers the actual RHS
test that every similarity/congruence problem set exercises.

### Area and surface area B `t-s5p-are-b` → REJECT
- **Why:** Read the full `…B_4 Establish and apply properties of similar
  shapes and solids.md` booklet (areas/volumes of similar figures). Every
  single question — Investigation, Examples, Foundation 1–2, Development 3–7,
  Mastery 8–18 — gives the area/volume/surface-area values directly and asks
  only for ratio-table arithmetic ($a:b \Rightarrow a^2:b^2$ or $a^3:b^3$).
  Nowhere is a student asked to *compute* a surface area from
  $A=\pi r^2+\pi rl$ etc. — cones/spheres/pyramids appear purely as labelled
  dressing on numbers that are given. Grafted context, not constitutive.

### Linear relationships C `t-s5p-lin-c` → REJECT
- **Why:** No coordinate-geometry content (gradient, midpoint, distance
  formula) found anywhere in B_1 through B_5 (checked via grep across all
  five booklets). No plausible constitutive link to congruence, similarity or
  polygon angle-sum routines.

### Volume B `t-s5p-vol-b` → REJECT
- **Why:** Same finding as Area and surface area B above — B_4's volume
  section (Foundation 1–2, Development 8–9, Mastery 13–18) always gives the
  volume directly for the ratio-table step; no formula computation from
  $V=\tfrac13 Ah$ etc. is ever required. Grafted context.

## TARGET: Properties of geometrical figures C `t-s5p-geo-c`

### Angle relationships `t-s4-ang` → ACCEPT
- **Edge:** `unknown-angles-parallel` → `prove-congruent-triangles`
- **Edge:** `unknown-angles-parallel` → `prove-similar-triangles`
- **Why constitutive:** Read `…C_1 Construct formal proofs involving
  congruent and similar triangles.md` in full. Essentially every worked
  congruence proof cites "(vertically opposite)" and/or "(alternate angles on
  parallel lines)" as a justification line (e.g. l.247–249, 261–265, 274–277,
  292, 310, 352), and the similarity-proof section repeats the same pattern
  (l.585–591, 625–629, 654–658). Citing these angle facts with reasons is a
  literal step inside the two-column proof — the proof cannot be completed
  without it. `unknown-angles-parallel` ("Find unknown angles involving
  parallel lines and give reasons") is the compound skill that already
  bundles exactly this pair of facts (its own prereqs are
  `parallel-line-angle-properties` and `unknown-angles-point` →
  `angle-pairs-point`), so it is the *simplest sufficient single* anchor
  rather than wiring both `angle-pairs-point` and
  `parallel-line-angle-properties` in separately (which would need 4 edges
  across the two targets instead of 2, and would still be reaching for two
  skills to get what one already bundles).
- **Bar:** distinctive ✓ · at-risk ✓ (giving the *reason*, not just the
  angle, is exactly what beginning provers fumble) · stage-proximity ✓ (1
  stage below) · non-redundant ✓ (checked closures: `prove-congruent-triangles`
  → `congruent-triangle-tests`, `identify-congruent-figures`,
  `classify-triangles`, `describe-transformations`; `prove-similar-triangles`
  → `similar-triangle-tests`, `similar-figures-properties`, ratio skills.
  Neither reaches any `t-s4-ang` skill.)
- **Not added separately:** `prove-properties-triangles-quadrilaterals` and
  `prove-quadrilateral-tests` already have `prove-congruent-triangles` in
  their prereq chain, so they inherit `unknown-angles-parallel`
  transitively — adding it directly to them would be redundant (and
  `…C_2…md` l.114 confirms the same "(alternate angles in AB || DC)" pattern
  is just the congruence step reused inside the quadrilateral proof).

## TARGET: Trigonometry C `t-s5p-trg-c`

### Area and surface area B `t-s5p-are-b` → ACCEPT
- **Edge:** `identify-slant-perpendicular-height` → `interpret-3d-trig-context`
- **Why constitutive:** `booklets/Stage 5/Trigonometry C 1_3D Trigonometry.md`
  has multiple pyramid/cone problems (Q2 "Calculate the slant height of these
  cones", Q7/Q9/Q10 square-pyramid perpendicular-height and diagonal work,
  Q4 Great Pyramid angle-of-inclination) where the first step is recognising
  which segment is the perpendicular height vs the slant height/edge before
  the right triangle for trig can even be set up. That recognition is
  precisely `identify-slant-perpendicular-height`'s content. Anchored on
  `interpret-3d-trig-context` (blurb: "Interpret three-dimensional situations
  and identify the relevant right triangles and angles") rather than
  `trigonometry-3d` directly, since `interpret-3d-trig-context` is already a
  direct prereq of `trigonometry-3d` — this is the minimal/non-redundant
  placement and `trigonometry-3d` inherits it automatically.
- **Bar:** distinctive ✓ (pyramid/cone dimension-identification is not
  covered by `pythagoras-3d`/`space-diagonal-3d`, which are rectangular-prism
  only per their own blurbs) · at-risk ✓ · stage-proximity ✓ (both stage 5) ·
  non-redundant ✓ (`interpret-3d-trig-context` currently has `prereqs: []`,
  so nothing to collide with; checked `identify-slant-perpendicular-height`'s
  own closure doesn't loop back — it bottoms out in Pythagoras/index skills).

### Equations B `t-s5p-equ-b` → REJECT
- **Why:** Checked `…Trigonometry C 2_Non-Right-Angled Trigonometry.md` — the
  cosine rule *does* have a genuine "solve for x from $x^2=k$" step (its own
  Review-of-Prior-Knowledge box before "Cosine Rule for Sides", l.660–671:
  "Solve quadratic equations… $x^2 = 7^2+11^2-2(7)(11)\cos 60°$"), but that
  operation is `solve-quadratic-ax2` ("Solve $ax^2=c$…"), which lives in
  **`t-s4-equ`** (stage 4), not in Equations B (`t-s5p-equ-b`). Equations B's
  actual skills — `solve-quadratic-common-factor`,
  `solve-monic-quadratic-factors` (factorising), `solve-cubic-axcubed`,
  `represent-inequalities-number-line`, `solve-linear-inequalities` — never
  appear anywhere in the sine-rule/cosine-rule/area-rule/3D-trig routines.
  The pack's expected source topic is a mismatch for what the booklet
  actually needs; flagged in Notes in case the reviewer wants the
  `t-s4-equ` edge instead (out of scope for this pack).

## TARGET: Trigonometry D `t-s5p-trg-d`

### Functions and other graphs `t-s5p-fnc` → REJECT
- **Why:** Read `booklets/Stage 5/Trigonometry D Circle Trigonometry.md` in
  full for the graphing section (l.1830–1950) and searched the whole booklet
  for domain/range/asymptote/transformation language. The sine/cosine/tangent
  graphs are built directly from a table of values and the unit circle, not
  by applying general function-transformation machinery
  (`graph-function-transformations`, `reflect-function-graphs`,
  `dilate-function-graphs`) to a parent curve. The one place domain-like
  language appears (l.1922–1924, tan's asymptotes at $\cos\theta=0$) is
  narrative explanation, not an executed `natural-domain-from-equation` or
  `domain-and-range` procedure — students are never asked to algebraically
  derive the domain. No constitutive dependency found.

## TARGET: Variation and rates of change A `t-s5p-var-a`

### Equations A `t-s5c-equ-a` → ACCEPT
- **Edge:** `equations-from-formulas` → `solve-variation-equation`
- **Why constitutive:** `booklets/Stage 5/Variation and Rates of Change
  1_Direct and Inverse Proportion.md` l.836–845 gives the exact method:
  "1. …2. Substitute given information. 3. **Solve the equation** to find the
  constant of variation $k$. 4. Rewrite $y=kx$… 5. Use your equation…" — this
  is literally "solve a linear equation arising from substituting into a
  formula" ($y=kx$ or $y=k/x$), which is `equations-from-formulas`'s exact
  content, and the current prereq chain has **no** equation-solving skill at
  all (mirrors the brief's own `find-radius-from-circumference` defect
  example).
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (both stage 5; note
  `equations-from-formulas`'s own `stage` field is 4 — it's a skill reused
  across `s4`/`s5-core`/`s6-std11` dot points, one of which is
  `dp-s5c-equa-3` in this exact Equations A topic, so citing it under
  "Equations A (stage 5)" per the pack is correct) · non-redundant ✓ (checked
  full closure of `solve-variation-equation`: `describe-inverse-variation` →
  `describe-direct-variation` → `rate-problems` → `simplify-rates` /
  `ratios-vs-rates` / `ratios-compare-quantities`. No equation-solving skill
  anywhere in it.)
- Not added to `describe-direct-variation` / `describe-inverse-variation` /
  `variation-from-table` / `graph-direct-variation` / `graph-inverse-variation`
  / `conversion-graphs` — these are recognition/graphing skills (booklet:
  "Determine if a direct variation relationship exists… write the equation")
  that don't themselves solve an equation; only `solve-variation-equation`
  does.

## TARGET: Volume B `t-s5p-vol-b`

### Equations B `t-s5p-equ-b` → ACCEPT
- **Edge:** `solve-cubic-axcubed` → `volume-sphere`
- **Why constitutive:** `booklets/Stage 5 Path/Volume B_1 Solve problems
  involving volumes.md` Q5 "Find the radius of these spheres with the given
  volumes" (l.453–454) and Q10 (three spheres melted into one, l.542–546)
  both require solving $V=\tfrac43\pi r^3$ for $r$, i.e. $r^3=\tfrac{3V}{4\pi}$
  — exactly `solve-cubic-axcubed`'s form ($ax^3=k$). Current prereq is only
  `volume-of-cylinder`, with no equation-solving step at all.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (both stage 5) ·
  non-redundant ✓ (checked full closure of `volume-sphere`: bottoms out in
  `volume-of-cylinder`/`volume-of-prism`/`area-of-circle`/arithmetic skills —
  no equation-solving of any kind.)
- **Not added** to `volume-pyramid-cone` — searched the same booklet for a
  reverse "find the radius/base given the volume" cone or pyramid question
  (which would need `solve-quadratic-common-factor` on $\tfrac13\pi r^2h=V$)
  and found none; the one reverse cone problem in the booklet (l.817–821,
  ice-cream depth) solves for the **height**, which is one-step linear and
  ambient (not an Equations-B-tier skill). **Not added** to
  `volume-hemisphere` / `volume-composite-pyramid-cone-sphere` — both already
  have `volume-sphere` in their prereq chain, so they inherit
  `solve-cubic-axcubed` transitively once it's added there.

## Patch (apply after review)

| skill id | current prereqs | add | resulting prereqs |
|---|---|---|---|
| `polynomial-notation-evaluate` | `define-polynomials`, `substitute-into-expressions` | `function-notation` | `define-polynomials`, `substitute-into-expressions`, `function-notation` |
| `congruent-triangle-tests` | `identify-congruent-figures`, `classify-triangles` | `hypotenuse` | `identify-congruent-figures`, `classify-triangles`, `hypotenuse` |
| `similar-triangle-tests` | `similar-figures-properties` | `hypotenuse` | `similar-figures-properties`, `hypotenuse` |
| `prove-congruent-triangles` | `congruent-triangle-tests` | `unknown-angles-parallel` | `congruent-triangle-tests`, `unknown-angles-parallel` |
| `prove-similar-triangles` | `similar-triangle-tests` | `unknown-angles-parallel` | `similar-triangle-tests`, `unknown-angles-parallel` |
| `interpret-3d-trig-context` | *(none)* | `identify-slant-perpendicular-height` | `identify-slant-perpendicular-height` |
| `solve-variation-equation` | `describe-inverse-variation` | `equations-from-formulas` | `describe-inverse-variation`, `equations-from-formulas` |
| `volume-sphere` | `volume-of-cylinder` | `solve-cubic-axcubed` | `volume-of-cylinder`, `solve-cubic-axcubed` |

## Notes / judgement calls

- **geo-b's rejection rate is high (3 of 5 expected source topics rejected).**
  The pack expected Ratios/Area-SA-B/Volume-B as sources alongside
  Pythagoras/Right-angled-triangles, but on inspection Ratios is already
  transitively wired in (not a gap) and the Area-SA-B/Volume-B booklet
  (`…B_4…md`) never asks students to compute an actual surface area or volume
  — every ratio-table problem gives the SA/volume value directly. If the
  reviewer has a different edition of the booklet where students *do*
  compute e.g. a cone's surface area before applying the similarity ratio,
  that would flip Area-SA-B to an ACCEPT on `area-volume-similar-figures`.
  Worth a second pair of eyes since 3 rejects from one target is unusual.
- **Trigonometry C's Equations B pair**: the routine's real equation-solving
  need (`solve-quadratic-ax2`, $ax^2=c$) sits in `t-s4-equ`, not in Equations
  B (`t-s5p-equ-b`) as the pack expected. I rejected the Equations B pairing
  as specified, but flagging that an edge from `t-s4-equ` (outside this
  pack's scope) would be the more accurate fix if the reviewer wants the
  cosine-rule gap closed.
- **Trigonometry D's Functions pairing** came back a clean reject — no
  constitutive link found anywhere in the booklet. Worth confirming with the
  reviewer this wasn't intended to land on a *different* Trigonometry topic
  (e.g. a later "graph trig transformations" topic) rather than Trig D.
- **Polynomials' `polynomial-roots-multiplicity`** (comparing $-P(x)$,
  $P(-x)$, $P(x)+c$, $kP(x)$) is exactly the kind of thing that *looks* like
  it should pull in `reflect-function-graphs`/`graph-function-transformations`
  /`dilate-function-graphs`, but the booklet only treats it as an
  exploratory graphing-calculator comparison, never a computed procedure. I
  left it out; happy to add if the reviewer knows of a worked-procedure
  treatment elsewhere (e.g. a different booklet edition).
