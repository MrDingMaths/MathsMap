# Atomisation proposal — Introduction to Differentiation (NIL RESULT)

**Status: applied (nil) — 2026-07-17.** No changes to `data/skills.json`.

## Context

- **Booklets:** `Stage 6 Advanced/Introduction to Differentiation 1_Estimating Change.md`,
  `3_Calculations with the derivative.md`, `4_Graphical applications of the derivative.md`,
  `5_The derivative as a rate of change.md` (NEW booklets superseding the 5 OLD
  Introduction to Differentiation files — see TRIAGE / QUEUE row 67).
- **Target:** topic `t-s6adv11-diff`, dot points `dp-s6adv11-diff-1`–`dp-s6adv11-diff-9`.
- **Goal:** re-review the NEW rewrite against the existing graph (the OLD files were
  atomised in a prior pass) to check for any routine not already captured.

## Finding

**Near-nil.** All 9 dot points are already densely covered by 25 existing skills, and
every worked example and practice routine in the 4 NEW booklets maps cleanly onto them.
The one piece of content not sitting on a Y11 differentiation skill — **acceleration
(second derivative) in motion** — is already covered by the existing Year 12 skill
`velocity-acceleration-calculus` (`dp-s6adv12-appcalc-7`, "Connect displacement,
velocity and acceleration using calculus"). No genuine Y11 gap; a Y11 acceleration node
would duplicate it.

Existing coverage by dot point:
- dp-1/2 (estimating change): `average-rate-of-change`, `average-speed-distance-time`,
  `instantaneous-rate-tangent`, `estimate-instantaneous-rate-graph`.
- dp-3/4 (the derivative, first principles): `gradient-secant-limit`,
  `infer-derivative-power`, `define-derivative-tangent`, `derivative-first-principles`,
  `derivative-constant-linear`.
- dp-5/6 (calculations, tangents/normals): `power-rule`, `derivative-sum-multiple`,
  `tangent-normal-equations`, `points-given-gradient`, `angle-inclination-gradient`.
- dp-7 (product/quotient/chain): `product-rule`, `quotient-rule`, `chain-rule`,
  `combine-differentiation-rules`.
- dp-8 (graphical applications): `increasing-decreasing-functions`, `stationary-points`,
  `graph-derivative-function`, `analyse-cubic-stationary`.
- dp-9 (rate of change / motion): `interpret-derivative-rate`,
  `displacement-velocity-distinction`, `velocity-from-displacement`.

## Borderline candidates → EXCLUDE

- **`general-power-rule`** (shortcut for `(f(x))^n`; Booklet 3 dedicated section + Sets
  1–6 practice). A special *instance* of `chain-rule` (already a skill), not a sub-step
  of it. The graph deliberately keeps one `chain-rule` node for all composites; splitting
  by outer-function type is pollution. Reachable through `chain-rule`.
- **`acceleration-from-displacement`** (Y11; Booklet 5 motion questions using `ẍ`,
  `dv/dt`, incl. HSC items). Already covered by `velocity-acceleration-calculus`
  (Y12 `dp-s6adv12-appcalc-7`). Acceleration is **not** in Booklet 5's own
  syllabus-content list — it is Year 11 early exposure to Year 12 content. A Y11
  duplicate pollutes.
- **`differentiate-after-index-rewrite`** (rewrite surds/fractions to index form,
  differentiate, convert back; Booklet 3 "Power Rule with Negative and Fractional
  Indices"). `power-rule`'s blurb already spans "all real n, including negative and
  fractional indices" with prereq `fractional-indices`; the rewriting is ambient
  index-law manipulation already owned by Indices C.

## Considered-and-omitted (ambient / already-covered)

- Derivative notation (`dy/dx`, `y'`, Leibniz vs Lagrange) — ambient notation, not an atom.
- Average rate of change of a function over `[a,b]` (Booklet 5) → `average-rate-of-change`.
- Interpret `f(a)` vs `f'(a)` vs solve `f'(x)=m` (Booklet 3 notation-decision drills) —
  ambient reading skill, bundled.
- Rate-of-change application problems (max height via `f'(t)=0`) →
  `interpret-derivative-rate` + `stationary-points`.

## Open item (not this pass)

Booklet 5 teaches acceleration in **Year 11**, but the only acceleration skill
(`velocity-acceleration-calculus`) is anchored at **Year 12** (`appcalc-7`). Treated
here as "already covered, no Y11 duplicate," consistent with the syllabus (acceleration
is a Y12 dot point). Any deliberate re-home to Y11 dp-9, and the related edge
`velocity-acceleration-calculus ← velocity-from-displacement`, belong to **row 75**
(Applications of Calculus), which the QUEUE already flags.

## Net change

**None.** 0 new skills, 0 new edges, 0 re-scopes.
