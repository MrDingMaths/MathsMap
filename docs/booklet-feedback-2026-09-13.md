# Booklet Studio feedback, 13 September 2026

This maintenance addresses the ten exported comments for Angle Relationships v1
revision 431. Existing local work and source evidence are retained. Current
acceptance results and exact render inputs are recorded under
`.booklet-work/angle-feedback-20260913/`.

## Changes and scope

- One Layout & spacing panel replaces the four toolbar entry points. Question,
  selected object/group, text and detailed arrangement controls retain their
  existing transactions. Native table row minimum heights and cell padding are
  available while editing a table or its contents.
- Semantic activity correctness marks use 14 pt, standard red/green, in print,
  preview and rich editing. The audit migrated 16 marks in Angle Relationships,
  five in Index Laws, ten in Linear Relationships and 56 in trigonometry.
  Multiplication expressions and practice-only correctness answers are excluded.
- Numbered teaching calculations use the shared `numberedTeachingWorking`
  authoring helper: left-aligned red numbers and independently aligned blue
  equations. The two page 28 worked demonstrations retain their complete
  equations, source numbering and angles-at-a-point explanation.
- Angle p17 Q1 retains paired figures and smaller diagram-to-scaffold gaps using
  smaller reserved heights (24, 29 and 26 mm) and 1 mm local vertical gaps.
- Angle p29 Q1a restores source line `45 + g = 360` above the existing response.
  Original source page 29 was inspected independently of current content.
- Angle p38 Q5 removes ordinary-label `\mathbf` without changing geometry or
  givens. Labels remain calibrated at 10 pt final size.
- Co-interior Pairs begins a new page through an explicit local flow break.
- The circle in source p58 Q7 (stable ID `p58-q7-k-diagram`, currently labelled l)
  retains both diagonals and parallel chords. Its lower chord is wider and the
  intended 57-degree sector has a small unfilled angle arc. Endpoint angles
  130, 46, -68 and 244 degrees retain parallel chord directions and a 57-degree
  alternate-angle pair, checked numerically.
- Angle p67 Q8a's label precedes its whole row. Its scaffold uses 8 mm minimum
  rows, 1 mm cell padding and 94 mm width, preserving writable blanks.
- Structural labels no longer consume grid tracks when positioned outside a row.
  Resize handles and keyboard resizing use the same content-column list. The
  current occurrence audit identifies Angle p54 Q2, p67 Q8 and Probability p16
  Q23; other current books have no affected labelled rows.

## Shading review

Eight stale/missing shading records were reviewed against their current source
and context. Six Angle Relationships findings are solid vertex or ray-end
markers only, including the restored scaffold and regular-weight-label diagram;
no angle sectors acquire decorative shading. Probability's spinner fills encode
three green, two blue and one red equally sized sectors and their named outcomes.
The retained coin-flip PNG was visually inspected: face/edge and hand/finger
separation identify the experiment, and original raster pixels remain intact.
Current exact source and context hashes are in the shared shading register.
This review records paint purpose, separately from layout and mathematical
visibility acceptance.

## Verification record

- Representative ten-page Angle PDF passed DOM and printed geometry checks.
  Full-size visual review caught and repaired equation width, an unused label
  grid track, and ragged scaffold row baselines before the settled export.
- Isolated editor tests passed row height/padding, undo/redo, save/reopen,
  correctness-role persistence, Escape focus restoration and a 390 px panel.
  The existing document-tools browser regression passed 25 isolated saves.
- The broad run passed 806 of 807 tests; its sole failure was the eight
  stale/missing shading records (six were present before this maintenance).
  The refreshed shading and focused content run passed all 10 tests.
- Whole-book source readiness includes pre-existing unreviewed content and
  arrangements. Review exports use `--draft` so layout verification is not
  misrepresented as whole-book source-fidelity acceptance. Feedback comments
  were resolved only after their affected-edition visual checks passed.

Original source documents, historical review assertions and unrelated concurrent
edits remain unchanged. Future authoring conventions are recorded in the
cross-session rules. Export logs, candidate snapshots, screenshots and PDF caches
are local evidence, not release assets.

## Final acceptance

All five settled Angle editions passed DOM, palette, final-size diagram typography,
printed geometry and internal navigation checks: Questions 80 pages, short answers
16, worked solutions 67, Questions with short answers 96, and Questions with worked
solutions 147. The expanded 12-page development subset also passed. The full check
caught four endpoint-label bounding issues and four stale diagram/scaffold row
weights in p54 Q2; non-drawing bounds and authored 46:118 width proportions repair
these without altering geometry, givens or writing blanks.

Final-size review covered the local repairs and every Angle marker activity
(physical pages 20, 32, 40 and 41). Affected pages, pagination neighbours and answer
transitions were reviewed, including 61 pages of the combined worked edition and
all 16 short-answer pages. Raster content parity passed all 241 comparisons across
the five editions at 500 px page height, excluding the bottom 25 px footer;
cover variations and transitions were reviewed separately. These parity checks
support reuse of reviewed content, not a substitute for the 10 pt typography gate.

Trigonometry passed all five editions (64/4/34/68/98 pages), with a complete
268-page overview and final-size review of the six affected teaching pages.
Index passed all three affected question editions (63/77/131 pages), with the
changed teaching page and neighbours reviewed. Linear's affected three-edition
subset and full student PDF passed; its broader exercise-heading assertion
still expects 12 headings where the canonical book displays 10. This unrelated
full-book finding remains open. Probability's single affected label row passed
three isolated edition checks and final-size visual review.

The editor regressions cover table height/padding, selection retention, undo/redo,
save/reopen, semantic marker persistence, Escape and Close-button focus restoration,
and the narrow 390 px panel. Production build and repository storage checks passed.
The 3D visibility audit reported no unresolved acceptance failures. Question-bank
status remains synced for Index (149), Linear (168) and trigonometry (91); Angle
has no linked questions. Pinned consumers were not advanced.

Measured final five-edition Angle render/check time was 524.108 s, excluding manual
review. Trigonometry took 209.331 s; the Index run before the separate Linear
heading assertion took 163.756 s. The expanded Angle subset took 32.413 s. Earlier
attempts are retained in local logs: an unsupported equation-array form, two
representative layout failures, the initial nine-issue full Angle export, and a
602.345 s opening timeout. The later settled run passed without increasing the
opening timeout. No token or unmeasured time-saving claim is made.

The exact ten-comment occurrence register, edition/page links, rendered project
hash, final resolution transaction and measured run records are in
`.booklet-work/angle-feedback-20260913/acceptance.json`. The final metadata-only
resolution advances Angle from revision 434 to 435; accepted printable content
is unchanged. Original revision 431 and subsequent recovery checkpoints remain
available locally.
