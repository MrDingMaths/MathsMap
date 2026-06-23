# Atomisation proposal — `Area 3_Quadrilaterals`

## Context

Booklet-atomisation for the Stage 4 area unit covering four sections: **Area of
Kites and Rhombuses**, **Area of a Trapezium**, **Area of Composite Figures with
Special Quadrilaterals**, and **Area Problems involving Pythagoras' Theorem**.

Target dot point: **`dp-s4-are-3`** — *"Develop and use the formulas to find the
area of trapeziums, rhombuses and kites to solve problems"* (topic `t-s4-are`,
MA4-ARE-C-01). Rubric: `docs/atomisation-principles.md`.

**Status: APPLIED — 2 skills + 4 edges added to `data/skills.json`.**
`find-unknown-from-trapezium-area` and `area-using-pythagoras` were appended after
`area-composite-quadrilaterals`. `npm run validate` → 0 warnings (1070 skills).

### Existing coverage in the graph (already strong)

| Skill | dp | prereqs | Booklet section it serves |
|-------|----|---------|---------------------------|
| `area-kite-rhombus` (s4, d2) | dp-s4-are-3 | `area-of-triangle` | §1 area `A=½xy` |
| `area-trapezium` (s4, d2) | dp-s4-are-3 | `area-of-parallelogram` | §2 area `A=h(a+b)/2` |
| `area-composite-quadrilaterals` (s4, d3) | dp-s4-are-3 | `area-kite-rhombus`, `area-trapezium` | §3 entirely |
| `area-composite-figures`, `area-composite-circles` | — | — | §3 splits + clock (semicircle−circle) |
| `find-unknown-side-from-area` (s4, d3) | dp-s4-are-1 | `area-of-triangle` | scope is `A=lw/bh/bh⁄2` only — **not** trapezium |
| `classify-quadrilaterals`, `quadrilateral-properties` | dp-s4-geo-2 | — | §1 defs, §2 "identify the special quadrilateral" |

The forward area routines (kite/rhombus, trapezium, composites) are fully covered.
Two genuine gaps remain, both matching patterns already established in this project.

---

## NEW skills (2)

> **User decision:** include skill #1 (`find-unknown-from-trapezium-area`) and a new
> Pythagoras-area skill (#2 below). `choose-rhombus-area-formula` is **dropped** at
> the user's request (see "Dropped per user decision").

### 1. `find-unknown-from-trapezium-area`  — **strong**
- **title:** Find an unknown given a trapezium area
- **blurb:** Substitute into $A = \dfrac{h}{2}(a+b)$ and solve for the height or a
  parallel side using inverse operations.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-are-3"]` ·
  **difficulty:** 3
- **prereqs:** `["area-trapezium"]`
- **atom type:** Routine (R)
- **booklet trace:** §2 **Q7 worked example** solving `15 = h(4+6)/2` step-by-step
  for `h` (lines 535–541); §2 **Q8** (solve for a parallel side, area 210, ×3);
  §2 **Q9 a/b** (find height; find other parallel side); §4 **Q9** (area 294 →
  solve for `h`, lines 977–981). Multiple full question sets.
- **bar:** Distinctive — a new *inverse* routine, the structural twin of the
  existing `find-unknown-from-circle-area` (created precisely because
  `find-unknown-side-from-area` doesn't cover circles). ✓ At-risk — the bracketed
  two-variable rearrangement (`×2`, then `÷` the side-sum) is fresh at s4 and Q7 is
  a full worked solution devoted to it. ✓ Same stage. ✓ Non-redundant —
  `find-unknown-side-from-area` is `lw/bh/bh⁄2` only and sits on a *different* dot
  point (dp-s4-are-1); nothing inverts the trapezium formula today. ✓
- **design note:** Mirrors `find-unknown-from-circle-area` exactly (shape-specific
  inverse skill on the shape's own dot point). The inverse-operations / equation
  mechanics are cross-topic algebra and deliberately **not** added as a prereq —
  consistent with both existing `find-unknown-*` skills, which prereq only the
  forward area skill.

### 2. `area-using-pythagoras`  — **user-requested**
- **title:** Find areas requiring Pythagoras' theorem
- **blurb:** Use Pythagoras' theorem to find a missing length, then apply an area
  formula to find the area of triangles, kites, rhombuses and trapeziums.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-are-3"]` ·
  **difficulty:** 3
- **prereqs:** `["pythagoras-find-side", "area-kite-rhombus", "area-trapezium"]`
- **atom type:** Routine (R)
- **booklet trace:** the whole §4 **"Area Problems involving Pythagoras' Theorem"**
  section — Foundation **Q1 a–j** ("use Pythagoras to find the missing length, then
  find the area", lines 779–821); **Q2** isosceles triangle `h=√(8²−3²)` then area
  (lines 823–831); **Q3** kite `x=√(10²+10²)` then area (lines 833–840); Development
  **Q6 a–f** (find missing sides via Pythagoras → trapezium/triangle area, lines
  876–908); **Q9** trapezium (area→`h`, then Pythagoras for the legs, lines 969–983).
- **bar:** Distinctive — the characteristic routine of §4 is the *two-step* bridge
  (Pythagoras for a length ⇒ substitute into an area formula); it is the explicit
  subject of the section's instruction line and every question. ✓ At-risk — deciding
  *that* a length is missing and *which* right triangle to use is the classic stumble,
  and the section exists to drill it. ✓ Same stage (all prereqs are s4). ✓
  Non-redundant — no existing skill composes Pythagoras with the quadrilateral area
  formulas; the forward area skills assume all lengths are given. ✓
- **prereq / cross-topic note:** the user has **explicitly requested** this skill, so
  `pythagoras-find-side` is included as a prereq — a deliberate, scoped exception to
  the no-cross-topic rule, justified because this skill *is* the Pythagoras↔area
  bridge (Pythagoras is not bolted onto an otherwise-complete area routine; it is the
  routine's defining first step). `area-kite-rhombus` + `area-trapezium` together
  cover every area formula §4 uses: triangle/parallelogram/rectangle are reached
  transitively (`area-kite-rhombus ← area-of-triangle ← area-of-parallelogram ←
  area-of-rectangle`), so no extra area edges are added (transitive reduction).

---

## NEW prerequisite edges

Both new skills ship with their own prereq edges (above):
- `find-unknown-from-trapezium-area ← area-trapezium`
- `area-using-pythagoras ← pythagoras-find-side`, `← area-kite-rhombus`,
  `← area-trapezium`

**No new existing→existing edges.** §3 composites are already served by
`area-composite-quadrilaterals` (+`area-composite-figures`/`area-composite-circles`
for the clock).

---

## Dropped per user decision

- **`choose-rhombus-area-formula`** (decide `½xy` vs `bh` for a rhombus). It cleared
  the at-risk bar (§1 Q2 and Q5 are explicit explain-the-error questions, plus the
  "Identify formula for area" section), but the user opted to stay leaner and not add
  it. Recorded here for audit; not proposed.

## Borderline candidates considered → EXCLUDE

- **`identify-trapezium-sides`** (label the two parallel sides `a,b` and the
  perpendicular height `h`). Structural twin of the existing
  `identify-base-perpendicular-height` (parallelogram/triangle). Trace: §2
  *"Identify sides of a trapezium"* section + Key Ideas (lines 292–315).
  **EXCLUDE:** in routine trapezium questions the parallel sides and the marked
  perpendicular height are given/obvious, and — unlike the parallelogram/triangle
  twin, which has an explicit slant-vs-height *error* question (Area 1 "Jimmy" Q6)
  — this booklet has **no** analogous trapezium error item. The genuinely at-risk
  case (only a slant leg given ⇒ find `h` by Pythagoras) is cross-topic. Too thin
  to clear the at-risk bar; the twin-splitting rule does not force a twin that
  fails the bar.
- **`square-area-via-rhombus`** (§4 Q4: square with diagonal 20 ⇒ area via
  Pythagoras; "a square is also a rhombus"). **EXCLUDE:** one-off conceptual /
  cross-topic (Pythagoras) item, not a routine; the rhombus-identity content is in
  `classify-quadrilaterals`.

---

## Considered and omitted (ambient / elementary / already covered — audit trail)

- **§1 diagonals vocabulary** (adjacent vs non-adjacent vertices; "identify
  diagonals" a–i) — elementary geometry vocabulary, not an assessable routine;
  supports `classify-quadrilaterals`.
- **§1 kite/rhombus definitions; "a rhombus is a kite and a parallelogram"** —
  `classify-quadrilaterals` / `quadrilateral-properties`.
- **§1 area of kite/rhombus `A=½xy`** — `area-kite-rhombus`.
- **§2 area of trapezium `A=h(a+b)/2`** — `area-trapezium`.
- **§2 "Identify the special quadrilateral" (Q4) / "identify then calculate" (Q5)**
  — `classify-quadrilaterals` + the relevant existing area skill.
- **§2 Review: evaluate `4(3+9)/2` etc.** — ambient arithmetic / substitution.
- **§2 Q10 derive the trapezium formula by dissection** — derivation/proof with an
  algebra graft, not a routine skill.
- **§2 Q11 degenerate trapezium → triangle; §2 Q12 lawn area `=9x²+6x`** —
  non-routine conceptual / cross-topic algebra (expand brackets); excluded per the
  no-cross-topic and routine-only rules.
- **§3 composite figures (whole section), shaded-area-by-subtraction, the
  grandfather-clock (trapezium+rectangle+semicircle−circle)** —
  `area-composite-quadrilaterals`, `area-composite-figures`, `area-composite-circles`.
- **§4 "Area Problems involving Pythagoras' Theorem"** — captured by the
  user-requested `area-using-pythagoras` (skill #2). Pythagoras itself remains its own
  topic (`t-s4-pyt`, skill `pythagoras-find-side`); only the area↔Pythagoras bridge is
  added here. Q9's area→length step additionally *reinforces*
  `find-unknown-from-trapezium-area`.
- **Worded/applied problems** (flying kite Q4, barn, squash court, logo, hexagon as
  two trapeziums) — applications of the existing composite/area skills, not separate
  atoms.

---

## Net change summary

- **New skills:** 2 — `find-unknown-from-trapezium-area`, `area-using-pythagoras`.
- **New edges:** 4 — `find-unknown-from-trapezium-area ← area-trapezium`;
  `area-using-pythagoras ← {pythagoras-find-side, area-kite-rhombus, area-trapezium}`.
  No new existing→existing edges.
- Attaches to existing dot point **`dp-s4-are-3`**. No new dot points.

## On approval — execution steps (NOT yet done)

1. Append the two new skill objects to `data/skills.json`
   (`find-unknown-from-trapezium-area`, `area-using-pythagoras`), each with its own
   `prereqs`.
2. No edits to existing skills' `prereqs` (both new skills are downstream/terminal).
3. Run `npm run validate` — confirm all `prereqs`/`dotPointIds` resolve, the graph
   stays acyclic, and transitive-reduction holds.

**STOP for review before applying to `data/skills.json`.**
