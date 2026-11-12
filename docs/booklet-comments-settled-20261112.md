# Master booklets: every open comment settled (12 November 2026)

James asked for every booklet comment to be resolved, with ambiguous cases decided and only genuinely tricky ones left. This page covers the masters and, under [Textbook imports](#textbook-imports), the 113 import-review booklets. Import workflow flags (`workflowIssue`, hidden from Studio's Comments panel) are out of scope, as on [11 November](pedagogy-audit-v2-stage45-comments-20261111.md).

**Before:** about 700 open comments in 174 masters. Most were pedagogy audit v2 comments. The rest were 14 polish page-break suggestions, 13 v1 coverage notes, about 38 old import notes and 2 of James's own notes.
**After:** 1 open (below).

Every save went through `publishProject`. Each save was revision-checked and synced to the bank where a question owns a bank entry. Every content or layout change was page-checked in the student, short and worked editions. Pre-existing failures on the live booklet were forgiven by baseline.

## What was done

| Outcome | Comments |
| --- | --- |
| Applied now by `apply-comments` (theory rewrites, Key ideas, bridges, review items, new questions, replacements) | 106 |
| Checked: the change had been applied earlier and is in the booklet (includes 75 re-sort notices) | 292 |
| Ordering holds | 116 |
| Fixed by hand: errors, definitions, wording | 69 |
| Kept, with the reason in the resolution | 44 |
| Not added: draft failed the page check twice, or its maths does not render | 20 |
| Old import notes on accepted masters | 33 |
| v1 coverage notes superseded by audit v2 | 14 |
| False alarms deleted (archived in `booklets/provenance/pedagogy-review/audit-v2/archive/`) | 7 |

### Ordering holds (116)

Each hold was re-planned with the audit's own `orderCandidate` (`.booklet-work/comment-settle-20261112/plan-holds.mjs`):

- **Sorted:** 16 holds had been released by the 11 November planner fixes. Their 7 exercises were sorted and page-checked.
- **Already in order:** 8.
- **Teacher order kept:** 92. The hold is still real: a printed reference such as "the diagram below", a semantic unit, a layout pin or an unverified rating. Each resolution names its hold.

### Applied changes that never reached a booklet

63 stored proposals were marked `applied` but were missing from their booklets. They had been taken out after a failed page check during the audit apply. Their flags were cleared and they were retried one at a time:

- About 45 applied.
- The rest failed the page check again and are resolved as "Not added", with the failure named. In most cases the failure was footer overflow for a guided-practice block.

### Errors fixed

- **Circle Trig 2 p38 Q3:** worked answer row f repeated cos 300°. It now shows sin 315° (45°, −, −sin 45°, −1/√2) with a 315° ray.
- **Logarithms p3 (James's note):** part d 5^x = √x was changed to 5^x = √5, giving x = ½.
- **Further Transformations p18:** "Inverted V" was changed to a V with vertex (0, −3).
- **Rates of Change p19 part c:** the velocity is now v = t − 2. The source answer was displacement 0 m and distance 4 m; the printed √((t−2)²) gave 4 m for both.
- **Trig Any Magnitude 1 p13 Q4b:** −sin 57°/cos 53° was taken as a typo for −sin 37°/cos 53°, so the source answer −1 now holds.
- **Option labels:** Graph Transformations p30 skipped D.
- **Logarithms 2 p35:** the blanks expected 3 decimal places although the prompt asks for 2.
- **Discrete RV p21:** the worked xP(x) row printed zeros.
- **Optimisation 2 exam:** 6.54 changed to 6.55.
- **Financial Maths exam:** 5886.57 changed to 5886.54.
- **Further Areas 2 p28:** 0.704890 changed to 0.70464.
- **Estimating Change p17:** the answer referred to "question 4" instead of question 1.
- **Volumes 2 exam:** "washer" changed to "disc".
- **Further Trig p17:** −1 ≠ 3 changed to −1 ≠ −3.

**False alarms deleted (7):**

- Binomial p14: 2160.
- Further Non-linear 2 p64: −60.
- Graph Transformations 2 p49: transformation order.
- Rates of Change p4: 1:30 pm.
- Financial Maths p13: $4509.68.
- Vectors 2 p51.
- Permutations p24: 27 216.

### Definitions and wording

The audit's rewrites were placed by `apply-comments` where its placement code could map them. The rest were applied by hand when they correct something:

- dilation does not always preserve shape;
- the sign of a z-score;
- complement, multiplicity and point-gradient form defined;
- conditions added: a > 0 and a ≠ 1; r > 0; n = 0, 1, 2, …; cos θ ≠ 0 and sin θ ≠ 0 in the ratio identities; −1 < f(x) < 1 in the inverse-trig chain rule; k < 0 has no solution;
- "balls" changed to "marbles", and "keeping it out of the jar" added;
- the inverse-function and reflection statement;
- the trapezoidal rule term.

**Kept, with a reason:**

- taste-only rewrites;
- rewrites where the teacher's convention is used throughout ("equivalent angle", the reference-angle label A);
- three rewrites that overflowed their formula column on the page check: Volumes 2 radii, Further Trig reference table, and parity.

**Polish page breaks (14):** all kept. Each exercise starts on a new page, per the [pagination principles](booklet-pagination-principles.md).

## Left for James (1)

- **Financial Maths p14 Q1.** Both instructions ask for future value, but the table is headed "Present value of $1" and the supplied answers are present values. Either fix changes the assessed task:
  - reword the instructions to present value, which the lesson's teaching (pages 12–13, future value) does not cover; or
  - replace the table with future-value factors, which changes every answer.

## Fixed in passing

- `scripts/booklet/bank-sync.mjs` read all 9,131 bank records at once. Since today's bank import, every save that touches a bank-owned question failed with EMFILE (too many open files) on Windows. It now reads in batches of 256.
- **The running Studio server still has the old code until it restarts**, so a Studio save of a bank-linked question may still fail until then.

## Textbook imports

**Before:** 9,253 open comments in 113 import-review booklets (ICE-EM 7–10, Enrichment Maths 1–2, Cambridge Year 11, Concept Maths, Mastering Maths).
**After:** 513 open, deliberately (below). Cambridge Year 11 ch05 was being imported by another session and was not touched.

| Outcome | Comments |
| --- | --- |
| Helper-access notes: "the working-space helper could not run" (`lean-review.mjs` treats them as processing records; working space is set by the calibrated pass and pagination) | 5,948 |
| Answer-match records: the answer is present, but its teacher-page reference was not recorded (also processing records) | 921 |
| Teaching-evidence caveats accepted: standard method, stated in full; the source teaching pages were not supplied | 995 |
| Judged by `gpt-6.1-sol` low, settled (with the block text inline; each resolution says what was checked) | 643 |
| Judged, accepted as evidence-only caveats | 165 |
| Fixed by text edit, page-checked | 16 |
| Fixes rejected, with the reason recorded (a "provisional" label in student text, "use an A3 sheet", printed textbook example references) | 7 |
| Target block no longer exists | 45 |

The judging packets and verdicts are in `.booklet-work/comment-settle-20261112/imports/`. Fixes made:

- **ICE-EM 7 ch02 Q6:** 19 283 746 556 000 000 001 has digit sum 57, not 72. It is no longer listed as divisible by 9, which matches the source answer.
- **ICE-EM 8 ch04:** the source divides by 10, not 100, so the answer is −60.
- **ICE-EM 10 ch14:** 5√2 → 5√5, so the log statement 5^(3/2) = 5√5 is true.
- **Enrichment 1 p28:** the printed data forced a degenerate cone. The total surface area is now 10π, so s = 3 cm.
- **Other fixes:**
  - an impossible "show that" changed to an evaluation;
  - a convex n-gon stated for the star-angle formula;
  - diameter endpoints defined;
  - proportionality conditions stated;
  - a rhombus question concludes correctly;
  - "identify all" where two options qualify;
  - "three times as many";
  - a completed congruence proof;
  - an exercise reference corrected (Q7(c)).

### Left open in the imports (513)

- **364 "not rendered at final size" notes.** The import finish step (`lean-review.mjs`) uses open flags to choose pages for visual review. Resolving these without rendering would hide those pages from the review, so they stay open for the finish export.
- **147 structural assembly items**, listed in [booklet-import-comments-open-20261112.md](booklet-import-comments-open-20261112.md). Each needs a non-text change, for example:
  - merging a follow-up question into the question that owns it as further parts;
  - restoring a category heading;
  - binding answers to table cells;
  - routing a block to its exercise;
  - choosing a taxonomy skill.
- **For James:**
  - **Cambridge Year 11 ch04 p5:** do the cartons have to stay parallel to the room's sides, or can they rotate? The teacher's four-carton packing assumes they stay parallel.
  - **Enrichment Joshua p17 Q(b):** the displayed answer needs an opening bracket that the cloze cannot hold yet. This one is structural rather than a decision.

## Not done

- Drafts resolved as "Not added" are kept in the proposals store. Most are guided practice that overflows the footer, so they could be placed with a page break or two-to-a-row parts if wanted.
- The 513 import comments listed above.
- The commit includes an uncommitted edit to Further Differentiation and Integration 1 that predates this work.

## Follow-up (12 November 2026, later)

James asked for the three items left above to be decided and done.

### James's decisions

- **Financial Maths p14 Q1:** the present-value version was a mistake.
  - The table is now "Future value of $1" (ordinary annuity factors, 2 d.p.), and the intro and instruction ask for future value.
  - The answers are $4240, $144 320 and $33 100.
  - The present-value worked example and guided practice added on page 13 (audit comment `c285314a`) were deleted, and the proposal is marked reverted.
- **Cambridge Year 11 ch04 Q17:** the cartons stay parallel to the walls. The stem now says so, and the answer 4 stands.
- **Enrichment Joshua p17 Q3:** every part has the same four blanks: before ½, two operator blanks of one width, and after ¼. The opening bracket in (b) now has a place, and no part gives its brackets away.

### The 20 "Not added" drafts

- **Placed:** all 19 found in the stores are now in their booklets, and the 20th, Optimisation, was a mislabel (below).
  - The re-apply tool is `.booklet-work/comment-followup-20261112/drafts/reapply.mjs`. It runs `applyComments` on a copy with the flag reopened, so placement and the maths check are the audit's own.
  - Each draft's fix is in `drafts/tweaks/<booklet>.mjs`.
  - Every page was looked at before saving.
- **Footer overflow:**
  - The guided practice splits between parts: DE 2, 3D Trig ×2, Area/Volumes, Network.
  - Working space was tightened by 2 to 3 mm: Sum and Product of Roots, Financial Maths 2.
  - The Binomial parts are one to a row.
- **Optimisation:** the comment was in **Optimisation 2**, not Optimisation; the 12 November list named the wrong booklet. Its two worked examples were each taller than a page. Their solution steps are now set in two columns and each starts a new page.
- **Palette:** Further Transformations (#8A8A8A → muted), Estimating Change (black!35 grid → border grey; #FF8A1F → orange) and Sets (a translucent fill → solid blue fill).
- **Trig Any Magnitude:** the triangle figures carried the graph-strokes marker, which belongs only on graphs; it was removed.
- **Maths that did not render:** Permutations 2 (two Key ideas blanks split a formula), Rates (currency signs).
- **Working with Functions 8:** the replacement part no longer restates the stem.
- **Elevation, Depression and Bearings:** the review item became part i of the existing Review grid, now three to a row, with its triangle redrawn at the grid's 30 mm.
- **Network:** besides the split, the draft's four adjacency tables had their cells one column off. They were rebuilt in the booklet's table form.

### The 147 structural import items

All are resolved. The lead did Cambridge ch03; six Sonnet subagents did the rest, each owning its own booklets (brief: `.booklet-work/comment-followup-20261112/imports/BRIEF.md`). Each booklet's patch is in `imports/b/<booklet>/patch.mjs` and went through `settle-comments.mjs` (page check, then `publishProject`).

**Already done (checked):**
- the Cambridge ch03 follow-ups merged by the bank run;
- most Enrichment 2 section associations;
- several crops and diagram values that were already corrected.

**Headings:**
- Cambridge Enrichment and Development headings;
- "The following questions are more difficult" (ch01 p25);
- ICE-EM chapter titles.

Mastering ch01/ch02 already print their category headings through `flow.practiceCategoryHeading`.

**Merges and embeds:**
- iceem-8 ch03: Q16 was merged into Q15.
- Self-contained stems were kept instead of merging where the follow-up carries its own givens: Cambridge ch03 p43 Q4 and p58 Q2, iceem-7 ch15.

**Table answer binding:** answers are bound to the table node, as the verifier requires, with `tableOnlyPartIds`: iceem-7 ch09 ×3, iceem-8 ch10, iceem-9 ch10/ch11, Enrichment 2 part 4.

**Content:**
- Enrichment 2 part 10: the four missing poker categories are added (counts recomputed; all nine sum to 2 598 960).
- iceem-9 ch07: the 67° is marked approximate.
- iceem-9 ch09: a piano crop.
- iceem-8 ch10: the plan is calibrated to 67.2 × 58.8 mm.
- iceem-7 ch18: symmetry solution tables.
- iceem-7 ch22: tessellation figures, and a black figure-only crop for Activity 5.

**Taxonomy (Concept Maths ch02), for James to confirm:**
- p36-q73 and p70-q26 → `simultaneous-equations-algebraically`;
- p149 → `intersection-line-curve`.

No exact skill exists for the k-method or for comparing two curves.

**Render rows:** every one was looked at, at final size. Label defects were fixed beyond the rows:
- Cambridge ch03 Q8 ticks and labels, and Q13 intercept labels;
- iceem-9 ch07 and ch10 Q2b/Q2c;
- Enrichment 1 part 14 ×3;
- iceem-7 ch13;
- iceem-8 ch08.

### Still open

- **Shading reviews:**
  - Enrichment 1 part 14 p22-q27 needs a fresh lean shading review (`lean-review.mjs shading`) after its label moved.
  - The eight iceem-7 ch22 Activity 5 figures point at a new image, so any image-shading review for them needs re-binding.
  - The import finish step reports both as pending.
- **Noticed, not changed:**
  - Enrichment 1 part 15 p19-g-q4 reprints its diagram above part d.
  - Mastering ch01 p8 numbering.
  - ch09/ch21 have chapter headings only where flagged.
- **Lost patch file:** the first-pass patch file for iceem-9 ch10 was overwritten by the second pass. Both passes are saved in the booklet (revisions 6 and 7).

Tools and logs are in `.booklet-work/comment-settle-20261112/`:

- `hand-spec.mjs` and `hand-spec2.mjs`: every hand decision and its edits;
- `build-applied.mjs`: checks that earlier-applied changes are present;
- `plan-holds.mjs` and `plan-resorted.mjs`.
