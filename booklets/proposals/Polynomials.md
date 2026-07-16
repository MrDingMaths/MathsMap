---
status: applied
---

# Proposal — Polynomials (Stage 5 Path)

**Context.** Booklets Polynomials_1–4 (Stage 5 Path). Target `t-s5p-pol`, dot points `dp-s5p-pol-1`–`dp-s5p-pol-4` (MA5-POL-P-01: define/operate, divide, factor+remainder theorems, graph). Atomise the four-book set as one combined proposal.

**Finding (headline).** Near-saturated — 8 skills already span all 4 dot points (built out alongside the Stage 6 Ext1 Polynomials topic, which shares these dot-point ids). Books 1–2 map 1:1 with nothing missing; `divide-polynomials` blurb already bundles the quotient-remainder form $P(x)=D(x)Q(x)+R(x)$, so no division-statement gap. **Two genuine gaps**, both distinctive recurring routines with worked examples: (a) Book 3's *remainder on division by a quadratic divisor* (assume $R=ax+b$, evaluate at both roots, solve simultaneously) — a classic HSC question type not covered by `remainder-theorem` (the linear-divisor $P(a)$ case); (b) Book 4's *find the equation of a polynomial from its graph* — the structural twin of `find-equation-parabola-features`, using root multiplicities + a point to solve $k$.

## 1. Recommended new skills

### (a) `remainder-quadratic-divisor` — atom type: Routine (R)

| field | value |
|---|---|
| id | `remainder-quadratic-divisor` |
| title | Remainder on division by a quadratic divisor |
| blurb | Find the remainder on division by a quadratic divisor by writing $R(x)=ax+b$ and evaluating $P(x)$ at the divisor's roots. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-pol-3"]` |
| prereqs | `["remainder-theorem"]` |
| difficulty | 3 |

```json
{
  "id": "remainder-quadratic-divisor",
  "title": "Remainder on division by a quadratic divisor",
  "blurb": "Find the remainder on division by a quadratic divisor by writing $R(x)=ax+b$ and evaluating $P(x)$ at the divisor's roots.",
  "stage": 5,
  "courses": ["s5-path"],
  "dotPointIds": ["dp-s5p-pol-3"],
  "prereqs": ["remainder-theorem"],
  "difficulty": 3
}
```

Trace: Book 3 §"Factor Theorem" Development Q7–9 (remainder $R(x)=ax+b$ from divisor $(x-1)(x+2)$, sub roots, solve simultaneously), Mastery Q13–18 (HSC 2012/2014 Ext1 Band 4: remainder on division by $(x+1)(x-3)$, $x^2+x$, $x^2-1$). Recurs 10+ times.
Edge bar (`remainder-quadratic-divisor ← remainder-theorem`): **Distinctive** — evaluating $P$ at the divisor's roots is the characteristic enabler. **At-risk** — a student can do linear-divisor remainders yet stumble setting up $R=ax+b$ and the simultaneous evaluation. **Stage-proximity** — 5←5. **Non-redundant** — no existing path. (Simultaneous-equation solving is cross-topic → not a prereq, per scope rule.)

### (b) `find-equation-polynomial-graph` — atom type: Routine (R)

| field | value |
|---|---|
| id | `find-equation-polynomial-graph` |
| title | Find the equation of a polynomial from its graph |
| blurb | Find the equation of a polynomial from its graph by reading roots and their multiplicities to write $y=k(x-a)(x-b)\dots$, then substituting a point to solve for $k$. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-pol-4"]` |
| prereqs | `["polynomial-roots-multiplicity"]` |
| difficulty | 3 |

```json
{
  "id": "find-equation-polynomial-graph",
  "title": "Find the equation of a polynomial from its graph",
  "blurb": "Find the equation of a polynomial from its graph by reading roots and their multiplicities to write $y=k(x-a)(x-b)\\dots$, then substituting a point to solve for $k$.",
  "stage": 5,
  "courses": ["s5-path"],
  "dotPointIds": ["dp-s5p-pol-4"],
  "prereqs": ["polynomial-roots-multiplicity"],
  "difficulty": 3
}
```

Trace: Book 4 §"Sketching Cubics" Mastery Q3–4 ($y=k(x-α)(x-β)(x-γ)$, intercepts + point → $k$); §"Multiplicity" Development Q10–11, Q13 (crash barrier $f(t)=kt(t-a)^2$), Q14 (rollercoaster) — read double/triple roots from graph, sub a point, solve $k$.
Edge bar (`find-equation-polynomial-graph ← polynomial-roots-multiplicity`): **Distinctive** — reading root multiplicity (cut/bounce/inflect) off the graph to set factor powers is the characteristic enabler; the reverse-direction routine is distinct from the forward `graph-polynomials-factored` (same split as `find-equation-parabola-features` vs `sketch-parabola-from-equation`). **At-risk** — students can sketch forwards yet fail to reverse-engineer multiplicities. **Stage-proximity** — 5←5. **Non-redundant** — `graph-polynomials-factored` is transitively reachable via `polynomial-roots-multiplicity → graph-polynomials-factored`, so only the multiplicity prereq is recorded.

## 2. Recommended new prereq edges

The two edges above (each new skill's sole prereq). No other edges.

## 3. Edits to existing skills

None. No blurb re-scopes needed — `divide-polynomials` already covers the quotient-remainder form.

## 4. Borderline candidates → EXCLUDE

- **integer-root-theorem** (Book 3 §"Solving Polynomial Equations") — "test factors of the constant term" is the candidate-selection sub-step *inside* the `factor-theorem` factorise-and-solve routine. No separate node; folds into `factor-theorem`.
- **factorise-by-equating-coefficients** (Book 3 Dev Q12–13, Q19) — an alternative to long division for finding the quotient after one factor is known; sub-method of `factor-theorem`. Excluded.
- **divide-by-quadratic-divisor** (Book 2 §"Divide by a quadratic factor", Dev Q4, Mastery Q10–12) — identical long-division algorithm to `divide-polynomials`, just a degree-2 divisor. Same atom; folds in. (Distinct from the new `remainder-quadratic-divisor`, which performs *no* division.)
- **polynomial-modelling** (Book 3 Q20–23 box/ladder; Book 4 Q13–14 crash barrier/rollercoaster) — interprets/derives a polynomial model; folds into `factor-theorem` / `find-equation-polynomial-graph`. Per the standing call (parabola modelling, NLR C row 24), polynomial modelling gets no own node.
- **even/odd polynomial reasoning** (Book 1 Dev Q10–11; Book 3 Mastery Q20) — non-routine proof/reasoning, not a standard question type. Excluded.

## 5. Considered-and-omitted

- Book 1 → `define-polynomials`, `polynomial-notation-evaluate`, `add-subtract-multiply-polynomials` (area model + distributive both = multiply; fold). Match.
- Book 2 → `divide-polynomials` (blurb already includes $P(x)=D(x)Q(x)+R(x)$). Match.
- Book 3 → `remainder-theorem` (incl. non-monic $P(b/a)$ and unknown-coefficient cases), `factor-theorem` (incl. integer-root selection + solve $P(x)=0$). Match.
- Book 4 → `graph-polynomials-factored`, `polynomial-roots-multiplicity` (blurb already covers sign of leading term + $y=-P(x)$, $y=P(-x)$, $y=P(x)+c$, $y=kP(x)$ comparisons). Match.
- `polynomial-division-statement` (Stage 6 Ext1, `dp-s6x1y11-polynomials-2`) overlaps `divide-polynomials` but is a Stage 6 node — left untouched; that topic's own pass (row 79) owns it.

**Net change if approved:** 2 new skills, 2 new edges, 0 re-scopes.
