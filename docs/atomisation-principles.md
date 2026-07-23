# Atomisation principles (curriculum-planning rubric)

Distilled from the full atomisation guide, keeping only what's relevant to
**building the skill/prerequisite graph** in [`../data/skills.json`](../data/skills.json).
Classroom-delivery material (teaching sequences, mini-whiteboards, 80%
thresholds, I Do / We Do) is intentionally omitted — see the source guide for
that.

## What an atom is

An **atom** is the smallest constituent part of a routine that can be taught or
assessed *separately* from the routine itself. Atomisation breaks a routine into
its atoms so each can be checked or built independently.

In graph terms:
- An atom that **already exists** as a skill → a **prerequisite edge** to it.
- An atom with **no existing skill** → a candidate **new skill**.

## The decomposition method (guide Steps 2–3)

1. Write the routine's worked solution out line by line.
2. For each step ask: **"what knowledge gets a student from this line to the
   next?"** Each such piece of knowledge is an atom.
3. **Include invisible atoms** — decisions and thought processes that aren't
   written in the working (e.g. "decide whether to use Pythagoras", "decide to
   add or subtract the equations"). These are real skills and are easy to miss.
4. **Star the prerequisites** — atoms a student has met before. These become the
   prerequisite edges. Un-met atoms become new skills.

## Atom-type vocabulary (granularity aid)

Tag candidates with a type in proposals; it helps reason about grain and whether
something is one skill or several.

| Type | Meaning | Example |
|------|---------|---------|
| Category (Cat) | Yes/No classification | "Is this a prism?" / "Do I use Pythagoras?" |
| Comparative (Com) | Witnessed by before/after change | speed, gradient, density |
| Fact (F) | Something to remember | a formula, theorem, property |
| Transformation (T) | Obvious input → output | substitute into a formula |
| Routine (R) | Complex multi-step process | the full procedure (often the skill itself) |

A **Routine** atom is itself a mini-routine: it usually corresponds to the skill
being authored, and its atoms are that skill's prerequisites.

## Chaining

Don't jump from individual atoms straight to the full routine. A **chain of 2–3
atoms** can be a worthwhile *intermediate* skill in its own right, sitting
between the basic atoms and the full routine.

## Scope rules for this project

- **Routine questions only.** Atomise the standard question types for the topic;
  ignore one-off / non-routine / competition-style variants.
- **Cross-topic prerequisites: constitutive yes, ambient no.** A skill from another
  topic **is** a legitimate prerequisite when it is *constitutive machinery* of the
  routine — the routine cannot be performed without executing that skill's procedure as
  a step. `find-radius-from-circumference` cannot be done without solving a linear
  equation, so `solve-one-step-equation` belongs in its prereqs even though it lives in
  *Equations*.

  It remains **excluded** when the other topic is *grafted context* — dressing that
  varies the surface of a question without changing the routine (a trigonometric
  identity used as the statement being proved in an induction proof). The routine is
  the same routine whatever is grafted on; the graft is not a prerequisite.

  Edge-inclusion rules 1–4 below still gate every such edge. Prefer the *simplest
  sufficient* source skill (`solve-one-step-equation`, not
  `model-word-problems-equations`, when one-step inversion is all the routine needs).
- **Read the whole booklet**, worked examples *and* practice questions — worked
  examples often don't show the full range of the routine.

## Edge inclusion policy (don't pollute the graph)

A prerequisite edge is worth recording only if it's a real, non-obvious, at-risk
dependency. Add a candidate edge `X ← P` (skill X requires prereq P) **only if all
hold**:

1. **Distinctive** — P is the *characteristic enabler* of X's routine, not ambient
   algebra/arithmetic the cohort uses everywhere (keep `split-power-compound-index`;
   drop `expand-brackets`).
2. **At-risk** — a student ready for X could plausibly still be shaky on P. If P is
   universally mastered at X's course level, omit it.
3. **Stage-proximity (heuristic)** — by default don't link P more than ~1 stage
   below X; a *distinctive* P (rule 1) overrides this, as does a *constitutive*
   cross-topic P.
4. **Non-redundant (transitive reduction)** — P must not already be reachable from
   X through another included prereq (no `A→C` when `A→B→C` exists).

Skills *used* in a routine but failing these tests are **omitted entirely** — not
recorded in any form.

## De-bundling a coarse skill

An existing skill's blurb can bundle more than the graph currently records. Two
different situations call for splitting it, and they resolve differently.

**Lift-out (a sub-step, not a progression).** When a skill's blurb nominally
mentions a distinctive, at-risk sub-step (a sign rule, a converse direction, a
special case), lifting that sub-step out as its own skill plus a prerequisite
edge into the existing skill is legitimate — it is **not** redundant. A blurb
merely *mentioning* the sub-step does not mean it is already reachable in the
graph; redundant means already reachable through an *included* edge (rule 4
above), and only an explicit prior skill/edge satisfies that. If you lift one
such sub-step out, apply the same treatment to its structural twins (sibling
skills bundling the same kind of sub-step), so the graph doesn't end up
inconsistent.

**Progression chain (a taught sequence, not a sub-step).** When a skill's blurb
instead bundles a *taught progression* — a base case plus one or more harder
variants taught as a sequence — don't hang the harder variant off the easy case
as a sibling prerequisite. Decompose into an ordered chain, placing the harder
variants **downstream as dependents** of the base skill: a harder case requires
fluency at the base case first, not the reverse. Re-scope the original skill's
blurb to its now-narrower meaning (the base case only).

*Precedent:* `solve-linear-2-step` bundled one-step equations, positive
two-step equations, negative-coefficient equations, and x-on-both-sides
equations under one blurb. It was split into
`solve-one-step-equation → solve-linear-2-step → {solve-equation-negative-coefficient,
solve-equation-x-both-sides}` — the harder variants sit downstream of the
re-scoped `solve-linear-2-step`, not beside it.

## Check prior decisions

Before proposing anything, read every existing file in `booklets/proposals/`
for precedents *and* rejections. Never re-propose a candidate the user has
already rejected — e.g. `interpret-percentage-vocabulary` was considered and
rejected; that knowledge stays bundled in `financial-percentage-problems`, not
split out. A rejection is a decision, not an oversight to revisit next session.

## Math notation

Follow the project notation table in the root `CLAUDE.md` when writing titles and
blurbs (e.g. `x²`, `2^(k+1)`, `log_5 (1/125)`, fractions as `(2x+3)/(3y−1)`,
multiplication by brackets with no dot, e.g. `4(4^k)`).
