# Proposal — Further Trigonometry (Stage 6 Ext 1, row 80)

**Status: APPLIED** (2026-07-17). `npm run validate` clean — 1177 skills, 0 warnings.
+1 new skill, +3 dot-point/course attachments. t-formulae parked (off-2024-syllabus, pending user syllabus confirmation).

**Context.** Booklets: `Stage 6 Extension 1/Further Trigonometry 1_Trigonometry in three dimensions.md`,
`Stage 6 Extension 1/Further Trigonometry 3_Further trigonometric equations.md`. Topic `t-s6x1y11-trig`,
dp-1 (3D trig), dp-2 (sum/diff/double-angle identities), dp-3 (further equations: identities + auxiliary angle).
Goal: refine the already-wired Ext1 topic at the margin.

**Finding (headline).** Topic arrives **near-saturated**: 7 pre-seeded skills span all three dot points
(`interpret-3d-trig-context`, `solve-3d-trig`; `sum-difference-identities`, `double-angle-identities`;
`solve-trig-equations-identities`, `auxiliary-angle-form`, `solve-auxiliary-angle-equations`), plus the full
Advanced trig-identity cluster (`solve-trig-quadratic-form`, `solve-trig-equations-compound-angle`,
`prove-trig-identities`, `pythagorean-identities`, …) reachable to Ext1 students. Booklet 1 fully covered.
Booklet 3 exposes **one genuine graph gap** (homogeneous equations) and **three dp-1 attachments** completing
the seed's dual-tag pattern. The QUEUE-flagged "dp-2 has no source booklet" is a *teaching*-material gap only —
the dp-2 identity skills exist and are exercised throughout booklet 3's review.

## 1. Recommended new skills

### `solve-homogeneous-trig-equations`

| field | value |
|---|---|
| id | `solve-homogeneous-trig-equations` |
| title | Solve homogeneous trigonometric equations |
| blurb | Solve homogeneous trigonometric equations by dividing through by a power of $\cos x$ to reduce to a polynomial in $\tan x$, testing $\cos x = 0$ separately. |
| stage | 6 |
| courses | `s6-ext1-11` |
| dotPointIds | `dp-s6x1y11-trig-3` |
| difficulty | 3 |
| prereqs | `solve-trig-quadratic-form` |
| atom type | Routine (R) |

```json
{
  "id": "solve-homogeneous-trig-equations",
  "title": "Solve homogeneous trigonometric equations",
  "blurb": "Solve homogeneous trigonometric equations by dividing through by a power of $\\cos x$ to reduce to a polynomial in $\\tan x$, testing $\\cos x = 0$ separately.",
  "stage": 6,
  "courses": ["s6-ext1-11"],
  "dotPointIds": ["dp-s6x1y11-trig-3"],
  "prereqs": ["solve-trig-quadratic-form"],
  "difficulty": 3
}
```

**Trace.** Booklet 3, "Solving Trigonometric Equations by using Identities" → boxed **"Identify homogeneous
trigonometric equations"** + **"Strategies for Solving Homogeneous Equations"** (divide by power of $\cos x$;
always check $x=\tfrac{\pi}{2},\tfrac{3\pi}{2}$), worked Example $\sin^2x-\sin x\cos x=0$, Guided Practice a–d
($\sqrt3\sin x=\cos x$; $\sin x\cos x-\sqrt3\cos^2x=0$; $\sin x\cos x+\cos^2x=0$; $\sin^2x+\sin2x-\cos^2x=0$),
Development Q7h.

**Edge bar (`solve-homogeneous-trig-equations ← solve-trig-quadratic-form`).** ① *Distinctive* — dividing by
$\cos^n x$ yields a polynomial in a single ratio ($\tan$), whose factor-and-solve is the quadratic-form routine.
② *At-risk* — an Ext1 student can be shaky on solving/rejecting roots of a trig quadratic. ③ *Stage-proximity* —
same stage 6. ④ *Non-redundant* — not otherwise reachable; recognising homogeneity + the $\cos x=0$ check are new,
not a general identity substitution (`solve-trig-equations-identities` is a different method).

## 2. Recommended new prereq edges

None beyond the new skill's own edge (above).

## 3. Edits to existing skills — dp-1 dot-point/course attachments

Booklet 1 teaches three Stage-5-Path routines **in full** as standalone sections (each Example +
Foundation/Development/Mastery). The seed dual-tagged `interpret-3d-trig-context` (s5-path + s6-ext1-11) and made
`solve-3d-trig` Ext1, but left these three building blocks s5-path-only. Complete the pattern (mirrors the
**row-79 Polynomials** fix). Course + dot point added only; no blurb/stage/prereq changes.

| skill | add course | add dotPoint | booklet trace |
|---|---|---|---|
| `pythagoras-3d` | `s6-ext1-11` | `dp-s6x1y11-trig-1` | Bk1 §"Pythagoras' Theorem in 3D", Foundation Q1–3 |
| `space-diagonal-3d` | `s6-ext1-11` | `dp-s6x1y11-trig-1` | Bk1 §"Pythagoras' Theorem in 3D", Example (EB→BH), Dev Q4–5, Mastery Q7,10 |
| `trigonometry-3d` | `s6-ext1-11` | `dp-s6x1y11-trig-1` | Bk1 §"Trigonometry in 3D" + §"Problems Involving 3D Trigonometry" |

## 4. Borderline candidates → EXCLUDE

- **`solve-trig-equations-t-formulae`** (t = tan(x/2) substitution) — **EXCLUDE from Ext1 — confirmed Extension 2
  content (user, 2026-07-17).** Large dedicated booklet section, but t-formulae moved to X2 in the 2024 rewrite;
  NSW Education's official 2024 "Further trigonometry" teaching sequence lists no t-formulae lesson, and dp-2/dp-3
  name only sum/diff/double-angle + auxiliary. Legacy Ext1 booklet retains it (incl. a 2023-HSC-era question
  solvable by auxiliary angle). **Do not add to this Ext1 topic.** The candidate belongs in a future Extension 2
  further-trigonometry pass (`solve-trig-equations-t-formulae`, ← `solve-trig-quadratic-form`, diff 3).
- **Squaring both sides** — EXCLUDE. Fails *distinctive*: squaring + checking extraneous roots is general algebra,
  and the booklet itself notes "there is *usually* a better method." Shown only as an alternative alongside
  identity/auxiliary methods (Q4, Q7).
- **Auxiliary-angle modelling / max-min / graphing** (harbour depth, current, tides Q20/exam Q4–5; sketch Q19) —
  EXCLUDE. Once in $R\sin(x+\alpha)$ form, max $=R$ and the phase shift are elementary; folds into
  `solve-auxiliary-angle-equations` + existing trig-graphing skills.
- **Triple-angle / product-to-sum "show that… hence solve"** (Q10–11, exam Q9–10) — EXCLUDE. Prove step =
  `prove-trig-identities` (exists); solve step = existing solve skills; cross-topic graft, no new intrinsic routine.
- **3D non-right-triangle (sine/cosine rule)** — not exercised: booklet 1 decomposes to right triangles
  throughout, so `non-right-triangle-problems` stays s5-path-only (not dual-tagged).

## 5. Considered-and-omitted (already covered)

- Basic exact-value solving $\sin x=\tfrac12$ etc (Review Q5) → `solve-trig-equations-restricted`.
- Solving quadratic-in-one-ratio (Review Q13, Guided Q's) → `solve-trig-quadratic-form`.
- Compound-angle-argument equations, e.g. $\cos(4\theta-\theta)=\tfrac12$ (Dev Q5) → `solve-trig-equations-compound-angle`.
- Simplify/rewrite via Pythagorean & double-angle (Review Q2–4, Q10) → `simplify-trig-expressions`,
  `double-angle-identities`.
- Factorising trig expressions (Review Q6) → ambient factorisation.
- Sum-to-product / product-to-sum manipulation (exam Q9) → reachable via identity skills; not a 2024 dot-point
  routine on its own.

## Net change (applied)
**+1 new skill** (`solve-homogeneous-trig-equations`), **+0 standalone edges**,
**+3 dot-point/course attachments** (`pythagoras-3d`, `space-diagonal-3d`, `trigonometry-3d` → +dp-s6x1y11-trig-1,
+s6-ext1-11). t-formulae parked pending user's syllabus call.
