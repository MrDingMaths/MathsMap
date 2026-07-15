# Atomisation proposal — Equations B (Path), Stage 5

Source booklets:
- `booklets/Stage 5 Path/Equations B_1 Solve monic quadratic equations.md`
- `booklets/Stage 5 Path/Equations B_2 Solve cubic equations.md`
- `booklets/Stage 5 Path/Equations B_3 Solve linear inequalities and graph their solutions on a number line.md`

Target topic: `t-s5p-equ-b`, dot points `dp-s5p-equ-b-1`–`dp-s5p-equ-b-3`
Rubric: `docs/atomisation-principles.md`

**Status: APPLIED — 1 new skill · 1 new edge · 0 re-scopes.**

---

## Context

Check the three dot points are correctly atomised. B_1 = solve monic quadratic
equations using factors. B_2 = solve cubic equations $ax^{3}=k$. B_3 = solve
linear inequalities and graph solutions on a number line.

## Finding

dp-2 and dp-3 fully covered (`solve-cubic-axcubed`;
`represent-inequalities-number-line` + `solve-linear-inequalities`). dp-1 had
one genuine gap: the binomial quadratic $ax^{2}+bx=0$ base case. B_1 teaches an
ordered progression — null factor law → binomial (common factor) → trinomial
(PSF) — but the graph only had the trinomial endpoint
(`solve-monic-quadratic-factors`).

## 1. New skill

**`solve-quadratic-common-factor`**

| Field | Value |
|---|---|
| id | `solve-quadratic-common-factor` |
| title | Solve quadratic equations of the form $ax^{2}+bx=0$ |
| blurb | Rearrange to $ax^{2}+bx=0$, factorise out the common factor and use the null factor law, recognising $x=0$ as one solution. |
| stage / courses | 5 / `s5-path` |
| dotPointIds | `dp-s5p-equ-b-1` |
| difficulty | 1 (base case; trinomial sibling is 2) |
| prereqs | `factorise-common-algebraic-factor` |
| atom type | Routine (bundles the null-factor-law Fact) |

**Booklet trace.** B_1 dedicated section "Solving Quadratic Binomial
Equations": worked examples $y^{2}-7y=0$, $x^{2}=36x$; Foundation Q2–3 (incl.
negative HCF $-8x^{2}-16x=0$); Development Q4 (rearrange $3x^{2}=-9x$);
Mastery Q7–8 (generalise $x(ax+b)=0$, "why is $x=0$ always a solution"). CYU
set "Solving monic quadratic binomials" Q1–3 targets the divide-by-$x$
misconception ($x^{2}+4x=0$: "Tom says $x=2$").

**Edge bar.** (1) Distinctive — first exercise of the null factor law;
factor-out-$x$ + keep-the-$x=0$-solution is a different routine from PSF
trinomials. (2) At-risk — dividing both sides by $x$ and losing $x=0$ is the
classic error, tested explicitly in CYU. (3) Same stage. (4) Non-redundant —
no existing node; `solve-quadratic-ax2` is the no-$bx$ case,
`factorise-common-algebraic-factor` is expression-level only.

## 2. New edge

**`solve-monic-quadratic-factors` ← `solve-quadratic-common-factor`** —
progression-chain placement (rubric de-bundling rule, `solve-linear-2-step`
precedent): booklet teaches binomial base before trinomial; null-factor-law
fluency and rearrange-to-zero enter the trinomial routine through it.
Distinctive, at-risk, same stage, not previously reachable (trinomial's only
prereq was `factorise-monic-quadratic`).

## 3. Edits to existing skills

None. `solve-monic-quadratic-factors` blurb ("Solve $x^{2}+bx+c=0$ using
factorisation") already reads as the trinomial case — no re-scope needed.

## 4. Borderline candidates — EXCLUDE

- **Split `solve-linear-inequalities` into positive-coefficient /
  negative-flip** (B_3 Parts 1 & 2; structural twin of
  `solve-equation-negative-coefficient`). EXCLUDE: the flip is already the
  *named core* of the existing blurb; a positive-coefficient base skill would
  be just `solve-linear-3-step` + `represent-inequalities-number-line` with
  the symbol carried — no distinct atom left.
- **Null factor law as its own Fact node** — bundled in the new binomial
  skill; trinomial reaches it via the new edge.
- **Fraction equations reducing to quadratics** (B_1 Mastery Q9, Q11d–o, incl.
  binomial denominators $\frac{x}{x-2}-\frac{x+1}{x+4}=1$) — beyond dp scope
  ("limited to $a=1$, using factors"); mastery wrappers pointing at
  `dp-s5p-equ-c` territory.
- **Compound-inequality solving** $-5<2x+1<5$ — single CYU multiple-choice
  item, not a taught routine; representing compounds already in
  `represent-inequalities-number-line`.

## 5. Considered and omitted (no schema change)

- $x^{2}=c$ isolate-and-root (B_1 Q5–6) — `solve-quadratic-ax2` (s4).
  Perfect-square "one solution only" and common-factor-first
  $2x^{2}-2x-12=0$ — bundled in `factorise-monic-quadratic` (Alg Tech B
  precedent).
- All of B_2 — `solve-cubic-axcubed` covers exact/decimal, fractional
  coefficients, multi-step isolation, volume applications; negative cube
  roots bundled in `square-cube-roots`.
- B_3 swap-sides flip ($12\ge x \to x\le 12$), words→inequality ("no more
  than 24"), intersecting two sign conditions (Dev Q5c–d),
  infinite-solutions reasoning — sub-steps/ambient/non-routine within
  `solve-linear-inequalities`.
- Word-problem instances (B_1 Q7 number puzzles, B_3 Q7–9, 15–16
  perimeter/budget/ratio) — modelling wrappers, no new atom.

---

**Net change:** 1 new skill · 1 new edge · 0 re-scopes.
