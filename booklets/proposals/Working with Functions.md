**Status: APPLIED** (2026-07-17). 3 new skills added to `data/skills.json`
(`graph-square-root-function`, `domain-range-composite-function`,
`express-abs-as-piecewise`). `npm run validate` clean. §1.1
`classify-relations` was **rejected at review** — no longer in the syllabus
(the only surviving form, function-or-not, is already covered by
`relations-and-functions` + `vertical-line-test`). §4
`domain-range-combined-function` left excluded (leanness).

# Working with Functions (Stage 6 Advanced Y11)

**Context.** Group 64, topic `t-s6adv11-functions`, dot points
`dp-s6adv11-functions-1`–`-13` (13 booklets + the Algebraic Techniques Test).
Goal: atomise the Advanced Y11 functions strand against `data/skills.json`.

**Finding (headline).** Topic is already **near-saturated — 59 skills tagged
across all 13 dot points**, and the entire Bk1 algebra suite (factorising
trinomials/HCF/grouping/non-monic, the algebraic-fraction arithmetic suite,
rearranging formulas, simultaneous methods, cross-multiplying, equating
coefficients, exponential equations, factorising index expressions, all surd
operations) maps 1:1 onto **existing Stage 5 skills** carried under other dot
points. Likewise `interval-notation`, `natural-domain-from-equation`,
`parabola-transformations`, `gradient-formula`, `point-satisfies-line`,
quadratic-formula/CTS/discriminant sketching are all already present. After
full-graph dedup, **3 genuinely-missing routine atoms** survive (one proposed
new skill rejected at review; one held borderline and excluded).

---

## 1. New skills

### 1.1 `classify-relations` — dp-4 — REJECTED at review, NOT applied

Proposed: classify a relation as one-to-one / one-to-many / many-to-one /
many-to-many via the vertical and horizontal line tests (Bk2 "Types of
Relations"). **Rejected** — this 4-way classification is no longer in the
syllabus. The only surviving form (deciding whether a relation *is a function*)
is already covered by `relations-and-functions` + `vertical-line-test`. **Do
not re-propose.**

### 1.2 `domain-range-composite-function` — dp-11 — APPLIED

| field | value |
|---|---|
| id | `domain-range-composite-function` |
| title | Find the domain and range of a composite function |
| blurb | Find the domain and range of a composite function $f(g(x))$ by restricting the inner domain so that its outputs lie in the domain of the outer function. |
| stage | 6 |
| courses | `["s6-adv11"]` |
| dotPointIds | `["dp-s6adv11-functions-11"]` |
| difficulty | 3 |
| prereqs | `["composite-functions","domain-and-range"]` |
| atom type | Routine |

```json
{ "id": "domain-range-composite-function", "title": "Find the domain and range of a composite function", "blurb": "Find the domain and range of a composite function $f(g(x))$ by restricting the inner domain so that its outputs lie in the domain of the outer function.", "stage": 6, "courses": ["s6-adv11"], "dotPointIds": ["dp-s6adv11-functions-11"], "prereqs": ["composite-functions","domain-and-range"], "difficulty": 3 }
```

**Trace.** Bk9 "Domain and Range of Composite Functions" Example + Q1–7 (full
section).
**Edge bar.** (1) Distinctive — the inner-domain restriction is the
characteristic step, distinct from forming/evaluating the composite. (2)
At-risk — commonly mishandled. (3) Proximity — same-stage prereqs. (4)
Non-redundant — `composite-functions` and `composite-function-equations` cover
formation/equation only, not domain/range.

### 1.3 `graph-square-root-function` — dp-10 — APPLIED

| field | value |
|---|---|
| id | `graph-square-root-function` |
| title | Graph the square root function |
| blurb | Graph $y=\sqrt{x}$ and its translations $y=\sqrt{x-h}+k$, stating the domain and range. |
| stage | 6 |
| courses | `["s6-adv11"]` |
| dotPointIds | `["dp-s6adv11-functions-10"]` |
| difficulty | 2 |
| prereqs | `["surd-domain-conditions","domain-and-range"]` |
| atom type | Routine |

```json
{ "id": "graph-square-root-function", "title": "Graph the square root function", "blurb": "Graph $y=\\sqrt{x}$ and its translations $y=\\sqrt{x-h}+k$, stating the domain and range.", "stage": 6, "courses": ["s6-adv11"], "dotPointIds": ["dp-s6adv11-functions-10"], "prereqs": ["surd-domain-conditions","domain-and-range"], "difficulty": 2 }
```

**Trace.** Bk8 "Square Root Function" Example a–f (domain, range, translations).
**Edge bar.** (1) Distinctive — `surd-domain-conditions` ($\sqrt{x}$ defined for
$x\ge0$) is the characteristic enabler. (2) At-risk — the half-line
shape/domain trips students. (3) Proximity — one below. (4) Non-redundant —
`graph-power-curves` is $n\ge2$ integer only; `graph-semicircles` is
semicircles. Neither reaches $y=\sqrt{x}$. Attached to dp-10 (its booklet home;
sibling of semicircles).

### 1.4 `express-abs-as-piecewise` — dp-13 — APPLIED

| field | value |
|---|---|
| id | `express-abs-as-piecewise` |
| title | Write an absolute value as a piecewise function |
| blurb | Write $\lvert ax+b\rvert$ (or $\lvert f(x)\rvert$) as a piecewise-defined function by splitting at the zero of the argument. |
| stage | 6 |
| courses | `["s6-adv11"]` |
| dotPointIds | `["dp-s6adv11-functions-13"]` |
| difficulty | 2 |
| prereqs | `["absolute-value-definition"]` |
| atom type | Transformation |

```json
{ "id": "express-abs-as-piecewise", "title": "Write an absolute value as a piecewise function", "blurb": "Write $\\lvert ax+b\\rvert$ (or $\\lvert f(x)\\rvert$) as a piecewise-defined function by splitting at the zero of the argument.", "stage": 6, "courses": ["s6-adv11"], "dotPointIds": ["dp-s6adv11-functions-13"], "prereqs": ["absolute-value-definition"], "difficulty": 2 }
```

**Trace.** Bk11 "Write an absolute value expression as a piecewise" Example +
Q1 a–h, Q2.
**Edge bar.** (1) Distinctive — the split-at-argument-zero algebra is the
characteristic atom, bridging `absolute-value-definition` → `graph-absolute-value`.
(2) At-risk — sign-of-argument errors. (3) Proximity — same stage. (4)
Non-redundant — `graph-absolute-value` graphs the V without ever writing the
piecewise form; `absolute-value-definition` is numeric-value only.

---

## 2. New prereq edges

**None standalone.** All new edges are the new-skill→existing-prereq links
bundled in §1. No missing edges found between existing skills.

## 3. Edits to existing skills

**None.** No de-bundling re-scopes arise; existing blurbs remain accurate.

## 4. Borderline candidates → EXCLUDE

- **`domain-range-combined-function`** (Bk9 "Domain and Range of Combined
  Functions", $f\pm g$, $fg$, $f/g$; Example + Q1–4) — EXCLUDE. A full routine
  section, but the procedure is only "intersect the two domains (drop divisor
  zeros)" — thinner and less distinctive than the composite case (§1.2). Left
  bundled for leanness.
- **Quadratic optimisation via vertex** (Bk6 Q5,7,9,10) — EXCLUDE. Bundled:
  `interpret-quadratic-model` + `parabola-intercepts-axis-vertex` give max/min
  at the vertex. `model-optimisation`/`solve-optimisation` are the Y12
  **calculus** skills — not this pre-calculus reading.
- **Curve–curve intersection** (Bk8: parabola–parabola, parabola–hyperbola) —
  EXCLUDE as a harder instance of `intersection-line-curve` (same
  eliminate-and-solve routine).
- **Complete a graph to make it even/odd** (Bk9 Q2–3) — EXCLUDE. Reverse
  sub-skill of `even-odd-functions`; thin.
- **Write a piecewise equation from a graph** (Bk10 Q8, single question) —
  EXCLUDE. Reverse of `graph-piecewise`; thin.
- **Find an absolute-value equation from a graph** (Bk11 Q2) — EXCLUDE. Reverse
  of `graph-absolute-value`.
- **Find a cubic's equation from its graph** (Bk4 Mastery Q3) — EXCLUDE.
  Mastery-level, non-routine.
- **Verify the triangle inequality by substitution** (Bk11 Q2) — EXCLUDE.
  One-off, non-routine.
- **Point-on-circle / radius via distance-from-origin** (Bk8 Mastery) —
  EXCLUDE. Harder instance of `circle-equation-origin` + `distance-formula`.
- **Linear-inequality modelling** (Bk6 Q3c) — EXCLUDE. Harder instance of
  `linear-real-life` + `solve-linear-inequalities`.

## 5. Considered-and-omitted (already covered / ambient)

- **Entire Bk1 algebra suite** — factorising (negative-HCF, monic,
  common-binomial, grouping, non-monic), the algebraic-fraction arithmetic
  suite, rearranging formulas (4 variants), simultaneous equations
  (graphical/substitution/elimination/worded), cross-multiplying, equating
  coefficients, factorising index expressions, solving exponential equations,
  all surd operations → all existing Stage 5 skills (`factorise-monic-quadratic`,
  `rearrange-literal-equations`, `simultaneous-equations-graphically`,
  `factorise-index-expressions`, `solve-exponential-equations`, `rationalise-*`,
  …).
- **`interval-notation`, `natural-domain-from-equation`, `point-satisfies-line`,
  `gradient-formula`, `identify-intercepts`, `parabola-transformations`,
  `quadratic-formula`, `complete-the-square-solve`, `discriminant-*`,
  `find-equation-parabola-features`, `intersection-line-curve`,
  `interpret-quadratic-model`, `describe-direct/inverse-variation`** — all
  present; agents flagged them only for lacking the full-graph context.
- **`compose-functions`** was rejected at Stage 5 as "a Stage 6 routine" — now
  correctly lives as `composite-functions` (s6-adv11). No action.

---

**Net change:** **3 new skills** (`domain-range-composite-function`,
`graph-square-root-function`, `express-abs-as-piecewise`), **0 standalone new
edges** (all prereqs bundled in the new skills), **0 re-scopes**.
Proposed-and-rejected: `classify-relations`. Proposed-and-excluded:
`domain-range-combined-function`.
