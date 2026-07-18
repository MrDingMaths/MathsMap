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
- Write `solution_text` **line by line**; each line corresponds to one or more atoms
  (see [atomisation-teaching.md](atomisation-teaching.md)). Line-by-line structure
  also lets the UI reveal or annotate steps individually.
- **Align the working on the equals sign.** The opening line is the bare expression (no
  `=`); each later line begins `=`, so the equals signs stack — exactly as the booklet
  worked examples set them out. Do **not** end each line with a note.
- **Do not restate the answer.** The last `=` line (or a short answer sentence for
  word/justify questions) *is* the answer; never add a line that repeats it.
- **Step headers only at genuine stage boundaries.** Where the booklet numbers distinct
  stages (e.g. *factorise* then *solve*), mirror it: put a standalone header line
  `N. **Step name**` before that stage's working, the step name drawn verbatim from
  `theory.steps`, in theory order (steps may be skipped). The number sits *outside* the
  bold. **Single-stage routines carry no headers** — most substitution, factorising and
  collecting-like-terms solutions are just aligned `=` working ending in the answer. Never
  label every line, and never section fine-grained steps that happen within one line.
- **Don't force a procedure.** When a skill has no genuine multi-stage method — recognition,
  comparison and conceptual "does this match?" skills — **omit `theory.steps` entirely** and
  write clean working plus a one-line answer. A vacuous procedure ("Check each
  representation", "Confirm the same line") is worse than none.
- Everything shown should already be familiar (atoms presented first); the worked
  example is about how the pieces **combine**.
- Keep it clear and self-contained — don't introduce a new prerequisite mid-solution.
- Keep it short; a sprawling worked example signals the skill needs more atomising.
- The completed worked example stays **visible** when the We Do begins (side-by-side),
  so the learner can reference the model.
