# Further Graph Transformations and Modelling — atomisation proposal

**Status: APPLIED** (2 new skills, 2 new edges, 0 re-scopes; `npm run validate` clean).

**Context.** Booklets `Stage 6 Advanced/Further Graph Transformations and Modelling 1_Transformations of trigonometric functions.md` and `…2_Modelling with functions.md` (NEW, no OLD counterpart). Target `t-s6adv12-furthertransform`, dot points `dp-s6adv12-furthertransform-1`…`-5`. Goal: refine the coarse taxonomy seed (one skill per dot point) into genuine atoms + edges.

**Finding (headline).** Topic is already seed-covered — every dot point has a skill:

| dp | seed skill | prereqs |
|---|---|---|
| -1 amplitude/period/domain/range | `transform-trig-functions` | graph-trig-radians, apply-combined-transformations |
| -2 solve equations & graphical | `solve-transformed-trig-equations` | transform-trig-functions, solve-trig-equations-restricted |
| -3 periodic modelling | `model-periodic-phenomena` | transform-trig-functions |
| -4 practical modelling | `model-with-function-transformations` | apply-combined-transformations |
| -5 log scales | `log-scale-applications` | logarithmic-scales, laws-of-logarithms |

Three real routines are drilled hard in the booklets but not captured as atoms/edges: (i) rewriting an unfactored trig rule to standard form before reading phase; (ii) solving/counting trig-equation solutions graphically (no algebraic route); (iii) constructing a sinusoidal model from a described max/min/period. Plus one missing enabler edge for analysing models.

## 1. Recommended new skills

### 1a. `solve-trig-equations-graphically` (dp-2)

| field | value |
|---|---|
| id | `solve-trig-equations-graphically` |
| title | Solve trig equations graphically |
| blurb | Solve or count the solutions of a trigonometric equation by sketching each side, and use symmetry and the period to find every solution in a domain from one known solution. |
| stage | 6 |
| courses | `["s6-adv12"]` |
| dotPointIds | `["dp-s6adv12-furthertransform-2"]` |
| difficulty | 3 |
| prereqs | `["transform-trig-functions"]` |
| atom type | Routine (R) |

```json
{
  "id": "solve-trig-equations-graphically",
  "title": "Solve trig equations graphically",
  "blurb": "Solve or count the solutions of a trigonometric equation by sketching each side, and use symmetry and the period to find every solution in a domain from one known solution.",
  "stage": 6,
  "courses": [
    "s6-adv12"
  ],
  "dotPointIds": [
    "dp-s6adv12-furthertransform-2"
  ],
  "prereqs": [
    "transform-trig-functions"
  ],
  "difficulty": 3
}
```

**Booklet trace.** Book 1 §*Solving Trigonometric Equations Algebraically & Graphically* — method box ("Sketch LHS and RHS, find x-coordinates of intersection… some equations can only be solved graphically") + *Investigation* (2sin3x=1) + Development Q2 (`sin x = x−1`), Q3 (`sin2x = x/2 − 1/4`, count 3 solutions), Q4 (`2cos x = 1−x/2`), Q5 (values of m for one solution), Q6 (find further solutions from x=1.77 by symmetry+period=12); Exam Q10 (`cos x = |(x−π)/4|`, 4 solutions). Book 2 ferris-wheel Ex part c ("peak at 30s, by symmetry above 38m for (30−24.7)×4") and Q10b (`sinθ = 3θ/4` by graph).

**Edge-bar (`solve-trig-equations-graphically ← transform-trig-functions`).**
1. *Distinctive* — sketching the transformed trig curve accurately (amplitude/period/phase) is the characteristic enabler; not ambient.
2. *At-risk* — a student can solve algebraically yet be shaky sketching both sides and reading intersection counts.
3. *Stage-proximity* — same topic/stage.
4. *Non-redundant* — the graphical-count + symmetry/period-completion method is not reachable from the algebraic `solve-transformed-trig-equations`.

### 1b. `find-sinusoidal-model` (dp-3)

| field | value |
|---|---|
| id | `find-sinusoidal-model` |
| title | Find a sinusoidal model from features |
| blurb | Determine $k$, $a$ and $c$ for a model $y=k\cos(at)+c$ (or $\sin$) from a described maximum, minimum and period, using amplitude $=\frac{\max-\min}{2}$ and mean position $=\frac{\max+\min}{2}$. |
| stage | 6 |
| courses | `["s6-adv12"]` |
| dotPointIds | `["dp-s6adv12-furthertransform-3"]` |
| difficulty | 3 |
| prereqs | `["transform-trig-functions"]` |
| atom type | Routine (R) |

```json
{
  "id": "find-sinusoidal-model",
  "title": "Find a sinusoidal model from features",
  "blurb": "Determine $k$, $a$ and $c$ for a model $y=k\\cos(at)+c$ (or $\\sin$) from a described maximum, minimum and period, using amplitude $=\\frac{\\max-\\min}{2}$ and mean position $=\\frac{\\max+\\min}{2}$.",
  "stage": 6,
  "courses": [
    "s6-adv12"
  ],
  "dotPointIds": [
    "dp-s6adv12-furthertransform-3"
  ],
  "prereqs": [
    "transform-trig-functions"
  ],
  "difficulty": 3
}
```

**Booklet trace.** Book 2 Guided Practice 2 (`y=k cos nt + c` from amplitude 0.8, period 12, mean 1 → k,n,c); Q4 (voltage: k,c from −240…240, a from 50 Hz); Q5 (`k sin(at)+c` from max 20/min 6, period 10); Q6 (tide: k=(4.5−0.5)/2, c=(4.5+0.5)/2, a=2π/12); Q8 (penguins: k,a,c from 900/700, half-period 6); Exam Q4a (`c−k cos`, c=(39+3)/2, k=39−c). This "read features → parameters" direction is the reverse of `model-periodic-phenomena` (which analyses a *given* rule).

**Edge-bar (`find-sinusoidal-model ← transform-trig-functions`).**
1. *Distinctive* — knowing how k/a/c drive amplitude/period/mean is the enabler for inverting them; not ambient.
2. *At-risk* — students routinely confuse amplitude vs mean, or use `2π/period` incorrectly for `a`.
3. *Stage-proximity* — same topic/stage.
4. *Non-redundant* — construct-from-features is a separate direction, not reachable through the analyse skill.

## 2. Recommended new prereq edges

- **`transform-trig-functions ← describe-transformations-from-equation`.** To graph an unfactored rule such as `y=sin(2x+π/3)` you must first rewrite to `k sin(a(x−b))+c` (factor out `a`) — exactly the standard-form routine `describe-transformations-from-equation` already encodes.
  - *Trace.* Book 1 §*Combined Transformations* — "Rewrite trigonometric function in the form k sin(a(x−b))+c" section + practice a–f (`3sin(2x+π/4)`, `8cos(πx−2)−3`, …); Exam Q8 (`sin(2x+π/3)=sin(2(x+π/6))`, pick shifted-left graph).
  - *Bar.* Distinctive (factor-out-`a` is the classic phase error) · at-risk (students read the phase straight off `+π/3` without factoring) · stage-proximity (both stage 6) · non-redundant (reverse-form step not reachable via `apply-combined-transformations`, which is forward-only).

- **`model-periodic-phenomena ← solve-transformed-trig-equations`.** Answering "at what times is the height = X / above X" requires solving a transformed trig equation on the domain.
  - *Trace.* Book 2 ferris-wheel Ex c (`−20cos(πt/30)+21=38`), tide Guided Practice d, Q9d/e, Exam Q1b/Q2c/Q5c/Q6c — every "find the times" part solves `k trig(…)+c = value`.
  - *Bar.* Distinctive (solving-in-domain is the enabler for the time-answers) · at-risk (finding *all* times in range, second-quadrant solution) · stage-proximity (both stage 6) · non-redundant (the seed only links `transform-trig-functions`; equation-solving-in-domain is not reachable through it).

## 3. Edits to existing skills

None. The seed blurbs stay correctly scoped: `model-periodic-phenomena` remains the *analyse-a-given-model* routine (paired with new sibling `find-sinusoidal-model`); `solve-transformed-trig-equations` remains the *algebraic-in-domain* routine (paired with new sibling `solve-trig-equations-graphically`). dp-2/-3 each legitimately carry two skills.

## 4. Borderline candidates → EXCLUDE

- **Interpret mean position / amplitude / period / phase from a graph** (Book 1 opening §, "Interpret…" boxes). EXCLUDE — bundled in `transform-trig-functions` ("determine amplitude, period, translations, domain and range"). Carving four vocab micro-skills = pollution.
- **Max/min of a transformed trig function** (Book 2 Review, `3sin5x+1`). EXCLUDE — `max = mean+amplitude`, a one-line consequence of `transform-trig-functions`; not a separate routine.
- **Solve trig equations with compound angles** (Book 1 Review section). EXCLUDE — already `solve-trig-equations-compound-angle` (dp-s6adv11-trigid-5); it's a review prereq, not new here (and `solve-trig-equations-restricted` already feeds `solve-transformed-trig-equations`).
- **`model-periodic-phenomena ← find-sinusoidal-model`** (build-then-analyse questions). EXCLUDE — over-linking; both share ancestor `transform-trig-functions` and stand as parallel dp-3 children. Keep siblings.
- **Q10 chord/arc → `sinθ = 3θ/4` graphical solve** (Book 2). EXCLUDE the circle-geometry graft (cross-topic scope rule); the graphical-solve half is captured by §1a.

## 5. Considered-and-omitted

- **dp-4 `model-with-function-transformations`** — no new non-periodic atom. The booklets' dp-4 material is either periodic (→ dp-3 skills) or the cross-topic Q10; the generic seed skill stands.
- **dp-5 `log-scale-applications`** — **no source content in either booklet.** The Book 2 syllabus lists decibels/seismic/star-magnitude/pH, but the body has zero worked examples or questions on log scales. Booklet-required rule → nothing proposable; the seed skill (already wired to `logarithmic-scales`, `laws-of-logarithms`) is left untouched. **Gap flagged** for a future dedicated log-scale booklet.
- Order-of-transformations / step-by-step sketching — `order-of-transformations` + `apply-combined-transformations` (transform topic).
- Single transforms of sin/cos/tan, radian graphs — `graph-trig-radians`, `transform-trig-functions`.

**Net change:** 2 new skills, 2 new edges, 0 re-scopes.
