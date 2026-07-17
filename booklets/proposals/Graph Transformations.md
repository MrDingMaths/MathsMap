# Graph Transformations — atomisation proposal

**Status: APPLIED** (1 new skill, 1 new edge, 0 re-scopes; `npm run validate` clean).

**Context.** Booklet `Stage 6 Advanced/Graph Transformations.md` (NEW, no OLD counterpart). Target `t-s6adv11-transform`, dot points `dp-s6adv11-transform-1`…`-6`. Goal: check whether the NEW booklet's routines are fully covered by the existing transform skill cluster.

**Finding (headline).** Topic is already densely covered. All six dot points map to existing skills:

| dp | skill |
|---|---|
| -1 reflections | `transform-reflections` |
| -2 translations | `transform-translations` |
| -3 dilations | `transform-dilations` |
| -4 apply combined | `apply-combined-transformations` |
| -5 circles via translation/CTS | `circle-equation-general` |
| -6 order matters | `order-of-transformations` |

One routine is not covered: the reverse direction — given a transformed rule (e.g. `y = f(2x+6)` or `y = -⅓|x+3|+2`), rewrite to standard form and describe the sequence of transformations. The forward skill `apply-combined-transformations` goes transformations → rule/graph; this goes rule → transformations. It has its own method box in the booklet ("Identifying the Transformations from the Equation") and is a heavily-assessed HSC type.

## 1. Recommended new skill

**`describe-transformations-from-equation`**

| field | value |
|---|---|
| id | `describe-transformations-from-equation` |
| title | Describe transformations from an equation |
| blurb | Given a transformed function rule, rewrite it as $\frac{y-c}{k}=f\left(a(x-b)\right)$ and describe the sequence of reflections, dilations and translations applied. |
| stage | 6 |
| courses | `["s6-adv11"]` |
| dotPointIds | `["dp-s6adv11-transform-4"]` |
| difficulty | 3 |
| prereqs | `["apply-combined-transformations"]` |
| atom type | Routine (R) |

```json
{
  "id": "describe-transformations-from-equation",
  "title": "Describe transformations from an equation",
  "blurb": "Given a transformed function rule, rewrite it as $\\frac{y-c}{k}=f\\left(a(x-b)\\right)$ and describe the sequence of reflections, dilations and translations applied.",
  "stage": 6,
  "courses": [
    "s6-adv11"
  ],
  "dotPointIds": [
    "dp-s6adv11-transform-4"
  ],
  "prereqs": [
    "apply-combined-transformations"
  ],
  "difficulty": 3
}
```

**Booklet trace.**
- *Combining Transformations* → method box "Identifying the Transformations from the Equation" (rewrite as `(y−c)/k = f(a(x−b))`) + worked Example "Find the transformations, given the equation" (`y=f(2x+6)` → dilate ½, translate left 3); Guided Practice a–d (`f(3x−5)`, `f(3−x)`, `f((x−2)/3)+5`, `7f((3−2x)/3)+1`).
- *Exam Questions* Q7 (`x²`→`1−6x−x²` list the sequence), Q10 (`f(2x−1)`), Q11 (`√(8x³+1)`→`√(x³+1)` identify dilation).

**Edge-bar (`describe-transformations-from-equation ← apply-combined-transformations`).**
1. *Distinctive* — fluency with the forward mapping (each `x→a(x−b)`, `y→(y−c)/k` step) is the characteristic enabler of reading a rule backwards; not ambient algebra.
2. *At-risk* — a student who can apply a given sequence can still be shaky reverse-engineering one (choosing a valid order, handling `f(3−x)` sign).
3. *Stage-proximity* — same stage/topic.
4. *Non-redundant* — reverse direction is not reachable from any forward skill; the standard-form method is unique to it.

## 2. Recommended new prereq edges
Only the one bundled in §1 (`describe-transformations-from-equation ← apply-combined-transformations`).

## 3. Edits to existing skills
None. Existing blurbs stay as-is (all forward-direction, correctly scoped).

## 4. Borderline candidates → EXCLUDE
- **Identify a single translation/dilation from two equations** (equate-coefficients, booklet "Identifying Translations/Dilations" boxes). EXCLUDE — reading `x−a` / `x/k` in reverse is the same fact as the forward `transform-translations`/`transform-dilations` skills; carving two more micro-skills = pollution. The genuinely new combined reverse routine is captured by §1.
- **Sketch a transformed graph from `y=f(x)`** (Guided Practice, "Sketch the transformation given the graph"). EXCLUDE — this is `apply-combined-transformations` (its blurb already covers "graph"); the description step is §1.
- **Complete the square to list transformations** (Exam Q7). EXCLUDE — CTS is an existing cross-topic skill; grafting it isn't a new transform atom (scope rule: no cross-topic prereqs).

## 5. Considered-and-omitted
- Single reflections/translations/dilations (dp-1/2/3) — covered.
- Commutativity / order-matters investigation — `order-of-transformations`.
- Circle centre–radius by CTS, `x²+y²+ax+by+c=0` — `circle-equation-general` (dp-5).
- Absolute-value / power-function targets (`|x|`, `3x^(5/2)`) — transformation routine is identical; abs-value belongs to the functions topic, not here.

**Net change:** 1 new skill, 1 new edge, 0 re-scopes.
