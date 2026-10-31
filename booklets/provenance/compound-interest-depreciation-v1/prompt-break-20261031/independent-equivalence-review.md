# Compound p20-q10: native equivalence decision

Configured native reviewer: gpt-6.1-terra, high reasoning. Provider runtime metadata was not exposed. This is a bounded task and answer comparison, not a new numeric assessment.

- Original task hash: `5d1830317d0973c0e4a0a015a55be49e5e53f6f765b6ebf190db17c62c000d7f`
- Current task hash: `b72630995599cb148abd6f312ccf29b3d0f1118e4459d6e551737fab263749bb`
- Posed task and instructional meaning: same. Answers: mathematically equivalent and textually identical. New mathematics: no. New demand: no. Existing accepted rationale: applicable.

The original and current questions both ask for the investment now needed to reach $8200 after eight years at 4% per annum compounded quarterly, to the nearest cent. The current second paragraph divides the formerly continuous text after “quarterly?” into two text inlines with an explicit line break before “Give your answer to the nearest cent.” The words, their order and their relation are unchanged. There are formatting and identity differences in the native representation: paragraph spacing and line-height properties, native IDs, answer-space setting and answer provenance. The current answer space is 28 mm; the original normalized content does not specify one. The same stored presentation arrangement stacks the label, the two text paragraphs and answer space. There is no question or solution diagram in either version; the original explicitly stores empty arrays where current native content omits them. These differences introduce no mathematical or instructional relationship and do not establish a visual or writing-space acceptance.

Both versions state the same short answer and worked solution. Quarterly rate is 0.04/4 = 0.01 and the number of quarters is 8 × 4 = 32; $8200/(1.01)^32 = $5963.89366322…, giving $5963.89 to the nearest cent. No old mathematical error is corrected.

The retained accepted rationale says: “Interpret the future savings target as a present-value problem, convert to quarterly rate and periods and divide by the accumulated growth factor.” It describes both versions. The existing accepted rating can be considered for reuse through a supported presentation-equivalence recording bound to the two hashes, subject to the applicable guarded publication process. The existing generic helper's posed-task guard rejects this canonical difference; this report neither bypasses it nor changes any assessment binding. No project, bank, code, live record or render was changed.
