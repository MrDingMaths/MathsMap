# TikZ templates — vetted fixed-geometry skeletons

A library of **pre-verified TikZ skeletons** for the geometry diagrams that content-generation
agents attach to cards (`tikz` / `tikzSolution`) and quiz stems (`tikz`). Read the
[TikZ allowlist in content-schema.md](content-schema.md#tikz-allowlist-tikz--tikzsolution) first —
these templates are authored to that TikZJax subset (no `\usepackage`, no `\usetikzlibrary`,
hand-placed `\node` labels).

## Why templates exist — the core principle

Free-hand coordinate maths has repeatedly produced broken diagrams: angle labels floating away
from the intersection they describe, adjacent numbers merging into an unreadable blob, and missing
parallel/right-angle marks. **The geometry is hard to get right; the labels are easy.** So we fix
the geometry once, correctly, and let authors fill in only the text.

> **THE RULE.** Pick the template whose *structural type* matches your diagram. Substitute **only**
> the `⟨placeholder⟩` label text — angle values, point letters, the unknown `x`. **Do NOT move,
> add, or "improve" any coordinate.** The coordinates below are computed correct and have been
> verified.

**Diagrams are schematic — "not to scale."** A label of `71°` printed on a canonically-drawn
angle is completely acceptable. Correct **structure** (which angle is which, which lines are
parallel) and **non-colliding labels** matter far more than protractor-exact geometry. Never
redraw a wedge to "match" its number.

### Backslashes in JSON — DOUBLE THEM

Every skeleton below is shown with **single** backslashes for readability. When you paste a
template into a JSON `tikz` string, **every backslash must be doubled**:

- In this doc:  `\begin{tikzpicture}...\node at (0,0) {$x$};...\end{tikzpicture}`
- In the JSON:  `"tikz": "\\begin{tikzpicture}...\\node at (0,0) {$x$};...\\end{tikzpicture}"`

(`\begin` → `\\begin`, `\draw` → `\\draw`, `\node` → `\\node`, and so on. A single `\` in a JSON
string is an escape character and will corrupt the diagram.)

---

## T1 — Transversal cutting two parallel lines, 8 numbered angles

**Purpose:** the full "transversal across two parallel lines" figure with all eight angles labelled.

```
\begin{tikzpicture}[scale=0.62]\draw (-2.6,1.2)--(2.6,1.2);\draw (-2.6,-1.2)--(2.6,-1.2);\draw (-1.8,-2.4)--(1.8,2.4);\draw[->] (-0.3,1.2)--(0.35,1.2);\draw[->] (-0.3,-1.2)--(0.35,-1.2);\node at (0.65,1.69) {⟨1⟩};\node at (1.39,1.45) {⟨2⟩};\node at (0.41,0.95) {⟨3⟩};\node at (1.15,0.71) {⟨4⟩};\node at (-1.15,-0.71) {⟨5⟩};\node at (-0.41,-0.95) {⟨6⟩};\node at (-1.39,-1.45) {⟨7⟩};\node at (-0.65,-1.69) {⟨8⟩};\end{tikzpicture}
```

**Filled example** (label the eight positions with `a`…`h`):

```
\begin{tikzpicture}[scale=0.62]\draw (-2.6,1.2)--(2.6,1.2);\draw (-2.6,-1.2)--(2.6,-1.2);\draw (-1.8,-2.4)--(1.8,2.4);\draw[->] (-0.3,1.2)--(0.35,1.2);\draw[->] (-0.3,-1.2)--(0.35,-1.2);\node at (0.65,1.69) {$a$};\node at (1.39,1.45) {$b$};\node at (0.41,0.95) {$c$};\node at (1.15,0.71) {$d$};\node at (-1.15,-0.71) {$e$};\node at (-0.41,-0.95) {$f$};\node at (-1.39,-1.45) {$g$};\node at (-0.65,-1.69) {$h$};\end{tikzpicture}
```

**Fill-rules — the fixed geometry.** The parallels are `y = ±1.2`; the transversal runs
`(-1.8,-2.4)→(1.8,2.4)`; top intersection `(0.9,1.2)`, bottom `(-0.9,-1.2)`. The eight label
anchors already sit on the correct angular bisector of each wedge. The two single arrowheads mean
"these two lines are parallel"; **the transversal carries NO arrowhead.**

**Position map** (which `⟨n⟩` is where):

| n | Location |
|---|----------|
| 1 | top intersection, upper-left |
| 2 | top intersection, upper-right |
| 3 | top intersection, lower-left |
| 4 | top intersection, lower-right |
| 5 | bottom intersection, upper-left |
| 6 | bottom intersection, upper-right |
| 7 | bottom intersection, lower-left |
| 8 | bottom intersection, lower-right |

**Fixed angle-relationship map** (use this to write correct questions):

- **Corresponding pairs:** 1&5, 2&6, 3&7, 4&8.
- **Alternate interior:** 3&6, 4&5.
- **Co-interior** (same side, interior): 3&5, 4&6.
- **Interior angles** are 3, 4 (top) and 5, 6 (bottom).
- **Vertically opposite:** 1&4, 2&3, 5&8, 6&7.

---

## T2 — Parallel + transversal, one known angle + one unknown x

**Purpose:** the T1 figure reduced to just the two angles a "find the unknown" question needs.

Same geometry as T1, but label **only two** positions — delete the `\node` lines for the other
six. Choose the two positions from T1's map to match the pair type the question is about
(corresponding, alternate, co-interior, or vertically opposite).

**Filled example** — corresponding angles: known `64°` at position 2 `(1.39,1.45)`, unknown `x`
at position 6 `(-0.41,-0.95)` (2&6 are a corresponding pair, so `x = 64°`):

```
\begin{tikzpicture}[scale=0.62]\draw (-2.6,1.2)--(2.6,1.2);\draw (-2.6,-1.2)--(2.6,-1.2);\draw (-1.8,-2.4)--(1.8,2.4);\draw[->] (-0.3,1.2)--(0.35,1.2);\draw[->] (-0.3,-1.2)--(0.35,-1.2);\node at (1.39,1.45) {$64^{	rc}$};\node at (-0.41,-0.95) {$x$};\end{tikzpicture}
```

**Fill-rule:** keep exactly the two `\node` lines for the positions in the pair; delete the rest.
Do not move the survivors — their anchors are the T1 anchors.

---

## T3 — Angles on a straight line (ray from a point on a line)

**Purpose:** a ray from a point on a straight line, splitting the straight angle into two parts
(e.g. one known angle and its supplement `x`).

```
\begin{tikzpicture}[scale=0.62]\draw (-2.2,0)--(2.2,0);\draw (0,0)--(⟨rayX⟩,⟨rayY⟩);\node at (⟨rposX⟩,⟨rposY⟩) {⟨V⟩};\node at (⟨lposX⟩,⟨lposY⟩) {⟨other⟩};\end{tikzpicture}
```

Because the drawn ray angle must roughly match its label, the ray endpoint and the two label
positions come from this **precomputed anchor table** (never invent them). `a` is the size of the
angle in the **right** wedge (measured up from the positive x-axis).

**T3 anchor table** — `ray = (2·cos a, 2·sin a)`, `right = (0.95·cos(a/2), 0.95·sin(a/2))`,
`left = (0.95·cos((180+a)/2), 0.95·sin((180+a)/2))`, all rounded to 2 dp:

| a (°) | ray endpoint | right-wedge label | left-wedge label |
|------|--------------|-------------------|------------------|
| 30  | (1.73, 1.00)  | (0.92, 0.25)  | (-0.25, 0.92) |
| 45  | (1.41, 1.41)  | (0.88, 0.36)  | (-0.36, 0.88) |
| 60  | (1.00, 1.73)  | (0.82, 0.47)  | (-0.47, 0.82) |
| 70  | (0.68, 1.88)  | (0.78, 0.54)  | (-0.54, 0.78) |
| 90  | (0.00, 2.00)  | (0.67, 0.67)  | (-0.67, 0.67) |
| 110 | (-0.68, 1.88) | (0.54, 0.78)  | (-0.78, 0.54) |
| 120 | (-1.00, 1.73) | (0.48, 0.82)  | (-0.82, 0.47) |
| 135 | (-1.41, 1.41) | (0.36, 0.88)  | (-0.88, 0.36) |
| 145 | (-1.64, 1.15) | (0.29, 0.91)  | (-0.91, 0.29) |
| 150 | (-1.73, 1.00) | (0.25, 0.92)  | (-0.92, 0.25) |

**Fill-rule:** to draw an angle of value `V` in the **right** wedge, pick the table row whose `a`
is nearest `V`; draw the ray to that row's endpoint; put `⟨V⟩` at that row's right-wedge label
position, and the other label (`x`, or the supplement) at the same row's left-wedge label
position. The label values need not equal the row's `a` — the diagram is schematic.

**Filled example** — a `71°` angle and its supplement `x` on a straight line (nearest row = 70):
ray to `(0.68,1.88)`, `71°` at `(0.78,0.54)`, `x` at `(-0.54,0.78)`:

```
\begin{tikzpicture}[scale=0.62]\draw (-2.2,0)--(2.2,0);\draw (0,0)--(0.68,1.88);\node at (0.78,0.54) {$71^{	rc}$};\node at (-0.54,0.78) {$x$};\end{tikzpicture}
```

---

## T4 — Angles at a point (rays around a point, sum 360°)

**Purpose:** several rays leaving one point, dividing the full turn into wedges that sum to 360°.

Skeleton: vertex `O = (0,0)`; `N` rays to canonical directions; one label on each wedge's bisector
at radius `0.95`. Pick ray directions so the drawn wedges roughly match the angle values
(schematic), then read the ray endpoints and bisector label positions from the same
`(2·cos, 2·sin)` / `(0.95·cos, 0.95·sin)` rule as T3.

**Worked 3-angle example — `95°`, `120°`, `x`.** Put rays at `0°`, `95°`, `215°`, so the wedges
are `95°` (0→95), `120°` (95→215) and `145°` (215→360, drawn size — labelled `x`, whose value the
question resolves to `360 − 95 − 120 = 145°`). Ray endpoints and bisector label positions
(bisectors at `47.5°`, `155°`, `287.5°`):

| ray dir | endpoint |   | wedge | bisector | label pos | label |
|--------|-----------|---|-------|----------|-----------|-------|
| 0°   | (2.00, 0.00)  | | 0→95   | 47.5°  | (0.64, 0.70)  | 95°  |
| 95°  | (-0.17, 1.99) | | 95→215 | 155°   | (-0.86, 0.40) | 120° |
| 215° | (-1.64, -1.15)| | 215→360| 287.5° | (0.29, -0.91) | x    |

```
\begin{tikzpicture}[scale=0.62]\draw (0,0)--(2.00,0.00);\draw (0,0)--(-0.17,1.99);\draw (0,0)--(-1.64,-1.15);\node at (0.64,0.70) {$95^{	rc}$};\node at (-0.86,0.40) {$120^{	rc}$};\node at (0.29,-0.91) {$x$};\end{tikzpicture}
```

**Fill-rule:** rays go all the way around the circle; each wedge's drawn size should roughly equal
its angle value. Compute each ray endpoint as `(2·cos θ, 2·sin θ)` and each label at the wedge's
bisector angle as `(0.95·cos, 0.95·sin)`. Keep any two labels ≥ 0.35 units apart.

---

## T5 — Two straight lines crossing (vertically opposite / adjacent)

**Purpose:** two straight lines crossing at a point, giving four angles (two pairs of vertically
opposite angles).

Fixed skeleton — line A `(-2.2,-0.9)→(2.2,0.9)`, line B `(-2.2,0.9)→(2.2,-0.9)`, crossing at the
origin. Four wedges, with label anchors on the four bisectors at radius `0.8`: right `(0.8,0)`,
top `(0,0.8)`, left `(-0.8,0)`, bottom `(0,-0.8)`.

```
\begin{tikzpicture}[scale=0.62]\draw (-2.2,-0.9)--(2.2,0.9);\draw (-2.2,0.9)--(2.2,-0.9);\node at (0.8,0) {⟨right⟩};\node at (0,0.8) {⟨top⟩};\node at (-0.8,0) {⟨left⟩};\node at (0,-0.8) {⟨bottom⟩};\end{tikzpicture}
```

**Filled example** — top angle `133°`, its vertical opposite (bottom) `x` (label only those two;
delete the other two `\node` lines):

```
\begin{tikzpicture}[scale=0.62]\draw (-2.2,-0.9)--(2.2,0.9);\draw (-2.2,0.9)--(2.2,-0.9);\node at (0,0.8) {$133^{	rc}$};\node at (0,-0.8) {$x$};\end{tikzpicture}
```

**Fill-rule:** **vertically opposite = opposite wedges** — top&bottom, left&right (equal).
**Adjacent = neighbouring wedges** — e.g. top&right (supplementary, sum 180°). Label only the
positions your question needs; delete the rest.

---

## T6 — Right angle split by a ray

**Purpose:** a right angle (two perpendicular arms) optionally divided by a ray into two parts.

**Unsplit** — show the right-angle square (see T9) and no interior ray:

```
\begin{tikzpicture}[scale=0.62]\draw (0,0)--(2.2,0);\draw (0,0)--(0,2.2);\draw (0.25,0)--(0.25,0.25)--(0,0.25);\end{tikzpicture}
```

**Split by a ray** — draw the ray, label each part, and **omit the right-angle square** (the
right angle is now shown by its two labelled parts, not the square). Use a canonical split ray
from the T3 anchor table (nearest row). For a split near `34°`, the nearest row is `30`
(ray → `(1.73,1.00)`); the two parts fall in the `0→30` wedge (label at the row's right-wedge
position `(0.92,0.25)`) and the `30→90` wedge (bisector `60°`, label at `(0.48,0.82)`).

```
\begin{tikzpicture}[scale=0.62]\draw (0,0)--(2.2,0);\draw (0,0)--(0,2.2);\draw (0,0)--(1.73,1.00);\node at (0.92,0.25) {⟨part1⟩};\node at (0.48,0.82) {⟨part2⟩};\end{tikzpicture}
```

**Filled example** — a right angle split into `34°` and `x` (so `x = 90 − 34 = 56°`):

```
\begin{tikzpicture}[scale=0.62]\draw (0,0)--(2.2,0);\draw (0,0)--(0,2.2);\draw (0,0)--(1.73,1.00);\node at (0.92,0.25) {$34^{	rc}$};\node at (0.48,0.82) {$x$};\end{tikzpicture}
```

**Fill-rule:** `part1` (lower, near the horizontal arm) at `(0.92,0.25)`; `part2` (upper, near the
vertical arm) at `(0.48,0.82)`; the two parts sum to 90°.

---

## T7 — Auxiliary parallel line (point P between two parallel lines)

**Purpose:** the classic "bent line between two parallels" figure — a point `P` with two rays
reaching each parallel line, plus a dashed auxiliary parallel through `P`. The angle at `P` equals
the sum of the two ray-angles (alternate angles).

Use **exactly** this corrected geometry — both rays exit to the **same** horizontal side, which is
the verified-correct configuration:

```
\begin{tikzpicture}[scale=0.65]\draw (-2.5,1.5)--(2.5,1.5);\draw (-2.5,-1.5)--(2.5,-1.5);\draw[dashed] (-2.5,0)--(2.5,0);\draw[->] (-1,1.5)--(-0.2,1.5);\draw[->] (-1,-1.5)--(-0.2,-1.5);\draw[->] (-1,0)--(-0.2,0);\coordinate (P) at (0,0);\draw (P)--(2,1.5);\draw (P)--(1.35,-1.5);\node[left] at (P) {$P$};\node at (1.5,1.22) {⟨upper⟩};\node at (0.85,-1.2) {⟨lower⟩};\node at (0.72,0) {⟨x⟩};\end{tikzpicture}
```

**Filled example** — `upper = 34°`, `lower = 27°`, so the angle at `P` is `x = 34 + 27 = 61°`:

```
\begin{tikzpicture}[scale=0.65]\draw (-2.5,1.5)--(2.5,1.5);\draw (-2.5,-1.5)--(2.5,-1.5);\draw[dashed] (-2.5,0)--(2.5,0);\draw[->] (-1,1.5)--(-0.2,1.5);\draw[->] (-1,-1.5)--(-0.2,-1.5);\draw[->] (-1,0)--(-0.2,0);\coordinate (P) at (0,0);\draw (P)--(2,1.5);\draw (P)--(1.35,-1.5);\node[left] at (P) {$P$};\node at (1.5,1.22) {$34^{	rc}$};\node at (0.85,-1.2) {$27^{	rc}$};\node at (0.72,0) {$x$};\end{tikzpicture}
```

**Fill-rule:** `upper` and `lower` are the two angles each ray makes with its parallel line; `x`
(between the rays, straddling the dashed auxiliary line) `= upper + lower`. The three single
arrowheads mark the three parallel lines (top, bottom, dashed auxiliary).

> **WARN:** do **not** redraw the rays to opposite horizontal sides. That is the broken
> configuration that produced wrong answers — it changes the relationship from a sum to a
> difference. Keep both rays exiting right, exactly as given.

---

## T8 — Single angle with an arc (naming / measuring one angle)

**Purpose:** one angle at a labelled vertex, marked with an arc — for naming (`∠ABC`) or measuring.

Fixed skeleton — vertex `B = (0,0)`, arm to `A = (2,0)`, second arm to a point `C` taken from the
T3 anchor table (here the `60°` row, `(1.00,1.73)`), an arc between the arms, point labels, and an
optional value on the bisector (`30°` bisector → `(0.82,0.47)`):

```
\begin{tikzpicture}[scale=0.62]\draw (0,0)--(2,0);\draw (0,0)--(1.00,1.73);\draw (0.5,0) arc (0:60:0.5);\node[left] at (0,0) {⟨B⟩};\node[right] at (2,0) {⟨A⟩};\node[above] at (1.00,1.73) {⟨C⟩};\node at (0.82,0.47) {⟨value⟩};\end{tikzpicture}
```

**Filled example — naming `∠ABC`** (vertex `B` in the middle; the arc marks the angle to be
named; no interior value, so the `value` node is deleted):

```
\begin{tikzpicture}[scale=0.62]\draw (0,0)--(2,0);\draw (0,0)--(1.00,1.73);\draw (0.5,0) arc (0:60:0.5);\node[left] at (0,0) {$B$};\node[right] at (2,0) {$A$};\node[above] at (1.00,1.73) {$C$};\end{tikzpicture}
```

**Fill-rule:** the middle letter of an angle name is always the **vertex** — put it at `(0,0)`.
`A` sits at the end of the horizontal arm, `C` at the end of the sloped arm. Use the `value` node
only when you want to print the measured size; delete it for a pure naming task. To open the angle
wider or narrower, swap the second arm's endpoint **and** the arc's end angle for another T3 row
(e.g. row 45 → arm `(1.41,1.41)`, arc `(0:45:0.5)`).

---

## T9 — Parallel & perpendicular marks (cheatsheet)

Not a full figure — the **only approved ways** to mark parallel and perpendicular. Drop these
fragments into any template above.

**Single-arrow parallel mark** (first set of parallel lines) — one short arrowed segment sitting
on the line, mid-length:

```
\draw[->] (-0.3,0)--(0.35,0);
```

**Double-arrow parallel mark** (second, distinct set of parallels) — two short arrowed segments
placed sequentially on the line. Never offset either segment away from the line:

```
\draw[->] (-0.65,0)--(-0.1,0);\draw[->] (0.05,0)--(0.6,0);
```

**Right-angle square** — an L placed in the corner at the vertex (here the origin, arms along
`+x` and `+y`), drawn `0.2`–`0.25` on a side:

```
\draw (0.25,0)--(0.25,0.25)--(0,0.25);
```

**Fill-rule:** parallel arrowheads go **only on the parallel lines**, matching arrow-counts within
a set; a transversal never carries one. The right-angle square marks a `90°` corner *only when the
angle is shown unsplit* — once a ray splits it, drop the square and label the parts (see T6).

---

## Closing rules

- **Every backslash is DOUBLED** when a template goes into a JSON `tikz` / `tikzSolution` string
  (`\draw` → `\\draw`). Single backslashes corrupt the diagram.
- **Degrees inside a diagram are always `^{\circ}`, never a literal `°`.** Write `{$64^{\circ}$}`
  in a `\node`, not `{$64°$}` — the literal degree character does not compile in TikZJax and can
  stall the whole diagram worker. (In prose/tables in this doc `°` is fine; inside a `\node` it is
  not.)
- **Never place two `\node` labels within 0.35 units of each other.** The T1 anchors already
  satisfy this — do not add labels between them.
- **Parallel arrowmarks go only on the parallel lines, never the transversal.**
- **Lines extend at least 0.6 beyond every intersection** (the templates already do this — do not
  trim them).
- **Do not move coordinates.** Substitute only `⟨placeholder⟩` text. Diagrams are schematic; a
  label that disagrees slightly with the drawn angle is fine, a label detached from its wedge is
  not.
- **Allowlist reminder:** only `\begin{tikzpicture}` / `\end{tikzpicture}`, `\draw`, `\draw[->]`,
  `\draw[dashed]`, `\node`, `\coordinate`, `\fill`, and `arc` appear in these templates. No
  `\usepackage`, no `\usetikzlibrary` — the preloaded libraries in
  [content-schema.md](content-schema.md#tikz-allowlist-tikz--tikzsolution) cover everything here.
- **If NO template fits**, say so explicitly in your generation report and hand-draw using these
  same principles (fixed non-colliding label anchors on true bisectors, marks from T9, lines
  overshooting intersections). Such diagrams get extra visual review.
