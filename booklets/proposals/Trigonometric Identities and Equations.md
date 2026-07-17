# Trigonometric Identities and Equations — atomisation proposal

**Status: applied — 1 new skill, 1 new edge, 0 re-scopes.**

## Context
Topic `t-s6adv11-trigid` (Stage 6 Advanced Y11), dot points
`dp-s6adv11-trigid-1`–`-6`. One booklet:
`Stage 6 Advanced/Trigonometric Identities and Equations.md`. Goal: find
routine atoms not yet in the skill graph.

## Finding (headline)
**Near-fully covered.** 12 skills already sit on this topic's six dot points,
correctly wired (reciprocal defs/values, reciprocal/quotient/complementary/
Pythagorean identities, evaluate-from-one-ratio, restricted-domain solving,
quadratic-form solving, simplify, prove). Every major section traces to an
existing skill **except the dedicated "Trigonometric Equations with Compound
Angles" section**, which has no Y11 home. One new skill closes it.

Dedup notes:
- `solve-transformed-trig-equations` exists but is **Y12**
  (`dp-s6adv12-furthertransform-2`) with prereq `transform-trig-functions`
  (graph transformations) — cannot be the Y11 home for pure `u`-substitution
  compound-angle solving.
- `solve-trig-equations-identities` id is **taken** by Ext1
  (`dp-s6x1y11-trig-3`, sum/difference/double-angle) — different content.
- Identity-reduction-to-quadratic already lives in `solve-trig-quadratic-form`
  (booklet demonstrates it at Q13 of the 0–360° section: `4cos²θ+2sinθ=3`).

## 1. Recommended new skill

| field | value |
|---|---|
| id | `solve-trig-equations-compound-angle` |
| title | Solve trig equations with compound angles |
| blurb | Solve trigonometric equations whose argument is a compound angle such as $\sin 2x$ or $\cos(x+60^{\circ})$ by substituting for the compound angle, transforming the domain, solving, then back-substituting. |
| stage | 6 |
| courses | `["s6-adv11"]` |
| dotPointIds | `["dp-s6adv11-trigid-5"]` |
| prereqs | `["solve-trig-equations-restricted"]` |
| difficulty | 3 |

```json
{
  "id": "solve-trig-equations-compound-angle",
  "title": "Solve trig equations with compound angles",
  "blurb": "Solve trigonometric equations whose argument is a compound angle such as $\\sin 2x$ or $\\cos(x+60^{\\circ})$ by substituting for the compound angle, transforming the domain, solving, then back-substituting.",
  "stage": 6,
  "courses": ["s6-adv11"],
  "dotPointIds": ["dp-s6adv11-trigid-5"],
  "prereqs": ["solve-trig-equations-restricted"],
  "difficulty": 3
}
```

**Trace:** section "Trigonometric Equations with Compound Angles" — method box
(let `u` = compound angle → transform domain → solve → back-sub); worked
example `tan 2x=√3`; Foundation Q1 (`sin 2θ=½` scaffolded), Q2 a–l (`sin 2x`,
`cos 3θ`, `tan(x−45°)`, `sin(x+30°)`, `sin(x/2)`), Q3 (`sin(2θ−60°)=1`,
`cos(3θ+45°)=…`).

**Edge bar (`… ← solve-trig-equations-restricted`):** (1) Distinctive — the
domain-transformation + substitution is the characteristic enabler; you solve
the inner equation with the restricted-domain routine. (2) At-risk — students
fluent on `[0,360°)` routinely mis-transform the `u`-domain or drop solutions.
(3) Proximity — same stage/topic. (4) Non-redundant — no existing edge reaches
it; `solve-transformed-trig-equations` (Y12) sits behind `transform-trig-functions`,
a different enabler.

## 2. Recommended new prereq edges
Only the one bundled above:
`solve-trig-equations-compound-angle ← solve-trig-equations-restricted`.

## 3. Edits to existing skills
None. `solve-trig-quadratic-form` blurb ("reduce to quadratic equations on a
restricted domain") already spans the identity-reduction case.

## 4. Borderline candidates → EXCLUDE
- **`solve-trig-equations-any-domain`** (section "Equations in Any Domain",
  `−180°≤x≤180°`, `0°≤x≤720°`) — same routine as `solve-trig-equations-restricted`
  on a wider window (find in `[0,360°)`, then ±360°). Bundled; blurb already
  says "restricted domain."
- **Identity-reduction-to-quadratic** (final section, `sec²x+tanx=1`,
  `2sin²x+cosx−2=0`) — reachable via `solve-trig-quadratic-form` (already
  demonstrated at Q13). Redundant.
- **Linear-combination "divide by cos"** (`a sin x + b cos x=0 → tan x`) — a
  one-line reduction to `tan`, then `solve-trig-equations-restricted`. Minor
  Development method; too thin for its own node.
- **Derive one ratio from another** ("Deriving a Trigonometric Ratio", acute +
  any-quadrant) — covered by `evaluate-trig-given-ratio`.
- **Cross-tag `graph-reciprocal-trig` → trigid** — appears once (Q12, label the
  pre-drawn `cosec/sec/cot` graphs); no graphing dot point in this topic; skill
  stays in its Ext1 home.

## 5. Considered-and-omitted
- Reciprocal calculator evaluation + exact values → `reciprocal-trig-definitions`,
  `exact-reciprocal-ratios`.
- Complementary simplify / solve-for-angle (`tan22°=cot(90−y)`) →
  `complementary-trig-identities`.
- Investigations/derivations (Pythagorean derivation, complementary-proof
  investigation) — not routine question types.
- Parametric elimination via Pythagorean identity (Mastery Q4–6,
  `x=a cosθ, y=a sinθ → x²+y²=a²`) — application of `pythagorean-identities`;
  cross-topic loci.
- Squaring / dividing-by-cos pitfall items (the "Jimmy" questions) — conceptual
  checks, ambient.
- Large simplify/prove practice sets → `simplify-trig-expressions`,
  `prove-trig-identities`; "hence prove-then-solve" HSC items = composites.

## Net change
**+1 skill, +1 edge, 0 re-scopes.**
