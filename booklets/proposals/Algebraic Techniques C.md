# Atomisation proposal — Algebraic Techniques C (Path), Stage 5

Source booklets:
- `booklets/Stage 5 Path/Algebraic Techniques C_1 Operate with algebraic fractions involving binomial numerators and numerical denominators.md` (OLD, KEEP — dp-c-1)
- `booklets/Stage 5/Algebraic Techniques C 2_Further Expansion and Factorisation.md` (NEW — dp-c-2)
- `booklets/Stage 5/Algebraic Techniques C 3_Further Algebraic Fractions.md` (NEW — dp-c-2)

Target topic: `t-s5p-alg-c`, dot points `dp-s5p-alg-c-1`–`dp-s5p-alg-c-2`
Rubric: `docs/atomisation-principles.md`

**Status: APPLIED — 1 new skill · 1 new edge · 1 blurb re-scope.**
`npm run validate` → 0 warnings (1095 skills).

---

## Context

C_1 = add/subtract fractions with binomial numerators + numerical denominators
(dp-c-1). C_2 = expand/factorise special products (dp-c-2). C_3 = further algebraic
fractions — simplify/×/÷/+/− by factorising + compound fractions (dp-c-2).

## Finding

dp-c-2 special-products + factorising (C_2) fully covered by the 4 existing skills.
Two real gaps, both in the NEW booklets: C_3 compound fractions (genuinely new
routine, no node), and a missing C_1 dependency — binomial-numerator addition needs
bracket expansion, unreachable from its lone prereq.

## Coverage map (no change)

| Routine | Existing skill |
|---|---|
| C_1 equivalent fractions w/ binomial numerator; add/subtract binomial-numerator fractions | `add-subtract-binomial-fractions` |
| C_2 expand perfect squares / DOTS | `special-products`, `expand-simplify-special-products` |
| C_2 factorise perfect squares, DOTS (incl. surds), noticing binomial factors, grouping in pairs, non-monic trinomials | `factorise-special-products` |
| C_3 §1 simplify single fraction by factorising (incl. negatives-of-each-other → −1) | `simplify-fractions-by-factorising` |
| C_3 §2/§3 ×/÷ and +/− rational expressions by factorising | `simplify-fractions-by-factorising` (re-scoped) |

## 1. New skills

### `simplify-compound-fractions`

- **stage** 5 · **courses** `["s5-path"]` · **dotPointIds** `["dp-s5p-alg-c-2"]` ·
  **difficulty** 3 · **prereqs** `["simplify-fractions-by-factorising"]` · Routine
- **blurb:** Simplify compound (complex) fractions—a fraction within a fraction—by
  multiplying through by the LCD or by dividing, e.g. `(1+1/x)/(1−1/x²)`.

```json
{ "id": "simplify-compound-fractions", "title": "Simplify compound fractions", "blurb": "Simplify compound (complex) fractions—a fraction within a fraction—by multiplying through by the LCD or by dividing, e.g. $\\dfrac{1+\\frac{1}{x}}{1-\\frac{1}{x^{2}}}$.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-alg-c-2"], "prereqs": ["simplify-fractions-by-factorising"], "difficulty": 3 }
```

- **Trace:** C_3 *Simplifying Compound Fractions* — Example `(1+1/3x)/(1−1/x²)` (both
  methods); Guided a–d; Foundation Q1–4 incl. nested
  `((1/(x+1)+1/(x−1))/(1/(x+1)−1/(x−1)))`.
- **Bar:** distinctive (nested-fraction resolution — multiply-by-LCD or
  single-fraction-then-divide — is its own routine, in no existing skill); at-risk
  (identifying the main numerator/denominator and clearing nested denominators is a
  fresh high-error step); same stage; non-redundant (unreachable from
  `simplify-fractions-by-factorising`).

## 2. New prereq edges

### `add-subtract-binomial-fractions ← expand-brackets`

Prior prereq was only `operate-algebraic-fractions-denominator` (single-term
numerators — no bracket expansion). The routine's characteristic step is scaling a
binomial numerator and **expanding** it (`5(x−1) − 3(x+4)`), then distributing the
subtraction sign. `expand-brackets` (and transitively `distribute-negative-multiplier`)
is unreachable through `operate-algebraic-fractions-denominator`.

- **Trace:** C_1 add/subtract examples (`(y+1)/5 + 2y/3`, `(x−1)/3 − (x+4)/5 →
  5x−5−3x−12`); dedicated *Working with Negative Fractions* section + "subtract each
  term" key idea + error-analysis Q2/Q3.
- **Bar:** distinctive (expansion of scaled binomial numerators is exactly what
  separates this from single-term algebraic-fraction addition); at-risk (whole
  section + repeated error-analysis on the sign/expand step); stage-proximity s4→s5;
  non-redundant.

## 3. Edits to existing skills (re-scope)

### `simplify-fractions-by-factorising` — blurb widen

Its prereqs already compose `factorise-special-products` with the four-operation
`operate-algebraic-fractions-denominator`, so C_3 §2 (×/÷) and §3 (+/−) rational-expression
arithmetic sit inside its intended scope; only the blurb under-claimed.

- **Before:** "Simplify algebraic fractions using factorisation, e.g. $\dfrac{x^{2}+3x+2}{x+2}$."
- **After:** "Simplify, multiply, divide, add and subtract algebraic fractions using factorisation, e.g. $\dfrac{x^{2}+3x+2}{x+2}$ and $\dfrac{2}{x^{2}-4}-\dfrac{3}{x+2}$."

## 4. Borderline candidates — EXCLUDE

- **Separate `multiply-divide-` / `add-subtract-fractions-by-factorising` nodes**
  (C_3 §2/§3). Genuine routines, but new work = factorise-then-operate, already
  composed by the re-scoped `simplify-fractions-by-factorising`. Splitting would
  pollute; compound fractions get a node because nested-fraction resolution is *not*
  reachable that way.
- **`lcm-factored-denominators`** (C_3 §3 "Identify LCM", `x²−4 & x+2 →
  (x+2)(x−2)`). Reachable = factorise + LCD; folds into the umbrella. Same family as
  the group-11 `lcm-algebraic-terms` exclude.
- **`simplify-negatives-of-each-other`** (C_3 §1 `(3−x)/(x−3) = −1`). Sign sub-step
  inside `simplify-fractions-by-factorising`; `distribute-negative-multiplier` twin
  reachable. Fold.
- **Factorise DOTS with surds** (C_2 Q16 `3x²−4 = (√3x+2)(√3x−2)`). Surd manipulation
  is cross-topic (Indices C); routine folds into `factorise-special-products`, no
  surd prereq per no-cross-topic rule.

## 5. Considered and omitted

- C_2 mental arithmetic via special products (`96×104`, `82²`) — application wrapper.
- C_2 area/tray/geometry contexts — cross-topic grafts.
- C_1 negative-fraction equivalence table (`−(a+b)/c = (−a−b)/c`) — notational
  sub-step inside `add-subtract-binomial-fractions`.
- C_3 solve-for-x from a compound fraction (§4 Q5) — cross-topic (equations) graft.

---

**Net change:** 1 new skill (`simplify-compound-fractions`) · 1 new edge
(`add-subtract-binomial-fractions ← expand-brackets`) · 1 blurb re-scope
(`simplify-fractions-by-factorising`).
