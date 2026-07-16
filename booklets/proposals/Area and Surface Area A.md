# Proposal — Atomise `Area and Surface Area A` (Core) group

**Status: APPLIED** (skills.json updated, `npm run validate` clean). Skill 1.1
`surface-area-prism-without-net` was **REJECTED at review** — see §4.

**Context.** Booklets: `Stage 5 Core/Area and Surface Area A 1_Solve problems
involving areas and surface areas.md`, `…A 2_Develop and apply the formula for
surface areas of cylinders.md`, `…A 3_Solve problems involving surface areas of
cylinders and related composite solids.md`. Target topic `t-s5c-are-a`, dot points
**dp-s5c-area-1**–**dp-s5c-area-3**. MA5-ARE-C-01.

**Finding (headline).** Five skills cover the topic and the existing blurbs are
already narrow — `surface-area-prism` says "from their nets",
`surface-area-cylinder` says "for closed cylinders" — so nothing here needs
de-bundling. But those two narrow scopes are exactly where the booklets go next,
and the graph stops short: A1 gives two full sections to finding surface area
**without** a net (the booklet's preferred "visualising" method), and A2 gives a
section to **partial** cylinders (open ends, half and quarter cylinders, new cut
faces). Both were proposed as progressions downstream of the existing skills; only
the cylinder one was accepted. A3's two sections need nothing new —
`surface-area-composite-solids` already covers them.

## 1. New skills

### 1.1 `surface-area-prism-without-net` — **REJECTED** (see §4)

### 1.2 `surface-area-partial-cylinder` — APPROVED

| field | value |
|---|---|
| id | `surface-area-partial-cylinder` |
| title | Find the surface area of a partial cylinder |
| blurb | Adjust the closed-cylinder formula for open ends, half and quarter cylinders, including any new flat surface exposed by the cut. |
| stage | 5 · courses `["s5-core"]` · dotPointIds `["dp-s5c-area-2"]` · difficulty 3 |
| prereqs | `["surface-area-cylinder"]` |
| atom type | Routine (three Category sub-decisions: base? curved fraction? cut face?) |

```json
{ "id": "surface-area-partial-cylinder", "title": "Find the surface area of a partial cylinder", "blurb": "Adjust the closed-cylinder formula for open ends, half and quarter cylinders, including any new flat surface exposed by the cut.", "stage": 5, "courses": ["s5-core"], "dotPointIds": ["dp-s5c-area-2"], "difficulty": 3, "prereqs": ["surface-area-cylinder"] }
```

**Booklet trace:** A2 §"Surface Area of Cylindrical Solids" — its own teaching
block with three explicit decisions ("Is there a full circular base, part of a
base, or no base? How much of the curved surface area remains? Is there a new flat
surface where the cylinder was 'cut'?"), an Example that writes expressions for
each variant (closed cylinder / one open end / closed half cylinder / open top), a
second Example computing a **closed half cylinder** (semicircle ends
$(\frac12\pi(6)^2)\times2$ + top rectangle + curved → $575.84$ cm²), and Guided
Practice (half-cylinder open top; closed quarter-cylinder).

**Bar:** (1) *Distinctive* — the three adjustment decisions are the whole routine
and are absent from the closed-cylinder formula; the booklet drills "identify the
formula to use" before any arithmetic. (2) *At-risk* — forgetting the new
rectangular cut face, or halving the ends but not the curved surface, are the
failure modes the Example is built around. (3) *Stage-proximity* — same stage.
(4) *Non-redundant* — downstream of `surface-area-cylinder`, whose blurb is
already scoped to closed cylinders.

## 2. New prereq edges (1, net 0 after transitive reduction)

- **`surface-area-composite-solids ← surface-area-partial-cylinder`** — A3
  §Surface Area of Composite Prisms works a solid with semicircular ends
  ($(\frac12\pi(3)^2)\times2$ + curved surface + rectangles → $193.40$ cm²);
  §Surface Area of Prism Combinations Example combines a prism with a curved
  surface → $1901.6$ cm². *Transitive reduction:* **drop**
  `surface-area-composite-solids ← surface-area-cylinder` (reachable through the
  new skill).
- ~~`surface-area-composite-solids ← surface-area-prism-without-net`~~ — dropped
  with the rejection of 1.1.

## 3. Edits to existing skills

**None.** `surface-area-prism` ("from their nets, excluding curved surfaces") and
`surface-area-cylinder` ("for closed cylinders") were left as they are; the new
skill extends rather than de-bundles them.

**Open flag for a future pass:** with 1.1 rejected, the netless "visualising"
method has no home, and `surface-area-prism`'s blurb still reads "from their
nets" — narrower than what the topic now has to cover. If that mismatch matters
later, the fix is a blurb widening on `surface-area-prism` (one edit, no new
node), **not** a re-proposal of 1.1.

## 4. Borderline candidates → EXCLUDE

- **`surface-area-prism-without-net`** — **proposed and REJECTED at review.** A1
  §"Surface Area of a Rectangular Prism without a Net" and §"Surface Area of a
  Triangular Prism without a Net" are two full sections with their own Examples,
  Guided Practice and Foundation sets, and the booklet argues the split itself
  ("Why do you think this 'visualising' method is recommended over the 'net'
  method? *It is faster because we don't need to draw a net*"). Rejected
  nonetheless: dropping the net is a change of presentation, not a new routine —
  the faces enumerated and the areas summed are identical, so it does not clear
  the distinctive bar. The knowledge stays bundled in `surface-area-prism`. **A
  rejection is a decision — do not re-propose this in a later pass.**
- **Splitting rectangular-prism from triangular-prism without a net** — moot given
  the above, and excluded for leanness regardless: the method, the at-risk failure
  (missing a face) and the scaffold are identical; only the face shapes differ,
  and the triangle-area half is already carried by `surface-area-prism ←
  area-of-triangle`.
- **`surface-area-prism-combinations`** (subtract/omit the hidden faces where two
  solids join) — A3 §Surface Area of Prism Combinations. Excluded:
  `surface-area-composite-solids` ("cylinders and composite solids") already covers
  it, and A3's two sections use one shared method.
- **`avoid-premature-rounding`** — A2 ("Explain why values were initially rounded
  to 4 d.p. *If you round too early, the final answer will be…*"), recurring in
  A3's 2 d.p. answers. A real at-risk decision, but it is one prompt serving a
  routine it cannot be assessed apart from. Absorbed. (Note: `pythagoras-multistep`
  carries a similar "keep the intermediate exact" idea, but there it was the
  section's whole teaching point.)

## 5. Considered-and-omitted (already covered)

- A1 §Nets of 3D Solids (recognise/justify/create and rearrange nets of right
  prisms) → `nets-of-prisms ← nets-of-3d-objects`.
- A1 §Surface Area (calculate from a given net) → `surface-area-prism`.
- A2 §Surface Area of Closed Cylinders (Investigation + Example,
  $A=2\pi r^{2}+2\pi rh$) → `surface-area-cylinder`, already prereq'd on
  `circumference-circle` and `area-of-circle`.
- A3 §Composite Prisms, §Prism Combinations → `surface-area-composite-solids`.
- "Solve practical problems involving the areas of composite shapes" (dp-1 bullet)
  → `composite-area-problems`.
- Review of Prior Knowledge in all three booklets (areas of
  rectangles/triangles/circles/sectors; perimeter of sectors) → the Stage-4 area
  strand; ambient here.

## Net change applied

- **+1 skill:** `surface-area-partial-cylinder` (1 further skill proposed and
  rejected)
- **+1 edge, −1 edge** by transitive reduction (net **0**)
- **0 re-scopes**
