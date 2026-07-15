# Proposal — Atomise Length group (Booklets 1–2, topic `t-s4-len`)

**Status: APPLIED 2026-07-15** — all recommendations below approved by the user and applied to `data/skills.json`; `npm run validate` clean (1087 skills). QUEUE.md row 2 → applied.

## Context

Queue-mode pass over the two Stage 4 *Length* booklets:

1. `Stage 4/Length 1_Solve problems involving the perimeter of various quadrilaterals and simple composite figures.md` → **dp-s4-len-1**
2. `Stage 4/Length 2_Describe the relationships between the features of circles.md` → **dp-s4-len-2**

Topic `t-s4-len`, MA4-LEN-C-01.

## Finding

The circle-feature core is already dense and well-covered; the gaps are the perimeter/circumference **reverse** routines and the **rectilinear/arc composites** — mirroring what the applied Area 2 pass found for the area formula. Existing coverage:

- **dp-s4-len-1:** `perimeter-2d-shapes` (s3/s4), `perimeter-composite-figures` (s4). Plus s3 feeders `length-perimeter-problems` (units), `sides-needed-for-perimeter`.
- **dp-s4-len-2:** `circle-features`, `pi-definition`, `circumference-circle`, `arc-length-perimeter-sector`. Plus, on the area dot point, the reusable `sector-interior-angle`, `halve-diameter-for-radius`, `find-unknown-from-circle-area`.

Four booklet sections drive genuinely new routines, each with direct structural precedent in the applied Area 2 proposal.

## Applied — new skills (4)

### 1. `find-missing-sides-rectilinear`
```json
{ "id": "find-missing-sides-rectilinear", "title": "Find missing sides of a rectilinear figure", "blurb": "Find unknown side lengths of an L-shape or rectilinear figure using the equal opposite-side sums.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-len-1"], "prereqs": ["perimeter-2d-shapes"], "difficulty": 2 }
```
- **Trace:** Length 1 "Perimeter of L-Shapes" — worked example (top=bottom, right=left−…); Foundation Q1 "Calculate the missing lengths"; **Q2 "Label the unknown side… *if possible*"** with "not enough information" distractors; Development Q7 find `x`.
- **Bar:** Distinctive (characteristic enabler of rectilinear composite perimeter) ✓; at-risk (Q2 isolates it, incl. "cannot be determined") ✓; same stage ✓; non-redundant (`perimeter-composite-figures` only ← `perimeter-2d-shapes`) ✓. Lift-out, mirroring Area 2's `sector-interior-angle`.

### 2. `find-side-from-perimeter`
```json
{ "id": "find-side-from-perimeter", "title": "Find a side length given the perimeter", "blurb": "Set up a perimeter equation and solve for an unknown side length using inverse operations.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-len-1"], "prereqs": ["perimeter-2d-shapes"], "difficulty": 2 }
```
- **Trace:** Length 1 "Solving Perimeter Problems" — worked example `75 = 16 + 34 + x`; Foundation Q1 "all have perimeter 50 cm, find missing sides", Q2/Q3; Development Q4/Q5/Q8; CYU Q11–14.
- **Bar:** Distinctive inverse routine ✓; at-risk ✓; same stage ✓; non-redundant (no polygon-perimeter inverse exists) ✓. Analog of applied `find-unknown-from-circle-area`. Equation-solving mechanics deliberately not a prereq (cross-topic, per Area 2 precedent).

### 3. `find-radius-from-circumference`
```json
{ "id": "find-radius-from-circumference", "title": "Find the radius or diameter given the circumference", "blurb": "Substitute into $C = \\pi d$ or $C = 2\\pi r$ and solve for the diameter or radius using inverse operations.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-len-2"], "prereqs": ["circumference-circle"], "difficulty": 2 }
```
- **Trace:** Length 2 "Finding the Radius given Circumference" — worked examples `9 = πd`, `12.8 = 2πr`; Foundation Q1–Q3 (NAPLAN car tyre); Development Q4 (Earth radius), Q6 (belt).
- **Bar:** Distinctive inverse-of-circumference ✓; at-risk (÷π / ÷2π) ✓; same stage ✓; non-redundant (`find-unknown-from-circle-area` inverts area only) ✓. Structural twin of the Area 2 skill.

### 4. `perimeter-composite-arc-figures`
```json
{ "id": "perimeter-composite-arc-figures", "title": "Find perimeters of composites involving arcs", "blurb": "Find the perimeter of composite shapes combining straight edges and arcs.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-len-2"], "prereqs": ["arc-length-perimeter-sector", "perimeter-composite-figures"], "difficulty": 3 }
```
- **Trace:** Length 2 "Perimeter of Shapes Involving Arc Length" — worked example (rectangle + quarter-arc); **Foundation Q1 "Explain why you cannot use $P = l + 2r$ — this is not a sector"**; Q2 a–i; Development Q3 (exact form), Q4 (semicircles), Q5.
- **Bar:** Distinctive (straight+arc beyond a sector; Q1 forces the distinction) ✓; at-risk ✓; same stage ✓; non-redundant (`arc-length-perimeter-sector` only claims sectors/quadrants/semicircles) ✓. Mirrors existing `area-composite-circles` (separate from `area-of-sector`), identical prereq shape.

## Applied — new prereq edges into existing skills (2)

| Skill (X) | New prereq (P) | Trace + bar |
|---|---|---|
| `perimeter-composite-figures` | `find-missing-sides-rectilinear` | L-shape section; Q2 isolates it. Distinctive ✓, at-risk ✓, same stage ✓, non-redundant ✓. |
| `arc-length-perimeter-sector` | `sector-interior-angle` | Arc Q3 "angle shown is the **exterior** angle"; Q8 frisbee 202.5°/157.5°. Consistency with applied `area-of-sector ← sector-interior-angle`; non-redundant ✓. |

## Edits to existing skills

None — no blurb re-scopes; new skills sit downstream/alongside without narrowing existing meanings.

## Borderline → EXCLUDE

- **`match-units-before-perimeter`** — already inside s3 `length-perimeter-problems` ("including different units").
- **`find-radius-from-arc-length`** (Length 2 Radius Mastery Q7) — mastery/low-frequency; folded into `arc-length-perimeter-sector`.
- **`find-sector-angle-or-radius-from-perimeter`** (Length 2 sector Q7–Q9) — non-routine, equation-heavy (factor-out-`r`), cross-topic algebra grafted on.
- **halve/double radius↔diameter on circumference** — `circumference-circle` offers `C=πd` directly, so no forced halving (unlike area's `r²`). `halve-diameter-for-radius` stays area-side.

## Considered and omitted (audit trail)

- **Metric length conversion** (Length 1 "Units of Length") — already `convert-length-units` (s3); ×10/÷10 is the booklet's own Review.
- **Perimeter of polygons / repeated addition** — `perimeter-2d-shapes`.
- **Circle features / radius↔diameter / π-def / circumference / basic arc length / sector·quadrant·semicircle perimeter** — already covered by the four existing circle skills.
- **Exact answers in terms of π** — presentation convention (excluded in Area 2 too).
- **Applied/NAPLAN/HSC context problems** (bike revolutions, Ferris wheel, athletics-track lanes, Moon orbit, flat-earth) — applications, not new atoms.
- **"Two methods, which is more efficient"** (Length 1 Dev Q5) — reasoning about `find-missing-sides-rectilinear`.
- **Guess-and-check simultaneous side problems** (Length 1 Q9 `6x+2y=30`) — non-routine, cross-topic.

## Net change

- 4 new skills: `find-missing-sides-rectilinear`, `find-side-from-perimeter`, `find-radius-from-circumference`, `perimeter-composite-arc-figures`.
- 2 new edges into existing skills: `perimeter-composite-figures ← find-missing-sides-rectilinear`, `arc-length-perimeter-sector ← sector-interior-angle`.
- 0 re-scopes.
