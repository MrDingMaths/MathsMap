# Atomisation proposal — Linear Relationships A (Core) — NIL RESULT

**Status: applied (nil) — no changes to `data/skills.json`.**

## Context

Booklet-atomisation workflow ([[booklet-atomisation-workflow]]), QUEUE row 19.
Booklets: `Stage 5/Linear Relationships A 1_Coordinate Geometry.md` +
`Stage 5/Linear Relationships A 2_Graphing Lines.md`. Target: topic
`t-s5c-lin-a`, dot points `dp-s5c-lina-1`–`dp-s5c-lina-4` (MA4-LIN-C-01).

## Finding

**Topic already saturated — no new skills, no new edges.** Every routine in both
booklets lands on an existing node. Eight skills already sit on the four dot
points, plus four Stage-4 feeders they depend on.

| Booklet section | Dot pt | Existing skill |
|---|---|---|
| Gradient from a graph (rise/run); pos/neg/zero/undefined | lina-1 | `gradient-of-interval` |
| Gradient from coordinates (Mastery, no grid) | lina-1 | `gradient-of-interval` (see borderline) |
| Midpoint (average of coords) | lina-1 | `midpoint-of-interval` |
| Distance (Pythagoras, `d=√(rise²+run²)`) | lina-2 | `distance-between-points` (← `gradient-of-interval`, `pythagoras-find-side`) |
| Recognise `y=mx+c` as linear | lina-3 | `linear-representations` / `distinguish-linear-quadratic-exponential` |
| Sketch line from table of values | lina-3 | `graph-linear-relationship` (← `construct-table-of-values`) |
| Identify x-/y-intercepts | lina-3 | `identify-intercepts` |
| Point lies on line (LHS/RHS sub) | lina-3 | `point-satisfies-line` |
| Horizontal/vertical lines `y=c`, `x=k`, axes | lina-4 | `horizontal-vertical-lines` |
| Parallel ⇒ equal gradient | lina-4 | `parallel-lines-equal-gradient` |

## Borderline candidates → EXCLUDE

- **`gradient-from-coordinates`** (compute `m=(y₂−y₁)/(x₂−x₁)` from a coordinate
  pair, no grid — Booklet 1 "Gradient from Coordinates" section + Mastery Q5,
  Q7g–i). Tempting as a progression-chain split off `gradient-of-interval`
  (graph → coordinates). Excluded: (a) `gradient-of-interval`'s blurb "Use
  `m=rise/run`" is representation-agnostic and reasonably reads as both;
  (b) `distance-between-points`, a dependent, already forces rise/run **from
  coordinates**, so the coordinate atom is not independently at-risk beyond the
  graph; (c) small step (signed subtraction), no sibling-consistency trigger,
  graph-pollution averse.

- **`recognise-linear-equation`** (classify `y=mx+c` vs `y=x²`, `y=6/x`, `y=3^x`
  — Booklet 2 "Identify which are linear"). **Already rejected** in the Stage 4
  Linear Relationships proposal (l.102–106): "too elementary/ambient." Prior
  decision stands — not re-proposed.

## Considered and omitted (covered / ambient — audit trail)

| Content | Why omitted |
|---|---|
| Identify pos/neg gradient from diagram | Ambient; bundled in `gradient-of-interval` |
| Complete table by substitution | `construct-table-of-values` (st4) |
| Plot points / read coords | `plot-points-cartesian` (st4) |
| Find `y=mx+c` from gradient + a point (B2 Q8–9); solve for unknown `a` | Cross-dot-point — belongs to Linear Relationships B (`equation-from-gradient-intercept`, QUEUE row 20); drilled fully there |
| Area/perimeter from 4 bounding lines (B2 Q7–8) | Non-routine composite; `horizontal-vertical-lines` + mensuration (cross-topic) |
| Square roots / squares review (B1 Distance) | Ambient arithmetic |

## Net change: none

**Applied — no `data/skills.json` edits. `npm run validate` clean (no-op).**
