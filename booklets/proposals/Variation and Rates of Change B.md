---
status: applied
---

# Proposal — Variation and Rates of Change B (Stage 5 Path)

**Context.** Booklets: `Stage 5 Path/Variation and Rates of Change B_2 Analyse the relationship between graphs and variable rates of change.md` (OLD, kept — TRIAGE flagged its piecewise-linear "variable rate" content as possibly uncovered) and `Stage 5/Variation and Rates of Change 2_Graphs of Rates of Change.md` (NEW). Target topic `t-s5p-var-b`, dot points `dp-s5p-var-b-1`–`dp-s5p-var-b-3` (MA5-RAT-P-02). Queue row 29.

**Finding (headline).** Two results. First, **TRIAGE's concern about OLD B_2 is resolved as a non-issue** — every section of it (the piecewise-linear journey/container questions, the six-way "increasing/decreasing at an increasing/decreasing rate" table, the Distance/Gradient/Speed matching sets, and the Mastery platform/vending items) is already covered by `constant-rate-graphs` and `qualitative-rate-of-change`, and the NEW file reprints the same content nearly verbatim. It contributes nothing new. Second, the NEW file adds a chapter the graph has **no node for at all: Speed-Time Graphs** — acceleration as the gradient of a speed-time graph, and distance as the **area under** it. That's a genuinely different reading of a graph (the $y$-axis is a rate, not a quantity), and it's where the whole pass's value sits. Net: 2 new skills.

## 1. Recommended new skills

### 1.1 `speed-time-graph-acceleration`

| field | value |
|---|---|
| id | `speed-time-graph-acceleration` |
| title | Find acceleration from a speed-time graph |
| blurb | Interpret the gradient of a speed-time graph as acceleration in m/s², with a negative gradient as deceleration and a zero gradient as constant speed. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-var-b-1"]` |
| difficulty | 2 |
| prereqs | `["constant-rate-graphs"]` |
| atom type | Routine (R) |

```json
{ "id": "speed-time-graph-acceleration", "title": "Find acceleration from a speed-time graph", "blurb": "Interpret the gradient of a speed-time graph as acceleration in m/s², with a negative gradient as deceleration and a zero gradient as constant speed.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-var-b-1"], "prereqs": ["constant-rate-graphs"], "difficulty": 2 }
```

Trace: NEW §Speed-Time Graphs — "Acceleration and Deceleration" box ("Acceleration is the gradient of a speed-time graph… Negative acceleration is called deceleration"), Example "Calculate acceleration and deceleration from a speed-time graph" ($m=\tfrac{16}{8}=2$ m/s²; zero gradient between 8–14 s; $m=\tfrac{-16}{2}=-8$ m/s²), Guided Practice a–c, Key Ideas 1, Foundation Q1 a–f (incl. e/f distinguishing "$-0.25$ m/s² acceleration **or** 0.25 m/s² deceleration"), Q2 (sketch), Development Q3 (cheetah/gazelle chase, 7.5 / 5 / 15 m/s²).
Edge bar: **distinctive** — the characteristic move is reading a gradient whose $y$-axis is *already a rate*, giving a rate-of-a-rate with squared units; nothing else in the topic does this; **at-risk** — Foundation Q1e/f exist precisely because the acceleration/deceleration sign convention trips students, and Example part b (zero gradient ≠ zero speed) is the other standing confusion; **stage-proximity** — same stage; **non-redundant** — `constant-rate-graphs` reads a gradient as a rate of change of a *quantity*; no blurb mentions speed-time graphs or acceleration.
Nearest dot point: `dp-s5p-var-b-1` ("Analyse graphs that are decreasing or increasing at a constant rate") — the speed-time graphs here are piecewise-linear, i.e. constant acceleration per segment, and the dot point's syllabus text is "interpret and analyse further graphs that exhibit a constant rate of change, including those that are decreasing at a constant rate". Not `-3`, though Foundation Q2 ("sketch a graph to show an aeroplane accelerating from rest at 5 m/s² for 10 s") does touch construction — that's one question, and `construct-rate-of-change-graphs` already covers the constructing atom.

### 1.2 `distance-from-speed-time-area`

| field | value |
|---|---|
| id | `distance-from-speed-time-area` |
| title | Find distance from the area under a speed-time graph |
| blurb | Calculate distance travelled as the area under a speed-time graph, splitting it into rectangles and triangles. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-var-b-1"]` |
| difficulty | 3 |
| prereqs | `["speed-time-graph-acceleration"]` |
| atom type | Fact (F) → Routine (R) |

```json
{ "id": "distance-from-speed-time-area", "title": "Find distance from the area under a speed-time graph", "blurb": "Calculate distance travelled as the area under a speed-time graph, splitting it into rectangles and triangles.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-var-b-1"], "prereqs": ["speed-time-graph-acceleration"], "difficulty": 3 }
```

Trace: NEW §Speed-Time Graphs — "Distance Travelled" box ("Since $distance = speed \times time$, the **area under a speed-time graph** is the **distance** travelled"), Example "Calculate distance travelled from a speed-time graph" (Area A $=20\times30=600$ m, Area B $=\tfrac12(20\times10)=100$ m, total 700 m), second Example (72 m), Key Ideas 2.
Edge bar: **distinctive** — "area = distance" is a Fact with a non-obvious justification, and it's the only place in Stage 5 where area under a graph carries meaning; **at-risk** — highly; students default to reading a value off the axis rather than accumulating area; **stage-proximity** — same stage; **non-redundant** — appears in no blurb.
Prereq choice: `speed-time-graph-acceleration` — a progression chain within the one chapter (you must read the graph *as* a speed-time graph before area means distance), which also keeps the edge count down. The composite-area step itself (rectangle + triangle) is cross-topic Measurement and excluded by the scope rule.

## 2. Recommended new prereq edges

None. Both new skills declare their own prereqs.

## 3. Edits to existing skills

None.

## 4. Borderline candidates → EXCLUDE

- **`select-graph-for-container`** — NEW §Graphs of Change Foundation Q1 (pick the height-vs-time graph for each container shape) and Q2 (car around a corner, runner up a hill, trampoline, cooling soup). `construct-rate-of-change-graphs` already records the atom ("Represent a described variable rate of change of a quantity over time as a graph"); selecting vs drawing is the same knowledge, and its `qualitative-rate-of-change` prereq reaches the reasoning. Splitting select-from-construct would pollute.
- **`match-story-to-graph`** — NEW §Graphs of Change Q3 (soccer player / rocket booster / motorbike / school bus) and Q4 (vending machine, tank, phone call, taxi fare — 8 stories to 9 graphs). Same atom as above, in the reverse direction. Excluded with it.
- **`rate-of-change-inverse-context`** — dot point `-2` includes "describe the rate of change between variables… including direct and inverse variation", and NEW §Analysing Inverse Variation with Graphs works reciprocal models. But the *routine* there is `solve-variation-equation` / `graph-inverse-variation` (both Variation A skills, already on the graph); the rate-description layer over it is `qualitative-rate-of-change`. No third thing to name.
- **`interpret-gradient-as-rate-with-units`** — NEW §Rate from a Direct Variation Model ("Calculate the gradient, then describe its meaning": 0.2 L per km, \$1500 per sq m, 90 km/h, 15 L/min). This is the same candidate rejected at review in the row-28 pass (`interpret-constant-of-variation`) — the decision stands, and `constant-rate-graphs`' blurb ("interpret the gradient… as a constant rate of increase or decrease") already records it. Not re-proposed.

## 5. Considered-and-omitted

- **OLD B_2 contributes nothing new.** §Rates of Linear Graphs with Variable Rate of Change (Q1–4: car journey sections, cyclist with rest stop, container/bottle fill rates in L/s) → `constant-rate-graphs`. §Rates from Non-Linear Graphs (the Investigation, the six-way increasing/decreasing table, the A–D accelerating/decelerating match, the label-the-curve items, the Distance/Gradient/Speed selection sets, Foundation Q1–3, Development Q4–5, Mastery Q6–7) → `qualitative-rate-of-change` + `variable-rate-distance-time`. The NEW file reprints all of it. TRIAGE's "piecewise-linear variable rate content not clearly covered" flag → **resolved, no gap**.
- NEW §Rate from a Direct Variation Model, §Analysing Direct Variation with Graphs → `constant-rate-graphs`, `graph-direct-variation` (the latter on `t-s5p-var-a`). Match.
- **NEW §Conversion Graphs → `conversion-graphs`. This closes the row-28 open note**: the Variation A booklet had no conversion-graph section despite dot point `dp-s5p-var-a-3` listing it, and that pass flagged the skill as correctly placed but unreached. The NEW B file is where that content actually lives (Example "Apply direct variation in conversion graphs", Guided Practice, Foundation/Development/Mastery). The skill stays on `dp-s5p-var-a-3` — that's the dot point that names it; no re-attach needed.
- NEW §Analysing Inverse Variation with Graphs → `graph-inverse-variation`, `solve-variation-equation` (Variation A skills). Match.
- NEW §Rates of Non-Linear Graphs → `qualitative-rate-of-change`, `variable-rate-distance-time`. Match.
- NEW §Graphs of Change → `construct-rate-of-change-graphs`. Match.
- Both new skills scoped `["s5-path"]` only.

## 6. Open cross-stage candidates (for queue rows 74 and 75)

Neither new skill currently connects to anything in Stage 6 calculus, and no edge is proposed here — the booklet-required rule means a Stage 5 booklet cannot justify an edge into a Stage 6 skill. Two candidates are recorded for the passes that will hold the evidence. **Both queue rows carry a pointer to this section**, since a dot-point-anchored Stage 6 search would never surface these skills on its own.

| Stage 6 skill | Candidate edge | Case | Decide at |
|---|---|---|---|
| `velocity-acceleration-calculus` (`dp-s6adv12-appcalc-7`) | ← `speed-time-graph-acceleration` | Same concept one representation earlier — acceleration as rate-of-change-of-speed before it is $\ddot{x}$. Mirrors the existing `average-speed-distance-time ← interpret-distance-time-graphs` (Stage 6 ← Stage 4) precedent. | Row 75 (Applications of Calculus) |
| `definite-integral-geometric` (`dp-s6adv12-intcalc-2`) | ← `distance-from-speed-time-area` | Its blurb is "evaluate definite integrals using areas from geometric formulas" — the speed-time area is that idea pre-integral. It already reaches back to `area-composite-figures` for the same reason. | Row 74 (Integral Calculus) |

Cross-stage edges are structurally fine (the validator enforces prereq stage ≤ skill stage; the ~1-stage-proximity rule is a heuristic a distinctive prereq overrides). The open question is purely evidential: **if the Stage 6 booklet does not trace the dependency, exclude the edge and record that** — Advanced builds the definite integral from Riemann sums and the FTC, and may never show a speed-time trapezium.

## Net change if approved

**2 new skills, 0 new edges, 0 re-scopes.** Both sit on `dp-s5p-var-b-1` in a chain: `constant-rate-graphs → speed-time-graph-acceleration → distance-from-speed-time-area`.
