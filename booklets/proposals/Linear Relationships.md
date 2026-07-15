# Atomisation proposal — `booklets/Stage 4/Linear Relationships.md`

## Context

Continuing the booklet-atomisation workflow ([[booklet-atomisation-workflow]]).
Target: the Stage 4 **Linear Relationships** booklet (topic `t-s4-lin`, dot
points `dp-s4-lin-1/2/3`). Goal is a **proposal only** — no edits to
`data/skills.json` yet — identifying genuinely missing skills + prereq edges,
booklet-traced, lean, routine-only, no cross-topic prereqs.

The existing `t-s4-lin` graph is already well developed (9 skills):
`plot-points-cartesian`, `pattern-to-equation`, `linear-representations`,
`apply-pattern-equation`, `graph-linear-relationship`, `linear-real-life`,
`point-satisfies-line`, `solve-equation-graphically`, `intersection-of-lines`.
Gradient / y=mx+c interpretation / equation-from-graph already exist as a
deliberate **Stage 5** cluster (`gradient-of-interval`, `slope-intercept-interpret`,
`equation-from-gradient-intercept`, `equation-from-graph`, `parallel-lines-equal-gradient`).

The booklet's 14 sections mostly land on existing skills. Three sections expose
routines with **no existing Stage 4 node**: constructing a table of values by
substitution (§2), systematically finding `y = mx + c` from a table (§5), and
comparing lines from their equations (§11).

---

## Recommended NEW skills (3)

All: `courses: ["s4"]`, `dotPointIds: ["dp-s4-lin-2"]` (nearest existing dot
point — "Plot linear relationships on the Cartesian plane"; the rule-finding /
comparing work all sits under expressing & plotting linear relationships).

### 1. `construct-table-of-values`  — difficulty 2
- **Title:** Construct a table of values
- **Blurb:** Substitute `x`-values, including negatives and fractional
  coefficients, into `y = mx + c` to complete a table of values.
- **Atom type:** Transformation
- **Prereqs:** `[]` (the at-risk core is substituting *negative* `x` into a
  linear expression — that is Stage 4 *algebra* substitution, **cross-topic**, so
  not added as a prereq per the rules).
- **Booklet trace:** §"Constructing a Table of Values" worked example
  (`y = 3x + 1`, l.476–488) + practice Q2a–l incl. negatives and `y = x/2 + 1`
  (l.541–609); reused as step 1 of §"Sketch a Line from a Table of Values"
  (l.665–675).
- **Bar:** Distinctive (mechanical core of every graph-from-equation), at-risk
  (sign errors on negative `x` and fractional `m`), same-stage, non-redundant
  (no existing node performs equation→table substitution; `linear-representations`
  only *connects* representations conceptually — blurb-mention ≠ redundant).

### 2. `find-equation-from-table`  — difficulty 2
- **Title:** Find the equation `y = mx + c` from a table
- **Blurb:** Find `m` (the change in `y` as `x` increases by 1) and `c` (the
  value of `y` when `x = 0`), write `y = mx + c`, and check it against every
  column.
- **Atom type:** Routine
- **Prereqs:** `[find-rule-from-table]` (Stage 3 single-operation rule-finding,
  `y = 3x` / `y = x + 4` — the direct precursor; st3→st4 is within ~1 stage and
  distinctive as the foundational pattern-reading).
- **Booklet trace:** §"Systematically Finding the Rule `y = mx + c` from a table"
  — "Identify `m`" + "Identify `c`" boxes (l.1274–1328), worked example
  `y = 2x + 1`, `y = −3x + 7` (l.1348–1363), practice incl. negatives (l.1407–1532).
- **Bar:** Distinctive (two-parameter method; `find-rule-from-table` only covers
  single-operation rules), at-risk (mis-reading `m` when `x` doesn't step by 1;
  reading `c` off the wrong column), same-stage, non-redundant.

### 3. `compare-linear-equations`  — difficulty 2
- **Title:** Compare linear relationships from their equations
- **Blurb:** Use `y = mx + c` to tell whether a line is increasing or decreasing
  (sign of the coefficient of `x`), whether two lines are parallel (equal
  coefficients), and whether they share a `y`-intercept (equal constant terms).
- **Atom type:** Category / Comparative
- **Prereqs:** `[graph-linear-relationship]`
- **Booklet trace:** §"Comparing Linear Relationships" — "Identify increasing/
  decreasing" (l.3647–3665), "Identify parallel lines" (l.3667–3690), constant
  term ↔ y-intercept (l.3644–3645), Desmos comparison practice (l.3715–3742).
- **Bar:** This is the recurring lift-pattern — `graph-linear-relationship`'s
  blurb nominally says "compare multiple lines", but reading direction /
  parallelism / intercept **directly off the coefficients** (no graphing) is the
  distinctive, at-risk sub-step (sign confusion, `m` vs `c`). Per policy, a
  coarse blurb mention does NOT make this redundant. Lighter than the Stage 5
  `slope-intercept-interpret` / `parallel-lines-equal-gradient` (informal
  steepness, no rise/run). *Moderate confidence — the one most reasonable to cut.*

## Recommended NEW prereq edges to existing skills (1)

- **`graph-linear-relationship`** ← add `construct-table-of-values`
  (new prereqs: `["linear-representations", "construct-table-of-values"]`).
  Trace: §"Sketch a Line from a Table of Values" makes "construct a table by
  substituting" step 1 of graphing (l.665–690). Non-redundant: `construct-table-
  of-values` is not reachable from `linear-representations`.

---

## Borderline candidates — recommend EXCLUDE

- **`find-rule-from-graph` (§"Finding the Rule from the Graph", l.1935)** —
  the booklet's own method is "read points off the line into a table, *then*
  find the equation". That decomposes exactly into `plot-points-cartesian`
  ("identify points" already covers reading coordinates) **+** the proposed
  `find-equation-from-table`. No distinctive new atom → omit as a node. (Note:
  the Stage 5 `equation-from-graph` already exists for the rise/run method.)

- **`recognise-linear-equation` (§"Finding the Rule from a Table" opener,
  l.904–924)** — classifying `y = mx + c` vs `y = x²`, `y = 6/x`, `y = 3^x`.
  Too elementary / ambient to be a node at Stage 4; the Stage 5
  `distinguish-linear-quadratic-exponential` covers the graph-based version.
  Omit.

## Considered and omitted (covered / ambient — audit trail)

| Booklet section | Why omitted |
|---|---|
| §"Points on a Cartesian Plane" (l.1) | `plot-points-cartesian` |
| §"Sketch a Line from a Table" (l.611) | = `graph-linear-relationship` (now ← `construct-table-of-values`) |
| Write coords from a table column (l.642–664) | `plot-points-cartesian` ("identify points") |
| §"Finding the Rule from a Table" single-op (l.894) | `find-rule-from-table` (st3) |
| Verify a table satisfies an equation (l.936–965) | `point-satisfies-line` + substitution |
| Split `find-equation-from-table` into find-`m` / find-`c` nodes | One coherent taught routine — splitting = pollution |
| §"Patterns, Equations, Graphs" (l.2067) | `pattern-to-equation` |
| §"Applying the Equation" (l.2453) | `apply-pattern-equation` |
| §"Multiple Representations" (l.2827) | `linear-representations` |
| §"Linear Relationships in Real Life" (l.3118) | `linear-real-life` |
| §"Solving Equations Graphically" (l.3994) | `solve-equation-graphically` |
| §"Simultaneous Solutions" / "…Graphically" (l.4336, 4572) | `intersection-of-lines` |
| Substituting negatives into a linear expression | Stage 4 *algebra* — cross-topic, not a prereq |

---

## Net change if approved
- **+3 skills:** `construct-table-of-values`, `find-equation-from-table`,
  `compare-linear-equations` (all st4, `dp-s4-lin-2`, diff 2).
- **+1 edge** to existing skill: `graph-linear-relationship` ←
  `construct-table-of-values`.
- New skills' internal edges: `find-equation-from-table` ← `find-rule-from-table`;
  `compare-linear-equations` ← `graph-linear-relationship`.

## Verification (on apply)
- Validate `data/skills.json` parses (UTF-8) and every new `id` is unique.
- Every new `prereqs`/edge target id resolves to an existing skill.
- New `dotPointIds` (`dp-s4-lin-2`) exists in `data/dotpoints.json`.
- No cycle introduced; new edges respect stage order (st3→st4, st4→st4).
- Spot-check rendering of blurbs (KaTeX `y = mx + c`, project notation).

**STOP — awaiting review before writing the proposal file or touching
`data/skills.json`.**
