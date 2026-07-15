# Proposal — Atomise Properties of Geometrical Figures group (Booklets 1–3, topic `t-s4-geo`)

**Status: APPLIED 2026-07-15** — approved by the user and applied to `data/skills.json`; `npm run validate` clean (1089 skills). QUEUE.md row 4 → applied.

## Context

Queue-mode pass over the three Stage 4 *Properties of Geometrical Figures* booklets:

1. `…1_Classify triangles according to their side and angle properties` → **dp-s4-geo-1**
2. `…2_Classify quadrilaterals and describe their properties` → **dp-s4-geo-2**
3. `…3_Apply the properties of triangles and quadrilaterals` → **dp-s4-geo-3**

Topic `t-s4-geo`, MA4-GEO-C-01.

## Finding

Near-complete coverage. All of booklet 3 (angle-sum proofs + unknown-finding) and most of booklets 1–2 map onto existing skills. Two gaps: (a) `classify-triangles` under-claims (blurb side-only, but skill + dot point geo-1 cover angle classification too); (b) the quadrilateral inclusive hierarchy is a named syllabus outcome, drilled hard, captured by no blurb.

Existing coverage: geo-1 `classify-triangles`; geo-2 `classify-quadrilaterals`, `quadrilateral-properties`, `convex-nonconvex` (+ s3 `symmetry-quadrilaterals`, `regular-irregular-polygons`); geo-3 `angle-sum-triangle`, `exterior-angle-triangle`, `angle-sum-quadrilateral`, `unknown-sides-angles-figures`.

## Applied — new skill (1)

### `quadrilateral-hierarchy`
```json
{ "id": "quadrilateral-hierarchy", "title": "Classify quadrilaterals in the hierarchy", "blurb": "Justify why a quadrilateral can be classified as more than one type, using the inclusive hierarchy (e.g. a square is also a rhombus and a rectangle).", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-geo-2"], "prereqs": ["quadrilateral-properties"], "difficulty": 2 }
```
- **Trace:** Booklet 2 "Hierarchy of Quadrilaterals" diagram; Foundation Q1 "circle ALL shapes it could be classified as", Q3 (square is a special rectangle), Q4 (rectangle is not a square), Q5 always-true subset claims; all six CYU "Tom says / Katie says" items. Syllabus bullet: "Justify why some quadrilaterals may be classified as more than one type."
- **Bar:** Distinctive (subset/superset reasoning beyond describing properties) ✓; at-risk (classic misconception, drilled across Foundation + 6 CYU) ✓; same stage ✓; non-redundant (`classify-quadrilaterals`/`quadrilateral-properties` capture the properties, not the hierarchy logic) ✓.

## Applied — re-scope (1)

### `classify-triangles` — blurb widened to match dot point geo-1 ("side **and angle** properties")
- **Before:** `Identify equilateral, isosceles and scalene triangles.`
- **After:** `Identify equilateral, isosceles and scalene triangles, and classify triangles as acute-, right- or obtuse-angled.`
- **Trace:** Booklet 1 "Triangles According to Angle Properties" + dual-classification table (Q3); CYU on both.
- No new node — angle classification is the same "classify a triangle" skill; splitting it off `classify-angles` would be elementary pollution.

## Borderline → EXCLUDE

- **`isosceles-base-angles`** (equal sides ⇒ equal base angles; booklet 3 review Q1, `a+a+26=180`) — already stated in `classify-triangles`, applied within `unknown-sides-angles-figures`; ambient at s4.
- **`draw-diagonals` / edge-vs-diagonal** (booklet 2 Diagonals) — elementary notation; diagonal *properties* live in `quadrilateral-properties`.
- **`label-shape-vertices`** — ambient notation (`geometry-notation`).

## Considered and omitted (audit trail)

- Classify triangles by side; classify/name quadrilaterals; convex vs non-convex; describe side/angle/diagonal properties — existing skills above.
- Prove & apply angle sum of triangle, exterior angle theorem, angle sum of quadrilateral — `angle-sum-triangle`, `exterior-angle-triangle`, `angle-sum-quadrilateral`.
- Find unknown sides/angles with reasons (booklet 2 Q7–9, all of booklet 3) — `unknown-sides-angles-figures`.
- Rhombus-diagonal + Pythagoras (booklet 2 Q11/Q12) — cross-topic application.
- Solving the linear equation inside an angle problem — cross-topic (Equations).

## Net change

- 1 new skill: `quadrilateral-hierarchy`.
- 1 re-scope: `classify-triangles` blurb.
- 0 new edges into existing skills.
