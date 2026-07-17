---
status: applied
---

# Proposal — Atomise Algebraic Relationships (Stage 6 Standard Y12, topic `t-s6st12-algebraic`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (+1 skill, +3 re-scopes); `npm run validate` clean. QUEUE.md row 54 → applied.

## Context

Queue row 54. Four booklets: `Stage 6 Standard/Algebraic Relationships 1_Simultaneous linear equations.md` (dp-1, dp-2), `2_Exponential relationships.md` (dp-3), `3_Quadratic relationships.md` (dp-4, dp-5), `4_Reciprocal relationships.md` (dp-6). MST-12-S2-01.

## Finding (headline)

Topic near-saturated — 13 skills already sit on the 6 dot points and map section-for-section onto booklets 1–3. One genuine gap in booklet 4: the **graphical-interpretation half of reciprocal models** (dp-6 syllabus lines "solve inverse variation problems *graphically*" + "explain the limitations of reciprocal models") had no node, while its structural twins `interpret-exponential-model` (dp-3) and `interpret-quadratic-model` (dp-5) both exist. Plus two deferred items from prior passes that this booklet settles: the `variation-from-table` Standard-Y12 tag (explicitly left for row 54 by the Variation A pass §5) and the `graph-inverse-variation` blurb enrichment (deferred, not rejected, in Variation A §3).

| Booklet section | dp | Skill / gap |
|---|---|---|
| B1 Review of Linear Relationships, Linear Modelling, Constructing Linear Models | (Y11 review) | `slope-intercept-interpret`, `equation-from-gradient-intercept`, `graph-using-gradient-intercept`, `equation-from-graph`, `linear-real-life`, `interpret-linear-model` — all already tagged to `dp-s6st11-linear-1/-2`; review chapters, no Y12 tag needed |
| B1 Simultaneous graphically Pt 1–2 | dp-1 | `simultaneous-equations-graphically` ✓ |
| B1 Substitution Method | dp-1 | `simultaneous-equations-algebraically` ✓ |
| B1 Applications | dp-1 | `simultaneous-word-problems` ✓ |
| B1 Break-even Analysis | dp-2 | `break-even-analysis` ✓ |
| B2 Exponential curve + properties + transformations | dp-3 | `graph-exponential-features` ✓ (minor blurb edit, §3c) |
| B2 Exponential Modelling | dp-3 | `exponential-growth-decay-model`, `interpret-exponential-model` ✓ |
| B3 Quadratic graphs + The Parabola | dp-4 | `graph-quadratic-features`, `quadratic-intercepts-vertex` ✓ |
| B3 Quadratic Modelling | dp-5 | `interpret-quadratic-model` ✓ |
| B4 Hyperbola, D/I variation language | dp-6 | `describe-inverse-variation`, `graph-inverse-variation` ✓ (blurb edit, §3b) |
| B4 Deciding if Inverse Variation Exists (xy=k table test) | dp-6 | `variation-from-table` — missing Standard-Y12 tag (§3a) |
| B4 Modelling Inverse Variation using Equations | dp-6 | `solve-variation-equation` ✓ |
| B4 Analysing Inverse Variation using Graphs | dp-6 | **GAP → new skill §1.1** |

## 1. New skills (applied)

### 1.1 `interpret-reciprocal-model` — APPROVED, APPLIED

| field | value |
|---|---|
| id | `interpret-reciprocal-model` |
| title | Interpret a reciprocal model |
| blurb | Read values from the graph of a reciprocal model $y = k/x$, interpret the constant $k$ in context and explain the model's limitations. |
| stage | 6 |
| courses | `["s6-std12"]` |
| dotPointIds | `["dp-s6st12-algebraic-6"]` |
| difficulty | 2 |
| prereqs | `["graph-inverse-variation"]` |
| atom type | Routine (R) |

```json
{ "id": "interpret-reciprocal-model", "title": "Interpret a reciprocal model", "blurb": "Read values from the graph of a reciprocal model $y = k/x$, interpret the constant $k$ in context and explain the model's limitations.", "stage": 6, "courses": ["s6-std12"], "dotPointIds": ["dp-s6st12-algebraic-6"], "prereqs": ["graph-inverse-variation"], "difficulty": 2 }
```

**Trace:** B4 §Analysing Inverse Variation using Graphs — a full dedicated section: worked example ($s = 400/t$: read speed for 5 h off graph, read time for 95 km/h, "Why is it impossible for $t = 0$? … $s = 0$?", "Why did we not consider the other half of the hyperbola?"), two guided examples ($C = 720/n$ incl. "can $n$ be a fraction?"; $s = 360/t$ "what does the 360 represent?"), Foundation Q1–4 (road trip, yacht, hole-digging, concert — each with graph-reading both directions + an impossibility/limitation part), Development Q5–6 (parallelogram $xy=16$, Boyle's law — read graph, write $xy=k$), Q7–8 (sketch the model), Mastery 2018/2019/2022 HSC items (find equation *from* the contextual graph/point, plot the curve). Also B4 syllabus lines 5–6 verbatim.

**Edge bar:** **Distinctive** — reading a contextual hyperbola in both directions and arguing its limitations ($x=0$/$y=0$ impossible, discrete $n$, one branch only) is the characteristic enabler of this section and is not the find-$k$-algebraically routine. **At-risk** — the limitation questions (undefined at zero, "why only one branch") are exactly where students fail. **Stage-proximity** — prereq is Stage 5, one below; fine. **Non-redundant** — `solve-variation-equation` (algebraic) and `graph-inverse-variation` (identify shape) are siblings, not a path to this; no existing blurb mentions graphical solving or limitations of reciprocal models.

**Consistency:** structural twin of `interpret-exponential-model` (dp-3) and `interpret-quadratic-model` (dp-5) — every other relationship type in this topic already has an interpret-the-model node.

**Nearest dot point:** `dp-s6st12-algebraic-6` — the only reciprocal dot point. **Difficulty:** 2, matching both twins.

## 2. New prereq edges

None beyond the new skill's own prereq. (`interpret-reciprocal-model ← solve-variation-equation` considered and dropped — the graphical and algebraic routines are parallel entry points, mirroring Variation A §2's reasoning; the booklet's graph-reading needs no find-$k$ step.)

## 3. Edits to existing skills (applied)

**a. `variation-from-table` — tag re-scope (completing the deferral from rows 28/47).**
- courses: `["s5-path", "s6-std11"]` → `["s5-path", "s6-std11", "s6-std12"]`
- dotPointIds: + `dp-s6st12-algebraic-6`
- Trace: B4 §Deciding if an Inverse Variation Relationship Exists — the $xy=k$ constant-product box, worked example ($st = 60$ each column), practice a–d, Foundation Q4 (direct/inverse/neither from tables), Q2–3 (express as $xy=k$, complete the table). Variation A §5 and Linear Relationships Standard §3a both deferred this tag to row 54.

**b. `graph-inverse-variation` — blurb enrichment (deferred in Variation A §3, now booklet-backed).**
- Before: "Identify $y=k/x$ as a curve (hyperbola)."
- After: "Identify $y=k/x$ as a decreasing hyperbolic curve that never touches the axes, and distinguish it from a straight line through the origin."
- Why: B4 drills exactly this — §Graphs of Inverse Variation fill-in, Key Ideas 1–2, §Distinguishing Direct and Inverse Variation table + 9-graph identify set, Foundation Q1 (Ben's straight-line misconception). No structure change.

**c. `graph-exponential-features` — minor blurb edit.**
- Before: "Graph $y = k(a)^{x}$ and $y = a^{x}+c$, and describe the $y$-intercept, asymptote and growth or decay nature."
- After: "Graph $y = k(a)^{x}$, $y = a^{-x}$ and $y = a^{x}+c$, and describe the $y$-intercept, asymptote and growth or decay nature."
- Why: Standard syllabus line is "Graph … $y = a^{x}$ and $y = a^{-x}$, where $a > 0$", and B2 drills $a^{-x}$ heavily (Foundation Q2c/d table-plots, properties Q1d, matching set C/F, Dev Q4, Q6 → $y = 4^{-x}$). Downstream `exponential-growth-decay-model` already names $ka^{-x}$; the feeder blurb omitted it. No structure change.

## 4. Borderline candidates → EXCLUDE

- **`variation-square`** ($d = ks^{2}$ — B3 Mastery Q12–14, three HSC items) — already excluded as `quadratic-direct-variation` in the Non-Linear Relationships B pass (same question family). No taught section here either. Stays out.
- **`identify-growth-decay-from-equation`** (B2 example table: initial value, growth/decay, % change from $y = k(1 \pm r)^{x}$) — entry step of `exponential-growth-decay-model` / `interpret-exponential-model`; drilled as fill-in only. Bundled.
- **`vertex-from-midpoint-of-intercepts`** (B3 Q5 Rhys item; syllabus "midpoint of the $x$-intercepts") — symmetry reasoning bundled in `graph-quadratic-features`/`quadratic-intercepts-vertex`; same call as NLI B §5.
- **`solve-simultaneous-with-technology` / line-meets-curve** (B1 Pt-2 Q5, Desmos, incl. Q5d $y=x^{2}+3$ vs $y=2x+2$) — tool-mediated practice of `simultaneous-equations-graphically`; the one non-linear item is a single sub-part. NLI B precedent.
- **`rearrange-general-form-to-sketch`** (B1 Review Mastery Q7) — review-chapter Mastery extension, not the target dot points; general-form conversion lives in the Stage 5 Path Linear C cluster.

## 5. Considered-and-omitted

- B1 review chapters (gradient/intercept from equation, write equation, sketch from $m$,$c$, equation from graph, contextual models incl. limitations Q9d/Q11) → the six Y11-tagged skills in the table; Y12 booklet re-teaches them as lead-in only. Notably B1 *does* contain the model-limitation content the row-47 pass flagged as a Y11 booklet gap — no graph action, `interpret-linear-model` already exists.
- B1 Investigation, verify-solution items (Q2, HSC Q10) → verification bundled in `simultaneous-equations-graphically` ("identify **and verify**" is its blurb).
- B1 elimination appearing in one worked example → `simultaneous-equations-algebraically` blurb already names substitution *and* elimination.
- B1 break-even graph-reading, profit/loss $= R - C$, loss-zone shading, 2024 HSC profit-per-item → `break-even-analysis`.
- B2 negative-index arithmetic review (Dev Q5) → index laws, ambient (NLI B precedent).
- B2 2020 HSC Band 6 guess-and-check for $b$ → non-routine, one item.
- B3 table-of-values parabola plotting incl. full $ax^{2}+bx+c$ (Dev Q4) → bundled in `graph-quadratic-features`; left untouched to avoid disturbing the s5-core view.
- B4 direct/inverse/neither from scenario and equation → `describe-direct-variation` / `describe-inverse-variation`; unitary-scaling Dev Q3–8 → `variation-scaling-reasoning` was excluded in Variation A §4, stays out.
- B4 §Modelling Inverse Variation using Equations (5-step find-$k$ box, all Foundation/Dev/Mastery incl. 2021/2022 HSC) → `solve-variation-equation`, exact match.
- **Prior rejections respected:** `interpret-constant-of-variation` (Variation A), `construct-linear-model` / `interpret-linear-context` (Linear B / row 47) — not re-proposed.

## Net change applied

- **+1 skill:** `interpret-reciprocal-model`
- **+0 edges** (beyond the new skill's prereq)
- **+3 re-scopes:** `variation-from-table` (+course/+dot point), `graph-inverse-variation` (blurb), `graph-exponential-features` (blurb)
