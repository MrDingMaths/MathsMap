---
status: applied
---

# Proposal — Binomial Distributions (QUEUE row 89) — APPLIED

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (2 new skills, 2 new edges, 0 re-scopes); `npm run validate` clean. `normal-approximation-sample-proportion` **rejected by user — removed from the syllabus** → §4 EXCLUDE (standing rejection). QUEUE.md row 89 → applied. **Stage 6 Extension 1 complete.**

## Context
Booklet `Stage 6 Extension 1/Binomial Distributions.md` (1681 lines, ME1-12-06). Topic `t-s6x1y12-binomdist`, dot points `dp-s6x1y12-binomdist-1/2/3` (Bernoulli; binomial; sampling distribution & CLT). Audit of the pre-seeded 13-skill binomdist cluster against the full booklet — worked examples, Guided Practice, Foundation/Interpret/Investigation blocks.

**Scope confirmation** (QUEUE flag): this single booklet covers all three dot points — Bernoulli, Binomial, and the sampling distribution. No scope surprise.

## Finding (headline)
Cluster dense and fully wired — Bernoulli spine, binomial spine (`binomial-random-variable ← {bernoulli-random-variable, combinations-nCr}` → `…-probability-formula` → `{…-expected-frequency, …-mean-variance, solve-binomial-problems}`), and a complete sample-mean CLT spine (`population-sample-concepts → sampling-distribution-mean → central-limit-theorem → clt-mean-variance → clt-probability`). Bernoulli (dp-1) and binomial core (dp-2 single-`r`) fully covered. Two real gaps: dp-2 cumulative probability, and the dp-3 **sample proportion** (booklet teaches the sampling distribution via $\hat p=X/n$, not the seeded sample-mean framing).

## 1. New skills (applied)

### 1a. `binomial-cumulative-probability` (dp-2)
| field | value |
|---|---|
| id | `binomial-cumulative-probability` |
| title | Find cumulative binomial probabilities |
| blurb | Find cumulative probabilities such as $P(X\ge r)$, $P(X\le r)$ and $P(a\le X\le b)$ for a binomial variable by summing terms, choosing the direct or complement set for efficiency ($P(X\ge r)=1-P(X\le r-1)$). |
| stage 6 · courses `["s6-ext1-12"]` · dotPointIds `["dp-s6x1y12-binomdist-2"]` · difficulty 3 · prereqs `["binomial-probability-formula"]` · atom R |

**Trace.** §"At Least, At Most, More Than" — Review (write set of `r`; identify complement set + decide whether complement is more efficient, a–f), worked Example (`Bin(6,0.3)`, `P(X≥2)=1−P(0)−P(1)≈0.5798`), Guided Practice a–d, calculator-CD Interpret block (`P(X≤3)`, `P(X<3)`, `P(X>3)`).

**Bar (`← binomial-probability-formula`).** (1) Distinctive — cumulative routine built from individual `P(X=r)` terms. (2) At-risk — which terms to sum, and when the complement is shorter (taught decision atom). (3) Same stage/topic. (4) Non-redundant — no cumulative skill reachable from the formula.

### 1b. `sample-proportion` (dp-3)
| field | value |
|---|---|
| id | `sample-proportion` |
| title | Mean and standard deviation of a sample proportion |
| blurb | Find the sample proportion $\hat p=\dfrac{X}{n}$ of a binomial variable and its mean $p$, variance $\dfrac{p(1-p)}{n}$ and standard deviation $\sqrt{\dfrac{p(1-p)}{n}}$. |
| stage 6 · courses `["s6-ext1-12"]` · dotPointIds `["dp-s6x1y12-binomdist-3"]` · difficulty 2 · prereqs `["binomial-mean-variance"]` · atom R |

**Trace.** §"The Sample Proportion" — Investigation (define $\hat p=X/n$, dilation of $X$ by $1/n$), concept box + derivation table ($E(\hat p)=p$, $Var(\hat p)=p(1-p)/n$, $\sigma(\hat p)$), worked Example (circuit boards `Bin(150,0.3)`), Guided Practice (spam emails; smallest `n` with `σ(p̂)<0.01`).

**Bar (`← binomial-mean-variance`).** (1) Distinctive — $\hat p$'s mean/variance are $X$'s $np$, $np(1-p)$ scaled by $1/n$, $1/n^2$. (2) At-risk — variance scales by $1/n^2$ not $1/n$. (3) Same topic. (4) Non-redundant.

## 2. New prereq edges (applied)
- `binomial-cumulative-probability ← binomial-probability-formula`
- `sample-proportion ← binomial-mean-variance`

## 3. Edits to existing skills
None.

## 4. Borderline candidates → EXCLUDE
- **`normal-approximation-sample-proportion`** (§"Normal Approximation of Sample Proportions": $\hat p\sim N(p,p(1-p)/n)$, standardise, solve — worked Example 60% voters, Guided Practice a–c). **REJECTED by user — removed from the syllabus.** Do not re-propose.
- **`counting-arrangements-successes-failures`** (§"Counting Arrangements of Two Elements", Foundation Q1–7) — `permutations-not-distinct` / `combinations-nCr` re-applied; already reachable via `binomial-random-variable ← combinations-nCr`. Dedupe.
- **`binomial-probability-formula ← combinations-nCr` edge** — already in the graph via `binomial-random-variable ← combinations-nCr` (rule 4 redundant).
- **`reverse-binomial-parameters`** (given `E(X)=12, Var=9.6` find `n,p`) — instance of `binomial-mean-variance` + cross-topic simultaneous algebra.
- **`sample-size-for-sd-threshold`** (smallest `n` with `σ(p̂)<0.01`) — instance of `sample-proportion` (solve inequality).

## 5. Considered-and-omitted
- Bernoulli identify/model/table, `E=p`, `Var=p(1−p)`, applications → seeded `bernoulli-*`.
- Binomial 4-condition checks, `X~Bin(n,p)`, `P(X=r)`, expected frequency `N·P(X=r)`, mean/variance → seeded `binomial-*`.
- Calculator [Binomial PD]/[Binomial CD] → tool procedure, not a math atom.
- **Sample-mean `X̄` / general CLT (`σ/√n`)** — seeded `sampling-distribution-mean, central-limit-theorem, clt-mean-variance, clt-probability` remain as the mean-framed spine; booklet reaches CLT via proportions but never drills the general-population `X̄` routine. Framing mismatch noted, seeded mean-spine left intact.
- Continuity correction & `np≥10` rule → booklet states "not in the syllabus".
- Linearity of expectation / variance non-linearity asides → `linearity-of-expectation` already exists (Advanced).

## Net change applied
- **+2 skills** (`binomial-cumulative-probability`, `sample-proportion`)
- **+2 edges** (as §2)
- **0 re-scopes**
