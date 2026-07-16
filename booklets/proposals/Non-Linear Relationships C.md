---
status: applied
---

# Proposal — Non-Linear Relationships C (Path)

**Context.** Booklets: Non-Linear Relationships C_1–C_6 (Stage 5 Path). Target topic `t-s5p-nli-c`, dot points `dp-s5p-nli-c-1`–`dp-s5p-nli-c-6` (MA5-NLI-P-01: graph parabolas/exponentials/hyperbolas/circles/polynomials, distinguish graph types, intersections). Goal: atomise the six-book set as one combined proposal.

**Finding (headline).** Topic is already near-saturated — 10 skills across the 6 dot points. Books 2–6 map 1:1 onto existing skills with nothing missing. Book 1 (parabolas) is the dense one; its multiple sketching methods (factorisation / vertex form / CTS / quadratic formula / discriminant) all resolve to the existing `parabola-intercepts-axis-vertex` → `sketch-parabola-from-equation` chain plus cross-topic Equations-C solving skills (excluded as prereqs by scope rule). The one genuine gap: Book 1's "Finding the Equation of a Parabola from its Graph" routine is already a skill — `find-equation-parabola-features` — but it's stranded at Stage 6 Advanced. It needs to serve Stage 5 Path here. Precedent: row-15 `rationalise-binomial-surd-denominator` re-staged 6→5.

## 1. Recommended new skills

None. Topic is saturated.

## 2. Recommended new prereq edges

None. The natural candidate `find-equation-parabola-features` ← `parabola-transformations` is transitively redundant — `find-equation-parabola-features` → `parabola-intercepts-axis-vertex` → `parabola-transformations` already exists (rule 4).

## 3. Edits to existing skills (re-stage)

`find-equation-parabola-features` — re-stage 6→5 and attach to the Stage 5 Path dot point it's actually first taught on.

| field | before | after |
|---|---|---|
| stage | 6 | 5 |
| courses | `["s6-adv11"]` | `["s5-path", "s6-adv11"]` |
| dotPointIds | `["dp-s6adv11-functions-6"]` | `["dp-s5p-nli-c-1", "dp-s6adv11-functions-6"]` |
| prereqs | `["parabola-intercepts-axis-vertex"]` | unchanged |
| difficulty | 2 | unchanged (borderline; sits downstream of diff-3 `parabola-intercepts-axis-vertex`, but leaving at 2 avoids disturbing the Advanced-view calibration) |

Trace: Book 1 §"Finding the Equation of a Parabola from its Graph", Development Q5 ($y=k(x−α)(x−β)$, sub intercepts + a third point, solve $k$) and Q13 ($y=k(x−b)²+c$, sub vertex + a point). Also Applications Q1g (arrow: fired from 1 m, max 28 m at $t=9$ → $h=−⅓(t−9)²+28$).
Stage monotonicity: sole prereq `parabola-intercepts-axis-vertex` is Stage 5 → 5←5 valid.
Earliest genuine stage: the reverse-equation routine is first taught here (Stage 5 Path), not at Stage 6. Re-stage, don't duplicate.

## 4. Borderline candidates → EXCLUDE

- **sketch-parabola-by-discriminant** — Book 1 §"The Discriminant" checks $Δ=b²−4ac$ before sketching. This is exactly `discriminant-nature-roots` (already exists, `dp-s5p-equ-c-3`) applied inside the sketch routine — same atom, no new skill. Linking it as a prereq to `sketch-parabola-from-equation` fails the no-cross-topic-prereq rule (it's an Equations-C skill).
- **sketch-parabola-by-formula / -by-cts** — quadratic-formula and CTS are alternative x-intercept-finding methods = existing Equations-C skills (`quadratic-formula`, `complete-the-square-solve`). Cross-topic; excluded as prereqs (mirrors the existing lone `parabola-intercepts-axis-vertex` ← `factorise-monic-quadratic` edge, which I leave untouched).
- **sketch-parabola-vertex-form** — sketching directly from $y=k(x−b)²+c$ is already covered by `parabola-transformations` (graphs vertex form) feeding `sketch-parabola-from-equation`. No distinct routine.
- **apply-parabola-model** — Book 1 §"Applying Parabolas" (arrow height, satellite dish, bridge arch) interprets a given quadratic model. Per the standing call (row 23), quadratic modelling has no own node — it folds into the parabola features/sketching skills. `interpret-quadratic-model` exists but is a Standard-course node; not imported.

## 5. Considered-and-omitted

- Book 2 (exponentials) → `exponential-transformations` ($y=k(a)^x+c$, $y=k(a)^{-x}+c$, asymptote/intercepts). Exact match.
- Book 3 (hyperbolas) → `hyperbola-transformations` + `graph-inverse-variation` (reciprocal table). Match.
- Book 4 (circles) → `circle-equation-origin`, `circle-equation-general` (already has `complete-the-square-solve` prereq for the CTS-to-sketch section). Match.
- Book 5 (distinguish/intersect) → `identify-graph-from-equation` + `intersection-line-curve` (line vs parabola/hyperbola/circle). Match.
- Book 6 (polynomials) → `graph-power-curves` covers cubics $y=k(x−b)ⁿ+c$ and power curves, odd/even $n$. Cubic + power-curve sections both fold in; no split (lean).
- Existing `parabola-intercepts-axis-vertex` ← `factorise-monic-quadratic` cross-topic edge left as-is (pre-existing decision, not re-litigated).

## Net change if approved

0 new skills, 0 new edges, 1 re-stage (`find-equation-parabola-features` 6→5, +course, +dot point).
