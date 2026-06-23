# Atomisation proposal — `Area 2_Circles and Sectors`

## Context

Booklet: `booklets/Area 2_Circles and Sectors.md`. Target dot point: **`dp-s4-are-2`**
("Develop and use the formula to find the area of circles and sectors to solve
problems", topic `t-s4-are`, MA4-ARE-C-01). Proposal **only** — nothing applied to
`data/skills.json` yet.

**Existing coverage in the graph (already good):**
- `area-of-circle` (s4) ← `pi-definition`, `substitute-into-expressions`
- `area-of-sector` (s4) ← `area-of-circle`
- `area-composite-circles` (s4) ← `area-of-sector`, `area-composite-figures`

**Gaps the booklet exposes:**
1. The entire final section **"Finding the Radius Given the Area"** (booklet
   lines ~850–1207) — solving the area formula *backwards* for the radius,
   diameter or angle. No inverse skill exists for circles/sectors
   (`find-unknown-side-from-area` only covers `A=lw, bh, bh/2` on `dp-s4-are-1`).
2. Two tricky, at-risk **sub-steps** bundled invisibly into the coarse skills —
   the classic "lift the conversion sub-step out" pattern. They are structural
   twins (each converts the *given* measurement into the one the formula needs):
   - **Halving the diameter** to get the radius before substituting.
   - **Finding the interior angle** of a sector when the *exterior* angle is given.

---

## Recommended NEW skills

### 1. `halve-diameter-for-radius`
- **title:** Halve the diameter to find the radius
- **blurb:** `Halve a given diameter to find the radius before substituting into a circle formula.`
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-are-2"]` · **difficulty:** 1
- **prereqs:** `["circle-features"]` (must identify which length is the diameter)
- **atom type:** Transformation (T)
- **booklet trace:** Key Ideas #3 (line 106 — "change diameter to radius by halving"); Q4 pizza tray *diameter* 30 (line 192); **Q8 Ed's error — "radius is 7/2, not 7"** (lines 219–228, the question exists solely to test this); Q10 pool diameter 4.5 (line 238); Q12 mirror diameter 55 (line 253); Q13 12-inch pizza (line 263).
- **bar:** Distinctive (the characteristic conversion the formula demands, not ambient arithmetic) ✓; at-risk — Q8 is built entirely around forgetting it ✓; same stage ✓; non-redundant — not reachable from `area-of-circle` today ✓.

### 2. `sector-interior-angle`
- **title:** Find the interior angle of a sector
- **blurb:** `Use that the interior and exterior angles of a sector sum to 360° to find the interior angle.`
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-are-2"]` · **difficulty:** 1
- **prereqs:** `[]` (the 360° fact *is* the skill content)
- **atom type:** Fact / Transformation (F/T)
- **booklet trace:** "Identify interior angle of a sector" section incl. "interior and exterior must sum to 360°" (lines 347–362); **Q5 Jerry's error — fraction taken from the wrong angle** (lines 511–518); Q8 "the angle shown is the exterior angle" (line 539); Q12f "find the outside angle" (line 1200); Guided Practice d (find interior angle).
- **bar:** Distinctive (characteristic enabler when the exterior angle is given) ✓; at-risk — Jerry's error + multiple exterior-angle question sets ✓; same stage ✓; non-redundant ✓. **Structural twin of #1** (both: convert the given measurement to the formula's input) — per the split-the-twins rule, both lifted.

### 3. `find-unknown-from-circle-area`
- **title:** Find an unknown given a circle or sector area
- **blurb:** `Substitute into A = πr² or A = (θ/360)πr² and solve for the radius, diameter or angle using inverse operations.`
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-are-2"]` · **difficulty:** 3
- **prereqs:** `["area-of-sector"]` (single edge covers both circle and sector inverse cases; `area-of-sector → area-of-circle`, so the circle formula is reachable transitively — no separate `area-of-circle` edge needed)
- **atom type:** Routine (R)
- **booklet trace:** whole "Finding the Radius Given the Area" section — worked Example solving a semicircle for r (lines 893–919); Guided Practice a–c (radius), d (angle) (lines 925–940); Foundation Q1 circle, Q2 semicircle/quadrant, Q3 diameter (lines 945–997); Q4 radius from area in terms of π (line 999); Q12 a/c radius & diameter, **d/e/f angle** (lines 1184–1207); Mixed Q9c/d (line 1136).
- **bar:** Distinctive new *inverse* routine ✓; at-risk (square-root + ÷π rearrangement, fresh at s4) ✓; same stage ✓; non-redundant — no existing skill inverts the circle/sector area formula (`find-unknown-side-from-area` is rectangle/triangle only, different dot point) ✓.
- **design note:** Modelled on the existing multi-case `find-unknown-side-from-area` (one skill, several shapes). Folding "solve for radius/diameter" and "solve for angle" into **one** skill keeps the graph lean and faithful to the booklet's single section. (Alternative — splitting off `find-sector-angle-from-area` — is listed under Borderline below; recommended against.)

---

## Recommended NEW prerequisite edges (to existing skills)

| Skill (X) | New prereq (P) | Justification |
|-----------|----------------|---------------|
| `area-of-circle` | `halve-diameter-for-radius` | Diameter-given questions need the halving step first; at-risk (Q8). Non-redundant. |
| `area-of-sector` | `sector-interior-angle` | Exterior-angle questions need the interior angle first; at-risk (Q5, Q8, Q12f). Non-redundant. |

(`find-unknown-from-circle-area` ships with its own prereq `area-of-sector`, above.)
No new *existing→existing* edges are warranted — the composite section is already
served by `area-composite-circles`.

---

## Borderline candidates — recommend EXCLUDE

- **`area-circle-exact-pi`** ("give the area in exact form in terms of π", e.g. write `25π` instead of pressing the π button). Heavily featured (Interpret box lines 108–121; Foundation Q1/Q3; sector Q4/Q7). **Excluded:** for whole-number radii this is a *presentation convention* (stop before the decimal step), not an at-risk routine — the squaring is ambient. Lifting it would pollute the graph. Easy to add later if the user wants it surfaced.
- **`find-sector-angle-from-area`** (split the angle-finding case out of skill #3). **Excluded:** kept folded into `find-unknown-from-circle-area` to mirror the existing `find-unknown-side-from-area` multi-case design and stay lean. The angle case is the same inverse-operations routine without the square root.

---

## Considered and omitted (audit trail)

- **Round to 2 d.p. / square numbers / square the radius** — ambient arithmetic; the booklet's own *Review* boxes cover them.
- **Take the square root / divide by π when solving** — the inverse mechanics are cross-topic (indices/equations) grafted onto the routine; excluded per the no-cross-topic rule. `square-cube-roots` (an indices skill) is therefore **not** added as a prereq of skill #3 — consistent with `find-unknown-side-from-area`, which prereqs only `area-of-triangle`, not an equation-solving skill. The routine is captured at the right grain by skill #3 itself.
- **Area in terms of π as a fraction** (e.g. `49/4 π` from a fractional radius, Q6/Q8b) — a compound of halve-diameter + fraction-squaring + exact-form; low-frequency, non-routine combination.
- **Identify radius/diameter from a diagram** — already covered by `circle-features`.
- **"Fraction of circle = θ/360"** — already inside `area-of-sector`.
- **Composite add-vs-subtract decision** — already inside `area-composite-circles`.
- **Worded/applied problems** (pizza value, sprinkler, tablecloth radius +15, racetrack) — applications of the above skills, not separate atoms.
- **Challenge Exercise** (algebraic area/perimeter in terms of x; percentage-shaded with variables; trial-and-error / quadratic radius) — non-routine/competition; excluded per scope rule.
- **HSC composite questions** (Mixed Q5/Q10, Finding-radius Q10) — covered by `area-composite-circles` / existing skills.

---

## On approval — execution steps (NOT yet done)

1. Append the 3 new skill objects to `data/skills.json`
   (`halve-diameter-for-radius`, `sector-interior-angle`,
   `find-unknown-from-circle-area`).
2. Add `halve-diameter-for-radius` to `area-of-circle.prereqs`.
3. Add `sector-interior-angle` to `area-of-sector.prereqs`.
