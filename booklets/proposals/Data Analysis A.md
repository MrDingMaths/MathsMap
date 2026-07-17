# Data Analysis A (Stage 5 Core) — atomisation proposal

**Status: APPLIED** — approved 2026-07-17; applied to `data/skills.json`;
`npm run validate` clean (1146 skills, 0 warnings).

## Context

Booklets:

- `Stage 5/Data Analysis A 1_Standard Deviation.md`
- `Stage 5/Data Analysis A 2_Quartiles and Box Plots.md`
- `Stage 5/Data Anaylsis A 3_Grouped Data.md`

Target: topic `t-s5c-dat-a` (MA5-DAT-C-01), dot points `dp-s5c-data-1`
(standard deviation), `dp-s5c-data-2` (quartiles/IQR), `dp-s5c-data-3` (box
plots).

## Finding (headline)

The six existing skills cover the *core* of all three dot points, but booklet 2
is a 2212-line booklet whose later half teaches four routines with no graph
presence: five-number summary from stem-and-leaf/dot plots, quartiles from a
cumulative histogram, box plot percentages, and the formal 1.5 × IQR outlier
definition. Booklet 1 adds one genuinely missing routine (effect of data changes
on standard deviation). Booklet 3 (Grouped Data) is out of syllabus scope for
this topic — see §0.

## 0. Scope decisions (user, 2026-07-17)

Two items in these booklets are taught at Stage 5 Core but modelled in the graph
at Stage 6. Both were put to the user; both **stay at Stage 6**:

1. **Grouped data (booklet 3, entire).** Booklet 3 has no syllabus-content block
   and teaches grouped frequency tables, grouped histograms, estimating the mean
   via class centres and estimating the median from an ogive. None of that is in
   `dp-s5c-data-1/2/3`. `grouped-data` stays at stage 6 on `dp-s6st11-data-4`.
   **Booklet 3 yields no graph change.**
2. **Formal definition of an outlier (booklet 2, §Formal Definition of an
   Outlier, p33+).** Taught in full at Stage 5 Core — definition box, worked
   example, guided practice, Foundation Q1 a–f, Development, Mastery. The
   "earliest genuine stage" rule would put it at stage 5; the user has ruled it
   **stays at stage 6**. `identify-outliers-iqr` is untouched (stage 6,
   `dp-s6st11-data-8` only). `dp-s5c-data-2` therefore does not reach it — this
   is a deliberate decision, not an oversight.

Consequence for §1.2 below: booklet 2's cumulative-histogram section mixes
grouped and ungrouped data, so the new skill is scoped to **ungrouped only**.

## 1. Recommended new skills

### 1.1 `five-number-summary-from-displays`

| Field | Value |
|---|---|
| id | `five-number-summary-from-displays` |
| title | Determine the five-number summary from a display |
| blurb | Read the five-number summary from a stem-and-leaf plot or dot plot and represent it as a box plot. |
| stage | 5 |
| courses | `s5-core` |
| dotPointIds | `dp-s5c-data-2` |
| difficulty | 2 |
| prereqs | `five-number-summary`, `represent-data-graphs` |
| atom type | Routine |

```json
{
  "id": "five-number-summary-from-displays",
  "title": "Determine the five-number summary from a display",
  "blurb": "Read the five-number summary from a stem-and-leaf plot or dot plot and represent it as a box plot.",
  "stage": 5,
  "courses": ["s5-core"],
  "dotPointIds": ["dp-s5c-data-2"],
  "prereqs": ["five-number-summary", "represent-data-graphs"],
  "difficulty": 2
}
```

**Booklet trace.** Booklet 2, §Five-Number Summary from Stem-and-Leaf and Dot
Plots (p23) — two worked examples, guided practice for each display type,
Foundation Q1 (a–f stem-and-leaf), Q2 (a–f dot plots), Development Q3–Q4
(summary + draw the box plot).

**Why not already covered.** `five-number-summary`'s blurb was "Find the
minimum, quartiles, median and maximum of a **dataset**" — the ordered-list
case. The syllabus lists "Determine the 5-number summary from **graphical
representations**" as a separate bullet, and the booklet gives it its own
section. Reading counts off a dot plot is a different act from ordering a list.

**Edge bar.** `← five-number-summary`: distinctive (the summary itself is the
routine being transferred); at-risk (miscounting repeated dots is the standard
error); same stage; non-redundant. `← represent-data-graphs`: distinctive (you
cannot read a stem-and-leaf plot without knowing its structure); at-risk
(stem-and-leaf place value trips students); stage 4 → 5, within one stage;
non-redundant.

**Nearest dot point.** `dp-s5c-data-2` — the syllabus bullet "Determine the
5-number summary from graphical representations" sits under it.

### 1.2 `quartiles-from-cumulative-histogram`

| Field | Value |
|---|---|
| id | `quartiles-from-cumulative-histogram` |
| title | Determine quartiles from a cumulative histogram |
| blurb | Find quartile positions as $0.25$, $0.5$ and $0.75$ of the total frequency and read the corresponding values from a cumulative frequency histogram of ungrouped data. |
| stage | 5 |
| courses | `s5-core` |
| dotPointIds | `dp-s5c-data-2` |
| difficulty | 2 |
| prereqs | `five-number-summary-from-displays` |
| atom type | Routine |

```json
{
  "id": "quartiles-from-cumulative-histogram",
  "title": "Determine quartiles from a cumulative histogram",
  "blurb": "Find quartile positions as $0.25$, $0.5$ and $0.75$ of the total frequency and read the corresponding values from a cumulative frequency histogram of ungrouped data.",
  "stage": 5,
  "courses": ["s5-core"],
  "dotPointIds": ["dp-s5c-data-2"],
  "prereqs": ["five-number-summary-from-displays"],
  "difficulty": 2
}
```

**Booklet trace.** Booklet 2, §Five-Number Summary from Cumulative Histograms
(p27) — its own 5-step method box, worked example, three guided practice items.

**Grouped vs ungrouped — the section is mixed.** Verified by reading the linked
PNGs, since the printed answers looked inconsistent:

- **Worked example + all guided practice** (`image99`, `image98`, `image103`,
  `image105`) are **ungrouped** — columns sit at single integer values
  ($x = 1..7$; $x = 17..23$) and the value is read off exactly. Answers are exact
  (1, 2, 3, 5, 7), not estimates.
- **Foundation Q1** (`image106`, `image108`) is **grouped** — the axis carries
  class centres (45.5, 55.5, 65.5…; 61, 64, 67, 70, 73 for width-3 classes), an
  ogive is drawn across the columns, and the answers are genuine estimates read
  off the curve.

The processes differ, and the booklet's own worked example does not teach the
grouped process it then sets in Q1. Per §0 decision 1, this skill is scoped to
**ungrouped only**; the grouped half is deferred to row 53. Dropping the
estimation-from-ogive half also drops the difficulty from 3 to **2**, in line
with its neighbours.

**Booklet erratum (not a graph change).** The ogive worked example says "Total
scores: 120", but `image99` totals **40** and every position that follows uses 40
($0.25 \times 40 = 10$). Stale number in the booklet source.

**Edge bar** (`← five-number-summary-from-displays`): distinctive (same target
quantity, harder display — a progression chain per the rubric); at-risk
(converting a position into an $x$-value is the whole difficulty); same stage;
non-redundant.

**Nearest dot point.** `dp-s5c-data-2`, as for 1.1.

### 1.3 `box-plot-percentages`

| Field | Value |
|---|---|
| id | `box-plot-percentages` |
| title | Find proportions and counts from a box plot |
| blurb | Use the fact that each region of a box plot holds $25\%$ of the data to find what proportion or how many values lie in a given range. |
| stage | 5 |
| courses | `s5-core` |
| dotPointIds | `dp-s5c-data-3` |
| difficulty | 2 |
| prereqs | `box-plots` |
| atom type | Fact + Routine |

```json
{
  "id": "box-plot-percentages",
  "title": "Find proportions and counts from a box plot",
  "blurb": "Use the fact that each region of a box plot holds $25\\%$ of the data to find what proportion or how many values lie in a given range.",
  "stage": 5,
  "courses": ["s5-core"],
  "dotPointIds": ["dp-s5c-data-3"],
  "prereqs": ["box-plots"],
  "difficulty": 2
}
```

**Booklet trace.** Booklet 2, §Box Plot Percentages (p16) — own review box
(percentage of a quantity), theorem box ("each part of the box plot is 25% of
the dataset"), worked example (200 students: "How many scored more than 50?" →
200 × 0.75 = 150), guided practice, Foundation Q1 (a–o), Q2 (a–c), Development
Q3 (a–g), Q4 (a–g).

**Why not already covered.** `box-plots` is construct-from-summary;
`compare-box-plots` is comparison. Neither reaches the quartile-as-proportion
idea. The syllabus bullet "Interpret box plots to draw conclusions and make
inferences about the dataset" is this. One of the densest practice blocks in the
booklet.

**Edge bar** (`← box-plots`): distinctive (the 25%-per-region fact is meaningless
without knowing what the regions are); at-risk (students read the *box* as 25%
rather than 50%, the classic error); same stage; non-redundant.

**Nearest dot point.** `dp-s5c-data-3` — box plot interpretation.

### 1.4 `effect-of-changes-on-sd`

| Field | Value |
|---|---|
| id | `effect-of-changes-on-sd` |
| title | Explain the effect of data changes on standard deviation |
| blurb | Reason about how adding a constant to every value, or adding a new value, changes the mean and the standard deviation. |
| stage | 5 |
| courses | `s5-core` |
| dotPointIds | `dp-s5c-data-1` |
| difficulty | 3 |
| prereqs | `standard-deviation` |
| atom type | Comparative + Category |

```json
{
  "id": "effect-of-changes-on-sd",
  "title": "Explain the effect of data changes on standard deviation",
  "blurb": "Reason about how adding a constant to every value, or adding a new value, changes the mean and the standard deviation.",
  "stage": 5,
  "courses": ["s5-core"],
  "dotPointIds": ["dp-s5c-data-1"],
  "prereqs": ["standard-deviation"],
  "difficulty": 3
}
```

**Booklet trace.** Booklet 1, Development Q4 a–d (add 2 marks to every test →
mean rises, SD unchanged; score 15 on every test → SD zero; score at the mean →
SD decreases; score 0 → SD increases), Mastery Q5b (NAPLAN: $20 pay rise,
explain the effect on SD), Mastery Q7 (HSC: Y9 vs Y12 dot plots).

**Why not already covered.** `effect-on-measures-centre` (stage 4) is
"adding/removing values and outliers affect **centre and range**" — it does not
reach standard deviation, which is not taught until stage 5. This is the
invisible atom of the topic: no calculation, pure reasoning about spread, and it
is where the HSC/NAPLAN questions live.

**Edge bar** (`← standard-deviation`): distinctive (SD is the quantity being
reasoned about); at-risk (a student who can drive the calculator routinely
cannot say why a constant shift leaves SD alone); same stage; non-redundant.

An edge `← effect-on-measures-centre` was considered and rejected: a stage-4 →
stage-5 link to a skill about *different measures*. The reasoning transfers, but
the *distinctive* test asks for the characteristic enabler, and that is
`standard-deviation`.

**Nearest dot point.** `dp-s5c-data-1` — standard deviation as a measure of
spread.

## 2. Recommended new prereq edges

None standalone. Five edges are carried by the four new skills in §1.

## 3. Edits to existing skills

**`five-number-summary`** — narrow the blurb to its now-base meaning (the
ordered-list case), since §1.1 lifts the display case downstream.

- Before: "Find the minimum, quartiles, median and maximum of a dataset."
- After: "Find the minimum, quartiles, median and maximum of a dataset given as
  an ordered list."

**`identify-outliers-iqr`** — **no change**, per §0 decision 2.

## 4. Borderline candidates → EXCLUDE

| Candidate | Reason |
|---|---|
| `standard-deviation-from-frequency-table` | Booklet 1 Q3 a–f, and both calculators get an explicit Freq-column walkthrough. But `standard-deviation`'s blurb is already "using digital tools", and `summary-stats-frequency-table` (stage 4) covers reading a frequency table. Splitting the calculator's Freq toggle into a skill is graph pollution. |
| `compare-spread-from-displays` | Booklet 1 §Interpret box, Q6 (HSC: positively skewed with smaller SD), Q7. Distinctive but `standard-deviation`'s blurb already says "compare datasets", and `skewness-from-displays` covers the shape half. Fails *non-redundant*. |
| `box-plots ← five-number-summary-from-displays` | The syllabus bullet says "determine quartiles from histograms and dot plots **and represent these as a box plot**", so it is tempting. But `box-plots ← five-number-summary` already exists, and §1.1 sits downstream of that — adding this edge would make the graph claim you need the *display* case before you can draw any box plot, which is false. |
| `range-vs-iqr-merits` | Booklet 2 Q6 (add 23 to the dataset → IQR unchanged, range jumps 6 → 21). Already explicitly in `interquartile-range`'s blurb. |
| `skewness-of-box-plots` | Booklet 2 §Skewness of Box Plots (p33). Already `skewness-from-displays`, whose blurb names box plots. |
| `estimate-mean-grouped-data` | Booklet 3 only. Excluded under §0 decision 1 — no Stage 5 dot point to attach it to. Flagged in §5 as an open gap for row 53. |

## 5. Considered-and-omitted

- **Quartiles, IQR, five-number summary from lists** (Booklet 2 §Quartiles,
  §Five-Number Summary and IQR) — `five-number-summary`, `interquartile-range`.
- **Constructing and interpreting box plots** (Booklet 2 §Box Plots) —
  `box-plots`.
- **Parallel box plot comparison** (Booklet 2 §Comparing Datasets with Box
  Plots) — `compare-box-plots`.
- **Calculating SD with a calculator** (Booklet 1 §Standard Deviation using a
  Calculator, Foundation Q1) — `standard-deviation`.
- **Population vs sample SD ($\sigma_x$ vs $s_x$)** (Booklet 1) — the booklet's
  rule is "always use $\sigma_x$ unless told otherwise", i.e. a convention, not a
  routine. Fails *distinctive*.
- **Median review** (Booklet 2 §Review boxes) — `calculate-mean-median-mode-range`
  (stage 4).
- **Percentage of a quantity** (Booklet 2 §Box Plot Percentages review box) —
  ambient stage 4 FDP, fails *distinctive*.
- **Formal outlier definition** (Booklet 2 §Formal Definition of an Outlier) —
  stays stage 6 per §0 decision 2. `identify-outliers-iqr` untouched.
- **OPEN GAP — grouped data (booklet 3 entire, plus booklet 2 Foundation Q1 of
  the ogive section).** Per §0 decision 1 these yield no graph change. Two things
  stay uncovered anywhere in the graph: **estimating the mean from class
  centres** ($\overline{x} = \Sigma(cc \times f)/\Sigma f$) and **estimating
  quartiles/median from an ogive over grouped classes**. `grouped-data` (stage 6)
  covers only *constructing* grouped tables and graphs. Catch this at **queue row
  53** (Stage 6 Standard Data Analysis, `dp-s6st11-data-4`), where
  `Stage 6 Standard/Data Analysis 4_Display and interpret grouped and ungrouped data.md`
  should trace it.

## Net change

4 new skills, 0 standalone new edges (5 carried by the new skills), 1 blurb
re-scope. Booklets 3 and the grouped half of booklet 2's ogive section: no
change, per §0.
