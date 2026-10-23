# Booklet first-pass review

User approved, 15 October 2026. An LLM reads a delivered booklet before the teacher does and drafts the comments the teacher would otherwise write in Studio. The teacher keeps a comment to approve it and deletes it to reject it, exactly as with [pedagogy review](booklet-pedagogy-review.md) comments. Nothing is repaired until the teacher has triaged.

The principles were derived from the teacher's own Studio history on ten booklets: Computation with Integers, Indices (`stage4-indices-v1`), Linear Relationships, Length, Volume, Angle Relationships, Properties of Geometrical Figures, Data Classification and Visualisation, Data Analysis 1 and Probability. That history is about 200 of the teacher's comments with their resolutions, about 80 kept or deleted pedagogy-review comments, and the last 20 revision snapshots of each booklet. See [Calibration](#calibration).

## Scope and precedence

The first pass covers what the teacher looks at: pagination, spacing, layout (labels, response format, tables, diagrams, alignment), the answer editions, block roles, missing opening reviews and extensions. It does not repeat the import's content review (answers, source fidelity, skill labels) or the import's automated layout checks. Teaching-sequence findings other than reviews, extensions and duplicates stay with `pedagogy/review.mjs`. That tool's opening-review and extension rules were tightened on the same evidence on 15 October 2026.

The first pass only proposes. Compaction it suggests is a user-directed change once the teacher keeps the comment, which is consistent with the [graph sizing and compact-layout rule](booklet-cross-session-rules.md#graph-sizing-and-user-directed-compact-layouts-2-october-2026). The import visual reviewer (`VISUAL_CONTRACT` in `scripts/booklet/lean-review.mjs`) keeps its narrower brief: it accepts or fails pages for an import and still never asks for discretionary reductions.

The contract restates the conventions it checks because workers cannot open linked files. When a convention changes, change it at its source first and then here: [house style 1.1](booklet-house-style-1.1.md), the [feedback checklist](booklet-transcription-feedback-checklist.md), the [cross-session rules](booklet-cross-session-rules.md) and the [standing conventions](booklet-standing-conventions.md). Where they disagree, the source document wins and this contract is corrected.

## Running a first pass

Run it on a live booklet with no import or feedback repair in flight, once the booklet is ready for the teacher's own review. A first pass needs:

- Rasters of the Questions edition at final printed size, plus the Short answers and Worked solutions pages for the same questions. `check-feedback-pages.mjs --blocks … --pages … --editions student,short,worked` produces them for a chosen set.
- A page map in page order: for each page, its edition, number and the blocks on it with ID, type, role and displayed label.
- Compact block JSON with the layout fields: answer spaces, row heights, column widths, diagram widths, gaps, minimum heights, flow and page-break fields, and cloze widths.
- For consistency checks, the IDs and layout of similar blocks elsewhere in the booklet.

Use Sol 6.1 (`gpt-6.1-sol`) at low reasoning, embed everything in the prompt (read-only workers cannot read files), and count each call against the booklet's three-worker limit. Send at most ten Questions pages or six answer pages per call, one edition per call. Post the findings as Studio comments only when the teacher is ready to triage that booklet. As with pedagogy comments, an open comment makes the booklet's content coverage incomplete.

The command is `first-pass/review.mjs`. It lives outside `scripts/` because exports freeze that tree. Run it from PowerShell, whose Poppler `check-feedback-pages.mjs` needs, with the port-5173 server running. Launch `review` outside the outer sandbox from the first attempt, as for other Codex workers.

```
node first-pass/review.mjs map --project ID [--pages 12-30]
node first-pass/review.mjs review --project ID [--pages 12-30] [--editions student,short,worked] [--concurrency 1-3] [--source] [--fresh]
node first-pass/review.mjs post --project ID [--findings fp-…,fp-…]
node first-pass/review.mjs status --project ID [--triaged] [--approve IDS] [--reject IDS] [--resolve IDS]
node first-pass/review.mjs status --queues [--project ID]
node first-pass/review.mjs confirm --project ID [--dry]
node first-pass/apply.mjs --project ID --queue a,b [--findings IDS]
node first-pass/review.mjs group --project ID [--dry]
```

The last four are described in [Queues for pending findings](#queues-for-pending-findings-17-october-2026).

- `map` is the dry run. It paginates the Questions, Short answers and Worked solutions editions of the saved project in a headless browser, saving nothing, and prints the pages it would review and each call it would make with its prompt size. It makes no model call and no rasters.
- `review` does the same, rasterises the selected pages with `check-feedback-pages.mjs --blocks … --editions student,short,worked --checks-only none`, and sends them to the workers. `--pages` names Questions pages, and the answer pages of their blocks come with them; front matter is skipped. `--editions` runs only the calls for the named editions, for example to repeat one that failed. A failed call is reported in `errors` and leaves the earlier findings on its pages in place. Each call carries its page images, the page map, compact layout JSON for the blocks on those pages, up to twelve comparable blocks from elsewhere (`similar`) and the teacher's earlier decisions on those blocks (`decided`). `--source` attaches up to four source pages to each Questions call when the import run kept them; it is off by default, as in the replay. Findings go to `booklets/provenance/first-pass-review/ID.json` and the project is not written. Page maps, rasters and call records are kept in `.booklet-work/first-pass-review/ID/` and reused while the booklet's printed content is unchanged. After a renderer change, `--fresh` renders again.
- `post` adds each pending finding as a Studio comment of kind `first-pass` carrying its finding ID. The comment sits on the finding's first target in the finding's edition, so a Short answers finding appears in that edition.
- `status` reads the comments back. A deleted comment makes its finding rejected, and a resolved one makes it repaired. Comments still open stay pending until the teacher says triage is finished. Then `--triaged` approves every comment still present and records any wording the teacher changed as `teacherNote`. `--approve` names single findings, `--reject` withdraws a comment, and `--resolve` closes an approved finding once it is repaired.
- Later reviews pass rejected, kept and open comments on the reviewed blocks back to the worker as `decided`, which it is told not to raise again. A rejected finding also suppresses the same issue, meaning the same area and edition on an overlapping block, while that block and its layout overrides are unchanged. A kept or open finding stands for the same issue, so it is not posted twice. An unposted finding that is not found again on re-reviewed pages is dropped. A finding's ID comes from its area, edition and targets, so it is stable across runs.

`first-pass.mjs` and `pagemap.mjs` in the replay run folder (see [Replay](#replay)) were the prototypes for the command.

## Authorised layout repair and bounded retry (15 October 2026)

The Stage 4/5 campaign explicitly authorises `first-pass/apply.mjs` to repair layout findings. Other first-pass reviews remain proposals until the teacher authorises repair.

An applied finding gets at most one automatic retry. A missing verification verdict or a verification error retries the check on the same layout. A verdict that the defect is still unfixed, without a regression, restores the original layout and sends the verifier's feedback and failed patches to one new repair call. The same content, field and revision guards apply. Detected regressions are reverted immediately and never retried. After the final check, an unfixed or unverified repair is reverted and left as an open comment. Retry history is retained; recovered verification errors remain in that history without marking the recovered result failed.

For this campaign, eligible findings reverted before the loop was added receive the same single retry after the original batch exits. Already consumed retries, regressions, teacher-resolved or deleted comments and changed targets are excluded. Existing open comments are resolved in place only when a retry is verified; reviews, extensions and other content changes remain comments. The campaign keeps ten parallel booklets and each canonical pool's three-worker limit. Automated layout warnings are still reported separately; a warning alone does not trigger this retry loop.

Diagnosis and repair later on 15 October: retry repair workers receive the relevant page images, their phase/edition/page/block manifest and actual renderer excerpts, rather than being asked to infer effective fields from JSON alone. Verification compares blocks across repagination, includes neighbouring-page context, and uses at most twelve explicitly identified evidence images per call. A missing target is unverified, never assumed lost merely because its page number changed. Pre-save trials check response-table continuation ownership and the save function's content-before-settings ordering. Arrangement patches are canonicalised with the renderer's normaliser so their inverse patches match persisted values. Failed renders expose the underlying renderer log and reuse valid completed editions when resuming.

The original defect is checked in the finding's own edition; additional editions receive a regression check, rather than being asked to show student handwriting space in an answer key. Both checks still require a positive verdict. Findings incorrectly reverted by the old cross-edition check can receive one cause-specific verification recovery, using their saved original repair and fresh scoped checks, without another author call. This does not reset their ordinary retry budget. A separate shared three-slot rendering resource bounds browser/print load while ten booklets can remain active; each booklet still shares its canonical three-worker model pool.

## Queues for pending findings (17 October 2026)

User requested. The teacher's review is the slowest step, so a pending finding reaches the teacher only when the decision is theirs. On 17 October 1,242 findings were pending. Most were apply comments, and many of them were failures of the tool, not decisions. `status --queues` sorts every pending finding into one queue and records it on the finding as `queue: {name, reason, at, revision}`. Finding IDs never change.

| Queue | What it holds | What happens |
|---|---|---|
| a, technical failure | The repair worker returned nothing, failed, could not see or reach the field or page it needed, had a renderer field refused by the guard, or its repair could not be verified | Rerun once with the widened worker access below |
| b, mechanical rule | A pagination, labels, spacing, table, diagram, answers or alignment finding that needs no content change, where the worker declined or the repair did not take | Rerun once through the same guarded apply and verification |
| c, content or teaching decision | Response-format findings, duplicates, reviews and extensions, and anything needing an edit the layout tool may not make: TikZ, answer or prompt text, inline colour or bold, a new diagram, a block's role | Stays a Studio comment, grouped by pattern |
| d, stale | A target changed or was removed since the finding | Confirmed against the current revision and closed, or re-anchored and queued again |

Queues come from the finding's area and targets and from the worker's own note on its earlier attempt, tested in a fixed order in `first-pass/queues.mjs`; the first rule that matches decides. A comment the teacher has deleted or resolved gets no queue: `status` records that decision first.

**Rerunning (a) and (b).** `apply.mjs --queue a,b` reruns the named findings whatever their earlier outcome. Each finding gets one queue rerun (`queueRerun`, which keeps the earlier outcome and note). Its in-run retry is used only if no earlier attempt consumed one, so the single verified retry still holds. A repaired finding's open comment is resolved in place. A finding that fails again keeps its comment and is grouped with queue (c).

**What the repair worker now sees.** About a third of earlier refusals came from the worker missing a field or page. Each block in a repair prompt now carries:
- every node's id path and pointer;
- the layout of the containers around each target, and of its section;
- the saved arrangements and answer spaces, with the project pointer of each arrangement node;
- the answer-edition overrides: `presentation.answerPartLabels`, `shortAnswerGroupStarts`, `shortAnswerTableFullWidth`, and `settings.compactAnswers.diagramWidths` and `diagramStyles`;
- the blocks immediately before and after, which may also be patched;
- for a block over 40,000 characters, its layout outline and the full subtree of each target.

The worker gets the rendered pages of its blocks on the first attempt, not only on a retry. It also gets a catalogue of the fields the renderer reads, checked against the code, with the excerpts that read them, and its earlier attempt's note. The guard admits the renderer fields that workers had been refused: `responseSpace`, `backgroundColor`, `borderWidthMm`, `diagramPlacement`, `direction`, `weight`, `tail`, `gapMm` and `diagramWidthMm`. It also admits source response labels and the per-diagram answer-edition sizes. A patch that names an arrangement node is rewritten to that node's project pointer. A patch under objects that do not exist yet becomes one patch that creates the outermost missing object, normalised as the save will store it. The content check is unchanged.

The trial step also refuses:
- a patch that leaves an empty entry in a list;
- an arrangement whose references name no content node. These run the same structural preflight as the render; on 17 October, 18 verification renders failed it after saving and returned no verdict.

A save the project refuses changes nothing, and its findings stay comments. Provenance writes and repair saves retry through brief Windows file locks. A repair save first checks whether its patches already landed.

**Confirming (d).** `confirm` closes a finding whose target was removed. For a changed target, one worker call per edition, with at most twelve current page images, asks whether the issue still shows. One that no longer shows becomes `closed`, and its comment is resolved with the reason. One that still shows is re-anchored to the current block hashes and queued again. One the pages cannot settle stays in (d). Nothing is closed if the booklet was saved during the check.

**Grouping (c).** `group` folds repeated instances of one pattern into one comment, so the teacher decides once. A pattern is a set of comments within one booklet with the same area and edition, the same opening verb ("Move the 5 cm label…", "Make the headers bold…") and overlapping wording. Duplicates, reviews and extensions each carry their own proposal and are never grouped. The representative comment lists every affected block and finding. Each other instance records `groupedUnder` and takes the representative's decision in `status`: deleting the comment rejects them all, and keeping it approves them all. A comment the teacher has edited is left alone. A duplicate that a pedagogy duplicate-question comment already raises on the same block is not posted again; it is recorded as `coveredBy`. Unposted queue (c) findings are posted.

**Skips.** Before each confirm, apply or group, skip a booklet if any of these holds:
- a `lean-import.mjs`, `lean-review.mjs` or `lean-route.mjs` process holds it, or some other process names it;
- another campaign's run folder touched it within three hours;
- the teacher wrote or edited an unresolved comment of their own on it within the last day; resolved comments do not hold the booklet (18 October 2026, user requested);
- it was saved within the last hour.

Workers stay Sol 6.1 at low reasoning, within each booklet's three-worker lease.

## Reviewer contract

<!-- contract:first-pass:start -->
You are doing the first review of a mathematics booklet that a teacher will print for a class. The teacher reviews every page after you. Write the comments the teacher would write, and only those. The teacher keeps a useful comment and deletes the rest, so a deleted comment costs their time. A page with nothing to report is a normal result.

Already checked elsewhere, so do not spend effort on them: skill labels, the mathematics of worked solutions unless a result is visibly wrong, and automated checks for clipping, overflow and footer clearance. Report a clipped or overlapping element only when you can see it.

What you are given:
- `pages`: the rendered pages in image order. Each has its `edition` (student = Questions, short = Short answers, worked = Worked solutions), its printed page number and the blocks on it in order, with `id`, `type`, `role` and displayed `label`. Images are final printed size, A4 portrait.
- `blocks`: compact JSON for those blocks with their layout fields (answer spaces, row heights, column widths, diagram widths, gaps, flow and page breaks, cloze widths).
- `similar`: comparable blocks elsewhere in the booklet, for consistency.
- `source`: page images of the original document, when attached: the source pages of the blocks on these pages (up to eight, after the page images). Compare each teaching block with them.

How the booklet should look (house conventions):
- Pagination: in the Questions edition every exercise starts on a new page. Short answers and Worked solutions flow continuously, exercise after exercise, with no page breaks between exercises. A review fits on one page. Page breaks inside a topic follow the content, not the source: never report a missing source page break before a theory, example or guided-practice block, and never propose adding or restoring a page break (the pipeline clears source breaks inside a topic; only exercise starts and topic banners start a page). Key Ideas sit on the same page as the table or teaching they summarise. A question stays with its parts and its table, a worked example with its "Your turn", and a continued table repeats its header row.
- Response format: an open response (explain, describe, show working) gets plain unruled working space. A cloze is used only where the answer goes in a particular place: a symbol between two numbers, a value inside an equation or sentence, a cell of a table. Ordinary clozes are dotted, sit on the text baseline, are sized to the expected answer and stay inside their column; allow 2.2 mm per handwritten character plus 6 mm, at least 8 mm, and 8 mm between written lines. Boxes are used only with a purpose: cards to place, the base and index of a power, missing fraction numerators and denominators, a dedicated writing region. Missing numerator and denominator boxes are required, including in teaching and in-place answer scaffolds; never suggest replacing them with dots. Size each box for its expected handwritten response. A complete-fraction response outside a fraction retains the ordinary dotted-cloze default. A blank for a whole fraction, term or expression is one dotted cloze on the baseline with no vinculum and no numerator or denominator boxes: "…… + …… − …… = 7/12", not three empty fractions. Never report missing numerator or denominator boxes as boxes where dots would do. Decided conventions, never raised again: a full fraction scaffold keeps its two boxes and its vinculum; a blank enclosed by parentheses inside a numerator or denominator keeps the parentheses and its writing space with no visible box and no dots (parentheses elsewhere in a fraction do not remove unrelated boxes); every other blank in a sentence or equation is one dotted cloze. Do not propose adding boxes or dots to those blanks, or swapping one for the other. Within a question and on a page, clozes have one size and style. Table cells are themselves the writing space and carry no dots.
- Polish pipeline additions (23 October 2026): (1) Teaching blocks match the source's structure: arrows, alignment, side-by-side placement, indents and grouping, drawn with the booklet's own measurements and ink, not the source's. A teaching block laid out differently from its source page is reportable. (2) A scaffold blank matches the source: where the source has brackets the booklet has a parenthesised gap, `(\rule{0pt}{5mm}\hspace{Nmm})`, with no visible box and no dots; where the source has a box the booklet has an outlined box. A box whose brackets were lost at import must get them back. (3) Guided practice and "Your turn" boxes have no empty interior: working space is sized to the expected response, not left as a large empty rectangle. (4) A scaffold is left-aligned under its part label; a floating, centred or right-pushed scaffold is a defect. (5) Worked-example steps use the red step-number gutter with blue working. (6) Palette colours never change: report any colour that is not the booklet's palette colour for that meaning, and never propose a different colour. (7) No display maths wraps onto a second line; the fix is a wider container or a smaller gap, never an edited formula.
- Tables: a table in the source stays one native table. Header cells are bold on light blue `#d3e8fc`; statistical tables are centred; ordinary grid lines are grey `#cccccc`. Layout containers, calculation scaffolds and separators between question parts have no borders; real tables and solution tables keep theirs. Columns are wide enough that equations and short entries do not wrap, and descriptive first-column labels fit on one line. A factorisation or equation split over two lines to fit a narrow column counts as wrapped: widen the column instead.
- Labels: a part label sits at the top left, on the first line of its content, aligned with the other parts, with a clear indent before the content. Parts of one question run in one sequence (a, b, c …), and a new question starts again at a. Grouped sub-tasks use ai, aii, bi. Investigations, paired "Worked example / Your turn" blocks and Key Ideas carry no part letters unless the source gives them; when such a block is lettered and the similar blocks before it are not, the fix is to remove the letters, not to move them. A row label such as "English expression:" or "Decimal:" sits close to its response, as in the similar rows elsewhere, not across a wide empty column.
- Ink and alignment: worked-example questions in the teaching are black and their solutions blue, including inline maths. Numbered steps have red numbers in a left gutter with blue working. When working opens with a bare expression and each later line begins with =, the opening expression is indented by the width of "= " so that it sits directly above the right-hand sides and the = signs stack in one column to its left; an opening expression that starts flush with the = signs is missing this gutter. Pronumerals are italic, and ordinary text and diagram labels are not bold. Ticks and crosses in activities are large and clear.
- Diagrams: black ink, 10 pt labels, the booklet palette for meaningful colour, and no decorative shading or coloured backgrounds. A named colour looks like that colour (purple is purple). Measurements students need are marked on the diagram. A question about a shape or solid that gives its dimensions in words (a cylinder with radius 3 cm and height 5 cm) gets a simple labelled diagram instead, and a photograph or raster picture of a shape or solid whose measurements the question uses is redrawn as an editable diagram with those measurements. Photographs of everyday objects that the task asks students to recognise or classify are context, not diagrams. Question graphs start around 70 mm wide and short-answer graphs around 50 mm. Characters use the standard avatar set: a 17 mm portrait placed right beside its speech bubble, about 5 mm away, with the bubble's tail pointing at it; a portrait stranded far from its bubble, or a bubble with no portrait, is a defect.
- Answer editions: in Short answers each multipart question starts on a new line, and part labels read 4a, not 4(1)a. Colour in Short answers and Worked solutions is not reportable, and the rules between solutions to separate parts there are deliberate. A table question is answered with one compact completed table. An open-ended table or grid is answered with one entry headed "Sample answers" showing one example per cell.

What to look for, in this order:

1. Pagination.
   - In the Questions edition, an exercise that does not start a new page, or a teaching box that the source starts on a new page (such as a major new rule) splitting mid-page.
   - A forced page break, or stale reserved space, that leaves a large empty region the next block would fit into.
   - A review spilling onto a second page, Key Ideas or a question's last part separated from its block, or a table continuing without its header.
   - The main reason to propose compaction: a whole block or question would fit on the current or previous page with modest tightening (smaller gaps, lower row heights, a smaller diagram, surplus working space). Name the change and what it achieves, for example "Reduce the diagrams to 28 mm and the rows to 22 mm so Key Ideas fit under the table on page 14."
   - A page more than half empty is reportable unless the next block starts a forced exercise break (every exercise starts a page); name what would fill it. A single question alone on an exercise's last page is reportable when a tighter floor or a nearby question could pull it back. Do not report a clean continuation with complete parts and adequate space, or the page count.
   - Unexplained vertical gaps: space between blocks, between a scaffold and its line of working, or under a heading that no field accounts for.

2. Spacing.
   - A gap that is visibly out of proportion: between question parts, between a diagram and its text, between text and its response (horizontal as well as vertical), between a stem and its first part, between lines of working.
   - A label or indent column wider than in sibling blocks, a row label pushed far from its response, or two paired columns spaced differently.
   - Working space out of proportion to the expected answer, judged against the worked solution: a large region for a single value, or too little room for the working the solution shows.
   - Empty space that serves nothing: an empty paragraph, unused response space under a completed table, a stale empty group.
   - Scaffolds that overwhelm the question. Scaffold labels can be about 10 pt and hints about 9 pt, and a short scaffold such as "median = □" fits on one line.
   - Never propose ordinary text below its normal size, or working space below what the answer needs.

3. Labels, numbering and block roles.
   - Part labels out of place: content starting a line below or above its label, a label not at the top left, missing indent, or labels misaligned with their siblings.
   - Part sequences that restart or skip inside a question, a new question that continues the previous one's letters, a repeated question number, or letters that are a mistake (for example e, g, i among angle names).
   - Letters or question numbers where the block type has none.
   - A block in the wrong role: a practice task inside a theory, example or review block; teaching activities under an exercise heading; theory presented as review. A worked example must pose a question and then answer it, and must not be merged into the theory before it.

4. Response format and scaffolds.
   - Cloze lines given for an open response; boxes where dots would do (never the boxes of a missing numerator or denominator); an empty fraction with a vinculum where students write a whole fraction or expression, which should be one dotted cloze; clozes of different sizes or styles in one question or page; dots above the baseline; a cloze running past its column; dots inside table cells; clozes that the source does not have.
   - A cloze that looks wrong: unequal widths for parallel answers, or unbalanced brackets around blanks.
   - A source scaffold that is missing: a dot-plot axis, the first line of working, an axis scale on a graph students must draw.
   - A drill that over-scaffolds once the method is known: the same scaffold repeated for every part, or a first item that only repeats the conversion factor. Propose asking directly while keeping the question stem.

5. Tables. A table built from separate grids or cards, misaligned or merged wrongly, with duplicate or missing borders; header styling missing; a column too narrow so that content wraps (widen the column rather than wrap an equation); a table built differently from a similar table elsewhere, naming the one to follow.

6. Diagrams.
   - Size: a number line or graph students must write on too small, or too far from where they write; diagrams in one question sized inconsistently; a diagram so large that its block is pushed onto another page.
   - Placement: items meant to be compared stacked when they would fit side by side (two spinners, two solids, a short row of multiple-choice options); a diagram vertically out of line with its siblings.
   - Content you can see: dimensions written in prose when a diagram could show them, including drill questions that describe each solid in words; a photograph or raster picture of a shape or solid whose measurements the question uses; the asked-for angle not clearly marked; equal-length ticks or parallel arrows not on their edges; spinner letters that do not match their colours, the stem or the answers; a colour that is not the colour named; decorative shading, backgrounds or bold labels; a missing, mismatched or misaligned avatar; slogans and other text that carry no instruction.
   - A chart that the booklet shows elsewhere in a different style (for example the order-of-operations chart).

7. Alignment and consistency. Parts that should share one layout but do not ("make b–f follow a"); short parts that would fit a two-column grid; teaching worked-example colours, the equals-sign gutter or step numbers as described above; centring or alignment that differs between siblings.

8. Answer editions. A multipart question's answers running on from the previous question's line; labels like 4(1)a; a table question answered cell by cell instead of as one completed table; open-ended answers repeated with "(one possible way)" instead of one "Sample answers" entry; answers to parts that no longer exist. Do not ask for page breaks, colour changes or the removal of rules between solutions in the answer editions.

9. Missing opening review. Report it only when all four hold:
   - A worked example in the topic uses a prior skill as an explicit step of the new method. A final simplification, reading a value off a diagram, and anything the topic's own teaching explains are not prior skills.
   - The skill is not taught, rehearsed or practised in the immediately preceding topic or its exercise, and not in this topic's existing review. The exception is a worked example that brings together several methods from earlier topics, such as the mean, mode and range of one dataset: rehearse each of them.
   - It is a real stumbling point at this level: signed magnitude, order of operations, substitution, dividing by a whole coefficient such as 2π, solving a linear equation inside a geometry problem, recalling several statistics that a worked example combines, forming a probability from counts. Do not ask for reviews of simplifying fractions, percentages as fractions, counting frequencies, or reading scales.
   - Propose three to five short items in the style of the booklet's existing reviews, in the forms the section's questions use (π as a coefficient, multipliers such as 30/360), appended to the existing review where there is one, so that the review stays on one page. Give the answers.
   At most one per topic.

10. Extension. This is where the teacher is strictest; most topics should get none, and a booklet rarely more than two. Offer one only when all three hold:
    - It is a follow-up part on an existing question, using that question's numbers or context, and is added as its next part or parts rather than as a new block.
    - It is concrete and numerical first, worded for a student meeting the topic. Several questions become separate parts, one question each, with at most one "explain why" in any part.
    - It exposes a relationship central to the topic: appending the mean leaves the mean unchanged; two tables for one equation give the same line; adding 5 to every value or doubling it changes the statistics in a predictable way; expected frequencies add to the number of trials.
    Do not offer: a general proof or a generalisation with conditions (an angle θ with 0 < θ < 360, a cube of side s, a rule for an n-sided polygon, HCF × LCM = ab, "for every pair"); enumerating every case or constructing counterexamples; vocabulary or tangential distinctions. A short run of parts that varies one feature is welcome when the topic's practice lacks one: add it as plain parts under the existing instruction, with at most one line asking students to predict.

11. Duplicate tasks. An unchanged whole task repeated in the practice without a stated purpose. Propose changing the later copy into a task with the same structure and different numbers, with its answers, rather than deleting it. Name every copy.

Content (`area` "content"; the polish pipeline applies these itself, so give the exact correction in `proposal`): only what the pages and the source show you: a block in the wrong role (a practice task inside a theory, example or review block; teaching under an exercise heading); theory wording that departs from the source page; an answer or worked solution that is wrong or does not match the question as printed; a duplicate task (`area` "duplicate") or a question that belongs in another as its next part. Extensions and opening reviews (`area` "extension", "review") are suggestions for the teacher and are never applied.

Do not report: wording preferences; mathematics or source fidelity beyond the content cases above; difficulty order, which the teaching review handles; compaction that moves nothing onto a page and fixes no visible gap; anything you cannot see clearly. List what you could not judge under `notReliablyReviewed`.

Write each comment as the teacher would: short, direct and specific. Put the comment on the block or part it concerns. When the same defect recurs, write one comment with every occurrence as targets and scope `all`; otherwise scope `local`. Before keeping a finding, check it against the image: can you point to the page and the element, and say what the fix is and what it gains? If not, leave it out.

Return one JSON object and nothing else: {"reviewer":"first-pass","findings":[{"page":N,"edition":"student|short|worked","targets":["block or part id"],"area":"pagination|spacing|labels|response|table|diagram|alignment|answers|content|review|extension|duplicate","scope":"local|all","comment":"what is wrong and the fix","gain":"what the fix achieves","proposal":"review items, extension parts or replacement values, with answers, when the area needs them"}],"notReliablyReviewed":[{"page":N,"note":"..."}]}
<!-- contract:first-pass:end -->

## Calibration

### Where the teacher's comments go

Of the teacher's own comments on the ten booklets, about 85% concern layout. The commonest requests were:

- Plain working space instead of cloze lines for open responses, dots instead of boxes, and one cloze size per page.
- Vertical compaction so that a following question, Key Ideas or a whole block fits on the page. One example is "make this more vertically compact so that q4 can fit on the same page".
- Part labels on the first line at the top left, part sequences, stray or mistaken labels.
- Rebuilding "messed up" tables as single native tables; header styling; no borders on layout containers and part separators; wider columns instead of wrapped equations.
- Diagram size relative to where students write; paired diagrams side by side; measurements shown on diagrams; booklet colours; avatars present and aligned.
- Page breaks: exercises start a new page; teaching blocks follow the content (source page boundaries inside a topic are not kept, 23 October 2026); no forced breaks leaving blank space.
- Answer editions: new lines per multipart question, compact table answers, one "Sample answers" entry.
- Consistency: "make parts b to f follow same layout as part a", and matching tables and charts across booklets.

The revision snapshots point the same way. Between snapshots, answer spaces went down 197 times and up 71, diagram widths down 188 and up 28, paragraph spacing down 79 and up 4, gaps down 60 and up 2, and row heights down 38 and up 6.

### Pedagogy comments kept and deleted

A pedagogy finding whose comment was posted and later deleted counts as rejected; one whose comment remains counts as kept.

| Kind | Kept | Deleted | Teacher's edits |
|---|---|---|---|
| duplicate-question | 14 | 1 | Eight proposals rewritten from removing the copy to replacing it with a structurally similar question and updating solutions |
| opening-review | 10 | 7 | One request for more review items using π and fractional multipliers |
| extension | 14 | 21 | All deleted in Angle Relationships, Properties of Geometrical Figures and Data Visualisation. Two kept extensions were trimmed after repair; others were rewritten as parts of the existing question |
| variation-sequence | 5 | 1 | Extra instructional text removed and the run appended to the existing parts |
| other teaching findings | 13 | 19 | |

Kept opening reviews rehearsed signed magnitude before integer shortcuts and sign rules, index form before factor trees, order of operations before roots and index laws, substitution before circumference, inverse operations before finding a radius, linear equations before triangle angle sums, mean, mode and range before a combined example, and forming a probability before complements. Deleted ones rehearsed prime factorisation straight after the topic that teaches it, frequency counting after frequency tables, axis scales and plotting before graph construction, percentages as fractions before divided-bar graphs, equation solving before mean problems, and simplifying fractions before probability.

Kept extensions were concrete follow-ups that expose a central relationship. Examples: why appending the mean leaves it unchanged; which missing card gives a stated median; how adding or doubling changes the statistics; why two tables give one line; why every column gives the same intercept; why expected frequencies add to the number of spins; taking a complement twice. Deleted ones were mostly general proofs or conditions (angle bisectors for 0 < θ < 360, isosceles angle sets for 0 < t < 180, the reflex angles of an n-gon, the HCF × LCM identity, an inscribed cylinder in a cube of side s), enumeration (every 12-sector spinner), or tangential distinctions (names of rays, views against cross-sections, what a stem-and-leaf plot loses).

### Replay

15 October 2026. The contract was run, unchanged except where stated, on revisions saved just before a batch of the teacher's comments: Indices r15, Length r238, Volume r450 and Properties r99. It saw the Questions pages carrying the commented blocks and their neighbours, plus the matching Short answers and Worked solutions pages, rendered with the current renderer. It used Sol 6.1 at low reasoning, with at most ten Questions pages or six answer pages per call. Matches were judged by hand: the same block and the same issue.

Some comments were excluded. Three reported editor bugs. One concerned a defect the current renderer no longer shows. Four targeted blocks added after the snapshot. Unexplained deletions such as "delete part c" are not counted, because no reviewer can infer them. That leaves 24 comments.

| Round | Caught | Partly caught | False alarms / findings |
|---|---|---|---|
| 1, contract as first written | 12 | 3 | 14 / 63 |
| 2, after one revision | 19 | 1 | 1 / 54 |

Every round-1 false alarm was in an answer edition: page breaks between exercises, blue ink and the rules between solutions. Round 1 also missed a portrait stranded from its speech bubble, the equals-sign gutter, a row label far from its response, wrapped factorisations, solids described in words and a photographed carton. The revision fixed both groups. These are the contract's statements about answer editions, avatars, row labels, the gutter, wrapping and drawn diagrams. Round 2's one false alarm asked for photographs of everyday objects to be redrawn; the wording was narrowed afterwards and that change is untested.

Still missed: two comments caught in round 1 but not in round 2, which is run-to-run variance at low reasoning; the consistency of a chart with another booklet, which needs that booklet; and "this is not an exercise", which needs the source. Treat the first pass as a first pass: the teacher still reviews every page. Most findings beyond the teacher's comments were of kinds the teacher has asked for elsewhere, such as nested answer labels, part labels restarting within a question and compaction that keeps a question on one page.

**Command recheck (15 October 2026).** `first-pass/review.mjs review` was run on the same four snapshots, one worker per booklet, with the replay's Questions pages and the answer pages of their blocks, `similar` filled and `decided` empty. It reproduced the calibration.

| Booklet | Eligible | Caught | Partly | Missed | Findings | False alarms | Round 2 |
|---|---|---|---|---|---|---|---|
| Indices r15 | 10 | 8 | 0 | 2 | 22 | 0 | 7 / 24 / 0 |
| Length r238 | 5 | 4 | 1 | 0 | 9 | 0 | 4 + 1 / 9 / 0 |
| Volume r450 | 5 | 4 | 0 | 1 | 12 | 0 (1 unjudged) | 5 / 15 / 1 |
| Properties r99 | 4 | 3 | 0 | 1 | 8 | 0 | 3 / 6 / 0 |
| Total | 24 | 19 | 1 | 4 | 51 | 0 (1 unjudged) | 19 + 1 / 54 / 1 |

Recall is unchanged at 19 of 24 with one partial. The misses are the same kinds as before (the chart that needs another booklet, "not an exercise", one dots-to-boxes), plus Volume's Key Ideas compaction, which was caught in round 2. The unjudged finding asks Volume page 15 to complete two explanation prompts in a worked example. No finding targets a block that only `similar` supplied, and no false alarm traces to it, so `similar` stays. Differences of one comment between runs are within the run-to-run variance noted above. The run folder is `.booklet-work/first-pass-recheck-20261015/`.

The pedagogy rules were replayed the same day, using `runReview` with scratch provenance on the revisions the original reviews used: Data Visualisation r378, Angle Relationships r492, Data Analysis r438 and Linear Relationships r29. The table counts the final run of each booklet; Data Analysis and Linear Relationships were rerun once after the combined-methods and split-parts refinements.

| Teacher's earlier decision | Not raised again | Raised again |
|---|---|---|
| Opening review deleted (5) | 4 | 1 |
| Opening review kept (1) | 0 | 1 |
| Extension deleted (10) | 9 | 1 |
| Extension kept (8) | 6 | 2 |

Of the six kept extensions not raised again, four came back as closely related follow-up parts, such as finding the value that can be appended without changing a mean. Every new extension was a concrete follow-up part on an existing question. The deleted review that came back, equation solving before mean problems, had been dropped in the previous run, which is variance between runs. The seeded fixture still scored six of six with no false alarms.

The run folder `.booklet-work/first-pass-replay-20261015/` holds the scripts, prompts, results and `score.md`.
