# Source presentation contract v1

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
