---
status: applied
---

# Proposal — Functions and Other Graphs (Stage 5 Path)

**Context.** Booklets: `Stage 5 Path/Functions and Other Graphs_1 Define relations and functions, and use function notation.md`, `Stage 5 Path/Functions and Other Graphs_2 Find the domain and range of a function and graph functions.md`, `Stage 5/Functions 2_Graph Regions.md` (NEW, supersedes OLD _3). Target topic `t-s5p-fnc`, dot points `dp-s5p-fnc-1`–`dp-s5p-fnc-3` (MA5-FNC-P-01). Queue row 27.

**Finding (headline).** Topic is thin, not saturated — 6 skills for ~2,500 lines of booklet. Book 1's definitions/VLT map 1:1 onto existing skills, but its function-notation chapter covers three distinct routines where the graph records one (`function-notation` blurb says only "evaluate `f(c)`"). Book 2 has a whole **Natural Domain** chapter and an **Interval Notation** investigation with no node at all, and its three separate transformation chapters (Translations / Reflections / Dilations — each with own Key ideas + Foundation/Development/Mastery) are bundled into one `graph-function-transformations` whose blurb omits reflections entirely. Book 3 has a **multiple-inequalities / unwanted-region** chapter and a reverse "state the inequality from the region" routine, both absent. This is a de-bundling pass: 8 new skills, mostly lift-outs and progression chains.

## 1. Recommended new skills

### 1.1 `evaluate-function-algebraic-argument`

| field | value |
|---|---|
| id | `evaluate-function-algebraic-argument` |
| title | Evaluate f(x) at an algebraic argument |
| blurb | Substitute an expression such as $x+1$ or $x+h$ into $f(x)$ and simplify, including $\dfrac{f(x+h)-f(x)}{h}$. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-fnc-1"]` |
| difficulty | 3 |
| prereqs | `["function-notation"]` |
| atom type | Routine (R) |

```json
{ "id": "evaluate-function-algebraic-argument", "title": "Evaluate f(x) at an algebraic argument", "blurb": "Substitute an expression such as $x+1$ or $x+h$ into $f(x)$ and simplify, including $\\dfrac{f(x+h)-f(x)}{h}$.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-fnc-1"], "prereqs": ["function-notation"], "difficulty": 3 }
```

Trace: Book 1 §Function Notation, Example "Use function notation to find $f(c)$, where $c$ is an algebraic expression" ($f(x)=x²+5x$ → $f(x+1)$); Foundation Q2e–f, Q3, Q4d–f; Development Q10, Q11 ($F(x-h)$), Q14 ($f(k)-f(k-1)$); Mastery Q24, Q25, Q26–27 (difference quotient).
Edge bar: **distinctive** — substituting an expression and expanding is the characteristic step, not shared with numeric evaluation; **at-risk** — the classic error is $f(x+1)=f(x)+1$, which Book 1 Q13 tests directly; **stage-proximity** — same stage; **non-redundant** — no existing skill mentions an algebraic argument.

### 1.2 `solve-function-equation`

| field | value |
|---|---|
| id | `solve-function-equation` |
| title | Solve f(x) = c for x |
| blurb | Given $f(x)$ and a value $c$, set the rule equal to $c$ and solve for the input $x$. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-fnc-1"]` |
| difficulty | 2 |
| prereqs | `["function-notation"]` |
| atom type | Routine (R) — with an invisible Category atom ("am I given the input or the output?") |

```json
{ "id": "solve-function-equation", "title": "Solve f(x) = c for x", "blurb": "Given $f(x)$ and a value $c$, set the rule equal to $c$ and solve for the input $x$.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-fnc-1"], "prereqs": ["function-notation"], "difficulty": 2 }
```

Trace: Book 1 §Function Notation, Example "Use function notation to solve $f(x)=c$" ($f(x)=2x-5$, $f(x)=13$ → $x=9$); guided a/b ($g(x)=x²+3$, $g(x)=28$ → $x=\pm5$); Q17 ($f(8)=1$ → find $a$), Q18, Q21, Q22; Mastery Q19b, Q20b/c/e/f.
Edge bar: **distinctive** — the converse direction of `function-notation` (output → input), a legitimate lift-out per the rubric's converse rule; **at-risk** — students read $f(x)=13$ as "evaluate at 13"; **stage-proximity** — same stage; **non-redundant** — `function-notation`'s blurb covers evaluation only.

### 1.3 `interval-notation`

| field | value |
|---|---|
| id | `interval-notation` |
| title | Read and write interval notation |
| blurb | Translate between inequalities and intervals such as $[-1,3)$, using $[\ ]$ to include and $(\ )$ to exclude, with $\infty$ always excluded, and join intervals with $\cup$. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-fnc-2"]` |
| difficulty | 1 |
| prereqs | `[]` |
| atom type | Fact (F) |

```json
{ "id": "interval-notation", "title": "Read and write interval notation", "blurb": "Translate between inequalities and intervals such as $[-1,3)$, using $[\\ ]$ to include and $(\\ )$ to exclude, with $\\infty$ always excluded, and join intervals with $\\cup$.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-fnc-2"], "prereqs": [], "difficulty": 1 }
```

Trace: Book 2 §Domain and Range, Investigation "Interval notation" (whole page: $[2,4]$ vs $[2,4)$ matching, $[0,\infty)$ vs $[0,\infty]$, union of $(-\infty,-2)\cup(-2,2)\cup(2,\infty)$); every domain/range answer in the book is given in both forms.
Edge bar: **distinctive** — a notation convention, the enabler for stating any domain/range answer; **at-risk** — the booklet spends an investigation on exactly the two errors (bracket/parenthesis, closed $\infty$); **stage-proximity** — same stage; **non-redundant** — nothing in the graph mentions intervals.
Prereqs: none. `represent-inequalities-number-line` is the natural feeder but is an Equations-B skill — cross-topic, excluded by the scope rule.

### 1.4 `natural-domain-from-equation`

| field | value |
|---|---|
| id | `natural-domain-from-equation` |
| title | Find the natural domain from an equation |
| blurb | Find the natural domain of $f(x)$ algebraically by excluding zero denominators and requiring non-negative radicands. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-fnc-2"]` |
| difficulty | 2 |
| prereqs | `["domain-and-range", "surd-domain-conditions"]` |
| atom type | Routine (R) |

```json
{ "id": "natural-domain-from-equation", "title": "Find the natural domain from an equation", "blurb": "Find the natural domain of $f(x)$ algebraically by excluding zero denominators and requiring non-negative radicands.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-fnc-2"], "prereqs": ["domain-and-range", "surd-domain-conditions"], "difficulty": 2 }
```

Trace: Book 2 §Natural Domain — Example ($y=1/(x-2)$, $y=\sqrt{x-1}$), Key ideas, Foundation Q1 a–x, Q2, Q3, Q4 a–o, Q5 (factorised denominator), Q6 ($1/\sqrt{4x^2-9}$).
Edge bar: **distinctive** — an algebraic routine (solve $\ne0$ / solve $\ge0$), not the graph-reading routine `domain-and-range` records; **at-risk** — the chapter exists because students default to "all real $x$"; **stage-proximity** — same stage; **non-redundant** — `domain-and-range`'s blurb is graph-based and no edge reaches this.

### 1.5 `reflect-function-graphs`

| field | value |
|---|---|
| id | `reflect-function-graphs` |
| title | Reflect graphs of functions |
| blurb | Graph $y=-f(x)$, $y=f(-x)$ and $y=-f(-x)$, using $(x,y)\to(x,-y)$, $(-x,y)$ and $(-x,-y)$. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-fnc-2"]` |
| difficulty | 2 |
| prereqs | `["graph-function-transformations"]` |
| atom type | Routine (R) |

```json
{ "id": "reflect-function-graphs", "title": "Reflect graphs of functions", "blurb": "Graph $y=-f(x)$, $y=f(-x)$ and $y=-f(-x)$, using $(x,y)\\to(x,-y)$, $(-x,y)$ and $(-x,-y)$.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-fnc-2"], "prereqs": ["graph-function-transformations"], "difficulty": 2 }
```

Trace: Book 2 §Reflections of Functions — Investigation, coordinate-rule table, guided a/b ($y=f(x)$ and $y=P(x)$ → all three reflections), Key ideas, Foundation Q1 ($P(a,b)$ images), Development, Mastery; §QUICKDRAW McGRAW ("Reflect about $x$-axis", "Reflect about $y$-axis", "Rotate by 180°").
Edge bar: **distinctive** — sign-placement inside vs outside $f$ is the characteristic decision; **at-risk** — $-f(x)$ vs $f(-x)$ is the topic's headline confusion; **stage-proximity** — same stage; **non-redundant** — reflections appear in no existing blurb, so nothing reaches this. Placed downstream of the re-scoped translations skill (progression chain, not sibling).

### 1.6 `dilate-function-graphs`

| field | value |
|---|---|
| id | `dilate-function-graphs` |
| title | Dilate graphs of functions |
| blurb | Graph $y=kf(x)$ (dilation of factor $k$ from the $x$-axis) and $y=f(ax)$ (dilation of factor $1/a$ from the $y$-axis). |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-fnc-2"]` |
| difficulty | 3 |
| prereqs | `["graph-function-transformations"]` |
| atom type | Routine (R) |

```json
{ "id": "dilate-function-graphs", "title": "Dilate graphs of functions", "blurb": "Graph $y=kf(x)$ (dilation of factor $k$ from the $x$-axis) and $y=f(ax)$ (dilation of factor $1/a$ from the $y$-axis).", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-fnc-2"], "prereqs": ["graph-function-transformations"], "difficulty": 3 }
```

Trace: Book 2 §Dilations of Functions — Investigation (table of values for $f(x)$, $2f(x)$, $\tfrac12 f(x)$, $f(2x)$), vertical/horizontal comparison table, Example, Key ideas, Check-your-understanding (choose $g(x)=(3x)^2$ vs $3x^2$), Foundation Q1 (dilation factor), Development, Mastery.
Edge bar: **distinctive** — the factor-$1/a$ inversion for $y=f(ax)$ is unique to dilations; **at-risk** — the whole Check-your-understanding set is built on the $(3x)^2$ / $3x^2$ trap; **stage-proximity** — same stage; **non-redundant** — currently reachable only through the coarse bundled blurb, which §3 re-scopes away.

### 1.7 `inequality-from-region`

| field | value |
|---|---|
| id | `inequality-from-region` |
| title | State the inequality defining a region |
| blurb | Read the boundary line and the shading of a region to write the inequality it satisfies, choosing $<$/$\le$ from a dotted or solid line. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-fnc-3"]` |
| difficulty | 2 |
| prereqs | `["graph-linear-inequalities-region"]` |
| atom type | Routine (R) |

```json
{ "id": "inequality-from-region", "title": "State the inequality defining a region", "blurb": "Read the boundary line and the shading of a region to write the inequality it satisfies, choosing $<$/$\\le$ from a dotted or solid line.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-fnc-3"], "prereqs": ["graph-linear-inequalities-region"], "difficulty": 2 }
```

Trace: Book 3 Foundation Q4 ("State the inequalities which define each **shaded** region"), Development Q6, Q8 (**unshaded**), Q11 (regions of intersection), Mastery Q14 a–d.
Edge bar: **distinctive** — converse direction (region → inequality), a legitimate lift-out; **at-risk** — requires finding the line's equation *and* choosing strict/non-strict from line style, and Q8/Q14 invert the shading convention on top; **stage-proximity** — same stage; **non-redundant** — the existing blurb is equation → region only.

### 1.8 `graph-region-multiple-inequalities`

| field | value |
|---|---|
| id | `graph-region-multiple-inequalities` |
| title | Graph the region satisfying several inequalities |
| blurb | Sketch each boundary, shade the unwanted regions and identify the required region satisfying all inequalities, including integer solutions. |
| stage | 5 |
| courses | `["s5-path"]` |
| dotPointIds | `["dp-s5p-fnc-3"]` |
| difficulty | 3 |
| prereqs | `["graph-linear-inequalities-region"]` |
| atom type | Routine (R) |

```json
{ "id": "graph-region-multiple-inequalities", "title": "Graph the region satisfying several inequalities", "blurb": "Sketch each boundary, shade the unwanted regions and identify the required region satisfying all inequalities, including integer solutions.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-fnc-3"], "prereqs": ["graph-linear-inequalities-region"], "difficulty": 3 }
```

Trace: Book 3 §"Sketch Multiple Linear Inequalities in Two Variables" + Example ($x>-2$ and $y\le3$, both the unwanted-shading and most-overlap methods); Guided Practice a/b; Development Q7, Q9, Q10; Mastery Q12 (triangular regions), Q13 (integer points), Q15 (Benji's chocolate bars), Q16 (theme park).
Edge bar: **distinctive** — the shade-the-**unwanted**-region convention is the characteristic move and exists only here; **at-risk** — inverted shading is counter-intuitive after single-region work; **stage-proximity** — same stage; **non-redundant** — the existing skill is single-inequality.

## 2. Recommended new prereq edges

**`domain-and-range` ← `interval-notation`**
Trace: Book 2 §Domain and Range — every Example/Foundation answer is stated twice, e.g. "Domain: $-2\le x\le2$  $[-2,2]$", "Range: $y\ge-1$  $[-1,\infty)$".
Edge bar: **distinctive** — the notation is the required output format of the routine; **at-risk** — see 1.3; **stage-proximity** — same stage; **non-redundant** — `domain-and-range`'s only current prereq is `function-notation`, which doesn't reach intervals.

**`natural-domain-from-equation` ← `surd-domain-conditions`** — approved at review; the one cross-topic edge in this pass.
Trace: Book 2 §Natural Domain, Example ($y=\sqrt{x-1}$ → $x-1\ge0$) and Key ideas ("You cannot square root a ......... number"); Foundation Q1 j–x, Q3, Q4 g–o.
Edge bar: **distinctive** — "radicand $\ge0$" is exactly half the routine's decision, not ambient algebra; **at-risk** — plausibly shaky; **stage-proximity** — both Stage 5; **non-redundant** — not otherwise reachable. Accepted despite `surd-domain-conditions` living on `dp-s5p-ind-c-1` (Indices C): it is the characteristic enabler, not a grafted-on topic. Precedent: `distance-between-points ← pythagoras-find-side`.

## 3. Edits to existing skills

**`graph-function-transformations` — re-scope to translations only** (de-bundling, progression-chain resolution: the booklet teaches Translations → Reflections → Dilations as three sequenced chapters, so the harder variants go downstream as dependents, not siblings).

| field | before | after |
|---|---|---|
| title | Graph transformations of functions | **Translate graphs of functions** |
| blurb | Graph and compare $y=f(x)$, $y=f(x)+c$, $y=f(x-b)$, $y=kf(x)$ and $y=f(ax)$. | **Graph and compare $y=f(x)$, $y=f(x)+c$ and $y=f(x-b)$, describing the vertical and horizontal shifts.** |
| difficulty | 3 | **2** |
| stage / courses / dotPointIds / prereqs | — | unchanged |

Trace for the narrowed scope: Book 2 §Translations of Functions — Investigation, Translation table ($y=f(x)+c$, $y=f(x-b)$), Example "Sketch graphs using horizontal and vertical transformations", Key ideas, Foundation Q1–2, Development, Mastery. Reflections and dilations move to 1.5/1.6.
Note: its existing `parabola-transformations` prereq is cross-topic but pre-existing — left as-is, not re-litigated.

## 4. Borderline candidates → EXCLUDE

- **`zeroes-and-y-intercept`** — Book 2 §Language of Functions defines a zero as $x$ where $f(x)=0$ and the $y$-intercept as $f(0)$. One question set, no Foundation/Development/Mastery. Vocabulary layered on intercepts the cohort has had since Linear Relationships A → ambient, fails the at-risk test.
- **`test-point-in-region`** — Book 3 Q2/Q3 ("decide by substitution whether $(5,0)$ is in $2x-3y>8$"). Already inside `graph-linear-inequalities-region`'s blurb ("testing whether points satisfy") and it's a one-line substitution → fails distinctive.
- **`function-machine-input-output`** — Book 1 §Function Notation opens with the machine metaphor and independent/dependent variables. Teaching device, not an assessable routine.
- **`compose-functions`** — Book 1 Q12e–f ask $f(g(4))$ and $g(f(4))$. Two sub-questions, no example, no chapter; composition is a Stage 6 routine. Non-routine here → exclude, don't seed a Stage 5 node.
- **`union-of-intervals`** — the $\cup$ symbol for split domains (Book 2 Interval Notation, hyperbola domains). Folded into `interval-notation` rather than split out (lean).
- **`combined-transformations`** — §QUICKDRAW McGRAW mixes shift/reflect/rotate on one grid. It's a drill over 1.5/1.6/re-scoped translations, not a distinct routine.
- **`optimise-in-feasible-region`** — Book 3 Q16d ("which combination spends the whole £20"). Grafts optimisation onto the region routine; one sub-question → non-routine.

## 5. Considered-and-omitted

- Book 1 §Relations and Functions (sets, ordered pairs, arrow diagrams, mapping) → `relations-and-functions`. Exact match.
- Book 1 §Vertical Line Test (incl. open/closed circles, "not all straight lines are functions") → `vertical-line-test`. Exact match; the open/closed-circle convention is a reading detail, not an atom.
- Book 1 Foundation Q1–2 numeric $f(c)$, Q7 (rewrite $3x+4y+5=0$ as a function), Q8 (cost function) → `function-notation`. Match.
- Book 2 §Domain and Range Investigations + Example + Foundation Q1 (read domain/range off a graph, "shadow on the axis") → `domain-and-range`. Match.
- Book 1 Q9/Q16 ("explain why $F(0)$ cannot be found for $F(x)=\sqrt{x-4}$") → the same atom as 1.4, cited there; no separate node.
- Book 3 §Linear Inequality Graphs review + single-inequality Example ($3x+4y>24$: rearrange, dotted line, shade) → `graph-linear-inequalities-region`. Match; the rearrange-to-$y=mx+c$ step is its existing `graph-using-gradient-intercept` prereq.
- Book 3 Q9 ("find the point of intersection of the two lines") → cross-topic (`solve-simultaneous-graphically`, Equations C); not added as a prereq per the scope rule.
- All 8 new skills are scoped `["s5-path"]` only. Several (natural domain, interval notation, reflections/dilations) will genuinely serve Stage 6 Advanced `dp-s6adv11-functions-4` / `-transform-*` — deliberately left for queue rows 64/69 to attach, rather than guessing the Advanced view now.

## Net change if approved

8 new skills, 2 new edges, 1 re-scope (`graph-function-transformations` → translations only: title, blurb, difficulty 3→2).
