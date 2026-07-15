# Atomisation proposal — Algebraic Techniques A (Core), Stage 5

Source booklets:
- `booklets/Stage 5 Core/Algebraic Techniques A 1_Apply the 4 operations to simplify algebraic fractions with numerical denominators.md`
- `booklets/Stage 5 Core/Algebraic Techniques A 2_Apply the distributive law to the expansion of algebraic expressions, and collect like terms where appropriate.md`

Target topic: `t-s5c-alg-a`, dot points `dp-s5c-alga-1` (Bk1), `dp-s5c-alga-2` (Bk2)
Rubric: `docs/atomisation-principles.md`

**Status: APPLIED — 0 new skills · +1 edge · −1 redundant edge · 0 re-scopes.**
`simplify-algebraic-fractions-numerical` prereqs changed from
`["multiply-divide-algebraic-terms", "add-subtract-fractions"]` to
`["multiply-divide-algebraic-terms", "multiply-divide-fractions"]`.
`npm run validate` → 0 warnings.

---

## Context

Check both dot points are correctly atomised; add only what's genuinely missing.
Bk1 = the 4 operations on algebraic fractions with numerical denominators.
Bk2 = distributive law / expansion.

## Finding (headline)

Dense pre-existing coverage. Bk2's whole routine range already lands on
`distribute-negative-multiplier → expand-brackets → expand-binomial-products`,
built/confirmed by the Stage 4 Expanding Brackets pass (which explicitly rejected
an expand-then-collect skill). Bk1 is served by the single coarse skill
`simplify-algebraic-fractions-numerical`. No new skills. One genuine prereq-edge
correctness fix on Bk1: the skill does division-by-reciprocal but never depended
on numeric fraction mult/div.

---

## 1. New skills

**None.** Every routine in both booklets traces to an existing skill (see §5).

## 2. New prereq edges

### `simplify-algebraic-fractions-numerical ← multiply-divide-fractions`

The skill's blurb is "Add, subtract, **multiply and divide** algebraic fractions."
The divide routine is keep-change-flip — multiply by the reciprocal — the exact
numeric-fraction division method. Yet `multiply-divide-fractions` was not a prereq
while its additive twin `add-subtract-fractions` was. Gap, not a deliberate
omission.

- **Trace:** Bk1 *Dividing Algebraic Fractions* — Example `3a/8 ÷ b/5 = 3a/8 × 5/b`,
  `u/4 ÷ 15p/2 = u/4 × 2/15p`; Foundation Q1–Q2, Development Q3–Q4, Mastery Q7
  (`… ÷ … ÷ …`). *Multiplying* Example `2a/5 × 3b/7`, cancel-before-multiply Q4.
  Reciprocal recap Bk1 Review Q12.
- **Bar (4-part):**
  1. **Distinctive** — multiply-then-reciprocal is the characteristic enabler of
     the divide half; not ambient.
  2. **At-risk** — fraction division (keep-change-flip) is a classic Stage-4 skill
     still shaky entering Stage 5 Core.
  3. **Stage-proximity** — `multiply-divide-fractions` is s4, skill is s5; within 1.
  4. **Non-redundant** — not reachable through any existing prereq
     (`multiply-divide-algebraic-terms → collect-like-terms/hcf`;
     `add-subtract-fractions → equivalent-fractions/lcm…`).

**Coupled removal (transitive reduction):** `multiply-divide-fractions` prereqs
`["add-subtract-fractions", "find-reciprocal"]`, so adding it makes the existing
`add-subtract-fractions` edge redundant (rule 4). Dropped.

## 3. Edits to existing skills

Only the prereq array above. No blurb re-scopes. The 4-operations bundle stays one
skill — it mirrors the numeric graph (where `add-subtract-fractions` itself bundles
same+different denominators), and the dot point is worded as one unit.

## 4. Borderline candidates — EXCLUDE

- **Split Bk1 into add-subtract- vs multiply-divide-algebraic-fractions.** Single
  dot point, single existing skill at difficulty 2, user strongly lean. Harder
  sub-case (different denominators) is bundled exactly as its numeric twin bundles
  it, so no progression-chain split is forced. The corrected prereq pair captures
  the real dependencies without a second node.
- **`expand-then-collect-like-terms`** (Bk2 *Expanding then Simplifying*,
  `5(2e−3)−4(1−5e)`). Already rejected in the Stage 4 Expanding Brackets pass —
  pure composition of `expand-brackets` ("…and simplify") with `collect-like-terms`,
  transitively reachable.
- **`expand-fractional-coefficient`** (Bk1 Q8 `½(x+4)`, `x/3(6+9y)+y(x+4)`). Same as
  the Stage 4 rejection: added grain is fraction×term arithmetic (cross-topic,
  barred as prereq); expansion logic unchanged.
- **`perfect-square-expansion`** (Bk2 `(x−4)²`, `(2x+8)²`). Taught here only as an
  ordinary binomial product (rewrite as two brackets, expand) — no special identity
  introduced. Folded into `expand-binomial-products`; identity treatment belongs to
  Path/Extension.

## 5. Considered and omitted (no schema change)

- **Bk1 add/subtract same denominator** (`5x/13 + 3x/13`) → `simplify-algebraic-fractions-numerical`.
- **Bk1 add/subtract different denominators / LCD** (`4x/3 − x/6`) → same skill;
  LCD/equivalent-rewrite reachable via `multiply-divide-fractions → add-subtract-fractions
  → equivalent-fractions, lcm-two-numbers`.
- **Bk2 negative-coefficient expansion** (`−8(7+2y)`, `−x(2y−z)`) →
  `distribute-negative-multiplier` + `expand-brackets` (Stage 4 pass).
- **Bk2 expand binomial products, incl. area model and `(ax+b)(cx+d)`** →
  `expand-binomial-products ← expand-brackets`.
- **`x·x = x²` / add-exponents during expansion** (Bk2 Q3 error-analysis) →
  `multiply-divide-algebraic-terms`.
- **Word/area/geometry contexts** (Bk1 netball court, field; Bk2 area-of-shapes) →
  cross-topic grafts, no new edges.
- **Find-the-missing-term / error-analysis puzzles** → non-routine wrappers around
  the same routines.

---

**Net change:** 0 new skills · +1 new edge
(`simplify-algebraic-fractions-numerical ← multiply-divide-fractions`) · −1 redundant
edge (`← add-subtract-fractions`) · 0 re-scopes.
