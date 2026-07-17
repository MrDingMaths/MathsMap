---
status: applied
---

# Proposal — Atomise Bivariate Data Analysis (Stage 6 Standard Y12, topic `t-s6st12-bivariate`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (1 new skill, 1 new edge, 1 re-scope); `npm run validate` clean. QUEUE.md row 61 → applied.

## Context

Queue row 61. Two booklets: `Bivariate Data Analysis 1_Bivariate datasets.md`, `2_Scatterplots and lines of best fit.md` (MST-12-S2-08), dp-1–4. Nine skills already sit on these dot points (dual-tagged from the Stage 5 Data Analysis B pass, plus three s6-only regression skills).

## Finding (headline)

The Stage 5 Data Analysis B pass pre-tagged the spine (`bivariate-data`, `independent-dependent-variables`, `scatter-plot`, `describe-association`, `line-of-best-fit`, `interpolation-extrapolation`, `equation-line-of-best-fit`, `correlation-coefficient`, `least-squares-regression`). One genuine gap: prediction by **substituting into the regression equation** (§Interpolating and Extrapolating using the Equation) — full taught section, algebraic (not the graphical read-off `interpolation-extrapolation` covers), with the reverse case (given $y$, solve for $x$) and the "which variable is given" decision. Plus one tag: `outlier-effect-line-best-fit`, drilled here but stuck at `s5-core`.

| Booklet section | dp | Skill |
|---|---|---|
| B1 §Bivariate Data (indep/dep vars) + §Correlation ≠ Causation | dp-1 | `bivariate-data`, `independent-dependent-variables` ✓ |
| B2 §Scatterplots + §Interpreting a Scatterplot | dp-2 | `scatter-plot` ✓ |
| B2 §Line of Best Fit (draw by eye, judge) | dp-3 | `line-of-best-fit` ✓ |
| B2 §Line of Best Fit Dev Q4–6 (outlier → gradient) | dp-3 | `outlier-effect-line-best-fit` — tag §3a |
| B2 §Correlation (form/direction/strength) | dp-2 | `describe-association` ✓ |
| B2 §Interpolation and Extrapolation (graphical) | dp-3 | `interpolation-extrapolation` ✓ |
| B2 §Equation of a Line of Best Fit (interpret m, c) | dp-3 | `equation-line-of-best-fit` ✓ |
| B2 §Interpolating and Extrapolating using the Equation | dp-3 | new `predict-from-regression-equation` §1a |
| B2 §Pearson's r + §Analysis using a Calculator | dp-4 | `correlation-coefficient`, `least-squares-regression` ✓ |

## 1. New skills (applied)

### a. `predict-from-regression-equation`

| Field | Value |
|---|---|
| id | `predict-from-regression-equation` |
| title | Make predictions using the regression equation |
| blurb | Substitute a value into a line-of-best-fit equation $y = a + bx$ to predict the other variable, deciding whether the given value is $x$ or $y$ and rearranging to solve when the dependent variable is given. |
| stage 6 · courses `["s6-std12"]` · dotPointIds `["dp-s6st12-bivariate-3"]` · difficulty 2 · prereqs `["equation-line-of-best-fit"]` · atom R |

**Trace:** B2 §Interpolating and Extrapolating using the Equation — own 3-step method box, two worked examples (forward $x=45$; reverse $y=25$ → rearrange to $x$) with "why did we use $x=45$ / $y=45$?" identify-the-variable prompts, Foundation sets; re-used in §Analysis using a Calculator Q2–3 (find equation → predict → "is this extrapolation?").

**Bar:** distinctive (algebraic substitute/rearrange keyed to identifying which variable is given, not graphical line-reading); at-risk (reverse case — given dependent, solve for independent — is the documented confusion); stage 6 first algebraic treatment (Stage 5 DA-B graphical only); non-redundant (`interpolation-extrapolation` reads off the line; `equation-line-of-best-fit` finds/interprets the equation but stops before predicting with it). Structural analogue of the `area-rule-reverse` lift (row 57). dp-3 home.

## 2. New prereq edges (applied)

`predict-from-regression-equation ← equation-line-of-best-fit` — need the equation before substituting; distinctive, at-risk, same stage, non-redundant.

## 3. Edits to existing skills (applied)

**a. `outlier-effect-line-best-fit` — tag re-scope.**
- courses: `["s5-core"]` → `["s5-core", "s6-std12"]`; dotPointIds: + `dp-s6st12-bivariate-3`
- Trace: B2 §Line of Best Fit Development Q4 (computer-drawn line, "outlier makes gradient less steep; removing it → steeper"), Q5 (50 L tank, more-negative/steeper), Q6 (study hours, more-positive/steeper). Full drills, was s5-only.

## 4. Borderline candidates → EXCLUDE

- **`interpret-scatterplot-values`** (B2 §Interpreting a Scatterplot — read a point's value, count above threshold). Entry step of `scatter-plot`; not separable.
- **`match-r-to-scatterplot`** (B2 §Pearson's r F Q1–5, five HSC MC). Interpretation drills inside `correlation-coefficient` ("calculate **and interpret** … $r$").
- **`interpret-gradient-intercept-context`** (B2 §Equation F Q1–3). Already the explicit content of `equation-line-of-best-fit`.
- **Splitting graphical interpolation vs extrapolation** — one routine with a range caveat, under `interpolation-extrapolation`.

## 5. Considered-and-omitted

- **Booklet gap (no graph change):** B2 §Bivariate Data Analysis using a Spreadsheet — matches the syllabus spreadsheet bullet but standing spreadsheet-gap genre (rows 46+); no skill.
- B1 causal-vs-correlation reasoning → `bivariate-data`'s "association from causation" clause.
- B1 independent/dependent identification → `independent-dependent-variables`.
- Form/direction/strength classification → `describe-association`.
- Draw-by-eye / judge-appropriateness / "explain why not a line of best fit" → `line-of-best-fit`.
- Calculator keystrokes (CASIO FX-82/8200 2-var mode) → procedure inside `correlation-coefficient` / `least-squares-regression`.
- "Only 4 data points / bad axes" critique (B2 §Correlation Q10) → limitations comment, absorbed in `describe-association`/`interpolation-extrapolation`.

## Net change applied

- **+1 skill** (`predict-from-regression-equation`)
- **+1 edge** (`predict-from-regression-equation ← equation-line-of-best-fit`)
- **1 re-scope:** `outlier-effect-line-best-fit` (tag +s6-std12/+dp-bivariate-3)
