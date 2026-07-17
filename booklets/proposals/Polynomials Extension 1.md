---
status: applied
---

# Proposal — Polynomials (Stage 6 Extension 1, Year 11)

**Status: APPLIED** (2026-07-17). 0 new skills, 0 new edges, 4 dot-point/course attachments. `npm run validate` clean (1176 skills).

## Context

Booklets Polynomials 1–3 (Ext1 Y11): Language and graphs of polynomials (Bk1),
Remainder and factor theorems (Bk2), Sums and products of zeroes (Bk3). Target
`t-s6x1y11-polynomials`, dot points `dp-s6x1y11-polynomials-1`–`3`
(MX1-11-05/06/07). Queue row 79. Course id `s6-ext1-11`.

## Finding

Topic arrives **near-saturated**. 14 Ext1-tagged skills + 6 dual-tagged
Stage-5-Path nodes span all 3 dot points. dp-3 (sum/product) is fully covered by
`sum-product-roots-quadratic`/`-cubic`/`-quartic` + `apply-sum-product-roots`
→ nil. dp-1 and dp-2 each have a few routines the booklets teach in full and the
dp-text names explicitly, but which currently exist **only as Stage-5-Path
nodes** — never tagged to the Ext1 topic. These are the same routines the seed
dual-tagged for `divide-polynomials`, `factor-theorem`, `graph-polynomials-factored`
etc.; four were missed. **No new skills, no new edges** — the fix is 4 dot-point/
course attachments completing the existing dual-tag pattern. Mirrors the Stage 5
Polynomials pass (row 25), which built `remainder-quadratic-divisor` /
`find-equation-polynomial-graph` and explicitly deferred the Ext1 side to row 79.

## 1. Recommended new skills

**None.**

## 2. Recommended new prereq edges

**None.** All four attachment skills already carry their correct prereqs, and
every prereq is already Ext1-reachable (see §3).

## 3. Edits to existing skills — dot-point / course attachments

Four Stage-5-Path skills teach a routine Bk1/Bk2 exercise in full and the dp-text
names, but are not tagged to the Ext1 topic. Attach the Ext1 dot point +
`s6-ext1-11` course, as the seed did for the six already-shared nodes. No stage
change (Stage 5 is the earliest genuine stage), no blurb change, no prereq change.

### (a) `add-subtract-multiply-polynomials` → dp-1
- Before: `dotPointIds: ["dp-s5p-pol-1"]`, `courses: ["s5-path"]`
- After: `dotPointIds: ["dp-s5p-pol-1","dp-s6x1y11-polynomials-1"]`, `courses: ["s5-path","s6-ext1-11"]`
- Trace: Bk1 "Operations with Polynomials" — add/subtract worked examples +
  Foundation Q1, Development Q2–6; multiply (area model + distributive) worked
  examples + practice. Prereqs `polynomial-notation-evaluate` (Ext1 ✓),
  `expand-binomial-products` — both fine.

### (b) `polynomial-roots-multiplicity` → dp-1
- After: `dotPointIds: ["dp-s5p-pol-4","dp-s6x1y11-polynomials-1"]`, `courses: ["s5-path","s6-ext1-11"]`
- Trace: Bk1 "Multiplicity of Roots" — sketch with cut/bounce/inflect, worked
  examples + Foundation Q3–5, Development Q6–13, Mastery Q6. Named directly in
  dp-1 ("…determine their multiplicity and graph the polynomial"). The Ext1 topic
  previously had only `zeroes-roots-multiplicity` (interpret) and
  `graph-polynomials-factored` (simple zeroes) — the cut/bounce/inflect graphing
  routine was unrepresented. Prereq `graph-polynomials-factored` (Ext1 ✓).

### (c) `find-equation-polynomial-graph` → dp-1
- After: `dotPointIds: ["dp-s5p-pol-4","dp-s6x1y11-polynomials-1"]`, `courses: ["s5-path","s6-ext1-11"]`
- Trace: Bk1 Mastery Q6 (equation from graph), Q10–11 (read double/triple roots +
  point → k), Q13 crash barrier `f(t)=kt(t−a)²`, Q14 rollercoaster. Prereq
  `polynomial-roots-multiplicity` — Ext1-reachable once (b) attaches.

### (d) `remainder-quadratic-divisor` → dp-2
- After: `dotPointIds: ["dp-s5p-pol-3","dp-s6x1y11-polynomials-2"]`, `courses: ["s5-path","s6-ext1-11"]`
- Trace: Bk2 Factor Theorem — Development Q7–9 (R=ax+b from divisor (x−1)(x+3),
  sub roots, simultaneous), Mastery Q13–18 (HSC 2012/2014 Ext1 Band 4: remainder
  on division by (x+1)(x−3), x²+x, x²−1). Recurs 10+ times. Prereq
  `remainder-theorem` (Ext1 ✓).

## 4. Borderline candidates → EXCLUDE

- **`integer-root-theorem`** (Bk2 "Solving Polynomial Equations") — candidate-
  selection sub-step inside `factor-theorem`. Already excluded, row 25.
- **`divide-by-quadratic-divisor`** (Bk2 Q5, Dev Q4, Mastery Q10–12) — identical
  long-division algorithm to `divide-polynomials`, degree-2 divisor. Same atom.
  Already excluded, row 25.
- **`factorise-by-equating-coefficients`** (Bk2 Dev Q12–13, Q19) — alternative to
  long division for the quotient; sub-method of `factor-theorem`. Already excluded,
  row 25.
- **`find-coefficients-by-comparing`** (Bk1 Q12–13: given degree/monic/constant,
  or expand-and-equate to find pronumerals) — ambient algebra used course-wide,
  not distinctive to polynomials (edge-bar rule 1). Exclude.
- **`form-equation-transformed-roots`** (Bk3 Q15, Q18, Q22: build the equation
  with roots α+2, 1/α, 2α) — application of the sum/product formulas; folds into
  `apply-sum-product-roots`. Exclude.
- **`roots-in-AP-GP`** (Bk3 Q13–15) — application of sum/product with an α±d or
  α/r,α,αr substitution; folds into `apply-sum-product-roots`. Exclude.
- **polynomial-geometry applications** (Bk3 final section: tangent-via-double-root,
  midpoint of intersections, horizontal distance `|α−β|` via
  `(α−β)²=(α+β)²−4αβ`) — cross-topic graft onto coordinate geometry; core routine
  is sum/product of roots → folds into `apply-sum-product-roots`. Excluded per
  scope rule (no cross-topic prereqs).
- **`polynomial-modelling`** (Bk2 Q20–21 box/ladder volume; Bk1 Q13–14 crash
  barrier/rollercoaster) — interprets/derives a model; folds into `factor-theorem`
  / `find-equation-polynomial-graph`. Standing call, row 25.
- **even/odd polynomial reasoning + theorem proofs** (Bk1 Dev Q10–11; Bk2 prove
  remainder/factor theorem Q13; Bk3 Q20, Q29–30) — non-routine proof/reasoning,
  not standard question types. Exclude.

## 5. Considered-and-omitted (already covered)

- Bk1: identify/name/degree/leading/constant/monic → `define-polynomials`;
  evaluate P(c), P(a)±Q(b) → `polynomial-notation-evaluate`; degree of P±Q, P×Q →
  `poly-degree-sum`; end behaviour + sign & odd/even from graph →
  `polynomial-end-behaviour`; leading term/constant from factored form → folds
  into end-behaviour (leading term) + graphing (y-int, ×constants); zeroes vs
  roots + multiplicity meaning → `zeroes-roots-multiplicity`; sketch factored
  (simple zeroes) → `graph-polynomials-factored`.
- Bk2: long division (linear + quadratic divisor), P=D(x)Q(x)+R(x) →
  `divide-polynomials`, `polynomial-division-statement`; remainder theorem incl.
  non-monic P(b/a) and unknown-coefficient cases → `remainder-theorem`; factor
  theorem, integer-root, solve P(x)=0, null-factor → `factor-theorem`.
- Bk3: quad/cubic/quartic sum-product formulas + symmetric functions (α²+β²,
  1/α+1/β, α²+β²+γ²) + all applications → `sum-product-roots-quadratic`/`-cubic`/
  `-quartic`, `apply-sum-product-roots`. dp-3 fully saturated.

## Net change

**0 new skills, 0 new edges, 4 dot-point/course attachments**
(add-subtract-multiply-polynomials, polynomial-roots-multiplicity,
find-equation-polynomial-graph → dp-1; remainder-quadratic-divisor → dp-2).
Effectively a nil-new pass completing the Ext1 dual-tag pattern.

**STOP**
