# Data Analysis B (Stage 5 Core) — atomisation proposal

**Status: APPLIED** — approved 2026-07-17; applied to `data/skills.json`;
`npm run validate` clean (1147 skills, 0 warnings).

## Context

Booklet: `Stage 5/Data Analysis B_Bivariate Data.md` (NEW; supersedes all 3 OLD
Data Analysis B files).

Target: topic `t-s5c-dat-b` (MA5-DAT-C-02), dot points `dp-s5c-datb-1`
(identify/describe bivariate datasets), `dp-s5c-datb-2` (scatter plot + line of
best fit by eye), `dp-s5c-datb-3` (interpret using graphical representations).

## Finding (headline)

Densest pre-existing coverage of any group so far. Six Stage-5 skills
(`bivariate-data`, `independent-dependent-variables`, `scatter-plot`,
`line-of-best-fit`, `describe-association`, `interpolation-extrapolation`)
already blanket the three dot points, and three Stage-6 skills
(`equation-line-of-best-fit`, `correlation-coefficient`,
`least-squares-regression`) cover the booklet's back half. One genuinely
missing routine: reasoning about an outlier's effect on the line of best fit.

## 0. Scope decision (mirrors Data Analysis A §0)

**Back half of the booklet is Stage 6 Standard content taught at Stage 5
Core.** Sections §Equation of a Line of Best Fit, §Interpolating and
Extrapolating using the Equation, §Pearson's $r$ value, §Bivariate Data
Analysis using a Calculator, §using a Spreadsheet all sit under
`dp-s6st12-bivariate-3`/`-4`, not the three Stage-5 dot points (which stop at
line of best fit *by eye*, interpreted *graphically*). Nearly every hard
question there is an HSC Standard question. Existing Stage 6 skills already
cover it. Per the Data Analysis A precedent (grouped data, formal outlier rule
— both stayed Stage 6, user ruling 2026-07-17): **no change** — skills stay
Stage 6, `dp-s5c-datb-*` does not reach them. Confirmed at review 2026-07-17.

## 1. Recommended new skills

### 1.1 `outlier-effect-line-best-fit`

| Field | Value |
|---|---|
| id | `outlier-effect-line-best-fit` |
| title | Explain the effect of an outlier on a line of best fit |
| blurb | Identify an outlier on a scatter plot and explain how removing it changes the gradient of the line of best fit. |
| stage | 5 |
| courses | `s5-core` |
| dotPointIds | `dp-s5c-datb-3` |
| difficulty | 3 |
| prereqs | `line-of-best-fit` |
| atom type | Comparative + Category |

```json
{
  "id": "outlier-effect-line-best-fit",
  "title": "Explain the effect of an outlier on a line of best fit",
  "blurb": "Identify an outlier on a scatter plot and explain how removing it changes the gradient of the line of best fit.",
  "stage": 5,
  "courses": ["s5-core"],
  "dotPointIds": ["dp-s5c-datb-3"],
  "prereqs": ["line-of-best-fit"],
  "difficulty": 3
}
```

**Booklet trace.** §Drawing a Line of Best Fit, Development Q4 (outlier $(8,1)$
makes gradient *less* steep; removal → *steeper*), Q5 (petrol tank: circle
outlier $(6.9, 9.8)$; removal → more negative, steeper), Q6 (study hours:
outlier $(0.3, 10)$; removal → more positive, steeper); §Pearson's $r$ Mastery
Q15 a, e (identify outlier $(45,100)$; describe how $m$ changes); 2021 HSC
Standard 2 (Q13, extra data point → gradient steepens). Recurs across three
sections plus HSC — a routine, not a one-off.

**Why not already covered.** `clusters-gaps-outliers` (stage 4) is informal
identification in univariate displays; `effect-on-measures-centre` reaches
centre and range only; `identify-outliers-iqr` (stage 6) is the formal IQR
rule. Nothing touches an outlier's pull on a fitted line. This is the
invisible atom of the topic — pure comparative reasoning, no calculation, and
where the Development/Mastery/HSC marks live. Direct analogue of
`effect-of-changes-on-sd` from Data Analysis A (same atom type, same
difficulty 3).

**Edge bar** (`← line-of-best-fit`): distinctive — the line's placement
criteria are exactly what the outlier disturbs; at-risk — students who can
draw a good line routinely can't say which way the gradient moves when a point
is removed; same stage; non-redundant.

**Nearest dot point.** `dp-s5c-datb-3` — the act is interpretation of the
graphical representation, not construction. Row 61 (Stage 6 Bivariate) can
dual-list it onto `dp-s6st12-bivariate-3` if those booklets trace it (the HSC
questions suggest they will).

## 2. Recommended new prereq edges

None standalone. One edge carried by the new skill.

## 3. Edits to existing skills

None. No blurb bundles content that this pass lifts out.

## 4. Borderline candidates → EXCLUDE

| Candidate | Reason |
|---|---|
| `evaluate-line-of-best-fit` (judge whether a given line is appropriate — §Drawing, Construct box a–f, Foundation Q3 a–e, Correlation Q8) | Same knowledge as drawing one: the placement criteria (through the middle, balanced points, don't extend past data, straight). Evaluating a line is checking those criteria; splitting it would duplicate `line-of-best-fit`. Fails *distinctive*. |
| `predict-correlation-from-context` (predict sign of correlation between named variables, no plot — Correlation Development Q9 a–h, 2012 HSC MC) | A real question block and HSC-examined, but it is the *direction* concept from `describe-association` applied without a plot, leaning on everyday causal reasoning. Stay-lean call: bundled in `describe-association`. |
| `read-values-scatterplot` (read coordinates off a scatter plot — §Scatterplots Example, Guided Practice, Foundation Q1) | Elementary graph reading; `plot-points-cartesian` territory plus `interpret-graphs-conclusions` (stage 4). Fails *at-risk* at this course level. |
| `confounding-variable` (storks/babies Investigation) | Investigation only — no routine practice questions anywhere in the booklet. Scope rule: routine questions only. |

## 5. Considered-and-omitted

- **Univariate vs bivariate, association vs causation** (§Bivariate Data,
  Investigations) — `bivariate-data` blurb covers both clauses.
- **Independent/dependent identification** (Identify box a–f, equation
  Foundation Q1a–b) — `independent-dependent-variables`.
- **Plotting scatterplots** (Guided Practice, Foundation Q2–4) — `scatter-plot`.
- **Drawing the line by eye** (§Drawing, Foundation Q1–2) — `line-of-best-fit`.
- **Form/strength/direction, zero/perfect vocabulary, hedging "tend to",
  sketch-a-plot-with-given-correlation** (§Correlation throughout) —
  `describe-association`.
- **Graphical interpolation/extrapolation + limitations of the model**
  (§Interpolation and Extrapolation, Foundation + Development Q7–10, 2020/2022
  HSC) — `interpolation-extrapolation`, blurb already says "noting
  limitations".
- **Stage 6 back half, per §0:** interpret gradient/intercept in context →
  `equation-line-of-best-fit`; interpret $r$ → `correlation-coefficient`;
  calculator/spreadsheet regression → `least-squares-regression`. **Open
  question for row 61:** predicting by *substituting into the regression
  equation* (incl. solving for $x$ — §Interpolating and Extrapolating using
  the Equation, 2023/2013 HSC) is only implicitly covered by
  `equation-line-of-best-fit` + `interpolation-extrapolation`; check whether
  the Stage 6 Standard Bivariate booklets warrant lifting it out there.

## Net change if approved

**1 new skill, 0 standalone new edges (1 carried by the new skill), 0
re-scopes.** Back half of booklet: no change, per §0.
