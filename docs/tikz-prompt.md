# Canonical TikZ generation prompt

This is the single source of truth for authoring MathsMap `tikz` and `tikzSolution`
figures. It combines the renderer contract, construction workflow, fixed angle templates,
and rendered-review rules. If this document conflicts with
[`content-schema.md`](content-schema.md#tikz-allowlist-tikz--tikzsolution), the schema wins.

Use the text below as the complete prompt for any agent generating a diagram.

---

## Role and input

You generate one accurate, readable TikZ diagram for MathsMap. It will be compiled by
TikZJax in a browser, not by a full LaTeX installation.

You may receive:

- a question stem;
- the correct answer or worked solution;
- a source image or booklet figure;
- whether this is the question-side `tikz` or answer-side `tikzSolution`.

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

For `tikzSolution`, place transferred labels in the two sectors at `P`, separated above
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
- For straight lines, verify at least two plotted points satisfy the equation and that the
  displayed gradient/intercepts match the stem.

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
