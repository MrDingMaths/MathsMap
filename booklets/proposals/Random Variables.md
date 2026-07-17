---
status: applied
---

# Proposal — Atomise Random Variables (Stage 6 Advanced Y12, topic `t-s6adv12-randomvar`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (3 new skills, 3 new edges, 0 re-scopes); `npm run validate` clean (1175 skills). Skill 2 (`expected-value-games-of-chance`) vetoed by the user → moved to §4 EXCLUDE. QUEUE.md row 76 → applied.

## Context
QUEUE row 76. Three booklets — `Random Variables 1_Discrete`, `2_Continuous`, `3_The Normal Distribution` (MAV-12-07), dp-1–6. 22 skills already tagged across all six dot points; the normal section (dp-5/dp-6) also carries the row-63 Standard cross-tags.

## Finding (headline)
Topic arrives pre-saturated. The normal spine (dp-5/dp-6) is fully wired — Bk3 yields nothing new, and its two apparent gaps (`inverse-normal-score`, `equivalent-score`) are already-decided EXCLUDEs from the row-63 Standard pass. The discrete (Bk1) and continuous (Bk2) sections each surface genuine, heavily-drilled routines the graph doesn't hold.

## 1. New skills (applied)

### a. `linearity-of-expectation` (dp-2)
| Field | Value |
|---|---|
| id | `linearity-of-expectation` |
| title | Apply the linearity of expectation |
| blurb | Use $E(aX+b)=aE(X)+b$ to find the expected value of a linear transformation of a discrete random variable from a known $E(X)$. |
| stage 6 · courses `["s6-adv12"]` · dotPointIds `["dp-s6adv12-randomvar-2"]` · difficulty 2 · prereqs `["expected-value-discrete"]` · atom F |

**Trace:** Bk1 Expected Value §Q11 — concept box "This is called the **linearity of expectation** $E(aX+b)=aE(X)+b$", parts a–e derive it (E(2X), E(X+1)), f–k drill it from a given $E(X)=5$. A full titled block.

**Bar:** distinctive (named formula absent from every existing skill); at-risk (conflating E(aX+b) with recomputing the sum; mis-handling +b); stage 6; non-redundant (`expected-value-discrete` is only the definitional sum $\sum xP(x)$; the Var(aX+b) aside is one mis-stated line, not drilled → not bundled here).

### b. `pdf-unknown-constant` (dp-3)
| Field | Value |
|---|---|
| id | `pdf-unknown-constant` |
| title | Find an unknown constant in a pdf |
| blurb | Find an unknown coefficient or domain endpoint in a probability density function by setting the integral over its domain equal to 1 (rejecting roots that violate $f(x)\ge 0$). |
| stage 6 · courses `["s6-adv12"]` · dotPointIds `["dp-s6adv12-randomvar-3"]` · difficulty 3 · prereqs `["probability-density-function"]` · atom R |

**Trace:** Bk2 own worked example (f(x)=ax²) + own Key Ideas box ("To find an unknown constant in a PDF, set the integral over the domain to equal 1"), Guided Practice a–d, ~20 parts (PDF Q4/Q6/Q7/Q10/Q13a/Q15a/Q16a/Q17a; Q7–Q9 solve for a domain limit with $f\ge0$ root-rejection; CDF Q5b/Q7a/Q10a; Median Q7b).

**Bar:** distinctive (inverse of the forward pdf skill — solve $\int f=1$ for a parameter before any probability is computed); at-risk (root-rejection on $f\ge0$, domain-endpoint variant); stage 6; non-redundant — lift-out: `probability-density-function`'s blurb merely mentions "total area 1"; a mention isn't graph-reachability, and this inverse routine has its own Key Ideas + 20-question block.

### c. `mode-continuous-distribution` (dp-4)
| Field | Value |
|---|---|
| id | `mode-continuous-distribution` |
| title | Find the mode of a continuous variable |
| blurb | Find the mode of a continuous random variable by maximising its probability density function $f(x)$, or by reading the peak from its graph, including endpoint cases where $f$ is monotonic. |
| stage 6 · courses `["s6-adv12"]` · dotPointIds `["dp-s6adv12-randomvar-4"]` · difficulty 2 · prereqs `["probability-density-function"]` · atom R |

**Trace:** Bk2 §Mode of a Continuous Distribution — worked example (f(x)=3x(4−x)/32), Guided Practice a/b, Foundation Q1a–d (read off graph), Q2a–c/Q3/Q4a–e (maximise f), recurring at CDF Q10c/Q19a/Q20c and Median Q6a. ~20 parts.

**Bar:** distinctive (maximise the density — a peak-finding routine none of the pdf/cdf/mean/median/quartile skills touch); at-risk (monotonic "mode at the endpoint" case; max-of-f vs stationary point); stage 6; non-redundant. Prereq held to `probability-density-function` only, matching how `median-quartiles-continuous` keeps its prereq intrinsic and doesn't graft an equation-solving/calculus skill (no-cross-topic-prereq rule).

## 2. New prereq edges (applied)
- `linearity-of-expectation ← expected-value-discrete`
- `pdf-unknown-constant ← probability-density-function`
- `mode-continuous-distribution ← probability-density-function`

## 3. Edits to existing skills
None. `probability-density-function` keeps its "total area 1" mention (lift-out doesn't force a re-scope, mirroring row-63's `z-table-probability`). `variance-discrete` already names both variance formulas.

## 4. Borderline candidates → EXCLUDE
- **`expected-value-games-of-chance`** (Bk1 §Mixed Applications → "Expected Value in Games of Chance": concept box fair ⟺ E(X)=0, worked example, ~13 Qs incl. back-solving a fair entry fee). **VETOED by user** — folds into the dp-2 catch-all `solve-discrete-distribution-problems` ("solve problems involving expectation"). Do not re-propose as a standalone skill.
- **`inverse-normal-score`** (Bk3, ~9 Qs — probability→z backward lookup then $x=\mu+z\sigma$). = `normal-percentile-to-score`, a DECIDED EXCLUDE (row-63 §4: "composes `z-table-probability` + `z-score-to-raw-score`"). Backward table read is treated as part of `z-table-probability`. Never re-propose.
- **`equivalent-score`** (Bk3 — $z_A\to x_B=\mu_B+z_A\sigma_B$). = DECIDED fold-in (row-63 §5: "equivalent-mark now explicit via `compare-z-scores` + `z-score-to-raw-score`").
- **`central-limit-theorem`** — row-63 §4 deferred a CLT check to this row. No assessed CLT routine exists in any of the three booklets. Remains excluded; gap noted for a future CLT-bearing booklet.
- **`find-unknown-parameter-distribution`** (Bk1 Q9 8-part etc.). Single-unknown = instance of `discrete-probability-distribution` ($\sum P=1$); simultaneous-with-mean variant = composition of `discrete-probability-distribution` + `expected-value-discrete`.
- **`interval-probability-from-distribution`** (Bk1 Q4/Q14 — $P(a\le X\le b)$ by summing table cells). Instance of `theoretical-probability`; folds into `solve-discrete-distribution-problems`.
- **`piecewise-cdf`** (Bk2, only 3 Qs). Below the repeated-block bar; application of `cumulative-distribution-function`.

## 5. Considered-and-omitted
- Validate-a-distribution (Bk1 Q3/Q7) → `discrete-probability-distribution`.
- Construct distribution from tree / without-replacement (Bk1 Q8/Q10/Q11/Q12) → multistage-tree support + `discrete-probability-distribution`.
- Alt variance formula $\sum x^2P(x)-\mu^2$ (Bk1 SD block) → named inside `variance-discrete`.
- Calculator methods for E/Var/σ → tool procedure, not a math atom.
- Median via $\int=0.5$ / percentiles / deciles (Bk2) → `median-quartiles-continuous` with a different constant.
- % within one sd of a continuous RV (Bk2) → composition `mean-variance-continuous` + `probability-density-function`.
- Relative-frequency histogram estimation (Bk2 opening) → owned by `estimate-probability-relative-frequency` dot point, out of dp-3/4 scope.
- Trapezoidal estimate of the normal pdf area (Bk3) → graphing dot point, out of dp-5/6 scope.
- Quality-control accept/reject, "% between", f=np expected counts, compare-two-normals, "is this unusual" (Bk3) → `empirical-rule` / `normal-probabilities` / `z-table-probability` (f=np already named) / `compare-z-scores`.

## Net change applied
- **+3 skills** (`linearity-of-expectation`, `pdf-unknown-constant`, `mode-continuous-distribution`)
- **+3 edges** (as §2)
- **0 re-scopes**
