---
status: applied
---

# Proposal — Applications of Calculus (Stage 6 Advanced Y12)

**Context.** Booklets: `Applications of Calculus 1_Turning points inflections and curve-sketching.md`, `2_Optimisation.md`, `3_Rates of change.md`. Target topic `t-s6adv12-appcalc`, dot points `dp-s6adv12-appcalc-1`–`7` (MAV-12-06). Queue row 75. Carries the open cross-stage candidate `velocity-acceleration-calculus ← speed-time-graph-acceleration` from `proposals/Variation and Rates of Change B.md` §6.

**Finding (headline).** dp-1–3 (Book 1) and the optimisation *modelling/solving* routine (Book 2) are **already exhaustively covered** by the 15 existing appcalc skills — continuity/differentiability, stationary points, cubic sketching, second derivative, concavity, inflection, second-derivative test, curve sketching, model/solve optimisation. **Book 3 (Rates of change, dp-5–7) is a blank template shell** — no worked examples, so it justifies nothing and does not trace the cross-stage candidate. One genuinely new, separately-taught-and-assessed atom surfaced: **global maximum/minimum of a function on a closed domain** (Book 2 §Global Maxima and Minima), currently only bundled inside `solve-optimisation`'s blurb. Net: **1 new skill, 1 new edge, 1 re-scope.**

## 1. Recommended new skills

### 1.1 `global-maximum-minimum`

| field | value |
|---|---|
| id | `global-maximum-minimum` |
| title | Find global maxima and minima on a domain |
| blurb | Find the global maximum and minimum of a function on a closed domain by comparing its values at stationary points, domain endpoints and any discontinuities. |
| stage | 6 |
| courses | `["s6-adv12"]` |
| dotPointIds | `["dp-s6adv12-appcalc-4"]` |
| difficulty | 2 |
| prereqs | `["stationary-points"]` |
| atom type | Routine (R) |

```json
{ "id": "global-maximum-minimum", "title": "Find global maxima and minima on a domain", "blurb": "Find the global maximum and minimum of a function on a closed domain by comparing its values at stationary points, domain endpoints and any discontinuities.", "stage": 6, "courses": ["s6-adv12"], "dotPointIds": ["dp-s6adv12-appcalc-4"], "prereqs": ["stationary-points"], "difficulty": 2 }
```

Trace: Book 2 §Global Maxima and Minima — "Local and Global Minimum/Maximum" box ("examine and compare the function value $f(x)$ at: turning points, domain boundaries, discontinuities of $f'(x)$"), Example ($f(x)=x³−6x²+9x−4$ on $[0.5,5]$ → global max $(5,16)$ at an **endpoint**, not the stationary point), Practice (two problems, incl. $y=5−∛((x−2)²)$), Foundation Q1 (classify labelled points global/local), Q2 a–j (state global min/max of 10 functions on closed domains — pure, no modelling).
Edge bar: **distinctive** — the characteristic move is that the global extremum on a closed interval can sit at an **endpoint or discontinuity, not a stationary point**; nothing else in the topic turns on this; **at-risk** — highly, forgetting endpoints is the standard optimisation error, which is exactly why Q2's answers so often land on a boundary; **stage-proximity** — same stage; **non-redundant** — not reachable in the graph: `solve-optimisation` only *mentions* endpoint-checking in its blurb (bundled, not an included edge), and Q2 assesses this with no modelling step at all, so it is a legitimate lift-out per the de-bundling rule.
Nearest dot point: `dp-s6adv12-appcalc-4` (Optimisation: "considering domains and endpoints") — the section is the endpoint/domain half of that dot point, taught before the word-problem routine.

## 2. Recommended new prereq edges

- **`solve-optimisation ← global-maximum-minimum`.** Trace: Book 2 §Modelling and Solving Optimisation Problems — every worked optimisation applies the global-extremum comparison (find stationary points in domain, check nature, compare, and endpoint-check where the domain is closed) to the modelled objective function. Bar: **distinctive** — global-extremum-on-domain is the engine of the optimisation answer; **at-risk** — yes (endpoint omission); **stage-proximity** — same stage/dot point; **non-redundant** — new node, not otherwise reachable. (`solve-optimisation` keeps `model-optimisation` and `classify-stationary-first-derivative`; no transitive overlap — both those and `global-maximum-minimum` reach `stationary-points` independently.)

## 3. Edits to existing skills

- **`solve-optimisation`** blurb re-scope (de-bundling: the endpoint/domain sub-step is now lifted into `global-maximum-minimum`).
  - Before: *"Solve optimisation problems using calculus, checking endpoints and the domain, and interpret the solution."*
  - After: *"Solve optimisation problems by modelling the objective function, finding and classifying its stationary points, and interpreting the solution in context."*

## 4. Borderline candidates → EXCLUDE

- **`velocity-acceleration-calculus ← speed-time-graph-acceleration`** (the row-75 open cross-stage candidate) → **EXCLUDE, resolved.** Book 3 (Rates of change / motion in a line) is a **blank template** — headers and empty scaffolding only, no worked examples. The sole particle-motion worked example in the whole topic is Book 2 Foundation Q4, which derives velocity and acceleration by **differentiating a displacement function** ($x(t)=2t³−6t²−30t → v=x', a=v'$) and reads the velocity-time *parabola* qualitatively; **no speed-time graph, and no gradient-of-a-speed-time-graph reading appears anywhere in the three books** (grep confirms zero hits for speed-time / area-under). Per §6's own test — "if the Stage 6 booklet does not trace the dependency, exclude the edge and record that" — the dependency is not traced. Also fails **distinctive**: the enabler of `velocity-acceleration-calculus` is $a=\ddot{x}$ (repeated differentiation), not a pre-calculus graph reading; and `speed-time-graph-acceleration` is `s5-path`-only, not a reliably-held Advanced prerequisite. This mirrors the row-74 resolution of its twin (`definite-integral-geometric ← distance-from-speed-time-area`).
- **`classify-global-vs-local-point`** (Book 2 §Global Maxima Foundation Q1 — label diagram points as global/local max/min/horizontal inflection) → **EXCLUDE.** Graph-reading vocabulary layered on `points-of-inflection` + the new `global-maximum-minimum` concept; not a separate routine. Bundles into `global-maximum-minimum`.
- **`concavity-domain-interval`** (Book 1 §Concavity — "find the domain over which the curve is concave down", solve $f''(x)<0$) → **EXCLUDE.** This is `concavity-second-derivative` ("Use the sign of $f''(x)$ to determine where a curve is concave up or concave down") applied to an interval; same atom, no split.

## 5. Considered-and-omitted

- **Book 1 in full** → existing skills, exact match: §Continuous and Differentiable → `differentiability-continuity`; §Classifying Stationary Points using the Derivative → `classify-stationary-first-derivative` (via `stationary-points`); §Sketching Cubic Curves using Calculus (the content TRIAGE flagged as absorbed from OLD Intro to Differentiation 4) → `curve-sketching-calculus`; §The Second Derivative → `second-derivative`; §Concavity and Points of Inflection → `concavity-second-derivative`, `points-of-inflection`; §Classifying Stationary Points using the Second Derivative → `classify-stationary-second-derivative`; §Curve Sketching using Calculus → `curve-sketching-calculus`, `graph-first-second-derivative`. No new atom.
- **Book 2 §Modelling Mathematical Scenarios** (form the one-variable objective function from geometry/context) → `model-optimisation`. **§Modelling and Solving Optimisation Problems** → `solve-optimisation` (now `← global-maximum-minimum`). Match.
- **Book 2 Foundation Q4** (particle motion via differentiation) → `velocity-acceleration-calculus` (dp-7). Existing; the booklet's one motion item, developed purely by differentiation.
- **Book 3 (dp-5, dp-6, dp-7)** — blank template; rates-of-change and growth/decay skills (`rates-of-change-derivatives`, `rates-of-change-integration`, `exponential-rate-proportional`, `model-exponential-growth-decay-calculus`, `velocity-acceleration-calculus`) already exist from prior passes and have no worked-example content here to extend or contradict.
- **Exam Questions sections** (both books) — mixed application of the above; no isolated new routine.
- **Product/quotient/chain rule for second derivatives** (Book 1 §Second Derivative Q4–5) — ambient differentiation technique, omitted by edge policy.

## Net change if approved

**1 new skill (`global-maximum-minimum`), 1 new edge (`solve-optimisation ← global-maximum-minimum`), 1 re-scope (`solve-optimisation` blurb).** New chain: `stationary-points → global-maximum-minimum → solve-optimisation`. Cross-stage candidate `velocity-acceleration-calculus ← speed-time-graph-acceleration` resolved as **excluded** (blank Book 3; dependency untraced) — closes the last of the two row-29 open cross-stage notes.
