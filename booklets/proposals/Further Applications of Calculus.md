# Proposal — Further Applications of Calculus (Stage 6 Ext 1, QUEUE row 88)

**Status: APPLIED** (2026-07-17). 1 new skill added to `data/skills.json`;
`npm run validate` clean (1187 skills, 0 warnings).

**Context.** Booklets: `Further Applications of Calculus 1–4` (Multiplicity of
zeroes; Further rates of change; Areas/volumes of revolution; Differential
equations). Target topic `t-s6x1y12-appcalc`, dot points
`dp-s6x1y12-appcalc-1`–`4`. Goal: audit the seeded graph (20 skills already
present) against booklet routines.

**Finding (headline).** The seed is near-complete and well-structured — all 20
existing skills trace cleanly to booklet routines, and every referenced prereq
resolves (`product-rule`, `chain-rule`, `exponential-rate-proportional`,
`area-under-curve`, `integrate-reciprocal`, `curve-sketching-calculus`, …). One
genuine gap: Book 1's headline routine — *fully factorising a polynomial using
calculus* — is the bulk of that booklet's practice yet was captured by no single
skill. `multiplicity-derivative` only *determines the multiplicity of a known
zero*; it does not span the full method (find a zero → get its multiplicity via
derivatives → recover remaining zeroes via sum/product).

Course caution (user note): Advanced-overlapping content (plain related rates,
`dQ/dt=kQ` growth/decay, area between curves) is already represented — as
Advanced skills in `s6adv12` or in the seed — so it was not re-created. The one
addition is pure Ext1 polynomial content.

---

## 1. New skill (APPLIED)

| field | value |
|---|---|
| id | `factorise-polynomial-using-calculus` |
| title | Factorise a polynomial using calculus |
| blurb | Fully factorise a polynomial by finding a zero, using $P'(x)$ and $P''(x)$ to determine its multiplicity, then using the sum or product of roots to find the remaining zeroes. |
| stage | 6 |
| courses | `s6-ext1-12` |
| dotPointIds | `dp-s6x1y12-appcalc-1` |
| difficulty | 3 |
| prereqs | `multiplicity-derivative`, `apply-sum-product-roots` |
| atom type | Routine (R) |

```json
{
  "id": "factorise-polynomial-using-calculus",
  "title": "Factorise a polynomial using calculus",
  "blurb": "Fully factorise a polynomial by finding a zero, using $P'(x)$ and $P''(x)$ to determine its multiplicity, then using the sum or product of roots to find the remaining zeroes.",
  "stage": 6,
  "courses": ["s6-ext1-12"],
  "dotPointIds": ["dp-s6x1y12-appcalc-1"],
  "prereqs": ["multiplicity-derivative", "apply-sum-product-roots"],
  "difficulty": 3
}
```

**Booklet trace.** Book 1 §"Factorising Polynomials using Calculus" (4-step
method box + worked Example `2x⁴−7x³+6x²+x−2 = (x−1)²(x−2)(2x+1)`); §"Practice"
(factorise a,b); Foundation Q1–7 (show `P(3)=P'(3)=0` → sum/product → factor);
Development Q8–14; Mastery Q15–16. Dominant question type of the booklet.

**Edge bar.**
- `← multiplicity-derivative` — Distinctive: reading multiplicity off `P'`,
  `P''` is the defining step of the calculus method. At-risk: just-taught,
  diff-3. Stage-proximity: same stage/dot-point. Non-redundant: no existing path
  reaches the full routine.
- `← apply-sum-product-roots` — Distinctive: the booklet's selling point is using
  `α+β+γ = −b/a` to recover the last root and "avoid long division"; that
  shortcut *is* the routine. At-risk: an Ext1-Y11 skill, plausibly shaky by Y12.
  Stage-proximity: both st6. Non-redundant: not otherwise reachable.

Stage-monotonic (st6 ≤ st6), acyclic, references resolve.

## 2. New prereq edges into existing skills
None.

## 3. Edits to existing skills (de-bundling)
None. `multiplicity-derivative` stays scoped to "determine the multiplicity of a
zero"; the new skill is the downstream full routine, not a re-scope.

## 4. Borderline candidates → EXCLUDE
- **`invert-related-rate`** (Book 2, inverse example `dr/dt = dr/dV × dV/dt`).
  Minor variant — bundled in `solve-related-rates`. Splitting fails leanness bar.
- **`factor-theorem` as a prereq of the new skill.** Step 1 ("test factors of
  the constant term") is factor theorem — but at Ext1-Y12 it is ambient /
  universally mastered (fails at-risk). Omit.
- **"Loss of constant solutions"** (Book 4) — bundled in
  `separation-of-variables`; booklet notes the HSC has never assessed it.
- **Similar-triangle / Pythagoras / trig related-rates** (Book 2 shadows,
  ladders, `dA/dt` with `sinθ`). Cross-topic grafts — excluded per scope rules.

## 5. Considered-and-omitted (already covered / ambient)
- **dp-2** entirely: `related-rates-chain`, `solve-related-rates`,
  `rate-proportional-difference`, `verify-graph-Q-P-model`,
  `solve-limiting-value-problems`. Plain `dQ/dt=kQ` growth/decay is Advanced and
  already exists (`exponential-rate-proportional`,
  `model-exponential-growth-decay-calculus`, `s6adv12`); Book 2 only reviews it.
- **dp-3** entirely: `area-between-curves` (review — Advanced Integral Calculus),
  `volume-revolution-x`, `-y`, `-between-curves` (washer / outer−inner bundled).
- **dp-4** entirely: `define-differential-equation` (identify/order/verify),
  `slope-fields`, `solve-de-dydx-fx` (+IVP), `solve-de-dydx-gy`,
  `separation-of-variables`, `solve-de-growth-decay`, `logistic-equation`,
  `model-de-practical`. Logistic partial fractions are *given* in questions → not
  an at-risk prereq.
- **dp-1**: reading multiplicity off factored form, "max zeroes = degree",
  sum/product review — ambient / `apply-sum-product-roots`.

---

**Net change:** 1 new skill, 0 new edges into existing skills, 0 re-scopes.
(The new skill introduces 2 prereq edges of its own.)
