# Proposal — Atomise Data Analysis (Stage 6 Standard Y11, topic `t-s6st11-data`)

**Status: APPLIED 2026-07-17** — approved by the user (with `pareto-charts` **REJECTED** at review) and applied to `data/skills.json`. QUEUE.md row 53 → applied.

## Context

Queue row 53. Eight booklets (Statistical investigation process / Population and sample / Data classification / Displays / Centre and spread / Quartiles and IQR / Box plots / Clusters and outliers) → **dp-s6st11-data-1 – -8**. MST-11-08.

## Finding (headline)

Densest pre-coverage of any Standard topic — **24 skills already tagged** across all 8 dot points (Stage 4 data cluster, Stage 5 Data Analysis A additions from row 42, plus 6 Stage-6 natives). The row 42 pass explicitly left an **OPEN GAP addressed to this row** (Data Analysis A §5): *estimating the mean from class centres* and *estimating the median from an ogive over grouped classes*. Booklet 5 traces both in full (§Mean from Grouped Data, §Median from Grouped Data) — closed by 1 new skill. Plus 4 tags on skills the booklets re-teach.

## 1. New skills (1) — APPLIED

### `grouped-summary-statistics` — closes the row-42 flagged gap

```json
{
  "id": "grouped-summary-statistics",
  "title": "Estimate summary statistics from grouped data",
  "blurb": "Estimate the mean of grouped data using class centres ($\\bar{x} = \\frac{\\Sigma\\, cc \\times f}{\\Sigma f}$), identify the modal and median class, and estimate the median from an ogive.",
  "stage": 6,
  "courses": ["s6-std11"],
  "dotPointIds": ["dp-s6st11-data-6"],
  "prereqs": ["summary-stats-frequency-table", "grouped-data"],
  "difficulty": 2
}
```

**Trace.** Booklet 5 §Mean from Grouped Data (worked table, guided example incl. median class, Foundation Q1–3) and §Median from Grouped Data (3-step ogive method, worked example with misconception prompts, Foundation Q1 a–f, Dev Q2 draw-your-own-ogive). Class centres also taught in Booklet 4 §Histograms With Grouped Data.

**Edge-bar (both edges carried by the new skill).** `← summary-stats-frequency-table`: (1) distinctive — same $\Sigma fx/\Sigma f$ machinery with $x \to cc$; (2) at-risk — booklet re-derives it; (3) stage 4, distinctive override; (4) non-redundant. `← grouped-data`: (1) class intervals/cumulative tables/ogive construction are what this skill reads from; (2) at-risk; (3) same stage; (4) non-redundant.

## 2. New prereq edges

None standalone (2 carried by the new skill).

## 3. Edits to existing skills (4 tags) — APPLIED

| skill | change | trace |
|---|---|---|
| `summary-stats-frequency-table` (s4) | +`s6-std11`, +`dp-s6st11-data-6` | Booklet 5 re-teaches as 3 sections: §Mean from a Frequency Table, §Median from a Frequency Table, §Summary Statistics from a Frequency Table |
| `quartiles-from-cumulative-histogram` (s5-core) | +`s6-std11`, +`dp-s6st11-data-7` | Booklet 7 §Five Number Summary from Cumulative Histogram |
| `skewness-from-displays` (s5-core) | +`s6-std11`, +`dp-s6st11-data-5` | Booklet 7 §Skewness and Box Plots; Booklet 5 §Shape of a Distribution |
| `box-plot-percentages` (s5-core) | +`s6-std11`, +`dp-s6st11-data-7` | Booklet 7 §Box Plot Percentages — full section (proportion → count) |

## 4. Borderline candidates → EXCLUDE / REJECTED

- **`pareto-charts`** — proposed (Booklet 4 §Pareto Charts: 4-step drawing algorithm, dual-axis cumulative-% line, 80% interpretation) and **REJECTED by the user at review (2026-07-17)**. Pareto content stays uncovered by design — do not re-propose. If it ever needs a home, nearest existing skills are `represent-data-graphs` / `grouped-data` (data-4).
- **`skew-and-measures`** tag — booklet's §Relative Merits content already represented by tagged `choose-measure-of-centre` + `shape-of-distribution`.
- **`ungrouped-cumulative-frequency-ogive`** as own node — construction bundled in `grouped-data` blurb; reading bundled in `quartiles-from-cumulative-histogram` (tagged above).
- **`calculator-statistics-mode`** — tool fluency inside `calculate-mean-median-mode-range` / `standard-deviation`, not a routine.
- **`median-position`** ($\frac{n+1}{2}$) — sub-step of `calculate-mean-median-mode-range`; fact-grain, pollution risk.

## 5. Considered-and-omitted

- Booklet 1 (1.7 KB) is syllabus-overview only — no worked examples or practice; content lives in Booklet 2.
- Population vs sample/census, sampling bias types, questionnaire design → `design-survey`, `survey-bias-ethics`, `evaluate-sampling-methods`, `sample-representativeness`, `data-collection-faults` (tagged data-1/-2).
- Classification (numerical/categorical, discrete/continuous, nominal/ordinal) → 2 tagged skills on data-3.
- Line/dot/stem-leaf/sector graphs, histograms/polygons, choosing graphs, misleading graphs → `represent-data-graphs`, `choose-graph-type`, `misleading-graphs`, `interpret-graphs-conclusions` (tagged data-4/-5).
- Mean/median/mode/range from lists and displays, comparisons, SD → `calculate-mean-median-mode-range`, `compare-datasets-measures`, `choose-measure-of-centre`, `standard-deviation` (tagged data-6).
- Quartiles, FNS (lists, stem-leaf, dot plots), IQR, box plots, parallel comparison → 4 tagged skills on data-7.
- Clusters/gaps/outliers, add/remove impact, 1.5×IQR rule → 3 tagged skills on data-8.
- **Spreadsheet sections** (Booklets 4 and 5) — recurring spreadsheet gap, no graph action.
- Note: `grouped-summary-statistics` may warrant an `s6-adv11` tag at row 70 (Probability and Data 4_Data) — left to that pass.

## Net change

- **1 new skill** (`grouped-summary-statistics`); `pareto-charts` rejected at review
- **0 standalone new edges** (2 carried by the new skill)
- **4 re-scopes** (course/dot-point tags)
