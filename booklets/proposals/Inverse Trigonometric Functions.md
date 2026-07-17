# Inverse Trigonometric Functions — atomisation proposal

**Status: APPLIED** (2026-07-17). `npm run validate` clean. +2 new skills, +2 new edges, 0 re-scopes.

## Context
Topic `t-s6x1y12-invtrig` (Stage 6 Ext 1, Year 12), dot points `dp-s6x1y12-invtrig-1`
(definitions/evaluate) and `-2` (graphs/parity/properties/composites/transforms).
Booklets: `Stage 6 Extension 1/Inverse Trigonometric Functions 1_Definitions of inverse
trigonometric functions.md`, `2_Graphs of trigonometric functions.md`. Goal: find routine
atoms not yet in the skill graph.

## Finding (headline)
**Near-saturated.** 8 pre-seeded skills span both dot points, correctly wired:
`restrict-trig-for-inverse → define-inverse-trig → {evaluate-inverse-trig, graph-inverse-trig}`,
then `graph-inverse-trig → {inverse-trig-parity, inverse-trig-properties,
inverse-trig-composite-graphs, transform-inverse-trig}`. Every booklet section maps to an
existing skill **except two distinct, heavily-drilled evaluation routines** with no home:

1. **Trig of a *different* inverse trig via a right triangle** — e.g. `sin(arccos(3/5))`,
   `tan(arcsin(−1/5))`. Neither `evaluate-inverse-trig` (angle-out, exact values) nor
   `inverse-trig-composite-graphs` (same-family `sin(arcsin x)` / `arcsin(sin x)`) covers it.
2. **Double/compound angles applied to inverse trig** — e.g. `cos(2 arcsin(4/5))`,
   `tan(arcsin(12/13) − arccos(4/5))`. A whole applications chapter, 4 named HSC questions.

## 1. Recommended new skills

### A. `evaluate-trig-of-inverse-trig`

| field | value |
|---|---|
| id | `evaluate-trig-of-inverse-trig` |
| title | Evaluate trig of an inverse trig function |
| blurb | Find the exact value of a trigonometric function applied to a *different* inverse trig function, such as $\sin(\arccos x)$, by drawing a right-angled triangle and using the inverse's range to fix the quadrant and sign. |
| stage | 6 |
| courses | `["s6-ext1-12"]` |
| dotPointIds | `["dp-s6x1y12-invtrig-1"]` |
| difficulty | 3 |
| prereqs | `["define-inverse-trig"]` |
| atom type | Routine (R) |

```json
{
  "id": "evaluate-trig-of-inverse-trig",
  "title": "Evaluate trig of an inverse trig function",
  "blurb": "Find the exact value of a trigonometric function applied to a *different* inverse trig function, such as $\\sin(\\arccos x)$, by drawing a right-angled triangle and using the inverse's range to fix the quadrant and sign.",
  "stage": 6,
  "courses": ["s6-ext1-12"],
  "dotPointIds": ["dp-s6x1y12-invtrig-1"],
  "difficulty": 3,
  "prereqs": ["define-inverse-trig"]
}
```

**Trace.** Bk 1, §"Evaluating the composition of Inverse Trigonometric Functions" — 5-step
method box (let α = inner; rearrange; **identify quadrant using range + sign**; draw right
triangle; evaluate); Examples `tan(arcsin(−1/5))`, `sin(arccos(−4/5))`; Practice
`cos(arcsin(−1/4))`, `tan(arccos(−2/5))`; **Foundation Q2 a–i** (`sin(arccos(3/5))` …
`sin(arccos(−3/5))`); Development Q6 (`show cos(arcsin x)=√(1−x²)`).

**Edge bar (`… ← define-inverse-trig`).** ① *Distinctive* — the characteristic step is using
the inverse's **range** to pin the quadrant/sign of the constructed triangle; that range comes
from the definition. (SOHCAHTOA/Pythagoras triangle-reading is ambient Stage-5 algebra →
omitted, rule 1.) ② *At-risk* — students routinely drop the sign or pick the wrong quadrant
for negative arguments (`arccos(−4/5)` → Q2). ③ *Proximity* — same stage/topic.
④ *Non-redundant* — not reachable; `evaluate-inverse-trig` is angle-out via exact values, a
different method.

### B. `inverse-trig-double-compound-angle`

| field | value |
|---|---|
| id | `inverse-trig-double-compound-angle` |
| title | Double and compound angles with inverse trig |
| blurb | Find exact values of expressions such as $\cos(2\arcsin x)$ or $\tan(\arcsin a - \arccos b)$ by applying double- and compound-angle identities to inverse trig values found from right-angled triangles. |
| stage | 6 |
| courses | `["s6-ext1-12"]` |
| dotPointIds | `["dp-s6x1y12-invtrig-1"]` |
| difficulty | 3 |
| prereqs | `["evaluate-trig-of-inverse-trig"]` |
| atom type | Routine (R) |

```json
{
  "id": "inverse-trig-double-compound-angle",
  "title": "Double and compound angles with inverse trig",
  "blurb": "Find exact values of expressions such as $\\cos(2\\arcsin x)$ or $\\tan(\\arcsin a - \\arccos b)$ by applying double- and compound-angle identities to inverse trig values found from right-angled triangles.",
  "stage": 6,
  "courses": ["s6-ext1-12"],
  "dotPointIds": ["dp-s6x1y12-invtrig-1"],
  "difficulty": 3,
  "prereqs": ["evaluate-trig-of-inverse-trig"]
}
```

**Trace.** Bk 2, §"Applications involving Double and Compound Angles" — identity box;
Foundation Q1 (`cos(2 arcsin(4/5))` scaffolded), Q2 a–d (`sin(2 arccos(3/5))`,
`tan(2 arcsin(1/3))`…), Q3 (`tan(arcsin(12/13) − arccos(4/5))`); Development **Q4 2012 HSC**,
**Q5 Sample HSC** (`sin(arccos(12/13)+arctan(3/4))`), **Q6 billboard**
(`show θ=arctan(6x/(x²+16))`).

**Edge bar (`… ← evaluate-trig-of-inverse-trig`).** ① *Distinctive* — before applying `sin 2A`
/ `tan(A−B)`, you must convert each `arcsin`/`arccos`/`arctan` into `sin A`, `cos A`, `tan A`
via a triangle — exactly skill A. ② *At-risk* — the triangle/quadrant step is the common
failure point on these HSC items. ③ *Proximity* — same stage/topic. ④ *Non-redundant* — no
path reaches it. **The double/compound-angle identities themselves are cross-topic
(`t-s6x1y11-trig`) → not added as prereqs, per scope rules;** they are the tool, inverse trig
is the routine.

## 2. Recommended new prereq edges
Only the two new-skill edges above: `evaluate-trig-of-inverse-trig ← define-inverse-trig`,
`inverse-trig-double-compound-angle ← evaluate-trig-of-inverse-trig`.

## 3. Edits to existing skills
None. No blurb overclaims either new routine (`evaluate-inverse-trig` = angle-out;
`inverse-trig-composite-graphs` = same-family composites).

## 4. Borderline candidates → EXCLUDE
- **`arcsin(sin x)` equivalent-angle evaluation** (Bk 2 Examples, Foundation Q1–2, Development
  Q3) — covered by `inverse-trig-composite-graphs` (blurb explicitly names `arcsin(sin x)`);
  "analyse composites" spans evaluation. Redundant.
- **Billboard/viewing-angle modelling** (Bk 2 Q6) — `show θ=arctan(…)` is a `tan(α−β)`
  compound-angle application → folds into skill B, not its own node.
- **`solve arccos x = arcsin(−5/13)` "no solution"** (Bk 2 Q8) — range-comparison reasoning,
  reachable via `define-inverse-trig` / `inverse-trig-properties`. Too thin.
- **Sketch `y=sin⁻¹|x|`, `y=cos(arcsin x)`, add-ordinates** (Bk 1 Q5b, Q6b, Q7) —
  transformation/graphing → `transform-inverse-trig`, `graph-inverse-trig`.
- **Find inverse by swapping `x`/`y`** (Bk 1 Q4) — general `find-inverse-function` (exists,
  s6-ext1-11); cross-topic, not intrinsic.

## 5. Considered-and-omitted (already covered)
- Restrict domains / define / domain-range → `restrict-trig-for-inverse`, `define-inverse-trig`.
- Evaluate `arccos(1/2)` via reference angle → `evaluate-inverse-trig`.
- The four inverse-trig identities + simplify → `inverse-trig-parity`, `inverse-trig-properties`.
- Direct composites `sin(arcsin x)=x`, domains, graphs → `inverse-trig-composite-graphs`.
- Odd/even classification, transformations → `inverse-trig-parity`, `transform-inverse-trig`.

## Net change (applied)
**+2 new skills** (`evaluate-trig-of-inverse-trig`, `inverse-trig-double-compound-angle`),
**+2 new edges**, **0 re-scopes.**
