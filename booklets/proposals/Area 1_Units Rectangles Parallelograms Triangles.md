# Atomisation proposal — `Area 1_Units Rectangles Parallelograms Triangles`

## Context

Booklet-atomisation for the Stage 4 area unit covering: Converting Units of Area,
Area of Squares & Rectangles, Area of Parallelograms, Area of Triangles, Mixed
Practice, Area of Composite Figures, and **Finding Unknown Sides Given the Area**.

Target dot points (topic `t-s4-are`, with the Stage 3 area equivalents):
- `dp-s4-are-1` — "Develop and use formulas to find the area of rectangles,
  triangles and parallelograms to solve problems"
- `dp-s4-are-4` — "Choose appropriate units of measurement for area and convert
  between units"
- Stage 3 twins: `dp-s3-2dsb-3` (parallelogram), `dp-s3-2dsb-4` (triangle).

**Coverage check — most of the booklet is already in the graph:**
`convert-area-units`, `choose-area-units`, `area-units-hectare-km2`,
`area-of-rectangle`, `area-of-parallelogram`, `area-of-triangle`,
`area-composite-figures`, `rectangles-same-area-different-dimensions`,
`perimeter-area-same-comparison` all exist and map cleanly to their sections.

Two genuine gaps remained, now applied to `data/skills.json`.

---

## NEW skills added (2)

### 1. `identify-base-perpendicular-height`
- **title:** Identify the base and perpendicular height
- **blurb:** Identify a base and its perpendicular (90°) height in parallelograms
  and triangles, distinguishing the height from a slant side.
- **stage:** 3   **courses:** `["s3","s4"]`   **difficulty:** 2
- **dotPointIds:** `["dp-s3-2dsb-3"]` (nearest existing dot point — parallelogram
  area; also serves triangles via `dp-s3-2dsb-4`)
- **prereqs:** `[]`
- **atom type:** Category (decide which length is the perpendicular height)
- **booklet trace:** "Base and Height of a Parallelogram" + "Identify base and
  height of a [parallelogram]" + "Show the perpendicular length" sections; "Base
  and Height of a Triangle" + "Label the base and height" sections; **Triangle Dev
  Q6** (Jimmy uses the 6 cm slant side instead of the perpendicular height — "you
  do not use the 6 cm").
- **bar:** Distinctive — the characteristic enabler of the `bh` / `bh⁄2` formulas,
  not ambient arithmetic. At-risk — the slant-vs-perpendicular-height confusion is
  a classic error the booklet devotes whole concept boxes and an entire practice
  section to. Non-redundant — no equivalent skill/edge existed. This is the "lift
  the tricky at-risk sub-step out of the coarse formula skill" pattern; one skill
  covers both structural twins (parallelogram + triangle).

### 2. `find-unknown-side-from-area`
- **title:** Find an unknown side given the area
- **blurb:** Substitute into A = lw, A = bh or A = bh⁄2 and solve for an unknown
  side using inverse operations.
- **stage:** 4   **courses:** `["s4"]`   **difficulty:** 3
- **dotPointIds:** `["dp-s4-are-1"]`
- **prereqs:** `["area-of-triangle"]`
- **atom type:** Routine
- **booklet trace:** Entire "Finding Unknown Sides Given the Area" section —
  worked Examples (rectangle `1.53 = 1.7x`; triangle `192 = 8b⁄2`), Foundation
  Q1–Q2, Development Q3–Q5, Mastery Q6–Q11; plus **Parallelogram Dev Q6** (area
  75, base = 3×height) and the area→side cases throughout.
- **bar:** Distinctive — a new routine (the *inverse* use of the three area
  formulas), not covered by the forward area skills. At-risk and stage-appropriate
  (Stage 4: forms and solves an equation). Non-redundant — no existing skill does
  the reverse direction.
- **Prereq note (transitive reduction):** `area-of-triangle → area-of-parallelogram
  → area-of-rectangle` already exists, so linking `area-of-triangle` alone
  transitively reaches all three formulas the routine inverts. Adding rectangle or
  parallelogram explicitly would violate transitive reduction. The equation-solving
  / inverse-operations step is **cross-topic algebra and deliberately NOT added** as
  a prereq.

## NEW prereq edge to an existing skill (1)

- `area-of-parallelogram` ← `identify-base-perpendicular-height`
  - `area-of-triangle` reaches the new skill **transitively** (triangle ←
    parallelogram ← identify-base-height), so **no** separate triangle edge is
    added (transitive reduction).

---

## Borderline candidates considered → EXCLUDED

- **`area-mixed-units`** ("answer in the smaller unit"; convert one dimension to a
  common unit before multiplying). Trace: Rectangles Dev Q5 + Q4 (Ava multiplies
  `28 × 3` with mismatched units), Parallelogram Q2, Triangle Q5. *Exclude:* the
  only genuinely new atom beyond the existing area skills is "unify the units first,"
  whose real enabler is length-unit conversion — a different topic we don't add as a
  prereq. Too thin to stand alone given the pollution bar.
- **`area-of-square`** (A = l²). *Exclude:* same formula as a rectangle with equal
  sides; squaring is ambient arithmetic; already bundled in `area-of-rectangle`.
- **`composite-area-by-subtraction`**. *Exclude:* a sub-strategy of the existing,
  deliberately general `area-composite-figures` ("split or rearrange"), which the
  booklet's composite section (addition + subtraction, triangle/rectangle splits)
  already covers.

## Considered and omitted (ambient / elementary / already covered)

- "Decide ×/÷ and the factor" and "convert twice" — invisible atoms bundled inside
  the existing `convert-area-units`.
- Choosing the appropriate area unit, hectares/km² — `choose-area-units`,
  `area-units-hectare-km2` already exist.
- Same-area/same-perimeter and dimension-comparison reasoning (Rectangles Q6–Q10,
  Q13–Q18) — covered by `rectangles-same-area-different-dimensions` and
  `perimeter-area-same-comparison`.
- Square-root for a square's side (Rect Q11), solving `3h² = 75` (Para Q6) —
  arithmetic/algebra bundled into `find-unknown-side-from-area`; not separate.
- "Area scales by k²" conceptual questions (Rect Q13/Q18, Units Q13–Q16) — non-
  routine reasoning, not a graph skill.
- Composite figures split into triangle + rectangle/parallelogram, NAPLAN/HSC
  composite items — covered by `area-composite-figures`.

---

## Applied & validated

All three changes are now in `data/skills.json`. Validation confirmed: every
`prereqs` id and `dotPointIds` id resolves; the graph stays acyclic; and the
transitive-reduction reasoning holds (`area-of-parallelogram` and
`find-unknown-side-from-area` reach their intended formulas without redundant
edges).
