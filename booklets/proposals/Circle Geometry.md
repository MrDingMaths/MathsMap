# Circle Geometry (Stage 5 Path) — atomisation proposal

**Status: APPLIED** — approved 2026-07-17; applied to `data/skills.json`;
`npm run validate` clean (1142 skills, 0 warnings).

## Context

Booklets:

- `Stage 5 Path/Circle Geometry_1 Prove and apply angle and chord properties of circles.md`
- `Stage 5 Path/Circle Geometry_2 Prove and apply tangent and secant properties of circles.md`

Target: topic `t-s5p-cir` (MA5-CIR-P-01), dot points `dp-s5p-cir-1`,
`dp-s5p-cir-2`.

Goal: check whether the 6 existing circle skills cover the ~13 theorems the two
booklets teach.

## Finding (headline)

Coverage is structurally right but **coarse**. Six skills carry two dot points
that between them teach thirteen separate theorems, each with its own section,
worked examples and practice block. The prove/apply split is already modelled
well. Three taught units were bundled into blurbs with no graph presence of
their own, and each is a known high-error routine: **cyclic quadrilaterals**,
the **alternate segment theorem**, and the **intersecting chords/secants
product rule**. Everything else in both booklets is either already covered or
too atomic to record.

## 1. Recommended new skills

### 1.1 `cyclic-quadrilateral-properties`

| Field | Value |
|---|---|
| id | `cyclic-quadrilateral-properties` |
| title | Prove and apply cyclic quadrilateral properties |
| blurb | Use the properties of a cyclic quadrilateral — opposite angles supplementary, and an exterior angle equal to the opposite interior angle — to find unknown angles. |
| stage | 5 |
| courses | `s5-path` |
| dotPointIds | `dp-s5p-cir-1` |
| difficulty | 3 |
| prereqs | `circle-angle-properties` |
| atom type | Fact + Routine |

```json
{
  "id": "cyclic-quadrilateral-properties",
  "title": "Prove and apply cyclic quadrilateral properties",
  "blurb": "Use the properties of a cyclic quadrilateral — opposite angles supplementary, and an exterior angle equal to the opposite interior angle — to find unknown angles.",
  "stage": 5,
  "courses": ["s5-path"],
  "dotPointIds": ["dp-s5p-cir-1"],
  "prereqs": ["circle-angle-properties"],
  "difficulty": 3
}
```

**Booklet trace.** Booklet 1, §Cyclic Quadrilaterals — own section heading,
theorem box (both rules), two worked examples (x = 100°, y = 72°; x = 115°,
y = 95°), Foundation Q1–Q2 (a–i), Development Q2 (j–u).

**Edge bar** (`cyclic-quadrilateral-properties ← circle-angle-properties`):
*distinctive* — the cyclic-quad rules are proved from the angle-at-centre
theorem, which is exactly the enabler; *at-risk* — a student fluent in
angle-at-centre routinely misreads which interior angle an exterior angle
matches; *stage-proximity* — same stage; *non-redundant* — no other path.

**De-bundling type.** Progression chain, not lift-out — the booklet teaches
cyclic quads *after* and *from* the angle-at-centre theorem, so it sits
downstream, per the rubric's `solve-linear-2-step` precedent.

**Nearest dot point.** `dp-s5p-cir-1` ("Prove and apply angle and chord
properties of circles") — cyclic quadrilateral angle rules are angle
properties, and Booklet 1 (which targets dp-1) is where they are taught.

### 1.2 `alternate-segment-theorem`

| Field | Value |
|---|---|
| id | `alternate-segment-theorem` |
| title | Prove and apply the alternate segment theorem |
| blurb | Use the fact that the angle between a tangent and a chord at the point of contact equals the angle in the alternate segment. |
| stage | 5 |
| courses | `s5-path` |
| dotPointIds | `dp-s5p-cir-2` |
| difficulty | 3 |
| prereqs | `tangent-secant-properties` |
| atom type | Fact + Category ("which segment is the alternate one?") |

```json
{
  "id": "alternate-segment-theorem",
  "title": "Prove and apply the alternate segment theorem",
  "blurb": "Use the fact that the angle between a tangent and a chord at the point of contact equals the angle in the alternate segment.",
  "stage": 5,
  "courses": ["s5-path"],
  "dotPointIds": ["dp-s5p-cir-2"],
  "prereqs": ["tangent-secant-properties"],
  "difficulty": 3
}
```

**Booklet trace.** Booklet 2, §Tangent and Secant Properties — named theorem box
with three diagrams, worked example (x = 52°, "Alternate segment theorem"),
Foundation Q2 a–d (name the equal angle), Q4 a–b, Development Q3, Q5 a–c,
Q8 a–f.

**Edge bar** (`← tangent-secant-properties`): *distinctive* — the theorem is
stated about a tangent–chord angle and is meaningless without the tangent facts;
*at-risk* — yes, identifying the alternate segment is the classic failure;
*proximity* — same stage; *non-redundant* — no other path.

A second candidate edge `← circle-angle-properties` was considered (pairing the
tangent–chord angle with an inscribed angle is the identifying step, Booklet 2
Q2). **Dropped as redundant**: `tangent-secant-properties ← circle-angle-properties`
already exists, so it is reachable transitively (rule 4).

**Nearest dot point.** `dp-s5p-cir-2` — it is a tangent property, taught in
Booklet 2.

### 1.3 `intersecting-chords-secants`

| Field | Value |
|---|---|
| id | `intersecting-chords-secants` |
| title | Apply the intersecting chords and secants product rule |
| blurb | Use the equal products of intercepts of intersecting chords or secants, and $CP^2 = AP \times BP$ for a tangent and secant from an external point, to find unknown lengths. |
| stage | 5 |
| courses | `s5-path` |
| dotPointIds | `dp-s5p-cir-2` |
| difficulty | 3 |
| prereqs | `tangent-secant-properties` |
| atom type | Fact + Routine |

```json
{
  "id": "intersecting-chords-secants",
  "title": "Apply the intersecting chords and secants product rule",
  "blurb": "Use the equal products of intercepts of intersecting chords or secants, and $CP^2 = AP \\times BP$ for a tangent and secant from an external point, to find unknown lengths.",
  "stage": 5,
  "courses": ["s5-path"],
  "dotPointIds": ["dp-s5p-cir-2"],
  "prereqs": ["tangent-secant-properties"],
  "difficulty": 3
}
```

**Booklet trace.** Booklet 2, §Further Tangent and Secant Properties — own
section heading, theorem box with all three product rules, three worked examples
(7 × 4 = 8x; 8(x + 8) = 6(6 + 9); 7² = 5(5 + x)), Foundation Q1 (state the rule
per diagram), Q2 a–k, Development Q3 a–f, Q4 a–c (derive a quadratic), Q5,
Mastery Q6 (similarity proof of the rule).

**Edge bar** (`← tangent-secant-properties`): *distinctive* — the third rule of
the group is stated about a tangent from an external point, so the tangent facts
are the enabler; *at-risk* — yes, choosing which of the three product forms a
diagram calls for is the whole difficulty; *proximity* — same stage;
*non-redundant* — no other path.

**Why a separate skill and not blurb text.** It is the only *length/algebra*
routine in the tangent–secant dot point — every other theorem there yields an
angle. Booklet 2 Q4 has students derive and solve a monic quadratic from it.
Different routine, own section, own error surface.

**Nearest dot point.** `dp-s5p-cir-2` — secant properties, taught in Booklet 2.

## 2. Recommended new prereq edges

| Edge | Trace | Bar |
|---|---|---|
| `apply-chord-angle-properties ← cyclic-quadrilateral-properties` | Booklet 1 Development Q2 (j–u) mixes cyclic quads with the other angle work; Booklet 2 §Mixed Practice Q1 does too | Distinctive (cyclic quads are one of the three rule families the "find unknowns" routine selects from); at-risk; same stage; non-redundant once §3's removal lands |
| `apply-tangent-secant-properties ← alternate-segment-theorem` | Booklet 2 §Mixed Practice Q1 b, l, x, d–e | Distinctive; at-risk; same stage; non-redundant |
| `apply-tangent-secant-properties ← intersecting-chords-secants` | Booklet 2 §Mixed Practice Q1 g–i, o–p, u–w, l–n; Development Q2–Q4 | Distinctive; at-risk; same stage; non-redundant |

**Edge removals** (transitive reduction, forced by the above):

- `apply-chord-angle-properties ← circle-angle-properties` — now reachable via
  `cyclic-quadrilateral-properties`.
- `apply-tangent-secant-properties ← tangent-secant-properties` — now reachable
  via either new skill.

## 3. Edits to existing skills

**`circle-angle-properties`** — drop cyclic quads (now
`cyclic-quadrilateral-properties`).

- Before: "Prove and use the angle at the centre, angle in a semicircle, equal
  angles on the same arc and cyclic quadrilateral properties."
- After: "Prove and use the angle at the centre being twice the angle at the
  circumference, the angle in a semicircle being $90°$, and equal angles
  standing on the same arc."

**`tangent-secant-properties`** — drop the alternate segment theorem and the
intersecting chords/secants rule (both now their own skills). Also fixes a
mojibake dash in the old blurb ("tangent–chord" rendered as `tangent?chord`).

- Before: "Prove and use tangent and secant properties, including the
  tangent–chord angle and intersecting chords/secants."
- After: "Prove and use the base tangent properties — a tangent meets the radius
  at $90°$ at the point of contact, and tangents to a circle from an external
  point are equal in length."

## 4. Borderline candidates → EXCLUDE

| Candidate | Reason |
|---|---|
| `tangent-perpendicular-radius` | Single Fact, one-step, Booklet 2 Foundation Q1a–b only. Fails *at-risk* — a student at this dot point does not forget it. Stays in the re-scoped `tangent-secant-properties`. |
| `tangents-from-external-point-equal` | Fact with a short RHS proof (Booklet 2 Q9). Distinctive but not at-risk; low error rate. Stays bundled in the re-scoped `tangent-secant-properties`. |
| `angle-in-semicircle` | Booklet 1 Q10c has students *explain* it as a special case of the angle-at-centre theorem — the booklet itself refuses to treat it as separate knowledge. Stays in `circle-angle-properties`. |
| `equal-chords-equidistant-from-centre`, `perpendicular-from-centre-bisects-chord` | Sub-facts of the chord family. Lifting one forces lifting all four (structural twins rule) — four new skills for one theorem box fails *stay lean*. Stay in `chord-properties`. |
| `common-chord-of-two-circles` | Booklet 1 Mastery Q6 and Development Q5 only, a narrow cluster. Non-routine grain. Stays in `chord-properties`. |
| `derive-quadratic-from-circle-diagram` | Booklet 2 Q4 a–c only. The quadratic-solving topic grafted onto the circle routine — excluded by the **no cross-topic prerequisites** rule. |

## 5. Considered-and-omitted

- **Circle terminology / parts of a circle** (Booklet 1 §Parts of a Circle,
  Foundation Q1–Q5) — already covered by `circle-features` (stage 4) →
  `circle-angle-terminology`.
- **Subtend / standing-on-an-arc naming** (Booklet 1 Q3, Q7–Q10) — this *is*
  `circle-angle-terminology`, already present.
- **Pythagoras in chord diagrams** (Booklet 1 Q3–Q4) — cross-topic graft,
  excluded by scope rules.
- **Isosceles triangles from two radii** (Booklet 1 Q6, Booklet 2 worked example
  y = (180 − 40)/2) — ambient Stage 4 geometry, fails *distinctive*.
- **Congruence proofs of the chord theorems** (Booklet 1 Mastery Q6, Booklet 2
  Q9) — already carried by the existing `chord-properties ← prove-congruent-triangles`
  edge.
- **Similar-triangle proof of the chord product rule** (Booklet 2 Mastery Q6) —
  Mastery-only proof of a rule the routine uses as a Fact; not the enabler of
  the routine itself.

## Net change

3 new skills, 3 new edges, 2 edge removals (transitive reduction), 2 blurb
re-scopes.
