# Proposal — Atomise `Properties of Geometrical Figures A` (Core) group

**Status: APPLIED** (skills.json updated, `npm run validate` clean). Skill 1.2
`scale-factor-from-scale-drawing` was **REJECTED at review** — see §4.

**Context.** Booklets: `Stage 5 Core/Properties of Geometrical Figures A
1_Identify and describe the properties of similar figures.md`, `…A 2_Solve
problems using ratio and scale factors in similar figures.md`. Target topic
`t-s5c-geo-a`, dot points **dp-s5c-geoa-1**–**dp-s5c-geoa-2**. MA5-GEO-C-01.

**Finding (headline).** Five skills already cover the topic:
`similar-figures-properties → similarity-statements` on dp-1, and
`similar-figures-properties → scale-factor → {find-sides-similar,
scale-drawings}` on dp-2. Booklet 1 maps onto dp-1 with **nothing missing**.
Booklet 2 is the problem: 57 pages against a 2-skill dp-2 chain. Two sections
were proposed as routines the graph does not reach — the **practical
similar-figure problem** (shadow/stick), which is its own syllabus bullet, and
**deriving a scale from a drawing**. Only the first was accepted.

## 1. New skills

### 1.1 `similar-figure-practical-problems` — APPROVED

| field | value |
|---|---|
| id | `similar-figure-practical-problems` |
| title | Solve practical problems using similar figures |
| blurb | Identify the two similar triangles in a practical situation, pair the corresponding quantities and find an unknown length, e.g. height from shadow lengths. |
| stage | 5 · courses `["s5-core"]` · dotPointIds `["dp-s5c-geoa-2"]` · difficulty 3 |
| prereqs | `["find-sides-similar"]` |
| atom type | Routine (leading Category atom: which two triangles, and which side matches which?) |

```json
{ "id": "similar-figure-practical-problems", "title": "Solve practical problems using similar figures", "blurb": "Identify the two similar triangles in a practical situation, pair the corresponding quantities and find an unknown length, e.g. height from shadow lengths.", "stage": 5, "courses": ["s5-core"], "dotPointIds": ["dp-s5c-geoa-2"], "difficulty": 3, "prereqs": ["find-sides-similar"] }
```

**Booklet trace:** A2 §"Similar Figure Problems" — own 3-step method, Example
(Chris' shadow 1.2 m, 1 m stick casting 0.8 m → 1.5 m) worked *both* ways (ratio
table and algebraic fraction), Your Turn (tree/20 m shadow → 40 m), Foundation
Q1a–h (post/tree, giraffe, 0.39 km), Development Q2 (flagpole), Q3 **2022 HSC
Standard 1**.

**Bar:** (1) *Distinctive* — the routine's real work is invisible: recognising
object-and-shadow as two similar right triangles and matching height↔height,
shadow↔shadow. `find-sides-similar` starts from two figures already drawn and
labelled. It is also its own syllabus bullet ("…and related practical
problems"), unclaimed by any existing blurb. (2) *At-risk* — pairing Chris'
height against the stick's *shadow* is the failure the worked example is built
to prevent. (3) *Stage-proximity* — same stage. (4) *Non-redundant* — sits
downstream of `find-sides-similar`, reachable only through it.

### 1.2 `scale-factor-from-scale-drawing` — **REJECTED** (see §4)

## 2. New prereq edges

One, carried by 1.1: **`similar-figure-practical-problems ←
find-sides-similar`**. No transitive reduction triggered.

*Considered:* `area-from-scale ← scale-factor-from-scale-drawing` (Stage 6
Standard, `dp-s6st12-ratios-3`) — moot with 1.2 rejected. That topic is queue
row 58 and unaudited; its existing `← scale-drawings` edge stands.

## 3. Edits to existing skills

**None.** No blurb here bundles what was lifted out: `find-sides-similar` reads
"Use the scale factor to find unknown sides in similar figures" — no
practical/modelling claim.

## 4. Borderline candidates → EXCLUDE

- **`scale-factor-from-scale-drawing`** (find a drawing's scale from a drawn
  length and its real-life length: convert to a common unit, divide
  $\frac{image}{original}$, write as $1:n$) — **proposed and REJECTED at
  review.** A2 §"Calculating Scale Factor in Scale Drawings" is a full section
  with a 4-step method, Example (50 cm drawing ↔ 150 m real → 15 000 cm →
  $\frac{50}{15000}=\frac{1}{300}$ → 1:300), Your Turn (1:5000, 1:2500) and
  Foundation Q1; reused in §"Scale Drawings and Measurement: Part 2" (Example
  derives 1:2000 by measuring; Development Q4 bar = 50 m → 1:2500, Q6 50 m pool
  → 1:2000, Q9 **2019 HSC Standard 2** house plan → 1:50). Rejected nonetheless:
  the knowledge stays bundled in `scale-drawings`. **A rejection is a decision —
  do not re-propose this in a later pass.**
- **`similar-sides-proportion-equation`** (the "algebraic fractions method": set
  $\frac{z}{12}=\frac{10}{15}$, keep the unknown in the numerator, multiply out)
  — A2 §"Algebraic Fractions Method", a full section with Example, Foundation
  Q1a–h, Development Q2a–h ("careful, these triangles are not oriented the
  same"), Mastery Q3–Q6 (incl. overlapping figures ACDF ~ EBCD). Excluded on the
  **Area and Surface Area A precedent** (`surface-area-prism-without-net`): it is
  a second presentation of one routine, not a new one — the decisions (identify
  corresponding sides, which is image and which is original) are identical to the
  ratio-table method, and the only genuinely new step is solving
  $\frac{x}{a}=\frac{b}{c}$, which is cross-topic equation-solving and barred by
  the scope rule. Stays bundled in `find-sides-similar`.
- **`measure-scale-drawing`** (get the length off the page with a ruler, then
  apply the scale) — A2 §"Scale Drawings and Measurement: Part 1" (Example:
  measure 4 cm on a 1:400 building → 16 m; Foundation Q1 fish/pen/racquet).
  Excluded: the measuring itself is a physical act, not an at-risk mathematical
  decision, and once the number is on the page Part 1 *is* `scale-drawings`.
- **`test-figures-similar`** (check all corresponding angles equal *and* all
  corresponding sides in equal ratio, then decide) — A1 §"Determining whether Two
  Figures are Similar", Foundation Q1–2, Development Q3–5 (8 decide-questions),
  Mastery Q9–Q11. Excluded: `similar-figures-properties` ("Recognise equal angles
  and proportional sides in similar figures") is exactly this decision; splitting
  the yes/no off from the properties would be a distinction without a routine.
- **`scale-drawing-ratio-notation`** (the `image : original` reversal — scale
  drawings run the ratio table the opposite way to similar figures) — A2
  §"Finding Lengths in Scale Drawings" makes a point of it ("Why do we set up our
  ratio boxes as image : original? (previously, we did original : image)").
  Genuinely at-risk, but it is one convention inside `scale-drawings`, assessable
  only through it. Absorbed.

## 5. Considered-and-omitted (already covered / ambient)

- A1 §Similarity Statements (corresponding vertices in matching order, `~`
  symbol, Development Q2c/d "redraw as two triangles") → `similarity-statements`.
- A1 Mastery Q6/Q12 (justify that all squares, all equilateral triangles, all
  circles are similar) → `similar-figures-properties`.
- A2 §Enlarge and Reduce Diagrams (draw the image on grid at $k=3, 1.5, 0.5,
  \tfrac14$; $k=1$ ⇒ congruent) and §Calculating Scale Factor → `scale-factor`,
  whose blurb already says "use them to enlarge or reduce figures".
- A2 §Calculating Unknown Side Lengths and §Calculating Sides by Finding Scale
  Factor First (ratio table, ×/÷ by $k$) → `find-sides-similar`.
- A2 §Finding Lengths in Scale Drawings (1:500 maps, apply a given scale in both
  directions, unit conversion) and §Scale Drawings and Measurement Parts 1–2 →
  `scale-drawings` (which, with 1.2 rejected, now also carries deriving the
  scale).
- A2 Q4 hexagon (perimeter of image 36 cm at $k=4$ → side 1.5 cm) and Mastery
  Q6a (area of the similar rectangle $B$): both are "find the side, then use a
  Stage-4 perimeter/area formula". Perimeter/area scaling *as a ratio law* is
  Path content and already exists as `area-volume-similar-figures`
  (`dp-s5p-geo-b-4`); nothing Core is missing.
- Unit conversion (mm/cm/m/km) throughout §Scale Drawings — ambient Stage 4
  measurement.

## Net change applied

- **+1 skill:** `similar-figure-practical-problems` (1 further skill proposed and
  rejected)
- **+1 edge**, 0 removed
- **0 re-scopes**
