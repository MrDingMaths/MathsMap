# Proposal — Atomise `Trigonometry D` (Path) group

**Status: APPLIED** (skills.json updated, `npm run validate` clean).

**Context.** Booklet: `Stage 5/Trigonometry D Circle Trigonometry.md` (NEW,
supersedes both OLD Trigonometry D files). Target topic `t-s5p-trg-d`, dot points
**dp-s5p-trg-d-1** (unit circle, graphs) and **dp-s5p-trg-d-2** (exact values,
supplementary/complementary, trig equations). MA5-TRG-P-02.

**Finding (headline).** This booklet is the biggest of the group (3036 lines, 14
sections) and the graph's problem here is **staging, not coverage**. Five of its
sections — Reference Angles, ASTC, Exact Values in All Quadrants, and the
Ambiguous Case — are taught in full at Stage 5 Path, but the graph carries that
content only as Stage 6 Advanced skills (`related-angles`,
`trig-ratios-quadrant-forms`, `ambiguous-case-sine-rule`), all attached to
`dp-s6adv11-trig-2/3`. Per the earliest-genuine-stage rule and the row-15 / row-24
re-staging precedents, three skills come down to Stage 5 rather than being
duplicated. Genuinely missing content is small: the ASTC sign rule (a drill the
booklet teaches separately from the reference angle) and periodicity's
rewrite-into-range routine. Everything else — unit-circle definitions,
$\tan=\sin/\cos$, obtuse relationships, exact acute values, complementary
identities, $m=\tan\theta$, the graphs, and the solve-by-reference-angle routine —
maps 1:1 onto existing Stage 5 skills.

## 1. Recommended new skills (2)

### 1.1 `rewrite-angle-within-revolution`

| field | value |
|---|---|
| id | `rewrite-angle-within-revolution` |
| title | Rewrite an angle within one revolution |
| blurb | Add or subtract $360^{\circ}$ repeatedly to rewrite any angle as an equivalent angle with $0^{\circ}\le\theta<360^{\circ}$, e.g. $-110^{\circ}\equiv250^{\circ}$. |
| stage | 5 · courses `["s5-path"]` · dotPointIds `["dp-s5p-trg-d-1"]` · difficulty 1 |
| prereqs | `[]` |
| atom type | Transformation |

```json
{ "id": "rewrite-angle-within-revolution", "title": "Rewrite an angle within one revolution", "blurb": "Add or subtract $360^{\\circ}$ repeatedly to rewrite any angle as an equivalent angle with $0^{\\circ}\\le\\theta<360^{\\circ}$, e.g. $-110^{\\circ}\\equiv250^{\\circ}$.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-trg-d-1"], "difficulty": 1, "prereqs": [] }
```

**Booklet trace:** §"Periodicity" — its own section with a two-case rule ("If
$\theta\ge360^{\circ}$ subtract 360° repeatedly / If $\theta<0$ add 360°
repeatedly"), a Rewrite drill ($410^{\circ}\equiv50^{\circ}$;
$-110^{\circ}\equiv250^{\circ}$), Guided Practice a–f ($400^{\circ}$, $-50^{\circ}$,
$-200^{\circ}$, $900^{\circ}$) and a Key Ideas block ("angles that differ by 360°
represent the same angle"; "a negative angle represents rotation in the clockwise
direction"). Load-bearing later in §Exact Values (All Angles):
$\sin(-210^{\circ})$, $\tan(-60^{\circ})$, $\sin(700^{\circ})$.

**Bar:** (1) *Distinctive* — the characteristic enabler for every any-magnitude
item; without it a negative or >360° angle has no quadrant. (2) *At-risk* — the
syllabus bullet names negative angles explicitly, and the booklet devotes a
section plus Key Ideas to it. (3) *Stage-proximity* — same stage.
(4) *Non-redundant* — nothing reaches it; `graph-trig-functions` names periodicity
as a graph property, not this rewrite routine.

### 1.2 `astc-sign-of-ratio`

| field | value |
|---|---|
| id | `astc-sign-of-ratio` |
| title | Determine the sign of a trig ratio using ASTC |
| blurb | Identify the quadrant of an angle and use ASTC to decide whether $\sin\theta$, $\cos\theta$ or $\tan\theta$ is positive or negative. |
| stage | 5 · courses `["s5-path"]` · dotPointIds `["dp-s5p-trg-d-1"]` · difficulty 1 |
| prereqs | `["related-angles"]` |
| atom type | Category (positive or negative?) |

```json
{ "id": "astc-sign-of-ratio", "title": "Determine the sign of a trig ratio using ASTC", "blurb": "Identify the quadrant of an angle and use ASTC to decide whether $\\sin\\theta$, $\\cos\\theta$ or $\\tan\\theta$ is positive or negative.", "stage": 5, "courses": ["s5-path"], "dotPointIds": ["dp-s5p-trg-d-1"], "difficulty": 1, "prereqs": ["related-angles"] }
```

**Booklet trace:** §Trigonometric Ratios of Angles of Any Magnitude → the **ASTC**
block ("All the identities on the previous page can be memorised using ASTC"), a
quadrant-by-quadrant table, and its own 2-step drill ("Determining the sign: 1.
Identify the quadrant of $\theta$. 2. Use ASTC") with worked items
($\sin200^{\circ}$ is negative, $\tan200^{\circ}$ is positive, $\cos320^{\circ}$
is positive) and Guided Practice a–f including $\cos(-50^{\circ})$ and
$\sin(700^{\circ})$. Re-used in §Exact Values (All Angles) step 1 ("Rewrite trig
ratio with acute reference angle **and the correct sign**"), in §Solving
Trigonometric Equations ("Identifying the Quadrant from a Trigonometric Ratio"),
and confirmed against the graphs in §Graphs of Trigonometric Functions
("confirming the ASTC rule that…").

**Bar:** (1) *Distinctive* — the sign is a separate decision from the magnitude;
the booklet teaches the reference angle and the sign as two steps and drills them
apart. (2) *At-risk* — sign errors are the dominant failure mode in all-quadrant
exact values, which is why the booklet gives ASTC its own mnemonic, table and
drill. (3) *Stage-proximity* — same stage. (4) *Non-redundant* — a lift-out from
`related-angles`, whose blurb mentions obtaining ratios of any-magnitude angles but
which reaches no sign rule.

## 2. Re-staged existing skills (3) — no new nodes

Per the earliest-genuine-stage rule; precedents `find-equation-parabola-features`
(6→5, row 24) and `rationalise-binomial-surd-denominator` (6→5, row 15).

| skill | change | booklet trace |
|---|---|---|
| `related-angles` | stage 6→**5**; courses `["s6-adv11"]`→`["s5-path","s6-adv11"]`; dotPointIds + `dp-s5p-trg-d-1`; prereqs `["angles-any-magnitude-definitions"]`→`["unit-circle-definitions","rewrite-angle-within-revolution"]` | §"Reference Angles" — full section: the definition ("the **acute** angle between the **x-axis** and the **radius**"), per-quadrant formulas ($A=180^{\circ}-\theta$, $\theta-180^{\circ}$, $360^{\circ}-\theta$), Key Ideas, a Rewrite drill ($\theta=120^{\circ}\Rightarrow A=60^{\circ}$), Guided Practice a–e, Foundation Q1a–e. The booklet's own words: "Find the reference angle, **or related angle**". |
| `trig-ratios-quadrant-forms` | stage 6→**5**; courses + `s5-path`; dotPointIds + `dp-s5p-trg-d-2` | §"Trigonometric Ratios of Angles of Any Magnitude" derives $\sin(180^{\circ}-A)$, $\cos(180^{\circ}+A)$, $\tan(360^{\circ}-A)$ etc. per quadrant; §"Exact Values of Trigonometric Ratios (All Angles)" applies them with the exact-value table (Example: $\tan300^{\circ}=-\tan60^{\circ}=-\sqrt3$; $\sin(-210^{\circ})=\sin30^{\circ}=\frac12$), Guided Practice a–d, Foundation Q1. Prereqs (`related-angles`, `exact-trig-ratios`) are both Stage 5 after this pass — stage-monotonic holds. |
| `ambiguous-case-sine-rule` | stage 6→**5**; courses + `s5-path`; dotPointIds + `dp-s5p-trg-d-2`; prereqs + `trig-obtuse-relationships` | §"Ambiguous Case of the Sine Rule" — two Investigations (ambiguous triangles; the condition $b\sin A<a<b$ for two triangles, $a=b\sin A$ / $a>b$ for one, $a<b\sin A$ for none), then §"Solving Ambiguous Case Sine Rule Questions". Explicit syllabus bullet on **dp-s5p-trg-d-2**: "Apply the sine rule and area rule to find angles involving the ambiguous case". The booklet grounds it in $\sin\theta=\sin(180^{\circ}-\theta)$ — hence the new `trig-obtuse-relationships` prereq. Its `sine-rule-angles` prereq (Stage 5 after the Trigonometry C pass) already holds. |

## 3. Recommended new prereq edges (3, net +1 after transitive reduction)

- **`related-angles ← rewrite-angle-within-revolution`** — §Reference Angles
  Foundation and §Exact Values (All Angles) both require negative/over-360° angles
  to be brought into range first ($\sin(700^{\circ})$, $\tan(-60^{\circ})$). Bar
  met as in 1.1.
- **`solve-trig-equations ← astc-sign-of-ratio`** — §Solving Trigonometric
  Equations using Exact Values: the routine is "find the **acute reference angle**
  (always enter the **positive** value of the ratio) and **identify the relevant
  quadrants**" from the ratio's sign.
- **`solve-trig-equations ← trig-ratios-quadrant-forms`** — same section:
  solutions are assembled as $180^{\circ}-A$, $180^{\circ}+A$, $360^{\circ}-A$
  from the reference angle. *Transitive reduction:* `exact-trig-ratios` becomes
  reachable through it, so **drop** `solve-trig-equations ← exact-trig-ratios`.
  Also **drop** `solve-trig-equations ← sine-rule-angles` — the ambiguous case
  leaves this skill (see §4).

## 4. Edits to existing skills (1 re-scope)

- **`solve-trig-equations`** — before: *"Find acute and obtuse angles for a given
  trig ratio and solve, including the ambiguous case of the sine rule."* → after:
  *"Find all solutions of a trigonometric equation for $0^{\circ}\le\theta<
  360^{\circ}$ using the acute reference angle and the relevant quadrants."*
  (Lift-out rule: the ambiguous case is now carried by the re-staged
  `ambiguous-case-sine-rule` on the same dot point, so the clause and the
  `sine-rule-angles` edge both leave.) Prereqs become `["trig-obtuse-relationships",
  "trig-ratios-quadrant-forms", "astc-sign-of-ratio"]`.

## 5. Borderline candidates → EXCLUDE

- **Re-staging `angles-any-magnitude-definitions` (6→5)** — the booklet does treat
  any-magnitude angles at Stage 5, but via the unit circle ($r=1$) and reference
  angles, not via the general $\cos\theta=x/r$ definition for a circle of radius
  $r$, which is what that skill's blurb states and is genuinely first needed in
  Stage 6 Advanced. Excluded; instead `related-angles` is re-pointed at
  `unit-circle-definitions` (Stage 5), which is what the booklet actually builds
  on. **Flag for row 65** (`Trigonometry and Measure of Angles`, Advanced Y11):
  confirm whether that booklet needs `related-angles ←
  angles-any-magnitude-definitions` re-added. `trig-ratios-multiples-90` keeps its
  edge to it, so the skill is not orphaned.
- **Re-staging `trig-ratios-multiples-90` and `negative-angle-trig-identities`
  (6→5)** — the booklet's exact-value table does include
  $0^{\circ}/90^{\circ}/180^{\circ}/270^{\circ}$ (Guided Practice
  $\sin270^{\circ}=-1$) and negative angles ($\tan(-60^{\circ})$), but as entries
  in the all-angles routine rather than as taught sections with their own method.
  At Stage 5 they are reached through `trig-ratios-quadrant-forms` +
  `rewrite-angle-within-revolution`. Excluded for leanness; the Stage-6 skills keep
  their "undefined where" and parity content, which this booklet does not teach.
- **`reference-angle-from-calculator`** ("always enter the **positive** value of
  the ratio; the calculator returns the acute reference angle") — §Solving
  Trigonometric Equations, with its own Determine drill a–f. Genuinely at-risk, but
  it is one step of the solve routine and the booklet itself defers the underlying
  theory ("You will learn more about the inverse trigonometric functions in the
  Year 12 Advanced course"). Absorbed into `solve-trig-equations`.
- **`ambiguous-case-area-rule`** — the dp-2 syllabus bullet says "Apply the sine
  rule **and area rule** to find angles involving the ambiguous case", but the
  booklet's §Ambiguous Case only ever works the sine rule. Booklet-required rule →
  excluded, and noted here as a genuine syllabus/booklet gap rather than an
  oversight.

## 6. Considered-and-omitted (already covered)

- §Redefining Trigonometry using the Unit Circle → `unit-circle-definitions`; the
  $\tan\theta=\frac{\sin\theta}{\cos\theta}$ verification → `tan-as-sin-over-cos`.
- §Exact Values (Acute Angles), the $30/45/60$ triangles → `exact-trig-ratios`.
  §Complementary Angle Identities → `complementary-trig-relationships`.
- §Trigonometric Ratios of Obtuse Angles → `trig-obtuse-relationships` (all three
  $180^{\circ}-A$ relationships, an explicit syllabus bullet).
- §Angle of Inclination **and** §Gradient and Angle of Inclination (two sections) →
  `gradient-as-tan-inclination` ($m=\tan\theta$), already prereq'd on
  `gradient-formula` and `tan-as-sin-over-cos`.
- §Graphs of Trigonometric Functions (sine/cosine/tangent investigations,
  oscillation, period, sign by interval) → `graph-trig-functions` ("describe
  periodicity and symmetry").
- §Exam Practice → mixed revision, no new routine.

## Net change applied

- **+2 skills:** `rewrite-angle-within-revolution`, `astc-sign-of-ratio`
- **3 re-stages 6→5:** `related-angles`, `trig-ratios-quadrant-forms`,
  `ambiguous-case-sine-rule`
- **+3 edges, −2 edges** (net **+1**), plus `related-angles`' prereq re-point and
  `ambiguous-case-sine-rule` gaining `trig-obtuse-relationships`
- **1 blurb re-scope:** `solve-trig-equations`
