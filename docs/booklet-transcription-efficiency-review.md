# Transcription workflow efficiency review

Review of `020d8a64` (Luna's speed/token changes), 10 September 2026.

## Findings and fixes

- The reduced author prompt said to use supported v4 fields but no longer supplied their schema. Explicit compact block/node/document/diagram schemas and MathsDatabase solution rules now accompany author calls. This avoids trading smaller inputs for malformed output and extra repair calls.
- Generic, page-specific and pilot instructions repeated the same rules, contradicted page-break guidance, assumed page 1 was a cover, and supplied fixed example colours. Instructions now have one common prefix with source-dependent page data. The author retains syllabus/cover evidence, flexible compact pagination and source palettes.
- Inventory calls requested taught methods without receiving teaching context. Both stages now receive configured teaching text and image references. Two preview images remain the default; later images are explicitly readable as needed. Duplicate target/context text and images are sent once.
- Shared teaching text appeared after page-varying diagram rules, reducing common-prefix reuse. Common contracts and teaching context now precede variable material. A stable prefix permits caching but does not prove the service used it.
- Word retrieval always included two 5,000-character windows, including duplicated overlaps, and altered source whitespace before calculating offsets. Retrieval now uses two 2,400-character windows expanded to complete lines, merges overlaps and preserves original offsets. Full evidence remains accessible and the window/count are configurable.
- Cache reuse checked input hashes without checking result bytes or complete envelopes, and treated metadata-free results as reusable successes. Version 2 metadata binds inputs, actual execution configuration, output hashes and metrics. Edited, corrupt, stale or legacy caches require explicit review/retry. Successful pages in explicit attempts resume; failed retries and concurrent edits preserve prior results.
- The earlier tests exercised constants and prompt fragments, not the semantic runner. Regression tests now cover complete prompts, bounded concurrency, context/image changes, cache integrity, failed retries, explicit-attempt resume, missing mappings/answers/diagrams and concurrent edits. `--dry-run` makes prompt assembly inspectable without spending model tokens.

## Offline measurement

The reproducible benchmark compares complete assembled author prompts against `020d8a64`, using the existing local Non-Right-Angled Trigonometry inventory/source pages 1–59 and `semantic-packets/page-010.author.1/config.json` from that run. It reads original evidence and performs no model calls or evidence writes.

| Measure | Luna version | Reviewed version |
| --- | ---: | ---: |
| Total prompt characters across 59 pages | 2,381,926 | 2,076,810 |
| Reduction | — | 12.8% |

This includes the restored schemas, source text, inventory, teaching context and Word excerpts. Character counts are not measured tokens or bills. The previous 98% figure compared only the removed reconstruction/TikZ contract, excluding the remaining prompt and evidence; it cannot describe total token savings. Actual input/cached/output usage and elapsed time are recorded per real call. A fresh run and independent source/rendered acceptance are still needed to establish end-to-end speed, token savings and transcription fidelity. No existing booklet content or accepted evidence was changed for this review.
