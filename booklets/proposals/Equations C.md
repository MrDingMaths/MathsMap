# Atomisation proposal — Equations C (Path), Stage 5

Source booklets:
- `booklets/Stage 5 Path/Equations C_1 Solve linear equations involving algebraic fractions and equations of more than 3 steps.md`
- `booklets/Stage 5 Path/Equations C_2 Rearrange literal equations.md`
- `booklets/Stage 5/Equations C_3 Quadratic Equations.md` (NEW)
- `booklets/Stage 5 Path/Equations C_4 Solve linear simultaneous equations, both algebraically and graphically.md` (OLD, kept for Partial Fractions / Equating Coefficients tail)
- `booklets/Stage 5/Equations C 4_Simultaneous Equations.md` (NEW)

Target topic: `t-s5p-equ-c`, dot points `dp-s5p-equ-c-1`–`dp-s5p-equ-c-4`
Rubric: `docs/atomisation-principles.md`

**Status: APPLIED — 6 new skills · 2 extra edges · 1 re-scope.**
(Skill 7 `partial-fractions-linear` + its edge REJECTED at review — see §4.)

---

## Context

Densest Path algebra topic. 11 existing skills already cover the spine:
`solve-linear-multistep-fractions` (c-1); `change-subject-formula` (c-2);
`solve-quadratic-factorisation`, `complete-the-square-solve`,
`quadratic-formula`, `discriminant-nature-roots`, `quadratic-word-problems`,
`equations-reducible-quadratic` (c-3); `simultaneous-equations-graphically`,
`simultaneous-equations-algebraically`, `simultaneous-word-problems`,
`identities-contradictions` (c-4).

## Finding

Spine covered, but each booklet teaches a full dedicated section whose routine
had no node: pronumeral denominators (C_1), subject-appears-twice (C_2),
completing-the-square-as-rewrite and discriminant-with-parameter (C_3), and
the equating-coefficients cluster (C_4 — the content the QUEUE explicitly kept
OLD C_4 for).

## 1. New skills (applied)

| # | id | dp | prereqs | diff |
|---|---|---|---|---|
| 1 | `solve-equation-algebraic-denominator` | equ-c-1 | `solve-linear-multistep-fractions` | 3 |
| 2 | `change-subject-appears-twice` | equ-c-2 | `change-subject-formula`, `factorise-common-algebraic-factor` | 3 |
| 3 | `complete-square-form` | equ-c-3 + adv11-functions-3 | `special-products` | 2 |
| 4 | `discriminant-parameter-problems` | equ-c-3 + adv11-functions-3 | `discriminant-nature-roots`, `solve-linear-inequalities` | 3 |
| 5 | `equate-coefficients` | equ-c-4 | `simultaneous-equations-algebraically` | 2 |
| 6 | `split-linear-numerator` | equ-c-4 | `equate-coefficients` | 2 |

**Traces + edge bars.**
1. C_1 "Algebraic Denominators" section: $\frac{5}{x}=3$, $\frac{6}{2+x}=5$,
   $\frac{4-7x}{4x-7}=2$; Foundation Q1–3, Dev Q4 (incl. $x^{2}$ and product
   denominators). Reused by C_3 Dev Q7/Q13d–i (fraction→quadratic).
   Distinctive (multiply both sides by unknown expression), at-risk, not
   reachable (`solve-linear-multistep-fractions` = numerical denominators).
   Retro-justifies the Equations B exclusion ("equ-c territory").
2. C_2 "Subject Appears Twice" section: $ax+2y=5y+mx$, $y=\frac{x+1}{x+2}$;
   Foundation Q1i–n, Dev Q2–3, Mastery Q4–5. Factorise-the-subject-out is the
   distinctive at-risk move; progression-chain placement below.
3. C_3 "Completing the Square" section taught before solving: area models,
   Foundation Q1–4 (incl. odd $b$), Q6 factorise via difference of two squares
   with surds. Lift-out from `complete-the-square-solve`, where the rewrite
   was invisible. Enabler `special-products` (perfect-square recognition).
4. C_3 "The Discriminant" parameter problems: worked example ($x^{2}+8x+k=0$),
   guided practice, Foundation Q3, Dev Q5–9, Mastery Q10–18. Chain skill:
   compute $\Delta(k)$ → set condition → solve inequality;
   `solve-linear-inequalities` is the at-risk cross-link.
5. Both C_4 booklets, full "Equating Coefficients" sections with Foundation
   sets ($a(2x+7)=8x+14b$, $(x+b)^{2}=x^{2}+cx+49$). Existing
   `equal-quadratics-coefficients` is s6-adv11 and graph-flavoured — not this.
6. NEW C4 "Splitting the Numerator" section, Foundation Q1a–l; flagged
   in-booklet as feeder for hyperbola sketching. Not reachable
   (`divide-polynomials` is a later topic, different method). Approved as the
   most strikeable of the six.

## 2. Extra prereq edges (applied)

- `complete-the-square-solve` ← `complete-square-form` — solving = rewrite +
  isolate-and-root.
- `equal-quadratics-coefficients` ← `equate-coefficients` — s6-adv11 skill
  gains its Stage-5 feeder; previously only `sketch-parabola-from-equation`.

## 3. Edits to existing skills (applied)

- `change-subject-formula` blurb re-scope (progression rule): now "…where the
  subject appears once." Subject-twice lives downstream.

## 4. Rejected at review

- **`partial-fractions-linear`** (+ edge `partial-fractions-decomposition` ←
  `partial-fractions-linear`) — proposed as Stage-5 linear-factor base case of
  the s6-ext2 skill, traced to Partial Fractions sections in both C_4
  booklets. **User rejected** — stays bundled; do not re-propose. Partial
  fractions remain represented only by `partial-fractions-decomposition`
  (s6-ext2); the Stage 5 booklet content is reachable as
  `equate-coefficients` + `simultaneous-equations-algebraically` in
  combination.

## 5. Borderline candidates — EXCLUDE

- **Cross-multiplying** (C_1 dedicated section incl. when-valid check) —
  shortcut method within `solve-linear-multistep-fractions`.
- **Proving identities** (NEW C4 section, Foundation Q1a–r) — proof-discipline
  wrapper around existing expansion/factorisation/fraction skills. Flag if
  identity-proof recurs in Stage 6 passes.
- **Powers/roots subject change as separate node** (C_2 section, HSC Standard
  items) — bundled in `change-subject-formula`; shared with the Standard
  Formulas pass (QUEUE row 46).
- **Rational/irrational via perfect-square $\Delta$** — sub-fact inside
  `discriminant-nature-roots`.
- **Fraction-equations-to-quadratics as own node** — reachable as
  `solve-equation-algebraic-denominator` + quadratic solving.

## 6. Considered and omitted (no schema change)

- C_1 review linear/fraction equations, monomial + binomial numerators, HSC
  items — `solve-linear-multistep-fractions`. Reciprocal formula applications
  (parallel resistors, thin lens) — applications of skills 1/2.
- C_2 basic/two-step/powers-roots rearranging, HSC Standard items —
  `change-subject-formula`.
- C_3 non-monic factorising, quadratic formula, CTS-solve, verification,
  reducible equations (quartic, $9^{x}$ substitution), modelling
  (area/frame/Pythagoras/$d=st$) — existing quadratic skills. Quadratic
  formula derivation — enrichment.
- C_4 graphical/substitution/elimination/applications, identities vs
  contradictions — existing simultaneous skills.

---

**Net change:** 6 new skills · 2 extra edges · 1 re-scope.
