# Atomisation proposal — Linear Relationships B (Core)

**Status: applied — `data/skills.json` updated, `npm run validate` clean.**

## Context

Booklet-atomisation workflow ([[booklet-atomisation-workflow]]), QUEUE row 20.
Booklet: `Stage 5/Linear Relationships B Gradient-Intercept Form.md` (single NEW
booklet; supersedes both OLD Linear Relationships B files). Target: topic
`t-s5c-lin-b`, dot points `dp-s5c-linb-1` (examine gradient/slope-intercept form)
+ `dp-s5c-linb-2` (parallel & perpendicular lines). MA5-LIN-C-02.

## Finding

Cluster already well developed (6 skills). Booklet is 10 sections; most land on
existing nodes. Three genuine gaps: rearranging implicit form → `y=mx+c`, the
perpendicular-gradient (negative reciprocal) concept, and real-life linear
modelling. Two become new skills; modelling folds into `linear-real-life` via a
dot-point extension.

| Booklet section | Dot pt | Existing skill / gap |
|---|---|---|
| Gradient-Intercept Form (read m, c) | linb-1 | `slope-intercept-interpret` |
| Determine equation from gradient + intercept | linb-1 | `equation-from-gradient-intercept` |
| **Rearranging to Gradient-Intercept Form** | linb-1 | GAP → new skill A |
| Sketching lines without a table | linb-1 | `graph-using-gradient-intercept` |
| Finding the Equation from the Graph | linb-1 | `equation-from-graph` |
| Special Lines (`y=c`, `x=k`, `y=mx`) | linb-1 | `horizontal-vertical-lines` + `graph-using-gradient-intercept` (c=0) |
| **Interpreting / Constructing Linear Models** | linb-1 | GAP → extend `linear-real-life` |
| Parallel & Perpendicular **Gradients** (neg reciprocal, classify) | linb-2 | GAP → new skill B |
| Finding Parallel/Perpendicular **Lines** (equations) | linb-2 | `parallel-perpendicular-equations` |

## 1. New skills (2)

### A. `rearrange-to-gradient-intercept` — diff 2
- **Blurb:** Rearrange a linear equation such as `3x + 2y = -4` into `y = mx + c`
  and read off the gradient and `y`-intercept.
- **stage 5 · courses `["s5-core"]` · dotPointIds `["dp-s5c-linb-1"]` ·
  prereqs `["slope-intercept-interpret"]` · atom type Routine.**
- **Trace:** §"Rearranging to Gradient-Intercept Form" — worked example
  `3y+15−2x=0 → y=2x/3−5` (l.378–388), Guided/Foundation/Development Q1–5 incl.
  `y=(2x+1)/3`, `3x−2y=−4` (l.395–502), Mastery HSC `2x+3y+4=0` (l.508),
  student-error catalogue Q8 (l.525–538); reused in sketching Q9 "Rearrange to
  `y=mx+c`" (l.807).
- **Bar:** Distinctive (making `y` the subject / dividing through / splitting a
  fraction — absent from interpret/write/graph, which assume the form is given),
  at-risk (Q8 enumerates the failures: dividing one term only, sign of `m`, not
  splitting the fraction), st5 same-dp, non-redundant.

### B. `perpendicular-gradient` — diff 2
- **Blurb:** Find the perpendicular gradient as the negative reciprocal
  `m₂ = -1/m₁`, and classify pairs of lines as parallel, perpendicular or neither.
- **stage 5 · courses `["s5-core"]` · dotPointIds `["dp-s5c-linb-2"]` ·
  prereqs `["slope-intercept-interpret"]` · atom type Transformation / Category.**
- **Trace:** §"Parallel and Perpendicular Gradients" — neg-reciprocal rule box
  (l.2285–2294), find-perpendicular-gradient Q2 (l.2341–2348), 20-row classify
  table Q3 (l.2353–2377), "show perpendicular" proofs Q5/Q8 (l.2398–2440).
- **Bar:** Lift-out from `parallel-perpendicular-equations` (blurb only *mentions*
  "gradient product −1" — mention ≠ reachable). Distinctive (negative reciprocal
  is the characteristic perpendicular atom), at-risk (flip *and* negate; 20-item
  drill), sibling-consistency (the parallel concept already has its own node
  `parallel-lines-equal-gradient`, lina-4 — perpendicular should exist
  symmetrically), non-redundant.

## 2. New prereq edge (1)
- **`parallel-perpendicular-equations` ← `perpendicular-gradient`** (appended to
  existing `["equation-from-gradient-intercept", "parallel-lines-equal-gradient"]`).
  Finding a perpendicular line's equation requires first computing the
  perpendicular gradient — §"Finding Parallel and Perpendicular Lines" (l.2443+).
  Distinctive, at-risk, st5→st5, non-redundant.

## 3. Edits to existing skills (1)
- **`linear-real-life`** — added `dp-s5c-linb-1` to `dotPointIds`. The linb
  "Interpreting/Constructing Linear Models" sections (muffin shop, factory,
  currency; l.1433–2277: `C=1.5n+100`, interpret gradient=rate, `c`=fixed value)
  are "describe and solve real-life problems modelled by linear relationships" —
  same competence formalised with `y=mx+c`. No blurb change. Dedupes against a new
  modelling node.

## 4. Borderline candidates → EXCLUDE
- **`construct-linear-model` / `interpret-linear-context` (new skills)** — real
  content, but maps onto `linear-real-life` (extended in §3); the name
  `interpret-linear-model` is already taken (Stage 6 Standard —
  interpolation/extrapolation/limitations, a later skill). Extend, don't duplicate.
- **`line-through-origin` (`y=mx`)** — just the `c=0` case of
  `graph-using-gradient-intercept`; horizontal/vertical are `horizontal-vertical-lines`.

## 5. Considered-and-omitted (audit trail)

| Content | Why omitted |
|---|---|
| Gradient/`y`-int from an equation already in form | `slope-intercept-interpret` |
| Effect of increasing/decreasing gradient (steeper) | `slope-intercept-interpret` / ambient |
| `equation-from-gradient-intercept` as prereq of `parallel-perpendicular-equations` | Ambient writing step by linb-2; already a listed prereq |
| Using a model: substitute a value & solve for `x` (l.1999–2005) | Cross-topic (solve-linear) + `linear-real-life`; not intrinsic to constructing |
| Rearrange as a forced prereq of sketching/perpendicular | Situational (only for implicit form), not intrinsic — kept standalone |

## Net change
- **+2 skills:** `rearrange-to-gradient-intercept` (linb-1),
  `perpendicular-gradient` (linb-2).
- **+1 edge** to existing: `parallel-perpendicular-equations ← perpendicular-gradient`.
- **+1 re-scope:** `linear-real-life` gains `dp-s5c-linb-1`.
- New skills' internal edges: both ← `slope-intercept-interpret`.

**Applied. `npm run validate` clean.**
