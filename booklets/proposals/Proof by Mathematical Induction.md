# Proof by Mathematical Induction — atomisation proposal

**Status: APPLIED (nil result) — 2026-07-17. No change to `data/skills.json`.**

## Context

Booklet: `Stage 6 Extension 1/Proof by Mathematical Induction.md` (2423 lines).
Target topic `t-s6x1y12-induction`, dot point `dp-s6x1y12-induction-1`:
*"Proof by mathematical induction: Examine the structure of inductive proof and
prove results for sums and divisibility, identifying errors in false proofs."*

## Finding

Dot point is **fully saturated** on arrival. The graph shipped pre-atomised, with
four skills that map one-to-one onto the dot-point text — no taught routine in the
booklet falls outside them:

| skill | stage | diff | prereqs | booklet trace |
|---|---|---|---|---|
| `induction-structure` | 6 | 2 | — | Syllabus + intro, base–hypothesis–step framing (L26–210) |
| `induction-sums` | 6 | 2 | `induction-structure`, `sigma-notation` | Proofs of Sums: Example/Practice/Mastery (L213–1229); Exam Q2, Q4, Q7 |
| `induction-divisibility` | 6 | 3 | `induction-structure` | Proofs of Divisibility: Example/Practice/Mastery (L1248–1811); Exam Q1, Q3, Q5, Q6, Q8, Q9, Q10 |
| `induction-false-proofs` | 6 | 2 | `induction-sums` | false-proof framing (one-of-two-steps-only cases) |

**No new skills, no new edges, no re-scopes.**

## Borderline candidates → EXCLUDE

- **Base case n=0 / n=2 variants** — Exam Q8 (n≥0), Mastery L1085 (n≥2), even-only
  n=2k step (L1777). Same routine, different starting value; ambient variation
  inside `induction-sums` / `induction-divisibility`, not a distinct atom.
- **`f(k+1) − f(k)` divisibility technique** — Exam Q9. Alternate manipulation of
  the same skill `induction-divisibility`.
- **Alternating / geometric-form sums** — Mastery L1161 (`−4+8−16…`), L1085
  (`9+27+…`). Still `induction-sums`.

## Considered-and-omitted

- **Trig-identity induction** — Exam Q11 (`sinθ + sin3θ + … = sin²(nθ)/sinθ`).
  Grafts product-to-sum identities; cross-topic prerequisite, excluded per the
  rubric's scope rule (prerequisites limited to skills intrinsic to the induction
  routine itself).
- **Inequality induction** — not present in the booklet (confirmed: no
  `prove … > …` / `< …` question anywhere). This is Extension 2 content and is
  correctly absent.
- **Strong / two-hypothesis induction, first-order recurrence induction** — not
  present.

## Net change: none

0 new skills, 0 new edges, 0 re-scopes. Booklet audited; dot point confirmed
saturated by the four existing induction skills. `npm run validate` not required
(no graph edit).
