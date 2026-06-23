# Atomisation proposal — Equations 1: Solve 2-step equations (Stage 4)

Source booklet: `booklets/Equations 1_Solve 2 step equations.md`
Target dot point: `dp-s4-equ-1` (topic `t-s4-equ`, MA4-EQU-C-01 — "Solve linear
equations up to 2 steps"). All proposed skills attach here.
Rubric: `docs/atomisation-principles.md`

**Status: RESOLVED — 3 new skills + `solve-linear-2-step` re-scope + Stage-5 edges
applied to `data/skills.json`. `npm run validate` → 0 warnings.**

The booklet covers the full Stage-4 linear-equation routine across separate taught
sections: one-step → two-step → negative coefficients → grouping (brackets/fractions)
→ expanding method → x on both sides → word problems.

---

## Existing graph (relevant Stage-4 equations subgraph)

```
expression-vs-equation (s4, equ-1) ← translate-expressions
solve-linear-2-step    (s4, equ-1) ← expand-brackets, multiply-divide-integers
   blurb: "Solve linear equations of up to 2 steps, including pronumerals on both sides."
   ├─ model-word-problems-equations (s4/s5c/s6st11, equ-1+)
   ├─ verify-solutions-substitution (s4/s5c, equ-2)
   └─ equations-from-formulas       (s4/s5c, equ-2)
solve-linear-3-step    (s5-core, s5c-equa-1) ← solve-linear-2-step
   blurb: "...up to 3 steps, including grouping symbols and pronumerals on both sides."
```

`solve-linear-2-step` is **over-bundled**: its blurb silently absorbs one-step
solving, the reverse-BIDMAS two-step chain, the negative-coefficient sign rule and
pronumerals-on-both-sides — four steps the booklet teaches as *separate sections*.
Per the rubric note, a blurb *mentioning* a sub-step does **not** make a split
redundant — only transitive reachability does.

**Decomposition (decided with user):** rather than hang the harder cases off the
monolith as siblings, turn it into a short ordered progression. The negative case
*requires* fluency at the positive two-step chain first (you can't safely divide by
a negative until the clean chain is automatic), so it sits **downstream** of
`solve-linear-2-step`, not as a prereq of it. Same for x-on-both-sides.

```
solve-one-step-equation (new)
        ↓
solve-linear-2-step (existing, re-scoped: positive two-step incl. grouping)
        ↓                              ↓
solve-equation-negative-coefficient   solve-equation-x-both-sides   (both new)
```

---

## Recommended: 3 new skills, 1 re-scope, edges

### Re-scope existing `solve-linear-2-step`
- **Add prereq:** `solve-one-step-equation` (keep existing `expand-brackets`,
  `multiply-divide-integers`).
- **Narrow blurb** from *"Solve linear equations of up to 2 steps, including
  pronumerals on both sides."* → **"Solve two-step linear equations by undoing
  operations in reverse order of BIDMAS, including grouping, e.g. $3x+8=14$ and
  $3(x+1)=15$."** (drops "pronumerals on both sides" — now its own skill).
- stage/courses/dotPointIds unchanged (4, `["s4"]`, `["dp-s4-equ-1"]`).

### 1. `solve-one-step-equation` — base of the chain
- **Title:** Solve one-step linear equations
- **Blurb:** Isolate $x$ with a single inverse operation, e.g. $x + 7 = 12$,
  $3x = 18$, $x/2 = 4$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-equ-1"]` ·
  **difficulty:** 1 · **prereqs:** `[]`
- **Atom type:** Routine (mini) — the base case of all equation solving.
- **Booklet trace:** whole section *"One-Step Equations"* (Key Idea "isolate $x$
  using inverse operations"; Example `x + 7 = 12`; Foundation Q1) + the
  *"Inverse Operations"* precursor section.
- **Bar:** distinctive (the base atom that two-step *chains*), at-risk (own section
  with full Foundation/Dev/Mastery), same stage, non-redundant. Mirrors the
  integers-pass precedent (`add-subtract-positive-integers ← add-subtract-integers`).
- **Edge:** `solve-linear-2-step ← solve-one-step-equation`.

### 2. `solve-equation-negative-coefficient` — the sign twin (downstream of two-step)
- **Title:** Solve equations with a negative coefficient of x
- **Blurb:** Isolate $x$ when its coefficient is negative, dividing by the negative
  and treating $-x$ as $-1x$, e.g. $3 - 2x = 15 → x = -6$ and $-x + 5 = 12 → x = -7$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-equ-1"]` ·
  **difficulty:** 2
- **prereqs:** `["solve-linear-2-step"]` — the positive two-step chain must be fluent
  before the negative variant (the ordering point). The underlying ÷-by-negative is
  ambient integer arithmetic, not linked (as the sign-twins
  `distribute-negative-multiplier` / `determine-sign-product-quotient` were left).
- **Atom type:** Transformation / Category (decide the sign when dividing/undoing).
- **Booklet trace:** whole section *"Two-Step Equations with Negative Coefficients"*
  (Example `3 - 2x = 15`, `-4 - x/2 = 3`; Key Idea "a negative coefficient means the
  operation is ×/÷ by a negative number"); **Eliza's worked error** ("$-k$ means
  $-1×k$, so divide by $-1$"); **Bobbie's worked error** ("should have kept the
  negative sign with 6"); Mastery Q6 (three methods for `8-4x=12`).
- **Bar:** distinctive (characteristic enabler of the negative case, the booklet's
  most-emphasised error site), at-risk (a whole section + two worked errors target
  sign slips), same stage, non-redundant. Structural twin of
  `distribute-negative-multiplier`, `rewrite-touching-signs`,
  `determine-sign-product-quotient` → split applied consistently.
- **Edge:** `solve-equation-negative-coefficient ← solve-linear-2-step`.

### 3. `solve-equation-x-both-sides` — collect-x variant (downstream of two-step)
- **Title:** Solve equations with the pronumeral on both sides
- **Blurb:** Add or subtract a multiple of $x$ to gather $x$ terms on one side
  (keeping the coefficient positive), then solve, e.g. $2x + 5 = x + 8 → x = 3$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-equ-1"]` ·
  **difficulty:** 2 · **prereqs:** `["solve-linear-2-step"]`
- **Atom type:** Category / Transformation (decide which side to clear; the +/−
  multiple-of-x move). The invisible "choose the side to keep the coefficient
  positive" decision is the at-risk atom.
- **Booklet trace:** whole section *"Equations with x on Both Sides"* (Example
  `2x+5=x+8`, `2x+7=5x+1`; Key Ideas "all $x$ terms on one side… keep coefficient
  positive"); balance-model Q3; Ashley/Amelia & Emma/Harriet which-side items;
  Jackson/Umi/George worked errors.
- **Bar:** distinctive (the "collect x terms" move appears in no other skill),
  at-risk (multiple worked errors: combining unlike terms, wrong inverse, sign),
  same stage, non-redundant. The monolith's blurb claimed this case but never
  exposed it — exactly the split being made.
- **Edge:** `solve-equation-x-both-sides ← solve-linear-2-step`.

### Resulting subgraph
```
solve-one-step-equation ─→ solve-linear-2-step ─┬─→ solve-equation-negative-coefficient
expand-brackets ──────────────┘ │              └─→ solve-equation-x-both-sides
multiply-divide-integers ───────┘ └─────────────────→ solve-linear-3-step (s5)
```

### Optional downstream edges (flag for review)
`solve-linear-3-step` (s5, "…including grouping symbols and pronumerals on both
sides") currently depends only on `solve-linear-2-step`. If the two new leaf skills
are accepted, it is more honest for 3-step to require them too:
- `solve-linear-3-step ← solve-equation-negative-coefficient`
- `solve-linear-3-step ← solve-equation-x-both-sides`

Both non-redundant (neither lies between 3-step and 2-step) and stage-valid (s4 ≤
s5). **Recommend including**, but listed separately since they touch a Stage-5 node
beyond this booklet's dot point — prune to keep the change inside `dp-s4-equ-1`.

---

## Borderline candidates considered — EXCLUDE

- **`order-inverse-operations`** (decide reverse-BIDMAS order to isolate $x$). The
  single most-drilled idea in the booklet ("Identify operations done to $x$" /
  "Identify order of inverse operations" in every section). EXCLUDE: for a two-step
  equation this *is* the routine `solve-linear-2-step` itself, not a separable
  enabler — adding it as a prereq is circular/redundant. Keep bundled.
- **`solve-equation-grouping`** (2-step brackets/fractions by inverse ops; undo
  outside-brackets first, e.g. `3(x+1)=15`, `(x+3)/2=5`). Sections *"Equations with
  Grouping"* + *"Expanding Method"*. EXCLUDE: solving by dividing-first is just the
  two-step chain already covered; solving by expanding-first uses `expand-brackets`,
  already a prereq of `solve-linear-2-step`. No new atom; pure composition.
- **`solve-equation-brackets-expand`** (expand then solve). EXCLUDE: literal
  composition of existing prereq `expand-brackets` + solving. Twin of the excluded
  `expand-and-collect-like-terms` from the Expanding-Brackets pass.

---

## Considered and omitted (no schema change)

- **Solving by inspection** (guess/check, `x+3=5`) — non-routine precursor, not a
  taught procedure worth a node.
- **Equivalent equations / balance principle** ("do the same to both sides") — the
  invisible content of every solving skill, not separable.
- **Simplify (collect like terms) before solving** (Two-Step Q10, `13+2n+2n=41`;
  Ken's "3 is not a like term"). Cross-topic graft onto `collect-like-terms`; barred
  as a prereq, pure composition.
- **Word-problem sections** ("Writing Equations from Scenarios",
  "Problem-Solving using Equations", "Further Problem-Solving") — already covered by
  existing `model-word-problems-equations` (dp-s4-equ-1).
- **Verify by substitution** (x-both-sides Q3d, Q10) — already covered by existing
  `verify-solutions-substitution` (dp-s4-equ-2).
- **Divide-first vs expand-first / which-method strategy reflections** (Two-Step
  Q6–11, Grouping Q5–6, Expanding Q4–11) — metacognitive prompts, not routine atoms.

---

## On apply (after review)

1. Add the 3 new skills, re-scope `solve-linear-2-step` (new prereq + blurb), and add
   the leaf/optional edges to `data/skills.json` (UTF-8; read with utf-8 encoding).
2. `npm run validate` (`scripts/validate.mjs`) → expect stage-monotonic (all new
   prereqs stage 4 ≤ their skill's stage), acyclic, all refs resolve, 0 warnings.
