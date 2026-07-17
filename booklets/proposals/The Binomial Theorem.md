# Proposal — The Binomial Theorem (QUEUE row 82) — APPLIED

**Status:** APPLIED (2 new skills, 2 new edges, 0 re-scopes). `npm run validate` clean (1182 skills).

**Context.** Booklet `Stage 6 Extension 1/The Binomial Theorem.md` (2558 lines). Topic `t-s6x1y11-binomial`, dot points `dp-s6x1y11-binomial-1/2/3` (Pascal's triangle & coefficients; expand + specific term; identities). Audit of the pre-seeded 6-skill binomial cluster against the full booklet (worked examples + all practice/exam/challenge exercises).

**Finding (headline).** Coverage already dense and mostly correct: `pascals-triangle`, `binomial-coefficient-equivalence` (dp-1); `binomial-theorem-expand`, `binomial-specific-term` (dp-2); `simplify-binomial-coefficient-expressions`, `prove-binomial-identities` (dp-3), plus `combinatorial-argument-proof` from the combinatorics topic. **Two heavily-drilled routines had no home:** (A) finding a coefficient in a **product** like `(a+bx)(1+cx)^n` — the bulk of the "Finding a Particular Term" exercise (~15 questions) plus a real HSC Band 4; and (B) proving identities by **equating coefficients** — an explicitly-taught proof method with its own worked example and 4 HSC exam questions (Band 4–6). Everything else covered or cross-topic graft.

---

## 1. New skills

### 1a. `binomial-coefficient-in-product`

| field | value |
|---|---|
| id | `binomial-coefficient-in-product` |
| title | Find a coefficient in a product with a binomial expansion |
| blurb | Find the coefficient of a specified power of $x$ in a product such as $(a+bx)(1+cx)^{n}$ by expanding the binomial as far as the needed term and combining the contributions. |
| stage | 6 · courses `["s6-ext1-11"]` · dotPointIds `["dp-s6x1y11-binomial-2"]` · difficulty 3 |
| prereqs | `["binomial-specific-term"]` |
| atom type | Routine (R) |

**Booklet trace.** "Finding a Particular Term" → Development Q9–16 (Q9 `(1−5x)(1+x)⁴` coeff `x²` = −14; Q11 `(2+x)²(1−3x)⁴`; Q16a–d), Mastery Q20 `(1+2x)⁴(1−1/x²)⁶` const = 97, Q22, Q23; **Exam Q5 (2022 HSC Band 4)**; method box "expand … as far as the term in x^k, hence find the coefficient."

**Edge-bar (`← binomial-specific-term`).** (1) Distinctive — must first pick out the relevant single term of the binomial factor; characteristic enabler. (2) At-risk — a student who can find one term still mishandles which cross-products sum to `x^k`. (3) Proximity — same stage/topic. (4) Non-redundant — `binomial-specific-term` not otherwise reachable.

### 1b. `prove-binomial-identities-equate-coefficients`

| field | value |
|---|---|
| id | `prove-binomial-identities-equate-coefficients` |
| title | Prove binomial identities by equating coefficients |
| blurb | Prove identities involving binomial coefficients by expanding both sides of an equation such as $(1+x)^{a}(1+x)^{b}=(1+x)^{a+b}$ and equating the coefficient of a chosen power of $x$. |
| stage | 6 · courses `["s6-ext1-11"]` · dotPointIds `["dp-s6x1y11-binomial-3"]` · difficulty 3 |
| prereqs | `["binomial-coefficient-in-product"]` |
| atom type | Routine (R) |

**Booklet trace.** "Proofs using Binomial Theorem" explicitly lists two methods — substituting and equating coefficients; worked example proving `(nC0)²+…+(nCn)² = 2nCn` by equating constant terms of `(x+1/x)^n(x+1/x)^n`. **Exam Q8, Q9 (sample Band 4–5), Q11 (2020 HSC Band 6)**, Challenge Q7 — all "using `(1+x)^a(1+x)^b=(1+x)^{a+b}` show that …".

**Edge-bar (`← binomial-coefficient-in-product`).** (1) Distinctive — proof turns on extracting the coefficient of `x^k` from a product of two expansions, exactly the product-coefficient routine. (2) At-risk — students fluent in substitution proofs still struggle to set up the coefficient-comparison. (3) Proximity — same stage. (4) Non-redundant — not reachable from existing dp-3 skills. Third booklet-taught proof method; substitution lives in `prove-binomial-identities`, combinatorial in `combinatorial-argument-proof`, equating-coefficients previously had no skill.

## 2. New prereq edges

Both internal to §1: `binomial-coefficient-in-product ← binomial-specific-term`; `prove-binomial-identities-equate-coefficients ← binomial-coefficient-in-product`. No edges added to pre-existing skills.

## 3. Edits to existing skills

None. Existing blurbs (`binomial-specific-term`, `prove-binomial-identities` umbrella) unchanged; the two new skills sit downstream rather than re-scoping.

## 4. Borderline candidates → EXCLUDE

- **`binomial-equate-consecutive-terms`** (find `x`/`n` when coefficients of `x^r`, `x^{r+1}` equal or in a given ratio) — Q19, **Exam Q4 (2019 HSC Band 4)**, Challenge Q1/Q4/Q5. Real recurring Band 4 type, but mechanics = `binomial-specific-term` twice + cross-topic algebra (ratio of `nCr`, solving). Excluded for leanness; distinctive bit is simplifying `nCr / nC(r+1)`.
- **`recognise-reverse-binomial-expansion`** (collapse `1+3(x−1)+3(x−1)²+(x−1)³ = x³`) — §2 Development Q4, Mastery Q5. Clever recognition, ~4 questions, not an exam staple. Excluded.
- **`binomial-find-a-and-n-from-terms`** (Q24) — one-off reverse problem, cross-topic simultaneous equations. Excluded.

## 5. Considered-and-omitted

- **Prove identities by substituting `x=1, −1`** (§4 Foundation Q1–3) — covered by `prove-binomial-identities`.
- **Combinatorial-argument / subset-counting proofs** (§4 Development Q4–6, Challenge Q8) — covered by `combinatorial-argument-proof`.
- **Constant / term independent of `x`** — special case of `binomial-specific-term`.
- **Expand via Pascal's triangle vs binomial theorem** — `pascals-triangle` / `binomial-theorem-expand`.
- **`(1+√3)^5 = a+b√3`** (Q6) — expand + surds collect; cross-topic (surds), no new skill.
- **Calculus proofs** (differentiate the expansion, Challenge Q7–9) — cross-topic graft (differentiation); no calculus prereq per scope rules, no new skill.
- **Divisibility proofs `7^n+2 ÷ 3`** (Challenge Q2) — non-routine, challenge-only. Excluded.

---

**Net change:** +2 new skills, +2 new edges, 0 re-scopes.
