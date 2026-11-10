# Pedagogy audit v2, Stage 4 campaign: report (8 November 2026, part 3)

This continues `docs/handoff-pedagogy-audit-v2-stage4-20261108b.md`. Batch 2 ran to the end, the count top-up ran for the booklets audited before the count rules, and every finished booklet was recounted, rescanned and page-reviewed. The code fixes are in `docs/booklet-pedagogy-audit-v2.md`, section "Fixes from the 8 November evening run". Nothing is committed. `npm run repo:check` passes, and `tests/pedagogy-audit-v2.test.js` passes 43 of 43.

## How each booklet was checked

- **After its audit or top-up:** `review-tools/after-booklet.ps1 ID`. It recounts the count questions, dry-runs `remove-count-slots.mjs`, and dry-runs every repair scanner.
- **Page review:** `review-tools/review-run.ps1 ID` tiles the pages holding the run's blocks. Every tile was looked at, and so was every page changed by a removal or repair.
- **Final rescan:** at the end, all 45 audited booklets were rescanned with all ten scanners. The only changes left are the two 3→2 column cases the handoff says to leave (Area 1 j7, Converting FDP j7).

## Cost

$56.77 in 378 calls, from the ledger rows logged after 06:00Z. Batch 2 was $45.83 (268 calls) and the top-ups $10.94 (110 calls). The Operations with Decimals 2 audit ($2.53) and the Comparing Fractions top-up ($0.64) were in flight at the pause, and the earlier session's figures include them. The recounts' roles calls were about $0.80.

## Batch 2 (full audits)

"New Q" is the number of slot questions applied. "Applied" counts the auto-applied changes. "Variations" are proposed / confirmed / applied. "Comments" are changes left for James, with the reasons that recur.

| Booklet | Rev | Cost | New Q | Applied (auto) | Variations | Comments | Count questions removed after recount |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Linear Relationships 1 | 264 | $3.85 | 10 | 13 | 2/0/0 | 9: 5 theory blocks with no editable text, 2 short clozes, 1 example without its figure, 1 bridge cloze | 0 |
| Operations with Decimals 2 | 5 | $2.53 | 4 | 20 | 0/0/0 | 1: p43 example text is coloured | 0 |
| Operations with Decimals 3 | 3 | $1.38 | 1 | 14 | 0/0/0 | 0 | 0 |
| Operations with Decimals 1 | 636 | $2.50 | 4 | 10 | 0/0/0 | 1 | 0 |
| Percentage Change 2 | 4 | $1.82 | 8 | 10 | 0/0/0 | 0 | 1 (p57 slot-9) |
| Percentage Change 1 | 401 | $1.56 | 9 | 13 | 0/0/0 | 0 | 1 (p32 slot-12) |
| Percentages Problems | 354 | $1.75 | 5 | 10 | 1/0/0 | 2: a Key ideas fraction and a bridge's `%` that do not render | 0 |
| Probability | 391 | $2.76 | 12 | 14 | 1/0/0 | 2 | 0 |
| Properties of Geometrical Figures | 401 | $4.92 | 7 | 21 | 2/1/1 | 0 | 1 (p29 slot-12; a second kept by the jump guard) |
| Pythagoras | 323 | $4.15 | 13 | 20 | 1/0/0 | 3, plus p6 theorem reopened (see below) | 1 (p9 slot-7) |
| Rates 2 | 3 | $2.11 | 3 | 17 | 1/1/1 | 4: theory blocks whose structure would change | 0 |
| Rates 1 | 333 | $1.55 | 1 | 18 | 1/0/0 | 1 | 0 |
| Ratios 2 | 5 | $1.89 | 4 | 17 | 1/0/0 | 3 | 0 |
| Ratios 1 | 456 | $1.42 | 2 | 12 | 1/0/0 | 2 | 0 |
| Simple Quadratic Equations | 131 | $0.60 | 2 | 8 | 1/0/0 | 1 | 0 |
| Simplifying Expressions | 187 | $2.09 | 0 | 14 | 2/2/2 | 0 | 0 |
| Solve 2-Step Equations 2 | 6 | $2.56 | 5 | 13 | 1/1/1 | 0 | 0 |
| Indices 2 | 3 | $2.45 | 11 | 21 | 0/0/0 | 7: 3 theory structure changes, 4 Key ideas whose blank sits in a superscript (`a^{[[m+n]]}`) | 0 |
| Indices 1 | 562 | $2.32 | 20 | 14 | 0/0/0 | 0 | 0 |
| Volume | 649 | $4.15 | 1 | 19 | 2/1/0 | 2, plus p19 reopened (see below) | 1 (foundation slot-6) |

## Count top-up

"Added" is the number of top-up questions the run applied.

| Booklet | Rev | Cost | Added | Variations | Removed after recount | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Computation with Integers 2 | 9 | $0.75 | 0 | 0/0/0 | 0 | Applied at the pause: comments and a rating only |
| Comparing Fractions | 403 | $0.64 | 1 | 0/0/0 | 0 | Applied at the pause; skipped this time |
| Computation with Integers 1 | 530 | $0.55 | 2 | 1/0/0 | 0 | Two temperature-table questions after Q9 |
| Converting FDP | 277 | $1.40 | 9 | 1/0/0 | 4 (2 older, 2 just added) | See "Recount after a top-up" |
| Data Analysis 2 | 244 | $0.88 | 5 | 0/0/0 | 0 | Q7's stem-and-leaf plot is loosely spaced. Q5's boxes overlap dots, as the teacher's Q4d does |
| Data Analysis 3 | 98 | $0.98 | 1 | 1/0/0 | 0 (1 listed, kept) | See "Recount after a top-up" |
| Data Analysis 1 | 654 | $0.99 | 1 | 1/1/1 | 0 | |
| Rounding Decimals | 100 | $0.31 | 2 | 2/0/0 | 0 | |
| Solve 2-Step Equations 1 | 480 | $0.39 | 0 | 1/0/0 | 0 | No shortfall |
| Data Visualisation 1-2 | 12 | $1.28 | 4 | 1/1/1 | 2 older (2 just added kept) | Q15 "which graph is not misleading": the answer is right (C's scale is irregular), but the point is subtle |
| Formulas | 107 | $0.10 | 0 | 1/0/0 | 1 older (p5 slot-1) | |
| Factorising Expressions | 97 | $0.53 | 3 | 1/0/0 | 0 | |
| Area 1 | 307 | $1.90 | 2 | 0/0/0 | 0 | Q11's two calculations checked against the figure |
| Introduction to Algebra | 316 | $0.88 | 1 | 1/0/0 | 0 | New Exercise 8 Q1 (9 − 4x) comes before the table practice it builds on |

Two top-ups from the earlier session had not been page-reviewed. The Area Circles and Sectors top-up page reads cleanly. The Area Quadrilaterals top-up added comments only, so it has no pages.

**Recount after a top-up.** The recount makes its own roles-and-groups call, which can group types differently from the top-up's call minutes earlier.
- Converting FDP: a fresh recount grouped 4 synonym pairs, and 2 top-up questions were removed with 2 older ones.
- Data Visualisation 1-2 and Data Analysis 3: the recount listed top-up questions for removal (Data Analysis 3's on a cached, older reply).

From Data Visualisation 1-2 on, a fresh top-up's own questions are kept (`review-tools/keep-topup-slots.mjs`, run by `after-booklet.ps1`), and only older surplus count questions are removed. Say if the two Converting FDP top-up questions should come back.

## Pages checked from the pause

- **The 11 count questions removed at the pause** (Angle Relationships 1: 2, Data Visualisation 1: 4, Linear Relationships 2: 2, Length 1: 3). Their pages read cleanly. On Data Visualisation 1 p8, Q6 is a near-copy of Q4 (survey question giving numerical data) and lists its options more widely spaced.
- **Linear Relationships 1's render "exit 1"** was its 3 layout issues already in the live booklet. The save was correct.

## Repairs made with revision-checked saves, and rendered

- **Linear Relationships 1:**
  - 17 tables of values made bordered;
  - the Key ideas blank `[[substitute|0]]`;
  - slot-11-lower's stem table.
- **Linear Relationships 2:**
  - 3 tables of values;
  - slot-3's graph grid replaced with page-64-q15's house grid.
- **Data Analysis 2:** j3's stem-and-leaf plot made borderless again.
- **Length 1:** p27 figure `align=centre` restored to `center`. The short and worked editions now render.
- **Probability:** j9's split results tables rebuilt, in the example and the guided practice.
- **Pythagoras:**
  - j5's chord figures enlarged 1.7 times;
  - p6's GeoGebra links restored, and the theorem rewrite's comment reopened.
- **Ratios 2:** 3 Key ideas boxes numbered once.
- **Rates 1, Simplifying Expressions, Factorising Expressions:** 6 replaced parts written bare like their siblings. Synced to the bank.
- **Solve 2-Step Equations 2:** empty guided-practice steps filled, in 2 blocks.
- **Volume:** the p19 formula V = lwh restored, and the rewrite's comment reopened with the reason.
- **Operations with Decimals 3 and 1:** both applied by hand after their fixes. Ledger rows are marked `manual`.

## Issues for James (not changed)

- **Indices 2:** 4 Key ideas statements whose blank sits inside a superscript (`$a^m\times a^n=a^{[[m+n]]}$`) stayed comments, because the lifted maths is unbalanced. Probability p28 has the same issue with `\frac{`. A fix would let the box show the exponent as a blank beside the maths. Not done yet.
- **Volume p19 and Pythagoras p6:** the theory rewrites are open comments. Their own blocks are plain text (Volume) or a statement beside a figure (Pythagoras), so they need a hand edit.
- **Percentages Problems p55:** the new Key ideas box sits between Exercise 7 Q1 and Q2, because the teacher's Example is placed inside that exercise.
- **Properties of Geometrical Figures p48:** the Review box's first, unnumbered teacher item now sits above the audit's numbered items 1 and 2.
- **Ratios 1 p30:** Key ideas item 1 speaks of a "1 : n" ratio in a lesson about ratios where neither part is 1.
- **Already in the booklets (teacher content):**
  - Percentage Change 1 p35 Q16: 4 columns, so "Decrease Q by 60%" runs into the next part's label;
  - Rates 1 p22 Q7: an empty part a;
  - Pythagoras p10 Q5: scaffold placement;
  - Simple Quadratic Equations p11: guided practice with no worked example;
  - Operations with Decimals 3 p15: a bracketed "[Algorithmic method …]" heading.
- **Earlier issues** in the handoff (Computation with Integers 2 short clozes, Data Visualisation 1 pictograms, Expanding Brackets Q8, Introduction to Algebra p25 and j4, Linear Relationships 2 callouts) are unchanged.
