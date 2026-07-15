# Atomisation proposal — Indices B (Path)

**Status: APPROVED & APPLIED.** One edge added
(`reciprocal-index-expressions ← power-of-product-quotient`). No new skills.
`npm run validate` clean.

## Context

Booklet `Stage 5 Path/Indices B_1 Apply index laws to algebraic expressions
involving negative-integer indices.md`. Topic `t-s5p-ind-b`, dot point
`dp-s5p-ind-b-1`. Goal: audit against graph; check fallout from the row-13
`power-of-product-quotient` lift.

## Finding (headline)

Topic **fully covered** by the 4 existing Path skills — no new skill needed.

| Booklet section | Existing skill |
|---|---|
| Negative Index with Variables (`x^(−2)=1/x²`, `3a^(−2)=3/a²`) | `establish-negative-indices` |
| Express pos↔neg; Neg Index in Denominator (`1/a^(−n)=aⁿ`, `b/a^(−n)=baⁿ`) | `convert-negative-positive-indices` |
| Simplify products/quotients with neg indices (`3a^(−4)·2a²`, `12y^(−3)÷4y^(−2)`) | `index-laws-negative-indices` |
| Negative Index as Reciprocal (`(a/b)^(−1)=b/a`, `(a/b)^(−n)=bⁿ/aⁿ`) | `reciprocal-index-expressions` |

One consequence of row 13: power-of-a-product/quotient was lifted out of
`simplify-index-products-quotients` into the new `power-of-product-quotient`. The
top-of-chain Path skill `reciprocal-index-expressions` derives
`(a/b)^(−n)=(b/a)ⁿ=bⁿ/aⁿ` — its final step **is** power-of-a-quotient, no longer
reachable through its prereq chain. One edge restores honesty.

## 1. Recommended new skills

**None.**

## 2. Recommended new prereq edges

### `reciprocal-index-expressions ← power-of-product-quotient`

**Trace:** *Negative Index as the Reciprocal* — worked `(x/y)^(−3)=(y/x)³=y³/x³`,
`(2x²/5y)^(−3)=125y³/(8x⁶)`; Foundation Q1 m–t (`(xy/2)^(−4)`, `(2x⁴/ab²)^(−5)`);
Mixed Dev Q4 q,r + NAPLAN Q8,9 (`(3y³/2)^(−2)`, `(4p²/8)^(−3)`). Every one ends in
a power-of-a-quotient.

**Edge-bar:**
1. **Distinctive** — distributing the outer index over numerator and denominator
   is the characteristic closing step of `(a/b)^(−n)`; not ambient.
2. **At-risk** — a student shaky on `(a/b)ⁿ=aⁿ/bⁿ` (raising the coefficient, both
   terms) fails these regardless of reciprocal fluency.
3. **Proximity** — both Stage 5.
4. **Non-redundant** — `power-of-product-quotient` branches off
   `simplify-index-products-quotients` as a sibling of
   `index-laws-negative-indices`; it is **not** on `reciprocal-index-expressions`'s
   existing prereq path, and adding it makes no existing edge redundant.

## 3. Edits to existing skills

**None.**

## 4. Borderline candidates → EXCLUDE

- **Leave the edge off, mark nil.** Defensible if power-of-a-quotient is treated as
  ambient by the top of the Path negative-index chain. Rejected: including the edge
  directly restores a dependency the row-13 lift removed.
- **`index-laws-negative-indices ← power-of-product-quotient`.** EXCLUDE: that skill
  is ×/÷ of terms with negative indices (`3a^(−4)·2a²`), no bracket-to-power; the
  `(product)^n` cases live at the `reciprocal-index-expressions` tier.
- **`(a/b)^(−1)` reciprocal as its own skill.** EXCLUDE: base case of
  `reciprocal-index-expressions`, already bundled.

## 5. Considered-and-omitted

- `ba^(−n)=b/aⁿ` coefficient-stays rule, `x^(−1)` reciprocal, both-directions
  rewrites — `establish/convert` skills.
- `(−7xy)^(−3)` sign handling — Stage 4 `sign-of-powers`, cross-referenced.
- HSC/NAPLAN mixed simplifications, `if x⁴=3 find x⁸` substitution — routine
  applications of the covered skills.

## Net change

**0 new skills, +1 edge** (`reciprocal-index-expressions ←
power-of-product-quotient`), 0 re-scopes.
