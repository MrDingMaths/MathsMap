---
status: applied
---

# Proposal — Atomise Network Flow (Stage 6 Standard Y12, topic `t-s6st12-flow`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (2 new skills, 2 new edges + rewire, 2 re-scopes); `npm run validate` clean. QUEUE.md row 59 → applied.

## Context

Queue row 59. One booklet: `Stage 6 Standard/Network Flow.md` (MST-12-S2-06), covering `dp-s6st12-flow-1`–`3`. Four skills already sit on these dot points (`network-flow-terminology`, `construct-flow-network`, `maximum-flow-minimum-cut`, `flow-capacity-analysis`).

## Finding (headline)

The 4-skill chain is right in shape but `maximum-flow-minimum-cut` bundled two separately-taught methods. The booklet teaches three distinct routines with separate algorithm boxes, worked examples and question sets: (1) max flow by **saturating edges/paths** (§Algorithm, F Q1a–n + 4 exam Qs), (2) **cut capacity** (§Cuts, own worked example + 2 F sets + VCE/HSC parts — with the drilled reverse-edge trap), (3) the **min-cut theorem** itself (§Theorem, trial-and-error min cut, verify-a-cut HSC parts). One blurb carried all three → two lift-outs + re-scope (`solve-linear-2-step` precedent). Plus one blurb widening on `flow-capacity-analysis` (edge-modification questions) and one booklet gap flagged.

| Booklet section | dp | Skill |
|---|---|---|
| §Flow Networks (source/sink/capacity/flow) | dp-1 | `network-flow-terminology` ✓ |
| *(table → network: no section — see gap note §5)* | dp-1 | `construct-flow-network` ✓ (untouched) |
| §Maximum Flow + §Algorithm for Calculating Maximum Flow | dp-2 | new `max-flow-saturated-edges` §1a |
| §Cuts (cut capacity, reverse-edge exclusion) | dp-2 | new `cut-capacity` §1b |
| §Maximum-Flow Minimum-Cut Theorem | dp-2 | `maximum-flow-minimum-cut` — re-scope §3a |
| D Q8b/Q9b, 2022 HSC part c (change an edge's capacity) | dp-3 | `flow-capacity-analysis` — blurb widening §3b |

## 1. New skills (applied)

### a. `max-flow-saturated-edges`

| Field | Value |
|---|---|
| id | `max-flow-saturated-edges` |
| title | Calculate maximum flow by saturating edges |
| blurb | Find the maximum flow of a network by listing source-to-sink paths, pushing each path's minimum remaining capacity through and subtracting until edges saturate, then summing the path flows. |
| stage 6 · courses `["s6-std12"]` · dotPointIds `["dp-s6st12-flow-2"]` · difficulty 2 · prereqs `["network-flow-terminology"]` · atom R (lift-out) |

**Trace:** §Maximum Flow (inflow = outflow set a–g) + §Algorithm — own 4-step method box, full worked example (S A C T / S A B T / S B T table with adjusted-edge diagrams, "Why is S A B T's capacity 2, not 4?" misconception prompt), systematic-order Tip; F Q1a–n (14 drills), Q2–3 (HSC sample ×2), Q4 (traffic 530), Q5 (dam 110 000 L/min); re-used §Theorem Q3a/Q4a, 2020 HSC part a.

**Bar:** distinctive (subtract-and-adjust bookkeeping); at-risk (reduced-capacity misconception prompted; largest question load); stage 6 sole source; non-redundant (was only a blurb mention inside `maximum-flow-minimum-cut` — mention ≠ reachability).

### b. `cut-capacity`

| Field | Value |
|---|---|
| id | `cut-capacity` |
| title | Calculate the capacity of a cut |
| blurb | Identify whether a line is a valid cut (fully separating source from sink) and calculate its capacity, counting only edges that flow from the source side to the sink side. |
| stage 6 · courses `["s6-std12"]` · dotPointIds `["dp-s6st12-flow-2"]` · difficulty 2 · prereqs `["network-flow-terminology"]` · atom T/Cat (lift-out) |

**Trace:** §Cuts — cut vs not-a-cut contrast table, counting rule with reverse-edge trap taught explicitly ("edge BA is not part of the cut"; "why don't we count 90?"), worked examples a–b + three-cut drill; F Q1a–d (incl. two "explain why capacity is 16" reverse-edge items), Q2a–d; D Q7a–b (invalid cut), Q10 (2019 VCE); 2022 HSC part a is pure cut capacity.

**Bar:** distinctive (source-side-to-sink-side counting rule); at-risk (reverse-edge inclusion is the documented error, explain-why drills); stage 6; non-redundant (implicit inside the theorem blurb; "cut" only vocabulary in `network-flow-terminology`).

## 2. New prereq edges + rewire (applied)

- **`maximum-flow-minimum-cut ← cut-capacity`** — theorem routine = compute candidate cut capacities, take the minimum.
- **`maximum-flow-minimum-cut ← max-flow-saturated-edges`** — verify/relate questions (Q3b, Q4b, 2020 HSC "is this cut minimum?", 2023 HSC) compare a cut against a path-computed max flow.
- **Rewire: dropped `maximum-flow-minimum-cut ← construct-flow-network`** — table→diagram conversion not intrinsic to the theorem (every question supplies the diagram); it was a chain proxy. `network-flow-terminology` stays reachable through both new prereqs — transitive reduction holds.

## 3. Edits to existing skills (applied)

**a. `maximum-flow-minimum-cut` — blurb re-scope (de-bundle).**
- Before: "Calculate maximum flow using saturated edges and the maximum-flow minimum-cut theorem."
- After: "Find the minimum cut of a network and apply the maximum-flow minimum-cut theorem, including verifying whether a given cut is minimal."
- Why: both lifted routines get their own nodes; residual = theorem + trial-and-error min-cut search (§Theorem's min-cut tips box, Q6 draw-the-min-cut drills, 2020/2022/2023 HSC parts).

**b. `flow-capacity-analysis` — blurb widening.**
- Before: "Examine and explain whether a network's flow capacity meets demand."
- After: "Examine whether a network's flow capacity meets demand, and analyse the effect of increasing or reducing the capacity of an edge, using the minimum cut to decide which edge to change."
- Why: syllabus bullet "examine the impact of increasing or reducing the flow capacity of an edge" is drilled — D Q8b (path restricted to 5 → 2 fewer), Q9b (pipe 205→305 → only +5), 2022 HSC part c (which edge raises max flow to 40); outside the old blurb.

## 4. Borderline candidates → EXCLUDE

- **`edge-modification-impact` as own skill** — three question parts, no dedicated teaching section; routine is recompute max flow / inspect min cut, i.e. composition of tagged skills. Handled as §3b blurb widening.
- **`identify-valid-cut` split** — valid/invalid classification (Cat) is one taught contrast inside §Cuts; folded into `cut-capacity`'s blurb, grain-too-fine alone.
- **Inflow = outflow vertex principle** — taught as §Maximum Flow intro (pipes a–g) but never assessed standalone; the entry step of `max-flow-saturated-edges`.

## 5. Considered-and-omitted

- **Booklet gap (no graph change):** dp-1's table→network conversion (`construct-flow-network`) has a syllabus bullet in the Overview but **no teaching section or question in the booklet** — recurring-gap genre (rows 47/49/50). Skill stays as-is; flag for booklet revision.
- Source/sink/outflow/inflow vocabulary recap → `network-flow-terminology`.
- "Min cut edges have zero excess capacity" (Q5 T/F) and Q3b/Q4b relate-the-methods prompts → understanding checks inside `maximum-flow-minimum-cut`.
- "Which edge is not at maximum capacity" (HSC sample Q2) → step 4 (unused capacity) of `max-flow-saturated-edges`.
- Rate contexts (L/min, vehicles/hour) → units reading, ambient; no rates edges (cross-topic scope rule).

## Net change applied

- **+2 skills** (`max-flow-saturated-edges`, `cut-capacity`)
- **+4 edges** (both new skills ← `network-flow-terminology`; `maximum-flow-minimum-cut` ← each new skill), **−1 edge** (`maximum-flow-minimum-cut ← construct-flow-network`, proxy dropped)
- **2 re-scopes:** `maximum-flow-minimum-cut` (blurb narrowed), `flow-capacity-analysis` (blurb widened)
