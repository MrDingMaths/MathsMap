---
status: applied
---

# Proposal — Exponential and Logarithmic Functions (Stage 6 Advanced Y11)

**Context.** Booklets `Exponential and Logarithmic Functions 1_Exponential functions` and `2_Logarithmic functions`. Target `t-s6adv11-explog`, dot points `dp-s6adv11-explog-1`–`5` (exponential graphs; Euler's number & `e^x` self-derivative; define logs/natural log; solve exp equations + log laws to simplify/solve/prove; graph `y=log_a x` as reflection of `y=a^x`).

**Finding (headline).** **Near-saturated.** Every dot point is already wired by prior passes (the Stage 5 Logarithms pass and earlier explog wiring cross-tagged the Stage 5 log/exponential skills onto `dp-s6adv11-explog-*`, and `eulers-number` / `derivative-of-ex` / `natural-logarithm` were built at Stage 6):

| dp | covered by |
|---|---|
| explog-1 | `graph-exponential-features`, `exponential-transformations`, `exponential-end-behaviour` |
| explog-2 | `eulers-number`, `derivative-of-ex` |
| explog-3 | `define-logarithm`, `index-log-conversion`, `natural-logarithm` |
| explog-4 | `laws-of-logarithms`, `log-results` (change-of-base in blurb), `evaluate-simplify-logs`, `solve-exponential-log-equations`, `log-identities-inverse` |
| explog-5 | `graph-log-functions` |

**One genuine gap:** the substitution-to-quadratic routine (`4^x−9(2^x)+14=0`, `6(log_3 x)²+7log_3 x−5=0`, `6e^(2x)+7e^x−5=0`). The graph already has topic-specific "reducible to quadratic" nodes — `equations-reducible-quadratic` (S5 Path, `u=x²` polynomials) and `solve-trig-quadratic-form` (S6 Adv, `u=sin x`, its **own** node) — but **no exp/log counterpart**, even though Book 2 Q24 deliberately pairs the plain-quadratic, trig, log and exp forms side by side. That structural-twin asymmetry is the one thing worth fixing.

## 1. Recommended new skills

### `solve-exp-log-quadratic-form`

| field | value |
|---|---|
| id | `solve-exp-log-quadratic-form` |
| title | Solve exp/log equations reducible to quadratics |
| blurb | Solve exponential and logarithmic equations that reduce to quadratics by substituting $u=a^{x}$ or $u=\log_a x$. |
| stage | 6 |
| courses | `["s6-adv11"]` |
| dotPointIds | `["dp-s6adv11-explog-4"]` |
| difficulty | 3 |
| prereqs | `["solve-exponential-log-equations", "solve-quadratic-factorisation"]` |
| atom type | Routine (R) |

```json
{
  "id": "solve-exp-log-quadratic-form",
  "title": "Solve exp/log equations reducible to quadratics",
  "blurb": "Solve exponential and logarithmic equations that reduce to quadratics by substituting $u=a^{x}$ or $u=\\log_a x$.",
  "stage": 6,
  "courses": ["s6-adv11"],
  "dotPointIds": ["dp-s6adv11-explog-4"],
  "prereqs": ["solve-exponential-log-equations", "solve-quadratic-factorisation"],
  "difficulty": 3
}
```

**Booklet trace.** Book 2 §"Solving Equations…" Development Q3 (`u=2^x` on `4^x−9(2^x)+14=0`; `u=3^x` on `3^(2x)−8(3^x)−9=0`), Q4 (`25^x−26(5^x)+25=0`, `9^x−5(3^x)+4=0`, `3^(2x)−3^x−20=0`); §"The Natural Logarithm" Mastery Q24 (`6(log_3 x)²+7log_3 x−5=0` and `6e^(2x)+7e^x−5=0`, taught alongside the plain quadratic and `6sin²x+7sin x−5=0`).

**Edge-bar justification.**

`solve-exp-log-quadratic-form ← solve-quadratic-factorisation`
1. *Distinctive* — the routine's whole mechanism is "substitute, then factor the resulting non-monic quadratic (`6u²+7u−5`)"; the factorisation is intrinsic, not ambient. Both twins carry this exact prereq.
2. *At-risk* — non-monic factorisation is plausibly shaky at this level.
3. *Stage-proximity* — prereq S5 → skill S6, within one stage.
4. *Non-redundant* — not reachable via `solve-exponential-log-equations`.

`solve-exp-log-quadratic-form ← solve-exponential-log-equations`
1. *Distinctive* — after solving for `u`, back-substituting and solving `a^x=k` / `log_a x=k` (and rejecting `u<0` roots like `e^x=−5/3`) is the characteristic closing step. Mirrors `solve-trig-quadratic-form ← solve-trig-equations-restricted`.
2. *At-risk* — a student can factor yet stumble converting `2^x=7 → x=log_2 7`.
3. *Stage-proximity* — S5 → S6.
4. *Non-redundant* — not reachable via `solve-quadratic-factorisation`.

## 2. Recommended new prereq edges

Both covered in §1 (the two edges into the new skill). No edges among existing skills.

## 3. Edits to existing skills

None. All explog dot points already carry their skills; no blurb re-scopes arise.

## 4. Borderline candidates → EXCLUDE

- **Solve different-base equations by taking logs of both sides** (Book 2 Q22–23, `2^(3x)=3^(x+1)`) — flagged "advanced technique", one worked example + two questions. Atoms are log-both-sides + power law (`laws-of-logarithms`) + solve linear; no distinctive new atom beyond `solve-exponential-log-equations`. Fold in.
- **Exponential / logarithmic inequalities** (Book 2 §"Solving Equations…" Q5–6, `log_2 x<3`, `2^x>12`) — solve as an equation, then reason about direction/domain; the inequality machinery is topic-ambient, not an explog atom. Exclude.
- **Exponential modelling with logs** (Book 2 §"Exponential Modelling", §"…Rate of Change" — compound-interest/half-life/doubling solved for the index) — **standing decision** from the Logarithms proposal §4: folds into `solve-exponential-log-equations` applied to a model; no node. Consistent, re-excluded.
- **Change-of-base proofs** (`log_a b=1/log_b a`, `log_xy a`, `log_{a^x} b`; Book 2 Mastery Q8, Q11–12) — non-routine "show that" proofs; already excluded by the Logarithms pass. Re-excluded.
- **Rewrite `y=a^-x` as `(1/a)^x`** (Book 1 Mastery Q7) — a single index-law identity; ambient, not an atom.

## 5. Considered-and-omitted

- **Differentiating exponentials + tangents/normals + exponential rate-of-change** (Book 1 §"Derivative of Exponential Functions", §"Tangents and Normals"; Book 2 §"…Rate of Change" — chain/product/quotient rule on `e^(ax+b)`, `x²e^(5x)`, etc.) — this is **Year 12 Differential Calculus** content (topic `t-s6adv12-diffcalc`), already covered by `differentiate-exponential`, `differentiate-exponential-composite`, `differentiate-combined-functions`. Out of scope for the explog dot points (dp-2 asks only to *recognise* `e^x` is its own derivative → `derivative-of-ex`). No node here; belongs to QUEUE row 73.
- **Logarithmic scales** (Book 2 §"Logarithmic Scales" — Richter/pH/decibels) — covered by `logarithmic-scales`; not an explog dot point (it lives under modelling / row 71). Untouched.
- Exponential-curve features, vertical translation `y=a^x+c`, reflections, growth/decay, `x→±∞` behaviour → `graph-exponential-features`, `exponential-transformations`, `exponential-end-behaviour`. Match.
- Log definition, index↔log conversion both ways, evaluate `log_a x=b` / `log_x n=b`, log laws, standard results, inverse identities, combine-to-single-log, "in terms of `log_a 2`" → the existing S5-dual-staged log cluster. Match.
- `ln`, `e`, `e^x` self-derivative, graph `y=log_a x` reflection → `natural-logarithm`, `eulers-number`, `derivative-of-ex`, `graph-log-functions`. Match.

**Net change if approved:** 1 new skill, 2 new edges (both into the new skill), 0 re-scopes.
