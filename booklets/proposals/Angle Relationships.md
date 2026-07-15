# Proposal — Atomise `booklets/Stage 4/Angle Relationships.md`

## Context

Booklet-atomisation pass over the *Angle Relationships* booklet. Goal: extract
any genuinely **missing** skills / prereq edges the booklet exercises but
`data/skills.json` does not yet capture, and attach them to the nearest existing
dot point. Target dot points: **dp-s4-ang-1..4** (topic `t-s4-ang`,
MA4-ANG-C-01), with spill into the s3 angle skills and `t-s4-geo`.

This is a **proposal only** — `data/skills.json` is not yet modified.

## Finding (headline)

The topic is already densely and accurately covered. Existing skills:

- `geometry-notation` (ang-1)
- `angle-pairs-point` (ang-2) — identify vertically opposite / complementary /
  supplementary / adjacent
- `parallel-perpendicular-notation`, `transversal-angle-pairs`,
  `parallel-line-angle-properties` (ang-3)
- `unknown-angles-point`, `unknown-angles-parallel` (ang-4)
- plus s3: `classify-angles`, `recognise-angle-relationships`, `perpendicular-lines`

Every computational section of the booklet (complementary/supplementary,
adjacent, right-angle & straight-line, angles at a point, vertically opposite,
mixed, transversals, parallel-line angles, multi-step problem-solving, formal
reasoning) maps cleanly onto these. **One** routine has no home in the graph.

---

## 1. Recommended new skill (×1)

### `test-lines-parallel` — "Test whether two lines are parallel"

| Field | Value |
|---|---|
| **id** | `test-lines-parallel` |
| **title** | Test whether two lines are parallel |
| **blurb** | Use the converse of the parallel-line angle properties to decide whether two lines are parallel. |
| **stage** | 4 |
| **courses** | `["s4"]` |
| **dotPointIds** | `["dp-s4-ang-3"]` |
| **difficulty** | 2 |
| **prereqs** | `["parallel-line-angle-properties"]` |
| **atom type** | Category (Cat) — Yes/No classification, wrapping a short reasoning routine |

**Proposed JSON object** (insert after `parallel-line-angle-properties`):

```json
{ "id": "test-lines-parallel", "title": "Test whether two lines are parallel", "blurb": "Use the converse of the parallel-line angle properties to decide whether two lines are parallel.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-ang-3"], "prereqs": ["parallel-line-angle-properties"], "difficulty": 2 },
```

**Booklet trace (heavily represented):**
- *Angles on Parallel Lines* → boxed rule "Deciding whether Two Lines are
  Parallel" (line ~2191) + **Example** "Determine whether two lines are parallel"
  (line 2205) + Guided Practice (2219).
- *Angles on Parallel Lines* Foundation Q1–Q2 (2245–2299), Development Q6
  (2379–2407, nine sub-parts "state whether the diagram has parallel lines /
  justify").
- *Geometry Problems involving Equations* Q5 (2889–2911) — "decide if AB ∥ CD,
  give a reason", including compute-then-test cases.

**Bar justification (all four hold):**
1. *Distinctive* — it is the **converse** of `parallel-line-angle-properties`:
   the conclusion is parallelism, not an angle, and the implication runs the
   opposite way. The characteristic enabler of the routine, not ambient
   arithmetic.
2. *At-risk* — converse reasoning is a known Stage-4 trap; students routinely
   assume "angles equal" without checking, or apply the forward fact in reverse
   uncritically.
3. *Stage-proximity* — same stage (4) as its prereq.
4. *Non-redundant* — no existing skill tests parallelism from angles;
   `parallel-line-angle-properties` is the **forward** direction only. Directly
   mirrors the project's existing `converse-pythagoras` (a standalone converse
   skill sitting beside its forward skill).

**Attachment rationale:** sits on **dp-s4-ang-3** as the structural twin of
`parallel-line-angle-properties` (the relationship knowledge it inverts), rather
than ang-4, keeping the converse next to the forward rule.

## 2. Recommended new prereq edge (×1)

- `test-lines-parallel ← parallel-line-angle-properties` (the new skill's sole
  prerequisite, included in the object above). No new edges to other existing
  skills are warranted.

---

## 3. Borderline candidates considered → **EXCLUDE**

**B. "Construct an auxiliary parallel line to find an angle"**
(zigzag / Z-bend between two parallels).
- Trace: Problem-Solving Q4 "Find these angles (hint: construct a parallel
  line)" (2584) and Writing Formal Reasoning **Mastery** Q8 (2743–2814).
- *Exclude:* explicitly **Mastery**-tier and a non-routine problem-solving
  heuristic (auxiliary construction). Scope rule = routine questions only;
  ignore one-off / extension variants. Distinctive and at-risk, but not part of
  the standard routine.

**C. "Form and solve equations from angle relationships"**
(*Geometry Problems involving Equations*, ~30 questions: `2x+10+90=360`,
`6x=72`, bisector, variable on both sides).
- *Exclude:* the angle-specific part — "write an equation from the diagram" — is
  **already inside** `unknown-angles-point` / `unknown-angles-parallel` (their
  worked examples literally do "x + 20 + 40 = 180, solve"). The *extra* content
  here is collecting like terms / solving a genuine linear equation = **a
  different topic (algebra)**. Per the no-cross-topic-prereq rule we neither
  create this as a new angle skill nor add `solve-linear-equations` as a prereq.

## 4. Considered-and-omitted (ambient / elementary / already covered)

- **Find complement / supplement of an angle** (subtract from 90° / 180°,
  §Complementary&Supplementary Q2–5) — ambient arithmetic; omit.
- **Identify adjacent angles** (§Adjacent) — already in `angle-pairs-point`.
- **Right-angle / straight-line / at-a-point sums** (§§ 890, 1163) — computation
  already covered by `unknown-angles-point` (90°/180° via supplementary/
  complementary in `angle-pairs-point`; 360° via the "at a point" skill itself).
- **Vertically opposite computation** (§1298) — `angle-pairs-point` +
  `unknown-angles-point`.
- **Notate / draw / name parallel & perpendicular lines** (§1597) — already
  `parallel-perpendicular-notation`.
- **Identify corresponding / alternate / co-interior** (§Transversals) — already
  `transversal-angle-pairs`.
- **Multi-step problem-solving combining ∥-line + point relationships**
  (§Problem-Solving) — already `unknown-angles-parallel` (prereqs already span
  both `parallel-line-angle-properties` and `unknown-angles-point`).
- **Write formal geometric reasoning** (statement–reason–∴, §Writing Formal
  Reasoning) — the *manner* of the existing routines, captured by the "give
  reasons" wording already in the `unknown-angles-*` blurbs; not a distinct
  at-risk atom. Omit.

---

## Net change if approved

- **+1 skill:** `test-lines-parallel` (stage 4, dp-s4-ang-3).
- **+1 edge:** `test-lines-parallel ← parallel-line-angle-properties` (internal
  to the new skill).
- No edits to any existing skill.

**STOP — awaiting review before applying to `data/skills.json`.**
