# Atomisation proposal — Equations A (Core), Stage 5

Source booklets:
- `booklets/Stage 5 Core/Equations A 1_Solve linear equations involving up to 3 steps.md`
- `booklets/Stage 5 Core/Equations A 2_Solve linear equations involving one algebraic fraction.md`
- `booklets/Stage 5 Core/Equations A 3_Solve linear equations arising from word problems and substitution into formulas.md`

Target topic: `t-s5c-equ-a`, dot points `dp-s5c-equa-1`–`dp-s5c-equa-3`
Rubric: `docs/atomisation-principles.md`

**Status: APPLIED (nil) — 0 new skills · 0 edges · 0 re-scopes.**
`data/skills.json` unchanged. Audited so future passes don't re-derive.

---

## Context

Check the three dot points are correctly atomised. A1 = linear equations up to
3 steps (pronumerals both sides, grouping symbols). A2 = linear equations with
one algebraic fraction. A3 = word problems and substitution into formulas.

## Finding

Fully covered by 5 existing skills; the harder booklet variants are
transitively supported. No changes.

## Coverage map

| Booklet routine | Existing skill |
|---|---|
| A1 pronumerals both sides; brackets + both sides | `solve-linear-3-step` (blurb: "grouping symbols and pronumerals on both sides") |
| A2 multi-step one-fraction equations; invisible-bracket numerator | `solve-linear-algebraic-fraction` |
| A2 "two unknown terms" — one fraction + pronumeral both sides ($\frac{3x-5}{2}=x$, $x+\frac{2x+1}{7}=4$) | `solve-linear-algebraic-fraction` — reaches `solve-equation-x-both-sides` transitively via `solve-linear-3-step`; multiply-every-term is a method within it |
| A3 solve for unknown after substitution ($v=u+at$, $I=Prn$) | `equations-from-formulas` |
| A3 word-problem modelling (age, wage, sum) | `model-word-problems-equations` |
| Verify by substitution | `verify-solutions-substitution` |

## Borderline candidates — EXCLUDE

- **`solve-fraction-equation-both-sides`** as a new skill — $\frac{3x-5}{2}=x$
  is one algebraic fraction (dp-2) plus x-collection; both routines already
  graph-reachable — no new distinctive atom.
- **Keep-coefficient-positive heuristic** and **"simplify first"** (collect
  like terms before solving) — sub-steps of `solve-linear-3-step`.
- **Bracket-sign in numerator** ($x-\frac{x-6}{5}=6$: multiply by denominator,
  bracket the subtracted numerator) — at-risk sub-step, but bundled in
  `solve-linear-algebraic-fraction`; not split anywhere else.
- **Standard word-problem templates** (consecutive ages, wage+bonus,
  sum/difference) — instances of `model-word-problems-equations`.

---

**Net change:** 0 new skills · 0 edges · 0 re-scopes → nil.
