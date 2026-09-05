# Booklet human review

Review in three passes: content and structure, teaching sequence, then layout.
Accurate transcription does not require committing to the source's final spacing
or question order. Retain the source reconstruction as evidence; make pedagogical
and final-layout changes in the editable booklet.

## Header terminology

| Name | Use |
| --- | --- |
| Review header | Green review teaching block |
| Investigation header | Red block with a circled question mark; the visible word “Investigation” is intentionally suppressed |
| Definition header | Blue theory/definition block |
| Identify header | Pink identification block with a magnifying glass |
| Example header | Orange worked example block |
| Guided Practice header | Orange scaffolded practice block |
| Key Ideas header | Blue summary block |
| Page title | Top-level topic title, usually in a blue band |
| Difficulty heading | Foundation, Development, Mastery or Challenge; use the source's heading style |

The text after a teaching header's label is its **description**. For example:
“Page 30, Identify header: the magnifying glass is missing.”

## 1. Content and structure

Compare each question or teaching block with its retained source page. Check
wording, signs, values, answers, working, diagrams, labels, scaffolding and part
boundaries. Keep meaningful arrangements: three example columns, solutions below
their corresponding questions, and indentation expressing numbered rules and
subordinate bullets. Preserve the intended blanks within scaffolding without
adding a second answer box beneath that working.

Defer exact working-space heights, decorative whitespace and final pagination.
Use stable question/block IDs and source page numbers in notes so feedback remains
traceable after the editable booklet is reordered or repaginated.

The existing UI has question/module approval controls and a single **Accept page**
checkbox. It has no separate content, sequence and layout approval states. Use
question/module approvals for content progress and keep a review log alongside the
booklet. Reserve **Accept page** for the completed source-page reconstruction;
content approval alone does not approve unfinished layout. Existing publication
gates still apply, including page, mapping and proposed-diagram approvals.

Suggested log entry: `Source p32 / page-32-guided-practice — Content checked;
scaffolding retained; final working space pending.`

## 2. Teaching sequence

Keep the source transcription in source order. Propose a gentler sequence in the
editable booklet with original position, proposed position and a short rationale
for each move. Judge prerequisites, scaffold removal, sign combinations, number
size and reasoning demand together; a reasoning score alone is not an ordering
rule. Keep dependent parts, shared diagrams and example/practice groups together.

The reviewer approves the proposed sequence before it is applied. Record approval
in the review log. A move that leaves question content intact needs a sequence and
layout check, not a new transcription of that question. If wording, answers or
scaffolding change, reopen content review for the affected material.

## 3. Layout and export

After content and sequence are settled, adjust answer space, columns, diagram
sizes and page breaks in the editable booklet. Inspect the student booklet, short
answers and worked solutions separately. Check clipping, footer clearance,
question/answer correspondence and numbering after every sequence change. Record
final layout sign-off against the exported revision; approval of an earlier PDF
does not approve a later revision automatically.

## Integers v2 repair

Run `node scripts/booklet/repair-integers-v2-feedback.mjs` once on the local v2
import. It backs up the transcript, review and manifest under the run's migration
directory, preserves review values and question order, and reopens affected pages
and number-line diagrams for visual approval. Repeating the command is a no-op.

The Investigation regression originated in commit `b38d976`: the shared renderer
mapped Investigation to both the green Review colour and Review icon. The v2
transcription already carried the correct Investigation kind, so metadata repair
alone could not change that appearance. Identify also had an incomplete SVG path
(only an unfilled handle). Both are now distinct rendered icons.

Pilot layout metadata is optional: worked blocks can select `presentation.layout`
of `columns` or `worked-rows`, with `numberSteps` and column count as appropriate;
callouts can select `contentLayout: numbered-rules`; source sections can select
`headingStyle: difficulty`. Other imports retain their existing rendering.
Question leaves with `responseSpace: scaffold` retain their prompt's blanks and
suppress the extra response box, including older saved space overrides.

Verify locally with `node scripts/booklet/check-integers-feedback.mjs` while the
dev server is running. It checks the eight affected source pages in student,
hidden-theory, short-answer and worked-solution modes, including icon geometry,
column alignment, scaffolding, footer clearance and number-line arrow placement.
The optional `--pdf` flag also exports individual A4 proof pages into the check's
output directory. PDF proof documents are review evidence, not publication or
approval of the complete booklet.

The reported investigation on “Page 3” is source page 29, block
`page-29-investigation`. Source page numbers remain the reference for this repair.

## Final pilot feedback and prevention

The final correction restores borderless investigation tables, distinguishes printed page titles from difficulty headings and absent continuation headings, and anchors NAPLAN labels inside their question's prompt column. Page 38 retains the source's unusual numbering (14, 13, 14, 15) without changing question order. Corrections and review state are backed up by `repair-integers-final-feedback.mjs`; repeating it makes no further changes.

New runs pin `source-presentation-v2.md`. Exact transcription records independent source-heading evidence, table border treatment and exam-label ownership. Deterministic validation reports mismatches in the Flags queue with repairable root IDs. The fidelity lane now receives page structure as well as both images and explicitly checks title presence/text/style, table borders and exam-label position. Targeted repairs receive the same contract. Existing pinned runs remain compatible.

These checks cannot prove that model-recorded evidence matches the source; that remains the independent visual audit's job. Resolving a flag does not bypass a still-failing deterministic check. Run `node scripts/booklet/check-final-feedback.mjs` for the final heading/table/label browser regressions. The pilot can be retained as a regression fixture when moving to the next development stage; retiring it does not imply approval or publication of its remaining review items.
