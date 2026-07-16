---
status: applied (partial — see "Review outcome")
---

# Proposal — Variation and Rates of Change A (Stage 5 Path)

**Context.** Booklet: `Stage 5/Variation and Rates of Change 1_Direct and Inverse Proportion.md` (NEW, supersedes all 3 OLD Variation A files). Target topic `t-s5p-var-a`, dot points `dp-s5p-var-a-1`–`dp-s5p-var-a-3` (MA5-RAT-P-01). Queue row 28.

**Review outcome.** Of the two proposed skills, only §1.1 `variation-from-table` was approved and applied. §1.2 `interpret-constant-of-variation` was **rejected at review** — do not re-propose it (see the rubric's "Check prior decisions" rule). The §3 blurb enrichment of `graph-inverse-variation` was **not approved and not applied** — deferred, still an open option for a future pass.

**Finding (headline).** Topic is well covered — 6 skills across 3 dot points, and the booklet's six chapters map almost cleanly onto them: the language/notation chapters → `describe-direct-variation` / `describe-inverse-variation`, the two graph chapters → `graph-direct-variation` / `graph-inverse-variation`, and both solving chapters (incl. all HSC Mastery items) → `solve-variation-equation`. One genuine gap: the booklet's constant-ratio / constant-product table test ($y/x=k$, $xy=k$) is a routine with its own Example, Guided Practice and Foundation sets in *both* graph chapters, and appears in no blurb.

## 1. Recommended new skills

### 1.1 `variation-from-table` — APPROVED, APPLIED

| field | value |
|---|---|
| id | `variation-from-table` |
| title | Test for variation from a table of values |
| blurb | Decide whether a table shows direct variation ($y/x$ constant), inverse variation ($xy$ constant) or neither, and write the equation. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-var-a-1"]` |
| difficulty | 2 |
| prereqs | `["describe-inverse-variation"]` |
| atom type | Category (Cat) → Routine (R) |

```json
{ "id": "variation-from-table", "title": "Test for variation from a table of values", "blurb": "Decide whether a table shows direct variation ($y/x$ constant), inverse variation ($xy$ constant) or neither, and write the equation.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-var-a-1"], "prereqs": ["describe-inverse-variation"], "difficulty": 2 }
```

Trace: §Graphs of Direct Variation — "Constant of Variation (Direct)" box ($y/x=k$), Example "Decide whether a direct variation relationship exists from a table" (marathon runner, $y/x=1/6$ → $y=\tfrac16x$), Guided Practice a–d, Key Ideas ("divide one quantity by the other and see if the ratio is constant"), Foundation Q2 a–f, Q3 (tree shadows, $s/h=1.6$), Q4 (spring — ratio not constant), Q5 (bottled water). §Graphs of Inverse Variation — "Constant of Variation (Inverse)" box ($xy=k$), Example ($xy=60$), Guided Practice a–d, Key Ideas, Foundation Q1, Q2 ($pq=40$), Q3 ("direct, inverse, or neither").
Edge bar: **distinctive** — the divide-vs-multiply test is the characteristic enabler and is what the booklet's two Key Ideas boxes exist to state; **at-risk** — Q4/Q5 are built on tables that look proportional but aren't, and Q3 forces the direct/inverse/neither discrimination; **stage-proximity** — same stage; **non-redundant** — no existing blurb mentions tables or the constant-ratio/product test; `graph-direct-variation` is about the line through the origin, a different representation.
Nearest dot point: `dp-s5p-var-a-1` ("Identify and describe problems involving direct and inverse variation") — the routine *identifies* the variation type. Not `-2`, despite the booklet filing it under its graph chapters: a table is not a graph, and `-2` is explicitly about graphs.
Prereq choice: `describe-inverse-variation` only — it already sits downstream of `describe-direct-variation`, so an edge to both would fail the transitive-reduction rule.

### 1.2 `interpret-constant-of-variation` — REJECTED at review, not applied

Proposed as: interpret what $k$ means in a modelling context, with units (`dp-s5p-var-a-3`, ← `solve-variation-equation`, difficulty 2). Traced to the §Graphs of Direct Variation Investigation, the §Modelling Direct Variation Example ("What does $k=36$ represent?") and Guided Practice, Foundation Q1a/Q2a/Q3a, Development Q6b, and the §Inverse Variation Problems Example.
Rejected: the meaning-and-units of $k$ stays bundled in the existing variation skills — `graph-direct-variation` already records "gradient $k$", and `solve-variation-equation` covers finding and using it. Not a separate node. **Do not re-propose.**

## 2. Recommended new prereq edges

None. `variation-from-table` declares its own prereq, and no existing skill needs a new feeder — the candidate `solve-variation-equation ← variation-from-table` is not a dependency (the table test and the $\propto$-given routine are parallel entry points, not sequenced).

## 3. Edits to existing skills — proposed, NOT approved, not applied

**`graph-inverse-variation` blurb enrichment** — deferred. The current blurb ("Identify $y=k/x$ as a curve (hyperbola).") is thinner than the chapter it names; the proposed replacement was "Identify $y=k/x$ as a decreasing hyperbolic curve that never touches the axes, and distinguish it from a straight line through the origin."
Trace, if a future pass revisits it: §Graphs of Inverse Variation — "Inverse Variation" box ("a hyperbolic decreasing curve that never touches the axes"), Investigation ("Is there a point on the graph for $t=0$? … for $s=0$?"), Key Ideas 1–2, the "Distinguishing Direct and Inverse Variation" table, the 9-graph identify set, and the Tina misconception item.
Status: left as-is in `data/skills.json`. Not rejected on the merits — simply not part of the approved scope.

## 4. Borderline candidates → EXCLUDE

- **`variation-scaling-reasoning`** — Development Q3–Q8 of the opening chapter scale without an equation (1 hr → \$30 so 2 hr → \$60; 6 hoses in 3 h so 12 hoses in 1.5 h). Stage 4 unitary-method proportional reasoning used as a lead-in to the definitions, not a new routine; `describe-direct-variation` already has `rate-problems` as its prereq, which reaches it. Fails distinctive and at-risk.
- **`identify-variation-from-equation`** — the ✖/✔ sorting sets ($y=3+x$ ✖, $y=3x$ ✔, $h=-\tfrac{2t}{5}$ ✔; $p=-\tfrac{200}{7x}$ ✔ vs $p=-\tfrac{200}{7x^2}$ ✖) plus Foundation Q2. Already exactly what `describe-direct-variation` / `describe-inverse-variation` blurbs record. Same atom.
- **`model-direct-variation`** — §Modelling Direct Variation is the same five-step routine as §Solving Direct Variation Problems (the booklet reprints the identical instruction box) with a context wrapped around it. `solve-variation-equation`'s blurb already covers it.
- **`limitations-of-linear-model`** — Development Q6d ("what is a limitation of the linear model?"). One sub-question, contextual sense-making. Precedent: quadratic modelling's domain-limitation content was omitted the same way in the Non-Linear Relationships B pass.

## 5. Considered-and-omitted

- §Direct and Inverse Variation (the "Identify examples" context sets a–l, the notation/language table: "$y$ varies directly as $x$", "$y\propto\tfrac1x$") → `describe-direct-variation`, `describe-inverse-variation`. Exact match, including the $\propto$ notation.
- §Graphs of Direct Variation Investigation (train at 75 km/h: table → straight line through origin → gradient $=k$ → write $d=75t$) → `graph-direct-variation`. Exact match; its `gradient-of-interval` prereq covers the rise/run step.
- §Solving Direct Variation Problems and §Inverse Variation Problems (both five-step boxes, both Examples, all Guided Practice, Foundation/Development, and the four HSC Mastery items — A4 paper, moon weight, steel beam, warehouse cleaners, tree spacing) → `solve-variation-equation`. Exact match, both directions.
- **`conversion-graphs` exists but this booklet does not cover it.** Dot point `-3` lists "Use linear conversion graphs to convert from one unit to another", and the skill is already on the graph, but the booklet has no conversion-graph section — the closest item (Development Q4, \$10 AUD ↔ ¥800) is numeric scaling with no graph. No action: the skill is correctly placed, the booklet just doesn't reach it. Noted so a future pass doesn't read this as a gap.
- `variation-from-table` scoped `["s5-path"]` only. It will plausibly serve Standard's `dp-s6st11-linear-3` / `dp-s6st12-algebraic-6` (where `describe-direct-variation` and `solve-variation-equation` already carry Standard courses) — left for queue rows 47/54 to attach rather than guessing the Standard view now.

## Net change applied

**1 new skill** (`variation-from-table`), 0 new edges, 0 re-scopes. Proposed-and-rejected: `interpret-constant-of-variation`. Proposed-and-deferred: `graph-inverse-variation` blurb enrichment.
