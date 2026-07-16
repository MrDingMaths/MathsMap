# Atomisation proposal — Non-Linear Relationships B (Core)

**Status: applied — `data/skills.json` updated (+1 edge, +1 re-scope), `npm run validate` clean.**

## Context

Booklet-atomisation workflow ([[booklet-atomisation-workflow]]), QUEUE row 23.
Three booklets: `Stage 5 Core/Non-Linear Relationships B 1_Graph and examine quadratic
relationships.md`, `2_Graph and examine exponential relationships.md`, `3_Distinguish
between linear, quadratic and exponential relationships by examining their graphical
representations.md`. Target topic `t-s5c-nli-b`, dot points `dp-s5c-nlib-1`–`3`
(MA5-NLI-C-02).

## Finding

**Near-saturated — 0 new skills, 1 new edge, 1 re-scope.** Four skills sit on the three
dot points. Two defects, both on the exponential side:

1. `graph-exponential-features` blurb said "Graph `y=a^x`…" but Booklet 2 drills the
   transformed forms as routine — `y=2^x+3` (asymptote `y=3`), `y=-2^x`, `y=k(a)^x` with
   `k` = `y`-intercept. Its quadratic sibling `graph-quadratic-features` already says
   "`y=kx²+c`…". Asymmetric.
2. `nonlinear-real-life-simultaneous` only wired in the quadratic feeder. Booklet 3's
   *Exponential Modelling* section (11 Qs, many HSC Band 5 — population, depreciation,
   compound interest, radioactive decay: read initial value = `k`, base → growth/decay +
   % rate) is exponential contextual modelling, but the skill's only prereq was
   `graph-quadratic-features`.

| Booklet | Dot pt | Skill / gap |
|---|---|---|
| B1 parabola features + transforms (`kx²+c`) | nlib-1 | `graph-quadratic-features` |
| B2 exponential features + transforms (`k(a)^x`, `a^x+c`) | nlib-2 | `graph-exponential-features` — blurb re-scope |
| B3 associate line/parabola/exponential ↔ equation | nlib-3 | `distinguish-linear-quadratic-exponential` |
| B3 quadratic modelling (max via vertex, domain limits) | nlib-3 | `nonlinear-real-life-simultaneous` |
| B3 exponential modelling (initial value, base→rate%) | nlib-3 | `nonlinear-real-life-simultaneous` — missing exponential feeder |

## 1. Recommended new skills

None. Exponential contextual modelling folds into `nonlinear-real-life-simultaneous`,
exactly as quadratic modelling already does — no separate `interpret-quadratic-model`
node exists, so no `interpret-exponential-model` either.

## 2. New prereq edges (1)

**`nonlinear-real-life-simultaneous ← graph-exponential-features`** — appended to existing
`["graph-quadratic-features"]`.
- **Trace:** B3 *Exponential Modelling* — `P=5000(1.09)^t` initial value/rate (l.742+),
  depreciation `S=20000(0.75)^n` (l.915), compound interest `FV=PV(1+r)^n` (l.940),
  radioactive decay (l.859). Reading `y`-intercept = initial value and base = growth
  factor is exactly `graph-exponential-features`.
- **Bar:** Distinctive (exponential features enable interpreting exponential models — not
  reachable via the quadratic feeder), at-risk (base→%-rate, growth-vs-decay), st5→st5,
  non-redundant (`graph-exponential-features` is a *sibling* of `graph-quadratic-features`,
  both ← `identify-parabola-exponential`; not currently reachable).

## 3. Edits to existing skills (1 re-scope)

**`graph-exponential-features`** — blurb only, no dotPointId/prereq change.
- **Before:** "Graph $y = a^{x}$ and describe the $y$-intercept and asymptote."
- **After:** "Graph $y = k(a)^{x}$ and $y = a^{x}+c$, and describe the $y$-intercept,
  asymptote and growth or decay nature."
- **Why:** faithful to the node's Booklet-2 routine (transformed-exponential y-int/asymptote
  is Foundation practice, not just investigation) and consistent with its quadratic sibling
  `graph-quadratic-features` ("`y=kx²+c`…"). No graph-structure change.

## 4. Borderline candidates → EXCLUDE

- **`interpret-exponential-model` (new skill)** — recurring content, but parallels quadratic
  modelling, which is bundled in `nonlinear-real-life-simultaneous`; splitting exponential
  out but not quadratic would be inconsistent. Folded via §2 edge.
- **`quadratic-direct-variation` (`d=ks²` — B3 Q12–14)** — cross-topic (Variation & Rates
  of Change); `d∝s²` is a variation routine, not intrinsic to NLI graphing.
- **`transform-exponential` / `transform-parabola` (separate transform nodes)** — bundled
  into the respective feature skills (quadratic already bundles k,c; exponential matched via §3).

## 5. Considered-and-omitted (audit trail)

| Content | Why omitted |
|---|---|
| Vertex = midpoint of x-intercepts (B1 Q5; B3 models) | Symmetry reasoning bundled in `graph-quadratic-features` |
| Domain/limitations of a model (`0≤t≤5`, width≥0) | Contextual/ambient sense-making |
| `y=a^{-x}=(1/a)^x`, negative-index review (B2 Mastery) | Index laws (already taught); ambient |
| Simultaneous line-meets-parabola graphically | Named in dot point + skill blurb; not drilled in these booklets — skill already exists |

## Net change

- **+0 skills.**
- **+1 edge:** `nonlinear-real-life-simultaneous ← graph-exponential-features`.
- **+1 re-scope:** `graph-exponential-features` blurb (transformed forms + growth/decay nature).

**Applied. `npm run validate` clean.**
