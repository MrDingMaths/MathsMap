# Proposal: Introduction to Vectors (Stage 6 Extension 1, Y12) — APPLIED

Status: **applied** (2 new skills, 3 new edges, 0 re-scopes; `npm run validate` clean, 1184 skills).

**Context** — Booklets: `Introduction to Vectors 1_Vector Representation, notation and operations`, `2_Further operations with vectors`, `3_Motion in vector form in two dimensions`, `4_Projectile Motion`. Target: `t-s6x1y12-vectors`, dot points `dp-s6x1y12-vectors-1`…`-6` (MX1-12-02…07). Goal: audit the already-populated 33-skill vector cluster against the four source booklets and fill genuine gaps only.

**Finding (headline)** — The cluster is **already near-complete**: 33 skills spanning all six dot points, well-chained. Booklet 3 (Motion) is a blank template stub — no atomisable content; its dp-5 syllabus bullets are already matched 1:1 by the 8 existing motion skills. Booklet 4 (Projectile) maps exactly onto the 5 existing dp-6 skills. dp-2 and dp-4 clusters cover every routine in booklets 1–2. **Two routines in Booklet 1 had no covering skill:** computing a vector's **direction**, and **expressing/proving vectors in a named geometric figure** via the vector laws.

---

## 1. New skills

### 1a. `vector-direction-angle`

| field | value |
|---|---|
| id | `vector-direction-angle` |
| title | Find the direction of a vector |
| blurb | Find the direction of a vector as an angle of inclination or true bearing using $\theta=\tan^{-1}\frac{\lvert y\rvert}{\lvert x\rvert}$ and quadrant reasoning. |
| stage | 6 |
| courses | `["s6-ext1-12"]` |
| dotPointIds | `["dp-s6x1y12-vectors-3"]` |
| difficulty | 2 |
| prereqs | `["vector-component-form"]` |
| atom type | Routine |

**Booklet trace** — Book 1, *Calculating Magnitude and Direction*: concept box "Direction" + procedure (sketch components → reference angle $A=\tan^{-1}(|y|/|x|)$ → quadrant adjustment); worked **Example** "Find the direction of $5\mathbf{i}-3\mathbf{j}$" → 329°; **Guided Practice** (inclination to 1 d.p.; true bearing to nearest degree); **Foundation Q2** (direction of six vectors), **Development Q4/Q7/Q8/Q9** (magnitude *and* direction), Q7 back-solves a component from a given 45° direction.

**Edge-bar `← vector-component-form`** — (1) *Distinctive*: components are required to take $\tan^{-1}(|y|/|x|)$. (2) *At-risk*: converting components to a directed angle (quadrant) is a distinct failure point. (3) *Stage-proximity*: same topic/stage. (4) *Non-redundant*: skill is new. Trig itself is intrinsic-elsewhere ambient — not listed.

### 1b. `vectors-in-geometric-figures`

| field | value |
|---|---|
| id | `vectors-in-geometric-figures` |
| title | Express vectors in geometric figures |
| blurb | Express vectors in a figure in terms of given vectors using the triangle, parallelogram and negative-vector laws, and prove simple vector identities. |
| stage | 6 |
| courses | `["s6-ext1-12"]` |
| dotPointIds | `["dp-s6x1y12-vectors-1"]` |
| difficulty | 2 |
| prereqs | `["represent-vectors-graphically", "add-subtract-vectors"]` |
| atom type | Routine |

**Booklet trace** — Book 1, *Point to Point Notation*: worked **Example** (parallelogram $PQRS$, $\overrightarrow{PQ}=a$, $\overrightarrow{QR}=b$ → $\overrightarrow{QP},\overrightarrow{SR},\overrightarrow{PR},\overrightarrow{RP}$); **Guided Practice** (regular hexagon; triangle $ABC$ with $\overrightarrow{BC}=2p-q$); "Important Vector Laws" (commutative, negative-vector, triangle, parallelogram-of-subtraction); worked **Example** proving $\overrightarrow{PR}-\overrightarrow{QR}+\overrightarrow{QS}=\overrightarrow{PS}$; **Foundation Q1–8**, **Development Q9–11** (grid of parallelograms), **Mastery Q12a–j** (prove ten vector identities citing laws).

**Edge-bar `← represent-vectors-graphically`** — (1) *Distinctive*: relies on equal vectors and $\overrightarrow{AB}=-\overrightarrow{BA}$. (2) *At-risk*: sign/direction slips in named-point notation. (3) *Stage-proximity*: same dot point/stage. (4) *Non-redundant*: not reachable via the other prereq.

**Edge-bar `← add-subtract-vectors`** — (1) *Distinctive*: the triangle/parallelogram laws are geometric add/subtract applied to directed segments. (2) *At-risk*: chaining tip-to-tail additions across a figure. (3) *Stage-proximity*: same stage. (4) *Non-redundant*: neither prereq reaches the other.

---

## 2. New prereq edges
All internal to the two new skills (no edges added to pre-existing skills):
- `vector-direction-angle ← vector-component-form`
- `vectors-in-geometric-figures ← represent-vectors-graphically`
- `vectors-in-geometric-figures ← add-subtract-vectors`

## 3. Edits to existing skills
**None.** No existing blurb bundled either new routine.

## 4. Borderline candidates → EXCLUDE
- **`construct-perpendicular-vector`** (find $\binom{b}{-a}$/$\binom{-b}{a}$ by swap + one sign change) — one-line transformation atom; perpendicularity already carried by `perpendicular-vectors-dot` ($ac+bd=0$) and `perpendicular-component-vector`.
- **`vector-from-magnitude-and-direction`** (reconstruct $a=|a|\hat a$, §*Unit Vectors in a Particular Direction* Q3/Q4) — trivial inverse of `unit-vector-from-vector`.
- **Coordinate "Proofs using Vectors"** (Book 2: show $ABCD$ rectangle, diagonals bisect, collinearity) — composed of existing atoms (`vector-from-two-points`, `perpendicular-vectors-dot`, `parallel-vectors-condition`) grafted onto cross-topic quadrilateral classification; dedicated proof skill already exists as `vector-geometric-proofs` under Extension 2 (`dp-s6x2-vectors-2`); proofs are not among the X1 dot points.
- **Dot-product formula-equivalence proof** (Book 2 cosine-rule derivation) — one-off, non-routine.
- **"Parallel vectors" dot-product property** ($a\cdot b=\pm|a||b|$) — minor property; load-bearing properties are `dot-product-magnitude` and `perpendicular-vectors-dot`.

## 5. Considered-and-omitted
- **Position-vector definition** ($\overrightarrow{OP}$ tail-at-origin) — definitional; load-bearing routine $\overrightarrow{PQ}=\overrightarrow{OQ}-\overrightarrow{OP}$ is `vector-from-two-points`.
- **Geometric add/sub/scalar-multiple sketching** — bundled in `add-subtract-vectors` and `scalar-multiple-vector`.
- **Column ↔ component ↔ ordered-pair conversion, column/component arithmetic** — `vector-component-form` + `add-subtract-vectors`.
- **Magnitude, unit vectors, $i,j$ basis, parallel test, dot product, angle between vectors, projection, perpendicular component** — all present.
- **All motion (dp-5) and projectile (dp-6) routines** — matched 1:1 by existing 8 + 5 skills; Booklet 3 is a blank template.
- **Book 2 §*Applications to Mechanics*** (inclined planes, resultant force, equilibrium) — Extension 2 mechanics (`dp-s6x2-mechanics-1`), out of X1 scope.

## Net change
- **2 new skills** (`vector-direction-angle`, `vectors-in-geometric-figures`)
- **3 new edges** (internal to new skills)
- **0 re-scopes**
