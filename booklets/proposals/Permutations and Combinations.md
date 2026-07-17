# Proposal — Permutations and Combinations (Stage 6 Ext 1, row 81)

**Status: APPLIED** (2026-07-17). `npm run validate` clean — 1180 skills, 0 warnings.
+3 new skills, +1 new edge, 0 re-scopes.

**Context.** Booklet: `Stage 6 Extension 1/Permutations and Combinations.md` (single booklet,
13 sections + Exam Questions + Challenge). Topic `t-s6x1y11-combinatorics`, dp-1 (factorials +
multiplication principle), dp-2 (permutations `ⁿPᵣ`, non-distinct, restrictions), dp-3 (circular),
dp-4 (combinations `ⁿCᵣ`, identities, cases), dp-5 (probability applications). Goal: fill genuine
gaps in an already-seeded topic.

**Finding (headline).** The topic arrives **densely covered** — 12 pre-seeded skills already span
all five dot points in a coherent chain (`factorial-notation`, `multiplication-principle` →
`arrange-n-objects` → `permutations-nPr` → {`permutations-not-distinct`, `permutations-restrictions`,
`combinations-nCr`}, plus `circular-arrangements`, `combinations-identities`,
`combinations-restrictions`, `perm-comb-cases`, `probability-perm-comb`). The booklet exposes
**three genuine gaps**: an entire taught section with no skill at all (ordered selections **with
repetition**), one named solution method taught as its own principle (**complement**), and the
syllabus-mandated **combinatorial-argument** proof method, which is a different routine from
algebraic establishment. Plus **one edge**.

## 1. Recommended new skills

### `count-ordered-selections-repetition`

| field | value |
|---|---|
| id | `count-ordered-selections-repetition` |
| title | Count ordered selections with repetition |
| blurb | Count ordered selections when repetition is allowed, giving $n^{r}$ arrangements of $r$ items chosen from $n$ possibilities. |
| stage | 6 |
| courses | `s6-ext1-11` |
| dotPointIds | `dp-s6x1y11-combinatorics-1` |
| difficulty | 2 |
| prereqs | `multiplication-principle` |
| atom type | Routine (R) |

```json
{
  "id": "count-ordered-selections-repetition",
  "title": "Count ordered selections with repetition",
  "blurb": "Count ordered selections when repetition is allowed, giving $n^{r}$ arrangements of $r$ items chosen from $n$ possibilities.",
  "stage": 6,
  "courses": ["s6-ext1-11"],
  "dotPointIds": ["dp-s6x1y11-combinatorics-1"],
  "prereqs": ["multiplication-principle"],
  "difficulty": 2
}
```

**Trace.** Whole section **"Ordered Selections with Repetition"** — boxed "Fundamental Counting
Principle", boxed "The Box Method", boxed **"Ordered Selections with Repetition"**, Key Idea
*"You can arrange r items from n possibilities (reusing allowed) in …… ways"*, Examples (number
plate `26²×10⁴`; alternating even/odd `4³×5²`), Practice (`5²×21³`; `26⁵×10¹⁵`), Foundation Q1–15
(passwords, postcodes, binary strings `2¹⁰`, ice-cream `3⁵`, three-digit-no-leading-zero `9×10²`),
Development Q16–18 (PIN cases, Sydney landlines incl. Q18d two-case alternation). Recurs at
Permutations Foundation Q7b (`5⁴`) and Probability Foundation Q1, Q3 (`1/(26²×10⁵)`).

**Edge bar (`count-ordered-selections-repetition ← multiplication-principle`).** ① *Distinctive* —
the multiplication principle **is** the characteristic enabler; the skill is the decision that each
box refills to the same $n$, collapsing the product to a power. ② *At-risk* — the whole section's
error mode is mixing repetition with without-repetition (Foundation Q7a/b contrast `⁵P₄` against
`5⁴` deliberately). ③ *Stage-proximity* — prereq stage 5 ≤ skill stage 6. ④ *Non-redundant* —
nothing else reaches it; `arrange-n-objects` is the *without*-repetition sibling on the same parent,
so this completes a symmetric pair rather than duplicating one.

### `counting-complement-principle`

| field | value |
|---|---|
| id | `counting-complement-principle` |
| title | Count using the complement principle |
| blurb | Count arrangements described by "at least", "at most" or "not" by subtracting the unacceptable arrangements from the total. |
| stage | 6 |
| courses | `s6-ext1-11` |
| dotPointIds | `dp-s6x1y11-combinatorics-2` |
| difficulty | 3 |
| prereqs | `permutations-restrictions` |
| atom type | Category (Cat) + Routine (R) |

```json
{
  "id": "counting-complement-principle",
  "title": "Count using the complement principle",
  "blurb": "Count arrangements described by \"at least\", \"at most\" or \"not\" by subtracting the unacceptable arrangements from the total.",
  "stage": 6,
  "courses": ["s6-ext1-11"],
  "dotPointIds": ["dp-s6x1y11-combinatorics-2"],
  "prereqs": ["permutations-restrictions"],
  "difficulty": 3
}
```

**Trace.** Section "Permutations involving Grouping, Complements, and Cases" → boxed **"Complement
Principle"** (*"Words like 'at least' 'at most' 'not' 'excluding' indicate it is best solved by
considering the complementary situation"*, 3-step method), Examples (`7! − 6!2! = 3600`; committee
`9P3 − 3×2×7 = 462`), Practice (`8! − 7!2!`; relay `8P4 − 4×3×6×5`), Foundation Q5b (Jill's method,
set against Jack's cases method in Q5a), Practice "at least 3 students separating the teachers"
(`8!` minus three sub-cases), Probability Q13d (`1 − 8/429`), Exam Q2b and Q7b (both HSC Sample,
Band 4/5, *"at least 2 odd numbers together"* → total − none-together), Exam Q6 alternative
(`12C3 − 3C3 − 4C3 − 5C3`).

**Edge bar (`counting-complement-principle ← permutations-restrictions`).** ① *Distinctive* — the
unacceptable count is itself a restricted arrangement (near-universally a grouped "kept together"
unit), so restriction-counting is the characteristic enabler, not ambient arithmetic. ② *At-risk* —
the booklet deliberately contrasts Jack's cases against Jill's complement on the same question (Q5),
and the trigger-word recognition is an invisible atom students routinely miss. ③ *Stage-proximity* —
same stage 6. ④ *Non-redundant* — not reachable: `perm-comb-cases` is the *sibling alternative
method*, not an ancestor, and neither depends on the other.

### `combinatorial-argument-proof`

| field | value |
|---|---|
| id | `combinatorial-argument-proof` |
| title | Prove counting identities by combinatorial argument |
| blurb | Prove identities such as $^{n}C_{r}={}^{n}C_{n-r}$ and $^{n}C_{r}={}^{n-1}C_{r-1}+{}^{n-1}C_{r}$ by counting the same selection in two different ways. |
| stage | 6 |
| courses | `s6-ext1-11` |
| dotPointIds | `dp-s6x1y11-combinatorics-4` |
| difficulty | 3 |
| prereqs | `combinations-identities` |
| atom type | Routine (R) |

```json
{
  "id": "combinatorial-argument-proof",
  "title": "Prove counting identities by combinatorial argument",
  "blurb": "Prove identities such as $^{n}C_{r}={}^{n}C_{n-r}$ and $^{n}C_{r}={}^{n-1}C_{r-1}+{}^{n-1}C_{r}$ by counting the same selection in two different ways.",
  "stage": 6,
  "courses": ["s6-ext1-11"],
  "dotPointIds": ["dp-s6x1y11-combinatorics-4"],
  "prereqs": ["combinations-identities"],
  "difficulty": 3
}
```

**Trace.** Section **"Combination Proofs and Identities"** — every proof is presented as **Method 1:
Algebra** *and* **Method 2: Combinatorial Argument**, scaffolded separately: symmetry (choose $r$ to
include vs $n-r$ to exclude), Pascal's identity (case on whether Alice is picked), and
$^{n}C_{0}+\ldots+^{n}C_{n}=2^{n}$ — which the booklet states **cannot be done algebraically** at
this stage (*"We cannot prove this using algebra (yet) until we learn proof by induction"*), so the
combinatorial argument is the only available route. Also Permutations Mastery Q19 (*"Complete the
sentences to give a combinatorial argument for why $^{n}P_{n-1}=n!$"*). Syllabus dot point names it
explicitly: *"Prove $^{n}C_{r}={}^{n-1}C_{r-1}+{}^{n-1}C_{r}$ … algebraically **and using
combinatorial arguments**"*.

**Edge bar (`combinatorial-argument-proof ← combinations-identities`).** ① *Distinctive* — knowing
which identity is in play is the characteristic enabler; the argument then re-derives it by
double-counting. ② *At-risk* — constructing a double-count is the hardest thing in the section,
which is why the booklet scaffolds it with fill-in-the-blank prompts rather than examples.
③ *Stage-proximity* — same stage 6. ④ *Non-redundant* — a **lift-out** under the de-bundling rule:
`combinations-identities`' blurb mentions "establish and use", but no existing edge makes the
combinatorial method reachable, and the $2^{n}$ identity is provable no other way here.

## 2. Recommended new prereq edges

**`perm-comb-cases ← permutations-not-distinct`**

**Trace.** Example **"Count permutations with identical elements by considering cases"** (PRESSES,
6-letter words from 7 letters → 4 leave-one-out cases, each an $\frac{n!}{a!b!}$ count), Practice
PEPPER (3 cases), Probability Foundation Q7a–d (digits 3,4,5,5,6 → `4!/2!` per first-digit case),
Exam Q5 (2019 HSC, PARALLEL, grouping + repeated As), Exam Q9 (HSC Sample, COOKBOOK, `8!/4!2!` then
cases).

**Edge bar.** ① *Distinctive* — the whole difficulty of these questions is that each *case* is itself
a non-distinct arrangement; without the $\frac{n!}{a!b!}$ routine the case split produces nothing.
② *At-risk* — students who can split cases still routinely forget to divide by the repeats inside a
case (and vice versa). ③ *Stage-proximity* — same stage 6. ④ *Non-redundant* — `perm-comb-cases`
previously reached only `combinations-restrictions` and `permutations-restrictions`;
`permutations-not-distinct` sits on a parallel branch off `permutations-nPr` and was **not**
reachable.

## 3. Edits to existing skills

None. No re-scopes needed — the lift-out in §1 (`combinatorial-argument-proof`) leaves
`combinations-identities`' blurb accurate as the "establish and use" base.

## 4. Borderline candidates → EXCLUDE

- **`solve-equations-perm-comb`** (Proofs Foundation Q1: `¹⁰Cₙ = ¹⁰C₃`, `ⁿC₆+ⁿC₅ = ¹¹C₆`;
  Permutations Dev Q16 `⁸Pᵣ=336`; Mastery Q20 `7×²ⁿPₙ = 4×²ⁿ⁺¹Pₙ`) — EXCLUDE. Fails *distinctive*:
  each is "apply the identity you already know, then solve"; the identity recognition is
  `combinations-identities`, the solving is ambient algebra. Q16 is explicitly guess-and-check
  (*"there is no inverse operation for factorials"*).
- **Algebraic proofs of P/C identities** (Proofs Q2 `²ⁿPₙ₊₁ = 2n×²ⁿ⁻¹Pₙ`,
  Q3 `ⁿCₖ = ((n−k+1)/k)ⁿCₖ₋₁`; Permutations Q18, Q21) — EXCLUDE. Fails *non-redundant*: this is
  exactly the "establish" half of `combinations-identities`, executed with `factorial-notation`
  unrolling. Only the *combinatorial* half is a new routine (§1).
- **`gaps-method`** (Practice MISSISSIPPI "no two S's adjacent", `7!/(4!2!) × 8P4/4!`; Exam Q7b
  OEOEOE) — EXCLUDE as non-routine. Appears twice, both hint-scaffolded, and Exam Q7b is solvable by
  the complement principle instead. Revisit only if a future booklet teaches it as its own method.
- **`probability-perm-comb ← circular-arrangements`** (Interpret d `3!(5−1)!/(7−1)!`; Foundation Q8
  `8!×2/9!`) — EXCLUDE for consistency. The graph deliberately links `probability-perm-comb` to
  `combinations-nCr` only; linking the circular count but not `permutations-nPr` (redundant, already
  reachable) or the repetition count would make the fan-in arbitrary. The circular count is one of
  several interchangeable numerators, not the characteristic enabler.
- **Factorial "unrolling" as its own skill** (Interpret/Example boxes, Foundation Q1, Q4, Dev Q5–7) —
  EXCLUDE. `factorial-notation`'s blurb already covers "evaluate and simplify expressions involving
  factorials"; unrolling is that skill's method, not a separate atom.

## 5. Considered-and-omitted (already covered)

- Factorial notation, `0!=1`, recursive $n!=n(n-1)!$, calculator use (Factorial Notation §) →
  `factorial-notation`.
- Multiplication principle, outfits/menus (Ordered Selections with Repetition §, Foundation Q8–9) →
  `multiplication-principle`.
- $n!$ arrangements in a line, MATHS/GENIUS (Ordered Selections without Repetition §) →
  `arrange-n-objects`.
- $^{n}P_{r}$ notation, committees, `⁷P₄` (Permutations §, Foundation Q9–12) → `permutations-nPr`.
- Restrictions, fixed positions, "greater than 700" (Permutations with Restrictions §) →
  `permutations-restrictions`.
- **Grouping principle** (READING vowels together, `5!×3!`; Foundation Q1–4) →
  `permutations-restrictions` ("objects kept together or apart" — blurb already exact).
- ALLY/BANANA/WOOLLOOMOOLOO, $\frac{n!}{a!b!}$ (Permutations with Identical Elements §) →
  `permutations-not-distinct`.
- $(n-1)!$ circles, **and circular grouping** (Arrangements around a Circle §, incl. "involving
  Grouping" sub-box) → `circular-arrangements` ("with and without restrictions").
- $^{n}C_{r}$, committees, `¹³C₇×³⁹C₃` (Combinations §) → `combinations-nCr` /
  `combinations-restrictions`.
- Case-splitting (BBBGG/BBBBG; Exam Q4, Q6) → `perm-comb-cases`.
- Favourable/total probability, card and ball problems (Probability § Q9–14) →
  `probability-perm-comb`.
- Derivative-order questions `f⁽ⁿ⁾(x)` (Foundation Q3, Dev Q8–9) — cross-topic graft onto calculus;
  no intrinsic new atom (scope rule).
- Largest power of 2/5 dividing $10!$/$100!$ (Dev Q11–13) — number-theory one-offs, not routine
  (scope rule).
- Telescoping $\sum k \times k!$ (Dev Q10) — non-routine.

## Net change (applied)
**+3 new skills** (`count-ordered-selections-repetition`, `counting-complement-principle`,
`combinatorial-argument-proof`), **+1 new edge** (`perm-comb-cases ← permutations-not-distinct`),
**0 re-scopes**. Graph 1177 → 1180 skills.
