# Omit textbook example-reference cues

18 October 2026, user requested.

Do not print textbook cross-reference cues such as “Example 8”, “Examples 6, 7, 8”, “Example 11b, c”, “Refer to Example 8” or “(see Example 8)” in imported practice questions or solutions. These source navigation labels are not question instructions. Preserve relevant examples as source and teaching evidence. Preserve substantive mathematical examples, givens, instructions and solutions; ordinary wording such as “for example 23832” is not a cross-reference cue.

`scripts/booklet/source-example-cues.mjs` removes the bounded cue forms from plain prompts and native editor paragraphs during semantic assembly. It does not modify original source files, inventory/author packets or historical attempts, and never runs as a migration on project load. A cue paragraph with an explicit arrangement reference requires a scoped arrangement repair rather than leaving a dangling reference.

Existing questions are repaired through the revision-safe project transaction. Wait for an active import or repair's ownership boundary before changing its project or candidate. Keep original evidence and valid mathematical review history; removal of these navigation cues does not change a mathematical task or its answer.
