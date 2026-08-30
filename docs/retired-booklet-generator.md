# Retired: the booklet generator (2026-08-30)

An attempt to replace the Word-authored lesson booklets with a JSON question bank plus a
recipe, rendered to per-class PDFs. **Abandoned after the pilot.** The code is gone; this
note exists so the next person to have the idea starts from what was learned rather than
from scratch.

Pilot booklet: `booklets/Stage 5/Trigonometry C 2_Non-Right-Angled Trigonometry.md` and its
sibling `.docx`. Commits `7092de7`..`fa17167`, all reverted except the pieces listed under
"What was kept".

## What it did

`booklet.md` + `booklet.docx` → deterministic parser → per-section skeleton → an agy task per
section that filled in the prose → a collector that rejected any structural departure from
the skeleton → an independent fidelity check on a different model → recipe → HTML → Chromium
PDF, with Paged.js for contents page numbers and running headers.

Variants were class levels (standard / top / support) implemented as a tier filter, crossed
with student/teacher output flags. Six PDFs rendered in about twenty seconds.

## Why it was abandoned

The rendering half failed on **nested tables and the images inside them**, which is most of
what a booklet page actually is: review boxes containing drill grids, identify boxes with
exemplar rows, cells carrying one or two diagrams each.

On a single representative page: four cells crammed into one row with wrapped text and
mismatched figure sizes; the sine rule formula printed twice in one box; and a "Write sine
rule equation from a diagram" box reduced to a bare prompt with its diagrams missing
altogether. The last is content loss, not cosmetics.

**The root mistake was the target.** The generator tried to reproduce Word's nested-table
layout in CSS. Those tables encode Word's own layout mechanics; nesting them inside a flow
layout with pagination on top was the fragile part, and no amount of CSS repair addresses it.
A generator that owned its page design — fed by clean question data, laying out its own
grids — would not have had this failure mode. The bank format would have survived that
change; the renderer would not.

**A second mistake was how it was verified.** The pipeline reported "53/53 cards, no
overflow, no missing assets" and that was treated as evidence the booklet was good. Those
checks measure *presence*, not layout quality: they cannot see a four-column row that should
be two, or a nested grid that rendered as an empty box. Five pages out of thirty-six were
looked at; the owner read all of them and found the failure immediately. **For anything whose
output is a document, page-level review is the acceptance test and machine checks are only a
pre-filter.**

## What was worth having, and is worth stealing

These were real and are independent of the renderer. Anyone rebuilding should keep them.

**Word's image crops are in the .docx and nowhere else.** pandoc discards `<a:srcRect>`.
45 of this booklet's 185 PNGs are composite strips — one file holding six triangles, shown as
six different crops in six cells — so without the crop data every one of those cells prints
the whole strip. A dependency-free zip reader plus a walk of `word/document.xml` recovers
them exactly. Alignment must be a per-image two-pointer walk using the printed width as a
tie-breaker: pandoc drops drawings it cannot represent (300 in the docx against 201 markdown
references here), so indexing by occurrence attaches the wrong crop.

**Read image references from parsed cell text, never by regex over the raw markdown.** Three
cells share every physical line of a grid table, so a raw regex matches across the `|` walls
and swallows its neighbours' references. A reference also routinely straddles a line break,
so a line-by-line read misses it entirely. Getting this right took the count from 250 to 300
of 300.

**Split what is mechanical from what needs judgement, and make the mechanical half
immutable.** The parser settled ids, tiers, numbering, part labels, origins and figures; the
model could only fill nulls; the collector proved nothing structural had moved. That is what
caught a dropped drill cell, 32 dropped diagrams, and a whole proof box that had been
absorbed into the question above it. It also meant a model failure was contained: one
section came back with a `$` plus one character stripped throughout (`$x^{2} = …$` became
`^{2} = …$`), 58 errors, all caught, none reaching the bank.

**A schema constraint that cannot be satisfied honestly will be satisfied dishonestly.** The
schema required every drill cell to carry an answer. Cells like "Round to the nearest minute:
34° 40′ 12″" print none — the student writes it. The transcription had no honest option and
invented seventeen answers. The rule was wrong, not the model.

**agy will not run parallel instances from one directory.** At concurrency 3 exactly one task
worked and the rest returned `SUCCESS` in 0s having written nothing. Serial runs are
reliable at roughly 3–9 minutes per section. Its daily quota is the real constraint on a
lane this size.

## Errata found in the published booklet

The transcription flagged these in *Trigonometry C 2 — Non-Right-Angled Trigonometry* itself.
They are worth fixing in the Word original regardless of any pipeline.

| Where | Problem |
|---|---|
| Cosine Rule for Sides, Proof step 2 | Asks for an equation relating `c, x, h` in △CBP, but `a` is the hypotenuse (`x² + h² = a²`). |
| Cosine Rule for Sides, Proof step 3 | Asks for an equation relating `b, a, x, h` in △ABP, but `c` is the hypotenuse and `a` is not in that triangle (`(b−x)² + h² = c²`). |
| Selecting an Appropriate Method, teaching box | Sine rule for angles printed as `\frac{\sin B}{B}` instead of `\frac{\sin B}{b}`. |
| Area of a Triangle, Example 1 | Answer given in km² (≈2.7 km²) while the diagram is in metres (3.4 m, 1.8 m). |
| Selecting an Appropriate Method, Q4c | Answer printed as `63 cm`; it is an area, so `63 cm²`. |
| Area of a Triangle, Identify box | Prompt reads "…to find the missing side"; the box is about finding area. |
| Sine Rule for Angles, Review 1 group 1 cell d | Angle printed as `11° 10′ 89″` — 89 seconds is not standard sexagesimal (= 11° 11′ 29″). |
| Sine Rule for Angles, Development Q7 | "Ryan trying to solve this problem" — missing "is". |
| Mixed Bearings, F6 | "…the bearings of town C from towns A and B **and** 039°T and 063°T" — should be "are". |
| Mixed Bearings, D7 | "120 nautical **mules**". |
| Mixed Bearings, M14c | Answer labelled `∠ACD ≈ 22°`; should be `∠ACB`. |

## What was kept

Three changes are unrelated to booklets, already tested, and stayed in the tree:

- `src/lib/render-math.js` and `src/lib/tikz-prepare.js` — the KaTeX renderer and the TikZ
  source preparation, extracted from `src/components/Math.svelte` and `src/lib/tikz.js` so
  they can be used from Node. The extraction also fixed a latent bug in `renderMath`: prose
  such as "$a$ lies between 0 and 1, unlike $b$" could have its " 0 " replaced by a rendered
  expression, because the maths placeholder was ` <digits> `.
- `scripts/lib/lint-math.mjs` — `validateInlineText` and `validateTikz` moved here from
  `scripts/validate.mjs`, so field-level rich-text validation is reusable.
- `scripts/agy/lib/agy-run.mjs` — a quota wall now reports itself as a quota wall with the
  reset time, instead of claiming Google OAuth had expired and sending the operator to
  re-authenticate a working login.
