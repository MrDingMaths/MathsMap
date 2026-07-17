# Proposal — Atomise Applications of Measurement (Stage 6 Standard Y11, topic `t-s6st11-measurement`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json`. QUEUE.md row 50 → applied.

## Context

Queue row 50. Two booklets:

1. `Stage 6 Standard/Applications of Measurement 1_Practicalities of measurement.md` → **dp-s6st11-measurement-1, -2**
2. `Stage 6 Standard/Applications of Measurement 2_Perimeter, area, volume.md` (2700 lines, ~50 sections) → **dp-s6st11-measurement-3 – -6**

MST-11-05.

## Finding (headline)

**No new skills, no new edges.** Mensuration is the densest region of the graph — rows 2, 34–37 pre-atomised everything these booklets teach. The gaps were tagging: **dp-measurement-3 says "perimeters and areas" but carried zero perimeter-family tags** (only `pythagoras-solve-problems`, `composite-area-problems`, `irregular-land-area`), and several skills the booklet re-teaches as full sections (partial cylinders, hemispheres, capacity problems, pyramid-height-by-Pythagoras) sat untagged on s5-core/s5-path only. Plus 3 blurbs that undersold their dot-point scope.

## 1–2. New skills / edges

None.

## 3. Edits to existing skills (16) — APPLIED

### a. Tags: perimeter family → dp-measurement-3 gap (+`s6-std11`, +`dp-s6st11-measurement-3`) — 6 skills

| skill | booklet section trace |
|---|---|
| `perimeter-composite-figures` | §Perimeter of Polygons, §Perimeter of L-Shapes |
| `find-side-from-perimeter` | §Solving Perimeter Problems (side given perimeter) |
| `circumference-circle` | §Circumference using Diameter / using Radius |
| `find-radius-from-circumference` | §Finding the Radius given Circumference |
| `arc-length-perimeter-sector` | §Arc Length of a Circle, §Perimeter of a Sector |
| `perimeter-composite-arc-figures` | §Perimeter of Shapes Involving Arc Length |

### b. Tags: reverse-area routines, own sections, not reachable from any tagged dp-3 skill (+`s6-std11`, +`dp-s6st11-measurement-3`) — 2 skills

| skill | trace |
|---|---|
| `find-unknown-side-from-area` | §Finding Unknown Sides Given the Area |
| `find-unknown-from-circle-area` | §Finding the Radius Given Area (2 example blocks) |

### c. Tags: re-taught solid routines (+`s6-std11`, + dp shown) — 5 skills

| skill | dp | trace |
|---|---|---|
| `surface-area-partial-cylinder` | measurement-4 | §Surface Area of Cylindrical Solids — formula-identification drill (6 variants: open ends, half, quarter) + calculation sets |
| `surface-area-hemisphere` | measurement-4 | §Surface Area of Spheres — open/closed hemisphere definitions, examples, practice |
| `volume-hemisphere` | measurement-5 | §Volume of Spheres and Hemispheres — examples + practice a/b |
| `volume-capacity-problems` | measurement-5 | §Capacity and Volume — own section; dp-5 names capacity explicitly |
| `identify-slant-perpendicular-height` | measurement-5 | §Volume of Pyramids and Cones Part 2 — 2-step method ($h = \sqrt{c^2-b^2}$, keep exact, then $V = \frac{1}{3}Ah$). **Tag only** — the edge `volume-pyramid-cone ← identify-slant-perpendicular-height` was rejected in the Volume B pass (Part 1/Part 2 split ≠ second routine; edge cross-topic). Tagging records Standard re-teaches it without re-proposing the barred edge. |

### d. Blurb re-scopes (nominal-scope alignment with dp-1/-2 text + booklet) — 3 skills

| skill | before | after |
|---|---|---|
| `convert-length-units` (also title) | title: Convert between metres and kilometres / blurb: Use the decimal place value system to convert length units. | title: Convert between metric units of length / blurb: Convert between millimetres, centimetres, metres and kilometres using the decimal place value system. |
| `convert-mass-units` | Convert between grams, kilograms and tonnes. | Convert between milligrams, grams, kilograms and tonnes. |
| `measurement-prefixes` | Describe prefixes such as milli, centi and kilo for very small and large units. | Describe prefixes from nano ($10^{-9}$) to tera ($10^{12}$), including micro, milli, centi, kilo, mega and giga. |

Traces: booklet 1 §Converting Units of Length (mm–km, Q a–f), §Converting Units of Mass (mg–t, Q a–f), §Metric Prefixes table (giga→nano incl. index notation).

## 4. Borderline candidates → EXCLUDE

- **Base atoms as tags** (`area-of-circle`, `area-of-sector`, `area-trapezium`, `area-composite-figures`, `area-composite-circles`, `pythagoras-find-side`, `pythagoras-find-shorter-side`, `volume-of-prism`, `volume-of-cylinder`, Stage-3 area/perimeter atoms, `surface-area-prism`-family re-teach sections) — all re-taught, but every one is a (transitive) prereq of a skill already tagged to the same dot point; the Standard course view reaches them. Unlike row 49 (where the dot point's own routines *were* the atoms), dp-3–5 are capstone-level and the capstones carry the tags.
- **`trapezoidal-rule-multiple-applications`** — §Many Applications of the Trapezoidal Rule (2 applications, worked + Q a/b). Taught progression inside the same section family; bundled in `trapezoidal-rule`. One skill, not two.
- **`perimeter-mixed-units`** (§Calculate perimeter involving different units) — convert-then-add; instance of `convert-length-units` + perimeter. Ambient.
- **`volume-pyramid-cone-find-height`** — **already rejected** (Volume B §4). Not re-proposed; handled as a tag on `identify-slant-perpendicular-height` (3c).

## 5. Considered-and-omitted

- Length/area/volume/capacity/mass conversions, volume↔capacity ($1\ cm^3 = 1\ mL$) → `convert-length-units`, `convert-area-units`, `convert-volume-capacity-units`, `convert-mass-units` (all already tagged measurement-1).
- SI-unit vocabulary, "smaller unit → multiply" reasoning → ambient within the conversion skills.
- Pythagoras hypotenuse/shorter-side/problems sections → `pythagoras-find-side` → `pythagoras-solve-problems` (tagged).
- Squares/rectangles/parallelograms/triangles/trapezium/composite/irregular area sections → Stage 3–5 chain under tagged `composite-area-problems` + `irregular-land-area`.
- SA of rect/triangular prisms without nets, closed cylinders, composite prisms, spheres → `surface-area-prism`, `surface-area-cylinder`, `surface-area-composite-solids`, `surface-area-sphere` (all tagged measurement-4).
- Volume of prisms/cylinders/composites, pyramids/cones Part 1, composite w/ spheres → tagged measurement-5 set.
- Trapezoidal rule single application → `trapezoidal-rule` (tagged measurement-6).
- Syllabus lines with **no booklet content**: scientific-notation-with-prefixes exercises and significant-figures work (dp-2 — booklet 1 has only the prefix table, no sci-notation or sig-fig practice; `scientific-notation` / `round-significant-figures` stay tagged from earlier passes). Flagged for booklet revision.

## Net change

- **0 new skills, 0 new edges**
- **16 re-scopes** (13 course/dot-point tags, 3 blurbs)
