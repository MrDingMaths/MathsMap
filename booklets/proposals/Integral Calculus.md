---
status: applied (nil result)
---

# Proposal — Integral Calculus (Stage 6 Advanced Y12)

**Context.** Booklets: `Integral Calculus 1_The Fundamental Theorem of Calculus.md`, `2_Integration of Exponential, Logarithmic, and Trigonometric Functions.md`, `3_Further Areas under Curves.md`. Target topic `t-s6adv12-intcalc`, dot points `dp-s6adv12-intcalc-1`–`8` (MAV-12-05). Queue row 74. Carries the open cross-stage candidate `definite-integral-geometric ← distance-from-speed-time-area` from `proposals/Variation and Rates of Change B.md` §6.

**Finding (headline).** The topic is already **exhaustively covered** — 24 skills spanning primitives, the definite integral (limit-of-sums, geometric evaluation, FTC), indefinite notation, reverse chain rule, exp/log/trig integration, and all area work (x-axis, y-axis, symmetry, Trapezoidal rule, applications). Reading all three booklets end-to-end surfaced **no un-atomised routine**. The one genuinely new teaching section (integrating across a discontinuity) resolves to an existing skill plus a single fact, and the two candidate area-sections (between-curves, under exp/log/trig curves) are already covered or belong to Ext1. **The cross-stage edge is not traced by these booklets and is excluded.** Net: no graph change.

## 1. Recommended new skills

None.

## 2. Recommended new prereq edges

None.

## 3. Edits to existing skills

None.

## 4. Borderline candidates → EXCLUDE

- **`definite-integral-geometric ← distance-from-speed-time-area`** (the row-74 open cross-stage candidate) → **EXCLUDE, resolved.** Book 1 §"Area Under a Line and Semicircle" (lines 853–928) — the routine behind `definite-integral-geometric` — evaluates definite integrals from **pure geometric shape formulas** (`∫3dx` rectangle, `∫(x−1)dx` triangle/trapezium, `∫|x|dx`, `∫√(25−x²)dx` semicircle; Foundation Q1–3). No speed-time graph appears in it. A velocity-time graph *does* appear (lines 974–1055), but only as the **FTC motivation**: constant velocity → `displacement = velocity × time` (a bare rectangle, not the S5 skill's "split into rectangles and triangles"), then a Riemann sum for the curved part, generalised to `∫v(t)dt = x(9)−x(0)`. That evidence feeds `fundamental-theorem-calculus`, and it is developed self-contained. Per §6's own test — "if the Stage 6 booklet does not trace the dependency, exclude the edge and record that" — the dependency is not traced. Also fails the **distinctive** bar: the enabler of `definite-integral-geometric` is "∫ = signed geometric area" (already reaching `area-composite-figures`), not a speed-time reading; and `distance-from-speed-time-area` is `s5-path`-only, so it is not a reliably-held prerequisite for the Advanced cohort.
- **`definite-integral-continuity-condition`** ("cannot integrate across a discontinuity") — Book 1 §"Discontinuities and Integration" (lines 1176–1219) with a dedicated "Identify whether you are integrating across a discontinuity" exercise (a–o). **EXCLUDE.** The identification atom is already `continuity-discontinuity` (dp-s6adv11-functions-12); what remains is a single **Fact** (the definite integral requires continuity on `[a,b]`), layered onto applying the FTC — not a new routine. Bundles into `fundamental-theorem-calculus`. Closest call of the pass; recorded so it isn't re-derived.

## 5. Considered-and-omitted

- **Area between two curves** — Book 3 §"Area Between Two Curves". Already exists as `area-between-curves` on Ext1 `dp-s6x1y12-appcalc-3`; not an Advanced `intcalc` dot point. The Advanced booklet teaching it is enrichment — no re-attach to the Advanced topic.
- **Areas under exponential / reciprocal / trigonometric curves** — Book 3 §"Area under Exponential, Reciprocal, and Trigonometric Curves". Composition of `area-under-curve` with the existing `integrate-exponential` / `integrate-reciprocal` / `integrate-trig` family. No new atom.
- **Total change of a quantity from its rate** — Book 3 §Review (velocity `dx/dt=6t−5` → displacement; rate of flow `R=500+20t` → dam volume; `dx/dt=(t−3)²`). This is `primitive-initial-condition` in a contextual wrapper; `definite-integral-limit-sum` already records "∑f(x)Δx as total change." Kinematics-via-calculus proper is row 75 (`velocity-acceleration-calculus`).
- **Dummy-variable property / definite-integral additivity & reversal** (Book 3) — facts used within area work; `area-integral-symmetry`'s blurb already records "properties of definite integrals." No standalone skill.
- **Expand-brackets / split-fractions before integrating** (Book 1 lines 1128–1175) — ambient algebra, omitted by edge policy.
- **Primitives, `(ax+b)ⁿ` primitive, initial conditions, second-derivative recovery** (all of Book 1) → `primitive-definition`, `primitive-power-functions`, `primitive-linear-power`, `primitive-initial-condition`. The `y''` two-constant problems (Q9–16) are `primitive-initial-condition` applied twice — no new atom.
- **Exp/log/trig integration + composite (reverse-chain) forms** (Book 2) → `integrate-exponential`, `integrate-ax`, `integrate-exponential-composite`, `integrate-reciprocal`, `integrate-f-dash-over-f`, `integrate-trig`, `integrate-trig-linear`, `integrate-trig-composite`. Full match.
- **Sign-change area, y-axis area, symmetry, Trapezoidal rule, applications** (Book 3) → `area-under-curve`, `area-with-y-axis`, `area-integral-symmetry`, `trapezoidal-rule-integral`, `area-applications`. Full match.

## Net change if approved

**0 new skills, 0 new edges, 0 re-scopes.** Cross-stage candidate `definite-integral-geometric ← distance-from-speed-time-area` resolved as **excluded** (dependency not traced by the Advanced booklet). Row 74 → `nil`. The row-75 candidate (`velocity-acceleration-calculus ← speed-time-graph-acceleration`) remains open for the next pass.
