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

Tools and logs are in `.booklet-work/comment-settle-20261112/`:

- `hand-spec.mjs` and `hand-spec2.mjs`: every hand decision and its edits;
- `build-applied.mjs`: checks that earlier-applied changes are present;
- `plan-holds.mjs` and `plan-resorted.mjs`.
