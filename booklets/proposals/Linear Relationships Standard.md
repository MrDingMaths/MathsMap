# Proposal — Atomise Linear Relationships (Stage 6 Standard Y11, topic `t-s6st11-linear`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json`; `npm run validate` clean (1148 skills). QUEUE.md row 47 → applied.

## Context

Queue row 47. Two booklets:

1. `Stage 6 Standard/Linear Relationships 1_Linear modelling.md` → **dp-s6st11-linear-1**, **-2**
2. `Stage 6 Standard/Linear Relationships 2_Direct variation.md` → **dp-s6st11-linear-3**

MST-11-02.

## Finding (headline)

**No new skills or edges.** Nine existing skills already carried these dot points and match the booklets section-for-section: `slope-intercept-interpret`, `equation-from-gradient-intercept`, `graph-using-gradient-intercept`, `equation-from-graph` (dp-1); `linear-real-life`, `interpret-linear-model` (dp-2); `describe-direct-variation`, `graph-direct-variation`, `solve-variation-equation` (dp-3). Two Stage 5 Path skills are re-taught here as full sections but weren't tagged — tagging only.

## 1–2. New skills / edges

None.

## 3. Edits to existing skills (2 course/dot-point tags) — APPLIED

**a. `variation-from-table`** — Booklet 2 §Deciding if a Direct Variation Relationship Exists is this exact routine (compute $y/x$ per column, constant → $y = kx$; marathon-runner worked example + 4 practice tables). Was `s5-path` only.
- courses: + `s6-std11`; dotPointIds: + `dp-s6st11-linear-3`.
- (Blurb's inverse-variation half is still Standard-relevant — resurfaces in Y12 reciprocal models, `graph-inverse-variation` already spans s6-std12.)

**b. `conversion-graphs`** — Booklet 2 §Conversion Graphs is a full section (AUD→NZD, AUD→GBP: read conversions both directions, gradient = conversion factor, write $NZD = 1.25\ AUD$). Was `s5-path` only.
- courses: + `s6-std11`; dotPointIds: + `dp-s6st11-linear-3`.

## 4. Borderline candidates → EXCLUDE

- **`construct-linear-model`** (Booklet 1 §Constructing Linear Models: $C = 1.5n + 100$ from fixed + variable cost) — **already rejected** in the Linear Relationships B proposal; folds into `linear-real-life`, already tagged `dp-s6st11-linear-2`. Not re-proposed.
- **`interpret-linear-context`** (gradient = rate, intercept = fixed value meanings) — same prior rejection, same fold.
- **`gradient-as-rate-meaning`** for direct variation ("$k$ = pay per hour") — inside `graph-direct-variation` + `linear-real-life`; no separate assessment beyond fill-ins.

## 5. Considered-and-omitted

- Read $m$, $c$ from equation (incl. $y = 2 - 3x$, fraction coefficients) → `slope-intercept-interpret`.
- Write $y = mx + c$ from given $m$, $c$ → `equation-from-gradient-intercept`.
- Plot intercept + gradient-step sketching → `graph-using-gradient-intercept`.
- Rise/run from graph → equation → `equation-from-graph`.
- Read values off a contextual model, write contextual equation ($C = 10n + 500$, $V = -50t + 550$) → `linear-real-life` (already tagged).
- Recognise $y = kx$ through origin, table + graph construction → `describe-direct-variation`, `graph-direct-variation`.
- Find $k$ from one pair then solve ($y \propto x$; mulch, petrol, paint) → `solve-variation-equation`.
- **Booklet gaps, no graph action:** interpolation/extrapolation/limitations (dp-2) has *no booklet section* — `interpret-linear-model` already exists on dp-2, so the graph is ahead of the booklet; syllabus "use a spreadsheet" lines have no content in either booklet. Both flagged for booklet revision.

## Net change

- 0 new skills, 0 new edges, **2 course/dot-point tag re-scopes** (`variation-from-table`, `conversion-graphs`).
