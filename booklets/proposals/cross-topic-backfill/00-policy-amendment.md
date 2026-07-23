# Proposal — amend the cross-topic prerequisite rule

**Status: APPLIED 2026-07-23** — amendment landed in
[`docs/atomisation-principles.md`](../../docs/atomisation-principles.md). Governs the eight
backfill proposals in this directory (`A-stage4-1.md` … `H-s6ext.md`).

## Why

An audit of `data/skills.json` against the intended topic-level prerequisite structure
(111 topic→topic edges across Stages 4–6) found that **none of them exist** as skill-level
links. Ten pairs have no connecting path in the graph at all — S4 *Indices* is reachable
only from Stage 3 *Multiplicative relations*, with nothing from *Algebraic techniques*,
*Computation with integers* or *FDP*.

This is not an authoring slip. It is the direct, faithful consequence of the scope rule at
[`atomisation-principles.md:56-59`](../../docs/atomisation-principles.md#L56-L59), applied
consistently across every atomisation pass. The audit trails record the exclusions
explicitly — e.g. [`Length.md:37`](../Length.md#L37):

> Equation-solving mechanics deliberately not a prereq (cross-topic, per Area 2 precedent).

The defect that surfaces this: `find-radius-from-circumference`, whose own blurb reads
*"Substitute into C = πd or C = 2πr and **solve** for the diameter or radius using inverse
operations"*, carries `prereqs: ["circumference-circle"]`. The graph asserts a student can
perform it having never solved an equation. `find-side-from-perimeter` is identical.

The rule conflated two different things: a routine that **contains** another topic's
procedure as a step, and a question that merely **dresses** a routine in another topic's
surface. Only the second should be excluded.

## The change

Replace the second bullet of **Scope rules for this project**
([`atomisation-principles.md:56-59`](../../docs/atomisation-principles.md#L56-L59)):

> - **No cross-topic prerequisites.** When a question grafts another topic onto the
>   routine (e.g. a trigonometric or polynomial proof by induction), do **not** add
>   that other topic's skill as a prerequisite. Prerequisites are limited to skills
>   **intrinsic to performing the routine itself**.

with:

> - **Cross-topic prerequisites: constitutive yes, ambient no.** A skill from another
>   topic **is** a legitimate prerequisite when it is *constitutive machinery* of the
>   routine — the routine cannot be performed without executing that skill's procedure as
>   a step. `find-radius-from-circumference` cannot be done without solving a linear
>   equation, so `solve-one-step-equation` belongs in its prereqs even though it lives in
>   *Equations*.
>
>   It remains **excluded** when the other topic is *grafted context* — dressing that
>   varies the surface of a question without changing the routine (a trigonometric
>   identity used as the statement being proved in an induction proof). The routine is
>   the same routine whatever is grafted on; the graft is not a prerequisite.
>
>   Edge-inclusion rules 1–4 below still gate every such edge. Prefer the *simplest
>   sufficient* source skill (`solve-one-step-equation`, not
>   `model-word-problems-equations`, when one-step inversion is all the routine needs).

And amend edge-inclusion rule 3 ([`:74-75`](../../docs/atomisation-principles.md#L74-L75))
to note the relaxation:

> 3. **Stage-proximity (heuristic)** — by default don't link P more than ~1 stage below X;
>    a *distinctive* P (rule 1) overrides this, as does a *constitutive* cross-topic P.

Rule 1 (**Distinctive**) is what keeps this from re-flooding the graph: ambient algebra and
arithmetic the cohort uses everywhere stays out. The test is not "is another topic used?"
but "is another topic's *procedure* a step of this routine, and is it plausibly still
at-risk for a student ready for this skill?"

## Blast radius

Backfill only — no skill is created, renamed, or removed; only `prereqs` arrays gain
entries. 64 target topics across 7 course groups, proposed in the eight sibling files.

Applied atomisation proposals in `booklets/proposals/` are **not** rewritten. Their audit
trails stay as-authored; this directory is the amendment record. Any future pass over
those topics applies the new rule.

## Verification after applying

- `npm run validate` clean.
- Re-run the topic-edge audit: every accepted pair appears as a direct edge, and the ten
  no-path pairs are connected.
- No cycles and no stage-inversions introduced (each backfill file certifies this per edge).
- Map view (`src/lib/topicGraph.js`) still lays out — new cross-course edges render as
  `cross-course`, and dagre ranking must not have gained a cycle.
