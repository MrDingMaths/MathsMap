# Accepted Index Laws practice-bank import

The user accepted revision 200 on 9 September 2026: “I am satisfied with the index laws booklet. please import the practice questions to my question bank.” They selected whole questions with their existing parts and subsequently authorised implementation of the import plan.

Revision 201 publishes 149 questions from the ten practice sections. No teaching reviews, activities, Key Ideas or guided practice were published. The accepted question content, answers, native diagrams, source evidence, section order and page settings are preserved. Source provenance stays in the original booklet; the canonical bank deliberately excludes source metadata. `bank-import.json` maps every source block to its bank ID, initial bank revision, source-content hash, source pages and classification.

## Classification

Each question was assessed against `docs/question-bank-assessment.md`, using the accepted task and its teaching context. The authored register is `scripts/booklet/index-bank-assessments.mjs`. The bank has 29 Foundation, 117 Development and 3 Mastery questions from this import. No Challenge quota was imposed. These estimates measure cognitive demand, not empirical success rates or arithmetic volume. Provisional local scores are retained in the receipt; bank bands and scores now supply editor-only ratings without changing question order. Fractional-exponent arithmetic is not classified as a root-conversion lesson.

## Transfer and verification

- Ordinary question promotion ran in an isolated store before one live transaction. Existing bank records were checked byte-for-byte; concurrent live changes would abort publication.
- All 149 canonical question contents, short answers, worked solutions and diagram records match normalization of the accepted originals. Saved presentation overrides match their source captures. Raw booklet content and all page settings remain identical.
- Every question has one distinct bank ID and one original-owner link. All 149 report synced; teaching content has no bank links from this import.
- An actual Index Laws worked-solution edit and restoration synced successfully through `saveBookletProject` in the isolated store; live content was untouched by this check.
- The manifest exposes all 149 approved questions. Difficulty filtering and all nine referenced image occurrences were checked. Native diagrams remain editable TikZ.
- Re-running the applied importer creates zero questions and makes no publication writes.
- All mapped skill filters return exactly their expected questions. Ten representative question and worked-solution previews passed browser checks; visual inspection includes compiled square diagrams, nested parts, matching cards, speech bubbles and the preserved three/four-column grids.
- Shared compatibility fixes preserve labelled groups with subparts and prevent LaTeX row-spacing commands from being mistaken for display delimiters. All 595 tests and the production build passed.

This is a transfer of accepted editable content, not a new source transcription or a claim of a fresh full-PDF acceptance pass. The transcription feedback checklist applies through preservation checks and representative bank previews: native equations, writable boxes, nested numbering, three/four-column arrangements, speech bubbles, cards and diagrams. Teaching-box, Key Ideas, syllabus and cover changes are not applicable. Source evidence and previous visual reviews are retained unchanged. Browser evidence is local under `.booklet-work/index-bank-browser/`; the repeatable check is `scripts/booklet/check-index-bank.mjs`.

The reconstruction workspace has not been retired. A mixed revision booklet using Linear Relationships and Index Laws is the recommended next authoring task, not an additional artifact created by this import.
