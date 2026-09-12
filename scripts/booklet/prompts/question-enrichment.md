# Question enrichment

Classify only the immutable question records supplied in the task. For each question, return its exact id and exact contentHash plus a reasoning score, difficulty band, optional primary skill, secondary skills, and a short mapping note. Do not reproduce or alter question content. The result is rejected if an id or content hash differs.

Use the source booklet as classification evidence: read its stated stage/course, topic, exercise heading and relevant teaching examples alongside each question. Classify the assessed task in that teaching context. A booklet title is guidance, not a blanket override for a clearly different task. Missing or conflicting context requires review, not a silent guess.

Secondary skills must also be directly assessed, not merely prerequisites or incidental arithmetic. Topic filters include secondary skills: a supporting pattern skill must not place a Stage 4 linear-equation task under Stage 3 Multiplicative relations B. Keep supporting skills in teaching/prerequisite mappings. Record source references, a mapping rationale and a reason for any classification outside the source stage/course or topic. Review both primary and secondary topic membership before publication.

For import-project-bank.mjs assessment files, supply sourceContext with projectHash (revisionHash of the current source project), courseIds, topicIds (syllabus IDs, not local booklet topic IDs), and evidenceBlockIds referring to the source syllabus/teaching blocks inspected. Each question needs mappingNote; an assessed skill outside the stated source scope also needs sourceContextException explaining why it is directly assessed. Existing imports retain their original receipts.
