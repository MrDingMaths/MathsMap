# Atomisation proposal — Non-Linear Relationships A (Core) — NIL RESULT

**Status: applied (nil) — no changes to `data/skills.json`.**

## Context

Booklet-atomisation workflow ([[booklet-atomisation-workflow]]), QUEUE row 22.
Booklet: `Stage 5 Core/Non-Linear Relationships A 1_Examine the connection between
algebraic and graphical representations of quadratics and exponentials.md` (single
booklet). Target topic `t-s5c-nli-a`, dot point `dp-s5c-nlia-1` (MA5-NLI-C-01).

## Finding

**Topic saturated — no new skills, no new edges.** Two skills already sit on the single
dot point and cover every routine in the booklet.

| Booklet section | Existing skill |
|---|---|
| Graph `y=ax²+bx+c` from a table of values (Quadratic Relationships, Foundation Q1–4) | `graph-quadratic-exponential-tech` |
| Graph `y=a^x` from a table of values (Exponential Relationships, Foundation Q1–2) | `graph-quadratic-exponential-tech` |
| Classify equation/graph cards as line vs parabola (Q5); parabola vs exponential | `identify-parabola-exponential` |

## Borderline candidates → EXCLUDE

- **`parabola-coefficient-effect`** (coefficient of `x²` ⇒ wider/narrower; constant term
  ⇒ vertical shift / `y`-intercept — Foundation Q3–4). Excluded: qualitative,
  observational feature-spotting bundled in `identify-parabola-exponential`; the formal
  *transformations* of parabolas are a separate downstream skill in Non-Linear C
  (`dp-s5p-nli-c-1`). Not at-risk as an independent routine at Core level.
- **`exponential-common-ratio` / `exponential-asymptote`** (consecutive `y` change by
  base ratio; `y=a^x` never reaches 0 — Exponential example prompts). Bundled in
  `graph-quadratic-exponential-tech` / `identify-parabola-exponential`; ambient
  observation, not a standalone routine here.

## Considered-and-omitted (audit trail)

| Content | Why omitted |
|---|---|
| Evaluate `x²+5`, `2^x` for given `x` (Review of Prior Knowledge) | `substitute-into-expressions` (existing prereq) |
| Plot table columns as coordinates, join smooth curve | `plot-points-cartesian` (existing prereq) |
| `y=−x²` vs `(−x)²` misconception (Q6) | Ambient index/sign reasoning |
| Recognise quadratics/exponentials in real-life contexts | Ambient; no distinct routine in booklet |

## Net change: none

**Applied — no `data/skills.json` edits. `npm run validate` clean (no-op).**
