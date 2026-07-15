# Proposal — Atomise Volume group (Booklets 1–4, topic `t-s4-vol`)

**Status: APPLIED 2026-07-15** — approved by the user and applied to `data/skills.json`; `npm run validate` clean (1088 skills). QUEUE.md row 3 → applied.

## Context

Queue-mode pass over the four Stage 4 *Volume* booklets:

1. `Volume 1_…different views of prisms…` → **dp-s4-vol-1** (views / cross-sections)
2. `Volume 2_…volume of a prism…` → **dp-s4-vol-2** (`V = Ah`)
3. `Volume 3_…volume of a cylinder…` → **dp-s4-vol-3** (`V = πr²h`)
4. `Volume 4_…units of volume and capacity…` → **dp-s4-vol-4** (units / capacity / convert)

Topic `t-s4-vol`, MA4-VOL-C-01.

## Finding

The topic is already comprehensively covered; every forward routine maps onto an existing skill. The one genuine gap is the **reverse routine** (given the volume/capacity, solve for a length), drilled across three of the four booklets and multiple HSC questions, with no volume analog to the existing reverse skills for area (`find-unknown-from-circle-area`) / perimeter (`find-side-from-perimeter`) / circumference (`find-radius-from-circumference`).

Existing coverage: vol-1 `views-of-prisms`, `cross-sections-prisms`; vol-2 `volume-of-prism`; vol-3 `volume-of-cylinder`; vol-4 `volume-capacity-units`, `convert-volume-capacity-units`, `volume-capacity-problems`.

## Applied — new skill (1)

### `find-dimension-from-volume`
```json
{ "id": "find-dimension-from-volume", "title": "Find a dimension given the volume", "blurb": "Substitute into $V = Ah$ or $V = \\pi r^{2}h$ and solve for an unknown length using inverse operations.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-vol-2", "dp-s4-vol-3"], "prereqs": ["volume-of-cylinder"], "difficulty": 2 }
```
- **Trace:**
  - Volume 2 (prism): Part 1 Q2 (`48 = 4x`); Development Q3 "find the missing value for each pronumeral"; Q4/Q5/Q8 equal-volume solve-for-`x`.
  - Volume 3 (cylinder): Q8 "Determine the unknown dimension of the cylinder"; Q13 "Find the missing length" (`V=22100→h`, `V=180→h`, `V=615.8→r` with a square root).
  - Volume 4 (capacity): HSC Q10 (`12 L = 240·h`), HSC Q12 (`1.26 ML = π(9)²h`), Q17–Q19 "calculate the depth of water using `V=Ah`".
- **Bar:** Distinctive (reverse volume routine) ✓; at-risk (isolated across 3 booklets + repeated HSC) ✓; same stage ✓; non-redundant (no existing skill inverts a volume formula) ✓.
- **Design note:** One multi-case skill spanning both formulas, mirroring the applied `find-unknown-from-circle-area`. `prereq volume-of-cylinder` reaches `volume-of-prism` transitively, so both formulas are covered by one edge. V4 capacity-given cases are the same routine with an ambient `convert-volume-capacity-units` step.

## Edits / new edges

None beyond the new skill's own prereq.

## Borderline → EXCLUDE

- **`is-solid-a-prism`** (Volume 1 identify-prisms yes/no, uniform-cross-section yes/no) — already the content of `cross-sections-prisms` + `compare-prisms-pyramids`.
- **`sketch-prism-from-views`** (Volume 1 Q4/Q5 sketch prism from given faces) — within `views-of-prisms` / s3 `construct-3d-models` family; not an at-risk isolated skill.
- **`capacity-from-volume`** (Volume 4 compute volume → convert) — already `volume-capacity-problems`.

## Considered and omitted (audit trail)

- Views / cross-sections / uniform cross-section — `views-of-prisms`, `cross-sections-prisms`.
- `V=Ah` and `V=πr²h` forward (base-area-given, exact form, triangle/trapezium bases, halve-diameter) — `volume-of-prism`, `volume-of-cylinder`.
- Convert mm³/cm³/m³, mL/L/kL/ML, `1 cm³=1 mL`, `1 m³=1 kL` — `convert-volume-capacity-units`, `volume-capacity-units`.
- Practical capacity/volume problems, fill-rate, area×depth flood/rainfall — `volume-capacity-problems` (`rainfall-volume` exists at s6).
- Fractions of a cylinder (V3 Q5) — application; s5 `volume-prism-curved-cross-section` covers the graph-worthy version.
- % volume change under scaling (V2 Q7, V3 Q11/Q12) — non-routine/competition.

## Net change

- 1 new skill: `find-dimension-from-volume`.
- 0 new edges into existing skills, 0 re-scopes.
