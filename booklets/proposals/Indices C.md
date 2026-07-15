# Atomisation proposal — Indices C (Path)

**Status: APPROVED & APPLIED.** 3 new skills (`express-common-prime-base`,
`solve-exponential-equations`, `factorise-index-expressions`) + 1 re-stage/re-attach
(`rationalise-binomial-surd-denominator`). `npm run validate` clean.

## Context

Booklets `Stage 5 Path/Indices C_1 Describe surds.md`, `C_2 Apply knowledge of
surds to solve problems.md`, `C_3 Describe and use fractional indices.md`. Topic
`t-s5p-ind-c`, dot points `dp-s5p-ind-c-1..3`.

## Finding (headline)

~10 existing skills cover surds-describe (C_1), surd laws / simplify / ± / × / ÷ /
distributive / expand-binomials / monomial-rationalise (C_2), and fractional
indices (C_3). **Four gaps** — one already existed as a Stage 6 skill stranded off
this topic; three genuinely new.

### Coverage map (gaps bolded)

| Booklet content | Skill |
|---|---|
| Decimals↔fractions, irrationals, surds, domain | `recurring-decimal-to-fraction`, `real-numbers`, `define-surds`, `surd-domain-conditions` |
| Surd laws, simplify, ±, ×, ÷, distributive, expand binomials | `surd-results`, `simplify-surds-operations`, `expand-surd-expressions` |
| Rationalise **monomial** denominator (`a√b/c√d`) | `rationalise-denominator` |
| **Rationalise binomial denominator (conjugate)** | `rationalise-binomial-surd-denominator` (re-staged, §3) |
| Fractional / further fractional indices, index+surd laws | `fractional-indices`, `surd-index-conversion` |
| **Solve exponential equations (equate indices)** | **new §1b** |
| **Common prime-base rewrite** (`12ⁿ×9=2^(2n)3^(n+2)`) | **new §1a** |
| **Factorise index expressions** (`3ⁿ+3^(n+1)=4·3ⁿ`) | **new §1c** |

## 1. New skills

### 1a. `express-common-prime-base` — MODERATE
```json
{ "id": "express-common-prime-base", "title": "Simplify powers using a common prime base", "blurb": "Rewrite powers with composite bases as products of prime-base powers to simplify products and quotients.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-ind-c-3"], "prereqs": ["power-of-product-quotient", "prime-factorisation"], "difficulty": 3 }
```
**Trace:** C_3 *Factorising Expressions with Indices* — worked `12ⁿ×9=2^(2n)3^(n+2)`;
Foundation Q1 (`8^(2x)÷2^(6x)×4^x=2^(2x)`), Q2 (prime-factorise mixed-base
fractions). **Bar:** distinctive (recognise composite base = product of prime
powers, then distribute the index — its own exercise set); at-risk; proximity
(s5); non-redundant. Shared enabler of 1b and 1c.

### 1b. `solve-exponential-equations` — HIGH
```json
{ "id": "solve-exponential-equations", "title": "Solve exponential equations", "blurb": "Solve exponential equations by expressing both sides with a common base and equating the indices.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-ind-c-3"], "prereqs": ["express-common-prime-base", "fractional-indices"], "difficulty": 3 }
```
**Trace:** C_3 *Exponential Equations* — worked `25^x=125→x=3/2`, `3^x=1/9→x=−2`,
`9^(2x−1)=27→x=5/4`; Foundation Q1–6, Dev Q7–13, Mastery Q14 (`3^x=√81`, decimals).
**Bar:** distinctive (equate-indices method `a^m=a^n⟹m=n`, entirely absent;
`solve-exponential-log-equations` is the logs topic's method); at-risk; proximity;
non-redundant. Simultaneous exponential Q15 excluded — cross-topic.

### 1c. `factorise-index-expressions` — HIGH
```json
{ "id": "factorise-index-expressions", "title": "Factorise expressions involving indices", "blurb": "Factorise sums and differences of powers such as $a^{n+1}+a^{n}$ by taking out the common power, then simplify.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-ind-c-3"], "prereqs": ["express-common-prime-base"], "difficulty": 3 }
```
**Trace:** C_3 *Factorising Expressions with Indices* — worked
`3ⁿ+3^(n+1)=3ⁿ(1+3)=4·3ⁿ`; Dev Q3–6 (`7^(n+2)+7ⁿ`, mixed-base `6ⁿ−3ⁿ=3ⁿ(2ⁿ−1)`),
Mastery Q7–9 (DOTS `9ⁿ−1=(3ⁿ+1)(3ⁿ−1)`, solving `4^x−2^(x+1)−8=0`). **Bar:**
distinctive (rewrite `a^(n+k)=a^k·a^n` then extract common power — iconic "can't add
powers" error); at-risk; proximity; non-redundant (`factorise-common-algebraic-factor`
is polynomial-HCF, not variable-index powers).

## 2. New prereq edges to existing skills

**None** beyond the new skills' own prereqs.

## 3. Edits to existing skills

**`rationalise-binomial-surd-denominator` re-staged/re-attached.** The conjugate
rationalising skill already existed but was stranded at Stage 6 Advanced
(`dp-s6adv11-functions-2`). Its earliest genuine stage is Stage 5 Path (C_2
*Rationalising Binomial Denominators*: `3/(5+√3)`, `√5/(2√2−3)`, Foundation Q1–3,
Dev Q10, Mastery Q4–8). Prereqs already correct (`rationalise-denominator`,
`expand-surd-expressions`).

- stage `6 → 5`
- courses `["s6-adv11"] → ["s5-path", "s6-adv11"]`
- dotPointIds `["dp-s6adv11-functions-2"] → ["dp-s5p-ind-c-2", "dp-s6adv11-functions-2"]`

## 4. Borderline candidates → EXCLUDE

- **New `rationalise-binomial-denominator` skill.** EXCLUDE: dedupe — the existing
  `rationalise-binomial-surd-denominator` covers it; re-staged instead (§3).
- **`identify-conjugate` as its own skill.** EXCLUDE: bundled into the above.
- **Simultaneous exponential equations** (C_3 Q15). EXCLUDE: cross-topic.
- **`terminating-decimal-to-fraction`** (C_1). EXCLUDE: Stage 4 FDP / ambient.
- **Cut `express-common-prime-base`** (fold into 1b/1c). Considered; kept because the
  pure-simplification exercises (C_3 Foundation Q1–2) have no other home and it is
  the shared enabler.

## 5. Considered-and-omitted

- Surd laws, simplify, ±, ×, ÷, distributive, monomial rationalise, expand surd
  binomials — existing surd skills.
- Fractional / further fractional indices, index+surd law combos —
  `fractional-indices`, `surd-index-conversion`.
- "Show expression is rational", LCD of surd fractions (C_2 Mastery) — routine
  applications of rationalising.

## Net change

**+3 new skills** (`express-common-prime-base`, `solve-exponential-equations`,
`factorise-index-expressions`), **0 edges to existing skills**, **1 re-stage**
(`rationalise-binomial-surd-denominator`).
