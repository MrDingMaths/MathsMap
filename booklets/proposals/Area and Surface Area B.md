# Proposal — Atomise `Area and Surface Area B` (Path)

**Status: APPLIED** (skills.json updated, `npm run validate` clean).

**Context.** Booklet: `Stage 5 Path/Area and Surface Area B_1 Solve problems
involving surface areas.md`. Target topic `t-s5p-are-b`, dot point
**dp-s5p-are-b-1** ("Solve problems involving surface areas"). MA5-ARE-P-01.

**Finding (headline).** Near-saturated: five skills already sit on the single dot
point and every section has a home (`identify-slant-perpendicular-height` →
`surface-area-pyramid` / `surface-area-cone` / `surface-area-sphere` →
`surface-area-composite-pyramid-cone-sphere`). Two mismatches only, both at the
blurb level rather than missing routines: `surface-area-cone` says "curved surface
area $A=\pi rl$", but the booklet teaches and drills the **total**
$A=\pi r^{2}+\pi rl$ throughout; and `surface-area-sphere` says spheres, while the
booklet gives **hemispheres** their own teaching block, open/closed distinction and
Foundation set. The hemisphere case is the structural twin of
`surface-area-partial-cylinder`, approved in the Area A pass, so it gets the same
treatment.

## 1. Recommended new skills (1)

### 1.1 `surface-area-hemisphere`

| field | value |
|---|---|
| id | `surface-area-hemisphere` |
| title | Find the surface area of a hemisphere |
| blurb | Apply $A=2\pi r^{2}$ for an open hemisphere, adding the circular face $\pi r^{2}$ when the hemisphere is closed. |
| stage | 5 · courses `["s5-path"]` · dotPointIds `["dp-s5p-are-b-1"]` · difficulty 2 |
| prereqs | `["surface-area-sphere"]` |
| atom type | Routine (Category sub-step: open or closed?) |

```json
{ "id": "surface-area-hemisphere", "title": "Find the surface area of a hemisphere", "blurb": "Apply $A=2\\pi r^{2}$ for an open hemisphere, adding the circular face $\\pi r^{2}$ when the hemisphere is closed.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-are-b-1"], "difficulty": 2, "prereqs": ["surface-area-sphere"] }
```

**Booklet trace:** §"Surface Area of Spheres" — its teaching block defines all
three cases ("A **hemisphere** is half a sphere. An **open** hemisphere is half a
hollow sphere. It has no circular face. A **closed** hemisphere is half a solid
sphere. It has a circular face") and derives $A=\frac12\times4\pi r^{2}=2\pi r^{2}$
in a table beside the sphere formula; the Example computes spheres **and open
hemispheres** together ($\approx19.24$); Foundation Q2a–c is a hemisphere-only set
($30.41$ m²). Used again in Development Q5 (water buoy, exact form $1035\pi$ cm²)
and Q6 (hemisphere on a cone → $332.7$ cm²).

**Bar:** (1) *Distinctive* — the open/closed decision (is there a circular face?)
is a real sub-decision the formula alone doesn't carry; identical in kind to the
"is there a new flat surface where the cylinder was cut?" decision that justified
`surface-area-partial-cylinder`. (2) *At-risk* — omitting or wrongly adding the
$\pi r^{2}$ face is the failure mode; the booklet defines open vs closed before any
arithmetic. (3) *Stage-proximity* — same stage. (4) *Non-redundant* — downstream of
`surface-area-sphere` per the progression-chain rule.

## 2. Recommended new prereq edges (1, net 0 after transitive reduction)

- **`surface-area-composite-pyramid-cone-sphere ← surface-area-hemisphere`** —
  Development Q5 (buoy: cone + hemisphere), Q6 (hemisphere sits on a cone, slant
  height $\sqrt{125}$), Mastery Q7. *Transitive reduction:* **drop**
  `surface-area-composite-pyramid-cone-sphere ← surface-area-sphere` (reachable
  through the new skill). Its `surface-area-pyramid`, `surface-area-cone` and
  `surface-area-composite-solids` edges stay.

## 3. Edits to existing skills (1 re-scope)

- **`surface-area-cone`** — before: *"Apply the curved surface area $A=\pi rl$ for
  right cones."* → after: *"Apply $A=\pi r^{2}+\pi rl$ for right cones, where
  $\pi rl$ is the curved surface and $l$ is the slant height."* No prereq change.
  Trace: §Surface Area of Cones — the Example, Guided Practice and the whole
  Foundation set all use $A=\pi r^{2}+\pi rl$; the curved-only form never appears
  alone. (The syllabus bullet names only $\pi rl$, which is presumably why the
  blurb was written narrowly — but the booklet is the authority per the
  booklet-required rule, and the closed cone is what students are actually asked
  for.)

## 4. Borderline candidates → EXCLUDE

- **`surface-area-pyramid-find-slant-height`** — the booklet splits §"Surface Area
  of Pyramids: Slant height Given" from §"Surface Area of Pyramids: Find Slant
  Height", two sections with their own Examples and question sets. Excluded: the
  extra step is a Pythagoras application that is already an atom
  (`identify-slant-perpendicular-height`) **and** already an edge
  (`surface-area-pyramid ← identify-slant-perpendicular-height`), so the
  composition is reachable — it fails the non-redundancy test. This is also the
  `surface-area-prism-without-net` situation from the Area A pass: a booklet
  splitting a section for teaching order is not by itself a second routine.
- **`find-radius-from-surface-area`** (reverse the formula: given $A$, find $r$) —
  Foundation Q3a–c ($0.89$ m). Real reverse routine, but three items with no
  teaching section, and it is one rearrangement of an already-graphed formula.
  Excluded for leanness; noted as the closest call.
- **`derive-cone-curved-surface-formula`** — §Investigation "Deriving the formula
  for the surface area of a cone" (sector-of-a-circle argument). Excluded as a
  derivation/verification activity, not a routine — same treatment the Trigonometry
  C pass gave "use graphing applications to verify the sine rule".

## 5. Considered-and-omitted (already covered)

- §Perpendicular Heights and Slant Heights (§Heights identify Example;
  §Calculating Heights Example) → `identify-slant-perpendicular-height ←
  pythagoras-problems`, matching both syllabus bullets.
- §Surface Area of Pyramids (both sections, incl. "compare methods of solution") →
  `surface-area-pyramid`.
- §Surface Area of Cones arithmetic ("why is $r=9$? *The diameter is 18*") →
  diameter-to-radius, ambient.
- §Surface Area of Spheres, $A=4\pi r^{2}$ → `surface-area-sphere`; "The proof of
  the sphere formula is outside the scope of high school" — explicitly no atom.
- Development Q4 (how many spheres can 1 L of paint cover — unit conversion
  cm²/m²) → cross-topic measurement conversion; no edge per the scope rule.
- Mastery Q7 composite solids → `surface-area-composite-pyramid-cone-sphere`.

## Net change applied

- **+1 skill:** `surface-area-hemisphere`
- **+1 edge, −1 edge** by transitive reduction (net **0**)
- **1 blurb re-scope:** `surface-area-cone`
