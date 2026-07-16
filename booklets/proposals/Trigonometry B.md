# Proposal — Atomise `Trigonometry B` (Core) group

**Status: APPLIED** (skills.json updated, `npm run validate` clean).

**Context.** Booklets: `Stage 5 Core/Trigonometry B 1_Solve right-angled triangle
problems involving angles of elevation and depression.md`, `Stage 5 Core/
Trigonometry B 2_Solve right-angled triangle problems involving bearings.md`.
Target topic `t-s5c-trg-b`, dot points **dp-s5c-trgb-1** (elevation/depression)
and **dp-s5c-trgb-2** (bearings). MA5-TRG-C-02.

**Finding (headline).** The topic has only three skills (`elevation-depression`,
`bearings`, `bearings-problems`), and each dot point's *solve* end is well
covered — B1's whole §Trigonometry with Angles of Elevation & Depression and B2's
§Problems Involving Bearings and Trigonometry map onto `elevation-depression` /
`bearings-problems` with nothing missing. The gaps are both at the *identify*
end, and both are blurb bundles the booklets teach as standalone sections with
their own Foundation question sets: (1) `elevation-depression`'s blurb says
"Identify **and** solve", but B1 spends its entire first half on identification
alone; (2) `bearings` covers sketch/interpret/convert, but neither it nor
`bearings-problems` reaches B2's §"Calculating Bearing Between Two Locations" —
the "bearing of A **from** B" routine, which is ~390 lines of the booklet.

## 1. Recommended new skills (2)

### 1.1 `identify-elevation-depression`

| field | value |
|---|---|
| id | `identify-elevation-depression` |
| title | Identify an angle of elevation or depression |
| blurb | Identify and mark the angle of elevation or depression on a diagram, measuring from the horizontal to the line of sight. |
| stage | 5 · courses `["s5-core"]` · dotPointIds `["dp-s5c-trgb-1"]` · difficulty 1 |
| prereqs | `[]` |
| atom type | Category (is this angle the elevation / depression / neither?) |

```json
{ "id": "identify-elevation-depression", "title": "Identify an angle of elevation or depression", "blurb": "Identify and mark the angle of elevation or depression on a diagram, measuring from the horizontal to the line of sight.", "stage": 5, "courses": ["s5-core"], "dotPointIds": ["dp-s5c-trgb-1"], "difficulty": 1, "prereqs": [] }
```

**Booklet trace:** B1 §"Angles of Elevation and Depression" — Example 1 ("Identify
whether the angle shown is an angle of elevation, depression, or neither", a–h),
Example 2 (compute the angle: $\theta+70^{\circ}+90^{\circ}=180^{\circ}$; and
"Why is $41^{\circ}$ NOT the angle of depression?" → $\theta=90^{\circ}-41^{\circ}
=49^{\circ}$), Foundation Q1 (which of four diagrams shows a $28^{\circ}$
elevation), Q3a ("Explain why $\theta$ is **not** the angle of depression" —
answer: "not between the line of sight and the horizontal"), Q4a–c and Q5a–c
("Mark the angle of elevation/depression θ and find its size"). This is the whole
first half of the booklet, before any trigonometry appears.

**Bar:** (1) *Distinctive* — the characteristic enabler of the dp-1 routine; the
booklet's own Key Ideas name it ("measured from the **horizontal**"; "always
equal because they are **alternate** angles on parallel lines"). (2) *At-risk* —
the booklet builds three separate question types around the single misconception
of measuring from the vertical or from the wrong ray, and Q3a asks students to
articulate it. (3) *Stage-proximity* — same stage. (4) *Non-redundant* — a
lift-out per the rubric's lift-out rule; nothing in the graph reaches it
(`elevation-depression`'s blurb *mentions* "identify", which the rule explicitly
says is not reachability).

### 1.2 `bearing-between-two-points`

| field | value |
|---|---|
| id | `bearing-between-two-points` |
| title | Find the bearing between two points |
| blurb | Find the bearing of one point from another, placing the compass rose at the "from" point, e.g. the bearing of $A$ from $B$ is $244^{\circ}$. |
| stage | 5 · courses `["s5-core"]` · dotPointIds `["dp-s5c-trgb-2"]` · difficulty 2 |
| prereqs | `["bearings"]` |
| atom type | Routine (with an invisible Category atom: which point carries the rose) |

```json
{ "id": "bearing-between-two-points", "title": "Find the bearing between two points", "blurb": "Find the bearing of one point from another, placing the compass rose at the \"from\" point, e.g. the bearing of $A$ from $B$ is $244^{\\circ}$.", "stage": 5, "courses": ["s5-core"], "dotPointIds": ["dp-s5c-trgb-2"], "difficulty": 2, "prereqs": ["bearings"] }
```

**Booklet trace:** B2 §"Calculating Bearing Between Two Locations" (lines
401–789) — its own teaching points ("'**From**' shows where you start a bearing";
"Bearing of 'B from A' means: stand at A, find direction to B"), two
Step 1 / Step 2 Examples (bearing of $A$ from $B$ is $244^{\circ}$; is
$025^{\circ}$), and a large Foundation set. Reappears as the terminal step of the
§Problems Involving Bearings and Trigonometry Foundation questions: Q3
(Anne/Ben/Carol, $060^{\circ}$), Q4 (bearing from A to B via $90-\theta$,
$041^{\circ}49'$), Q5 (pigeon, via $180+\theta$, $252^{\circ}41'$), Q6 (bearing
from the island **back** to Sydney, $305^{\circ}$).

**Bar:** (1) *Distinctive* — deciding which point carries the compass rose, and
converting the in-triangle angle to a bearing ($90-\theta$, $180+\theta$,
back-bearing), is the characteristic enabler; `bearings` only reads a bearing
already drawn from a stated origin. (2) *At-risk* — reversing "A from B" into
"B from A" is the classic bearings error, and the booklet's Q6 targets exactly
it. (3) *Stage-proximity* — same stage. (4) *Non-redundant* — not reachable
through `bearings` or `bearings-problems`.

## 2. Recommended new prereq edges (2, net +1 after transitive reduction)

- **`elevation-depression ← identify-elevation-depression`** — B1 §Trigonometry
  with Angles of Elevation & Depression step 1 is "Draw a diagram and label the
  key information", i.e. mark the angle before any ratio is chosen. Bar:
  distinctive, at-risk, same stage, not otherwise reachable.
- **`bearings-problems ← bearing-between-two-points`** — B2 §Problems Involving
  Bearings and Trigonometry Foundation Q3–Q6, where trigonometry finds $\theta$
  and the bearing routine converts it to a three-digit bearing. *Transitive
  reduction:* `bearings` becomes reachable through the new skill, so **drop** the
  existing `bearings-problems ← bearings` edge. (`bearings-problems ←
  trig-practical-problems` stays.)

## 3. Edits to existing skills (1 re-scope)

- **`elevation-depression`** — before: *"Identify and solve problems involving
  angles of elevation and depression."* → after: *"Solve practical problems
  involving angles of elevation and depression using trigonometry."* (Lift-out
  rule: the identification half now lives in its own skill and is wired in as a
  prereq.) Prereqs become `["trig-practical-problems",
  "identify-elevation-depression"]`.

## 4. Borderline candidates → EXCLUDE

- **`resolve-bearing-into-components`** (sketch the bearing, then label the
  vertical $y$ and horizontal $x$ distance travelled) — B2 §Interpreting Bearing
  Scenarios Q2a–d, Q3a–d, which scaffold it explicitly. Excluded: it is the
  diagram-setup step of `bearings-problems` (its §'s own steps 1–2), inseparable
  from the routine it serves. Absorbed, not split.
- **Vertical-offset elevation problems** (eye level above ground; wall-height
  difference; "will the plane clear the mountain?") — B1 Development Q10, Q11
  (tree, eye level 1.64 m), Q12, Q13, Q14 (submarine/reef). Real recurrence, but
  the offset is an add/subtract on top of an otherwise-complete
  `elevation-depression` solve, and it gates nothing. Excluded for leanness;
  noted as the strongest re-visit candidate if a later booklet gives it a
  teaching section.
- **`sketch-true-bearing` / `sketch-compass-bearing`** — B2 §True Bearings and
  §Compass Bearings Examples + Guided Practice. Excluded: already inside
  `bearings` ("Interpret and convert between true and compass bearings");
  splitting sketching from interpreting would pollute without adding a distinct
  at-risk dependency.

## 5. Considered-and-omitted (ambient / cross-topic / already-covered)

- Three-digit true-bearing convention, compass↔true conversion
  ($S20^{\circ}E=160^{\circ}$; $N40^{\circ}W=320^{\circ}$) → `bearings`.
- All elevation/depression solves (kite, flagpole, cliff/boat, castle wall,
  tower) → `elevation-depression`; all bearing-and-distance solves (ferry,
  cross-country, sailing) → `bearings-problems`.
- Angle-relationship steps throughout (angles in a right angle sum to
  $90^{\circ}$, triangle angle sum, alternate and co-interior angles on parallel
  lines, angles at a point) — B1 Example 2 / Foundation Q2, B2 §Review of Prior
  Knowledge Q1a–f: cross-topic Stage-4 geometry. No edges added, per the scope
  rule.
- Choosing the ratio, evaluating it, inverse-trig for the angle → the
  `trig-practical-problems` chain, now including `evaluate-trig-ratio` (added by
  the Trigonometry A pass).
- "Nearest minute" answers (B2 Q4 $041^{\circ}49'$, Q5 $252^{\circ}41'$; B1 Q15
  $10^{\circ}20'$) → `round-angle-degrees-minutes`, added by the Trigonometry A
  pass and already wired into `trig-find-angle`.

## Net change applied

- **+2 skills:** `identify-elevation-depression`, `bearing-between-two-points`
- **+2 edges, −1 edge** by transitive reduction (net **+1**)
- **1 blurb re-scope:** `elevation-depression`
