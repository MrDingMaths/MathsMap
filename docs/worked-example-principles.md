# Worked-example (I Do) principles

How to choose and present the worked example a skill is built around. Companion to
[atomisation-teaching.md](atomisation-teaching.md) and
[guided-practice-principles.md](guided-practice-principles.md).

> **Scope note:** pared to what informs **the site**. Classroom-only mechanics are
> dropped; kept is what shapes the content and its on-screen presentation.

## Choosing the example
- **No repeating elements** that cause ambiguity — avoid `2x + 2 = 8` (which 2?); use
  `3x + 2 = 11`. Avoid a sequence going up in 4s with answer `4n + 4` (is 4 the
  coefficient or the constant?).
- **Keep numbers simple** so attention sits on the new concept, not the arithmetic.
- **Use a general example, not an "easy" one** — easy cases let learners get the right
  answer for the wrong reason and hide the real process. Prefer `3²` over `2²`, `7/3`
  over `1/2`, `17%` over `10%`.
- **Vary one critical feature per example** when showing several, so each change's
  effect is trackable.

## A short theory block first
Precede the worked example with a concise **theory block** the learner can return to:
the key definitions/formulas and a short numbered **procedure** (one line per step).
Keep it minimal — it states the rule and the atoms, it does **not** replace the worked
example or do the thinking for the learner. On the site this is the *Theory* section
(fields `theory.intro`, `theory.facts`, `theory.steps`).

## Presenting it
- Write the solution **line by line**; each line corresponds to one or more atoms
  (see [atomisation-teaching.md](atomisation-teaching.md)). Line-by-line structure
  also lets the UI reveal or annotate steps individually.
- **Align the working on the equals sign.** The opening line (the bare expression, no
  `=`) sits offset under the aligned `= …` lines; keep a short note beside each line,
  tab-aligned in its own column, naming the atom/decision used.
- **Note labels are the procedure step name only** — a terse label of ≤ 3 words
  (e.g. "Rewrite", "Move right", "Decide sign"); never a prose sentence or explanation. **Line notes are step
  names only** — a terse imperative label (≤ 3 words) drawn from `theory.steps`, not a
  prose sentence or explanation. The opening bare-expression line carries no note.
- Everything shown should already be familiar (atoms presented first); the worked
  example is about how the pieces **combine**.
- Keep it clear and self-contained — don't introduce a new prerequisite mid-solution.
- Keep it short; a sprawling worked example signals the skill needs more atomising.
- The completed worked example stays **visible** when the We Do begins (side-by-side),
  so the learner can reference the model.
