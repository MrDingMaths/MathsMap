# Atomisation proposal — Linear Relationships C (Path)

**Status: applied — `data/skills.json` updated (+1 edge), `npm run validate` clean.**

## Context

Booklet-atomisation workflow ([[booklet-atomisation-workflow]]), QUEUE row 21.
Six booklets: `Stage 5/Linear Relationships C 1_Coordinate Geometry Formulas.md`,
`Stage 5/Linear Relationships C 2_General and Point Gradient Form.md`,
`Stage 5 Path/Linear Relationships C_3 Use various forms of the equation of a straight line.md`,
`Stage 5/Linear Relationships C 3_Coordinate Geometry Problems.md`,
`Stage 5 Path/Linear Relationships C_5 Identify line and rotational symmetries.md`,
`Stage 5 Path/Linear Relationships C_6 Describe translations, reflections… rotations….md`.
Target topic `t-s5p-lin-c`, dot points `dp-s5p-lin-c-1`–`6` (MA5-LIN-P-01).

## Finding

**Topic saturated — 0 new skills, 1 new edge.** Nine skills already sit on the six
dot points, plus their Stage-4/5 feeders and the whole Stage-5-Core `linb` cluster
(`rearrange-to-gradient-intercept`, `perpendicular-gradient`, `identify-intercepts`,
`graph-using-gradient-intercept`…). Every routine across the six booklets lands on an
existing node. The one real graph defect: `coordinate-geometry-problems` — whose
booklet (C 3) is dominated by *classifying* triangles/quadrilaterals as right-angled /
rectangle / square — had no prereq carrying the perpendicular-gradient (product = −1)
test. Its prereqs (`midpoint-formula`, `distance-formula`, `point-gradient-form`) never
reached it.

| Booklet section | Dot pt | Existing skill |
|---|---|---|
| Midpoint (mean of coords), missing-endpoint, ratio-division | c-1 | `midpoint-formula` |
| Gradient from coordinates; collinearity | c-1 | `gradient-formula` |
| Distance formula (surd/decimal), find unknown coord | c-2 | `distance-formula` |
| Rearrange `y=mx+c ↔ ax+by+c=0`, general form | c-3 | `general-gradient-intercept-form` (+ Core `rearrange-to-gradient-intercept`) |
| Find x-/y-intercepts in any form | c-3 | `identify-intercepts` |
| Special lines `y=c`, `x=k`, `y=mx` | c-3 | `horizontal-vertical-lines` + `graph-using-gradient-intercept` (c=0) |
| Equation from gradient+point / two points | c-3 | `point-gradient-form` |
| Equations of parallel/perpendicular lines | c-3 | `parallel-perpendicular-any-form` / `parallel-perpendicular-equations` |
| Classify triangles/quads via distance+gradient; diagonals | c-4 | `coordinate-geometry-problems` |
| Line & rotational symmetry, order, graphs | c-5 | `symmetry-of-graphs` |
| Translation / reflection-in-axis / rotation ×90° by coords | c-6 | `transformations-coordinates` |

## 1. Recommended new skills

None.

## 2. Recommended new prereq edges (1)

**`coordinate-geometry-problems ← perpendicular-gradient`** — appended to existing
`["midpoint-formula", "distance-formula", "point-gradient-form"]`.

- **Trace:** C 3 *Coordinate Geometry Problems* is built on the gradient-product test —
  right-angled triangles via `m₁×m₂=−1` (Foundation Q1, Dev Q6–8, Q10; l.116–124,
  213–221, 304–316); rectangle/square via adjacent-side perpendicularity and rhombus via
  parallel opposite sides (Quads Q1–Q13; l.446–805); the property table defines
  right-angled as "gradients of two sides are negative reciprocals" (l.50).
  `perpendicular-gradient`'s blurb — "…classify pairs of lines as parallel, perpendicular
  or neither" — is exactly the missing atom.
- **Bar:** Distinctive (the ± reciprocal / product-−1 test is *the* enabler of every
  figure-classification question; not `midpoint`/`distance`/`point-gradient`), at-risk
  (flip *and* negate, then read the product — the classic drilled error), stage-proximity
  (s5-core → s5-path, both Stage 5; Path extends Core), non-redundant (not reachable via
  any current prereq — `point-gradient-form ← gradient-formula` gives gradients, not the
  classification test).

## 3. Edits to existing skills

None. `coordinate-geometry-problems` blurb already covers the routine; only its prereq
set was thin.

## 4. Borderline candidates → EXCLUDE

- **`sketch-line-using-intercepts`** (sketch a line in any form from its two intercepts —
  C 2 & Path C_3 "Sketching using Intercepts", dozens of Qs). Tempting on
  sibling-consistency (`graph-using-gradient-intercept`, `graph-linear-relationship` each
  have nodes). Excluded: the distinctive atom (finding both intercepts) is already
  `identify-intercepts`; the residue (plot two given points, join) is ambient and not
  at-risk — no extra rise/run atom as in gradient-intercept graphing.
- **`perpendicular-bisector`** (equation of the perpendicular bisector of an interval —
  C 2 Q10–11). Composite of `midpoint-formula` + `perpendicular-gradient` +
  `point-gradient-form`; low frequency; lands inside `coordinate-geometry-problems`/dp-4.
- **`translation-vector-notation`** (column vector `(█(x@y))`, image `(x+a, y+b)` — C_6
  "Translation Vectors"). Notation for the translate operation already in
  `transformations-coordinates`; identical competence.
- **`gradient-from-coordinates`** — already rejected in the Linear Relationships A pass
  (progression-split off `gradient-of-interval`); decision stands. `gradient-formula`
  covers it here.

## 5. Considered-and-omitted (audit trail)

| Content | Why omitted |
|---|---|
| Divide interval in ratio 1:2, 2:3 (C 1 Mastery Q8–10) | Non-routine / one-off |
| Collinearity via equal gradients (C 1 Gradient Dev Q4) | Application of `gradient-formula`; ambient |
| Two-point form, intercept form derivations (C 2 Mastery Q9–10) | Non-routine derivations |
| Area of triangle ½bh from coords (C 3) | Cross-topic mensuration; not intrinsic |
| Order of rotational symmetry; complete-the-symmetric-half | Bundled in `symmetry-of-graphs` |
| Mixed/composite transformations, "single equivalent" (C_6) | Non-routine composite; single transforms in `transformations-coordinates` |
| Reflection/rotation coordinate rules `(x,y)→(−y,x)` etc. | Explicitly in `transformations-coordinates` blurb |

## Net change

- **+0 skills.**
- **+1 edge:** `coordinate-geometry-problems ← perpendicular-gradient`.
- **+0 re-scopes.**

**Applied. `npm run validate` clean.**
