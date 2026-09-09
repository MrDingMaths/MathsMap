# Source presentation contract v2

Preserve every syllabus outcome code and its full statement on Syllabus Content pages. Inventory each code separately from headings and bullets. Cover-summary omissions do not apply to syllabus content. Compare codes with original source evidence; never infer them from a topic title.

For every question and nested part grid, independently record the original columns, rows/grouping and reading order before authoring. Use those source values for layout and acceptance, never a blanket two-column default or an expected value copied from the import. Check image-embedded and multi-letter labels as well as extracted text labels. Preserve meaningful arrangements through pagination and check their rendered output.

## Mandatory source-heading, table and exam-label review

Distinguish navigation/topic metadata from visible source headings. Do not repeat a previous page's title on a continuation page. Record section.headingStyle as "none" when no page heading is printed (retain a useful section.title for navigation), "difficulty" for a printed difficulty heading, or "page-title" for a printed blue page title. A definition/theory block heading is not an additional page title. If both page title and difficulty heading appear, store section.difficultyTitle separately.

Record section.sourceHeading = {"text":"exact visible heading, or empty string","style":"none|difficulty|page-title","difficultyTitle":"additional printed difficulty heading, or empty string"}. Read this evidence from the source image before generating the reconstruction. Deterministic validation compares it with the rendered fields; the visual auditor must independently check it against the source image, including absent headings. Never infer visible headings from curriculum mapping or topic names.

For Markdown tables inside a teaching block, explicitly record block.tableStyle as "borderless" or "grid" and block.sourceTableStyle from the source. Borderless alignment tables must not acquire cell outlines or header shading. Flag mixed or unsupported border treatments rather than inventing a full grid.

Keep NAPLAN/HSC labels attached to their own question. Store the exact label in question.title, once; render it inside the prompt column beside the question number and above its wording. Preserve original sourceOrder values even when numbering is repeated or out of sequence. Record question.sourceExamLabel when a label is present. Never turn an exam label into a page heading or attach it to a neighbouring question.

During fidelity review, explicitly compare: visible heading text/style/presence; table border/shading treatment; and each exam label's question identity, occurrence count and position relative to the number/prompt. A structurally valid transcription is not enough. Return failures as flags with category "header", "table", or "structure", exact rootId, observed discrepancy and requested correction. Use the supplied structure to identify a repairable root. This audit is read-only; targeted repair tasks perform corrections and must preserve stable IDs and review edits.

Transcribe content and its relationships as structured data. Do not flatten theory to an image or infer a single skill from a page/module title. Keep stable page/block/question identities and original question order. Preserve meaningful columns, matching tasks, question/solution pairing, scaffolds, source difficulty headings and diagram provenance. Flag unsupported arrangements explicitly rather than silently substituting a different arrangement.

Supported optional metadata (legacy records remain valid):
- section.headingStyle: "difficulty" for Foundation, Development, Mastery or Challenge when styled as a source difficulty heading; retain the source title.
- worked-example.presentation: {"layout":"columns","columns":3,"numberSteps":false} for parallel examples with solutions below their respective questions; use the actual source column count. Never invent step numbering.
- worked-example.presentation.layout: "worked-rows" for numbered working/diagram/explanation rows.
- callout.contentLayout: "numbered-rules" for numbered rules with indented bullet examples and adjacent mathematics. Preserve bullets and explicit maths delimiters in content.
- question leaf.responseSpace: "scaffold" when the working scaffold itself supplies the response space. Retain intentional inline blanks, but do not add an extra answer box.
- diagram.sourceAssetOccurrenceId: the exact occurrenceId in assets, where known. Do not guess a source crop. Retain original assets and record missing links as review flags.
- TikZ overlayOf must reference its base diagram. Use identical tikzpicture options and a shared coordinate frame; draw arrows above the number line with explicit positive vertical clearance.

Use the semantic header variants review, investigation, definition, identify, example, guided-practice and key-ideas as supported by the schema; do not select a different semantic kind to achieve a colour. Investigation and Identify icons must survive rendering. Avoid duplicate exam labels in both title and prompt. Tables with response cells must not also contain redundant underscore placeholders. Wrap all LaTeX in prose/short answers in dollar delimiters, including temperature units.

Before returning: compare each teaching atom against the source, verify every question has its own corresponding solution, check source order and scaffolding, and flag any arrangement or monochrome treatment that cannot be represented. Do not silently sacrifice a source relationship to fit a page. Exact spacing remains subject to rendered fidelity review.
