---
status: applied (nil result)
---

# Proposal — Further Calculus Skills (Stage 6 Extension 1, Y12)

**Context.** Booklet: `Stage 6 Extension 1/Further Calculus Skills 1_Further differentiation and Integration.md` (Book 1 only — the sole booklet in queue row 87). Target topic `t-s6x1y12-calculus`, dot points `dp-s6x1y12-calculus-1` (MX1-12-10, further derivatives) and `dp-s6x1y12-calculus-2` (MX1-12-11, integration techniques). Goal: atomise Book 1's routines against the graph.

**Finding (headline).** Topic already **fully scaffolded** — 10 skills spanning both dot points. Book 1 has six teaching sections; every one maps cleanly onto an existing skill, most as a base→applications pair. Reading all worked examples + Foundation/Development/Mastery practice surfaced **no un-atomised routine that clears the leanness bar**. Net: no graph change. Same outcome as the Integral Calculus pass (row 74).

Section → skill map:

| Book 1 section | Existing skill(s) |
|---|---|
| Derivative of inverse functions (find f⁻¹ then differentiate; gradient via 1/f'(f⁻¹(x))) | `derivative-of-inverse-function`, `solve-inverse-derivative-problems` |
| Derivative of inverse trig (base results; chain-rule box; product/quotient combos; max-min & related-rate applications) | `differentiate-inverse-trig`, `differentiate-inverse-trig-applications` |
| Integrating to inverse trig forms (standard + reverse-chain adjustment; find-the-curve) | `integrate-inverse-trig-forms` |
| Integration by substitution (u = g(x), indefinite + definite/change-limits) | `integration-by-substitution` |
| Further substitution (x = f(u), trig substitution, complete-the-square) | `integration-by-substitution` |
| Integrating sin²x / cos²x (double-angle reduction) | `integrate-sin2-cos2` |

All existing prereq edges resolve and are stage-monotonic (`find-inverse-function`, `chain-rule`, `define-inverse-trig`, `integrate-power-rule`, `reverse-chain-rule-power`, `double-angle-identities`, `integrate-trig-linear`).

## 1. Recommended new skills

None.

## 2. Recommended new prereq edges

None.

## 3. Edits to existing skills

None.

## 4. Borderline candidates → EXCLUDE

- **`differentiate-inverse-trig-chain`** (d/dx[sin⁻¹f(x)] = f'(x)/√(1−[f(x)]²), etc.) — its own "Chain Rule for Inverse Trig Functions" box + Foundation Q1(a–q), Q10. **EXCLUDE.** Fails **non-redundant**: `differentiate-inverse-trig-applications` already sits downstream of `differentiate-inverse-trig` with `combine-differentiation-rules` (which carries the chain rule) as prereq, and its blurb ("combinations involving inverse trig functions") covers the composite case. Splitting a middle node here adds grain the graph is averse to; the composite result is the same routine as the product/quotient combos already bundled.
- **`integrate-substitution-x-subject`** (variable of integration is the subject: x = f(u), incl. trig substitution x = a sinθ / a tanθ, and complete-the-square-then-sub) — full "Further Integration by Substitution" chapter. **Closest call of the pass; EXCLUDE.** Fails **at-risk/distinctive**: in this booklet the substitution is *always given*, so no decision atom is tested — it is the same "evaluate using a given substitution" routine written in the reverse direction. `integration-by-substitution`'s blurb ("Evaluate integrals using a given substitution") already spans it. Consistent with treating u = g(x) and x = f(u) as one technique when the substitution is supplied. Recorded so it isn't re-derived.
- **`integrate-definite-by-substitution`** (change the limits, no back-substitution) — "Integrating Definite Integrals by Substitution". **EXCLUDE.** A sub-step of the substitution routine (change limits vs back-substitute), not a separate routine; bundles into `integration-by-substitution`.
- **`integrate-products-to-sums`** (∫sin3x cos2x dx via product-to-sum) — sin²/cos² §Development Q4. **EXCLUDE.** Beyond dot-point scope (dp-2 is "sin²nx and cos²nx"); relies on product-to-sum identities from the trig-identities topic → cross-topic graft, excluded per scope rules.
- **`integrate-even-powers-sin-cos`** (sin⁴x, cos⁴x by repeated power reduction) — §Mastery Q8. **EXCLUDE.** One-off harder variant of `integrate-sin2-cos2` (apply the same reduction twice); non-routine, not a distinct atom.

## 5. Considered-and-omitted

- **Parametric differentiation** (`differentiate-parametric`, `solve-parametric-derivative-problems`, both seeded on dp-1) — **not present in Book 1**; the booklet has no parametric section despite the syllabus listing it (content sits in a later Further Calculus Skills booklet, not in this group). Existing skills left untouched.
- **`differentiate-combined-functions`** (dp-1 ∩ dp-s6adv12-diffcalc-4) — product/quotient/chain combos of any Advanced functions incl. inverse trig; already covers §"Differentiate inverse trig via product/quotient" worked examples. Full match.
- **Inverse-trig derivative proofs** (cos y = √(1−sin²y) route) — examined in the Investigation but the routine skill uses only the results; the proof is not itself a graph atom.
- **Reverse-chain "differentiate → hence integrate"** recognition items (§inverse-trig-integrals Q7, Q10, Q11) and **sin³x / tan²x / cot²x via Pythagorean identity** (§sin²cos² Q6, Q9, Q10) — reverse-chain / standard-form integration already held by `reverse-chain-rule-power` and the `integrate-trig*` family; no new atom.
- **Trapezoidal rule for π approximation, normal-gradient, domain/undefined-gradient reasoning, symmetry-based definite integrals** — ambient or cross-topic wrappers on the core routines; omitted by edge policy.

## Net change

**None.** 0 new skills, 0 new edges, 0 re-scopes. Row 87 → `nil`. Strongest excluded candidate: `integrate-substitution-x-subject` (given-substitution routine, no decision atom → bundled).
