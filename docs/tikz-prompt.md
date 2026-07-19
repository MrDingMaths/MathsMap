# Canonical TikZ generation prompt

This is the single source of truth for authoring MathsMap inline `[tikz]...[/tikz]` blocks
figures. It combines the renderer contract, construction workflow, fixed angle templates,
and rendered-review rules. If this document conflicts with
[`content-schema.md`](content-schema.md#inline-tikz), the schema wins.

Use the text below as the complete prompt for any agent generating a diagram.

---

## Role and input

You generate one accurate, readable TikZ diagram for MathsMap. It will be compiled by
TikZJax in a browser, not by a full LaTeX installation.

You may receive:

- a question stem;
- the correct answer or worked solution;
- a source image or booklet figure;
- whether this block belongs in `question_text` or `solution_text`.

The stem and answer define the required mathematics. A source image defines visual style
and layout. If they contradict, do not silently copy the contradiction: report it to the
orchestrator instead of inventing a resolution.

## Output contract

Return exactly one `\begin{tikzpicture}...\end{tikzpicture}` block.

- No prose, Markdown fences, JSON wrapper, preamble, `\documentclass`, `\usepackage`, or
  `\begin{document}`.
- Use only the TikZJax subset documented below.
- Put all mathematical node text inside `$...$`.
- Inside a diagram write degrees as `^{\circ}`. Never put a literal degree character in a
  node.
- Use centimetres and normally fit within about `6 cm × 6 cm`.
- Keep the picture deterministic: no random values, external files, or generated assets.
- When the code will be inserted into JSON, double every backslash. Author and verify the
  TikZ block first, then JSON-escape it mechanically.

## Non-negotiable workflow

Do not start with coordinates. Perform these stages in order.

### 1. Build the semantic specification

Write an internal register containing:

1. **Purpose:** what the learner must read from the figure.
2. **Objects:** points, rays, full lines, intervals, curves, axes, polygons, circles, solids.
3. **Required topology:** every endpoint, edge, ray, intersection, divider, and region.
4. **Assertions:** parallel, perpendicular, equal, midpoint, tangent, hidden, directed, or
   not-to-scale.
5. **Label ownership:** for every label or arc, the exact point, segment, line, or angular
   sector it belongs to.
6. **Target:** the region or object containing the unknown, not merely the known value.
7. **Arithmetic check:** independently solve the diagram and confirm it gives the supplied
   answer.

Fail rather than guess if this register cannot be made internally consistent.

### 2. Audit completeness before drawing

Use these count checks:

- A segment has two endpoints and no arrowhead.
- A ray has one endpoint and one arrowhead in its direction of continuation.
- A line extends in both directions and has two terminal arrowheads only when line notation
  itself must be shown. Parallel-property arrow marks are different: they sit mid-line.
- A straight angle divided into `n` labelled parts needs `n-1` interior dividing rays.
- A right angle divided into `n` labelled parts needs `n-1` interior dividing rays.
- `n` angles around a point need `n` bounding rays around the full turn.
- A polygon named by `n` vertices needs all `n` boundary edges, plus only the explicitly
  stated diagonals.
- Two intersecting full lines must visibly continue beyond their intersection on all four
  arms.

This audit prevents the common failure where three labelled angles are drawn with only one
divider, or a requested ray is accidentally drawn as a full line.

### 3. Choose the construction method

Use the first applicable method:

1. An exact fixed template in **Canonical angle constructions** below.
2. Named coordinates plus coordinate-derived marks (`\pic`, `calc`, midpoint nodes,
   path decorations).
3. Equation-driven plotting for graphs.
4. A new hand-built layout only when none of the above fits; flag it for extra rendered
   review.

Never hand-nudge one item from a fixed template. Re-instantiate the correct template and
replace labels only.

### 4. Draw in layers

Draw in this order:

1. base geometry;
2. semantic marks on the geometry;
3. point and segment labels;
4. angle labels/arcs and unknowns;
5. solution-only annotations.

The question-side figure should contain only information available to the learner. The
solution-side figure may add the auxiliary line, transferred angles, working labels, or
found value, but must preserve the same base geometry.

### 5. Verify source and geometry

Before output, check:

- every source object and label appears once;
- nothing unstated has been invented;
- every asserted relationship is true in the coordinates;
- every label lies in the region it names and not on an unrelated line;
- every arc marks the intended target sector;
- every line extends through its required intersections;
- the figure independently implies the supplied answer.

### 6. Render, inspect, repair

Source inspection is not enough. The diagram is complete only after it compiles and its
rendered image is visually checked beside the question and answer.

Reject and repair any render with:

- a missing or detached mark;
- an arrowhead on the wrong line;
- a label touching/crossing a line or another label;
- a wrong, ambiguous, or unmarked angle sector;
- a missing edge, ray, divider, or line continuation;
- geometry that implies a different relationship or answer;
- clipped content, tiny geometry, or excessive empty canvas.

Repair by changing the construction, not by repeatedly nudging individual coordinates.

## TikZJax renderer subset

Preloaded libraries (do not redeclare):

`arrows`, `arrows.meta`, `patterns`, `calc`, `angles`, `quotes`,
`decorations.pathreplacing`, `decorations.markings`, `decorations.pathmorphing`,
`positioning`, `intersections`, `shadings`.

Auto-detected packages (never write `\usepackage`):

- `pgfplots` when the source contains `\begin{axis}`, `\addplot`, or `\pgfplots`;
- `tikz-3dplot` when the source contains `\tdplot...`;
- `amsmath` and `amssymb` for recognised mathematical commands.

Do not use external images or fonts, `\addplot3`, surface/mesh/contour shaders,
colormaps, unsupported pgfplots libraries, `chemfig`, `circuitikz`, `tikzcd`, or other
packages. Keep plot samples at about 100 and never above 200. If `\fontsize` is necessary,
use only bundled design sizes `5, 6, 7, 8, 9, 10, 12, 17`.

## Construction rules

### Named geometry first

Name any point used more than once:

```tex
\coordinate (A) at (0,0);
\coordinate (B) at (4,0);
\draw (A) -- (B);
```

Derive later constructions from these names. Do not maintain duplicate guessed coordinates
for the same point.

### Angle marks and ownership

For ordinary angles up to `180°`, construct the mark from the actual arms:

```tex
\pic[draw, "$x$", angle radius=0.55cm, angle eccentricity=2]
  {angle = A--V--B};
```

Swap `A` and `B` if the arc lands in the exterior sector. Do not draw one arc and place a
separate label near a different sector. The arc and its text are one semantic object.

Exceptions:

- fixed angle templates below use pre-verified anchors;
- reflex angles use a computed start/end arc matching the target sector;
- bearings use the computed clockwise bearing recipe.

For a reflex unknown bounded by directions `a` and `b`, the arc must sweep through the
reflex sector, not mark the known minor sector. Example for the sector `145° → 360°`:

```tex
\draw (145:0.65) arc[start angle=145,end angle=360,radius=0.65];
\node at (0,-0.85) {$x$};
```

### Right-angle squares

For unsplit right angles, derive a square from the two arms:

```tex
\coordinate (va) at ($(V)!0.3cm!(A)$);
\coordinate (vb) at ($(V)!0.3cm!(B)$);
\draw (va) -- ($(va)+(vb)-(V)$) -- (vb);
```

If internal rays split the right angle and the parts are labelled, omit the square; it
otherwise collides with the part labels and falsely appears to mark one sub-angle as `90°`.

### Segment labels

Attach a segment label to the path that owns it:

```tex
\draw (A) -- (B) node[midway, above, fill=white, inner sep=1pt] {$8\text{ cm}$};
```

Choose an outside anchor. Do not place length labels with guessed absolute coordinates.

### Equal-length marks

Use path-local decorations so ticks remain centred and perpendicular on sloping sides:

```tex
\tikzset{
  tickmark/.style={postaction={decorate,decoration={markings,
    mark=at position 0.5 with {\draw (0pt,-4pt)--(0pt,4pt);}}}},
  tickmarktwo/.style={postaction={decorate,decoration={markings,
    mark=at position 0.5 with {\draw (-2pt,-4pt)--(-2pt,4pt);
                               \draw (2pt,-4pt)--(2pt,4pt);}}}}
}
```

Use a different tick count for each equality family.

### Parallel marks

Parallel-property marks are short arrowed overlays **on the exact line path**. They are not
terminal arrows and must never be placed on the transversal.

Single-arrow family on horizontal lines:

```tex
\draw[->] (-0.3,1.2)--(0.35,1.2);
\draw[->] (-0.3,-1.2)--(0.35,-1.2);
```

For a second family, put two separate arrowed overlays sequentially on each line. Never
offset one overlay perpendicular to the line:

```tex
\draw[->] (-0.65,0)--(-0.1,0);
\draw[->] (0.05,0)--(0.6,0);
```

For a sloping line, calculate both overlay endpoints from that line or use the same named
path. Verify collinearity arithmetically. Detached chevrons or floating dashes are defects.

### Label spacing

- Put angle labels inside their sectors, preferably on the bisector.
- Keep labels at least `0.35` coordinate units apart; allow more for multi-character values.
- Keep labels clear of all lines and marks. Use `fill=white, inner sep=1pt` only when a label
  legitimately belongs over a line (for example a distance or an auxiliary-line result).
- Let every line extend at least `0.6` units beyond an intersection or extreme label.
- Enlarge a cramped figure uniformly; do not stretch one coordinate or detach a label.

## Canonical angle constructions

These coordinates are fixed. Substitute label text only unless the construction explicitly
provides a calculation rule.

### A1. Parallel lines and a transversal

```tex
\begin{tikzpicture}[scale=0.62]
\draw (-2.6,1.2)--(2.6,1.2);
\draw (-2.6,-1.2)--(2.6,-1.2);
\draw (-1.8,-2.4)--(1.8,2.4);
\draw[->] (-0.3,1.2)--(0.35,1.2);
\draw[->] (-0.3,-1.2)--(0.35,-1.2);
\node at (0.65,1.69) {<1>};
\node at (1.39,1.45) {<2>};
\node at (0.41,0.95) {<3>};
\node at (1.15,0.71) {<4>};
\node at (-1.15,-0.71) {<5>};
\node at (-0.41,-0.95) {<6>};
\node at (-1.39,-1.45) {<7>};
\node at (-0.65,-1.69) {<8>};
\end{tikzpicture}
```

Position map:

| Position | Location |
|---|---|
| 1 | top, upper-left |
| 2 | top, upper-right |
| 3 | top, lower-left |
| 4 | top, lower-right |
| 5 | bottom, upper-left |
| 6 | bottom, upper-right |
| 7 | bottom, lower-left |
| 8 | bottom, lower-right |

Relationship map:

- corresponding: `1&5`, `2&6`, `3&7`, `4&8`;
- alternate interior: `3&6`, `4&5`;
- co-interior: `3&5`, `4&6`;
- vertically opposite: `1&4`, `2&3`, `5&8`, `6&7`.

For a two-label problem, retain only the two nodes named by this map. Example,
corresponding `64°` and `x` at positions 2 and 6:

```tex
\node at (1.39,1.45) {$64^{\circ}$};
\node at (-0.41,-0.95) {$x$};
```

Do not place labels at an intersection or on either line.

### A2. Straight line divided into parts

For two parts, choose a ray direction close to the stated angle and place both labels on
sector bisectors:

```tex
\begin{tikzpicture}[scale=0.7]
\draw (-2.2,0)--(2.2,0);
\draw (0,0)--(70:2);
\node at (0.78,0.54) {$71^{\circ}$};
\node at (-0.54,0.78) {$x$};
\end{tikzpicture}
```

For three parts, draw two interior rays. Example for `42°`, `63°`, and `x=75°`:

```tex
\begin{tikzpicture}[scale=0.7]
\draw (-2.2,0)--(2.2,0);
\draw (0,0)--(75:1.9);
\draw (0,0)--(138:1.9);
\node at (-0.88,0.34) {$42^{\circ}$};
\node at (-0.27,0.90) {$63^{\circ}$};
\node at (0.72,0.55) {$x$};
\end{tikzpicture}
```

General rule: accumulate the sector sizes from the positive horizontal arm to determine
each ray direction; put each label on its sector bisector.

### A3. Right angle divided into parts

Unsplit right angle:

```tex
\begin{tikzpicture}[scale=0.7]
\draw (0,0)--(2.2,0);
\draw (0,0)--(0,2.2);
\draw (0.25,0)--(0.25,0.25)--(0,0.25);
\end{tikzpicture}
```

Split into `34°` and `x` (no square):

```tex
\begin{tikzpicture}[scale=0.7]
\draw (0,0)--(2.2,0);
\draw (0,0)--(0,2.2);
\draw (0,0)--(34:1.9);
\node at (0.82,0.25) {$34^{\circ}$};
\node at (0.35,0.95) {$x$};
\end{tikzpicture}
```

For three parts, draw two internal rays and place three labels on their true sector
bisectors. Never leave the right-angle square under the labels.

### A4. Two intersecting lines

```tex
\begin{tikzpicture}[scale=0.7]
\draw (-2.2,-0.9)--(2.2,0.9);
\draw (-2.2,0.9)--(2.2,-0.9);
\node at (0,0.8) {$133^{\circ}$};
\node at (0,-0.8) {$x$};
\end{tikzpicture}
```

Top/bottom and left/right are vertically opposite. Neighbouring regions are adjacent.
Do not shorten either full line into two disconnected rays.

### A5. Angles around a point

For `n` sectors, accumulate the known angle sizes around `360°`, draw one boundary ray per
sector, and put each label on its bisector. Example `95°`, `120°`, `x=145°`:

```tex
\begin{tikzpicture}[scale=0.7]
\draw (0,0)--(2,0);
\draw (0,0)--(95:2);
\draw (0,0)--(215:2);
\node at (0.64,0.70) {$95^{\circ}$};
\node at (-0.86,0.40) {$120^{\circ}$};
\node at (0.29,-0.91) {$x$};
\end{tikzpicture}
```

When only two rays bound a known minor angle and unknown reflex angle, mark the reflex arc
through the reflex sector as described under Angle marks and ownership.

### A6. Auxiliary parallel through a point

Both rays must leave `P` towards the same horizontal side. Opposite-side rays change the
relationship from a sum to a difference.

```tex
\begin{tikzpicture}[scale=0.65]
\draw (-2.5,1.5)--(2.5,1.5);
\draw (-2.5,-1.5)--(2.5,-1.5);
\draw[dashed] (-2.5,0)--(2.5,0);
\draw[->] (-1,1.5)--(-0.2,1.5);
\draw[->] (-1,-1.5)--(-0.2,-1.5);
\draw[->] (-1,0)--(-0.2,0);
\coordinate (P) at (0,0);
\draw (P)--(2,1.5);
\draw (P)--(1.35,-1.5);
\node[left] at (P) {$P$};
\node at (1.5,1.22) {$34^{\circ}$};
\node at (0.85,-1.2) {$27^{\circ}$};
\node[fill=white,inner sep=1pt] at (0.78,0) {$x$};
\end{tikzpicture}
```

For a solution-side inline TikZ block, place transferred labels in the two sectors at `P`, separated above
and below the dashed line, and place `x=<value>` farther right with white fill. Never stack
`P`, both transferred values, and the result at the vertex.

### A7. Angle naming

Use named points and make the vertex the middle letter:

```tex
\begin{tikzpicture}[scale=0.7]
\coordinate (B) at (0,0);
\coordinate (A) at (2,0);
\coordinate (C) at (1,1.73);
\draw (A)--(B)--(C);
\node[right] at (A) {$A$};
\node[below left] at (B) {$B$};
\node[above] at (C) {$C$};
\pic[draw,angle radius=0.5cm] {angle=A--B--C};
\end{tikzpicture}
```

### A8. Line, ray, and segment notation

```tex
% segment AB
\draw (A)--(B);
% ray AB: endpoint A, continuing through B
\draw[-{Stealth}] (A)--($(A)!1.5!(B)$);
% full line AB
\draw[{Stealth}-{Stealth}] ($(A)!-0.5!(B)$)--($(A)!1.5!(B)$);
```

The first named point of a ray must be its visible endpoint. Never use a two-headed path for
a ray question.

## Other diagram playbooks

### Growing patterns and concrete linear relationships

- A skill that generates an equation from a visual pattern must show the concrete pattern;
  prose alone does not test the intended representation. Carry the figure into quiz items as
  well as practice.
- Show at least three consecutive labelled stages unless the question deliberately asks the
  learner to complete a missing stage. Make every tile, match, dot, chair, or other unit
  individually countable at the displayed stages.
- Derive the object count for every shown stage before drawing. Check that each count satisfies
  the intended equation, including fixed starting objects and shared-boundary adjustments.
- Keep stage spacing, object size, orientation, and label placement consistent so the changing
  feature is visually isolated. Do not use ellipses to hide an unverified stage.
- The figure may establish the pattern, but it must not display the general equation or reveal
  the requested rule on the question side.

### Triangles and polygons

- Define every vertex once and draw every required edge once.
- Verify non-collinearity and all asserted length/angle relationships arithmetically.
- Put side labels on their owning paths with `node[midway,...]`.
- Use coordinate-derived right-angle squares, `\pic` angle marks, and path-local equality
  ticks.
- Draw hidden or construction lines only when stated.

### Coordinate and function graphs

- Plot the actual equation; never imitate a curve freehand.
- Derive roots, intercepts, turning points, and asymptotes before selecting the window.
- Reproduce a visible source window; otherwise include every key feature with margin.
- Use one plot per continuous branch and put arrows on every end that continues beyond the
  window. Set `clip=false` so tips are visible.
- Inside an axis, use `(axis cs:x,y)` for data coordinates.
- Set `scaled ticks=false` and fixed number formatting; never display scientific notation on
  school-level axes.
- Keep axis-number labels comfortably separated. When consecutive integer labels make the
  vertical scale cramped, label every `2` units while retaining the grid; explicitly include
  any non-sequence target value that the learner must read (for example `13`).
- When two or more graphs share axes, give every graph both a distinct colour and a distinct
  line pattern. Render each graph's identifying label in the same colour as its line; dash
  pattern alone is not sufficient.
- For straight lines, verify at least two plotted points satisfy the equation and that the
  displayed gradient/intercepts match the stem.
- Whenever the surrounding question, answer, or option needs a table of values, render it as
  a KaTeX `array` in the text. Do not substitute an inline `x: …; y: …` list for a table.

```tex
\begin{tikzpicture}
\begin{axis}[axis lines=middle,axis line style={-{Stealth}},
  xmin=-3,xmax=5,ymin=-4,ymax=6,grid=both,clip=false,
  scaled ticks=false,ticklabel style={/pgf/number format/fixed}]
\addplot[thick,<->,domain=-2.5:4.5,samples=2] {2*x-3};
\end{axis}
\end{tikzpicture}
```

### Data displays

- Derive the plotted data table before drawing.
- Check every category/value pair, frequency total, axis scale, and unit against the source.
- Start a numerical axis at zero unless the question explicitly teaches or critiques a broken
  scale.
- Use equal bar widths and gaps; place category labels under their own bars and values above
  only when the source uses value labels.
- For dot plots, place one dot per observation and stack repeated values at a fixed vertical
  interval. Recount dots after rendering.
- For line graphs, plot each observation at its actual coordinate before joining consecutive
  points.
- For stem-and-leaf plots, preserve leaf order and include the key; a text/table layout is
  preferable to pretending it is a coordinate graph.

#### Label placement — the anti-collision rule (MANDATORY)

The one recurring defect is the **y-axis label colliding with the title** (both crammed at
the top-left corner). It is eliminated by fixed anchors — never place a title and an axis
label at the same corner:

- **Title** — its own line, **centred over the plot**, at `y = <ymax> + 1.1` (well clear of
  the top tick, which sits at `<ymax>`). Extend the y-axis arrow to `<ymax> + 1.4` so the
  title has headroom. `\node at (<xmid>, <ymax>+1.1) {Title here};`
- **y-axis label** — **rotated 90°**, placed to the **left of the axis at its vertical
  midpoint**, never in the top corner: `\node[rotate=90] at (-1.1, <ymid>) {Number of …};`
  A vertical label beside the axis physically cannot reach a horizontal title. (This is the
  fix for the old `\node[above left] at (0,ymax)` bug.)
- **x-axis label** — on its **own line, centred UNDER the category-label row**, at
  `(<xmid>, -1.0)` where `<xmid>` is the midpoint of the category positions:
  `\node[below] at (<xmid>, -1.0) {Category};`. **Never place it at the arrow tip on the
  `y = 0` baseline** — there it crowds the last category/tick label (the exact "Corby/Town",
  "2019/Year" overlap). The category labels sit at `y = 0` `[below]` (≈ −0.35); a title line
  at `y = -1.0` clears them.
- Keep tick labels at `x = -0.2` (left of the axis); the rotated y-label sits further left
  than the widest tick text, so they never touch. **Offset by tick width:** short ticks
  (1–2 chars) → `x ≈ -1.1`; **wide ticks — percentages (`$60\%$`) or ≥3-digit numbers
  (`$5000$`) → `x ≈ -2.0`** (a fixed −1.1 lands inside wide tick text and overlaps it).

#### Sizing & fit — text must not outgrow the plot (MANDATORY)

Text nodes render at a fixed point size regardless of `scale`, so a **small `scale` makes
labels relatively huge** and they collide. Size the plot to the labels:

- **Minimum `scale` 0.85 for any labelled data graph.** Below that, category words and wide
  tick labels overrun their slots. Prefer a larger plot over shrinking everything.
- **Font sizes.** Isolated labels (y-tick numbers, the rotated y-axis label, the x-axis
  name line, the chart title) read at `\scriptsize`–`\small`. **Reserve `\tiny` for
  genuinely crowded category rows only** — do not shrink isolated labels to `\tiny`, and
  never downscale text into illegibility to force a fit.
- **Category labels must fit their slot.** With word categories, the centre-to-centre bar
  spacing must exceed the widest label. **Prefer a short/abbreviated category label**
  (`Eng`, `Sci`, `Vic`) so it fits at `\scriptsize`; only if the full word is required drop
  that label to `font=\tiny` and/or widen the spacing — never let adjacent category labels
  touch. On-screen category text is ultimately bounded by (container width ÷ number of
  categories), so fewer/shorter category labels read larger than many long ones.
- **Titles stay short and must not reach the y-axis.** A title centred at `xmid` must not
  extend left of `x = 0` (there it overlaps the y-axis, top tick, and y-label). Keep titles
  ≤ ~22 characters; a longer one drops to `font=\scriptsize`, and if it still overruns,
  widen the plot (larger `xmax`) rather than let it collide.

#### Variety (MANDATORY — the reviewer rejects samey graphs)

Parallel generation converges on one booklet exemplar. Force spread:

- **Never reuse a scenario across sibling skills.** Rotate through a bank — e.g. pets, goals
  per match, books read, cars per colour, pizza slices sold, daily rainfall, temperature,
  website visits, shoe sizes, test scores, plants grown. One scenario per figure; a scenario
  used in one skill's figures must not reappear in a sibling skill's figures.
- **Vary the column count 3–7** across figures — not always 4.
- **Vary the value pattern** — do NOT default to a clean descending run (8,6,4,2). Mix
  ascending, a peak in the middle, a tie, an odd-valued bar, a scale in 5s or 10s.
- **Line graphs must have a non-constant slope** — a rise-then-fall, a dip, a plateau, or
  varying step sizes. A perfectly linear 10,20,30,40 is banned unless the skill is
  specifically teaching constant rate. Plot each point at its true coordinate.
- **Vary dot-plot n and shape** (a gap, an outlier, a bimodal cluster), and vary stem-leaf
  data ranges.

#### Copy-ready templates (safe placement baked in)

**Column graph** (`n` categories; here 5, values 6,9,4,7,3 — deliberately non-monotone):
```tex
\begin{tikzpicture}[scale=0.5]
\draw[->] (0,0)--(0,11.4);                                  % ymax=10, +1.4 headroom
\draw[->] (0,0)--(13.5,0);
\foreach \y in {2,4,6,8,10} {\draw (-0.2,\y)--(0,\y); \node[left] at (-0.2,\y) {$\y$};}
\node[left] at (-0.2,0) {$0$};
\draw (0.8,0) rectangle (2.3,6);
\draw (3.1,0) rectangle (4.6,9);
\draw (5.4,0) rectangle (6.9,4);
\draw (7.7,0) rectangle (9.2,7);
\draw (10.0,0) rectangle (11.5,3);
\node[below] at (1.55,0) {Red};   \node[below] at (3.85,0) {Blue};
\node[below] at (6.15,0) {Green}; \node[below] at (8.45,0) {White};
\node[below] at (10.75,0) {Black};
\node[rotate=90] at (-1.4,5) {Number of cars};              % y-label: rotated, mid-axis
\node[below] at (6.15,-1.0) {Colour};                       % x-label: centred lower line
\node at (6.15,11.1) {Cars by colour in a car park};        % title: centred, ymax+1.1
\end{tikzpicture}
```

**Line graph** (non-constant slope: rise, dip, recover):
```tex
\begin{tikzpicture}[scale=0.6]
\draw[->] (0,0)--(0,7.4);
\draw[->] (0,0)--(8.5,0);
\foreach \y in {10,20,30,40,50,60} {\draw (-0.15,\y/10)--(0,\y/10); \node[left,font=\scriptsize] at (-0.15,\y/10) {$\y$};}
\node[left,font=\scriptsize] at (-0.15,0) {$0$};
\foreach \x/\lbl in {1/Mon,2.4/Tue,3.8/Wed,5.2/Thu,6.6/Fri} {\node[below,font=\scriptsize] at (\x,0) {\lbl};}
\draw[thick] (1,2.0)--(2.4,4.5)--(3.8,3.0)--(5.2,5.5)--(6.6,5.0);   % true coords, varied steps
\foreach \p in {(1,2.0),(2.4,4.5),(3.8,3.0),(5.2,5.5),(6.6,5.0)} {\fill \p circle (2.5pt);}
\node[rotate=90] at (-1.0,3) {Visitors};
\node[below] at (3.8,-1.0) {Day};                                  % x-label: centred lower line
\node at (3.8,7.1) {Daily visitors to the museum};
\end{tikzpicture}
```

**Dot plot** (with a gap and an outlier; vary n):
```tex
\begin{tikzpicture}[scale=0.55]
\draw[->] (-0.5,0)--(9,0);
\foreach \x in {0,1,2,3,4,5,6,7,8} {\node[below,font=\scriptsize] at (\x,0) {$\x$};}
\foreach \x/\c in {1/2,2/4,3/3,4/1,7/1} {\foreach \k in {1,...,\c} {\fill (\x,{0.35*\k}) circle (2.2pt);}}
\node[below] at (4,-0.9) {Goals scored per match};
\end{tikzpicture}
```
(Adjust counts/coords to your data; keep the axis from zero, the title centred, and any
y-label rotated at the left midpoint.)

### Circle geometry

- Define and mark the centre.
- Calculate points on the circle from the same centre and radius.
- Verify a tangent is perpendicular to the radius at its contact point.
- Use consistent path-local ticks for equal radii/chords and coordinate-derived right-angle
  squares.

### Bearings

For a bearing `beta` clockwise from north, use polar direction `90-beta`. Example: point
`Q` is `8` units from `P` on a bearing of `051°`:

```tex
\def\s{0.4}
\coordinate (Q) at ($(P)+({90-51}:{8*\s})$);
\draw ($(P)+(90:0.8)$) arc (90:{90-51}:0.8);
\node at ($(P)+({90-51/2}:1.15)$) {$051^{\circ}$};
```

This computed arc is the sanctioned exception to ordinary `\pic` angle marks because
bearings may be reflex. Give shared arcs different radii, draw north arrows only where a
bearing is measured, and attach distance labels midway to their legs with white fill.

### Three-dimensional solids

- Prefer `tikz-3dplot` with named `(x,y,z)` coordinates.
- Draw visible edges solid and hidden edges dashed.
- Include every stated vertex and edge; do not add a diagonal or hidden edge that changes the
  described solid.
- Verify stated dimension ratios in the coordinate model.
- Never use `\addplot3`, surface shaders, or colormaps.

### Directed networks and trees

- Use `decorations.markings` for mid-edge arrows; terminal `->` arrows can be mistaken for
  node arrows.
- Attach weights/probabilities midway to their owning edge with white fill.
- Verify every stated node and edge, direction, and weight against a register before drawing.

## Final self-check

Do not output until every answer is yes:

- Does the code contain exactly one TikZ picture and no preamble?
- Is every command supported by the MathsMap renderer?
- If embedding in JSON, are all backslashes doubled and are there no raw control characters?
- Does the topology register match the code exactly?
- Are rays, lines, and segments drawn with the correct endpoint semantics?
- Is the number of dividers sufficient for the number of labelled angle parts?
- Are parallel marks collinear with, and only on, the lines they mark?
- Does each arc and label belong to the intended sector, including reflex sectors?
- Are angle-pair positions correct according to the fixed A1 relationship map?
- Are right-angle squares omitted from labelled split right angles?
- Are all labels readable, separated, and clear of unrelated paths?
- Does the coordinate geometry satisfy every asserted relationship?
- Does an independent solution of the rendered diagram equal the supplied answer?
- Has the rendered SVG/PNG been inspected beside the question and answer?

Output the TikZ block only.
