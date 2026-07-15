# Atomisation proposal — Algebraic Techniques 3: Expanding Brackets (Stage 4)

Source booklet: `booklets/Stage 4/Algebraic Techniques 3_Expanding Brackets.md`
Target dot point: `dp-s4-alg-4` (topic `t-s4-alg`, MA4-ALG-C-01)
Rubric: `docs/atomisation-principles.md`

**Status: RESOLVED — 1 skill + 1 edge applied to `data/skills.json`.**
`distribute-negative-multiplier` was added and `expand-brackets` now lists it as a
prereq. `npm run validate` → 0 warnings.

---

## Existing graph (relevant Stage 4 algebra subgraph)

```
pronumerals-variables (s4, alg-1) []
 └─ algebraic-notation (s4, alg-1)
     ├─ identify-like-terms (alg-3) ┐
     ├─ identify-parts-of-expression (alg-1) ┘→ collect-like-terms (alg-3)
     │                                              └─ multiply-divide-algebraic-terms (alg-3) [+hcf]
     │                                                   └─ expand-brackets (s4/s5c/s6adv11, alg-4)
     │                                                        └─ factorise-common-factor (alg-5)
```

- `expand-brackets` already exists, already attached to `dp-s4-alg-4`.
- `collect-like-terms` is already transitively reachable from `expand-brackets`
  (`expand-brackets ← multiply-divide-algebraic-terms ← collect-like-terms`).
- `multiply-divide-algebraic-terms` already covers `x × x = x²`.
- Confirmed absent before this proposal: any skill isolating the negative-multiplier
  sign step in expansion.

The booklet's full routine range already lands on `expand-brackets`, except one
at-risk sign sub-step the coarse blurb silently bundles.

---

## Applied change — 1 new skill + 1 new edge

The recurring high-value pattern: a coarse skill (`expand-brackets`) whose blurb
nominally bundles a tricky, at-risk **sign** step. Lifting it out is legitimate and
non-redundant — the structural twin of `rewrite-touching-signs` /
`determine-sign-product-quotient` from the Integers pass.

### New skill: `distribute-negative-multiplier`
- **Title:** Expand a bracket with a negative term in front
- **Blurb:** Expand when the multiplier is negative, getting the sign of each
  product right, e.g. $-3(2x-5) = -6x+15$ and $-2a(3a-1) = -6a²+2a$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-alg-4"]` ·
  **difficulty:** 2
- **prereqs:** `[]` (the underlying ×/÷ sign rule is ambient integer arithmetic —
  not linked, per no-cross-topic; mirrors `determine-sign-product-quotient`)
- **Atom type:** Transformation / Category (decide sign of each term)
- **Booklet trace:**
  - Bk1 *Guided Practice* d–e and *Key Idea 2* ("When there is subtraction inside
    the brackets… treat the two terms as … and …"); Q3c/f, Q6 (`-5(2x+3)`,
    `-3(2a-5)`, `-2(3x-4)` …), `-7(x+5) = -7x-35`, `-6(3-e) = -18+6e`.
  - Bk2 Q1 (Pablo's sign error), Q5 (`-7y(4x+7)`, `-8d(t-3d)`), and especially
    **Q12 "Be careful of expanding negatives"** (`5a(a-3) - 2a(3a-1)`).
- **Bar justification:** distinctive (characteristic enabler of the negative case,
  the booklet's most-emphasised error site), at-risk (sign slips dominate here — a
  whole section + worked error address it), same stage, non-redundant.

### New edge: `expand-brackets ← distribute-negative-multiplier`
The negative-multiplier items sit inside the `expand-brackets` routine; the sign
sub-step is its characteristic at-risk enabler. Same-stage, non-redundant.

Resulting subgraph:
```
multiply-divide-algebraic-terms ─┐
distribute-negative-multiplier ──┴→ expand-brackets ─→ factorise-common-factor
```

---

## Borderline candidates considered — EXCLUDED

- **`expand-fractional-coefficient`** (Bk1 Q15: `⅓(6x+15)`, `¾(16-12y)`,
  `(4x+10y)/2`; Bk2 Q13: `(x/2)(4x+6)+…`). Recurring question type, but the *added*
  skill over plain expansion is fraction × term arithmetic — cross-topic (Fractions),
  barred as a prereq. Expansion logic unchanged. EXCLUDE; revisit only if a
  fraction-distribution variant is wanted tracked.
- **`expand-and-collect-like-terms`** (Bk2 Mastery Q7, Q12, Q13). Pure composition of
  `expand-brackets` ("…and simplify") with `collect-like-terms`, already transitively
  reachable. Adding an intermediate would pollute the graph. EXCLUDE.

---

## Considered and omitted (no schema change)

- **`x × x = x²` during expansion** (Bk2 Key Idea 2, Michael's Q2, `b(b-2)=b²-2b`):
  already covered by existing prereq `multiply-divide-algebraic-terms`. Not a sign
  step, so the twin-splitting rule does not apply.
- **Positive-multiplier, subtraction inside** (`5(x-3)=5x-15`): minus simply carries;
  folded into `expand-brackets`.
- **Build-an-expression-then-expand from words** (Bk1 Q8–9): composition of existing
  `translate-expressions` + `expand-brackets`; parallel skills, no new edge.
- **Area / perimeter contexts** (Bk1 Q5,7; Bk2 Q8–11): cross-topic measurement graft.
- **Operation-machine / pyramid / spiral puzzles** (Bk1 Q10–14, Bk2 Q6): non-routine
  puzzle wrappers around the same expansion routine.
