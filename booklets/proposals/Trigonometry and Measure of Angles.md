# Trigonometry and Measure of Angles — atomisation proposal

**Status: applied — 1 cross-tag, 0 new skills/edges.**

## Context

Topic `t-s6adv11-trig` (Stage 6 Advanced Y11), dot points
`dp-s6adv11-trig-1`–`dp-s6adv11-trig-5`. Three booklets audited:

- `Trigonometry and Measure of Angles 1_Trigonometry with acute angles.md`
- `Trigonometry and Measure of Angles 2_Trigonometry with angles of any magnitude.md`
- `Trigonometry and Measure of Angles 3_Radians.md`

Goal: check for atoms not yet represented in the skill graph.

## Finding

**Topic already fully covered.** Every worked example and practice routine in
all three booklets traces to an existing skill. The graph was populated during
the Stage 5 Path Trigonometry C/D and Stage 6 Standard Y12 Trigonometry passes
(Advanced trig re-treads that ground) plus the radian-specific skills already
tagged to `dp-s6adv11-trig-4`/`-5`. No genuine gaps.

### Coverage map (booklet routine → existing skill)

| Dot point | Booklet routines | Existing skills |
|---|---|---|
| trig-1 (acute, RA triangle, bearings, elev/dep) | RA trig incl. DMS, practical problems, elevation/depression, true/compass bearings, bearing between points, bearing problems, exact 30/45/60 | `trig-find-side`, `trig-find-angle`, `round-angle-degrees-minutes`, `trig-practical-problems`, `identify-elevation-depression`, `elevation-depression`, `bearings`, `bearing-between-two-points`, `bearings-problems`, `exact-trig-ratios` |
| trig-2 (any magnitude, related angles) | complementary angles, periodicity/rewrite to 0–360°, unit-circle coords, reference angles, obtuse, tan↔gradient, any-magnitude defs, exact value all quadrants, graphs, odd/even | `complementary-trig-relationships`, `rewrite-angle-within-revolution`, `unit-circle-definitions`, `related-angles`, `trig-obtuse-relationships`, `gradient-as-tan-inclination`, `angles-any-magnitude-definitions`, `trig-ratios-quadrant-forms`, `astc-sign-of-ratio`, `trig-ratios-multiples-90`, `graph-trig-functions`, `negative-angle-trig-identities` |
| trig-3 (sine/cosine/area, ambiguous) | sine rule (side/angle), ambiguous case, cosine rule (side/angle), area rule, select method | `sine-rule`, `sine-rule-angles`, `cosine-rule`, `cosine-rule-angles`, `area-rule-triangle`, `ambiguous-case-sine-rule`, `sine-rule-obtuse`, `prove-sine-cosine-area-rules`, `non-right-triangle-problems` |
| trig-4 (radians, convert, exact, graph) | convert °↔rad, exact ratios in radians, any-magnitude in radians, graph | `radian-definition`, `convert-degrees-radians`, `exact-ratios-radians`, `graph-trig-radians` |
| trig-5 (arc, sector, segment) | arc length `l=rθ`, sector area `A=½r²θ` | `arc-length-radians`, `sector-area-radians`, `arc-sector-segment-problems` |

## Borderline candidates → EXCLUDE

- **"Selecting an appropriate method"** (booklet 1, dedicated section) — the
  which-rule decision (sine vs cosine vs area). Already bundled:
  `non-right-triangle-problems` blurb reads *"Select and apply the sine, cosine
  or area rule to solve problems."* Redundant (rule 4).
- **"Coordinates of a point on a unit circle"** (booklet 2, two examples) —
  given θ, find `(cos θ, sin θ)`. This is `unit-circle-definitions` applied;
  the radius-`r` generalisation is `angles-any-magnitude-definitions`. Covered.

## Considered-and-omitted

- DMS calculator entry when finding a side — ambient calculator use.
- Investigations (deriving exact values, unit-circle setup, obtuse ratios) —
  derivations, not routine question types.
- Mixed / multistep problem sets and mixed bearings problems — composites of
  the skills already listed, no new atom.

## Cross-tag applied

`area-rule-reverse` (blurb: *"Substitute a known area into $A=\tfrac12 ab\sin C$
and solve for an unknown side or the included angle."*) was tagged only
`dp-s6st12-trig-4` (Standard). Booklet 1 §"Calculate side length of a triangle
given area" is that exact routine under Advanced `dp-s6adv11-trig-3`, so:

`area-rule-reverse` dotPointIds `[dp-s6st12-trig-4]` → `[dp-s6st12-trig-4, dp-s6adv11-trig-3]`.

(Anticipated by the row-65 deferred-cross-tag note.)

## Net change: 1 cross-tag

0 new skills, 0 new edges, 0 re-scopes, 1 dot-point cross-tag. Topic was
otherwise already comprehensively atomised by prior passes.
