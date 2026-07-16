# Proposal — Atomise `Properties of Geometrical Figures B` (Path) group

**Status: APPLIED** (skills.json updated, `npm run validate` clean — 1136 → 1139
skills). All three proposed skills, the edge reversal and the re-scope were
approved at review.

**Context.** Booklets: `Stage 5 Path/Properties of Geometrical Figures B_1
Identify and explain congruence.md`, `…B_2 Develop and use the conditions for
congruent triangles.md`, `…B_3 Develop and apply the minimum conditions for
triangles to be similar.md`, `…B_4 Establish and apply properties of similar
shapes and solids.md`, `…B_5 Apply logical reasoning to numerical problems
involving plane shapes.md`. Target topic `t-s5p-geo-b`, dot points
**dp-s5p-geo-b-1**–**dp-s5p-geo-b-5**. MA5-GEO-P-01.

**Finding (headline).** Seven skills cover the topic and B2/B3/B4 need nothing —
`congruent-triangle-tests` and `similar-triangle-tests` match their booklets
section-for-section, and B4's whole content is `area-volume-similar-figures`.
Three real gaps sat at the edges:

1. **B1 has a whole "Congruence Statements" section with no skill** — while its
   exact structural twin on the Core side, `similarity-statements`, *is* a skill
   split out of `similar-figures-properties`. The graph was inconsistent:
   congruence kept the statement bundled inside `identify-congruent-figures`,
   similarity didn't.
2. **B5's regular-polygon work was unrepresented** — both angle-sum skills are
   about the *sum*; the booklet spends its Foundation and its entire Mastery
   block on the per-angle formulas and their reverse (find $n$ from the angle).
3. **An existing edge pointed the wrong way.** The graph had
   `interior-angle-sum-polygon ← exterior-angle-sum-polygon`. B5 derives it in
   the opposite order.

## 1. New skills

### 1.1 `congruence-statements` — APPROVED

| field | value |
|---|---|
| id | `congruence-statements` |
| title | Write congruence statements |
| blurb | Name congruent figures with matching vertices in order using $\equiv$, and read off corresponding sides and angles. |
| stage | 5 · courses `["s5-path"]` · dotPointIds `["dp-s5p-geo-b-1"]` · difficulty 1 |
| prereqs | `["identify-congruent-figures"]` |
| atom type | Routine (2 atoms: identify corresponding vertices → write in matching order) |

```json
{ "id": "congruence-statements", "title": "Write congruence statements", "blurb": "Name congruent figures with matching vertices in order using $\\equiv$, and read off corresponding sides and angles.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-geo-b-1"], "difficulty": 1, "prereqs": ["identify-congruent-figures"] }
```

**Booklet trace:** B1 §"Congruence Statements" — own section with 2-step method,
Example ($\Delta ABC \equiv \Delta FDE$, with the margin question "Why is
$\Delta ABC \equiv \Delta DEF$ **NOT** correct? *The vertices are not in … order*"),
Foundation Q1a–f, Q2a–g (write the statement, then read off `ED`, `∠B = 62°` from
it), Development Q4a–d (write the statement *then* find the missing angle/side
from it). Reused in B2 Development Q4 ("choose the two that are congruent … and
write a congruence statement").

**Bar:** (1) *Distinctive* — writing vertices in matching order is a naming
convention with its own failure mode, and the booklet uses the statement as the
*tool* for reading off corresponding parts (Q2, Q4). (2) *At-risk* — the Example
is built around the wrong-order error. (3) *Stage-proximity* — same stage.
(4) *Non-redundant* — this is a **lift-out**, and the rubric's structural-twin
rule points straight at it: `similarity-statements ← similar-figures-properties`
already exists on the Core side with an identical shape (difficulty 1, statement
split from properties).

### 1.2 `interior-angle-regular-polygon` — APPROVED

| field | value |
|---|---|
| id | `interior-angle-regular-polygon` |
| title | Find the interior angle of a regular polygon |
| blurb | Use $I = \frac{180(n-2)}{n}$ to find each interior angle of a regular polygon, and rearrange it to find $n$ from a given angle. |
| stage | 5 · courses `["s5-path"]` · dotPointIds `["dp-s5p-geo-b-5"]` · difficulty 2 |
| prereqs | `["interior-angle-sum-polygon"]` |
| atom type | Routine (chain: angle sum → divide by $n$ → reverse by rearranging) |

```json
{ "id": "interior-angle-regular-polygon", "title": "Find the interior angle of a regular polygon", "blurb": "Use $I = \\frac{180(n-2)}{n}$ to find each interior angle of a regular polygon, and rearrange it to find $n$ from a given angle.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-geo-b-5"], "difficulty": 2, "prereqs": ["interior-angle-sum-polygon"] }
```

**Booklet trace:** B5 §Angle Sum of a Polygon — Foundation Q2 (angle sum of a
pentagon → each interior angle 108°), Q3a–c, Q4 (each interior angle of regular
polygons, 1 d.p.); **the entire Mastery block**: Q9 (derive $I = S \div n$, then
$180 - \frac{360}{n}$, apply to a dodecagon and an 82-gon), Q10 (rearrange
$I = \frac{180(n-2)}{n}$ to make $n$ the subject), Q11a–f (find $n$ from $150°$,
$175°$, $162°$, $140°$, $165.6°$, $147.27…°$), Q12 (limit as $n \to \infty$),
Q13 (is $132°$ possible? $n = 7.5$ ⇒ no).

**Bar:** (1) *Distinctive* — the sum and the per-angle value are different
quantities, and the reverse direction ($n$ from $I$) is a rearrangement the sum
formula never asks for. (2) *At-risk* — Q13's whole point is that a non-integer
$n$ falsifies the polygon; students who only know the sum can't get there.
(3) *Stage-proximity* — same stage. (4) *Non-redundant* — a progression chain
downstream of `interior-angle-sum-polygon` (which stays the base case), per the
rubric's progression rule.

### 1.3 `exterior-angle-regular-polygon` — APPROVED

| field | value |
|---|---|
| id | `exterior-angle-regular-polygon` |
| title | Find the exterior angle of a regular polygon |
| blurb | Use $E = \frac{360°}{n}$ to find each exterior angle of a regular polygon, and rearrange it to find $n$ from a given angle. |
| stage | 5 · courses `["s5-path"]` · dotPointIds `["dp-s5p-geo-b-5"]` · difficulty 2 |
| prereqs | `["exterior-angle-sum-polygon"]` |
| atom type | Routine (chain: exterior sum $360°$ → divide by $n$ → reverse) |

```json
{ "id": "exterior-angle-regular-polygon", "title": "Find the exterior angle of a regular polygon", "blurb": "Use $E = \\frac{360^{\\circ}}{n}$ to find each exterior angle of a regular polygon, and rearrange it to find $n$ from a given angle.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-geo-b-5"], "difficulty": 2, "prereqs": ["exterior-angle-sum-polygon"] }
```

**Booklet trace:** B5 §Exterior Angle Sum of a Polygon — its own boxed formula
("Exterior angle of a *regular* polygon with $n$ sides: $E = \frac{360°}{n}$"),
Example both directions (regular decagon → $36°$; $E = 12°$ → $n = 30$), Your
Turn a–d (octagon → 45°, 20-gon → 18°, $E=15°$ → 24 sides, $E=10°$ → 36 sides),
Foundation Q2.

**Bar:** (1) *Distinctive* — the "regular ⇒ divide" step is exactly what the
Example's margin question interrogates ("If every polygon has an exterior angle
sum of $360°$, why does this formula only work for a *regular* polygon?").
(2) *At-risk* — applying $\frac{360}{n}$ to an irregular polygon is the error
that question exists to block. (3) *Stage-proximity* — same stage.
(4) *Non-redundant* — downstream of `exterior-angle-sum-polygon`.

**Note:** 1.2 and 1.3 are structural twins and were approved together — the
rubric's de-bundling rule obliges the same treatment for a sibling bundling the
same kind of sub-step.

## 2. New prereq edges

Three, all carried by the new skills: `congruence-statements ←
identify-congruent-figures`, `interior-angle-regular-polygon ←
interior-angle-sum-polygon`, `exterior-angle-regular-polygon ←
exterior-angle-sum-polygon`. No transitive reduction triggered.

**One existing edge reversed:**

- **`interior-angle-sum-polygon ← exterior-angle-sum-polygon`** became
  **`exterior-angle-sum-polygon ← interior-angle-sum-polygon`.** B5 teaches
  interior first (§Angle Sum of a Polygon, dissection investigation →
  $S = 180(n-2)$), and its §Exterior Angle Sum investigation *derives* $360°$
  from the interior sum: $(a+x)+(b+y)+(c+z) = 3 \times 180$, subtract
  $a+b+c = 180$, giving $x+y+z = 360$. The old direction said the reverse. After
  the flip, `interior-angle-sum-polygon` keeps `← angle-sum-quadrilateral` and
  `exterior-angle-sum-polygon` keeps `← angle-properties-plane-shapes`; no cycle,
  stages unchanged.

## 3. Edits to existing skills

- **`identify-congruent-figures`** — re-scoped for the 1.1 lift-out.
  - *before:* "Recognise congruent figures via translation, reflection and
    rotation, match sides and angles, and use the $\equiv$ symbol."
  - *after:* "Recognise congruent figures via translation, reflection and
    rotation, and match corresponding sides and angles."
  - Rationale: the $\equiv$ statement moves to `congruence-statements`;
    recognition-via-isometry and part-matching (B1 §Congruent Shapes,
    §Corresponding Sides and Angles, Foundation Q1–Q6) stay here. Mirrors
    `similar-figures-properties`, whose blurb likewise stops short of the
    statement.

## 4. Borderline candidates → EXCLUDE

- **Splitting `area-volume-similar-figures` into area-ratio and volume-ratio
  skills** — B4 is two big sections (§Areas of Similar Figures, §Volumes of
  Similar Solids), each with its own investigation, Example and
  Foundation/Development set, which reads like the rubric's progression chain.
  Excluded on leanness: it is one formula family ($a:b \Rightarrow a^2:b^2
  \Rightarrow a^3:b^3$), one method (length ratio → power → ratio table), taught
  in one booklet, and the existing blurb already states both. The id would also
  have to lie ("area-volume-…" re-scoped to areas only). Development Q12's table
  drills all three ratios *together*, which is the argument against splitting.
- **`find-unknowns-congruent-figures`** (given congruent figures, find the
  pronumeral) — B1 Development Q3a–f, Q5a–d. Excluded: once the correspondence is
  known the step is "corresponding sides are equal", with no decision in it.
  Absorbed by `congruence-statements` (Q4 pairs the two explicitly).
- **`similar-triangles-parallel-line-configuration`** (two triangles formed by
  transversals across parallel lines, or sharing a common angle — justify
  similarity with full reasoning) — B3 Mastery Q12, Q13a–c, Q14 (**2018 HSC
  Extension 1**). Excluded as already homed: this is the formal-proof routine,
  which lives at `prove-similar-triangles` (`dp-s5p-geo-c-1`, queue row 40).
- **`map-area-ratio`** (a 1:1000 scale ⇒ areas in ratio $1:1000^2$; convert cm²
  to m² to ha) — B4 Development Q4–Q6, incl. the reverse (area ratio 1:2500 ⇒
  length ratio $1:\sqrt{2500} = 1:50$). Excluded: it is
  `area-volume-similar-figures` applied to a scale drawing, and the unit
  conversion is ambient Stage 4.

## 5. Considered-and-omitted (already covered / ambient)

- B1 §Congruent Shapes, §Corresponding Sides and Angles (isometries preserve
  congruence; match vertices/sides/angles) → `identify-congruent-figures` (as
  re-scoped).
- B2 §Conditions for Congruent Triangles (SSS, SAS, AAS, RHS; pick the test;
  decide congruent or not; Mastery) → `congruent-triangle-tests`, prereq'd on
  `identify-congruent-figures` and `classify-triangles`.
- B3 §Conditions for Similar Triangles (SSS, SAS, AAA, RHS with full reasoning;
  Development Q5–7 "why similar, then find $x$"; Q8 angle-sum-of-triangle route)
  → `similar-triangle-tests` + `find-sides-similar`.
- B4 §Areas of Similar Figures, §Volumes of Similar Solids (investigations, ratio
  tables, Mastery Q13–Q18 incl. the dog surface-area-to-volume item) →
  `area-volume-similar-figures`.
- B5 §Angle Sum of a Polygon (dissection investigation, $S = 180(n-2)$,
  Foundation Q1) and §Problems Involving Angle Sum (form an equation, solve for
  the missing angle) → `interior-angle-sum-polygon`, whose blurb already says
  "and solve polygon problems".
- B5 §Exterior Angle Sum (define the exterior angle, interior + exterior
  $= 180°$ supplementary, sum $= 360°$, Foundation Q1 "in which diagram is $x$ an
  exterior angle?") → `exterior-angle-sum-polygon`.
- B5 Review of Prior Knowledge (evaluate $(n-2) \times 180$; parallel-line and
  triangle angle work) → Stage 4 `angle-sum-triangle` /
  `parallel-line-angle-properties`; ambient here.

**Gap flagged (no booklet source):** dp-s5p-geo-b-1's bullet "Determine that
having equal radii is the condition for 2 circles to be congruent" is not covered
anywhere in B1. No skill proposed — booklet-required rule. Recorded so a later
pass knows the omission is the booklet's, not the graph's.

## Net change applied

- **+3 skills:** `congruence-statements`, `interior-angle-regular-polygon`,
  `exterior-angle-regular-polygon`
- **+3 edges**, plus **1 edge reversed** (`interior-angle-sum-polygon` ↔
  `exterior-angle-sum-polygon`)
- **1 re-scope:** `identify-congruent-figures`
