# Stage 4 and 5 masters: every open comment settled (11 November 2026)

James asked for every comment in the Stage 4 and Stage 5 masters to be reviewed: resolve those needing no action, address the rest, and leave only genuinely tricky ones. Import workflow flags (`workflowIssue`, hidden from Studio's Comments panel) are out of scope.

**Before:** 352 open comments in 95 masters (321 audit v2, 14 polish page breaks, 5 v1 pedagogy, 12 teacher or import notes).
**After:** 1 open (below). Every save was revision-checked and page-checked (student, short, worked). Pages with new content were looked at.

## What was done

- **Applied automatically (171):** the change is in the booklet, so each comment is resolved with "Checked". This covers moves to Challenge, guided-practice redrafts, sorts, holds and corrections. Ratios 2 p57-q12 was later returned to Exam questions, and its resolution says so.
- **Theory rewrites (about 75 Definition and Wording comments):** applied by hand through `settle-20261111/spec.patch.mjs`, one revision-checked save per booklet. Taste-only parts were trimmed: the teacher's cautions, colours and annotated formulas were kept. Two cases were kept on purpose: y = 1x³ (it shows k) and the step order of Circle Trig 2's p47 example (it matches the right-hand example).
- **Errors, checked by hand:**
  - Fixed: Compound Events Q12b (30 → 29 athletes, check line); Congruence exam (vertex order, all three pairs); Coordinate Geometry Formulas exam (2 − (−1)); Non-right-angled Trig 1 exam (240.3366…, 15.5028…); Standard Deviation exam (mean 14.73); Surface Area p24-q14 (207.3 cm²); Further Non-linear 2 p49 (−1.59); Earning Money 2 Q14 ("income tax payable"); Significant Figures Q18a (positive integers less than 10, so p = 5, q = 4).
  - Deleted: Simultaneous Equations p36 row b was a false alarm, since it follows row a's layout.
- **Placeable drafts:** applied with `apply-comments`.
  - Repeated-part and duplicate replacements, bridges, opening review items and new teaching.
  - Twelve drafts that had failed their checks were redrafted with `claude-sonnet-5-5` and blind-solved (`review-tools/redraft-20261111/`, about $1.40). All were accepted.
  - Drafts that had failed the page check were repaired in their stored payloads (`fix-payloads*.mjs`):
    - house TikZ colours and line widths;
    - nested `$` inside `\text`;
    - a blank inside a fraction;
    - a restated stem;
    - guided practice with figure parts laid out two to a row (they ran past the footer one to a row).
- **Five single-part replacements** I had first written myself are new content. They were redone by Sonnet, checked, and the questions re-rated by Sonnet comparison: Index Laws t7-q5a, Negative Index Laws p8-q2v and p5-q4b, Simultaneous Equations p17 b and p33 e.
- **Deleted, archived** (in `booklets/provenance/pedagogy-review/audit-v2/archive/ID-deleted-20261108.json`, the tool's fixed name):
  - 2 over-cap count drafts (8 Nov rule);
  - 6 optional extensions with no usable draft;
  - Circle Trig 1 Q4's repeats (a deliberate 28-part recall drill);
  - 5 v1 pedagogy comments, superseded by v2's slots and prerequisite check;
  - 11 page-break suggestions that no longer save a page when re-measured.
- **Page breaks removed (3):** each still saves a page and splits no block (Algebraic Fractions Binomial p9, Further Algebraic Fractions p6, Rearrange Formulas p17).

## James's own comments

| Booklet | Comment | Done |
| --- | --- | --- |
| Algebra 7B | Q17: move to mixed factorisation and add 6 graded parts | The example opens Exercise 6, followed by a new question a–f (49 − (x+1)² … (2x+1)² − (x−4)²). Drafted by Sonnet, rated 37 by comparison. |
| Algebra 7B | Q21 after Q22? | Yes: Q22 (its powers-of-4 example) now comes first, then Q21, then the audit's "factorise fully" question and the numbers question. |
| Algebra 7A | p15-q16 belongs in Further Factorising | Moved to 7B's difference-of-two-squares exercise with its layout, rating and bank link. |
| Quartiles | Review for median position before Q1 | A review item ((n+1)/2 for n = 15 and 20) opens the Review box. |
| Quartiles | Two-step worked example and guided practice for drawing a box plot | Step 1 (vertical lines) and Step 2 (box and whiskers) print side by side, each with its own figure, then guided practice a–c, before the key ideas. |
| Introduction to Algebra | j5 in two columns so the key ideas fit | Already so on today's pages (page 17); resolved. |
| Logarithms | p3 typo | Part d 5^x = √x → 5^x = √5 (x = ½). |
| Similar Triangles | Q3d 80° conflicts with the sides | The 80° label is removed: it is impossible with EF = 9, DF = 15 and the included 30°, and the SAS answer never used it. |
| Further Algebraic Fractions | Import notes | Review d x² − x + 6 taken as a typo for x² − x − 6 = (x − 3)(x + 2). The p30 note is resolved (the box has its content). The p36 image notes are deleted (that block is gone). |

## Left for James (1)

- **Elevation, Depression and Bearings p29-q15, opening review item** (isosceles base angles and the angle sum before the route questions). The drafted figure question cannot be placed: the Review box's page is full, and the page check rendered it past the footer with a clipped label. Delete it, or say where it should go.

## Also fixed in passing

- Algebra 7B: an audit-added question (Q4, "Complete the factorisation") printed its blank's code (`\rule…\hspace…`) as text, because two `$$` ran together. Its parts are now one under the other.
- FQE 2 p28-example: its block-level arrangement still pointed at `prompt#p28-example-working`.

## Not done

- 90 stale `prompt#` arrangement refs in 23 masters, left from the 10 Nov working move. These are proposed as a separate task.
- Pre-existing scanner findings in Stage 4 booklets, where only comments were resolved: Area 3 (two restated-stem parts), Comparing Fractions (three), Linear Relationships 1A (a run-letter order).
- Inserted teaching leaves half-empty pages in some booklets (for example, Bivariate Data 3A pages 12–14). Two Elevation figures have crowded compass labels.
- James's own Studio edits to Algebra 7B and Quartiles from the evening of 10 Nov were already in the working tree and are committed with this work.
