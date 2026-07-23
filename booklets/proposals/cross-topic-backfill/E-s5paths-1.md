# Cross-topic backfill proposal — E-s5paths-1

## Summary
14 source-topic → target-topic pairs examined · 11 accepted · 3 rejected · 10 skills modified (13 edges added)

## TARGET: Data analysis C `t-s5p-dat-c`

### Data classification and visualisation `t-s4-dat` → ACCEPT
- **Edge:** `represent-data-graphs` → `plan-statistical-inquiry`
- **Why constitutive:** the routine explicitly ends in "report with data visualisations" — producing that report requires actually constructing the graphs, which is the represent-data-graphs routine. No booklet exists for this capstone skill; anchored on the blurb text alone.
- **Bar:** distinctive ✓ · at-risk ✓ (stage-4 skill, one stage below) · stage-proximity ✓ · non-redundant ✓ (checked plan-statistical-inquiry's closure: draw-conclusions-data → census-vs-sample, compare-datasets-measures, calculate-mean-median-mode-range — no graphing skill present)
- **Edge:** `misleading-graphs` → `critique-statistical-reports`
- **Why constitutive:** "review surveys, polls and reports for accuracy and bias" — recognising a misleading graph is a direct instance of the bias-detection this skill trains; the two share the same critical-reading routine applied to different media.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (closure: evaluate-sampling-methods → census-vs-sample only)

### Data analysis A `t-s5c-dat-a` → ACCEPT
- **Edge:** `five-number-summary` → `plan-statistical-inquiry`
- **Why constitutive:** a genuine statistical investigation report typically needs a numerical summary of the gathered data, not just a picture of it. Picked the simplest sufficient skill (five-number-summary is itself a prereq of box-plots, standard-deviation is a separate branch) — either is a defensible anchor; five-number-summary is more foundational.
- **Bar:** distinctive ✓ · at-risk ✓ (same stage, but A precedes C in course sequence) · stage-proximity ✓ (same stage) · non-redundant ✓ (checked closure above — no A-topic skill reachable)
- **Confidence note:** the blurb only says "report with data visualisations", not summary statistics — see Notes.

### Data analysis B `t-s5c-dat-b` → ACCEPT
- **Edge:** `scatter-plot` → `plan-statistical-inquiry`
- **Why constitutive:** an investigation examining a relationship between two variables reports it via a scatter plot; matches "report with data visualisations" more literally than A's summary stats do. Chose scatter-plot over the more basic bivariate-data since it's the actual display/report step and already transitively requires bivariate-data.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓
- **Confidence note:** same caveat as Data analysis A — see Notes.

(`evaluate-sampling-methods` received no new edge from any of the three source topics — its routine is sampling-method comparison, no constitutive dependency on graphing, summary stats, or bivariate methods.)

## TARGET: Equations B `t-s5p-equ-b`

### Indices `t-s4-ind` → REJECT
- **Why:** checked every target skill's transitive closure. `solve-cubic-axcubed` (the one skill that plausibly needs a root-extraction step) already reaches `square-cube-roots` via `solve-quadratic-ax2 → quadratic-two-solutions → square-cube-roots`. `solve-quadratic-common-factor` and `solve-monic-quadratic-factors` already reach `index-laws-variables`, `apply-index-laws-numerical`, `zero-index`, `index-laws-establish`, `evaluate-index-notation`, `index-notation-terms` via their existing factorisation prereq chains (`factorise-common-algebraic-factor → ... → index-laws-variables`). `represent-inequalities-number-line` and `solve-linear-inequalities` have no plausible Indices dependency at all. Every genuine constitutive link is already present transitively — this pair is fully redundant, not merely weak.

## TARGET: Equations C `t-s5p-equ-c`

### Indices C `t-s5p-ind-c` → ACCEPT
- **Edge:** `simplify-surds-operations` → `quadratic-formula`
- **Why constitutive:** confirmed via `booklets/Stage 5/Equations C_3 Quadratic Equations.md` — the quadratic-formula worked example explicitly instructs "do not put into calculator (we usually want the surd in exact form)" and a practice question asks students to simplify a surd answer "using your knowledge of surd laws." The discriminant √(b²−4ac) routinely needs surd simplification, not just square-cube-roots evaluation.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓ (checked quadratic-formula's closure — pure factorisation/index-law chain, no root/surd skill present)
- **Edge:** `simplify-surds-operations` → `complete-the-square-solve`
- **Why constitutive:** same booklet, worked example `x² − 6x + 2 = 0 → (x−3)² = 7 → x = 3 ± √7`; isolating $(x+a)^2=k$ and taking the square root of both sides routinely produces a surd that needs simplifying.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ · non-redundant ✓ (checked closure — same clean factorisation chain, no surds)

## TARGET: Functions and other graphs `t-s5p-fnc`

### Equations C `t-s5p-equ-c` → ACCEPT
- **Edge:** `solve-quadratic-factorisation` → `natural-domain-from-equation`
- **Why constitutive:** confirmed via `booklets/Stage 5 Path/Functions and Other Graphs_2 ...md` §"Natural Domain" — question 5 explicitly requires "find the solutions to $(x-1)(x-2)=0$, hence find the natural domain of $f(x)=\frac{1}{(x-1)(x-2)}$", and further practice includes $f(x)=\frac{x}{x^2-4x+3}$. Excluding zero-denominators for a quadratic denominator requires factorising and solving it — the exact solve-quadratic-factorisation routine.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓ (checked natural-domain-from-equation's closure: domain-and-range, surd-domain-conditions and their ancestors — no factorisation/quadratic-solving skill present)
- **Rejected candidate:** `solve-function-equation` (blurb "set the rule equal to c and solve for x") looked promising but the actual booklet examples (`f(x)=2x-5`, solve for $x$ when $f(x)=13$; `g(x)=x^2+3`, solve for $x$ when $g(x)=28$) are one-step-linear and $ax^2=k$ level — neither is an Equations C skill. No edge added here.

### Linear relationships C `t-s5p-lin-c` → ACCEPT
- **Edge:** `transformations-coordinates` → `graph-function-transformations`
- **Why constitutive:** reflecting/translating a function graph ($y=-f(x)$, $y=f(-x)$, $y=f(x-b)$) applies the same coordinate-transformation rules ($(x,y)\to(x,-y)$, $(-x,y)$, translation) taught generically in transformations-coordinates, just specialised to function graphs. Anchored on graph-function-transformations (not reflect-function-graphs/dilate-function-graphs directly) since both of those are already downstream of it — one edge covers all three.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓ (checked graph-function-transformations, reflect-function-graphs, dilate-function-graphs closures — no coordinate-transformation skill present in any)

## TARGET: Linear relationships C `t-s5p-lin-c`

### Equations C `t-s5p-equ-c` → ACCEPT
- **Edge:** `change-subject-formula` → `general-gradient-intercept-form`
- **Why constitutive:** confirmed via `booklets/Stage 5 Path/Linear Relationships C_3 ...md` — "Rearranging the Equation of a Line" section is literally rearranging $ax+by+c=0$ to make $y$ the subject (worked examples: $3y+15-2x=0 \to y=\frac{2x}{3}-5$ etc.), the exact change-subject-formula routine (rearrange a literal equation to make a named variable the subject, appearing once).
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓ (checked closure of general-gradient-intercept-form, parallel-perpendicular-any-form, coordinate-geometry-problems — no Equations C skill present in any)

## TARGET: Logarithms `t-s5p-log`

### Financial mathematics B `t-s5c-fin-b` → ACCEPT
- **Edge:** `compound-interest-formula` → `solve-exponential-log-equations`
- **Why constitutive:** confirmed via `booklets/Stage 5 Path/Logarithms_2 ...md` §"Exponential Modelling" — the worked example is literally $FV=10000(1.05)^n$, solve for $n$ using logs, and the practice set continues with the same compound-interest-formula setup. The formula being solved IS the Financial Maths B skill.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓ (checked closure — pure log-law chain, no finance skill present)

### Equations C `t-s5p-equ-c` → REJECT
- **Why:** scanned both Logarithms booklets for algebraic-fraction, simultaneous, or quadratic-in-disguise equation types feeding the log skills — found none (log equations here are solved via log/index laws, e.g. change-of-base, not general Equations C machinery). One question ("$\log_5 y = 3-2\log_5 x$, change the subject to $y$") superficially resembles change-subject-formula but is actually solved via index-log-conversion + index laws, not literal-equation rearrangement, and it's an isolated enrichment item, not the routine of any target skill. No target skill's blurb names an Equations C technique. Grafted, not constitutive.

### Indices B `t-s5p-ind-b` → ACCEPT
- **Edge:** `convert-negative-positive-indices` → `index-log-conversion`
- **Why constitutive:** confirmed via `booklets/Stage 5 Path/Logarithms_1 ...md` — from the very first worked examples, index↔log conversion routinely involves negative indices ($10^{-2}=\frac{1}{100}$, $6^{-1}=\frac{1}{6}$, $3^{-2}=\frac{1}{9}$, $5^{-3}=\frac{1}{125}$). This is the only topic in the s5-path track that establishes negative-index literacy (t-s4-ind has none; `negative-integer-indices` is s5-core-only, not on the s5-path track), so it is genuinely at-risk.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓ (checked index-log-conversion's closure and every downstream log skill's closure — no negative-index skill anywhere in the log strand)

### Indices C `t-s5p-ind-c` → ACCEPT
- **Edge:** `fractional-indices` → `index-log-conversion`
- **Why constitutive:** same booklet section, same worked examples include fractional-index conversions ($16^{1/2}=4$, $9^{1/2}=3$, $8^{1/3}=2$, $25^{1/2}=5$, $64^{-1/3}=\frac14$) required to convert to/from log form.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓ (same closure check as above — no fractional-index skill present)
- **Rejected candidate:** `express-common-prime-base`/`solve-exponential-equations` (Indices C's own common-base method) — plausible topical precursor to logs but not constitutive machinery of any target skill's routine (logs are the alternative method for cases common-base doesn't solve, not a step inside the log routine). Left out to keep the anchor set minimal.

### Non-linear relationships C `t-s5p-nli-c` → ACCEPT
- **Edge:** `exponential-transformations` → `graph-log-functions`
- **Why constitutive:** graphing $y=\log_a x$ by reflecting $y=a^x$ in $y=x$ requires already being able to graph the full transformed exponential family. graph-log-functions currently only carries `graph-exponential-features` (the simpler s5-core sibling skill, via a different course) as a prereq — it is missing the direct within-course continuation `exponential-transformations` (the s5-path Non-linear C skill covering $y=k(a)^x+c$), which is a genuine gap, not a duplicate.
- **Bar:** distinctive ✓ · at-risk ✓ · stage-proximity ✓ (same stage) · non-redundant ✓ (checked graph-log-functions' closure — graph-exponential-features present, but NOT exponential-transformations; they are distinct sibling skills, not the same node)

## TARGET: Non-linear relationships C `t-s5p-nli-c`

### Right-angled triangles (Pythagoras' theorem) `t-s4-pyt` → REJECT
- **Why:** already transitively reachable. `circle-equation-origin` (the only plausible target — deriving $x^2+y^2=r^2$ is literally a Pythagoras application) has direct prereq `distance-formula` (Linear relationships C), whose own closure is `distance-formula → distance-between-points → pythagoras-find-side → pythagoras-theorem-statement`. `circle-equation-general` inherits the same chain via `circle-equation-origin`. Adding `t-s4-pyt` skills directly here would violate the non-redundancy bar (rule 4) — the relationship already exists in the graph, just not as a direct topic-adjacency edge (it's mediated through Linear relationships C, which is architecturally correct: that's *where* the coordinate-Pythagoras connection was made, not here).

## Patch (apply after review)
| skill id | current prereqs | add | resulting prereqs |
|---|---|---|---|
| `plan-statistical-inquiry` | `draw-conclusions-data` | `represent-data-graphs`, `five-number-summary`, `scatter-plot` | `draw-conclusions-data`, `represent-data-graphs`, `five-number-summary`, `scatter-plot` |
| `critique-statistical-reports` | `evaluate-sampling-methods` | `misleading-graphs` | `evaluate-sampling-methods`, `misleading-graphs` |
| `natural-domain-from-equation` | `domain-and-range`, `surd-domain-conditions` | `solve-quadratic-factorisation` | `domain-and-range`, `surd-domain-conditions`, `solve-quadratic-factorisation` |
| `graph-function-transformations` | `domain-and-range`, `parabola-transformations` | `transformations-coordinates` | `domain-and-range`, `parabola-transformations`, `transformations-coordinates` |
| `general-gradient-intercept-form` | `slope-intercept-interpret` | `change-subject-formula` | `slope-intercept-interpret`, `change-subject-formula` |
| `quadratic-formula` | `solve-quadratic-factorisation` | `simplify-surds-operations` | `solve-quadratic-factorisation`, `simplify-surds-operations` |
| `complete-the-square-solve` | `solve-quadratic-factorisation`, `complete-square-form` | `simplify-surds-operations` | `solve-quadratic-factorisation`, `complete-square-form`, `simplify-surds-operations` |
| `solve-exponential-log-equations` | `evaluate-simplify-logs` | `compound-interest-formula` | `evaluate-simplify-logs`, `compound-interest-formula` |
| `index-log-conversion` | `define-logarithm` | `convert-negative-positive-indices`, `fractional-indices` | `define-logarithm`, `convert-negative-positive-indices`, `fractional-indices` |
| `graph-log-functions` | `index-log-conversion`, `graph-exponential-features` | `exponential-transformations` | `index-log-conversion`, `graph-exponential-features`, `exponential-transformations` |

## Notes / judgement calls
- **Data analysis A/B → Data analysis C** (both accepted): the weakest-evidenced accepts in this pack. `plan-statistical-inquiry`'s blurb only says "report with data visualisations" — it doesn't explicitly name numerical summary statistics or bivariate methods, and no booklet exists for this capstone skill to check against. I accepted both because the A→B→C topic structure (numerical stats, then bivariate, then investigation) strongly implies a real statistical investigation draws on both, and the pack listed both as expected sources — but a reviewer who thinks the atomised blurb should be read literally (visualisation only, not analysis) may want to drop one or both of `five-number-summary` and `scatter-plot`.
- **Equations B ← Indices** and **Non-linear C ← Pythagoras**: both rejected as *fully redundant* (not merely weak) — the constitutive relationship already exists in the graph via a different, already-correct chain. Flagging in case the reviewer wants a direct topic-adjacency edge for graph-legibility reasons even though it'd be a transitively-redundant skill edge; I did not add it since the brief's rule 4 is explicit that this is disqualifying.
- **Equations C → Logarithms**: rejected. This is the one "expected" pair I found zero constitutive evidence for after checking both Logarithms booklets in full — worth a second look if the pack's expected-source list was derived from a different signal than routine content (e.g. topic authoring order).
