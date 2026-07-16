# Proposal — Atomise `Trigonometry C` (Path) group

**Status: APPLIED** (skills.json updated, `npm run validate` clean).

**Context.** Booklets: `Stage 5/Trigonometry C 1_3D Trigonometry.md`, `Stage 5/
Trigonometry C 2_Non-Right-Angled Trigonometry.md` (both NEW, superseding the OLD
Trigonometry C files). Target topic `t-s5p-trg-c`, dot points **dp-s5p-trg-c-1**
(3D right-angled problems) and **dp-s5p-trg-c-2** (sine/cosine/area rules).
MA5-TRG-P-01.

**Finding (headline).** Seven skills already sit on this topic and every booklet
section has a home — but three of them bundle a split the booklets treat as their
primary teaching structure. C1 separates the **face diagonal** (one triangle, one
application) from the **space diagonal** (two triangles, carry the face diagonal
exactly), while `pythagoras-3d`'s blurb says "edge and diagonal lengths" for both.
C2 separates **Sine Rule for Sides** from **Sine Rule for Angles**, and **Cosine
Rule for Sides** from **Cosine Rule for Angles** — four sections, each with its
own equation form, its own "can I use this rule?" identification drill, and its
own Foundation set — while `sine-rule` and `cosine-rule` each bundle both
directions. C2 also opens with a §Labelling Triangles that nothing in the graph
reaches, and which the later sections keep re-testing in their Review blocks.

## 1. Recommended new skills (4)

### 1.1 `space-diagonal-3d`

| field | value |
|---|---|
| id | `space-diagonal-3d` |
| title | Find a space diagonal in 3D |
| blurb | Apply Pythagoras' theorem twice — face diagonal first, kept exact — to find the space diagonal through the interior of a prism. |
| stage | 5 · courses `["s5-path"]` · dotPointIds `["dp-s5p-trg-c-1"]` · difficulty 2 |
| prereqs | `["pythagoras-3d"]` |
| atom type | Routine (progression chain: two applications + a "keep it exact" decision) |

```json
{ "id": "space-diagonal-3d", "title": "Find a space diagonal in 3D", "blurb": "Apply Pythagoras' theorem twice — face diagonal first, kept exact — to find the space diagonal through the interior of a prism.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-trg-c-1"], "difficulty": 2, "prereqs": ["pythagoras-3d"] }
```

**Booklet trace:** C1 §3D Pythagoras → §"Space Diagonal", its own definition ("a
diagonal through the **interior**"), its own 3-step method ("Draw **two** relevant
right-angled triangles" / "Find the length of the relevant face diagonal. **Keep
it in exact value**" / apply Pythagoras again), Example (diagonal $BH$), Guided
Practice, and Foundation Q2a/b ("find the base diagonal $BE$" → "**hence** find
the prism diagonal $BH$", 15 cm → 17 cm). Contrasted throughout with the preceding
§"Face Diagonal" (one triangle, 2-step method).

**Bar:** (1) *Distinctive* — the two-triangle decomposition and the
exact-intermediate decision are the characteristic enablers; direct precedent in
`pythagoras-multistep` (Right-angled Triangles pass), added for the same "apply
twice, keep the intermediate exact" reason. (2) *At-risk* — the booklet writes
"Keep it in exact value" in bold as its own step and demands exact-form answers in
Guided Practice. (3) *Stage-proximity* — same stage. (4) *Non-redundant* — sits
**downstream** of the re-scoped `pythagoras-3d` per the progression-chain rule.

### 1.2 `label-triangle-sides-angles`

| field | value |
|---|---|
| id | `label-triangle-sides-angles` |
| title | Label the sides and angles of a triangle |
| blurb | Use the convention that side $a$ is opposite angle $A$, and identify opposite side–angle pairs in any triangle. |
| stage | 5 · courses `["s5-path"]` · dotPointIds `["dp-s5p-trg-c-2"]` · difficulty 1 |
| prereqs | `[]` |
| atom type | Fact + Category (which angle does this side not touch?) |

```json
{ "id": "label-triangle-sides-angles", "title": "Label the sides and angles of a triangle", "blurb": "Use the convention that side $a$ is opposite angle $A$, and identify opposite side–angle pairs in any triangle.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-trg-c-2"], "difficulty": 1, "prereqs": [] }
```

**Booklet trace:** C2 §"Labelling Triangles" — the booklet's opening section, with
its teaching points ("lowercase letters represent sides and uppercase represent
angles"; "Opposite sides and angles do not touch"), an Identify drill, a Key Ideas
block ("To find which angle is opposite a side, look for the angle that the side
does NOT touch"), and a Foundation set. Re-tested in the Review blocks of §Sine
Rule for Sides ("Which side is opposite angle $\theta$?") and used by both
sine-rule forms ("a complete 'opposite pair'") and the cosine rule ("$c$ is always
the side OPPOSITE the angle you want to find").

**Bar:** (1) *Distinctive* — the opposite-pair convention is what makes the sine
rule usable at all; it is not ambient (Stage 5 Core trigonometry never needs it,
using O/A/H instead). (2) *At-risk* — the booklet re-reviews it at the top of a
later section, which is its own evidence the cohort is shaky on it.
(3) *Stage-proximity* — same stage. (4) *Non-redundant* — nothing in the graph
reaches it (`label-trig-sides` is the O/A/H convention, a different fact).

### 1.3 `sine-rule-angles`

| field | value |
|---|---|
| id | `sine-rule-angles` |
| title | Apply the sine rule to find an angle |
| blurb | Use $\dfrac{\sin A}{a}=\dfrac{\sin B}{b}$, with $\sin$ in the numerator, to find an unknown angle (ambiguous case excluded). |
| stage | 5 · courses `["s5-path", "s6-std12", "s6-adv11"]` · dotPointIds `["dp-s5p-trg-c-2", "dp-s6st12-trig-2", "dp-s6adv11-trig-3"]` · difficulty 2 |
| prereqs | `["sine-rule"]` |
| atom type | Routine (progression chain downstream of the sides form) |

```json
{ "id": "sine-rule-angles", "title": "Apply the sine rule to find an angle", "blurb": "Use $\\dfrac{\\sin A}{a}=\\dfrac{\\sin B}{b}$, with $\\sin$ in the numerator, to find an unknown angle (ambiguous case excluded).", "stage": 5, "courses": ["s5-path", "s6-std12", "s6-adv11"], "dotPointIds": ["dp-s5p-trg-c-2", "dp-s6st12-trig-2", "dp-s6adv11-trig-3"], "difficulty": 2, "prereqs": ["sine-rule"] }
```

**Booklet trace:** C2 §"Sine Rule for Angles" — a section of its own with the
flipped form $\frac{\sin A}{a}=\frac{\sin B}{b}=\frac{\sin C}{c}$, its own
teaching point ("When finding an angle, have sin in the **numerator**. This makes
it easier to solve for an angle"), its own usability drill ("Identify whether you
can use sine rule to find an **angle**: you need a complete opposite pair AND the
opposite **side** to the angle you want"), a Review block on solving
$\frac{\sin\theta}{20}=\frac{\sin 25^{\circ}}{18}$ and on rounding to the nearest
minute, and its own Foundation set. The syllabus content page lists the two
directions as two separate bullets.

**Bar:** (1) *Distinctive* — the reciprocal form and "what do I need to have?"
precondition differ from the sides case; the booklet teaches them apart.
(2) *At-risk* — students who set up $\frac{a}{\sin A}$ when solving for the angle
end up with the unknown in a denominator inside a sine; the booklet's Review block
exists to pre-empt it. (3) *Stage-proximity* — same stage. (4) *Non-redundant* —
progression chain downstream of the re-scoped `sine-rule`.

### 1.4 `cosine-rule-angles`

| field | value |
|---|---|
| id | `cosine-rule-angles` |
| title | Apply the cosine rule to find an angle |
| blurb | Use the rearranged form $\cos C=\dfrac{a^{2}+b^{2}-c^{2}}{2ab}$, where $c$ is the side opposite the required angle, to find an angle from three known sides. |
| stage | 5 · courses `["s5-path", "s6-std12", "s6-adv11"]` · dotPointIds `["dp-s5p-trg-c-2", "dp-s6st12-trig-3", "dp-s6adv11-trig-3"]` · difficulty 2 |
| prereqs | `["cosine-rule"]` |
| atom type | Routine (progression chain downstream of the sides form) |

```json
{ "id": "cosine-rule-angles", "title": "Apply the cosine rule to find an angle", "blurb": "Use the rearranged form $\\cos C=\\dfrac{a^{2}+b^{2}-c^{2}}{2ab}$, where $c$ is the side opposite the required angle, to find an angle from three known sides.", "stage": 5, "courses": ["s5-path", "s6-std12", "s6-adv11"], "dotPointIds": ["dp-s5p-trg-c-2", "dp-s6st12-trig-3", "dp-s6adv11-trig-3"], "difficulty": 2, "prereqs": ["cosine-rule"] }
```

**Booklet trace:** C2 §"Cosine Rule for Angles" — its own section with the
rearranged formula, its own precondition ("To use the cosine rule to find an
angle, you need the lengths of **all three** sides") with a ✖/✔ drill, its own
teaching point ("$c$ is always the side OPPOSITE the angle you want to find; the
other two are $a$ and $b$, order doesn't matter"), a Review block evaluating
$\cos\theta=\frac{12^{2}+5^{2}-8^{2}}{2(12)(5)}$, a "Write the cosine rule
equation from a diagram" drill, and its own Foundation set. Separate syllabus
bullet ("Rearrange the formula to deduce that $\cos C=\ldots$ and use this to find
an unknown angle").

**Bar:** (1) *Distinctive* — the rearranged subject and the "which side is $c$"
assignment are the characteristic sub-steps. (2) *At-risk* — mis-assigning $c$
silently produces a wrong angle; the booklet drills the assignment separately from
the arithmetic. (3) *Stage-proximity* — same stage. (4) *Non-redundant* —
downstream of the re-scoped `cosine-rule`. (Structural twin of 1.3 — the rubric's
lift-out rule requires treating both the same way.)

## 2. Recommended new prereq edges (7, net +2 after transitive reduction)

- **`sine-rule ← label-triangle-sides-angles`** and **`cosine-rule ←
  label-triangle-sides-angles`** — C2 §Sine Rule for Sides Review ("Which side is
  opposite angle $\theta$?"); §Cosine Rule for Angles ("$c$ is always the side
  OPPOSITE the angle"). Both bars met as in 1.2.
- **`non-right-triangle-problems ← sine-rule-angles`**, **`← cosine-rule-angles`**
  — C2 §Selecting an Appropriate Method ("2 sides 2 angles → Sine Rule; 3 sides 1
  angle → Cosine Rule"), Foundation Q1 (decide the rule) and Q2 (use it), where
  the unknown is a side in some items and an angle in others. *Transitive
  reduction:* **drop** `non-right-triangle-problems ← sine-rule` and
  `← cosine-rule` (both reachable through the new skills). `← area-rule-triangle`
  stays.
- **`trigonometry-3d ← space-diagonal-3d`** — C1 §3D Trigonometry, whose 3-step
  method is "draw two triangles / find the face diagonal exactly / find the
  angle", e.g. $\tan\theta=\frac{5}{\sqrt{185}}=20^{\circ}11'$; Foundation Q2c.
  *Transitive reduction:* **drop** `trigonometry-3d ← pythagoras-3d` (reachable
  via `space-diagonal-3d`).
- **`sine-rule-obtuse ← sine-rule-angles`** and **`ambiguous-case-sine-rule ←
  sine-rule-angles`** — both blurbs are about finding an *angle*, which after the
  re-scope is `sine-rule-angles`, not `sine-rule`. *Transitive reduction:* **drop**
  their `← sine-rule` edges. (Re-scope consequence, not a booklet claim — see §3.)

## 3. Edits to existing skills (3 re-scopes + 1 consequential re-point)

- **`pythagoras-3d`** — before: *"Find edge and diagonal lengths of rectangular
  prisms and other 3D objects."* → after: *"Find edge and face-diagonal lengths of
  rectangular prisms, using the face diagonal as the hypotenuse of a right-angled
  triangle."* (C1 §Face Diagonal.)
- **`sine-rule`** — before: *"Use $\frac{a}{\sin A}=\frac{b}{\sin B}=\frac{c}{\sin
  C}$ to find unknown sides and angles (ambiguous case excluded)."* → after: *"Use
  $\frac{a}{\sin A}=\frac{b}{\sin B}$ to find an unknown side, given a complete
  opposite pair."* Prereqs become `["trig-find-side", "trig-find-angle",
  "label-triangle-sides-angles"]`.
- **`cosine-rule`** — before: *"Use $c^{2}=a^{2}+b^{2}-2ab\cdot\cos C$ to find
  unknown sides, and rearrange to find unknown angles."* → after: *"Use
  $c^{2}=a^{2}+b^{2}-2ab\cos C$ to find an unknown side from two sides and the
  included angle."* Prereqs become `["trig-find-side", "trig-find-angle",
  "label-triangle-sides-angles"]`.
- **`solve-trig-equations`** (consequential) — its blurb names "the ambiguous case
  of the sine rule", i.e. the angle direction; re-point `← sine-rule` to
  `← sine-rule-angles`. No blurb change. Flagged explicitly because it is a
  re-scope consequence rather than a trace from these booklets.
  `prove-sine-cosine-area-rules` keeps its `← sine-rule, cosine-rule` edges —
  proofs are of the sides forms.

## 4. Borderline candidates → EXCLUDE

- **`bearings-non-right-triangle`** — C2 §"Mixed Trigonometry Problems involving
  Bearings" (Q1–Q4: angle $XYZ=96^{\circ}$ from two bearings, then area and the
  third side). Real weight, but the section has **no teaching content** — it is a
  Foundation question set composing `non-right-triangle-problems` with
  `bearing-between-two-points` (added in the Trigonometry B pass). Adding it would
  duplicate `non-right-triangle-problems`'s existing "select and apply" scope, and
  its bearings half would need a cross-topic prereq into `t-s5c-trg-b`, barred by
  the scope rule.
- **`multistep-non-right-triangle`** — C2 §"Mixed Multistep Trigonometry Problems"
  (flower bed, two ladders, segment area, triangular prism volume, equilateral
  triangle from area, two-position building elevation). Also teaching-free, and
  most items graft another topic on (circle sectors, prism volume,
  elevation/depression). Same exclusion the Trigonometry A pass applied to its
  Mastery multistep items.
- **`identify-included-angle`** — C2 §Area of a Triangle using Trigonometry Review
  ("Is 50° the included angle between 11 and 7?", a–d) plus a ✖/✔ usability drill.
  Genuinely at-risk, but it is one Review block serving a single skill; absorbed
  into `area-rule-triangle`, whose blurb already names $a$, $b$ and the included
  $C$. Noted as the closest call in this pass.
- **`area-rule-triangle ← label-triangle-sides-angles`** — excluded: the area rule
  needs the *included angle* relation, not the opposite-pair convention, so the
  edge would not be the characteristic enabler.

## 5. Considered-and-omitted (already covered / cross-topic / ambient)

- Face diagonals (C1 §Face Diagonal, Example $AC$, Guided Practice $FH$) →
  re-scoped `pythagoras-3d`.
- Space-diagonal **angle** problems and two-observation-point problems (C1 §3D
  Trigonometry, §3D Problems: flagpole from A due south and B due east; tent pole
  and pegs) → `trigonometry-3d`, whose blurb and prereq set already name bearings
  and elevation/depression, plus `interpret-3d-trig-context` for the "break the
  scenario into 2D triangles" step.
- Sine rule for sides, cosine rule for sides, the area rule $A=\frac{1}{2}ab\sin
  C$ → `sine-rule`, `cosine-rule`, `area-rule-triangle`.
- §Selecting an Appropriate Method (2 sides 2 angles → sine; 3 sides 1 angle →
  cosine; SAS → area) → `non-right-triangle-problems` ("Select and apply the sine,
  cosine or area rule").
- "Use graphing applications to verify the sine/cosine/area rule" (three syllabus
  bullets) → verification activities, not routines; no atom.
- Solving proportion equations $\frac{x}{7}=\frac{12}{5}$ (C2 §Sine Rule for Sides
  Review) → ambient algebra.
- Rounding to the nearest minute (C2 §Sine Rule for Angles Review a–d) →
  `round-angle-degrees-minutes`, added by the Trigonometry A pass.
- Exact-form surds in C1 answers ($\sqrt{90}$, $\sqrt{137}$) → the Stage-5 surds
  strand (`Indices C`), cross-topic; no edge.

## Net change applied

- **+4 skills:** `space-diagonal-3d`, `label-triangle-sides-angles`,
  `sine-rule-angles`, `cosine-rule-angles`
- **+7 edges, −5 edges** by transitive reduction (net **+2**)
- **3 blurb re-scopes:** `pythagoras-3d`, `sine-rule`, `cosine-rule`; plus **1
  consequential edge re-point** (`solve-trig-equations`)
