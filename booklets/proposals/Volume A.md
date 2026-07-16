# Proposal — Atomise `Volume A` (Core) — **nil result**

**Status: NIL** (booklet audited, no changes to `data/skills.json`).

**Context.** Booklet: `Stage 5 Core/Volume A 1_Solve problems involving composite
solids consisting of right prisms and cylinders.md`. Target topic `t-s5c-vol-a`,
dot point **dp-s5c-vola-1**. MA5-VOL-C-01.

**Finding.** No changes recommended. This is the smallest booklet in the queue so
far (328 lines) and has exactly one teaching section, §Volume of Composite Solids,
whose 3-step method ("Split the composite solid into simple solids / Calculate the
volume of each / Add or subtract the volumes") is precisely
`volume-composite-solids`. The dot point's four syllabus bullets map 1:1 onto four
existing skills, with no leftovers:

| syllabus bullet | skill |
|---|---|
| composite right prisms dissected into triangles and quadrilaterals | `volume-composite-prisms ← volume-of-prism, area-trapezium` |
| uniform cross-sections in the form of sectors, semicircles and quadrants | `volume-prism-curved-cross-section ← volume-of-prism, area-of-sector` |
| volumes of composite solids of prisms and cylinders | `volume-composite-solids ← volume-composite-prisms, volume-of-cylinder` |
| practical problems involving volumes and capacities | `volume-composite-solids` (blurb already says "and solve practical problems") |

## Borderline candidates → EXCLUDE

- **`volume-by-subtraction`** (find the volume of the removed part and subtract) —
  the booklet's method step 3 says "Add **or subtract**", and the case carries real
  weight in the back half: Mastery Q9 (earth excavated so the pool shell fits), Q10
  (tunnel concrete 1 m thick), Q12 (triangular prism with a hole through the
  middle). Excluded: every instance is Mastery-level with no teaching section of its
  own — the Example, Guided Practice and all of Foundation Q1–Q4 are addition ("by
  addition", "by adding the volumes of the two solids"). Subtracting rather than
  adding is one sign in step 3 of a routine `volume-composite-solids` already owns.
  Same treatment the Trigonometry A/C passes gave their Mastery-only multistep
  items.
- **`capacity-conversion-problems`** — Q6c (825 m³ → 825 000 L), Q11 (600 L/min
  fill rate → 20 hours). Excluded as cross-topic: capacity/unit conversion belongs
  to the Stage-4 volume strand (`dp-s4-vol-4`, "Choose appropriate units of
  measurement for volume and capacity and convert between units"), and the scope
  rule bars wiring it in as a prereq here.

## Considered-and-omitted (already covered / ambient)

- Review of Prior Knowledge Q1 ($V=Ah$ on simple solids) → `volume-of-prism`,
  ambient here.
- Example + Guided Practice (composite prisms, $V_1+V_2=2394$ m³), Foundation Q1
  (two cylinders, 3455.8 cm³), Q2, Q3, Q4 (stack of 3 cubes) →
  `volume-composite-solids`.
- Mastery Q8 ("Using the area of a sector $A=\frac{\theta}{360}\times\pi r^{2}$…")
  → `volume-prism-curved-cross-section`.
- Q12a/Q13a (Pythagoras for a missing length, then "hence" the volume) →
  cross-topic Pythagoras grafted onto the routine; no edge per the scope rule.

## Net change: none

The pass audited the booklet and found the graph already saturated at this dot
point.
