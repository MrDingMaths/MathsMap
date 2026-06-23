# Atomisation proposal — Algebraic Techniques 4: Factorise Expressions (Stage 4)

Source booklet: `booklets/Algebraic Techniques 4_Factorise Expressions.md`
(sub-booklets Factorising 1 / 2 / 3)
Target dot point: `dp-s4-alg-5` (topic `t-s4-alg`, MA4-ALG-C-01)
Rubric: `docs/atomisation-principles.md`

**Status: RESOLVED — 1 skill + 1 edge applied to `data/skills.json`.**
`factorise-negative-common-factor` was added and `factorise-common-factor` now
lists it as a prereq. `npm run validate` → 0 warnings.

---

## Existing graph (relevant Stage 4 factorising subgraph)

```
hcf-two-numbers ──────────┐
factors-of-algebraic-term ┴→ hcf-algebraic-terms ┐
                                                  ├→ factorise-common-factor → factorise-common-algebraic-factor (s5-path)
expand-brackets ──────────────────────────────────┘
```

- `factorise-common-factor` (dp-s4-alg-5, s4, diff 2) — *"Factorise expressions
  by extracting the highest common factor."* prereqs `[hcf-algebraic-terms,
  expand-brackets]`. The booklet's core routine already lands here.
- `hcf-algebraic-terms` already covers HCF of two algebraic terms **including
  powers** (e.g. HCF of $8x^2y$, $12x^5y$ is $4x^2y$).
- `multiply-divide-algebraic-terms` covers the divide-each-term / cancel step.
- `expand-brackets` is the "check by expanding" inverse, already linked.
- Downstream `factorise-common-algebraic-factor` (s5-path) blurb says *"incl.
  indices and negative coefficients"* — coarse mention only.

The entire standard routine (find HCF — numerical or algebraic, with powers —
divide each term, write inside brackets) is already covered. The booklet adds
**one** at-risk sub-step the coarse `factorise-common-factor` blurb silently
bundles: handling the **sign when the common factor is negative**.

---

## Recommended change — 1 new skill + 1 new edge

The recurring high-value pattern: a coarse skill (`factorise-common-factor`) whose
blurb nominally bundles a tricky, at-risk **sign** step. Lifting it out is
legitimate and non-redundant — the structural **twin** of
`distribute-negative-multiplier` (lifted out of `expand-brackets` in the AT3 pass).

### New skill: `factorise-negative-common-factor`
- **Title:** Factorise by taking out a negative common factor
- **Blurb:** Factorise when the leading term is negative by taking out a negative
  common factor and flipping the sign of every term inside the brackets, e.g.
  $-12xy-8yz-20xyz=-4y(3x+2z+5xz)$ and $-6+10p^{2}=-2(3-5p^{2})$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-alg-5"]` ·
  **difficulty:** 2
- **prereqs:** `[]` (the underlying ×/÷ sign rule is ambient integer arithmetic —
  not linked, per no-cross-topic; mirrors `distribute-negative-multiplier`)
- **Atom type:** Transformation / Category (decide to pull out a negative; flip
  each inside sign)
- **Booklet trace:**
  - Factorising 2 Q5 table: `-6+10p² = -2(3-5p²)`, `-6+12p² = 6(-1+2p²)`,
    `-6+11p²` can't factorise.
  - Factorising 3 Q14e (Mastery): `-12xy-8yz-20xyz = -4y(3x+2z+5xz)`.
- **Bar justification:** distinctive (the characteristic enabler is flipping every
  interior sign on extraction, not the plain HCF routine), at-risk (sign slips are
  the classic factorising error), same stage, non-redundant (the coarse blurbs of
  `factorise-common-factor` and the s5 `factorise-common-algebraic-factor` only
  mention sign; mention ≠ redundant).

### New edge: `factorise-common-factor ← factorise-negative-common-factor`
The negative-factor items sit inside the `factorise-common-factor` routine; the
sign-flip-on-extraction is its at-risk characteristic enabler. Same-stage,
non-redundant.

No new edge to `factorise-common-algebraic-factor` (s5-path): redundant by
transitive reachability (`factorise-common-algebraic-factor ←
factorise-common-factor ← factorise-negative-common-factor`).

Resulting subgraph:
```
hcf-algebraic-terms ──────────────┐
expand-brackets ──────────────────┤→ factorise-common-factor → factorise-common-algebraic-factor (s5p)
factorise-negative-common-factor ─┘
```

---

## Borderline candidates considered — EXCLUDED

- **`recognise-fully-factorised`** ("not fully factorised" / a common factor
  remains). Heavily emphasised — Factorising 2 example (`4a-12b=2(2a-6b)` is not
  fully factorised), Q6 Caroline (`3x²+2x` still has a common factor), Q18
  Rosie/Charlotte, Q15 complete-the-factorisation. EXCLUDE: the at-risk content is
  "take the **highest** common factor, not just any" — exactly what
  `hcf-algebraic-terms` already encodes; the rest ("check by expanding") is
  ambient verification. No new graph content.
- **`factorise-leaving-one`** (writing the `+1` when a term equals the HCF, e.g.
  `8a-12b+4=4(2a-3b+1)`, `x²+x=x(x+1)`, `xy(1+2x)`). A real beginner error.
  EXCLUDE: thin — it is just a quotient that happens to equal 1, and term division
  is already `multiply-divide-algebraic-terms`. A teaching warning, not a separable
  assessable atom.
- **`factorise-fraction-coefficient`** (Factorising 3 Q19–20, `x/2+y/2=½(x+y)`,
  common-denominator-first variants). EXCLUDE: the added skill over plain
  factorising is fraction arithmetic — cross-topic (Fractions), barred as a
  prereq; explicitly flagged "in senior years," beyond the Stage 4 routine.
  Structural twin of the AT3-EXCLUDED `expand-fractional-coefficient`.

---

## Considered and omitted (no schema change)

- **Factorise given the factor** (Factorising 1 §1, factor supplied → divide each
  term): scaffold = `factorise-common-factor` minus the HCF-finding; not a distinct
  assessable routine.
- **Multi-term (3+) factorising** (Fact 1 Q1m–o, Fact 3 Q7/Q14): same routine,
  more terms — covered by `factorise-common-factor`.
- **Factorising with powers / indices** (Fact 3 Q1e `x³-x²=x²(x-1)`, Q3, Q16):
  HCF-with-powers is in `hcf-algebraic-terms`; dividing powers is in
  `multiply-divide-algebraic-terms`. Index manipulation is cross-topic anyway.
- **Find numerical HCF / list term factors** (every Review section): already
  `hcf-two-numbers`, `factors-of-algebraic-term`, `hcf-algebraic-terms`.
- **Check by expanding** (Key Ideas, all three sub-booklets): ambient verification
  via the existing `expand-brackets` inverse link.
- **Area / perimeter / Smarties / word contexts** (Fact 2 Q4–6, Fact 3 Q9–13):
  cross-topic measurement / word-problem grafts.
- **"Find k / find m" coefficient comparison** (Fact 3 Q21–22): non-routine; grafts
  equation-solving / identities — cross-topic.

---

## Net change summary

- **New skills:** 1 — `factorise-negative-common-factor`.
- **New edges:** 1 — `factorise-common-factor ← factorise-negative-common-factor`.
- Attaches to existing dot point `dp-s4-alg-5`. No new dot points.

**STOP for review** before applying to `data/skills.json`.
