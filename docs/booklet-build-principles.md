# Booklet build principles (14 November 2026, from James's WF1 feedback)

These principles come from every comment and Studio edit James made on *Working with Functions 1: Algebraic Techniques* (`wf1-algebraic-techniques-v2`, revisions 8 to 504). That was about 90 comments and around 30 hand-set column counts, plus restyled theory tables and working spaces. The aim is that the next booklet needs far less feedback.

They apply to every new booklet, bank draw, theory consolidation and pedagogy audit. They also apply to repairs, unless James limits a comment to one place. Earlier documents still apply; this page records the decisions that came up again and again.

What code now does:
- `pedagogy/house-style.mjs` holds the rules that can be computed.
- `node pedagogy/house-style.mjs <project-id>` lists what a review would flag. Run it before sending a booklet for review, and fix or justify each finding.
- Bank draws apply the column rule automatically (`applyHouseColumns` in `pedagogy/bank-draw.mjs`).
- The consolidation table builder (`.booklet-work/wf1-theory-consolidation/assemble.mjs`) uses the table style in A2.

## A. Teaching pages

1. **Lessons.**
   - Each lesson starts its own page: a rules table, then worked example and guided practice pairs.
   - When consolidating, keep the worked example and guided practice pairs (James: "I still want the worked example-guided practice"). Merge pairs rather than dropping them.
   - Caps per lesson: at most 2 rules items, 4 example parts and 6 practice parts.
   - Fit the lesson on one page. For example, put short guided-practice parts in one row instead of a 2 by 2 grid.

2. **Rules tables** (James restyled every one by hand):
   - Size the label column to the longest label. That is about 2.3 mm per character plus 8 mm, between 28 and 65 mm of the 175 mm width. Labels must not wrap; "Perfect square (difference)" needs about 65 mm.
   - Give the table light grey hairline borders (`#cccccc`, 0.26 mm) and keep the blue label cells.
   - Code: `RULES_TABLE` and `rulesTableWidths` in `pedagogy/house-style.mjs`.

3. **Step numbers only when the theory has steps.**
   - James (14 November 2026): step numbers are fine when the theory lists explicit steps and the example's numbers correspond to those steps.
   - In WF1, consolidating the theory into rules tables removed the steps, so the numbering no longer fitted ("I do not want numbering that is unrelated to the theory").
   - So: keep numbers when the topic's theory has a numbered list or "Step 1" lines and the example uses no higher number. Otherwise, write the working as continuation lines on the equals gutter. The prompt sits on the gutter and each line starts with "=", in one aligned block so the line spacing is even.
   - When the numbers go, method labels such as P, S and F may stay without them. Red method words inside the working, such as "1. Same denominators", go too.
   - Consolidating theory that had numbered steps means renumbering or un-numbering the examples that pointed at them.
   - Code: `theoryStepCount` and `exampleStepCount`. Lint rule: `step-numbers` flags only numbering the theory doesn't back.

4. **Colour.**
   - Working is blue (`#268cff`).
   - Side notes that identify parts are red (`#ef6068`). Examples are *a = x, b = 4* and *a² = (a)², 36 = 6²*. James recoloured these himself.
   - Multipliers shown on the opening line are red, as in the rationalising examples.

5. **Example columns.**
   - Short examples run in one row of 4.
   - Fraction sums and rationalising examples use 3 columns.
   - Long products of fractions, and expansions whose working runs long, use 2.
   - Rows must be complete: four examples go 4 across or 2 by 2, never 3 plus 1.
   - Code: `exampleColumns`, which matches 6 of James's 7 explicit requests. Lint rule: `example-columns`, confirmed at final size.

6. **Consistency inside a block.** Every part of an example block uses the same layout. For instance, if two parts show the multiplier on the opening line, the third must too.

7. **Instruction lines.** When the parts of an example ask for different tasks, give each part a short instruction ending in a colon, such as "Simplify:", with no gap below it.

8. **Arrow diagrams and pairs.**
   - Arrow-annotated expressions (expanding brackets) are left-aligned. The part letter lines up with the expression; the renderer now does this.
   - In grouping by pairs, the highlighted pairs hug their terms (`\colorbox{#dcebe0}{\(…\)}\colorbox{#e8def4}{\(…\)}`). Never stretch them across a full-width table. Lint rule: `pairs-table`.

9. **Guided practice shows variety and the tricky cases.**
   - After the routine parts, add one or two parts that each show a distinct complication. Examples from James's comments:
     - a denominator such as 2√3;
     - a reversed binomial hidden after taking out a common factor;
     - a common factor that must come out before a difference of squares;
     - a lowest common denominator that is not the product of the denominators;
     - a coefficient in front of a fraction;
     - surds in both terms of a denominator.
   - A block with one question should have about four, showing variety.
   - Prompts never give away the method. Only a first, scaffolded part may show a multiplier or conjugate.

10. **Guided-practice wording.**
    - Ask for one definite answer ("write the equivalent fraction"), not an open task ("as many as possible").
    - Merge a one-part block into its neighbour.
    - True/False responses keep their space without cloze dots.

11. **Teach laws in both directions, and the partial case.** For each law, practise it forwards and backwards. For example, (ab)ᵐ = aᵐbᵐ and also 2⁵×5⁵ = 10⁵. Also practise the common partial application: 3x⁰×5x² against (5x)⁰. Both need guided practice and exercise questions.

12. **Topics.**
    - Merge thin, closely related topics under one heading. "Algebraic fractions" replaced two topics.
    - The heading comes from the project's `topics` entry, matched by `topicId`. So a merge moves lessons to one topicId and renames that topic.
    - Put each question in the topic whose method it needs. For example, compound-fraction questions go to Compound fractions.

13. **Across stages.** When new teaching is written for a topic that also exists in another stage, offer it to the matching booklet. The roots and negative fractional indices lesson went to Stage 5 Paths *Indices 5*, under "Index laws and surd laws".

## B. Exercises, Mixed practice and Challenge

1. **Fill whole pages.**
   - An exercise ends on a full page. Stage 6 exercises usually run 3 to 4 pages.
   - Top up from the bank: ask for a ranked list, add in rank order, and measure the rendered pages. Bank questions carry large working spaces, so expect each one to fill more than it seems.
   - Stop when one more question would start a new page.
   - Mixed practice fills its last page too.

2. **Order.**
   - Each exercise opens with routine practice of each worked example, then runs by difficulty.
   - These are Year 11 booklets. Easy questions (score under 25) appear only as those openings, and the booklet has a page budget (WF1 target: 95 pages).

3. **Word problems.** Each exercise includes at least two word or context problems where the topic allows.

4. **Columns** (code: `houseColumns`):
   - Use the most columns that give complete rows.
   - Short expressions run 4 across. 6, 9 or 12 parts with medium prompts run 3 across.
   - Bank sources often print short items in 2 columns; James widened such grids throughout WF1.
   - Use a **2 by 2 grid when the working gets horizontally long** (James, 14 November 2026). Examples: adding or subtracting algebraic fractions, rationalising binomial surd denominators, expanding surd binomials, and stacked (compound) fractions.
   - Never widen past what the printed prompt can hold:
     - drawn answer boxes and surds are wide;
     - parts with words, such as "2√3 or √11", stay in fewer columns.
   - The code estimates prompt width (16 characters for 4 across, 20 for 3) and working width (21 for 4 across). These are estimates, matching 22 of James's 29 hand-set grids.
   - The rendered page check decides. After widening, `check-feedback-pages` reports `question-column-overflow` for any part that does not fit; go back to fewer columns for those.
   - Bank draws apply the rule automatically. Lint rule: `columns` flags gaps of two or more columns, as suggestions to check at final size.
   - **Widen only when it buys space.** James changed three widened guided-practice blocks back to 2 by 2 because their pages had room to spare (WF1 r505 to r508: the new fractional-indices practice, factorising-with-indices practice and the surds practice).
     - Widen when it keeps a lesson on one page, removes a page, or lets another question fit on an exercise page.
     - Where the page has room, the extra working space of a 2 by 2 grid is better.

5. **Mixed practice** prepares for the booklet's exam questions. Leave out number-theory items that have no exam counterpart.

6. **Challenge.**
   - Include every eligible, varied, in-scope bank question of score 60 or more ("there are surely more eligible challenge questions"), within a sensible page budget (about 6 pages in WF1).
   - Record the remaining eligible questions in the run folder.

7. **When the bank lacks a requested type,** write it with `claude-sonnet-5-5`, blind-solve it, and use only content taught by that point in the booklet. For example, the index-laws exercise may not use negative indices.

8. Prefer Mastering Mathematics questions when two bank candidates are equally good.

## C. Before review

Run all three checks and the polish pipeline:

```text
node pedagogy/house-style.mjs <project-id>
node scripts/booklet/check-equals-gutter.mjs <project-id>
node polish/run.mjs ...
```

Then look at every exercise's last page. A page with more than a quarter left blank needs another question, or a reason why not.
