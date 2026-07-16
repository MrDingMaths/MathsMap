# Proposal — Atomise `Volume B` (Path)

**Status: APPLIED** (skills.json updated, `npm run validate` clean).

**Context.** Booklet: `Stage 5 Path/Volume B_1 Solve problems involving volumes.md`.
Target topic `t-s5p-vol-b`, dot point **dp-s5p-vol-b-1** ("Solve problems involving
volumes"). MA5-VOL-P-01.

**Finding (headline).** Three skills cover the dot point (`volume-pyramid-cone`,
`volume-sphere`, `volume-composite-pyramid-cone-sphere`) and all four booklet
sections have a home. One gap, and it is the exact twin of the
`surface-area-hemisphere` case approved in the Area B pass: `volume-sphere`'s blurb
says spheres, while the booklet's §Volume of Spheres **and Hemispheres** teaches
both side by side, derives $V=\frac12\times\frac43\pi r^{3}$ in a table, drills them
together in the Example and Guided Practice, and asks for both in its Key Ideas
("1. The volume of a sphere is… 2. The volume of a hemisphere is…"). The syllabus
itself names hemispheres in a bullet the graph had no skill for ("Apply knowledge
of right pyramids, right cones **and hemispheres** to solve problems involving
composite solids").

## 1. Recommended new skills (1)

### 1.1 `volume-hemisphere`

| field | value |
|---|---|
| id | `volume-hemisphere` |
| title | Find the volume of a hemisphere |
| blurb | Apply $V=\tfrac{1}{2}\times\tfrac{4}{3}\pi r^{3}$ for hemispheres. |
| stage | 5 · courses `["s5-path"]` · dotPointIds `["dp-s5p-vol-b-1"]` · difficulty 2 |
| prereqs | `["volume-sphere"]` |
| atom type | Transformation (halve the sphere formula) |

```json
{ "id": "volume-hemisphere", "title": "Find the volume of a hemisphere", "blurb": "Apply $V=\\tfrac{1}{2}\\times\\tfrac{4}{3}\\pi r^{3}$ for hemispheres.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-vol-b-1"], "difficulty": 2, "prereqs": ["volume-sphere"] }
```

**Booklet trace:** §"Volume of Spheres and Hemispheres" — the teaching table defines
the hemisphere beside the sphere and derives $V=\frac12\times\frac43\pi r^{3}$; the
Example computes a sphere ($\approx1436.8$ m³) and a hemisphere together; Guided
Practice a/b covers both; the Key Ideas block has a dedicated hemisphere line.
Reappears in §Volume of Composite Solids. Explicit syllabus bullet naming
hemispheres.

**Bar:** (1) *Distinctive* — the syllabus lists hemispheres as their own applied
case, and it is the shape that composite solids in this topic are actually built
from. (2) *At-risk* — halving $\frac43\pi r^{3}$ while also reading $r$ off a
diameter is the failure mode the booklet's paired Example is built to expose.
(3) *Stage-proximity* — same stage. (4) *Non-redundant* — downstream of
`volume-sphere` per the progression-chain rule; nothing else reaches it.

Deliberately parallel to `surface-area-hemisphere` (Area B pass) — structural twins
get the same treatment, per the rubric's lift-out rule. It is the weaker of the two:
the volume case is one halving with no open/closed decision, hence difficulty 2 and
a Transformation rather than a Routine. Flagged as the pass's one judgement call at
review; approved as proposed.

## 2. Recommended new prereq edges (1, net 0 after transitive reduction)

- **`volume-composite-pyramid-cone-sphere ← volume-hemisphere`** — §Volume of
  Composite Solids Example and question set build solids from cones/pyramids topped
  with hemispheres, matching the syllabus bullet. *Transitive reduction:* **drop**
  `volume-composite-pyramid-cone-sphere ← volume-sphere` (reachable through the new
  skill). Its `volume-pyramid-cone` and `volume-composite-solids` edges stay.

## 3. Edits to existing skills

**None.** `volume-sphere` ("Apply $V=\frac43\pi r^{3}$ for spheres") and
`volume-pyramid-cone` ("Apply $V=\frac13Ah$ for right pyramids and cones") both
already match their booklet sections exactly.

## 4. Borderline candidates → EXCLUDE

- **`volume-pyramid-cone-find-height`** — §"Volume of Pyramids and Cones Part 2" is
  a full section with its own 2-step method ("1. Find perpendicular height using
  Pythagoras $a=\sqrt{c^{2}-b^{2}}$. **Do not round your answer.** 2. Calculate
  volume using $V=\frac{Ah}{3}$"), its own Example ($h=\sqrt{61^{2}-11^{2}}=60$ →
  $9680$ mm³; $h=\sqrt{2275}$ → $11238.3$ mm³) and question set. Excluded on two
  grounds. First, it is the same shape as `surface-area-pyramid-find-slant-height`,
  excluded in the Area B pass — a booklet splitting Part 1 / Part 2 for teaching
  order is not a second routine. Second, the atom it would depend on
  (`identify-slant-perpendicular-height`) sits on `dp-s5p-are-b-1` in topic
  `t-s5p-are-b`, so the edge would be **cross-topic** and is barred by the scope
  rule regardless. Recorded so a future pass doesn't re-derive it.
- **"Do not round your answer" (keep the height exact)** — §Part 2 step 1, and
  $h=\sqrt{2275}$ carried unrounded into the volume. A genuine at-risk decision, but
  absorbed: same call the Area A pass made on `avoid-premature-rounding`.
  (`pythagoras-multistep` and `space-diagonal-3d` carry the exact-intermediate idea
  where it was the section's whole teaching point; here it is one line of a two-step
  method.)

## 5. Considered-and-omitted (already covered)

- §Volume of Pyramids and Cones Part 1 ($V=\frac13Ah$, base area × perpendicular
  height) → `volume-pyramid-cone`, matching the first syllabus bullet.
- §Volume of Spheres and Hemispheres, the sphere half ($V=\frac43\pi r^{3}$,
  $\approx1436.8$ m³) → `volume-sphere`, matching the second bullet.
- §Volume of Composite Solids → `volume-composite-pyramid-cone-sphere`, matching the
  third bullet.
- Practical volume/capacity problems (fourth bullet) →
  `volume-composite-pyramid-cone-sphere` ("volumes and capacities of composite
  solids"); capacity unit conversion itself stays cross-topic, as recorded in the
  Volume A nil pass.
- Review of Prior Knowledge (Pythagoras; $V=Ah$) → Stage-4/5 prior strands, ambient.

## Net change applied

- **+1 skill:** `volume-hemisphere`
- **+1 edge, −1 edge** by transitive reduction (net **0**)
- **0 re-scopes**
