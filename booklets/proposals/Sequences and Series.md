# Proposal — Atomise Sequences and Series (Books 1–3) — **APPLIED**

Applied to `data/skills.json`: +1 skill (`solve-arithmetic-series-n`), +1 edge.
Skill 2 (`recurring-decimal-limiting-sum`) **rejected by user**. `npm run validate` clean.

## Context

Row 72, topic `t-s6adv12-sequences` (Stage 6 Advanced Y12), dot points
`dp-s6adv12-sequences-1`–`6`. Three NEW booklets (Sequences & Series 1/2/3), no
OLD counterpart. Goal: refine the **seed-only** coverage (11 skills, one chain per
dp, never atomised) into genuinely missing skills/edges.

## Finding (headline)

Topic well seeded and mostly saturated. The 11 seed skills map cleanly onto nearly
every routine: write/identify terms (`sequence-notation`), partial sums
(`partial-sum-notation`), sigma (`sigma-notation`), AP/GP nth-term
(`arithmetic/geometric-sequence-nth-term`), series sums
(`arithmetic/geometric-series-sum`), limiting sum (`limiting-sum-gp`), growth/decay
models (`arithmetic/geometric-growth-decay`). Two distinctive routines flagged; one
approved.

---

## 1. Recommended new skills

### A. `solve-arithmetic-series-n` — "Find the number of terms of an arithmetic series" — **APPLIED**

| Field | Value |
|---|---|
| **id** | `solve-arithmetic-series-n` |
| **title** | Find the number of terms of an arithmetic series |
| **blurb** | Form and solve a quadratic in $n$ from $S_n=\dfrac{n}{2}[2a+(n-1)d]$ to find the number of terms, rejecting non-positive or non-integer solutions. |
| **stage** | 6 |
| **courses** | `["s6-adv12"]` |
| **dotPointIds** | `["dp-s6adv12-sequences-2"]` |
| **difficulty** | 3 |
| **prereqs** | `["arithmetic-series-sum"]` |
| **atom type** | Routine (R) — reverse solve, quadratic |

```json
{ "id": "solve-arithmetic-series-n", "title": "Find the number of terms of an arithmetic series", "blurb": "Form and solve a quadratic in $n$ from $S_n=\\dfrac{n}{2}[2a+(n-1)d]$ to find the number of terms, rejecting non-positive or non-integer solutions.", "stage": 6, "courses": ["s6-adv12"], "dotPointIds": ["dp-s6adv12-sequences-2"], "prereqs": ["arithmetic-series-sum"], "difficulty": 3 },
```

**Booklet trace (heavily represented):** Book 2 — Example "least value of n for
which S_n is negative" (line 990); Example "value of n for which S_n=618" / "how
many terms give 531" (1014–1020); Q10 (S_n = 0 / negative / 220 / −144 / >156, lines
1405–1495); Q11 four parts (1497–1548); Q13 stacked-logs (1584). Book 3 mixed Q48
(2521), exam Q26c/Q27 (3728, 3760).

**Bar justification (all four hold):**
1. *Distinctive* — S_n is **quadratic in n**; forming and solving that quadratic
   (then rejecting the invalid root) is the characteristic enabler, not the forward
   substitution `arithmetic-series-sum` records.
2. *At-risk* — students routinely fail to form the quadratic, or keep a
   negative/non-integer root.
3. *Stage-proximity* — same stage (6) as prereq.
4. *Non-redundant* — `arithmetic-series-sum` blurb is forward only ("to find the
   partial sum"). No skill solves for n. (The GP analogue needs logs = cross-topic,
   so no parallel skill; this AP one is self-contained within the topic.)

### B. `recurring-decimal-limiting-sum` — **REJECTED by user**

Proposed: convert recurring decimals to fractions via the limiting sum of a GP
(dp-5, ← `limiting-sum-gp`, diff 3). Trace: Book 3 Q46 four-part worked block
(2460–2491) + exam "0.323232…" (3230). Distinct method/stage/course from the
existing Stage-5 Path `recurring-decimal-to-fraction` (calculator-based). **User
rejected** — the recurring-decimal→fraction conversion stays a single Stage-5 skill;
the limiting-sum method is treated as a bundled application of `limiting-sum-gp`, not
its own node. Do not re-propose.

## 2. Recommended new prereq edges

- `solve-arithmetic-series-n ← arithmetic-series-sum` (internal to the new skill).

No new edges between existing skills warranted.

## 3. Edits to existing skills

**None.** `arithmetic-series-sum` blurb is already forward-only, so the new
downstream skill needs no re-scope.

## 4. Borderline candidates → EXCLUDE

- **Limiting-sum convergence test (`|r|<1` decision)** — Book 3 "Identify whether a
  series has a limiting sum" + Q4. Bundled in `limiting-sum-gp` (blurb already states
  the `|r|<1` condition); the plain ✔/✖ is near-ambient.
- **Find range of x for GP convergence** (Q29/Q30, `|2x|<1`, line 3811) — distinctive
  but **non-routine Band-5** exam extension; scope rule = routine only.
- **Find a,r from two GP terms (÷, ± even root)** — bundled in
  `geometric-sequence-nth-term`; the ± subtlety alone is too thin for a node. (AP
  analogue: subtract → bundled in `arithmetic-sequence-nth-term`.)
- **"Is X a term / first n exceeding" for a GP** — uses logs to solve `ar^{n-1}=k`;
  log-solving is **cross-topic**, so neither a new skill nor a
  `solve-exponential-equations` prereq (no-cross-topic rule).
- **Log-term APs** (Book 2 Q19, dev Q8) — logarithm laws grafted on; cross-topic.
- **Prove `(x−1)(xⁿ⁻¹+…+1)=xⁿ−1` / derive S_n** — proof/derivation, non-routine.
- **`recurring-decimal-limiting-sum`** — see §1B (user-rejected).

## 5. Considered-and-omitted (ambient / already covered)

- Write terms / next terms from a rule; recursive (term-to-term) rules →
  `sequence-notation`.
- Evaluate S_n by direct addition → `partial-sum-notation`.
- Interpret **and** write sums in sigma notation → `sigma-notation`.
- Identify AP/GP, find nth-term formula, count terms of a finite AP/GP via `a_n` →
  the two `*-sequence-nth-term` skills.
- `a_n` as linear/exponential function of n (graph connection) → conceptual, bundled.
- Compound interest, depreciation, salary, bouncing-ball, mailbox/widget "eventually"
  models → `geometric-growth-decay` / `arithmetic-growth-decay` / `limiting-sum-gp`.

## Net change (applied)

- **+1 skill:** `solve-arithmetic-series-n` (dp-2).
- **+1 edge:** internal to the new skill.
- **0 re-scopes.**
