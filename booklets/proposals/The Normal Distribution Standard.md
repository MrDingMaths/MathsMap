---
status: applied
---

# Proposal — Atomise The Normal Distribution (Stage 6 Standard Y12, topic `t-s6st12-normal`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (2 new skills, 2 new edges, 0 re-scopes); `npm run validate` clean. QUEUE.md row 63 → applied. **Completes the Stage 6 Standard course** (rows 46–63 all applied/nil).

## Context

Queue row 63 (final Standard Y12 group). Three booklets: `The Normal Distribution 1_Normally distributed datasets`, `2_Calculating z-scores`, `3_Probability using z-scores` (MST-12-S2-10), dp-1–4. Five skills already tagged (all dual-tagged with Advanced `s6-adv12`).

## Finding (headline)

Spine covered (`normal-distribution-shape`, `calculate-z-score`, `compare-z-scores`, `empirical-rule`, `normal-probabilities`). Two genuine gaps: (1) converting a z-score back to a raw score ($x = \mu + z\sigma$) — Book 2 gives it its own formula box and drills, the reverse of `calculate-z-score`; (2) the standard normal probability table — Book 3's entire method (look up $P(z<c)$, complement for $P(z>c)$, subtract for $P(a<z<b)$, symmetry for negative $z$) — distinct from the empirical rule (integer $z$ only), the technique every 2021–2024 HSC uses.

| Booklet section | dp | Skill |
|---|---|---|
| B1 §The Normal Distribution (bell shape, mean≈median≈mode, compare curves, CLT) | dp-1 | `normal-distribution-shape` ✓ |
| B2 §The Z-Score (forward $z = (x-\mu)/\sigma$) | dp-2 | `calculate-z-score` ✓ |
| B2 §Converting z-scores to raw scores ($x = \mu + z\sigma$) | dp-2 | new `z-score-to-raw-score` §1a |
| B2 §Applications of the Z-Score (compare, equivalent mark) | dp-2 | `compare-z-scores` ✓ |
| B2 §The 68-95-99.7 Rule + §Applying the Empirical Rule | dp-3 | `empirical-rule` ✓ |
| B2 empirical-rule problems (count = %×n, find μ/σ) | dp-4 | `normal-probabilities` ✓ |
| B3 §Normal Probability Distributions + §Z-score table | dp-4 | new `z-table-probability` §1b |

## 1. New skills (applied)

### a. `z-score-to-raw-score`

| Field | Value |
|---|---|
| id | `z-score-to-raw-score` |
| title | Convert a z-score to a raw score |
| blurb | Convert a $z$-score back to a raw value with $x = \mu + z\sigma$, and rearrange to find the mean or standard deviation from a known score and $z$. |
| stage 6 · courses `["s6-std12", "s6-adv12"]` · dotPointIds `["dp-s6st12-normal-2", "dp-s6adv12-randomvar-6"]` · difficulty 2 · prereqs `["calculate-z-score"]` · atom R (reverse) |

**Trace:** B2 §Converting z-scores to raw scores — formula box $x = \mu + z\sigma$, worked example (Blake $z=2 \to x=37$), F Q3 (nine parts), Dev Q6/Q7b; Mastery Q9 (16% ≥ 29, $\sigma=3$ → mean) and Q10 (2.5% below 73 → $\sigma$); HSC sample Q11; B3 Q15e (top 10% → height). Dual-tag mirrors `calculate-z-score`.

**Bar:** distinctive ($x = \mu + z\sigma$ rearrangement + solving for $\mu$/$\sigma$); at-risk (find mean/sd from percentage, HSC-assessed); stage 6; non-redundant (`calculate-z-score` forward only). `area-rule-reverse` / `predict-from-regression-equation` pattern.

### b. `z-table-probability`

| Field | Value |
|---|---|
| id | `z-table-probability` |
| title | Find normal probabilities from the standard normal table |
| blurb | Use the standard normal table of $P(z<c)$ to find normal probabilities — reading $P(z<c)$ directly, using $P(z>c) = 1 - P(z<c)$, subtracting for $P(a<z<b)$, and using symmetry for negative $z$ — then applying $f = np$ for expected counts. |
| stage 6 · courses `["s6-std12", "s6-adv12"]` · dotPointIds `["dp-s6st12-normal-4", "dp-s6adv12-randomvar-6"]` · difficulty 3 · prereqs `["calculate-z-score"]` · atom R |

**Trace:** B3 §Normal Distribution Probability Table + later sections — three method boxes ($P(z<c)$ direct; $P(z>c)=1-P(z<c)$; $P(a<z<b)=P(z<b)-P(z<a)$) + negative-$z$ symmetry box, worked examples, F Q1–2, Dev/Mastery incl. 2021/2022/2023/2024 HSC (all supply the table; expected-count + top-10% parts), Q10–15.

**Bar:** distinctive (table lookup + complement + subtraction + symmetry — the empirical rule can't do non-integer $z$); at-risk (four consecutive HSC years; negative-$z$ symmetry is the syllabus-only edge case); stage 6; non-redundant (`normal-probabilities` explicitly empirical-rule). Dual-tags to Advanced Random Variables.

## 2. New prereq edges (applied)

- `z-score-to-raw-score ← calculate-z-score` — reverse of the same formula.
- `z-table-probability ← calculate-z-score` — core routine converts raw → z before table lookup.

## 3. Edits to existing skills

None. `normal-probabilities` stays scoped to the empirical rule; the table method is the new sibling on dp-4.

## 4. Borderline candidates → EXCLUDE

- **`central-limit-theorem`** (B1 §CLT investigation). Flagged "you will learn… in later lessons"; conceptual, no assessed routine at Standard. (Check Advanced Random Variables, row 76.)
- **`compare-normal-curves`** (B1 Q2/Q3/Q7 — higher mean / larger sd). Reading mean/spread from shape sits inside `normal-distribution-shape`; Category judgment.
- **`find-mean-sd-from-percentage`** (B2 Mastery Q9/Q10). Composition of `empirical-rule` + `z-score-to-raw-score`.
- **`normal-percentile-to-score`** (B3 Q15e, 2024 HSC Q8). Composes `z-table-probability` + `z-score-to-raw-score`.

## 5. Considered-and-omitted

- Bell-shape recognition, mean≈median≈mode, skew reasoning (B1) → `normal-distribution-shape`.
- Forward z, mark tables (B2 §The Z-Score) → `calculate-z-score`.
- Compare subjects, equivalent mark, change-in-z (B2 §Applications) → `compare-z-scores` (equivalent-mark now explicit via `z-score-to-raw-score`).
- 68-95-99.7 shading, %/count within k sd (B2 §Empirical Rule) → `empirical-rule` + `normal-probabilities`.
- Symmetry facts $P(z<0)=0.5$, $P(z>c)=1-P(z<c)$ (B3 intro) → inside `z-table-probability`.
- "Statistics shaping decisions" / spreadsheet syllabus lines — no booklet content; ambient.

## Net change applied

- **+2 skills** (`z-score-to-raw-score`, `z-table-probability`)
- **+2 edges** (both ← `calculate-z-score`)
- **0 re-scopes**
