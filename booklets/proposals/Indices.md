# Atomisation proposal — `Indices`

**Status: APPROVED & APPLIED.** Both recommended skills have been added to
`data/skills.json` (`sign-of-powers`, `sqrt-via-prime-factorisation`). No new
edges to existing skills.

## Scope

Atomised `booklets/Indices.md` into genuinely-missing skills + prereq edges for
`data/skills.json`, per `docs/atomisation-principles.md`.

Edge-inclusion bar: add `X ← P` only if P is (1) distinctive, (2) at-risk,
(3) within ~1 stage of X unless distinctive, (4) non-redundant by transitive
reachability. New skills only when no existing skill covers the routine.

### Target dot points / topic

The booklet is the **entire Stage 4 Indices topic** `t-s4-ind`, spanning all
three dot points:

- `dp-s4-ind-1` — index notation, divisibility, prime factorisation.
- `dp-s4-ind-2` — square/cube roots, estimating, evaluating with roots.
- `dp-s4-ind-3` — the index laws (×, ÷, power-of-power, zero) and applying them.

Stage 5 indices skills (algebraic / negative / fractional, `skills.json:357–479`)
are a separate progression and **out of scope** — this booklet is purely numerical.

## Headline outcome

The topic was **already well covered** by 12 existing Stage 4 skills
(`skills.json:238–249`). Coverage map:

| Booklet section | Existing skill |
|---|---|
| Index Notation | `index-notation-terms`, `evaluate-index-notation` |
| Evaluate Expressions with Indices | `order-operations-indices` |
| Divisibility | `divisibility-tests` |
| Prime Numbers | `prime-composite-numbers` (s3) |
| Prime Factorisation | `prime-factorisation` |
| Square / Cube Roots | `square-cube-roots` |
| Estimating Roots | `estimate-roots` |
| Evaluate Expressions with Roots | `order-operations-roots` |
| Index Law of ×, ÷, Power-of-Power | `index-laws-establish` |
| Index Law of Zero | `zero-index` |
| Mixed Practice / Evaluating by Applying | `apply-index-laws-numerical` |

The genuine gaps were **two missing skills**. No new edges to existing skills.

## New skills applied

### 1. `sign-of-powers` — Determine the sign of a power — HIGH confidence
- **blurb:** Use the parity of the index to find the sign of `(−a)^n`, and
  distinguish `−a^n` from `(−a)^n`.
- stage 4 · `["s4"]` · `dp-s4-ind-1` · difficulty 2 · **prereqs:** `evaluate-index-notation`
- **atom type:** Category / Fact.
- **Distinctive:** the sign rule (odd index → negative, even → positive) plus the
  bracket-vs-no-bracket precedence (`−a^n` vs `(−a)^n`) is the characteristic at-risk
  enabler, not ambient arithmetic.
- **At-risk:** sign errors on powers of negatives are a classic, durable cohort
  weakness, drilled explicitly here.
- **Non-redundant:** no existing skill encodes the sign rule —
  `evaluate-index-notation`'s blurb is "expanded form + evaluate, incl. powers of 10"
  and never mentions sign. The "coarse skill bundles a tricky sign sub-step → lift it
  out" pattern.
- **Booklet trace:**
  - Index Notation Q8 — `(−1)^n`, `(−2)^n`, `(−3)^n` tables → rule "negative to an odd
    power is negative / even power is positive" → "decide pos/neg without computing"
    (`(−9)^24`, `(−1)^11`, `(−200)^298`).
  - Index Notation Q2 k,l — `(−5)^2 = 25`, `(−5)^3 = −125`.
  - Zero Power Q4 + Mixed Practice Review g–i — `(−5)^0` vs `−5^0`, `−(4^0)` vs `4^0`
    vs `−4^0`.
  - Cube Roots Q6–8 — `(−3)^3 = −27`, `(−x)^3 = −x^3`, `∛(−p)`.

### 2. `sqrt-via-prime-factorisation` — Find square roots using prime factorisation — RECOMMEND (moderate confidence)
- **blurb:** Find the square root of a large perfect square by pairing its prime factors.
- stage 4 · `["s4"]` · `dp-s4-ind-2` · difficulty 3 · **prereqs:** `square-cube-roots`, `prime-factorisation`
- **atom type:** Routine (factor-tree → pair primes → read off root).
- **Distinctive:** pairing prime factors to extract a root is distinct from
  `square-cube-roots` (recall of the inverse relationship for *known* squares like
  `√144=12`); this method is for large non-recall squares.
- **At-risk:** genuinely tricky multi-step.
- **Proximity:** both prereqs Stage 4. **Non-redundant:** combines two existing skills
  into a routine neither covers.
- **Booklet trace:** Square Roots Development Q9 (`196 = 2^2 × 7^2 = 14^2 → √196 = 14`,
  scaffolded for 100/225/900), Q10 (`√` via prime factorisation), Q11 (`√784`, `√4356`).
- *Defensible to fold into `square-cube-roots` if a leaner graph is preferred.*

## New prereq edges to existing skills

**None.** Both new skills attach upward via their own prereqs and are left as leaf
skills under their dot points. Forcing e.g. `order-operations-roots ← sign-of-powers`
everywhere a negative base appears would pollute the graph — once learned, the sign
rule is ambient.

## Borderline candidates considered → EXCLUDE

- **Split `index-laws-establish` into three per-law skills (×/÷/power-of-power).**
  EXCLUDE: the graph's convention is to *bundle* the laws (Stage 5 `index-laws-variables`
  and `simplify-index-products-quotients` are also bundled); splitting Stage 4 only would
  be inconsistent pollution. `index-laws-establish` + `apply-index-laws-numerical` carry
  all three.
- **"Identify when an index law applies" (same-base recognition).** Each law section opens
  with an "Identify when you can use the law" panel (`a^m × a^n` ✔ vs `a^m + a^n` ✖ vs
  `a^m × b^n` ✖); Mixed Practice drills it. A real invisible Category atom. EXCLUDE (lean):
  it is the recognition half of the *same* routine as `apply-index-laws-numerical`; the
  graph separates recognition from application nowhere else. Closest borderline — defensible
  to include if the invisible-atom split is wanted.
- **Evaluate powers/roots of fractions & decimals** (Evaluate-with-Roots Q8: `(1/5)^3`,
  `(2¼)^2`, `√(1/4)`, `∛(−8/27)`, `√0.04`…). EXCLUDE: just other numbers fed into the
  existing evaluate routines; the hard part (improper-fraction conversion, fraction
  arithmetic) is cross-topic.
- **Place-value expansion with powers of 10** (Index Notation Q9–10:
  `537 = 5×10^2 + 3×10^1 + 7`). EXCLUDE: place value is cross-topic/elementary; the
  "write as power of 10" part is already in `evaluate-index-notation`.
- **Higher roots (4th/5th/nth)** (Cube Roots Q4–5: `∜16`, `∜100000`, 7th/10th roots).
  EXCLUDE: calculator/given-fact exploration, non-routine for Stage 4; nth roots land in
  Stage 5 surds (`define-surds`).
- **Divisibility by composite numbers via coprime factors** (Divisibility Q20–26: ÷24 via
  3 and 8, ÷18 via 2 and 9). EXCLUDE: Mastery/extension reasoning, non-routine; the
  2-and-3→6 logic is already in `divisibility-tests`.

## Considered and omitted (ambient / elementary / already-covered)

- Repeated-division ("ladder") method for prime factorisation (PF Q10) — a method variant
  of `prime-factorisation`.
- Recurring-vs-terminating decimals from denominator prime factors (PF Q18) — cross-topic
  investigation; already at Stage 5 (`recurring-decimal-to-fraction`).
- `(ab)^2 = a^2 b^2` mini-investigations (Square Roots Q13–14, Power-of-Power Q4–5) — the
  product-of-powers law proper is Stage 5 algebra, cross-topic here.
- Identifying perfect squares/cubes, squaring/cubing, inverse root relationship — covered by
  `square-cube-roots`.
- `(−a)^0 = 1` as a value — covered by `zero-index`; only the `−a^0` vs `(−a)^0`
  sign/precedence reading is lifted (into `sign-of-powers`).
- Order-of-operations with indices/roots, "invisible brackets" inside `√` — covered by
  `order-operations-indices` / `order-operations-roots`.
