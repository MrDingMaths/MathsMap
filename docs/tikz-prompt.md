<!-- GENERATED MANUAL — single source of truth is MathsDatabase prompts/tikz/*.md, built by
     tools/qgen/lib/tikz-sections.mjs. Do not edit prompts/tikz-prompt.md or
     MathsMap/docs/tikz-prompt.md directly; edit the part files and rebuild. -->
# TikZ Diagram Generation Instructions

You are generating TikZ code for a maths question database (MathsBase / MathsMap). The output is rendered in the browser by **TikZJax**, which compiles a `tikzpicture` environment to SVG. There is no LaTeX preamble, no document, and only a fixed set of libraries.

## Task modes

Two kinds of request arrive; the authority differs:

- **Transcription mode** — you receive an **image of the diagram**, a **text description**, or **both**, and must reproduce the source figure. Use whatever is given; where image and description conflict, **trust the image**.
- **Generation mode** — you receive a question stem and its answer/worked solution (and possibly whether the block belongs in the question or the solution), and must construct a new figure. The stem and answer define the required mathematics; a source image, if any, sets visual style only. If the stem and answer contradict each other, do **not** silently copy or invent a resolution — report the contradiction to the orchestrator and stop.
- A **question-side** figure contains only information available to the learner. A **solution-side** figure may add auxiliary lines, transferred angles, working labels, or the found value, but must preserve the same base geometry.

---

## NEVER DO

1. **Never output anything other than a single `\begin{tikzpicture}...\end{tikzpicture}` block** — no prose, no markdown code fences, no `[tikz]` delimiters, no JSON, no explanation before or after.
2. **Never include a preamble** — no `\documentclass`, no `\usepackage`, no `\begin{document}`.
3. **Never invent geometry** — if a length, angle, or coordinate is not given in the source, label it as a variable (e.g. `$x$`, `$\theta$`). Do not fabricate a numeric value.
4. **Never use `\includegraphics`** or any external image reference.
5. **Never use libraries other than those listed under Allowed Packages and Libraries** — including `chemfig`, `circuitikz`, `tikzcd`, `tikz-cd`, `pgfgantt`.
6. **Never use raster effects** (`\pgfimage`, shading from external files) — only vector primitives.
7. **Never wrap math in `\(...\)` or `\[...\]`** inside nodes — always use `$...$`.
8. **Never use scientific notation on graph axes** — always write tick labels as plain decimals or integers (e.g. `0.001`, not `1e-3` or `$10^{-3}$`). If the axis range would produce scientific notation by default in pgfplots, suppress it explicitly with `scaled ticks=false, ticklabel style={/pgf/number format/fixed}`.
9. **Never join the two apexes of a curved surface.** On a cylinder, half-cylinder, cone, or any swept curved solid, the topmost point of the front cross-section and the topmost point of the back cross-section are **not** connected by an edge. A line between them is an arbitrary ruling lying on the surface; it renders as a crease down the middle of a smooth roof. The only straight line to draw along a curved surface is its **silhouette** — the ruling where the view direction grazes the surface (see the 3D solids playbook, "Curved surfaces: silhouette, not apex").
10. **Never hand-compute angle arcs, right-angle squares, or label coordinates by guessing numbers.** Angle markers must use `\pic{angle = A--V--B}`; right-angle squares must be derived from the two edge endpoints with `calc`; segment labels must use `node[midway, ...]` on the `\draw` that creates the segment. Never place an angle mark, right-angle square, or label with a bare `\node at (x,y)` of guessed coordinates or a freehand `\draw ... arc (a:b:r)` — these never line up with the real edges. (Two exceptions: the non-radial bearing-arc recipe in the Bearings playbook, whose `arc (90:90-β:r)` is computed from the bearing β, not guessed — radial surveys use endpoint bearing labels instead; and a **pre-verified canonical template** from the Angles or Data displays playbooks, instantiated verbatim with label substitution only — its `\node at (x,y)` positions are calibrated constants, not guesses. Never hand-nudge one item inside a canonical template; re-instantiate the correct template and replace labels only.)
11. **Never shrink a crowded figure with `scale`.** `scale` resizes geometry but **not** node text, so `scale=0.85` leaves every label at full size against 85%-size geometry — labels grow *relative to* the figure and collide. Shrinking scale makes crowding worse, never better. `scale` is an **enlarge-only** lever for figures that are small relative to their labels. (The one legitimate `scale` below 1 is a figure deliberately drawn on a large coordinate grid whose labels are *themselves* stepped down to `\scriptsize`/`\footnotesize` — as the Data displays templates do. Scale and text size are chosen together or not at all; never inherit `\large` throughout and then shrink.)
12. **Never start an `arc` from a point that contradicts its start angle.** `\draw (S) arc (a:b:r)` treats `S` as the point *already at angle `a`* on a circle of radius `r`, and derives the centre from it. Writing `(0.9,0) arc (-18:22:0.9)` around a vertex at the origin puts the centre at `(0.04,0.28)` and the arc lands nowhere near the sector. Always write the start point in polar form about the centre you mean — `($(V)+(-18:0.9)$) arc (-18:22:0.9)` — so the two can never disagree.
13. **Never let `\pic{angle = P--V--Q}` sweep the wrong way.** The mark is drawn **anticlockwise from arm `VP` to arm `VQ`**. If that sweep exceeds 180°, you have marked the reflex/exterior angle. Check the winding before you write it, and swap the two outer operands if the sweep is the long way round. Marking a 110° angle as `C--B--A` when the anticlockwise sweep is 250° is the single most common angle defect.

---

## Output Contract

Output is **exactly one** TikZ picture, of this shape:

```
\begin{tikzpicture}[every node/.style={font=\large}]
\usetikzlibrary{...}   % only the libraries actually used
...
\end{tikzpicture}
```

- Work in **centimetres**.
- Target a **~6 cm × 6 cm bounding box**. Go Larger only when the diagram genuinely needs it (e.g. a wide curve plot, a long bearing diagram).
- The first line is always `\begin{tikzpicture}[every node/.style={font=\large}]` so all labels render at a readable size.
- **If the finished geometry looks small relative to its `\large` labels** — i.e. the labels crowd or dominate the figure (common for bearings and mark-heavy geometry) — add a `scale=` factor of `1.5`–`2` to the options line: `\begin{tikzpicture}[every node/.style={font=\large}, scale=1.8]`. `scale` enlarges **all** geometry (lines, arcs, angle marks, the bounding box) uniformly while the node text stays fixed, so the labels occupy proportionally less space and the figure reads clearly. This is the right lever — not stretching individual coordinates. **Only** add `scale` when a diagram is small and label-crowded; a diagram that already fills ~6 cm needs no `scale`.
- **`scale` is an enlarge lever; it cannot fix crowding** (NEVER-DO #11). The reason is the same fact read backwards: because node text does *not* scale, `scale=0.85` leaves every label at full size against 85%-size geometry, so labels crowd *more*, not less. A figure that is too large must be redesigned in its own coordinates — never squeezed with `scale`. The rendered page already caps every diagram's width, so a slightly larger picture costs nothing. If you do draw on a large coordinate grid and scale it down, you must step the label fonts down with it (`font=\scriptsize` on ticks and category rows), exactly as the Data displays templates do — scale and text size are chosen together.
- **"NOT TO SCALE" is anchored to the picture, never to a guessed coordinate.** When the source figure carries the notice, reproduce it as the last line of the picture:
  ```
  \node[anchor=north west, font=\small] at (current bounding box.south west) {NOT TO SCALE};
  ```
  This sits it just under the figure at every size. A hand-picked `\node[right] at (2.8,0.8)` lands on the diagram as soon as anything moves, and it inherits `\large`, which makes an incidental notice compete with the mathematics.
- The `\usetikzlibrary{...}` line, if present, lists **only** libraries actually used in the picture. Omit it entirely if no libraries are needed.
- When the finished block will be embedded in JSON, author and verify the TikZ first, then JSON-escape it mechanically (double every backslash). Never author directly in escaped form.

---

## Allowed Packages and Libraries

All of the libraries below are enabled in the TikZJax build. Use them freely.

### TikZ libraries
- `arrows.meta`
- `calc`
- `patterns`
- `angles`
- `quotes`
- `decorations.markings`
- `intersections` — already in the preamble, so `\usetikzlibrary{intersections}` is optional but harmless

### LaTeX packages (auto-loaded by the renderer)

| Package | Used for | How it loads |
|---|---|---|
| `pgfplots` | Curve sketching with auto axes | Loaded automatically when your code contains `\begin{axis}`, `\addplot`, or `\pgfplots` |
| `tikz-3dplot` | 3D solids with proper view transforms | Loaded automatically when your code contains `\tdplotsetmaincoords`, `\tdplotsetrotatedcoords`, `\begin{tdplot...}`, or `\tdplot...` |

**You never write `\usepackage` for these — the renderer injects it for you on regex match.**

### Never use
Anything not listed above. In particular: `chemfig`, `circuitikz`, `tikzcd`, external graphics packages. Never write `\usepackage{...}` yourself — required packages are auto-loaded.

### Unsupported features (these will crash the renderer)

Even though `pgfplots` and `tikz-3dplot` are enabled, the bundled TeX engine does not ship the shader, colormap, or 3D-surface backends. Avoid:

- **`\addplot3`** and any other 3D `pgfplots` plotting command — no 3D pgfplots backend is bundled. For 3D shapes, use `tikz-3dplot` and draw the figure with plain `\draw` commands inside a `tdplot_main_coords` scope.
- **`surf`, `mesh`, `contour`** plot types — require shader libraries that aren't bundled.
- **`shader=interp`**, **`shader=faceted`**, and other `shader=...` options.
- **`colormap=...`**, **`colormap name=...`**, and colorbrewer-derived colormaps.
- **`view={a}{b}`** as a means of getting a 3D pgfplots axis — combine `tikz-3dplot` with hand-drawn `\draw` calls instead.
- **External fonts** — only Computer Modern is bundled. Avoid `\usepackage{fontenc}`, `\usepackage{inputenc}`, `\usepackage{lmodern}`, and any non-CM font family.

If a question genuinely needs a 3D surface plot, render it as a flat 2D contour diagram with labels instead.

---

## Authoring Workflow

Do not start with coordinates. Perform these stages in order.

### 1. Build the semantic specification

Write an internal register containing:

1. **Purpose:** what the learner must read from the figure.
2. **Objects:** points, rays, full lines, intervals, curves, axes, polygons, circles, solids.
3. **Required topology:** every endpoint, edge, ray, intersection, divider, and region.
4. **Assertions:** parallel, perpendicular, equal, midpoint, tangent, hidden, directed, or not-to-scale.
5. **Label ownership:** for every label or arc, the exact point, segment, line, or angular sector it belongs to.
6. **Target:** the region or object containing the unknown, not merely the known value.
7. **Arithmetic check** (generation mode): independently solve the diagram and confirm it gives the supplied answer.

Fail rather than guess if this register cannot be made internally consistent.

### 2. Audit completeness before drawing

Use these count checks:

- A segment has two endpoints and no arrowhead.
- A ray has one endpoint and one arrowhead in its direction of continuation.
- A line extends in both directions and has two terminal arrowheads only when line notation itself must be shown. Parallel-property arrow marks are different: they sit mid-line.
- A straight angle divided into `n` labelled parts needs `n-1` interior dividing rays.
- A right angle divided into `n` labelled parts needs `n-1` interior dividing rays.
- `n` angles around a point need `n` bounding rays around the full turn.
- A polygon named by `n` vertices needs all `n` boundary edges, plus only the explicitly stated diagonals.
- Two intersecting full lines must visibly continue beyond their intersection on all four arms.

This audit prevents the common failure where three labelled angles are drawn with only one divider, or a requested ray is accidentally drawn as a full line.

### 3. Choose the construction method

Use the first applicable method:

1. An exact fixed template from the **Angles** or **Data displays** playbooks below.
2. Named coordinates plus coordinate-derived marks (`\pic`, `calc`, midpoint nodes, path decorations).
3. Equation-driven plotting for graphs.
4. A new hand-built layout only when none of the above fits.

### 4. Draw in layers

Draw in this order: base geometry; semantic marks on the geometry; point and segment labels; angle labels/arcs and unknowns; solution-only annotations.

### 5. Verify source and geometry

Before the formal self-verification below, check: every source object and label appears once; nothing unstated has been invented; every asserted relationship is true in the coordinates; every label lies in the region it names; every arc marks the intended target sector; every line extends through its required intersections; and (generation mode) the figure independently implies the supplied answer.

---

## Diagram-Type Playbooks

### Angles and angle relationships

The constructions below are **canonical templates**: their coordinates and label positions are pre-verified under the standard first line `[every node/.style={font=\large}, scale=S]`. Instantiate a template exactly and substitute label text only (this is the sanctioned exception to NEVER-DO #10). Never hand-nudge one item; if the geometry must differ, re-derive every label on its sector bisector.

#### A1. Parallel lines and a transversal

```
\begin{tikzpicture}[every node/.style={font=\large}]
\draw (-2.6,1.2)--(2.6,1.2);
\draw (-2.6,-1.2)--(2.6,-1.2);
\draw (-1.8,-2.4)--(1.8,2.4);
\draw[->] (-0.3,1.2)--(0.35,1.2);
\draw[->] (-0.3,-1.2)--(0.35,-1.2);
\node at (0.54,1.92) {<1>};
\node at (1.62,1.56) {<2>};
\node at (0.18,0.84) {<3>};
\node at (1.26,0.48) {<4>};
\node at (-1.26,-0.48) {<5>};
\node at (-0.18,-0.84) {<6>};
\node at (-1.62,-1.56) {<7>};
\node at (-0.54,-1.92) {<8>};
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

For a two-label problem, retain only the two nodes named by this map. Example, corresponding `64°` and `x` at positions 2 and 6:

```
\node at (1.62,1.56) {$64^{\circ}$};
\node at (-0.18,-0.84) {$x$};
```

Do not place labels at an intersection or on either line.

#### A2. Straight line divided into parts

For two parts, choose a ray direction close to the stated angle and place both labels on sector bisectors. For three parts, draw two interior rays. Example for `42°`, `63°`, and `x=75°`:

```
\begin{tikzpicture}[every node/.style={font=\large}, scale=1.0]
\draw (-2.5,0)--(2.5,0);
\draw (0,0)--(75:2.2);
\draw (0,0)--(138:2.2);
\node at (-1.17,0.45) {$42^{\circ}$};
\node at (-0.36,1.20) {$63^{\circ}$};
\node at (0.99,0.76) {$x$};
\end{tikzpicture}
```

General rule: accumulate the sector sizes from the positive horizontal arm to determine each ray direction; put each label on its sector bisector at radius ≈1.25.

#### A3. Right angle divided into parts

Unsplit right angles take a `calc`-derived square (see Styling). A split right angle takes **no square** — it collides with the part labels and falsely appears to mark one sub-angle as `90°`. Split into `34°` and `x`:

```
\begin{tikzpicture}[every node/.style={font=\large}, scale=1.0]
\draw (0,0)--(2.4,0);
\draw (0,0)--(0,2.4);
\draw (0,0)--(34:2.1);
\node at (1.10,0.34) {$34^{\circ}$};
\node at (0.54,1.02) {$x$};
\end{tikzpicture}
```

For three parts, draw two internal rays and place three labels on their true sector bisectors. Never leave the right-angle square under the labels.

#### A4. Two intersecting lines

```
\begin{tikzpicture}[every node/.style={font=\large}, scale=1.0]
\draw (-2.2,-0.9)--(2.2,0.9);
\draw (-2.2,0.9)--(2.2,-0.9);
\node at (0,0.8) {$133^{\circ}$};
\node at (0,-0.8) {$x$};
\end{tikzpicture}
```

Top/bottom and left/right are vertically opposite. Neighbouring regions are adjacent. Do not shorten either full line into two disconnected rays.

#### A5. Angles around a point

For `n` sectors, accumulate the known angle sizes around `360°`, draw one boundary ray per sector, and put each label on its bisector. Example `95°`, `120°`, `x=145°`:

```
\begin{tikzpicture}[every node/.style={font=\large}, scale=1.0]
\draw (0,0)--(2,0);
\draw (0,0)--(95:2);
\draw (0,0)--(215:2);
\node at (0.74,0.81) {$95^{\circ}$};
\node at (-1.00,0.47) {$120^{\circ}$};
\node at (0.33,-1.05) {$x$};
\end{tikzpicture}
```

**Reflex unknowns.** When only two rays bound a known minor angle and an unknown reflex angle, the arc must sweep through the **reflex** sector, not mark the known minor sector. This computed arc is a sanctioned exception to the `\pic`-only rule (like bearings, `\pic` cannot draw the >180° side). Example for the sector `145° → 360°`:

```
\draw (145:0.65) arc[start angle=145,end angle=360,radius=0.65];
\node at (0,-1.10) {$x$};
```

#### A6. Auxiliary parallel through a point

Both rays must leave `P` towards the same horizontal side. Opposite-side rays change the relationship from a sum to a difference.

```
\begin{tikzpicture}[every node/.style={font=\large}]
\draw (-2.5,1.5)--(2.5,1.5);
\draw (-2.5,-1.5)--(2.5,-1.5);
\draw[dashed] (-2.5,0)--(2.5,0);
\draw[->] (-1,1.5)--(-0.2,1.5);
\draw[->] (-1,-1.5)--(-0.2,-1.5);
\draw[->] (-1,0)--(-0.2,0);
\coordinate (P) at (0,0);
\draw (P)--(2,1.5);
\draw (P)--(1.35,-1.5);
\node[above left] at (P) {$P$};
\node at (1.05,1.19) {$34^{\circ}$};
\node at (0.44,-1.09) {$27^{\circ}$};
\node[fill=white,inner sep=1pt] at (0.95,0) {$x$};
\end{tikzpicture}
```

For a solution-side figure, place transferred labels in the two sectors at `P`, separated above and below the dashed line, and place `x=<value>` farther right with white fill. Never stack `P`, both transferred values, and the result at the vertex.

#### A7. Angle naming

Use named points and make the vertex the middle letter:

```
\begin{tikzpicture}[every node/.style={font=\large}, scale=1.0]
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

#### A8. Line, ray, and segment notation

```
% segment AB
\draw (A)--(B);
% ray AB: endpoint A, continuing through B
\draw[-{Stealth}] (A)--($(A)!1.5!(B)$);
% full line AB
\draw[{Stealth}-{Stealth}] ($(A)!-0.5!(B)$)--($(A)!1.5!(B)$);
```

The first named point of a ray must be its visible endpoint. Never use a two-headed path for a ray question.

#### Parallel-property marks

Parallel-property marks are short arrowed overlays **on the exact line path**. They are not terminal arrows and must never be placed on the transversal.

Single-arrow family on horizontal lines (as in A1/A6):

```
\draw[->] (-0.3,1.2)--(0.35,1.2);
\draw[->] (-0.3,-1.2)--(0.35,-1.2);
```

For a second family, put two separate arrowed overlays sequentially on each line. Never offset one overlay perpendicular to the line:

```
\draw[->] (-0.65,0)--(-0.1,0);
\draw[->] (0.05,0)--(0.6,0);
```

For a sloping line, calculate both overlay endpoints from that line or use the same named path. Verify collinearity arithmetically. Detached chevrons or floating dashes are defects.
### Data displays

**Which family am I in? Read this before applying anything below.** This section governs **categorical / statistical displays** — column and bar graphs, dot plots, stem-and-leaf, sector graphs, and line graphs over *categories or discrete observations* (months, years, trials). It does **not** govern a **plotted function or coordinate graph** — a line or curve drawn from an equation over a continuous axis (a simple-interest line, a compound-growth or depreciation curve, a distance–time graph, a parabola). Those belong to **Curve sketching from an equation**, which is the authority for their window, ticks, plotting and labelling.

Applying the rules below to a function graph produces contradictions: the "x-axis label under the category-label row" anchor is meaningless where the axis carries numeric ticks rather than categories, and **"line graphs must have a non-constant slope" is flatly wrong for a simple-interest graph, whose constant slope IS the skill**. The variety rules likewise apply to data displays only — a function graph's shape is fixed by its equation and is not a style choice. What the two families DO share: the anti-collision label placement rule, the sizing & fit rule, and the pgfplots caveat about never double-rotating the y-label.

- Derive the plotted data table before drawing.
- Check every category/value pair, frequency total, axis scale, and unit against the source.
- Start a numerical axis at zero unless the question explicitly teaches or critiques a broken scale.
- Use equal bar widths and gaps; place category labels under their own bars and values above only when the source uses value labels.
- For dot plots, place one dot per observation and stack repeated values at a fixed vertical interval. Recount dots after rendering.
- For line graphs, plot each observation at its actual coordinate before joining consecutive points.
- For stem-and-leaf plots, preserve leaf order and include the key; a text/table layout is preferable to pretending it is a coordinate graph.

#### Label placement — the anti-collision rule (MANDATORY)

The one recurring defect is the **y-axis label colliding with the title** (both crammed at the top-left corner). It is eliminated by fixed anchors — never place a title and an axis label at the same corner:

- **Title** — its own line, **centred over the plot**, at `y = <ymax> + 1.1` (well clear of the top tick). Extend the y-axis arrow to `<ymax> + 1.4` so the title has headroom.
- **y-axis label** — **rotated 90°**, placed to the **left of the axis at its vertical midpoint**, never in the top corner: `\node[rotate=90] at (<xoff>, <ymid>) {Number of …};`. A vertical label beside the axis physically cannot reach a horizontal title. **`<xoff>` must clear the tick text in physical centimetres, not a copied coordinate value** — see the Axes anti-collision anchors in Core styling for the full rule (the templates below use −1.4 at their own `scale`/font; a different `scale`, tick font, or custom `x=`/`y=` unit needs a different number, worked out fresh, not reused).
- **x-axis label** — on its **own line, centred UNDER the category-label row**, at `(<xmid>, -1.0)`. **Never place it at the arrow tip on the `y = 0` baseline** — there it crowds the last category/tick label. The category labels sit at `y = 0` `[below]`; a label line at `y = -1.0` clears them.
- **`pgfplots` caveat.** The rotation instruction above is for the **raw-TikZ** templates below. If you instead build an axis with `pgfplots`, do **not** add `rotate=90` to `ylabel style` — pgfplots already rotates the y label, and a second rotation turns it upside-down. Use a bare `ylabel={…}`. **Prefer the raw-TikZ templates** for data displays so the corpus stays one idiom.

#### Sizing & fit — text must not outgrow the plot (MANDATORY)

Node text renders at a fixed size regardless of `scale`, so a small `scale` makes labels relatively huge and they collide. Size the plot to the labels:

- The `every node/.style={font=\large}` first line is a **default, not a ban**: tick numbers and crowded category rows may override with `font=\scriptsize` (as the templates below do), and titles/axis-name lines stay at the `\large` default. Never downscale text into illegibility to force a fit.
- **Category labels must fit their slot.** With word categories, the centre-to-centre bar spacing must exceed the widest label. **Prefer a short/abbreviated category label** (`Eng`, `Sci`, `Vic`) so it fits at `\scriptsize`; only widen the spacing if the full word is required — never let adjacent category labels touch.
- **Titles stay short and must not reach the y-axis.** A title centred at `xmid` must not extend left of `x = 0`. Keep titles ≤ ~22 characters; if longer, widen the plot (larger `xmax`) rather than let it collide.

#### Variety (MANDATORY — the reviewer rejects samey graphs)

Parallel generation converges on one exemplar. Force spread:

- **Never reuse a scenario across sibling skills.** Rotate through a bank — pets, goals per match, books read, cars per colour, pizza slices sold, daily rainfall, temperature, website visits, shoe sizes, test scores, plants grown. One scenario per figure.
- **Vary the column count 3–7** across figures — not always 4.
- **Vary the value pattern** — do NOT default to a clean descending run (8,6,4,2). Mix ascending, a peak in the middle, a tie, an odd-valued bar, a scale in 5s or 10s.
- **Line graphs must have a non-constant slope** — a rise-then-fall, a dip, a plateau, or varying step sizes. A perfectly linear 10,20,30,40 is banned unless the skill is specifically teaching constant rate. **This is a data-display rule only** — see the family note at the top of this section.
- **Vary dot-plot n and shape** (a gap, an outlier, a bimodal cluster), and vary stem-leaf data ranges.

#### Copy-ready templates (safe placement baked in)

These are canonical templates in the NEVER-DO #10 sense: instantiate, substitute data and labels, keep the anchors.

**Column graph** (`n` categories; here 5, values 6,9,4,7,3 — deliberately non-monotone):
```
\begin{tikzpicture}[every node/.style={font=\large}, scale=0.72]
\draw[->] (0,0)--(0,11.4);
\draw[->] (0,0)--(13.5,0);
\foreach \y in {2,4,6,8,10} {\draw (-0.2,\y)--(0,\y); \node[left,font=\scriptsize] at (-0.2,\y) {$\y$};}
\node[left,font=\scriptsize] at (-0.2,0) {$0$};
\draw (0.8,0) rectangle (2.3,6);
\draw (3.1,0) rectangle (4.6,9);
\draw (5.4,0) rectangle (6.9,4);
\draw (7.7,0) rectangle (9.2,7);
\draw (10.0,0) rectangle (11.5,3);
\node[below,font=\scriptsize] at (1.55,0) {Red};   \node[below,font=\scriptsize] at (3.85,0) {Blue};
\node[below,font=\scriptsize] at (6.15,0) {Green}; \node[below,font=\scriptsize] at (8.45,0) {White};
\node[below,font=\scriptsize] at (10.75,0) {Black};
\node[rotate=90] at (-1.4,5) {Number of cars};
\node[below] at (6.15,-1.0) {Colour};
\node at (6.15,11.1) {Cars by colour in a car park};
\end{tikzpicture}
```

**Line graph** (non-constant slope: rise, dip, recover):
```
\begin{tikzpicture}[every node/.style={font=\large}, scale=0.85]
\draw[->] (0,0)--(0,7.4);
\draw[->] (0,0)--(8.5,0);
\foreach \y in {10,20,30,40,50,60} {\draw (-0.15,\y/10)--(0,\y/10); \node[left,font=\scriptsize] at (-0.15,\y/10) {$\y$};}
\node[left,font=\scriptsize] at (-0.15,0) {$0$};
\foreach \x/\lbl in {1/Mon,2.4/Tue,3.8/Wed,5.2/Thu,6.6/Fri} {\node[below,font=\scriptsize] at (\x,0) {\lbl};}
\draw[thick] (1,2.0)--(2.4,4.5)--(3.8,3.0)--(5.2,5.5)--(6.6,5.0);
\foreach \p in {(1,2.0),(2.4,4.5),(3.8,3.0),(5.2,5.5),(6.6,5.0)} {\fill \p circle (2.5pt);}
\node[rotate=90] at (-1.0,3) {Visitors};
\node[below] at (3.8,-1.0) {Day};
\node at (3.8,7.1) {Daily visitors to the museum};
\end{tikzpicture}
```

**Dot plot** (with a gap and an outlier; vary n):
```
\begin{tikzpicture}[every node/.style={font=\large}, scale=0.8]
\draw[->] (-0.5,0)--(9,0);
\foreach \x in {0,1,2,3,4,5,6,7,8} {\node[below,font=\scriptsize] at (\x,0) {$\x$};}
\foreach \x/\c in {1/2,2/4,3/3,4/1,7/1} {\foreach \k in {1,...,\c} {\fill (\x,{0.35*\k}) circle (2.2pt);}}
\node[below] at (4,-0.9) {Goals scored per match};
\end{tikzpicture}
```
(Adjust counts/coords to your data; keep the axis from zero, the title centred, and any y-label rotated at the left midpoint.)

#### Growing patterns and concrete linear relationships

- A skill that generates an equation from a visual pattern must show the concrete pattern; prose alone does not test the intended representation.
- Show at least three consecutive labelled stages unless the question deliberately asks the learner to complete a missing stage. Make every tile, match, dot, chair, or other unit individually countable at the displayed stages.
- Derive the object count for every shown stage before drawing. Check that each count satisfies the intended equation, including fixed starting objects and shared-boundary adjustments.
- Keep stage spacing, object size, orientation, and label placement consistent so the changing feature is visually isolated. Do not use ellipses to hide an unverified stage.
- The figure may establish the pattern, but it must not display the general equation or reveal the requested rule on the question side.
### Tables and spreadsheets

Financial-maths questions routinely show a **spreadsheet or printed table** — a loan repayment schedule, a tax table, a ready reckoner, a payslip, a two-way frequency table. These are figures, not prose, and they are drawn here.

**First, decide whether it belongs in the figure at all.** A plain table of values that the *question text* needs (a table of `x` and `y` for a graph, a small frequency table the student fills in) is rendered as a KaTeX `array` in the text, never inside the picture. Draw a table in TikZ only when the figure is reproducing a **document the student is reading** — a spreadsheet with lettered columns and numbered rows, a printed rate table, a bank statement.

#### The one rule that prevents every table defect

**A cell's border and a cell's text are the same `\node`.** Never draw the ruling with `grid` or `rectangle` and then place the text with separate `\node at (x,y)` coordinates. Those are two independent pieces of arithmetic, and they drift: the text ends up between columns, the row-number strip stops lining up with the rows it numbers, and the last row lands outside the frame entirely.

```
\begin{tikzpicture}[every node/.style={font=\small},
  cell/.style={draw, minimum height=0.8cm, inner xsep=6pt, anchor=west},
  hdr/.style={cell, fill=gray!25, font=\small\bfseries}]
\def\colA{2.2cm} \def\colB{3.0cm} \def\colC{2.6cm} \def\colD{3.0cm}
\node[hdr, minimum width=\colA] (h1) at (0,0) {Month};
\node[hdr, minimum width=\colB, right=0pt of h1] (h2) {Principal (\textit{P})};
\node[hdr, minimum width=\colC, right=0pt of h2] (h3) {Interest (\textit{I})};
\node[hdr, minimum width=\colD, right=0pt of h3] (h4) {\textit{P} + \textit{I} $-$ \textit{R}};
\node[cell, minimum width=\colA, below=0pt of h1.south west, anchor=north west] (a1) {1};
\node[cell, minimum width=\colB, right=0pt of a1] (a2) {\$280 000.00};
\node[cell, minimum width=\colC, right=0pt of a2] (a3) {\$1680.00};
\node[cell, minimum width=\colD, right=0pt of a3] (a4) {\$279 580.00};
\node[cell, minimum width=\colA, below=0pt of a1.south west, anchor=north west] (b1) {2};
\node[cell, minimum width=\colB, right=0pt of b1] (b2) {\$279 580.00};
\node[cell, minimum width=\colC, right=0pt of b2] (b3) {\$1677.48};
\node[cell, minimum width=\colD, right=0pt of b3] (b4) {\$279 157.48};
\end{tikzpicture}
```

Requires `positioning`, which is already in the renderer's preamble. Do **not** use `matrix of nodes` — the `matrix` library is not bundled and the picture will fail to compile.

#### Sizing

- **Derive each column width from its widest cell**, then declare it once as a `\def` and reuse it on every node in that column. A currency column holding `\$280 000.00` needs about `3.0cm` at `\small`; a `Month` column needs `2.2cm`. Never pick column widths first and hope the text fits.
- **`\small` is the floor.** Never `\scriptsize` or `\tiny` in a table. If the content will not fit at `\small`, the table is too wide — shorten the headings (`P + I` rather than `Principal plus Interest`), drop a column the question does not use, or show fewer rows.
- **Keep the whole table under about 12 cm wide.** The page scales a wide diagram down to fit the text column, and that shrink applies to the text too — a 16 cm table at `\small` arrives on screen smaller than `\scriptsize`.
- Show only the rows the question needs. A repayment schedule demonstrating a pattern needs three or four rows, not twelve.

#### Spreadsheet chrome

When the figure is specifically a **spreadsheet**, the lettered column headers and numbered row headers are part of what the student reads — a question that says "the value in cell `C4`" is unanswerable without them.

- Build the header strip and the row-number strip out of the **same `cell` nodes** as the data, one per column and one per row. They then line up by construction.
- The letter row sits above the first data row; the number column sits left of the first data column; the corner cell is blank.
- Every row number must name a row that exists. If the schedule shows four months, there are four numbered rows — not ten numbered rows with four filled in.
- A free-floating explanatory note ("this table assumes the same number of days in each month") goes **outside** the table, below it, as its own `\node`, never floated over the cells.

#### Verify before output

- Every value in the table is derived, not invented; recompute each row from the previous one.
- Every cell that the question or solution refers to by name (`B3`, "the fourth month") exists and holds the value the solution uses.
- No node sits outside the table's outer boundary.
### Curve sketching from an equation

**Always plot the actual equation.** Do not hand-draw a parabola-shaped freehand curve — use `\draw plot` (or `\addplot` with pgfplots) on the real function.

**Choose the axis window by judgment:**

1. **If the source image shows an axis window** (gridlines, labelled tick marks, visible scale) — reproduce it. Set `xmin`/`xmax`/`ymin`/`ymax` to match.
2. **Otherwise, derive the window from the equation.** Identify:
   - Roots (set $y=0$)
   - Turning points (set $y'=0$)
   - Vertical asymptotes (denominator $= 0$)
   - Horizontal asymptotes (limit as $x \to \pm\infty$)
   - y-intercept (set $x=0$)
   - End behaviour
   Then choose `xmin`/`xmax`/`ymin`/`ymax` to show **every key feature** with ~10% margin on each side.

**Set `domain` so the curve ends on the window edge — that is where the arrows go.** Arrowheads sit at the *ends of the plotted path*, and pgfplots' default `clip=true` cuts anything past the axis box. If the path runs far outside the window (e.g. no `domain`, so it samples the full `xmin:xmax` and shoots off-screen), its arrowheads are clipped away and you see a curve with **no arrows**. So: choose `domain` so each branch reaches the window boundary (where the curve crosses `ymin`/`ymax`), and add **`clip=false`** to the axis so the arrow tip renders instead of being shaved. Do **not** rely on auto-domain for arrowed curves.

**Hand-drawn axes do not clip — solve the domain against the window yourself.** The `clip` discussion above is a `pgfplots` property. A raw-TikZ sketch (`\draw[...] plot (...)` inside `\draw`n axis rules) draws the whole path no matter how far it leaves the drawn axes, so a curve can plunge far below the y-axis you drew and simply hang in space. Before writing `domain=a:b`, **evaluate the function at both ends and at its turning points** and confirm every value lies inside the axis range you drew. Example: `y = 7 - 10e^{-x}` on `domain=-0.5:4` reaches `y = -9.5`, but the y-axis was drawn only to `-4`. Either restrict the domain (here `-0.09:4` keeps it inside), extend the axis, or wrap the plot in `\clip (xmin,ymin) rectangle (xmax,ymax);`.

**Never fake a curve with `plot coordinates` and `smooth`.** Hand-listing points and letting `smooth` interpolate produces visible wobble wherever the spacing changes — the interpolant overshoots between widely spaced points and kinks at closely spaced ones. If the question does not name an equation (a generic `y = f(x)` for transformation work), choose a **smooth analytic proxy** with the required features — a hyperbola for an asymptote pair, a scaled cubic for a two-turning-point shape — and plot that. Reserve `plot coordinates` for genuinely discrete data, and then without `smooth`.

**For discontinuous or multi-branch functions** (rationals, piecewise, `tan(x)`), use **one `\addplot` per continuous branch** — each branch gets its own `domain` ending where it meets the box near the asymptote, so all four open ends carry arrows. Show vertical asymptotes as dashed lines.

**Label** intercepts, turning points, asymptotes, and any other named feature with `\node` (use `node` coordinates inside the axis environment) — **but don't duplicate what the axis already says.** The axis ticks already print every integer gridline value, so an integer intercept/turning point sitting on a tick needs no extra `\node` (labelling `2` again next to the tick `2` is clutter). Add a `\node` only when the point's value is **not** an obvious axis tick: a non-integer coordinate ($(\tfrac12, -\tfrac94)$), a named/asymptote value, or a labelled point like $P$. When you do label a turning point or off-axis point, give the full coordinate pair; for an axis crossing that isn't on a gridline, mark just the crossing value.

**Put arrowheads on the open ends of every plotted curve.** A curve that continues beyond the plotted window must show it — add `<->` (both ends) to the `\addplot`/`\draw plot` options so each end of the curve carries an arrowhead pointing in its direction of continuation. Use a single-ended arrow only when one end genuinely terminates (e.g. a domain-restricted branch ending at a closed/open dot). Each continuous branch of a multi-branch function gets its own arrowed ends. **Per-end rule:** an end that stops at a filled/open dot (a plotted endpoint) or at a flat turning point takes **no** arrowhead on that end; every other open end — one reaching the window edge or continuing off-screen — takes one. So a branch running to the edge on one side and ending at a dot on the other uses a single-ended arrow, not `<->`.

**Default form — parabola $y = x^2 - 4$ with pgfplots:**

```
\begin{tikzpicture}[every node/.style={font=\large}]
\begin{axis}[axis lines=middle, xlabel={$x$}, ylabel={$y$},
             xmin=-3.5, xmax=3.5, ymin=-5, ymax=2.5, samples=100, clip=false]
\addplot[smooth, thick, <->, domain=-2.6:2.6] {x*x - 4};   % domain ends at the top edge → arrows there
% roots -2, 2 and y-intercept -4 are integers already shown on the axis ticks — no extra \node needed
\end{axis}
\end{tikzpicture}
```

**Default form — hyperbola $y = \dfrac{1}{x-2} + 1$ (two branches, two asymptotes):**

```
\begin{tikzpicture}[every node/.style={font=\large}]
\begin{axis}[axis lines=middle, xlabel={$x$}, ylabel={$y$},
             xmin=-1.5, xmax=5.5, ymin=-2.5, ymax=4, samples=200, clip=false]
\addplot[smooth, thick, <->, domain=-1.5:1.7] {1/(x-2) + 1};   % left branch: ends at bottom edge near asymptote
\addplot[smooth, thick, <->, domain=2.3:5.5] {1/(x-2) + 1};    % right branch: ends at top edge near asymptote
\addplot[dashed, domain=-2.5:4] ({2}, {x}) node[above right] {$x=2$};   % vertical asymptote
\addplot[dashed, domain=-1.5:5.5] (x, 1) node[above right] {$y=1$};     % horizontal asymptote
\end{axis}
\end{tikzpicture}
```

**Lighter form** — for simple sketches where a full axis environment is overkill, plain `\draw plot` inside hand-drawn axes also works. Use it when the source is a quick freehand sketch, not a labelled graph. Same parabola:

```
\begin{tikzpicture}[every node/.style={font=\large}]
\draw[->] (-3.2,0) -- (3.2,0) node[right] {$x$};
\draw[->] (0,-4.8) -- (0,2.2) node[above] {$y$};
\draw[thick, <->, domain=-2.6:2.6, smooth, variable=\x] plot ({\x}, {0.5*(\x*\x - 4)});
\node[below left] at (-2,0) {$-2$};
\node[below right] at (2,0) {$2$};
\node[below] at (0,-2) {$(0,-4)$};
\end{tikzpicture}
```

The `0.5*` on the y-output scales the curve into the box. With pgfplots you don't need that trick — `ymin`/`ymax` do the work.

**pgfplots gotchas** (the engine lazy-loads pgfplots when it sees `\begin{axis}`/`\addplot` — these all apply):
- **Trig is in degrees.** `sin(x)`/`cos(x)` take degrees, so `domain=0:360` is one period. For a radian-scaled graph write `sin(deg(x))`.
- **Asymptotes need both** `restrict y to domain=…` **and** `unbounded coords=jump`, or a vertical spike is drawn to `ymax`.
- **Clip eats arrowheads — use `clip=false` for arrowed curves.** Default `clip=true` cuts the path (and its `<->` tips) at the axis box. Set `clip=false` and choose `domain` so the curve ends on the window edge; otherwise the arrows are clipped away and the curve looks open-ended-but-tipless.
- **Resize with `width=`/`height=`, not `scale=`.** On an `axis`, `scale=n` rescales coordinates but not the tick/label fonts or their anchors → labels drift and misalign. Instead set `width=8cm, height=8cm` in the axis options (add `scale only axis` to make those the plot-area size, excluding labels). For plain non-axis tikz, `scale=n` scales geometry only (text stays put); to shrink/grow the whole picture including labels, wrap it in `\scalebox{n}{…}`.
- **Node/coordinate refs inside `axis` use `(axis cs:x,y)`** — bare `(2,3)` is not data coordinates.
- **Axis-end arrows aren't automatic.** `axis lines=middle` has no arrow tips; add `axis line style={-{Stealth}}` for arrows on the axes themselves (separate from the curve's `<->`).
- **Core pgfplots only.** Don't `\usepgfplotslibrary{…}` (fillbetween/groupplots/etc.) — not bundled, will fail to compile.
- **Keep `samples` ~100 (200 max).** pgfplots compiles slowly in WASM; high sample counts stall the render watchdog.

**Multi-graph and tick conventions:**
- When two or more graphs share axes, give every graph both a distinct colour and a distinct line pattern. Render each graph's identifying label in the same colour as its line; dash pattern alone is not sufficient.
- Keep axis-number labels comfortably separated. When consecutive integer labels make the vertical scale cramped, label every `2` units while retaining the grid; explicitly include any non-sequence target value the learner must read (for example `13`).
- Whenever the surrounding question, answer, or option needs a table of values, render it as a table in the text (KaTeX `array`), never inside the figure, and never substitute an inline `x: …; y: …` list for a table.

#### Exponential growth and decay curves

Write an exponential as **`exp(x*ln(k))`**, never `k^x` — the `^` form is unreliable in the TikZJax subset, while the `exp`/`ln` form compiles cleanly. **Round the base to a short literal before writing it**: a raw float leaks into the source as `ln(0.8200000000000001)`, which is both ugly and a diff hazard.

```
% compound growth  FV = 4000(1.06)^n   and  decay  S = 60000(0.82)^n
\addplot[thick,red,domain=0:8,samples=60] {4000*exp(x*ln(1.06))};
\addplot[thick,blue,domain=0:6,samples=60] {60000*exp(x*ln(0.82))};
```

Choose y-ticks so **every value the learner must read lands on a gridline**. Where a straight line and a curve share axes and the question is about a **crossover**, the crossing must be visibly in the right place — verify by evaluating both at the year either side, not by eye alone.

#### Gridded coordinate graph — raw-TikZ template

For read-off-the-grid skills (distance–time, simple interest), a hand-rolled grid beats `pgfplots`. This is a canonical template in the NEVER-DO #10 sense; note `gray!30,very thin` for the grid:

```
\begin{tikzpicture}[every node/.style={font=\large}, scale=1.2]
\draw[gray!30,very thin,xstep=1,ystep=1] (0,0) grid (7,6);
\draw[-{Stealth}] (0,0) -- (7.5,0);
\draw[-{Stealth}] (0,0) -- (0,6.6);
\foreach \x in {1,...,7} \node[below,font=\scriptsize] at (\x,-0.15) {$\x$};
\foreach \y/\lab in {1/100,2/200,3/300,4/400,5/500,6/600}
  \node[left,font=\scriptsize] at (-0.15,\y) {$\lab$};
\draw[thick,red] (0,0) -- (6,5.4);                  % plotted relationship
\node[rotate=90,font=\scriptsize] at (-1.5,3) {Interest (dollars)};
\node[below,font=\scriptsize] at (3.5,-1.0) {Time (years)};
\node[font=\small] at (3.5,7.1) {Holiday savings};
\end{tikzpicture}
```

**Question figure = the axes, grid and plotted line, with the asked value NOT marked. Solution figure = the same, plus dashed guide lines to the read point and its label.**

#### Shading the area under or between curves

**In a `\fill`/`\filldraw` path, always join a `plot[...]` segment to the coordinate before it with an explicit `--`.** Writing `(2,4) plot[domain=2:5] (...)` (no `--`) instead of `(2,4) -- plot[domain=2:5] (...)` compiles with no error, but TikZJax silently starts a **new subpath** at the plot's first point, orphaning the segment that came before it. Since `\fill` auto-closes every subpath with a straight line back to its own start, the visible shaded region ends up bounded by a straight **chord** between the plot's start and end instead of the intended curve/axis boundary — usually a thin sliver or crescent, not the true area. This is invisible in the source and easy to miss without rendering: the curve itself still draws correctly (arrows, labels, everything looks right at a glance), only the *fill* is wrong. Applies equally whether the plot uses `smooth`, `samples=`, `variable=`, or `coordinates{...}` — the missing `--` is what breaks it, not the plot type.

```
% WRONG — missing -- before plot[...]: shading collapses to a chord-bounded sliver
\fill[gray!20] (2,0) -- (2,4) plot[smooth,domain=2:5,variable=\x] ({\x},{4/(\x-1)}) -- (5,0) -- cycle;

% RIGHT — explicit -- joins the plot segment to the preceding coordinate
\fill[gray!20] (2,0) -- (2,4) -- plot[smooth,domain=2:5,variable=\x] ({\x},{4/(\x-1)}) -- (5,0) -- cycle;
```

Same rule when a `\fill` path alternates between two plotted curves (region between two functions) — every `coordinate plot[...]` join needs its `--`, not just the first one:

```
\fill[gray!20, domain=-2:2, variable=\x]
  (-2,0) -- plot ({\x}, {0.7*(4 - \x*\x)})
  -- (2,0) -- plot[domain=2:-2, variable=\x] ({\x}, {0.35*(\x*\x - 4)})
  -- cycle;
```

After writing any shaded-region `\fill`, render it and check the shaded area visually touches the boundary you intended (the axis, the other curve, the bounding line) along its **full** width — not just at the corners.

### Bearing diagrams

- **Radial-survey override (HSC convention): do not draw true bearings as angle arcs.** In a compass radial or plane-table survey, put each recorded bearing beside the survey-point label at the end of its ray, for example `\node[above right] at (A) {$A\;(050^\circ)$};`. Keep every bearing three-figure, preserve minutes when supplied, retain the north arrow at the central station, and use ordinary angle arcs only for separately measured or derived angles between survey lines. This override applies to radial surveys only.
- **For non-radial bearing diagrams, bearings are reflex-capable, so do NOT use `\pic{angle}` for the bearing arc** — `\pic` can only draw the ≤180° side, and bearings are routinely >180° (e.g. 291°). Use the **computed-arc recipe** below instead. (This computed arc is the one sanctioned exception to the "no freehand arc" rule — it is derived from the bearing β, not guessed.)
- **Leg direction from a bearing β** (clockwise from north) is the polar angle `90 - β`. Place each leg endpoint with `($(O)+({90-β}:{d*\s})$)`, where `\s` is your km→cm scale. This is exact for any bearing, acute or reflex.
- **Bearing arc:** anchor on the north ray and sweep clockwise by exactly β:
  `\draw ($(O)+(90:r)$) arc (90:{90-β}:r);`
  Because the end angle `90-β` is less than the start `90`, the arc sweeps **clockwise** through β degrees — correct for both acute (51°) and reflex (291°) bearings.
- **Bearing label** on the arc's bisector, just outside it: `\node at ($(O)+({90-β/2}:{r+0.35})$) {$β^\circ$};`. Give arcs that share a vertex **different radii** (e.g. 0.9 and 1.2) so they don't overlap.
- **North arrow** only at vertices where a bearing is actually measured — don't draw an `$N$` arrow at a point with no bearing (it just adds clutter).
- **Distances** labelled midway along each leg with `node[midway, <outside anchor>, fill=white, inner sep=1pt]` so the line is broken behind the text (essential where a leg crosses a north line).
- **Scale:** bearing figures are small and label-heavy, so they almost always need magnifying. Set `\s` so the longest leg is a few cm, **then add `scale=1.5`–`2` to the options line** to enlarge the whole figure (legs, arcs, angle marks) uniformly while the `\large` text stays fixed — this is what stops the labels swamping the diagram. Label endpoints with letters.

**Worked non-radial example — from L, bearing 051° to S (8 km) and bearing 291° to B (6 km); B–S is 12.2 km. Note 291° is reflex:**

```
\begin{tikzpicture}[every node/.style={font=\large}, scale=1.8]
\usetikzlibrary{calc}
\def\s{0.4}                                    % km -> cm (then scale=1.8 magnifies the whole figure)
\coordinate (L) at (0,0);
\coordinate (S) at ($(L)+({90-51}:{8*\s})$);
\coordinate (B) at ($(L)+({90-291}:{6*\s})$);
\draw[dashed, ->] (L) -- ($(L)+(0,2)$) node[above] {$N$};
\draw[thick] (L) -- (S) node[midway, below right, fill=white, inner sep=1pt] {$8\text{ km}$};
\draw[thick] (L) -- (B) node[midway, above left, fill=white, inner sep=1pt] {$6\text{ km}$};
\draw[thick] (B) -- (S) node[midway, above, fill=white, inner sep=1pt] {$12.2\text{ km}$};
\draw ($(L)+(90:0.9)$) arc (90:{90-51}:0.9);   % 51 deg, clockwise from N
\node at ($(L)+({90-51/2}:1.25)$) {$51^\circ$};
\draw ($(L)+(90:1.2)$) arc (90:{90-291}:1.2);  % 291 deg reflex, clockwise from N
\node at ($(L)+({90-291/2}:1.55)$) {$291^\circ$};
\node[below right] at (L) {$L$};
\node[above right] at (S) {$S$};
\node[left] at (B) {$B$};
\end{tikzpicture}
```

Every leg, arc, and label is computed from the bearings — nothing is guessed, and the 291° reflex arc sweeps the correct (long) way round. `\s=0.4` sets the km→cm proportion and `scale=1.8` magnifies the whole figure so the `\large` labels no longer swamp it.

### Circle geometry

- `\draw (O) circle (r);` for the circle, with `O` as a named `\coordinate` and a labelled dot at the centre.
- Chords, tangents, secants: straight `\draw` lines between points on (or beyond) the circle.
- Use `intersections` library — or pre-compute coordinates with `calc` — for chord/tangent meeting points.
- **Tick marks** for equal chords and equal radii: use the `tickmark` style (`\draw[tickmark]`) for one family, `tickmark2` for the next. See the tick-mark style block under "Styling and Labelling Conventions".
- **Small square** for right angles (e.g. between a tangent and the radius at the point of contact).
- Inscribed and central angles: `angles`/`quotes` library.

**Worked example — tangent-chord angle:**

```
\begin{tikzpicture}[every node/.style={font=\large}]
\usetikzlibrary{angles, quotes}
\coordinate (O) at (0,0);
\draw (O) circle (2);
\fill (O) circle (1.5pt) node[below] {$O$};
\coordinate (A) at (60:2);
\coordinate (B) at (-60:2);
\coordinate (T) at (2.8,-3.2);
\draw (A) -- (B);
\draw (B) -- (T);
\draw (B) -- ($(B) + (60:2.2)$);
\node[above right] at (A) {$A$};
\node[below left] at (B) {$B$};
\node[below right] at (T) {$T$};
\pic[draw, "$\alpha$", angle radius=0.6cm, angle eccentricity=2] {angle = T--B--A};
\end{tikzpicture}
```

### Polygons

- Regular polygons: generate vertices in a `\foreach` loop using `({360/n*\i}:r)`.
- Equal sides: the `tickmark` style on each equal side (`\draw[tickmark]`, `\draw[tickmark2]`, … for different equal-length families). See the tick-mark style block under "Styling and Labelling Conventions".
- Right-angle squares at corners where the source indicates a right angle.
- Interior angles marked with `angles`/`quotes`.

**Worked example — regular hexagon with one interior angle marked:**

```
\begin{tikzpicture}[every node/.style={font=\large}]
\usetikzlibrary{angles, quotes}
\foreach \i in {0,...,5} {
  \coordinate (P\i) at ({60*\i}:2);
}
\draw (P0) -- (P1) -- (P2) -- (P3) -- (P4) -- (P5) -- cycle;
\foreach \i in {0,...,5} {
  \node at ({60*\i}:2.4) {$\i$};
}
\pic[draw, "$120^\circ$", angle radius=0.7cm, angle eccentricity=2] {angle = P0--P1--P2};
\end{tikzpicture}
```

### 3D solids

**Default approach: explicit geometry with a checked viewing direction.** Use MathsMap’s `src/lib/solid-geometry.js` authoring helper to generate editable projected 2D TikZ with versioned construction metadata. A legacy `tikz-3dplot` drawing is also valid when visibility is derived for its actual view. Set `\tdplotsetmaincoords{θ}{φ}` (typical: `{70}{120}`) and work in 3D coordinates `(x,y,z)` inside a `[tdplot_main_coords]` scope.

- Derive convex edge visibility from adjacent outward face normals and the viewing vector. At least one viewer-facing adjacent face makes an edge visible; silhouettes remain solid. Concave solids need occlusion splitting. Never use vertex names (`f0`, `b0`) to infer visibility, and recalculate when the view changes.
- **Visible edges** are solid `\draw`.
- **Hidden edges** (behind a face) are `\draw[dashed]`.
- Label every named vertex with `\node` just outside the face.
- Mark equal edges with the `tickmark` style if relevant.

**Worked example — rectangular prism, 6 wide × 4 deep × 3 tall, vertices A–H:**

```
\tdplotsetmaincoords{70}{120}
\begin{tikzpicture}[every node/.style={font=\large}, tdplot_main_coords, scale=0.7]
\coordinate (A) at (0,0,0);
\coordinate (B) at (6,0,0);
\coordinate (C) at (6,4,0);
\coordinate (D) at (0,4,0);
\coordinate (E) at (0,0,3);
\coordinate (F) at (6,0,3);
\coordinate (G) at (6,4,3);
\coordinate (H) at (0,4,3);
\draw (A) -- (B) -- (F) -- (E) -- cycle;
\draw (B) -- (C) -- (G) -- (F);
\draw (E) -- (F) -- (G) -- (H) -- cycle;
\draw[dashed] (A) -- (D) -- (C);
\draw[dashed] (D) -- (H);
\node[below left] at (A) {$A$};
\node[below right] at (B) {$B$};
\node[right] at (C) {$C$};
\node[left] at (D) {$D$};
\node[above left] at (E) {$E$};
\node[above right] at (F) {$F$};
\node[above right] at (G) {$G$};
\node[above left] at (H) {$H$};
\end{tikzpicture}
```

**Cones, cylinders, spheres:** use the checked analytic templates in `curvedSolidTikz`. An upright cylinder has a visible top rim and a lower rim split into front solid/back hidden halves. A cone rim splits at its true tangent endpoints, not ellipse extrema or arbitrary semicircles. A sphere silhouette is solid; a reference equator uses visible/hidden arcs or an explicitly reviewed construction-guide style. Open rims, cutaways and transparent teaching sections must state their roles. Unsupported curved orientations/composites need recorded geometric and visual review.

#### Curved surfaces: silhouette, not apex

A flat-faced solid is drawn by joining **corresponding vertices** of the front and back faces. A curved solid has no vertices along its curved part, and copying the vertex-joining habit is the single most common 3D drawing error: joining the top of the front arc to the top of the back arc.

That apex-to-apex line is not an edge. It is one ruling among infinitely many lying on the surface, chosen for no reason, and it reads as a crease folding the smooth roof in half. The correct line is the **silhouette** (also called the contour or limb): the ruling where the line of sight grazes the surface, so that the surface curves away from the viewer on both sides of it. It is the boundary of the drawn shape, and it meets the front and back arcs **tangentially**.

**Locating the silhouette in oblique projection.** With the depth offset along direction $\alpha$ (house default $\alpha = 30°$) and a circular cross-section of radius $r$ centred at the origin, the silhouette ruling touches the circle where the radius is **perpendicular to the offset direction** — at polar angle $\alpha + 90°$. For the default $\alpha = 30°$ that is **120°**, i.e. `\coordinate (S) at (120:r);`, *not* the apex at `90°`.

The rule generalises: apex is at 90° only when the offset is horizontal ($\alpha = 0$), which never happens in an oblique view. For a circular extrusion, retain tangent rulings at 120° and/or 300° only where they lie on the actual curved surface; sector endpoints remain genuine straight boundaries.

**Worked example — half-cylinder (semicircular prism), diameter 1.4, length 3.5, lying flat side down:**

```
\begin{tikzpicture}[every node/.style={font=\large}, scale=1.6]
\coordinate (A) at (-0.7,0);
\coordinate (B) at (0.7,0);
\coordinate (S) at (120:0.7);
\coordinate (A2) at ($(A)+(30:2.2)$);
\coordinate (B2) at ($(B)+(30:2.2)$);
\coordinate (S2) at ($(S)+(30:2.2)$);
\draw (A) -- (B);
\path (A) -- (B) node[midway, below] {$1.4\text{ m}$};
\draw (A) arc (180:0:0.7);
\draw[dashed] (A2) -- (B2);
\draw[dashed] (A2) arc (180:120:0.7);
\draw (B2) arc (0:120:0.7);
\draw[dashed] (A) -- (A2);
\draw (B) -- (B2);
\path (B) -- (B2) node[midway, below right] {$3.5\text{ m}$};
\draw (S) -- (S2);
\end{tikzpicture}
```

Note two details:

- **The back arc is split at the silhouette angle** (`180:120` and `0:120`) rather than drawn as one `180:0` sweep. This makes `S2` an explicit arc endpoint, so the silhouette ruling lands exactly on the arc instead of crossing it at a visible kink.
- **The radius is half the labelled diameter.** A label reading "1.4 m" across the flat base means `arc (180:0:0.7)`, not `0.7`… `arc (180:0:1.4)`. Writing the diameter where the radius belongs doubles the solid and is a `[GEOM ERROR]` under SV-iv scale/proportion.

**Applying the same rule to other curved solids:**

| Solid | Silhouette lines to draw | Never draw |
|---|---|---|
| Full cylinder (axis oblique at 30°) | Two rulings, at 120° and 300° on the end circle — the upper and lower outline | Apex-to-apex (90°) or base-to-base (270°) |
| Half-cylinder, flat side down | One ruling at 120° | Apex-to-apex |
| Cone (apex above a circular base) | Two lines from the apex **tangent** to the base ellipse, not to its leftmost/rightmost points | Apex to the extreme points of the base circle in 3D |
| Sphere | The 2D silhouette circle only | Any "top of front" to "top of back" line |

A cone is the one case where a genuine apex exists — but it is the apex of the *solid*, and the tangent lines run from it to the base ellipse's tangent points, which are not the base's extreme coordinates.

**Lighter form — manual oblique projection** when a 3D view is overkill (small isometric thumbnails, very simple prisms). Depth axis at 30° above horizontal, depth-scale 0.5:

```
\begin{tikzpicture}[every node/.style={font=\large}, scale=0.7]
\coordinate (A) at (0,0);
\coordinate (B) at (6,0);
\coordinate (C) at (6,3);
\coordinate (D) at (0,3);
\coordinate (E) at ($(A) + (30:2)$);
\coordinate (F) at ($(B) + (30:2)$);
\coordinate (G) at ($(C) + (30:2)$);
\coordinate (H) at ($(D) + (30:2)$);
\draw (A) -- (B) -- (C) -- (D) -- cycle;
\draw (B) -- (F) -- (G) -- (C);
\draw (D) -- (H) -- (G);
\draw[dashed] (A) -- (E) -- (F);
\draw[dashed] (E) -- (H);
\end{tikzpicture}
```

**Labelling this box: put the height on the front-*left* edge (`D--A`), never the front-right edge (`B--C`).** The front-right edge sits right where the hidden dashed cross-edges (`E--F`, `E--H`) pass through — on a shallow/thin prism (front-face height comparable to or less than the depth offset's vertical rise, `2·sin(angle)·r`) a `node[midway, right]` label there lands in that clutter and reads as ambiguous, or on very flat boxes collides outright with the depth label. The front-left edge is always clear:

```
\path (A) -- (B) node[midway, below] {$25\text{ cm}$};   % length — bottom edge, fine
\draw (B) -- (C);                                         % right edge — leave unlabelled
\draw (C) -- (D);
\path (D) -- (A) node[midway, left] {$10\text{ cm}$};     % height — front-LEFT edge
\path (B) -- (F) node[midway, below right] {$16\text{ cm}$}; % depth — fine, already clear of the hidden lines
```

For a solid where the box's vertical edges aren't A–D-style (composites, roofs on a box, etc.), apply the same rule: label the wall-height dimension on whichever vertical edge sits **furthest from the hidden/dashed cluster**, not the one nearest it.


Use label-only `\path` commands after boundary drawing; never redraw an edge to attach a label. Preserve dimensions, redundant measurements, units, vertex identities and semantic colours. Move measurements only to geometrically equivalent edges. Project angle arms into 2D before building marks; never construct an angle pic in a tdplot scope. Inspect at final 10 pt label size, including resized and printed variants.

### Networks and graphs

Weighted network diagrams (Stage 6 Standard *Networks, Paths and Trees*) are built from exactly three kinds of line, in this order. Everything else — a spanning tree, a Dijkstra label, a traced route — is this base figure with the styling changed, never a redrawn one.

```
\begin{tikzpicture}[every node/.style={font=\large}]
\coordinate (A) at (0,1.5);
\coordinate (B) at (2,2.6);
\coordinate (C) at (2,0.4);
\draw (A) -- (B) node[midway, above left] {$2$};
\draw (B) -- (C) node[midway, fill=white, inner sep=1pt] {$4$};
\draw (A) -- (C) node[midway, below left] {$6$};
\fill (A) circle (2.5pt) node[left] {$A$};
\fill (B) circle (2.5pt) node[above] {$B$};
\fill (C) circle (2.5pt) node[below] {$C$};
\end{tikzpicture}
```

- One `\coordinate` per vertex, one `\draw (X) -- (Y) node[midway, …] {$w$};` per edge, one `\fill (X) circle (2.5pt) node[<anchor>] {$X$};` per vertex dot and name. Vertices are drawn **last** so their marks sit over the edge ends.
- A weight that falls on a crossing uses `node[midway, fill=white, inner sep=1pt]` — the white fill lifts it clear of the edge beneath.
- Vertex names must be single tokens usable as TikZ node names (`A`, `S`, `M1`).
- Lay the graph out so that: every pair of vertices is at least 1.2 cm apart; every edge passes at least 0.6 cm clear of any vertex that is not one of its endpoints; every weight sits at least 0.6 cm from any vertex and 0.5 cm from any vertex **name**; **no weight lands on a different edge**; and no two weights come within 0.55 cm of each other. A vertex name goes on the side of the vertex with no edge leaving it. Keep the picture roughly 5–9 cm wide — a wide figure costs nothing.
- The weight-on-a-foreign-edge rule is the one that bites. When several edges cross one long edge near its middle, their midpoints all land on it and its own weight ends up sandwiched between theirs as a single run of digits (`2 8 3`). Stagger the crossing vertices so those midpoints fall at different heights, or move the labels along their own edges with `pos=0.3` / `pos=0.7`.
- `scripts/networks-steps.mjs` exports `findCrowdedVertices(fig)`, which checks all of the above deterministically; the question-figure lane (`scripts/check-figures.mjs`) and the step lane both gate on it.
- **Directed** graphs declare the arrow style once, immediately after `\begin{tikzpicture}` — see the mid-line arrowhead rule under Carryover types — and draw every edge as `\draw[midarrow] (A) -- (B) node[pos=0.3, fill=white, inner sep=1pt] {$4$};`. `pos=0.3` keeps the weight off the mid-line arrowhead.

**Selected edges — spanning trees, minimum spanning trees, shortest paths.** Thicken the chosen edge with `line width=1.6pt`. Never delete a rejected edge; the reader has to see what was passed over.

```
\draw[line width=1.6pt] (A) -- (B) node[midway, above left] {$2$};
```

**Dijkstra vertices.** The booklet redraws the graph "with empty circles at each vertex" and writes the lowest running total inside each circle. So for a Dijkstra figure, replace every `\fill` vertex with a circle node plus the vertex name pushed outside it:

```
\node[circle, draw, fill=white, minimum size=7mm, inner sep=0pt] at (A) {$4$};
\node[above=4mm] at (A) {$A$};
```

A vertex not yet reached keeps an **empty** circle (`{}`) — that is the state, not an omission. The `fill=white` is what hides the edge ends under the circle, so these nodes must come after every `\draw`.

**Step sequences.** A worked solution that executes Prim's or Dijkstra's algorithm shows one figure per step, each the same graph with the tree or the labels grown so far. Every figure in the sequence must reuse the question figure's `\coordinate` block **byte for byte** — this is NEVER-DO #10 in its networks form. Do not hand-author these: `scripts/networks-steps.mjs` renders them from the base figure and a step description, and `docs/content-generation.md` (Networks step-diagram setout) describes the authoring contract.

### Carryover types

- **Number lines:** `\draw[->]` for the line; short ticks for marked integers; `\node` for the label `0`, `1`, … below; open/closed circles for inequalities.
- **Sectors and arcs:** `\draw ... arc (start:end:r)` plus the two radii.
- **Tree / probability diagrams:** `\draw` for branches; `\node` at each terminal for labels and probabilities (place probabilities midway along the branch with `[fill=white]`).
- **Directed network diagrams:** edges must carry a mid-line arrowhead, not a terminal arrowhead. Use `decorations.markings` to place the arrow at the midpoint of each edge:
  ```
  \usetikzlibrary{decorations.markings}
  \tikzset{midarrow/.style={
    decoration={markings, mark=at position 0.5 with {\arrow{>}}},
    postaction={decorate}
  }}
  \draw[midarrow] (A) -- (B);
  ```
  Do **not** use `->` on directed network edges — that puts the arrowhead at the end, not the middle.
- **Triangles:** plain `\draw` between coordinates; `tickmark` style for equal sides; `calc` right-angle square for right angles; `\pic{angle}` for angle marks. Attach side labels to the `\draw` with `node[midway, <outside anchor>]`. Draw each side exactly once (do not draw a `-- cycle` and then re-draw sides for labels — that creates duplicate edges).

**Worked example — right-angled triangle, two marked angles, three labelled sides:**

```
\begin{tikzpicture}[every node/.style={font=\large}]
\usetikzlibrary{angles, quotes, calc}
\coordinate (A) at (1.2,2.1);   % apex (alpha)
\coordinate (R) at (0,0);       % right angle
\coordinate (C) at (4.5,-1.1);  % theta
% three sides, each drawn once, label attached via node[midway]
\draw (A) -- (R) node[midway, left] {$10\text{ cm}$};
\draw (R) -- (C) node[midway, below] {$24\text{ cm}$};
\draw (C) -- (A) node[midway, above right] {$26\text{ cm}$};
% right angle at R — absolute-distance arms so the square is always square
\coordinate (ra) at ($(R)!0.3cm!(A)$);
\coordinate (rc) at ($(R)!0.3cm!(C)$);
\draw (ra) -- ($(ra)+(rc)-(R)$) -- (rc);
% angle marks (swap the vertex order if a mark lands on the exterior side)
\pic[draw, "$\alpha$", angle radius=0.55cm, angle eccentricity=2] {angle = C--A--R};
\pic[draw, "$\theta$", angle radius=0.55cm, angle eccentricity=2] {angle = R--C--A};
\end{tikzpicture}
```

Every marker and label here is derived from the named coordinates — there is not a single guessed `\node at (x,y)` or freehand `arc`, so the angle arcs, right-angle square, and side labels all stay aligned to the edges automatically.

---

## Styling and Labelling Conventions

- **All maths inside `\node` text wrapped in `$...$`** — `\node {$x$}`, not `\node {x}`.
- **Node placement** with anchor keywords: `above`, `below right`, `left`, etc.
- **Angle marks** are produced **only** by `\pic[draw, "$\theta$", angle radius=..., angle eccentricity=...]{angle = A--V--B}`. The order `A--V--B` sweeps **anticlockwise** from edge `VA` to edge `VB`; if the mark renders on the wrong (exterior) side, swap to `B--V--A`. `angle eccentricity` (>1) pushes the label outward along the bisector so it sits inside the sector and clear of the arc — **use `angle eccentricity=2` by default** (smaller values like `1.4` leave the label crowding or sitting on the arc) — so the `\pic` places the label automatically. **Never** add a separate `\node` for an angle symbol, and never draw the arc by hand with `\draw ... arc (a:b:r)`.
- **Right angles:** small square built from the two edge endpoints with `calc` so it always lands on the edges. Use the **absolute-distance** form `(V)!size!(A)` — not `pos=fraction` — so both arms are the same length regardless of how long the edges are. (`pos=fraction` scales with edge length, so unequal edges produce a rectangle, not a square.)
  ```
  % right angle at V between neighbours A and B
  \coordinate (a) at ($(V)!0.3cm!(A)$);
  \coordinate (b) at ($(V)!0.3cm!(B)$);
  \draw (a) -- ($(a)+(b)-(V)$) -- (b);
  ```
  Adjust `0.3cm` to suit the diagram scale (e.g. `0.25cm` for small triangles, `0.4cm` when `scale≥1.5`). Requires `calc`. Never draw a right-angle square from guessed absolute coordinates.
- **Segment labels** attach to the `\draw` that creates the segment: `\draw (A) -- (B) node[midway, above left] {$10\text{ cm}$};`. Choose the anchor (`above`, `below`, `left`, ...) on the **outside** of the figure. Where the label must cross a line, add `fill=white, inner sep=1pt` to break the line behind it. Never position a side label with guessed absolute coordinates.
- **Equal lengths:** mark equal sides with the **`tickmark` style** applied to the segment's own `\draw`, never with hand-placed crossbar coordinates. The style uses `decorations.markings` to drop a crossbar at the **midpoint of the line, automatically perpendicular** to it — because the mark is drawn in the line's local frame (local `y` is perpendicular to the path), it is always centred and at 90° with no per-side angle maths, on horizontal, vertical, and sloped sides alike. Define the styles once near the top of the picture (requires `\usetikzlibrary{decorations.markings}`):
  ```
  \usetikzlibrary{decorations.markings}
  \tikzset{
    tickmark/.style={postaction={decorate, decoration={markings,
      mark=at position 0.5 with {\draw[black] (0pt,-4pt) -- (0pt,4pt);}}}},
    tickmark2/.style={postaction={decorate, decoration={markings,
      mark=at position 0.5 with {\draw[black] (-2pt,-4pt) -- (-2pt,4pt);
                                 \draw[black] (2pt,-4pt) -- (2pt,4pt);}}}},
    tickmark3/.style={postaction={decorate, decoration={markings,
      mark=at position 0.5 with {\draw[black] (-3pt,-4pt) -- (-3pt,4pt);
                                 \draw[black] (0pt,-4pt) -- (0pt,4pt);
                                 \draw[black] (3pt,-4pt) -- (3pt,4pt);}}}},
  }
  \draw[tickmark]  (A) -- (B);   % single-tick family
  \draw[tickmark2] (C) -- (D);   % double-tick family
  ```
  Use a **different tick count for each equal-length family** (`tickmark` for the first, `tickmark2` for the second, `tickmark3` for the third). The 2/3 variants are parallel crossbars offset *along* the line. Never mark equal sides with bare `\draw (x1,y1) -- (x2,y2)` crossbars at guessed coordinates.
- **Asymptotes and hidden edges:** `\draw[dashed]`.
- **Line weights:** use the default. Apply `thick` only for the curve in a sketch (so the curve stands out from the axes) and `very thick` essentially never.
- **Coordinates:** use `\coordinate (A) at (x,y);` for any point referenced more than once. Reference by name afterwards.
- **Colour:** monochrome by default. Use colour (`red`, `blue`) only when the source diagram itself uses colour to distinguish elements.
- **Label spacing numerics:** put angle labels inside their sectors, preferably on the bisector. Keep labels at least `0.35` coordinate units apart (more for multi-character values), and keep them clear of all lines and marks — `fill=white, inner sep=1pt` is only for a label that legitimately belongs over a line (a distance, or an auxiliary-line result). Let every line extend at least `0.6` units beyond an intersection or extreme label. Enlarge a cramped figure uniformly with the `scale=` lever; never stretch one coordinate or detach a label.
- **Parallel-property marks** are arrowed overlays on the exact line path — see the Angles playbook for the collinearity rules and families.
- **Label anchors point OUTWARD.** A dimension or side label must be anchored away from the body of the figure. On a prism, a depth label on the top-right edge takes `below right`, not `above right` — the latter drops it onto the top face. Test it: step ~0.35 units from the label's coordinate in the anchor's direction; if you land inside a drawn face, you have the anchor backwards.
- **Curve identity labels ride the path they name.** Write `\draw[...] plot (...) node[pos=0.8, above right] {$y=2\cos x$};` — never a free `\node at (0.3,1.9)`. Two hand-placed curve labels at the same height in a narrow picture will overlap, and they cannot follow the curve if the window changes.

---

## Axes — the anti-collision anchors (MANDATORY, every diagram with axes)

These apply to **any** figure carrying axes — a categorical display, a gridded read-off graph, or a plotted function. The recurring defect is an axis title landing on the tick labels.

- **Never attach an axis title to the axis `\draw` with `midway`.** `\draw[-{Stealth}] (0,0) -- (6.4,0) node[below=6pt, midway] {Time (hours)};` places the title at the axis *midpoint*, which is exactly the lane the tick numbers occupy — the title lands on top of the middle tick. An axis title is always a **standalone `\node`**.
- **x-axis title** — its own line, centred under the tick row: `\node[below] at (<xmid>, -1.0) {Time (hours)};`
- **y-axis title** — rotated, to the left of the tick column, at the axis midpoint: `\node[rotate=90] at (<xoff>, <ymid>) {Distance from depot (km)};`
- **`<xoff>` is a physical-clearance problem, not a fixed number to copy.** It must clear the tick column by roughly the tick text's own rendered width plus a small margin for the rotated title's line thickness — and that clearance is real centimetres on the page, not raw coordinate units. At the **default 1 cm/unit** picture (no `x=`/`y=` remap, `scale=1`), −1.4 clears a 1–2-digit `\scriptsize` tick column, and 3-digit or percentage ticks need proportionally more (roughly another −0.3 to −0.4 per extra digit). **Any `x=`, `y=`, or `scale=` other than the default breaks that number** — it rescales coordinate units against physical space, so the same −1.4 reaches a different physical distance in a different picture. A picture at `scale=0.9` with `\large` (not `\scriptsize`) tick digits needs a *larger-magnitude* offset than −1.4 despite looking like "the same kind of chart", because the tick text renders bigger while scale shrinks how far each coordinate unit reaches. A custom unit system (`x=1.4cm, y=0.02cm`, or a pixel-scale picture like `x=0.0015cm`) has no relationship to −1.4 at all — derive the offset from that picture's own unit-to-cm ratio, or skip the arithmetic and place the title at a coordinate you can see sits well clear of the tick column's narrow `x`-band.
- **When unsure, go bigger.** Extra empty space next to a y-title costs nothing visually; a gap that's a little too small silently collides with the ticks. Round the offset away from the axis, never toward it.
- **Never combine `rotate=` with a directional offset key** (`above=6pt`, `left=4pt`, …) on the same node. The offset is applied in the **rotated** frame, so `\node[rotate=90, above=35pt] at (0,<ymid>) {...}` does not move the title up — it moves it sideways, straight into the tick numbers. Rotate the node and give it an explicit coordinate; never layer a directional key on top of `rotate=`.
- **Title** (if the figure has one) — centred over the plot at `y = <ymax> + 1.1`, with the y-axis arrow extended to `<ymax> + 1.4`. A horizontal title and a vertical y-label physically cannot collide.
- **`pgfplots` caveat.** Inside `\begin{axis}`, use bare `xlabel={…}` / `ylabel={…}` — pgfplots already rotates the y label, and adding `rotate=90` turns it upside-down. Its default label offset does **not** scale with the tick text's rendered width, so a wide or comma-grouped `ytick` (`80,000`, `36,000`) collides with `ylabel=` at the same default that clears a 1–2-digit tick — add **`ylabel near ticks`** as an axis option whenever `ymin`/`ymax`/an explicit `ytick` reaches 4+ digits; it anchors the label to the tick column's actual rendered extent instead of a guessed offset. **Add it as the LAST axis option, after the geometry keys** (`xmin`/`xmax`/`width`/`height`/`ytick`/etc.) — placing it first has hung the TikZJax renderer on some diagrams (a real engine-ordering quirk, not a syntax error).

---

## Self-Verification — Geometric Sub-Checks

Before writing the final output, execute every sub-check below **in order** against your draft `tikzpicture`. If any check raises a `[GEOM ERROR]`, fix the code and re-run the sub-checks from the start. Do not output the diagram until every sub-check passes silently.

### SV-i: Point Register

Extract every named coordinate from your code:

```
\coordinate (A) at (x,y)
\coordinate (B) at (x,y)   etc.
```

Build a register: `{ A:(x,y), B:(x,y), ... }`.

Then extract every point referenced in the source (question stem, image labels, worked solution): "triangle ABC", "point M is the midpoint of AB", etc.

- Flag: `[GEOM ERROR — Point {X} referenced in source but not defined in tikzpicture]`
- Flag: `[GEOM ERROR — Point {X} defined in tikzpicture but never referenced]`

### SV-ii: Edge Completeness

From the source, derive the expected edge list:

| Source phrase | Required edges |
|---|---|
| "triangle ABC" | AB, BC, CA |
| "rectangle ABCD" | AB, BC, CD, DA |
| "diagonal AC is drawn" | AC |
| "tangent at T" | tangent line through T |

Extract every `\draw (P) -- (Q)` (including chained `\draw (A) -- (B) -- (C) -- cycle`).

- Flag: `[GEOM ERROR — Missing edge: {XY} not drawn]`
- Flag: `[GEOM ERROR — Spurious edge: {XY} drawn but not part of the described figure]`

### SV-iii: Endpoint Arithmetic

For every `\draw (P) -- (Q)`, look up P and Q in the point register and verify the segment connects those specific coordinates — not an unrelated alias with a similar name.

For multi-segment paths and `-- cycle`, verify each implied segment pair is in the expected edge list.

- Flag: `[GEOM ERROR — \draw uses undefined point alias {X}]`

### SV-iv: Geometric Constraint Verification

For every geometric property asserted in the source, verify it arithmetically with the register coordinates.

**Right angle at vertex B in triangle ABC:**
$\vec{BA} \cdot \vec{BC} = 0$.
- Flag: `[GEOM ERROR — Right angle at B not satisfied: BA·BC = {value}, expected 0]`

**Equal sides (isosceles, equilateral, square, equal radii, tick-marked sides):**
Compute $|AB|^2 = (B_x-A_x)^2 + (B_y-A_y)^2$ for each asserted equal pair.
Each equal-length tick mark must be drawn with the `tickmark`/`tickmark2`/`tickmark3` style applied to the side's own `\draw` (this guarantees the crossbar is centred and perpendicular). A tick drawn with a bare `\draw (x1,y1) -- (x2,y2)` crossbar at guessed coordinates is an automatic error (mirrors the `\pic`-only rule for angle marks). Verify that each distinct equal-length family uses a distinct tick count.
- Flag: `[GEOM ERROR — Tick mark on side {AB} drawn with guessed coordinates instead of the tickmark style]`
- Flag: `[GEOM ERROR — Sides AB and CD asserted equal but |AB|²={v1} ≠ |CD|²={v2}]`

**Midpoint M of segment AB:**
$M = ((A_x+B_x)/2, (A_y+B_y)/2)$.
- Flag: `[GEOM ERROR — M defined at {coords} but midpoint of AB is {correct coords}]`

**Parallel lines:**
Direction vectors must be scalar multiples.
- Flag: `[GEOM ERROR — {line1} and {line2} asserted parallel but direction vectors are not proportional]`

**Scale / proportion** (e.g. "AB = 6 cm, BC = 8 cm"):
Verify $|AB| / |BC|$ in the coordinate system matches the stated ratio (exact pixel scale need not match; proportions must — within 5%).
- Flag: `[GEOM ERROR — AB:BC ratio in diagram is {actual}, stated ratio is {expected}]`

**Point lies on a circle of centre $O$ radius $r$:**
$(P_x - O_x)^2 + (P_y - O_y)^2 = r^2$.
- Flag: `[GEOM ERROR — Point {P} stated to lie on circle but distance from O is {d}, expected {r}]`

**Tangent to a circle at point $T$:**
The tangent line direction must be perpendicular to $\vec{OT}$, i.e. $\vec{OT} \cdot \vec{d} = 0$ where $\vec{d}$ is the tangent direction.
- Flag: `[GEOM ERROR — Tangent at T not perpendicular to radius OT: OT·d = {value}]`

**Curved solid — silhouette ruling, not apex ruling:**
For any solid whose cross-section is drawn with `arc` (cylinder, half-cylinder, cone, curved-roof prism), find every `\draw (P) -- (Q)` where P lies on the front arc and Q on the back arc. Let $\alpha$ be the depth-offset direction (the angle in `($(X)+(\alpha:d)$)`, house default 30°). Each non-boundary contour ruling is legal only if P sits at polar angle $\alpha + 90°$ (or $\alpha + 270°$) on its arc's centre. A ruling at the arc's apex (90°) is the apex-to-apex error and must be moved to $\alpha + 90°$.
Also verify the back arc is split at $\alpha + 90°$ so the ruling terminates on an arc endpoint.
- Flag: `[GEOM ERROR — Apex-to-apex ruling on a curved surface: {PQ} joins the arc apexes; silhouette ruling belongs at {α+90}°]`
- Flag: `[GEOM ERROR — Silhouette ruling at {PQ} does not terminate on an arc endpoint: back arc not split at {α+90}°]`

**Curved solid — radius versus labelled diameter:**
When a label on the flat chord/base of a curved cross-section states a width $w$, the arc radius must be $w/2$.
- Flag: `[GEOM ERROR — Base labelled {w} but arc drawn with radius {r}; expected {w/2}]`


**Edge visibility against the view:** verify silhouettes are solid and obscured boundaries dashed. For convex models inspect outward normals of both adjacent faces; for concave/open models check occlusion. At circular rear arcs, classify each segment by its outward normal and the depth offset; being on the back cross-section does not make a silhouette hidden. Keep construction lines, internal diagonals, dimension guides and cutaway highlights separate. Check every solid in a multi-solid drawing.
- Flag: `[GEOM ERROR — Visibility disagrees with the viewing direction]`
- Flag: `[GEOM REVIEW — Unsupported or ambiguous construction requires source-hash-bound geometric and final-size visual acceptance]`

**Polygon interior-angle sum** (for marked or labelled angles):
Sum of stated interior angles equals $(n-2) \cdot 180°$.
- Flag: `[GEOM ERROR — Polygon angles labelled {list} sum to {s}°, expected {(n-2)*180}°]`

**Bearing validity:**
For each bearing of $\theta°$ from point $P$ to point $Q$, verify the angle measured **clockwise from north** at $P$ to the direction $\vec{PQ}$ equals $\theta$ (within 2°).
- Flag: `[GEOM ERROR — Stated bearing P→Q is {θ}° but coordinate geometry gives {actual}°]`

**Curve passes through a stated point** (sketches):
For every labelled point $(a, b)$ on a plotted curve $y = f(x)$, verify $f(a) = b$ (within rounding).
- Flag: `[GEOM ERROR — Point ({a},{b}) labelled on curve but f({a}) = {f(a)}]`

**Stated turning point / root / intercept:**
- Roots: $f(r) = 0$.
- Turning point at $(a, b)$: $f(a) = b$ and (where derivable) $f'(a) = 0$.
- y-intercept: $f(0) =$ labelled value.
- Flag: `[GEOM ERROR — {feature} at {coords} does not satisfy {equation}]`

**Shaded-region fill path continuity:**
For every `\fill`/`\filldraw` path that contains a `plot[...]` (or `plot (...)`) segment, verify it is joined to the coordinate immediately before it with an explicit `--`, not written as a bare `(coord) plot[...]`.
- Flag: `[GEOM ERROR — \fill path coordinate not joined to plot[...] with --; TikZJax starts a new subpath there and shades the wrong region]`

**Angle-figure completeness (angles playbook):**
- A straight/right angle divided into `n` labelled parts must have `n-1` interior dividing rays; `n` angles around a point need `n` bounding rays. Count labels vs rays.
- Ray/line/segment endpoint semantics: a ray has one endpoint and one arrowhead in its continuation direction (first named point = visible endpoint); a segment has no arrowheads; only explicit line notation is double-headed.
- A split right angle carries **no** right-angle square.
- A reflex unknown's arc sweeps the reflex sector, not the known minor sector.
- Parallel-property marks are collinear with, and only on, the lines they mark — never on the transversal, never offset perpendicular to the line.
- A1-template instantiations: label positions match the fixed position/relationship map for the named angle pair.
- Flag: `[GEOM ERROR — {n} labelled parts but only {k} dividing rays]`
- Flag: `[GEOM ERROR — Ray/line/segment arrowheads do not match the notation stated in the source]`
- Flag: `[GEOM ERROR — Right-angle square retained under split-angle labels]`
- Flag: `[GEOM ERROR — Reflex arc marks the minor sector]`
- Flag: `[GEOM ERROR — Parallel mark not collinear with its line / placed on the transversal]`
- Flag: `[GEOM ERROR — A1 labels at positions {p,q} do not match the {relationship} map]`

**Data displays (data-displays playbook):**
- Re-derive the data table from the drawn figure and compare with the source: every category/value pair, frequency total, axis scale, and unit must match. For dot plots, recount every stack.
- A numerical axis starts at zero unless the question explicitly teaches a broken scale.
- Anchors: title centred over the plot at `ymax+1.1`; y-axis label rotated 90° at the axis's vertical midpoint, left of the widest tick; x-axis label on its own line at `y=-1.0`, never at the arrow tip.
- Category labels fit their slots without touching; bar widths and gaps equal.
- For growing patterns: every shown stage's object count satisfies the intended equation; no ellipses hiding an unverified stage; the general rule is not revealed on the question side.
- Flag: `[GEOM ERROR — Drawn value for {category} is {v1}, source says {v2}]`
- Flag: `[GEOM ERROR — Axis starts at {v} without a taught broken scale]`
- Flag: `[GEOM ERROR — Title/y-label/x-label not at its fixed anchor]`
- Flag: `[GEOM ERROR — Category labels {a} and {b} touch]`
- Flag: `[GEOM ERROR — Pattern stage {n} draws {k} objects; equation gives {m}]`


### SV-tables: Table integrity

For every table or spreadsheet figure:

- **Cell/text unity.** Every cell's border and its text come from one `\node`. Any `grid` or `rectangle` ruling combined with separately positioned `\node at (x,y)` cell text is an automatic error.
  - Flag: `[GEOM ERROR — Table ruling drawn independently of its cell text]`
- **Containment.** No node lies outside the table's outer boundary.
  - Flag: `[GEOM ERROR — Cell {X} at {coords} falls outside the table frame]`
- **Header alignment.** Each lettered column header sits over the column it names; each row number sits beside the row it numbers; the count of numbered rows equals the count of data rows.
  - Flag: `[GEOM ERROR — Row-number strip has {n} entries but the table has {m} data rows]`
- **Arithmetic.** Recompute every derived cell from its inputs and confirm it matches the value shown, and that any cell the question names by reference exists.
  - Flag: `[GEOM ERROR — Cell {ref} shows {value} but recomputes to {correct}]`
- **Legibility.** No `\scriptsize` or `\tiny` anywhere in the table; total width under about 12 cm.
  - Flag: `[GEOM ERROR — Table uses {size} or exceeds the width budget]`
### SV-v: Label Positioning

**Construction check first.** Any angle mark drawn with a raw `\draw ... arc`, or any right-angle square or label placed with guessed `\node at (x,y)` coordinates, is an automatic `[GEOM ERROR]`. Re-express it using `\pic{angle = A--V--B}` (angle marks), the `calc` right-angle snippet (right angles), or `node[midway, ...]` on the segment's `\draw` (segment labels) before continuing. **Exception for non-radial bearing diagrams:** bearing arcs use the computed `arc (90:90-β:r)` recipe from the Bearings playbook (since bearings may be reflex, where `\pic` fails) — that arc is computed from β and is allowed, but a bearing label still goes at the computed bisector `($(O)+({90-β/2}:r')$)`, never a guessed coordinate. Radial surveys instead use HSC-style endpoint labels and have no true-bearing arcs.
- Flag: `[GEOM ERROR — Angle/right-angle/label placed by guessed coordinates instead of \pic / calc / node[midway]]`

For every `\node` label, verify:

**(a) The label is closest to the point it names.** Compute distance from the node's stated position to every named coordinate. The closest named point should match the label text.
- Flag: `[GEOM ERROR — Label "{X}" is positioned closest to point {Y}]`

**(b) The label does not sit on top of an edge.** If the node position is collinear with $P$ and $Q$ and between them on a drawn segment, flag.
- Flag: `[GEOM ERROR — Label "{X}" overlaps edge {PQ}]`

**(c) Angle labels sit inside the angle they annotate.** For angle labels (e.g. $\theta$, $\alpha$, $90°$) at vertex $V$, the node must lie within the angular sector formed by the two edges meeting at $V$.
- Flag: `[GEOM ERROR — Angle label "{θ}" at vertex {V} is not inside the angle formed by edges {VA} and {VB}]`

**(d) Distance labels on bearing diagrams sit midway along their leg** (with `fill=white` to break the line).
- Flag: `[GEOM ERROR — Distance label "{d}" not at midpoint of leg {PQ}]`

**(e) A rotated y-axis title clears the tick-number column, and no rotated node carries a directional offset key.** Re-derive `<xoff>`'s physical clearance from this picture's own `x=`/`y=`/`scale=` factors (see the Axes anti-collision anchors) — do not reuse a coordinate value from a different-scale example. If any `\node` combines `rotate=` with `above=`/`below=`/`left=`/`right=`, that offset applies in the rotated frame and moves the node sideways, not clear of the axis.
- Flag: `[GEOM ERROR — y-axis title at {xoff} sits inside or against the tick-number column]`
- Flag: `[GEOM ERROR — node combines rotate= with a directional offset key (above=/below=/left=/right=)]`

### SV-vi: Scale and Canvas Audit

**Canvas containment.** If `xmin`/`xmax`/`ymin`/`ymax` are set (axis environments, clip paths, declared bounding box), every named coordinate must satisfy $x_{\min} \le x \le x_{\max}$ and $y_{\min} \le y \le y_{\max}$.
- Flag: `[GEOM ERROR — Point {X} at {coords} falls outside declared canvas]`

For diagrams without an explicit canvas, every named coordinate must fall within the ~6 cm × 6 cm target box (or the explicitly enLarged box for wide diagrams).
- Flag: `[GEOM ERROR — Point {X} at {coords} exceeds bounding box {box}]`

**Degeneracy check.**
- All polygon vertices must not be collinear (for $n \ge 3$).
- No two named points share identical coordinates.
- Flag: `[GEOM ERROR — Polygon vertices {list} are collinear — figure has zero area]`
- Flag: `[GEOM ERROR — Points {X} and {Y} are coincident at {coords}]`

**Curve-plot window audit** (for sketches): every key feature named in the curve-sketching playbook's window rules (roots, turning points, asymptotes, labelled points) must fall within both the plotted `domain=a:b` *and* the axis window (`xmin`/`xmax`/`ymin`/`ymax` for `\begin{axis}` plots; the hand-drawn axis arrow range for `\draw plot` sketches). If a labelled root sits outside the domain, the curve does not actually pass through it; if it sits outside the axis window, the label appears in empty space.
- Flag: `[GEOM ERROR — Labelled feature {X} at $x={a}$ lies outside plotted domain {a:b}]`
- Flag: `[GEOM ERROR — Labelled feature {X} at {coords} lies outside axis window xmin={xmin}, xmax={xmax}, ymin={ymin}, ymax={ymax}]`

---

## Rendered inspection — render, inspect, repair

Source inspection is not enough where a render harness exists (MathsBase admin preview; MathsMap `#/tikz-check`): the diagram is complete only after it compiles and its rendered image is visually checked beside the question and answer. Reject and repair any render with a missing or detached mark; an arrowhead on the wrong line; a label touching/crossing a line or another label; a wrong, ambiguous, or unmarked angle sector; a missing edge, ray, divider, or line continuation; geometry that implies a different relationship or answer; or clipped content, tiny geometry, or excessive empty canvas. **Repair by changing the construction, not by repeatedly nudging individual coordinates.** Where no harness is available, the SV checks above stand alone.

---

## Pre-Output Checklist

Before writing the output, verify every item:

- [ ] Output is a single `\begin{tikzpicture}...\end{tikzpicture}` block, with nothing before or after.
- [ ] No `\documentclass`, no `\usepackage`, no `\begin{document}`.
- [ ] No markdown code fences (no ` ``` `), no `[tikz]` delimiters, no prose.
- [ ] First line is `\begin{tikzpicture}[every node/.style={font=\large}]`.
- [ ] `\usetikzlibrary{...}` lists only libraries actually used, or is omitted entirely.
- [ ] Only libraries from the Allowed Packages and Libraries list appear.
- [ ] All maths in nodes wrapped in `$...$`.
- [ ] Every angle mark uses `\pic{angle = A--V--B}`; no freehand `\draw ... arc` angle markers, no separate `\node` for the angle symbol.
- [ ] Every right-angle square is built from edge endpoints with `calc`, not guessed coordinates.
- [ ] Every segment label uses `node[midway, <outside anchor>]` (with `fill=white` where it crosses a line); no guessed label coordinates.
- [ ] Every equal-length tick mark uses the `tickmark`/`tickmark2`/`tickmark3` style on the segment's own `\draw` (never guessed crossbar coordinates); different equal-length families use different tick counts.
- [ ] Every length, angle, and label that appears in the source diagram is reproduced; nothing has been invented.
- [ ] Diagram fits within ~6 cm × 6 cm unless a Larger window is genuinely needed.
- [ ] Any axis title clears the tick-number column/row — checked against this picture's own `x=`/`y=`/`scale=` factors, not assumed from a different example; no `rotate=` node also carries a directional offset key.
- [ ] **For curve sketches:** the actual equation is plotted with `\draw plot` (or `\addplot`). The domain matches the source window if visible, otherwise shows all key features (roots, turning points, asymptotes, intercepts) with margin. Multi-branch functions use one `\draw plot` per branch. Every plotted curve's open ends carry arrowheads (`<->`, or single-ended where a branch genuinely terminates).
- [ ] **For shaded regions:** every `\fill`/`\filldraw` path joins a `plot[...]` segment to its preceding coordinate with an explicit `--` (never `coordinate plot[...]` directly) — otherwise TikZJax silently starts a new subpath and the shaded area is bounded by a straight chord instead of the curve.
- [ ] **For radial surveys:** north arrow at the central station; legs placed via `({90-β}:{d*\s})`; every recorded bearing shown as a three-figure endpoint label such as `$A\;(050^\circ)$`; no true-bearing arcs; separately measured or derived station angles retain ordinary angle markers; distances midway with white fill.
- [ ] **For other bearing diagrams:** north arrow only where a bearing is measured; legs placed via `({90-β}:{d*\s})`; each bearing arc drawn with the computed `arc (90:{90-β}:r)` (NOT `\pic`, which can't do reflex bearings); bearing labels at the computed bisector; shared-vertex arcs at different radii; distances midway with white fill; scale `\s` chosen so the longest leg is ~3–4 cm.
- [ ] **For circle geometry:** centre marked and labelled; equal radii/chords have matching tick marks; right angles use small squares.
- [ ] **For 3D solids:** hidden edges dashed, visible edges solid, every vertex labelled.
- [ ] **For curved solids (cylinder, half-cylinder, cone, curved-roof prism):** no line joins the two arc apexes. Straight lines along the curved surface sit at the silhouette angle (depth direction + 90°, i.e. 120° for the default 30° offset), the back arc is split there so the ruling lands on an endpoint, and the arc radius is half any labelled base width.
- [ ] Explicit vertices/faces/view or a checked curved template; versioned metadata is current. Visibility follows geometry, silhouettes stay solid, labels do not repaint edges, and no duplicate boundary strokes remain.
- [ ] Construction guides, open rims, cutaways and internal diagonals retain their teaching meaning. Project angle annotations to 2D first.
- [ ] Run MathsMap `node scripts/audit-solid-visibility.mjs --strict`; unsupported geometry requires a recorded review bound to the exact source hash. Inspect question/solution variants at final size, with 10 pt labels and the current palette.
- [ ] **For directed network diagrams:** arrowheads are mid-line (via `decorations.markings` at position 0.5), not at edge endpoints. `->` is not used on network edges.
- [ ] **For angle figures:** divider count = labelled parts − 1; ray/segment/line arrowheads match the notation; parallel marks collinear and on the correct lines (never the transversal); no right-angle square under split-angle labels; reflex arcs sweep the reflex sector; A1 instantiations follow the position/relationship map; canonical templates instantiated verbatim (labels substituted only).
- [ ] **For data displays:** data re-derived from the drawing matches the source (dots recounted); axis starts at zero (unless broken-scale is the skill); title/y-label/x-label at their fixed anchors; category labels fit without touching; scenario, column count, and value pattern follow the variety rules; growing-pattern stages individually countable and equation-consistent.
- [ ] Every table cell is a single `\node` carrying both its border and its text; no `grid`/`rectangle` ruling is positioned independently of cell text; nothing sits outside the table frame; no `\scriptsize`/`\tiny`.

Output the TikZ code now.

Graph strokes at final printed size: plotted relationships 0.8 pt (including dashed relationships), axes 0.5 pt, ticks 0.4 pt, major grids 0.25 pt, minor grids 0.15 pt, construction guides 0.4 pt. Use explicit line widths by role, never thin/thick keywords. Include \special{dvisvgm:raw <metadata data-graph-strokes="1"/>} inside the tikzpicture so preview and PDF compensate stroke widths for SVG fitting. Preserve colours, dashes, arrowheads and labels.

## General diagram colours (11 September 2026)

Ordinary diagram outlines, angle marks, ticks, arrows and labels use solid black `#000000`, across all booklets and editions. Preserve only semantic colours and meaningful fills; graph series and legends retain their separate palette. Source hue alone does not justify an exception. Follow the native role metadata and occurrence-review contract in `docs/booklet-diagram-colours.md`. This overrides earlier requests to reproduce decorative source diagram palettes.

## MathsMap final-print typography override

For MathsMap booklets this local house-style override takes precedence over the generated manual's source font-size suggestions: all complete native diagram labels print at 10 pt (tolerance 0.1 pt), regardless of SVG width. Keep natural script/fraction proportions and rotation/alignment. Graph ticks remain 8.5 pt (reviewed 8 pt exceptions). The shared rendering path handles calibration; fix collisions through placement/space, not smaller type. Review raster labels separately.


Current palette precedence: all editable booklet text, maths, marks, fills, backgrounds and semantic highlights use the shared standard palette in `docs/booklet-standard-palette.md`. Preserve source shades only as original evidence. This includes teaching responses and worked solutions. Pink maps to red; use available accents and line/marker distinctions for purple/teal identities, matching equations and legends. Custom shades fail acceptance; retained raster pixels require separate review.
