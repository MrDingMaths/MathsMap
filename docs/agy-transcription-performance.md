# AGY transcription latency investigation — 5 September 2026

The observed bottleneck is a long agent/tool sequence, not evidence of slow Flash response latency. Concurrency is three. The selected backend log confirms `Gemini 3.8 Flash (High)`.

## Measurements

A minimal prompt (`Reply with exactly OK. Do not use tools or read files.`) took 8.177 seconds wall time. AGY reported 1.710 seconds for the agent response, 46 output tokens including 45 thinking tokens. This is a startup/response baseline, not a sustained tokens-per-second benchmark.

Three failed three-page transcription tasks logged:

| Task | Generation requests | Confirmed ViewFile calls | ListDir | GrepSearch |
|---|---:|---:|---:|---:|
| 013 | 135 | 47 | 10 | 9 |
| 014 | 108 | 51 | 1 | 1 |
| 015 | 126 | 43 | 5 | 9 |

Requests continued throughout their approximately 20-minute runs. These counts come from CLI timing logs; confirmation events are only a subset of all tool operations. The task-013 conversation database contains 135 model steps and 132 generic tool steps. It is not one slow generation call. AGY's `num_turns` counts conversation turns, not those internal model/tool steps.

## Concrete causes

1. **Relative task pointer.** Although the process cwd was correct, the model was told only `task-013.md in the current directory`. Its trace shows recursive searches on C:, directory exploration across C:/D:/E:, and only later opening the task under the intended D: workspace. Passing process cwd did not adequately orient its file/terminal tools.
2. **Repeated evidence discovery.** The same trace opened the complete Word document seven times, neighbouring task results repeatedly, and the transcription implementation four times. It also executed 27 Node command steps, including scripts to inspect assets and headings. The prompt does not provide a complete compact schema example or task-scoped Word/teacher evidence, so the agent reconstructs that context for itself.
3. **Large evidence and reasoning volume.** The student Word extraction is 646,457 bytes; teacher PDF text is 172,008 bytes and teacher Word extraction 682,758 bytes. Every task is pointed at these full documents. Successful task 012 wrote a 40,570-byte result but reported 537,802 input tokens, 8,910,835 cache-read tokens and 79,063 output tokens, including 51,841 thinking tokens. Usage is cumulative across agent steps, not the size of the final answer; thinking must not be added to output again.
4. **Hard timeout and misleading diagnostics.** The CLI uses a 20-minute print timeout, with a 25-minute outer process timeout. Three consecutive missing results halt the pool. Response timeouts were misleadingly diagnosed as likely OAuth expiry, and no-file outcomes omitted elapsed time from console reporting.

No rate-limit backoff was found in the inspected failure traces. This does not establish that provider latency or rate limits never contribute; an earlier run separately encountered an explicit quota limit.

## Fixes made and validation

The default driver pointer now supplies the absolute task path, explicit workspace/output directory and instructions for resolving relative evidence paths. It tells the agent not to search other drives for the task. The driver now records conversation ID, reported agent duration, conversation turns and result bytes alongside wall time and usage. No-file failures retain elapsed time, and response timeouts are distinguished from authentication failures.

A minimal file task using the fixed driver completed in 17.164 seconds wall time (8.849 seconds reported agent duration) and wrote the required JSON. This verifies basic task discovery/output, not full-transcription speed or quality. `npm test`: 364 passing tests. Existing pinned task prompts, results, concurrency and model were not changed; an already-running process does not hot-reload this driver fix.

## Next performance experiment

Prepare a bounded evidence pack for a representative failed task: supplied page images/text, likely teacher matches with identities and uncertainty retained, a relevant asset index, and the complete output schema/example. Keep the original evidence available for targeted fallback. Ask for one transcription draft, then perform fidelity repairs in a separate measured stage. Compare elapsed time, generation/tool calls, mathematical omissions and visual fidelity against the existing run. Benchmark lower reasoning effort only after controlling task scope. Raising concurrency alone would multiply the present exploration work.

Diagnostic measurements are under `tmp/agy-transcription-diagnostics/`. Only task-specific summaries were saved; unrelated conversations were not inspected.

## Bounded packet benchmark result

`scripts/booklet/transcription-packet.mjs` prepares isolated execution packets without replacing pinned original prompts or accepted results. The representative packet is `.booklet-work/transcription-benchmarks/task-013-packed-v1`, covering student pages 37–39. It contains 775,408 bytes overall, including 97,231 bytes of text/schema/prompt/index material. Teacher candidates are selected by content similarity, with original page references retained; matching pagination is not treated as evidence of identity. Word excerpts retain offsets and nearby original asset occurrences. Retrieval remains heuristic, with one targeted fallback permitted in the original booklet evidence directory.

The packet explicitly warns that extracted student PDF text can contain invisible answers: rendered images determine student answer visibility. Missing teacher working must be flagged instead of expanding into lengthy new solution generation. Original task and execution task hashes are recorded separately. Execution verifies packet file hashes, the original task hash and pinned import inputs before invoking AGY. Results stay isolated for subsequent validation and visual review.

After the initial automatic approval rejection, the user explicitly approved this packet's transmission to Gemini. The benchmark ran with the same `gemini-3.8-flash-high` model, one worker and an eight-minute CLI timeout. It timed out after **491.116 seconds wall time** (472.016 seconds reported agent duration), with **no result file**. This does not establish a completed-transcription speedup or permit a fidelity assessment. The original import has not resumed: 13 of 31 task results, representing 39 of 93 pages.

The trace contains **43 generation requests**, 24 confirmed ViewFile calls, three ListDir calls and eight GrepSearch calls. The ledger reports 253,285 input tokens, 2,068,521 cache-read tokens and 57,350 output tokens, including **53,533 thinking tokens (93.3% of output)**. These are cumulative agent usage, not final-answer size or a direct text-output throughput measurement. No explicit quota/rate-limit backoff was found. Conversation ID: `659fd376-8d2c-40c3-8528-d48e7cd0c419`; summaries are in `tmp/agy-transcription-diagnostics/packed-trace-summary.json` and the isolated packet's `ledger.jsonl`.

The absolute task pointer worked: the agent opened the supplied task and local evidence. However, it then repeatedly searched/read the original Word extraction and asset index. One concrete retrieval defect was a graph occurrence at character 263,890, immediately before the selected excerpt starting at 265,200. Future packet preparation now includes asset occurrences within 6,000 characters on either side of selected excerpts. A regression test covers this boundary case. The completed benchmark packet is preserved unchanged; the retrieval correction has not been benchmarked.

Independent visual inspection of the three source pages also found a diagram identity trap: Word image73 labels the two lower graphs c/d in the reverse order to student PDF page 39. PDF part 2c must be y=-x and 2d must be y=-3x+2. Invisible practice answers in extracted student PDF text must remain absent from student prompts. The independent review reference is `tmp/agy-transcription-diagnostics/task-013-review-reference.json`; it was not supplied to AGY.

Local verification: all **368 tests pass**. The packet approach alone is insufficient so far. The next experiment should supply a complete, prechecked asset set and reduce exploratory tool work; separately compare reasoning effort using AGY's locally documented `--effort low|medium|high` option. Do not raise full-import concurrency or claim improved throughput from this unsuccessful run.

## Corrected evidence and low-effort execution prepared

The driver now accepts an explicit `effort` option, passes AGY's `--effort` flag and records it in the ledger. Existing callers keep their default behavior. Invalid effort settings fail before invocation. Packet preparation also recovers image links missing from the original occurrence index when wrapped Word tables break the image-alt syntax. This recovers image70 without rewriting the original evidence index.

The first proposed corrected packet (`task-013-packed-low-v2`) included additional nearby assets. Automatic approval review rejected its invocation: it interpreted the prior approval as covering one original-packet benchmark and required explicit approval for the expanded payload. No invocation occurred. The payload was then narrowed locally to the five visually inspected graph/scaffold assets (image69–73), preserved in a new packet `.booklet-work/transcription-benchmarks/task-013-verified-low-v3`. This packet has 18 files, 876,097 bytes total, including 99,193 bytes of text/schema/prompt/index/guide material. It includes the same pages 37–39 and selected Word/teacher excerpts, adds the two missing graphs, and excludes unrelated nearby images. Original-directory fallback is disabled in the execution instructions. A verified asset guide identifies the graph relationships and flags source crop/layout differences for later repair.

All **370 tests passed** when this packet was prepared, and packet hashes verified. After explicit user approval, the command was:

```powershell
node scripts/booklet/transcription-packet.mjs run .booklet-work/transcription-benchmarks/task-013-verified-low-v3 8m low
```

This is a combined workflow intervention (asset preparation, discovery instructions and effort), not an experiment isolating reasoning effort alone. The v2 packet was never sent. The approved v3 packet was executed as described below. The full import remains paused at 39/93 pages.

## Low-reasoning benchmark outcome

An initial invocation failed model selection after 6.028 seconds with zero tokens: `gemini-3.8-flash-high` conflicts with `--effort low`. The authenticated `agy models` list confirms separate high/medium/low model IDs. The driver now resolves explicit effort to the corresponding listed Gemini Flash model ID, while preserving the requested model and recording the actual execution model in the ledger. A regression test covers this conflict. The unchanged approved packet was then retried successfully through model selection; the backend log confirms **Gemini 3.8 Flash (Low)**.

The actual low-reasoning transcription **timed out after 491.181 seconds without a result file**. Reported agent duration was 468.746 seconds. It made **57 generation requests**; confirmation logs include 32 ViewFile calls and one ListDir call, with additional terminal calls visible in the conversation tool records. Ledger usage: 445,247 input tokens, 2,745,780 cache-read tokens, 5,925 output tokens and **zero reported thinking tokens**. No explicit quota/rate-limit backoff appeared. Conversation: `fdf9ccc1-daac-4e97-a61d-8d4729c15a59`.

The agent initially stayed with the supplied evidence, repeatedly extracting slices from long JSON-encoded Word excerpt strings. It later searched neighbouring result files and the wider `.booklet-work` directory for schema examples, despite the execution instructions. Tool records confirm command failures: `SyntaxError: Unexpected token '||'` at step 70; `ReferenceError: Cannot access 'fs' before initialization` at step 72; and PowerShell `.Name`/`.FullName` command errors at steps 84, 101, 111 and 113. Repeated error occurrences inside a tool payload are not separate model requests. These support a diagnosis of exploratory tool loops and command quoting failures, not merely excessive reasoning or slow final-text generation.

Future packet preparation now emits Word and teacher excerpts as readable Markdown with real line breaks and source references, and points the execution prompt at those files. JSON evidence records remain for provenance. This addresses the observed need to run extraction commands against large escaped strings; it has not been benchmarked. All **372 tests pass**. Original packets, results and source evidence remain unchanged. No output existed to run mathematical or rendered-fidelity checks against, and no transcription was adopted.

Diagnostic summaries: `tmp/agy-transcription-diagnostics/low-trace-summary.json`, `low-tool-summary.json`, `low-tool-errors.json`; exact timing and usage are in the v3 packet ledger. The next substantive change should eliminate shell-driven discovery and supply the full transcription contract directly, with validation performed after generation. Neither a higher worker count nor a lower reasoning setting alone has demonstrated completed-task throughput improvement.

## Direct-input transcription implementation

Added `scripts/agy/lib/agy-structured.mjs` and `scripts/booklet/transcription-direct.mjs`. The runner supplies the complete task, readable text evidence, original occurrence metadata and output schema in one stdin message. Only the eight existing PNGs (three student pages and five diagram/scaffold assets) need file viewing. Node saves the returned object; AGY has no shell, search or editing tool in the selected profile. The runner checks the installed profile hash, detects fallback-to-default warnings, bounds tool calls and elapsed time, validates page coverage/content identities, and preserves failed envelopes or candidates for inspection. It refuses to overwrite results or silently adopt incomplete output. Original task and evidence hashes are checked before execution. This remains a draft transcription path, not a publication approval or a substitute for mathematical/visual review.

The implementation follows the official [headless stdin protocol](https://www.antigravity.google/docs/cli/headless/) and [custom-agent tool configuration](https://www.antigravity.google/docs/subagents/). Live checks exposed installation-specific differences:

- Workspace profile discovery returned no agents; AGY silently fell back to its default profile. The scoped reader is now installed at `C:/Users/Admin/.gemini/config/agents/booklet-transcription-reader/agent.md`, selected only by name. Its exact source is `DIRECT_AGENT_CONFIG` in the direct transcription module. No global permission settings were changed. The unused repository-level profile created during diagnosis was removed after verifying its hash.
- The `init.tools` array lists the global registry even when a custom profile is selected. It is not proof of the model's filtered tool set. A synthetic diagnostic with the discovered profile reported only `view_file` and the unavoidable internal `manage_task`; context input fell from approximately 13,278 to 2,901 tokens. The driver accepts the global registry only with the exact installed profile verified, monitors actual tool events, and stops on unexpected tools. This is tool-configuration enforcement, not an OS-level file sandbox.
- In two synthetic stream probes, `--json-schema` produced four concatenated `{"ok":true}` responses and no `structured_output`, despite `SUCCESS`. The production path therefore includes the schema in the prompt and validates locally; conflicting concatenated responses are rejected. The CLI schema flag remains optional in the transport for future compatibility testing.

The final synthetic transport probe completed in **7.354 seconds wall time**, **1.643 seconds reported agent duration**, one turn, five output tokens, zero thinking tokens and zero tool calls. It returned `{"ok":true}`. This verifies transport/profile behavior only, not transcription speed or fidelity. Evidence is `tmp/agy-transcription-diagnostics/structured-probe.json`.

Prepared `.booklet-work/transcription-benchmarks/task-013-direct-v6` from the previously approved v3 evidence. It contains the same pages 37–39, teacher/Word excerpts and five original graphics, with 100,699 bytes of direct prompt text and 776,904 bytes of PNGs. No new booklet evidence was added. All **378 tests pass**. The attempted real invocation was rejected by automatic approval review, which required explicit approval for sending the private booklet/teacher content to AGY/Gemini. It never launched. The concrete pending command is:

```powershell
node scripts/booklet/transcription-direct.mjs run .booklet-work/transcription-benchmarks/task-013-direct-v6
```

That approval was subsequently supplied and the exact packet was benchmarked, as recorded below. The full import remains paused at 39/93 pages.

## Direct-input benchmark: 58-second draft, fidelity repair required

After explicit user approval, the first invocation stopped after 12.582 seconds with status `CANCELED`: the headless CLI requested permission to view a supplied image. The runner now enables headless tool approvals only after verifying the installed restricted reader profile against its expected SHA-256. This adds the process-local `--dangerously-skip-permissions` flag; the selected profile still excludes shell, search and editing tools. No global permission configuration changed. The unchanged packet was retried.

The retry returned a complete JSON draft in **57.989 seconds wall time**, with **46.012 seconds reported agent duration**, **seven image-view tool calls**, one conversation turn, and no observed shell/search/editing calls. Model: `gemini-3.8-flash-low`. Usage: 32,097 input tokens, 46,590 cache-read tokens, 9,659 output tokens and zero reported thinking tokens. Conversation ID: `418ee540-7ef8-4306-8669-9eab005f63ff`. The three required source pages, four practice question roots and all 26 practice parts were present. Candidate size: 30,468 bytes.

This demonstrates that eliminating exploratory tool work can produce a transcription draft within a minute on this sample. The earlier same-evidence low-effort run timed out after 491.181 seconds without a result. It is **not an 8.5× accepted-transcription throughput measurement**: the baseline never completed, and the new draft failed fidelity validation. Worker concurrency remains three in the full importer; this isolated benchmark used one worker.

Validation and inspection of all three rendered source-page containers found:

- All 26 short-answer equations match the independent reference. The 20 practice data tables and two worked-example tables retain their source values, including the mixed numbers. The two visible theory solutions and the instruction to exclude `(0,5)` are present in the JSON.
- Page 37's introductory and closing sentences were stored as unsupported `introPrompt` / `outroPrompt` properties, so they disappeared in the render. Example titles/question-15 numbering also need layout repair. The direct validator now rejects those ignored prose fields; a regression test covers both.
- Question 16b's worked answer incorrectly offers `(4,-2)` as an alternative to the correct `(-2,4)`. Its subsequent substitution and final equation are correct, but the incorrect coordinate must be removed. Worked-answer provenance still needs verification against teacher evidence.
- Page 39 has three literal answer-dot hazards and four native-content/image duplication hazards. Composite graph images repeat for separate parts; the draft flags the reversed c/d Word labels but does not repair their placement. Original images also contain extra scaffolding absent from the PDF. A bare `\\qquad` and literal emphasis markers appear in the render. Part 2d's response table has four blank value columns instead of the source's three.
- All six image placements loaded and the browser reported no page errors. No practice answer was observed in the student render. These screenshots are source-page containers of varying height, not a validated paginated PDF export.

The candidate remains isolated and unmodified at `.booklet-work/transcription-benchmarks/task-013-direct-v6/task-013.1788612883633.candidate.json`; its SHA-256 is `b5d520c6b54ba50ce62d5d92832ba7c1f2a923f3db8a620c6635d1ad4bbae115`. Timing is in `ledger.jsonl`; structural inventory is `local-review.json`; all three inspected renders and browser checks are in `render-review/`. No accepted result was written or adopted into the full import. Local verification: **379 tests pass**.

Next investment: retain this bounded direct-input transport, tighten the rendered-content contract, and measure a separate repair/review stage before wider rollout. Preserve the existing pinned prompts, candidate evidence and accepted results. Do not raise concurrency to compensate for the old exploration loop.

## High-effort comparison requested by the user

The user requested continuing with high effort. The direct packet preparer now accepts an explicit `low|medium|high` argument, pins it with the corresponding Flash model in the execution manifest, and forwards it to the transport. Legacy manifests without an effort field retain low effort. A regression test checks the actual CLI arguments and recorded effort so a high model cannot silently execute with the transport's low default.

Prepared and executed `.booklet-work/transcription-benchmarks/task-013-direct-high-v7` with `gemini-3.8-flash-high` and `--effort high`. Compared file hashes against v6: all eight images, the schema and reader profile are identical. Prompt text is identical after normalising only the execution directory name. Neither candidate nor previous review findings were supplied to the model. Both runs used one worker, the same restricted profile and an eight-minute limit.

| Measurement | Direct Low (v6) | Direct High (v7) |
|---|---:|---:|
| Wall time | 57.989 s | 152.404 s |
| Reported agent duration | 46.012 s | 141.806 s |
| Image-view tool calls | 7 | 8 |
| Input tokens | 32,097 | 35,862 |
| Cache-read tokens | 46,590 | 46,476 |
| Output tokens, including thinking | 9,659 | 44,470 |
| Thinking tokens | 0 | 33,763 |
| Practice short answers matching reference | 26/26 | 26/26 |
| Accepted after fidelity review | No | No |

High returned one complete 33,835-byte candidate in approximately **2 minutes 32 seconds**, 2.63 times the Low runtime. Thinking accounts for 75.9% of its reported output tokens; these are cumulative usage, not final JSON size or output throughput. Conversation: `3d2e1d6b-c5ef-402c-8e54-425939d85457`. No shell/search/editing calls were observed. Unlike the old high-effort workflow, this run completed within the time limit.

All three high-effort rendered source-page containers were inspected. All six image placements loaded; browser page errors were empty. High fixes the false `(4,-2)` coordinate in question 16b and replaces the dotted/bare-TeX answer rules with working underlined blanks. It adds answer-evidence references and more specific diagram repair flags; those references still need source-level verification and do not constitute approval.

However, high effort does not resolve the principal fidelity problems. Composite graphs remain duplicated, Word labels c/d still need reassignment/cropping, and the extra fourth blank column in question 2d remains. Introductory and closing page-37 prose is still invisible: this time it is stored as block-level `prompt` and `note`, which the worked-example renderer ignores. The direct validation guard and its regression test now cover those fields too. Four question-17 tables (m–p) introduce a new defect: their Markdown separator rows have four cells while the data/header rows have five, causing them to render as literal pipe-delimited text. The numerical values and all 26 short answers remain correct. Literal emphasis markers and example numbering/layout still need repair. No practice-answer leakage was observed in the inspected student containers; these are not verified paginated PDF exports.

Candidate: `task-013.1788613810235.candidate.json`, SHA-256 `f4372392824705375b110c02734ff91ca5cbfcca77d1b91309e6edb845ee5781`. Timing, structural inventory and the three screenshots are retained alongside it. Validation refused an accepted result; nothing was adopted into the full import, which remains at 39/93 pages. All **380 tests passed**, followed by the eight targeted transport/validation tests after extending the ignored-prose guard. High is now explicitly recorded for this execution and available for subsequent packets; it was not silently applied to existing pinned runs.

This single comparison shows mixed quality changes, not a reliable quality advantage for High. The remaining work is to make the prompt's supported content fields explicit, validate table shapes and repair diagram placement, while retaining the user's requested high effort for continued transcription work.

## Follow-up: repaired draft adopted, next transcription prepared

Local repair has now addressed the high draft's missing prose, malformed tables and graph pairing. Added validated source-image regions, persistent graph placement and explicit graph/native-table relationships. Source graphics were retained unchanged, including their equations/point positions; no raster redraw or guessed TikZ was used. The repaired source-page renders were inspected and remain separate from the raw-candidate renders. The output was added to the full import as a **draft** with execution and repair provenance, raising coverage to **42/93 pages (14/31 results)**. Final PDF fidelity and review approvals remain outstanding. See the implementation log for remaining visual differences and the repair files.

New direct packets default to **high effort** and specify supported rendering fields and table shapes. The next packet is `.booklet-work/transcription-benchmarks/task-014-direct-high-v1`, covering pages 40–42. Automatic approval review rejected its invocation because it requires explicit transmission approval for this new set of private pages, selected teacher/Word evidence and graphics to AGY/Gemini. It never launched; there is no running transcription job. **382 tests and the production build pass.**

## Approved next-batch result

After the user's explicit approval, task 014 (pages 40–42) completed draft generation in **252.657 seconds wall time**, with **241.904 seconds reported agent duration**, 12 image reads and no shell/search/editing calls. Gemini 3.8 Flash High usage: 98,646 input, 306,410 cache-read, 48,111 output including 30,959 thinking tokens. Conversation ID: `b7c41630-085e-4b82-87bb-1e8e10ed2c5e`. The 52,294-byte candidate is retained in `task-014-direct-high-v1` with its ledger.

This graph-heavy batch also produced 15 TikZ candidates alongside the original images. They are now preserved as separate unapproved diagram proposals rather than rendered twice. The draft still needed local table/header/crop and response-layout repair. All three repaired source-page containers were inspected and their mathematical answers checked independently; the repaired output was added as a draft with execution/repair provenance, raising import coverage to **45/93 pages**. Teacher-evidence approval, source-layout differences and final PDF inspection remain open; details are in the implementation log. The permission rejection is resolved for this packet and no job is running. Tests remain **382 passing**, with a successful production build.

## Requested concurrency increase

The user requested concurrency **10** for the full remainder. A bounded direct-input worker pool and the 16 remaining task packets are prepared in `.booklet-work/transcription-batches/linear-remaining-high-10-v1` (pages 43–48 and 52–93). The run configuration/UI now reflect ten workers and high effort; existing results are skipped. A local concurrency test reaches ten active workers and preserves failed drafts/queued work. **383 tests and the build pass.**

Automatic approval review rejected invocation before launch because it requires explicit approval for transmitting this entire new private payload to AGY/Gemini. No remote concurrency-10 measurements exist yet. The batch remains ready, no jobs are running, and coverage is still 45/93 pages. The implementation log records the exact pending command and approval scope.

## Measured full-remainder run after explicit approval

The approval block above is resolved. The prepared 16-task batch completed all **48 remaining pages** with Gemini 3.8 Flash High and a measured peak of **10 active workers**. Start: `2026-09-05T14:00:35.848Z`; finish: `2026-09-05T14:06:45.176Z`.

| Measure | Result |
| --- | --- |
| Batch elapsed | 369.328 seconds / 6 minutes 9 seconds |
| Three-page packet wall time, min / median / max | 118.396 / 168.434 / 299.304 seconds |
| Complete retained drafts | 16/16 packets, 48/48 pages |
| Initial validation pass / repair needed | 9 / 7 packets |
| Failed requests / automatic retries | 0 / 0 |
| Aggregate generation throughput | 7.80 draft pages/minute |
| Sum of individual packet durations | 2,857.336 seconds |
| Reported input / cache-read tokens | 922,050 / 2,346,643 |
| Reported output tokens, including thinking | 650,043 |
| Reported thinking tokens | 511,008 (78.6% of output) |
| Image-view calls | 206 |

The ratio of summed packet durations to batch elapsed is about 7.74. This is an observed overlap measure, **not a controlled speedup against a serial run**: the packets differ in content and the queue tails off as it completes. There were no observed request failures or explicit quota errors in this run. Provider-side scheduling is not exposed by these metrics.

Throughput is now sufficient to generate the remainder within minutes; review and correction are the next measured bottleneck. Initial validation does not mean a candidate is ready for adoption. The independent `review-inventory.json` found additional question-model errors in five packets, 20 presentation flags across 13 packets, 24 TikZ diagram records and 112 model-supplied approval labels that do not confer approval. All 90 question blocks and local asset references were inventoried; source fidelity, numerical correctness and final pagination still require review.

Raw drafts cover the remainder, so earlier results plus these candidates cover all 93 source pages. Only the previous 45 pages remain adopted into the exact lane; none of this batch has been published or approved. All raw candidates, failures of validation, pinned evidence and timing ledgers remain under `.booklet-work/transcription-batches/linear-remaining-high-10-v1`. No transcription job is still running. See the implementation log for the local review command and next repair stage.
