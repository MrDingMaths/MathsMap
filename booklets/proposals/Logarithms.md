---
status: applied
---

# Proposal — Logarithms (Stage 5 Path)

**Context.** Booklets Logarithms_1–2 (Stage 5 Path). Target `t-s5p-log`, dot points `dp-s5p-log-1` (examine logarithms numerically and graphically), `dp-s5p-log-2` (establish and apply the laws of logarithms to solve problems). MA5-LOG-P-01.

**Finding (headline).** Saturated — 8 skills across the 2 dot points (built alongside the Stage 6 Advanced Exponential/Logarithmic topic, which shares `dp-s6adv11-explog-*`). Book 1 maps 1:1 onto `define-logarithm`, `index-log-conversion`, `graph-log-functions`, `solve-exponential-log-equations`. Book 2's laws/results/change-of-base/solving/scales all map onto `laws-of-logarithms`, `log-results` (change-of-base already in its blurb), `evaluate-simplify-logs`, `solve-exponential-log-equations`, `logarithmic-scales`. **One genuine gap:** Book 2 §"The Inverse Relationship" teaches $\log_a a^x=x$ and $a^{\log_a x}=x$ — that is the existing `log-identities-inverse` skill, but it is stranded at Stage 6 Advanced. `log-results` (=1 / =0 / reciprocal / change-of-base) does **not** cover the inverse identities. Precedent: `log-results`, `logarithmic-scales` and `solve-exponential-log-equations` are already dual-staged 5+6; plus the `find-equation-parabola-features` re-stage (row 24) and `rationalise-binomial-surd-denominator` (row 15).

## 1. Recommended new skills

None. Topic saturated.

## 2. Recommended new prereq edges

None. `log-identities-inverse`'s sole prereq `index-log-conversion` is already correct and Stage 5.

## 3. Edits to existing skills (re-stage)

`log-identities-inverse` — re-stage 6→5 and attach to the Stage 5 Path dot point it is first taught on.

| field | before | after |
|---|---|---|
| stage | 6 | 5 |
| courses | `["s6-adv11"]` | `["s5-path", "s6-adv11"]` |
| dotPointIds | `["dp-s6adv11-explog-4"]` | `["dp-s5p-log-2", "dp-s6adv11-explog-4"]` |
| prereqs | `["index-log-conversion"]` | unchanged |
| difficulty | 2 | unchanged |

Trace: Book 2 §"The Inverse Relationship" + §"Log Laws" table (row "$\log_a a^x = a^{\log_a x} = x$"); worked example $\log_7 7^{12}=12$, $5^{\log_5 11}=11$; Foundation Q1 ($\log_{10}10^3$, $12^{\log_{12}1.3}$, $10^{\log_{10}100}$, $4^{\log_4 3.6}$).
Stage monotonicity: sole prereq `index-log-conversion` is Stage 5 → 5←5 valid.
Earliest genuine stage: the inverse-identity simplification is first taught here (Stage 5 Path), not at Stage 6. Re-stage, don't duplicate.

## 4. Borderline candidates → EXCLUDE

- **exponential-modelling-with-logs** (Book 2 §"Exponential Modelling" — compound interest $FV=PV(1+r)^n$ solved for $n$, population growth, half-life, Newton's law of cooling; 11 questions) — substitute into a given exponential model, isolate the exponential term, solve with logarithms = `solve-exponential-log-equations` applied to a model. Per the standing modelling call (row 23 `interpret-exponential-model` excluded; parabola/polynomial modelling has no own node), this folds in. No node.
- **change-of-base** (Book 2 §"Change of Base Law", Mastery Q8–9) — already inside the `log-results` blurb. Not split out.
- **log-scale-calculations** (Book 2 §"Logarithmic Scales" — amplitude ratios, pH values, decibel ratios, rearranging $M=\log_{10}A$ for $A$) — the quantitative steps are `index-log-conversion` (rearrange to index form) plus arithmetic applied within a scale context; `logarithmic-scales` is the home node. No new atom.

## 5. Considered-and-omitted

- Book 1 → `define-logarithm`, `index-log-conversion` (both directions), `graph-log-functions` (table of values, reflection in $y=x$, increasing/decreasing by base), `solve-exponential-log-equations` (solve $\log_a x=b$, $\log_x a=b$, evaluate by index form). Match.
- Book 2 → `laws-of-logarithms` (product/quotient/power), `log-results` (=1 / =0 / $\sqrt{a}$ / reciprocal / change-of-base), `evaluate-simplify-logs` (combine laws, evaluate given $\log_a 2$ etc.), `solve-exponential-log-equations` (take logs of both sides), `logarithmic-scales`. Match.
- Book 2 Mastery Q9–17 (prove change-of-base variants, $\log_{xy}a$, $\log_{a^x}b$) — non-routine "show that" proofs; excluded.
- `natural-logarithm`, `log-scale-applications` (Stage 6 Advanced) — the booklets use base 10 / general $a$ only (no $e$ or $\ln$); those stay Stage 6, owned by the Exp/Log passes (rows 68/71).

**Net change if approved:** 0 new skills, 0 new edges, 1 re-stage (`log-identities-inverse` 6→5, +course, +dot point).
