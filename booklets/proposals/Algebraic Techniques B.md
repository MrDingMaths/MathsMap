# Atomisation proposal — Algebraic Techniques B (Path), Stage 5

Source booklets:
- `booklets/Stage 5 Path/Algebraic Techniques B_1 Apply the 4 operations involving algebraic fractions with pronumerals in the denominator.md`
- `booklets/Stage 5 Path/Algebraic Techniques B_2 Factorise algebraic expressions by taking out a common algebraic factor.md`
- `booklets/Stage 5 Path/Algebraic Techniques B_3 Expand binomial products and factorise monic quadratic expressions.md`

Target topic: `t-s5p-alg-b`, dot points `dp-s5p-alg-b-1`–`dp-s5p-alg-b-3`
Rubric: `docs/atomisation-principles.md`

**Status: APPLIED (nil) — 0 new skills · 0 edges · 0 re-scopes.**
`data/skills.json` unchanged. Audited so future passes don't re-derive.

---

## Context

Check the three dot points are correctly atomised. B_1 = 4 operations on
algebraic fractions with pronumeral denominators / indices. B_2 = factorise by
common (esp. negative) algebraic factor. B_3 = expand binomial products +
factorise monic quadratics + problems.

## Finding

Densest algebra subgraph in the file — 6 skills across the 3 dot points, plus
reachable Stage-4 feeders. Every routine traces to an existing skill; the one
plausible gap (algebraic-LCM) is a deliberate borderline exclude.

## Coverage map

| Booklet routine | Existing skill |
|---|---|
| B_1 equivalent algebraic fractions; simplify with indices (`10a⁵/5a²`) | `simplify-algebraic-fractions-indices` |
| B_1 add/subtract/×/÷ with pronumeral denominators (`2/5 + 3/a²`, `3a/8 ÷ b/5`) | `operate-algebraic-fractions-denominator` |
| B_2 factorise negative HCF (`−8x−16 = −8(x+2)`), multi-term, two-ways | `factorise-common-algebraic-factor` — negative-HCF dependency already transitive via `factorise-common-factor ← factorise-negative-common-factor` (s4) |
| B_3 expand binomial products, incl. `k(ax+b)(cx+d)`, area/frame contexts | `expand-binomial-products` |
| B_3 factorise monic quadratics PSF, incl. common-factor-first `2(x+4)(x+1)`, `−(y−5)(y+3)` | `factorise-monic-quadratic` (already prereq's `factorise-common-algebraic-factor`) |
| B_3 area/frame/Pythagoras application problems | `expansion-factorisation-problems` |

## Borderline candidates — EXCLUDE

- **`lcm-algebraic-terms`** (B_1 Review Q6 "determine LCM" of `2x & 3x²`, `2 & a²`;
  worked example "why *didn't* we make it 15x²?"). Genuine invisible atom and the
  structural twin of the existing `hcf-algebraic-terms` node — not reachable
  (numeric `lcm-two-numbers` ≠ algebraic LCM). But `operate-algebraic-fractions-denominator`
  (difficulty 3) bundles it cleanly, and a Stage-5-Path student at that skill is
  unlikely to be shaky on *algebraic* LCM specifically rather than the whole
  routine. Lean call: exclude, flag for a future pass if algebraic-LCM is wanted
  tracked.
- **Perfect-square factors** (`x²−12x+36=(x−6)²`, `x²+10x+25=(x+5)²`) — same PSF
  routine, equal factor pair; no special method taught. Difference-of-squares /
  `special-products` lives in dp-c-2.
- **Binomial × trinomial / triple products** (B_3 Q10 `(x+1)(x²+x+1)`,
  `(x+1)(x+2)(x+3)`) — same distributive routine with more terms; beyond "binomial
  products" but not a distinct skill.
- **"two integers, product P sum S"** (B_3 Review Q2–3) — ambient number sense; the
  invisible atom inside `factorise-monic-quadratic`, too elementary to node.

## Considered and omitted (no schema change)

- B_1 order-of-operations chains of ×/÷ fractions (Q4 l–q, `… ÷ (… × …)`) — same
  operate skill, bracket-precedence is ambient.
- B_1 reciprocal/word problems (blueberry-picker HSC sample) — application of the
  operate skill; non-routine wrapper.
- B_3 "find a, b such that expansion = …" and missing-term puzzles — reverse
  wrappers around `expand-binomial-products` / `factorise-monic-quadratic`.

---

**Net change:** 0 new skills · 0 edges · 0 re-scopes → nil.
