# Booklet table conventions

Source tables remain one native editable table. Do not assemble its columns
from separate one-cell documents and diagrams in an arrangement: independent
cells lose shared row heights and can paginate out of alignment. Store editable
`[tikz]` paragraphs inside the diagram cells, with an explicit inline width.
Resolve proportional column weights using the table's actual width; do not
interpret those weights as millimetres when sizing an embedded diagram.
Retain stable answer parts and bind response cells with `sourceReview.tableResponses`;
use `flow.tableContinuation` and row ownership for tables that cross a page.
Bordered cells supply the response region without duplicate cloze dots or boxes.
The import structure diagnostic checks split-cell/diagram arrangements as well
as separate header and body-row tables. Inspect final-size rows and continuations.

Genuine column and row headings use bold text and mathematics. Store their role
as `cell.header: true`; native rendering supplies the weight without rewriting
editable LaTeX. Do not promote the first row of raw observations, borderless
working layouts or blank response boxes to headings. Preserve meaningful italic
marks, mathematical colour and source-supported row/column roles.

Statistical table cells are horizontally centred, including categorical values.
An authored left/right default is not an exception. Preserve documented local
arrangements and `preserveParagraphAlignment`, and retain left-aligned prose in
comparison or method tables. Nested body-row structures must follow their parent
statistical table's semantics; their first row is still data.

Pictogram headers are bold and centred; categorical label cells are centred.
Symbol rows retain a common starting position so counts remain comparable.
Preserve deliberate defects in questions that ask students to identify them.

Resolve bold-label collisions with local column proportions or padding, retaining
the existing overall width where possible. Do not reduce mathematical type size.
Compact answer CSS must preserve native table paragraph alignment and local
exceptions. Keep native documents intact through the answer display pipeline.

`scripts/booklet/table-conventions.mjs` records reviewed existing-table identities
and returns a pure candidate/report. Publication uses revision-safe project/bank
transactions. Formatting-only diagram repairs may update a saved answer style's
source signature only if it matched the original source; stale styles remain
invalid. Recheck changed table pages, pagination neighbours and affected answer
pages at final size. Preserve successful unchanged evidence.

Focused regressions: `tests/booklet-table-conventions.test.js` and
`scripts/booklet/check-compact-answer-table-alignment.mjs`.
