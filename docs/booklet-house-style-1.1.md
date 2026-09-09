# Booklet house style 1.1.0

This is an explicit style adoption, not a restyle-on-load rule. Original source evidence remains unchanged. Source fidelity preserves mathematics and teaching content; graph colours and label sizes follow this house style.

## Graphs

- Axis numbers target **8.5 pt** (8 pt only for crowded graphs); axis, coordinate and equation labels target **10 pt on the final printed page**. Preserve source presence or absence of numerical scales and tick marks, independently of grids. Check final-size readability and collisions; do not repeatedly enlarge all nodes. A TikZ `\\large` command alone is not evidence of compliance: measure the composed SVG transform after fitting the graph into its column.
- Gridlines: grey `#cccccc`. Axes: solid black `#000000`. Successive plotted relationships: blue `#268cff`, red `#ef6068`, green `#4f9b63`. Match captions/legends to their relationship. Do not recolour semantic algebra annotations indiscriminately.
- Preserve equations, plotted coordinates, bounds, scales and tick intervals. Increase available diagram space or reflow the page when necessary. Regeneration and equation edits must retain typography and palette metadata.

## Tables

Descriptive first-column labels, including their mathematics, must fit on one line without reducing the text size. Start at 44 mm, measure the full rendered label and padding, and widen where needed. Numeric columns remain compact (normally 10 mm). Reflow the containing arrangement if necessary; neither nowrap overflow nor a fixed 44 mm width constitutes a pass. Explicitly multi-paragraph prose tables are not numeric value tables.

## Cloze and handwriting

Every blank must identify the response students actually need to write. Use the same sizing rule in practice and Key Ideas. Size individual coordinate components separately, exclude supplied prefixes such as `x =`, and allow for fractions and signs. Do not attach a whole worked solution to a blank requesting only one value.

The sizing estimate is 2.2 mm per written character plus 6 mm, at least 8 mm, with fractions counted as numerator/denominator. Responses exceeding the available line width use multiple lines spaced 8 mm apart. Verify rendered capacity after column fitting. Expected responses may be stored as sizing metadata while student views show only blanks. Open responses record a representative response of the expected form, explicitly marked as open-response; uncertain responses are marked needs-review and cannot automatically pass QA.

Manual width changes remain editable, but widths below the required handwriting capacity fail QA. Existing explicit widths in unrelated projects are not silently migrated.

## Page fit and release QA

- Wait for all fonts, images, TikZ jobs and annotation positioning to settle.
- Check nested groups, diagrams, captions, annotations and **all reserved answer spaces**, not just visible prose. Require at least **3 mm clearance above the footer**, no horizontal overflow, no clipping and no unintended sibling overlap.
- Tighten duplicated margins and place related content beside its graph first. Never shrink text or remove working space merely to fit. Continuations are permitted; retain original source-page references and question labels, and update physical page numbers/contents.
- Run the shared validator on the preview and the actual print surface. Validate student and worked-solution editions; inspect short-answer pagination independently. A screenshot of the clipped page cannot prove that nothing extends below it.
- Graph size/palette, single-line value-table labels and cloze capacity are acceptance checks. Unknown expected responses are review failures.
- PDF export must stop on rendering, layout or applicable style failures. Optional metrics do not replace acceptance.

The Studio Tools menu exposes **Check page**. The shared implementation is `src/lib/booklet-qa.js`; the full-booklet migration/audit records are under `output/house-style-v2/`.


Final repair and acceptance report: [Linear Relationships house-style repair](booklet-human-workflow.md). Flowing answer sheets reserve a 15 mm bottom margin; the PDF exporter additionally checks actual paginated text and footer bounds using Poppler before replacing a delivered PDF.
