# Proposal — Atomise Data Analysis (NEW booklet, topic `t-s4-dan`)

**Status: APPLIED 2026-07-15** — approved by the user and applied to `data/skills.json`; `npm run validate` clean (1092 skills). QUEUE.md row 5 → applied.

## Context

Booklet: `Stage 4/Data Analysis.md` (NEW; supersedes OLD Data Analysis 1–3) → **dp-s4-dan-1** (mean/median/mode/range), **dp-s4-dan-2** (effect of data points), **dp-s4-dan-3** (analyse & draw conclusions). Topic `t-s4-dan`, MA4-DAT-C-02.

## Finding

The measures/centre/shape/census core is densely covered by 10 existing skills (built from the OLD booklets). The NEW booklet adds three routines those skills don't reach: reverse-mean, frequency-table statistics, and survey-bias identification.

Existing coverage: dan-1 `calculate-mean-median-mode-range`, `measures-of-centre`, `modality`, `compare-datasets-measures`; dan-2 `clusters-gaps-outliers`, `effect-on-measures-centre`, `choose-measure-of-centre`; dan-3 `shape-of-distribution`, `skew-and-measures`, `census-vs-sample`, `draw-conclusions-data`.

## Applied — new skills (3)

### 1. `find-value-from-mean`
```json
{ "id": "find-value-from-mean", "title": "Find a data value given the mean", "blurb": "Find a missing data value or the score needed to reach a target mean, using $\\overline{x} = \\dfrac{\\sum x}{n}$.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-dan-1"], "prereqs": ["calculate-mean-median-mode-range"], "difficulty": 2 }
```
- **Trace:** "Mean Problems" section — formula box; worked examples (`5,3,9,x` mean 6; "mean of 7 is 11, one added → 12"); Guided Practice a–d; Foundation Q1–Q5 ("goals/score needed for target average").
- **Bar:** Distinctive reverse-mean routine ✓; at-risk ✓; same stage ✓; non-redundant (`calculate-mean-median-mode-range` is forward) ✓.

### 2. `summary-stats-frequency-table`
```json
{ "id": "summary-stats-frequency-table", "title": "Find summary statistics from a frequency table", "blurb": "Find the mean, median, mode and range of data presented in a frequency table, using $\\overline{x} = \\dfrac{\\sum fx}{\\sum f}$.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-dan-1"], "prereqs": ["calculate-mean-median-mode-range"], "difficulty": 2 }
```
- **Trace:** "Mode and Range from a Frequency Table", "Mean from Frequency Tables" (`xf` column, `\sum xf/\sum f`), "Median from a Frequency Table", "Summary Statistics from a Frequency Table" — dedicated sections + misconception drills ("mode is the data value, not the frequency"; "ignore 0-frequency for range").
- **Bar:** Distinctive method (`\sum fx/\sum f`, cumulative counting for median) ✓; at-risk ✓; same stage ✓; non-redundant (`calculate-mean-median-mode-range` operates on a raw list) ✓.

### 3. `identify-survey-bias`
```json
{ "id": "identify-survey-bias", "title": "Identify bias in surveys", "blurb": "Identify sources of bias in a sample or survey question, including selection, volunteer, survivorship and questioning (leading/ambiguous) bias.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-dan-3"], "prereqs": ["census-vs-sample"], "difficulty": 2 }
```
- **Trace:** "Bias in Sampling Methods" (selection/small-sample/volunteer/survivorship, table + Identify practice) and "Questionnaire Design" (leading/ambiguous/too-few-choices, Identify a–f + Foundation Q1–Q4).
- **Bar:** Distinctive (why sampled data is unrepresentative — feeds dan-3 "draw informed conclusions about data gathered using sampling") ✓; at-risk ✓; same stage — earliest genuine stage; s5 `evaluate-sampling-methods` is a Path extension ✓; non-redundant ✓.
- **Placement note:** Stretches past the literal dan syllabus wording (bias is arguably MA4-DAT-C-01 collection territory), but no other Stage 4 booklet covers it and dan-3 is the nearest home. Sampling + questioning bias bundled into one skill for leanness.

## Borderline → EXCLUDE

- **`median-from-cumulative-histogram`** — graph-reading variant; folded into `summary-stats-frequency-table` / `represent-data-graphs`.
- **`stats-from-stem-leaf-dot-plot`** — read dataset off the display (`represent-data-graphs`) then apply `calculate-mean-median-mode-range`; no new routine.
- **`stats-with-calculator/spreadsheet`** — tool operation.

## Considered and omitted (audit trail)

- Range/mode/mean/median/summary stats from a list; modality; compare datasets — `calculate-mean-median-mode-range`, `modality`, `measures-of-centre`, `compare-datasets-measures`.
- Clusters/gaps/outliers; impact of adding/removing values and outliers; best measure — `clusters-gaps-outliers`, `effect-on-measures-centre`, `choose-measure-of-centre`.
- Shape/skew; census vs sample; draw conclusions — `shape-of-distribution`, `skew-and-measures`, `census-vs-sample`, `draw-conclusions-data`.
- "Mean of algebraic expressions" (Mean Q6) — cross-topic.

## Net change

- 3 new skills: `find-value-from-mean`, `summary-stats-frequency-table`, `identify-survey-bias`.
- 0 new edges into existing skills, 0 re-scopes.
