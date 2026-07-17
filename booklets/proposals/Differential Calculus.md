---
status: applied (nil result) — 2026-07-17
---

# Differential Calculus (QUEUE row 73) — NIL result

**Context.** Topic `t-s6adv12-diffcalc`, dot points `dp-s6adv12-diffcalc-1`–`4`.
Booklets: Differentiation with exponential functions, Differentiation with
logarithmic functions, Differentiation with trigonometric functions, Using
derivatives. Goal: atomise into new skills / prereq edges vs `data/skills.json`.

**Finding.** Fully covered already. The graph carries 11 skills across the 4
dot points, each with coherent, stage-monotonic prereqs. Every worked example
and practice item in all four booklets is an instance of an existing skill.
Nothing missing; no re-scopes; no new edges clear the bar. (These skills were
pre-seeded and explicitly deferred to this row by the Exponential and
Logarithmic Functions pass — see that proposal, line 84.)

Coverage map:

| Dot point | Booklet routine | Existing skill(s) |
|---|---|---|
| dp-1 `ke^{ax}`, `e^{f(x)}`, `a^x` | Book 1 | `differentiate-exponential`, `differentiate-exponential-composite`, `differentiate-ax` (← `derivative-of-ex`, `chain-rule`, `natural-logarithm`) |
| dp-2 `ln x`, `log_a x`, `ln f(x)` | Book 2 | `differentiate-ln`, `differentiate-loga`, `differentiate-ln-composite` |
| dp-3 sin/cos/tan/sec/cosec/cot + composites | Book 3 | `differentiate-sin-cos`, `differentiate-tan-reciprocal-trig`, `differentiate-trig-composite` |
| dp-4 product/quotient/chain on any function; tangents & normals | Book 4 | `differentiate-combined-functions`, `tangents-normals-advanced` (← `combine-differentiation-rules`, `tangent-normal-equations`) |

## Borderline candidates → EXCLUDE

- **`a^{f(x)}` / `log_a(f(x))` composite** (Book 1 "Chain Rule for Exponential
  Functions of Any Base"; Book 2 "…Any Base"). Just `chain-rule` applied to
  `differentiate-ax` / `differentiate-loga` — no distinctive at-risk atom beyond
  rules already present. Splitting = pollution.
- **Simplify-with-log-laws-before-differentiating** (Book 2 §Investigation,
  Q4/Q9). The differentiation is unchanged; the pre-step is log-law algebra —
  cross-topic, not a differentiation atom.
- **Repeated / 2nd–4th derivatives of trig** (Book 3 Q3). `second-derivative`
  already exists (`dp-s6adv12-appcalc-1`); higher orders are iteration,
  downstream, cross-dot.

## Considered-and-omitted (ambient / downstream / cross-topic)

- Setting `f'(x)=0` to find stationary / increasing / decreasing (Book 1 Q6,
  Book 2 Q10) → `classify-stationary-*` (appcalc), downstream.
- Verifying `y` satisfies a differential equation `y''−2y'+2y=0` (Book 4 Q3–4)
  → substitution + `second-derivative`; relates to `define-differential-equation`,
  cross-topic.
- HSC exam items (Book 4 §Exam Questions) — all instances of the mapped skills.
- Hyperbolic `cosh`/`sinh` (Book 1 Q8), angle-of-inclination of a tangent
  (Book 2 Q7) — non-routine one-offs.

## Net change: none

0 new skills, 0 new edges, 0 re-scopes. `data/skills.json` untouched.
