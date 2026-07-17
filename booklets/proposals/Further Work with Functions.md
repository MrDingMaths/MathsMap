# Further Work with Functions — atomisation proposal

**Status: APPLIED** (2026-07-17). +1 skill, +2 edges, 0 re-scopes. `npm run validate` clean (1176 skills).

## Context

Topic `t-s6x1y11-functions` (Stage 6 Extension 1, Year 11), dot points
`dp-s6x1y11-functions-1`–`4` (MX1-11-01…04). Four booklets: Graphical
relationships (Bk1), Inverse functions (Bk2), Parametric form (Bk3),
Inequalities (Bk4). First Extension 1 group. Course id `s6-ext1-11`.

## Finding

Topic arrives **pre-atomised and fully wired** — 20 skills across all 4 dp,
each with real prereqs (not bare taxonomy seeds). Bk2 (inverse) and Bk3
(parametric) are saturated → nil. Bk4 yields **one** genuine skill. Bk1's two
large uncovered sections (√f(x)/y²=f(x); products of graphs) were confirmed
**off the 2024 MX1 syllabus** and excluded (see §4).

## 1. Recommended new skills

### `solve-inequality-abs-both-sides` — dp-4

```json
{
  "id": "solve-inequality-abs-both-sides",
  "title": "Solve absolute value inequalities with a function on both sides",
  "blurb": "Solve inequalities such as $|f(x)|<|g(x)|$ or $|f(x)|\\ge g(x)$ where the other side is not constant, by sketching both graphs or by case analysis.",
  "stage": 6,
  "courses": ["s6-ext1-11"],
  "dotPointIds": ["dp-s6x1y11-functions-4"],
  "prereqs": ["solve-absolute-value-inequalities", "graph-absolute-value-of-function"],
  "difficulty": 3
}
```

- **Nearest dot point:** dp-4 ("Solve cubic, rational and **absolute value**
  inequalities"). In scope.
- **Trace:** Bk4 Absolute Value Inequalities, "function on both sides" subsection
  (booklet flags it explicitly, L546–547): Q8 `|4x−5|>2x+3`; Q9 `|2x+1|≤|x−4|`;
  Q10 2008 VCE `|2x−1|≤|x−3|`; Q12–15 (incl. `|x|<6−x²`). Abs-in-denominator
  (Q7 `1/|2x−1|<2`) reciprocates back to the constant-RHS skill — not part of this.
- **Edge-bar** (`← solve-absolute-value-inequalities`, `← graph-absolute-value-of-function`):
  **distinctive** — the sketch-both / difference-of-squares / casework method is the
  characteristic enabler, absent from the constant-RHS `solve-absolute-value-inequalities`;
  **at-risk** — genuinely harder, heavily drilled; **stage-proximity** — both prereqs
  same course (dp-4 / dp-1); **non-redundant** — not otherwise reachable.

## 2. Recommended new prereq edges

Both edges are the new skill's own prereqs above. None to existing skills otherwise.

## 3. Edits to existing skills

None. No de-bundling required.

## 4. Borderline candidates → EXCLUDE

- **`graph-square-root-function`** (√f(x) and y²=f(x); Bk1 L442–857) and
  **`domain-range-square-root-function`** — **off the 2024 MX1 syllabus** (user
  confirmed squares/square-root of a function no longer in syllabus). Legacy 2017
  booklet content. Exclude.
- **`graph-product-of-functions`** (y=f(x)g(x); Bk1 Products of Graphs L1652–1844,
  incl. 2006 HSC) plus special cases `graph-square-of-function`, `graph-x-times-f`
  — **off the 2024 MX1 syllabus**. The NESA/NSW-Education 2024 "Further work with
  functions" unit covers only reciprocal, inverse, absolute value, and
  addition/subtraction; the dp-1 text mirrors this ("sums and differences of
  functions"), omitting products. Legacy 2017 content. Exclude.
- **`symmetry-of-combined-functions`** (even/odd of f±g, fg; Bk1 Mastery Q10 L1794)
  — = applying existing `even-odd-functions` (adv11). No new routine. Exclude.
- **`identify-transformation-type`** (reverse "which transform produced this graph";
  Bk1 Q1–2 L1231, HSC Q6–7) — reverse-recognition one-off; matches the standing
  exclusion of reverse/mastery one-offs (row 64). Exclude.
- **4-way relation classification** (one-to-one/many-to-one/one-to-many/many-to-many;
  Bk2 Sec3 Q2–3) — = **`classify-relations`, already rejected by the user** (row 64,
  "no longer in syllabus"). Never re-propose. Exclude.
- **inverse-via-derivative monotonicity** (Bk2 Mastery Q13 L1395) — establish
  one-to-one by differentiating; cross-topic graft, single Q. Exclude.
- **parameter domain-restriction** ("which part of the curve / why 0≤x≤1"; Bk3
  Mastery Q7–8, Q10b) — folds into `graph-parametric`. Exclude.
- **trig/rectangular-hyperbola parametrisation** (sec/tan; `xy=c²`; Bk3 Q6, Q3) —
  hyperbola parametrisations, **out of scope** (dp-3 names lines/quadratics/circles
  only) and unhoused (no Ext2 functions topic). Exclude.
- **arc-length on parametric circle** (Bk3 Q10 2021 VCE) — cross-topic measurement,
  non-routine. Exclude.
- **abs-in-denominator inequality** (`1/|2x−1|<2`; Bk4 Q7/Q11–13) — reciprocate via
  |·|>0 → constant-RHS `solve-absolute-value-inequalities`, or casework instance of
  the new skill. No separate skill. Exclude.

## 5. Considered-and-omitted (ambient / already-covered)

- All of Bk2 inverse (find/graph/verify/restrict-domain/intersection-with-y=x/word
  problems) → existing 8 dp-2 skills; saturated.
- All of Bk3 parametric (eliminate parameter, express, sketch, circle
  trig-parametrisation) → existing 4 dp-3 skills; saturated.
- Bk4 cubic/quartic sign-analysis → `solve-cubic-inequalities`; rational
  squared-denominator → `solve-rational-inequalities`; abs-constant two-case →
  `solve-absolute-value-inequalities`.
- `reciprocal-trig` (cosec/sec/cot) named in dp-1 but **not exercised in Bk1** —
  practice lives elsewhere; `graph-reciprocal-trig` already exists. No action.

## Net change

**+1 skill** (`solve-inequality-abs-both-sides`), **+2 edges**, **0 re-scopes**.

**STOP**
