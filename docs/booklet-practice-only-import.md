# Practice-only PDF imports

Use the direct compact and review-first workflows. A Word companion is optional
for both question and answer PDFs. Preparation accepts `--context-pages` for
teaching pages in the question PDF and `--teacher-pages` for answer PDF pages.
Only `--pages` selects authored pages. An overlapping mixed page renders once;
the independent inventory identifies its excluded teaching regions. Page numbers
always refer to the original PDF. Images, extracted supporting text, original
sources and optional Word assets are hash-pinned. Existing paired imports remain
supported.

Semantic configuration can declare:

```json
{
  "contentScope": "practice-only",
  "sourceEvidenceMode": "pixels",
  "settings": {"questionOrder": "source"},
  "topics": [{
    "id": "1A", "exerciseLabel": "1A", "title": "Algebraic Terms and Index Laws",
    "start": 4, "end": 6, "teachingPages": [2, 3], "teacherPages": [1]
  }]
}
```

Pixel mode omits OCR from inventory and author prompts. Workers must inspect the
linked source, teaching and answer images, including un-attached context images
needed to establish a method. Answer images and text enter the task dependency
hash. `pageTeachingPages` and `pageTeacherPages` override topic selections.

Practice-only inventories explicitly exclude standalone theory, examples,
definitions, summaries and syllabus material. An actual question's supplied
definition or working can use `embeddedInQuestion` with its question inventory
ID. Concept Checks, enrichment and chapter review sets remain ordinary selectable
practice questions. Authoring rejects teaching sections, teaching-role blocks,
theory-review metadata and exclusions that would discard practice content.
Assembly revalidates the scope and refuses context-only pages. Direct candidate
creation also rejects non-practice blocks. One block represents one shared source task, retaining all its subparts and source identities. Items under the same printed range instruction become editable a, b, c parts under one stem, even when individually numbered in the source. Record the same `sharedStemId` on their independent inventory entries and map each item to a distinct child node. Keep separate source ranges, exercises and categories separate. Preserve original numbers in provenance and use continuous question numbering within each exercise. Do not repeat the shared stem in its parts.

Use native part grids, beginning with source-supported columns and reducing columns for width or working needs. Generate/review solutions first, then use `estimateWorkedWritingSpace` in `src/lib/booklet-working-space.js` at the actual cell width. It counts TeX mathematical rows, wrapped explanation, tall fractions and drawing space with handwriting allowance. Persist editable `answerSpaceMm` values and `sourceReview.workingSpaceEstimate` evidence; do not run the estimator on load or overwrite later manual adjustments. Tick-only, inline and cloze responses do not need a full working area. Final-size representative inspection must check the row's tallest cell, readable maths and page splits.

Use 8 mm per required handwritten line, with additional fraction and drawing clearance; tick/cross responses use 6 mm. Pass the reviewed required response as `studentWork` and any required drawings as `studentDiagrams` when the full worked solution includes teacher-only explanations or optional figures. An explicit student-work projection excludes solution figures unless they are explicitly supplied as required drawings. Retain the full worked answer and record the projection in the editable estimate evidence. `sizeQuestionWorking` accepts the corresponding `studentWorkById` and `studentDiagramsById` maps; saved manual dimensions retain precedence.

For a question continued across pages, identify its independent inventory roots
in `assignmentLimits.continuations: [{from, to, entryIds}]`. That assignment owns
the complete question and all its descendants. Each page packet contains the
same complete editable block and maps its own inventory entries locally. Later
packets declare `sharedContentContinuations: [{blockId, canonicalPageNumber,
reason}]`; the block must retain both pages in `sourceRefs`. Assembly checks the
explicit ownership, exact agreement of the complete blocks and answer evidence,
then emits one question with all original source mappings. A disagreement or an
undeclared duplicate fails validation. The independent inventories and original
packet evidence remain intact; this is not permission to merge unrelated items.

`settings.questionOrder: "source"` preserves order independently of cognitive
demand ratings and compact pagination. Optional topic `exerciseLabel` preserves
labels such as 1A in headings, contents and navigation; existing projects retain
their numbered exercise defaults.

Authors record `answerEvidence` once per whole question:

```json
{
  "questionId": "question-block-id",
  "teacherReference": [{"pdfPage": 5, "printedPage": 583, "exercise": "1G", "questionLabel": "62(a,b)"}],
  "matchEvidence": "Individual comparison of labels, stems and mathematical content from the images.",
  "conflict": null
}
```

Multiple reference regions support answers split across PDF pages. Missing,
duplicate, unselected or page-number-only references and unresolved conflicts
produce assembly findings. Assembly retains the record in the question's
`sourceReview`. Evidence completeness is not mathematical verification.

For classification, use the external teaching PDF schema in
[`question-enrichment.md`](../scripts/booklet/prompts/question-enrichment.md).
PDF hashes and page bounds are verified, each question cites inspected teaching
pages and supplies individual mapping/method rationales, and existing syllabus
scope checks remain active. Publication rechecks external PDFs; the receipt
retains their references and per-question rationales. No external teaching block
is added to the bank schema.

Retain image inspection notes, independent counts, mathematical corrections,
final-size representative acceptance and all final edition evidence. Counts and
hashes alone never establish source fidelity or visual acceptance. Original PDF
evidence and detailed run artifacts remain local under the storage policy.
