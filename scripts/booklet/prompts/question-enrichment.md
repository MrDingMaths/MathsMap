# Question enrichment

Classify only the immutable question records supplied in the task. For each question, return its exact id and exact contentHash plus a reasoning score, difficulty band, optional primary skill, secondary skills, and a short mapping note. Do not reproduce or alter question content. The result is rejected if an id or content hash differs.

Use the source booklet as classification evidence: read its stated stage/course, topic, exercise heading and relevant teaching examples alongside each question. Classify the assessed task in that teaching context. A booklet title is guidance, not a blanket override for a clearly different task. Missing or conflicting context requires review, not a silent guess.

Secondary skills must also be directly assessed, not merely prerequisites or incidental arithmetic. Topic filters include secondary skills: a supporting pattern skill must not place a Stage 4 linear-equation task under Stage 3 Multiplicative relations B. Keep supporting skills in teaching/prerequisite mappings. Record source references, a mapping rationale and a reason for any classification outside the source stage/course or topic. Review both primary and secondary topic membership before publication.

For import-project-bank.mjs assessment files, supply sourceContext with projectHash (revisionHash of the current source project), courseIds, topicIds (syllabus IDs, not local booklet topic IDs), and evidenceBlockIds referring to the source syllabus/teaching blocks inspected. Each question needs mappingNote; an assessed skill outside the stated source scope also needs sourceContextException explaining why it is directly assessed. Existing imports retain their original receipts.

Practice-only projects may retain teaching context in an external PDF without importing teaching blocks. In that case use `sourceContext.externalTeachingReferences` instead of (or alongside) `evidenceBlockIds`. Each entry has this shape:

```json
{
  "id": "stable-teaching-reference-id",
  "pdfPath": "path/to/original-teaching.pdf",
  "pdfSha256": "actual lowercase 64-character SHA-256 of PDF bytes",
  "teachingSummary": "Summary of the relevant taught approach, recorded after inspection.",
  "pages": [{
    "pdfPage": 1,
    "printedRef": "Actual printed page label or explicit unnumbered-page description",
    "inspection": {
      "reviewer": "Actual reviewer identity",
      "reviewedAt": "Actual ISO timestamp",
      "note": "What was inspected on this page and how it establishes teaching context."
    }
  }]
}
```

`pdfPage` is one-based and must fall within the actual PDF page count. Paths resolve against the validator's `sourceRoot` (the working directory by default); absolute local paths also work. Validation reads the original PDF, verifies its SHA-256 and uses `pdfinfo` to check page bounds. Missing PDFs, stale hashes, duplicate reference IDs/pages and missing inspection records fail. The original PDF must remain available for validation.

When external references are present, every question must supply `teachingReferences: [{"id": "stable-teaching-reference-id", "pdfPages": [1]}]`, an individual `mappingNote`, and an individual `methodNote` explaining how its solution follows the cited taught approach. Every cited page must occur in that reference's inspected pages. Review primary and secondary classification scope as usual; `sourceContextException` is still required for directly assessed exceptions. Imported teaching-block-only evidence retains its existing schema.

These checks establish evidence identity and reference integrity, not the truth of a human inspection or the mathematical adequacy of its rationale. Actually inspect the cited pages; never generate review identities, dates, notes or teaching summaries merely to pass validation. Missing teaching context must remain an explicit review issue.
