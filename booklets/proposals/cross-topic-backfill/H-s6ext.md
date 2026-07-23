# Cross-topic backfill proposal — H-s6ext

## Summary
18 pairs examined · 9 accepted · 9 rejected · 9 skills modified

Polynomials-as-source note: both pairs in this pack that name "Polynomials" as a
source topic (→ Further calculus skills, → Further trigonometry) give the id
explicitly as `t-s5p-pol` (Stage 5 Paths) in the pack data, not the Ext1 Year 11
`t-s6x1y11-polynomials`. No ambiguity to resolve — used `t-s5p-pol` as specified.
Both are rejected anyway (see below), so the choice is moot in this pack.

---

## TARGET: Further applications of calculus `t-s6x1y12-appcalc`

### Volume B `t-s5p-vol-b` → ACCEPT
- **Edge:** `volume-sphere` → `solve-related-rates`
- **Why constitutive:** Practical related-rates problems (draining/inflating spheres,
  cones, tanks) require recalling the volume formula connecting the two changing
  quantities before the chain rule can even be set up. The booklet's own "Review"
  for this section is literally "Recall surface area and volume formulae," and the
  worked example differentiates $V=\tfrac{4}{3}\pi r^{3}$ from memory
  (`Further Applications of Calculus 2_Further rates of change.md`, "Related Rates
  of Change Problems" section). Without the formula, the chain-rule step has
  nothing to differentiate.
- **Bar:** distinctive ✓ (specific recall, not generic arithmetic) · at-risk ✓
  (formula is 1+ stage removed) · stage-proximity ✓ (Volume B is stage 5, one
  below) · non-redundant ✓ (checked `solve-related-rates` → `related-rates-chain`
  → `chain-rule`/`rates-of-change-derivatives`; no geometry formula anywhere in
  that chain)

### Working with functions `t-s6adv11-functions` → ACCEPT
- **Edge:** `solve-quadratic-factorisation` → `area-between-curves`
- **Why constitutive:** Finding the area between two curves requires finding their
  points of intersection to determine the bounds of integration when bounds
  aren't given. The booklet's own worked "Review" example for this exact skill is
  "Find the area enclosed between the curve $y=x^2$ and the line $y=x+2$"
  (`Further Applications of Calculus 3_...md`, "Rotating Area between Two Curves"
  section) — solved by setting $x^2=x+2$ and factorising the resulting quadratic.
  This is a genuine step of the routine, not just background algebra.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (stage 5→6) ·
  non-redundant ✓ (checked `area-between-curves` → `area-under-curve`; purely
  calculus, no algebra-solving step)

---

## TARGET: Further calculus skills `t-s6x1y12-calculus`

### Area and surface area B `t-s5p-are-b` → REJECT
### Volume B `t-s5p-vol-b` → REJECT
### Polynomials `t-s5p-pol` → REJECT
- **Why (all three):** The target skill set here is narrowly the differentiation/
  integration *technique* skills — inverse functions, inverse trig, parametric
  derivatives, integration by substitution, $\sin^2/\cos^2$ integration. Read the
  full booklet (`Further Calculus Skills 1_Further differentiation and
  Integration.md`): zero mentions of volume, surface area, cone, sphere or
  cylinder anywhere in it, and the one polynomial reference is trivial
  ("differentiate $f(x)=x^3+2x$" as warm-up review, needing nothing beyond basic
  differentiation). Substitution examples use given substitutions and only ever
  simple binomial expansions (e.g. $x(1-x^2)^4$), never remainder/factor-theorem
  or root-finding machinery from the Polynomials topic. These three expected
  edges look like a topic-graph artifact — the geometry/polynomial content
  clearly *does* belong with the sibling target "Further applications of
  calculus" (handled above), not this one.

---

## TARGET: Further trigonometry `t-s6x1y11-trig`

### Polynomials `t-s5p-pol` → REJECT
- **Why:** The one plausible link is `solve-homogeneous-trig-equations`
  ("reduce to a polynomial in $\tan x$"). But every worked example and practice
  item in `Further Trigonometry 3_Further trigonometric equations.md` reduces to
  a **quadratic** in $\tan x$ (e.g. $\tan^2x-\tan x=0$), solved by simple
  factorisation — never degree ≥3, so factor/remainder-theorem machinery from
  the Polynomials topic is never actually invoked. Grepped the whole booklet for
  any cubic/quartic term — none found. Ambient generic-quadratic-factorising is
  already covered elsewhere (Working with functions), not by this topic.

---

## TARGET: Further work with functions `t-s6x1y11-functions`

### Linear relationships C `t-s5p-lin-c` → REJECT
- **Why:** Checked all four Further-Work-with-Functions booklets
  (Graphical relationships, Inverse functions, Parametric form, Inequalities) for
  midpoint/distance/gradient-formula/coordinate-geometry/perpendicular content —
  no hits at all. The parametric-line examples that touch "gradient" (e.g. 2023
  HSC Q8, `x=1+3t, y=4t`) read gradient straight off the eliminated Cartesian
  equation $y=\tfrac43x-\tfrac43$ by inspection, not via the gradient/point-
  gradient formulas from Linear relationships C. The reflection-in-$y=x$ skill
  already has its own prereq (`transform-reflections`, axis reflections from a
  different stage-6 topic) covering the relevant transformation background.
  No constitutive step found; the coordinate-geometry needs of this topic
  (circle/parabola equations) are already satisfied via its existing
  "Working with functions" prereqs.

---

## TARGET: Proof by mathematical induction `t-s6x1y12-induction`

### Working with functions `t-s6adv11-functions` → ACCEPT
- **Edge:** `simplify-fractions-by-factorising` → `induction-sums`
- **Why constitutive:** The inductive step of a sum-formula proof requires adding
  the $(k+1)$th term to the assumed formula and simplifying the result into the
  target closed form — this is routinely an algebraic-fraction combination
  requiring factorisation, e.g. combining
  $\frac{1}{k(k+1)}+\frac{1}{(k+1)(k+2)}$ into
  $\frac{k(k+2)+1}{(k+1)(k+2)}$ then factorising the numerator
  (`Proof by Mathematical Induction.md`, sum-of-fractions example), or factoring
  $\frac{5k(k+1)}{2}+5(k+1)$ into $\frac{5(k+1)(k+2)}{2}$. This is exactly the
  routine described by `simplify-fractions-by-factorising`
  ("add/subtract algebraic fractions using factorisation"). Students who cannot
  do this step cannot complete the inductive step regardless of understanding
  induction's logical structure.
- **Bar:** distinctive ✓ (a specific, well-known failure point of induction
  proofs, not generic arithmetic) · at-risk ✓ · stage-proximity ✓ (stage 5→6) ·
  non-redundant ✓ (checked `induction-sums` → `induction-structure` [no
  prereqs] and → `sigma-notation`; neither touches algebraic-fraction work)

---

## TARGET: Introduction to vectors `t-s6x1y12-vectors`
**(no existing path — high-value pair, extra care taken)**

### Applications of calculus `t-s6adv12-appcalc` → ACCEPT
- **Edge:** `velocity-acceleration-calculus` → `velocity-acceleration-vectors`
- **Why constitutive:** `velocity-acceleration-vectors` ("Find velocity and
  acceleration as vector functions by differentiating the position vector") is
  the direct vector-form generalisation of 1D rectilinear motion
  (`velocity-acceleration-calculus`: "velocity/acceleration by differentiating
  displacement"). A student must already understand that velocity is the
  derivative of position and acceleration the derivative of velocity in the
  familiar 1D case before extending the concept to vector components — the
  vector skill's whole content is "do the same thing, componentwise." Its
  current prereqs (`position-vector-function`, `differentiate-combined-functions`)
  supply the *mechanics* of differentiating vector components but neither
  actually teaches that differentiating position gives velocity — that concept
  is Applications of Calculus content.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (relaxed not needed —
  same stage 6, Advanced content taught before/alongside the Ext1 vectors unit,
  correct direction) · non-redundant ✓ (checked both existing prereqs' chains;
  no motion-concept skill anywhere in them)

### Trigonometry and measure of angles `t-s6adv11-trig` → ACCEPT
- **Edge:** `bearings` → `vector-direction-angle`
- **Why constitutive:** `vector-direction-angle`'s own blurb requires expressing a
  vector's direction "as an angle of inclination **or true bearing**." The
  booklet confirms this is examined directly — Guided Practice literally asks
  "Find the direction of the vector. Answer as a **true bearing**..."
  (`Introduction to Vectors 1_...md`). Converting between angle-of-inclination
  and true-bearing notation is exactly `bearings`' routine
  ("Interpret and convert between true and compass bearings") and is not taught
  anywhere else in the vectors strand.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (bearings is stage 5) ·
  non-redundant ✓ (checked `vector-direction-angle` → `vector-component-form`;
  no bearings/navigation content in that chain)

---

## TARGET: The binomial distribution and sampling `t-s6x1y12-binomdist`

### Data analysis `t-s4-dan` → ACCEPT
- **Edge:** `census-vs-sample` → `population-sample-concepts`
- **Why constitutive:** `population-sample-concepts` ("Distinguish a population
  parameter from a sample statistic") cannot be performed without already
  knowing what a population and a sample *are* — that foundational distinction
  is exactly `census-vs-sample` ("Define and distinguish a census and a
  sample"). This is the direct vocabulary base the stage-6 skill refines, not
  ambient statistics knowledge.
- **Bar:** distinctive ✓ · at-risk ✓ (2 stages back, easily forgotten) ·
  stage-proximity: **relaxed — constitutive** (stage 4 → stage 6 is a 2-stage
  gap; justified because the stage-6 skill is a direct terminological refinement
  of the stage-4 one, not merely related content) · non-redundant ✓
  (`population-sample-concepts` currently has no prereqs at all)

### Probability `t-s4-pro` → ACCEPT
- **Edge:** `expected-frequency` → `binomial-expected-frequency`
- **Why constitutive:** `binomial-expected-frequency` ("Find expected frequencies
  for a binomial distribution") is the direct binomial-context application of
  `expected-frequency`'s formula $f=np$ ("expected frequency = trials ×
  probability"). The binomial version reuses the identical formula structure
  with $p$ now the binomial success probability — it is not a new concept, it's
  the same computation applied to a new distribution.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity: **relaxed —
  constitutive** (stage 4 → stage 6; justified as the formula $f=np$ is reused
  verbatim, only the context generalises) · non-redundant ✓ (checked
  `binomial-expected-frequency` → `binomial-probability-formula` →
  `binomial-random-variable` → [`bernoulli-random-variable`,
  `combinations-nCr`]; no expected-frequency concept anywhere in that chain)

### The binomial theorem `t-s6x1y11-binomial` → ACCEPT
- **Edge:** `binomial-theorem-expand` → `binomial-probability-formula`
- **Why constitutive:** This is the standing pedagogical link between the two
  topics: $P(X=r)=\,^{n}C_{r}\,p^{r}(1-p)^{n-r}$ is literally a term of the
  binomial expansion of $(p+(1-p))^n$ with $x\to p,\ y\to(1-p)$, and summing all
  terms gives $\sum P(X=r)=1$ for free from $(p+(1-p))^n=1$. The formula
  structure of `binomial-theorem-expand` (expand $(x+y)^n$ as
  $\sum\,^nC_r x^{n-r}y^r$) is exactly reused, not merely thematically related.
  This was flagged as a no-existing-path high-value pair; the connection holds
  up well under inspection.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (both stage 6, Ext1
  Year 11 binomial theorem taught before Year 12 binomial distribution — correct
  direction) · non-redundant ✓ (checked `binomial-probability-formula` →
  `binomial-random-variable` → [`bernoulli-random-variable`, `combinations-nCr`];
  `combinations-nCr` shares the $^nC_r$ notation but does not derive from or
  reach `binomial-theorem-expand`)

---

## TARGET: The binomial theorem `t-s6x1y11-binomial`

### Algebraic techniques C `t-s5p-alg-c` → REJECT
- **Why:** Grepped `The Binomial Theorem.md` for "special product," "difference
  of two squares," "compound fraction," "algebraic fraction," "factorise" —
  zero hits. The topic's actual algebra prerequisite (expanding a binomial
  product like $(x+y)^2$, the $n=2$ seed case for Pascal's triangle) is already
  supplied by `expand-binomial-products`, which is Algebraic techniques **B**
  (`dp-s5p-alg-b-3`), not C. Algebraic techniques C's distinctive content —
  special-product *identities*, algebraic-fraction simplification by
  factorising, compound fractions — never appears as a step in any binomial
  theorem routine (expansion, specific-term-finding, coefficient-in-product, or
  identity proofs all just need plain expand/collect-like-terms, already
  covered lower down).

---

## TARGET: Further work with vectors `t-s6x2-vectors`
**(no existing path — high-value pairs, extra care taken; Extension 2 has no
authored booklets yet, so this section leans more on syllabus-structure
reasoning than booklet transcription — flagged for reviewer judgement)**

### Circle geometry `t-s5p-cir` → ACCEPT
- **Edge:** `tangent-secant-properties` → `solve-circle-sphere-vector`
- **Why constitutive:** Standard vector-circle problems (e.g. finding the vector
  equation of a tangent line to a circle at a point) require the fact that a
  tangent meets the radius at $90°$ at the point of contact — that fact is what
  gets encoded as a dot-product-equals-zero condition to actually set up the
  vector equation. This is a fact *used as machinery* inside the vector routine
  (like `find-radius-from-circumference` needing `solve-one-step-equation`),
  not merely the same subject matter reappearing — the routine cannot determine
  which line is tangent without it.
- **Bar:** distinctive ✓ · at-risk ✓ (from stage 5) · stage-proximity ✓
  (stage 5 → 6) · non-redundant ✓ (checked `solve-circle-sphere-vector` →
  `vector-equation-sphere` → `vector-equation-circle` →
  [`curve-vector-equation`, `circle-equation-general`, `vector-magnitude`]; no
  tangent/chord property anywhere in that chain)
- **Judgement call:** no Ext2 booklet exists to confirm this is actually
  examined this way — flagged in Notes for reviewer sign-off.

### Properties of geometrical figures C `t-s5p-geo-c` → REJECT
- **Why:** `vector-geometric-proofs` ("prove geometric results in 2D/3D using
  vectors") and `triangle-centres-vectors` cover the same *family* of theorems
  that Properties of Geometrical Figures C proves synthetically (parallelogram
  diagonals, triangle centre concurrency, etc.), but vectors is an **alternative,
  self-contained proof method** for those results, not a technique that is built
  from congruent/similar-triangle proof-writing. Proving e.g. "diagonals of a
  parallelogram bisect each other" via vectors uses position-vector algebra
  directly; it does not invoke `prove-congruent-triangles` as a step. This is
  the same pattern as the brief's own retained exclusion example — a
  trigonometric/polynomial identity used as *the statement* proved by
  induction, not machinery of the induction routine. Here the classical
  synthetic-proof topic supplies *statements* vector proofs re-derive
  independently, not steps the vector routine executes.

---

## TARGET: The nature of proof `t-s6x2-proof`
**(Extension 2, no authored booklets — syllabus-structure reasoning only)**

### Probability and data `t-s6adv11-probdata` → REJECT
- **Why:** The only plausible link is De Morgan's laws in `negate-statements`
  paralleling set-notation ($A\cap B$, $A\cup B$, $A'$) from Probability and
  data. But these are parallel/isomorphic developments (propositional logic vs.
  set algebra), not one built from the other — `negate-statements` proves De
  Morgan's laws for $\land/\lor/\neg$ from first principles of logic, it does
  not need the set-theoretic version already known. No other target skill
  (proof terminology, quantifiers, contradiction, inequalities, induction) has
  any plausible dependency on probability/data content. Grafted-context
  candidate at best (probability statements could serve as example content for
  counterexamples/negation practice), which the amended rule still excludes.

### Further work with functions `t-s6x1y11-functions` → REJECT
- **Why:** The strongest candidate, `induction-identities`, is *explicitly*
  the brief's own retained exclusion example: "trigonometric, logarithmic,
  exponential, polynomial and other identities... using mathematical
  induction" — the identity is the statement being proved, induction is the
  self-contained technique; no Further-Work-with-Functions skill is machinery
  inside the induction routine itself (already covered by its real prereqs
  `induction-sums`/`binomial-theorem-expand`). `prove-inequality-calculus` and
  the absolute-value inequality proofs (`triangle-inequality-real`, etc.)
  likewise derive via squaring/casing (already prereq'd via
  `prove-inequality-squares`/`absolute-value-definition`), not via
  `solve-absolute-value-inequalities`-style equation-solving. No constitutive
  step found for any target skill.

---

## Patch (apply after review)

| skill id | current prereqs | add | resulting prereqs |
|---|---|---|---|
| `solve-related-rates` | `related-rates-chain` | `volume-sphere` | `related-rates-chain`, `volume-sphere` |
| `area-between-curves` | `area-under-curve` | `solve-quadratic-factorisation` | `area-under-curve`, `solve-quadratic-factorisation` |
| `induction-sums` | `induction-structure`, `sigma-notation` | `simplify-fractions-by-factorising` | `induction-structure`, `sigma-notation`, `simplify-fractions-by-factorising` |
| `velocity-acceleration-vectors` | `position-vector-function`, `differentiate-combined-functions` | `velocity-acceleration-calculus` | `position-vector-function`, `differentiate-combined-functions`, `velocity-acceleration-calculus` |
| `vector-direction-angle` | `vector-component-form` | `bearings` | `vector-component-form`, `bearings` |
| `population-sample-concepts` | (none) | `census-vs-sample` | `census-vs-sample` |
| `binomial-expected-frequency` | `binomial-probability-formula` | `expected-frequency` | `binomial-probability-formula`, `expected-frequency` |
| `binomial-probability-formula` | `binomial-random-variable` | `binomial-theorem-expand` | `binomial-random-variable`, `binomial-theorem-expand` |
| `solve-circle-sphere-vector` | `vector-equation-sphere` | `tangent-secant-properties` | `vector-equation-sphere`, `tangent-secant-properties` |

## Notes / judgement calls

1. **`t-s6x2-vectors` and `t-s6x2-proof` (Extension 2) have no authored booklets
   yet** — my reasoning there rests on NSW Ext2 syllabus structure and the
   skills' own blurbs rather than transcribed worked examples. The
   `tangent-secant-properties → solve-circle-sphere-vector` accept in
   particular should get a human sanity-check once that booklet exists.
2. **Target `t-s6x1y12-calculus`'s three expected source pairs (Area/Surface B,
   Volume B, Polynomials) are all rejected.** I suspect the topic-graph
   heuristic that generated this pack's expectations conflated it with the
   sibling target `t-s6x1y12-appcalc` ("Further applications of calculus"),
   which really does need Volume B and Working with functions (both accepted
   above). Worth checking whether the pack-generation script mixed up these
   two adjacent Ext1-Y12 topics.
3. **Two edges rely on the stage-proximity relaxation** (`census-vs-sample` →
   `population-sample-concepts`, `expected-frequency` →
   `binomial-expected-frequency`), both stage 4 → stage 6. Justified as direct
   formula/vocabulary reuse rather than "related content," but both are 2
   stages back rather than the usual 1 — flagging for reviewer comfort.
4. **`Properties of geometrical figures C` → `Further work with vectors`** was
   one of the four flagged no-path pairs and I rejected it, while accepting its
   sibling pair `Circle geometry` → `Further work with vectors`. I differentiated
   these deliberately: circle geometry supplies a *fact used inside* the vector
   calculation (tangent ⊥ radius), while Properties C supplies *alternative
   proof methods for the same theorems* vectors re-derive independently. Worth
   double-checking this distinction feels right rather than like motivated
   reasoning to get one accept out of the pair.
