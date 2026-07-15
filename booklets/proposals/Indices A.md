# Atomisation proposal — Indices A (Core)

**Status: APPROVED & APPLIED.** `power-of-product-quotient` added to
`data/skills.json`; `simplify-index-products-quotients` blurb re-scoped. No other
edges. `npm run validate` clean.

## Context

Booklets `Stage 5 Core/Indices A 1_Index Laws.md` + `Indices A 2_Negative
Index.md`. Topic `t-s5c-ind-a`, dot points `dp-s5c-inda-1..3`. Goal: fill genuine
gaps in the Stage 5 Core indices routine graph.

## Finding (headline)

Topic near-fully covered by 4 existing Stage 5 skills (`index-laws-variables`,
`zero-index-algebraic`, `simplify-index-products-quotients`,
`negative-integer-indices`). **One genuine gap:** the power-of-a-product and
power-of-a-quotient laws — two full booklet sections + a mixed-practice section —
map to no existing node.

### Coverage map

| Booklet section | Existing skill |
|---|---|
| Index Law of ×, ÷, Power-of-Power | `index-laws-variables` |
| Index Law of Zero | `zero-index-algebraic` |
| Index Laws with Coefficients / More than One Variable / Mixed Basic | `simplify-index-products-quotients` |
| **Power of a Product / Power of a Quotient / Mixed** | **— gap (new skill) —** |
| Neg index `a^(−n)=1/aⁿ`, evaluate, denominator `1/a^(−n)=aⁿ`, coefficients | `negative-integer-indices` |

## 1. Recommended new skills

### `power-of-product-quotient` — Raise a product or quotient to a power — MODERATE-HIGH confidence

| field | value |
|---|---|
| id | `power-of-product-quotient` |
| title | Raise a product or quotient to a power |
| blurb | Apply $(ab)^n = a^n b^n$ and $\left(\frac{a}{b}\right)^n = \frac{a^n}{b^n}$, raising every factor including the coefficient. |
| stage | 5 |
| courses | `["s5-core"]` |
| dotPointIds | `["dp-s5c-inda-2"]` |
| difficulty | 2 |
| prereqs | `["simplify-index-products-quotients"]` |
| atom type | Routine (distribute outer index → power-of-power each factor → evaluate coefficient) |

```json
{
  "id": "power-of-product-quotient",
  "title": "Raise a product or quotient to a power",
  "blurb": "Apply $(ab)^n = a^n b^n$ and $\\left(\\frac{a}{b}\\right)^n = \\frac{a^n}{b^n}$, raising every factor including the coefficient.",
  "stage": 5,
  "courses": ["s5-core"],
  "dotPointIds": ["dp-s5c-inda-2"],
  "prereqs": ["simplify-index-products-quotients"],
  "difficulty": 2
}
```

**Booklet trace:** Book 1 *Power of a Product* — rule `(ab)^m=a^m b^m`; worked
`(5b)³=125b³`, `(−3x⁴y)²=9x⁸y²`, `4x(c²d³)⁵`; Foundation Q3–5, Development Q6–8,
Mastery Q9–16 (incl. the iconic `4x²` vs `(4x)²`, `−(3r)²` sign/bracket traps).
*Power of a Quotient* — rule `(a/b)^m=a^m/b^m`; worked `(6/b)³=216/b³`,
`(ab²/c⁴)⁴`, `(−2/3b)⁴=16/(81b⁴)`; Foundation Q2–4, Dev Q5–7, Mastery Q9–11.
*Mixed Practice: Power of a Product and Quotient* (whole section).

**Edge-bar (`power-of-product-quotient ← simplify-index-products-quotients`):**
1. **Distinctive** — distributing an outer index across each factor and raising
   the coefficient (`(2a³)³=8a⁹`) is the characteristic enabler; not ambient.
2. **At-risk** — the `(3x)²→3x²` / "forgot to cube the 2" error is a durable,
   explicitly-drilled cohort weakness, distinct from `3x²·4x³` fluency.
3. **Proximity** — same stage/dot point; harder variant sits downstream of the
   base product/quotient routine (progression chain).
4. **Non-redundant** — no node encodes the power-of-a-product/quotient laws;
   `index-laws-variables` reached transitively via the chosen prereq, so not also
   linked (transitive reduction).

## 2. Recommended new prereq edges to existing skills

**None** beyond the new skill's own prereq.

## 3. Edits to existing skills

**`simplify-index-products-quotients` blurb re-scope (lift-out bookkeeping).**
The ambiguous "powers" could be read as claiming power-of-a-product, now lifted
out.

- Before: *"Simplify powers, products and quotients of algebraic terms using
  index laws."*
- After: *"Simplify products and quotients of algebraic terms (including powers of
  single terms) using index laws."*

## 4. Borderline candidates → EXCLUDE

- **`negative-index-denominator` (`1/a^(−n)=aⁿ`, numerical).** Book 2 *Negative
  Indices in the Denominator*. Distinctive fact, but numerical and bundled into
  `negative-integer-indices` ("establish and evaluate … for numerical bases"); the
  algebraic lift already exists at Path (`convert-negative-positive-indices`).
  Adding a numerical twin = pollution.
- **`negative-index-coefficient` (`c·a^(−n)=c/aⁿ`, `c/a^(−n)=c·aⁿ`).** Book 2
  *Negative Indices with Coefficients*. Same routine with a coefficient carried
  along; "apply to the negative-index number only" is elementary once the base
  rule is held. EXCLUDE.
- **Split power-of-product from power-of-quotient (two skills).** EXCLUDE:
  bundling convention (the three basic laws bundle in `index-laws-variables`;
  Stage 4 Indices precedent). One node.

## 5. Considered-and-omitted (ambient / already-covered)

- Index laws with coefficients & multi-variable (`3a²b·2ab³`) —
  `simplify-index-products-quotients`.
- Neg-index → fraction/decimal, mixed-numeral bases `(1½)^(−1)`, `2ⁿ` recall
  tables — other numbers into `negative-integer-indices`; fraction conversion is
  cross-topic.
- `(−a)^n` sign/bracket reading in neg-index context (Book 2 Q10) — the sign rule
  is Stage 4 `sign-of-powers`; cross-referenced, not re-added.
- NAPLAN `(4^(−3)÷4⁶)³` — routine application of laws already covered.

## Net change

**+1 skill** (`power-of-product-quotient`), **+1 edge** (its prereq),
**1 re-scope** (`simplify-index-products-quotients` blurb).
