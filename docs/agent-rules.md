# Agent rules (full text)

Moved word for word from `AGENTS.md` on 6 November 2026, when the user asked for that file to be slimmed. Only link paths changed, and the two untitled opening lines got a heading. Every section remains in force; where two sections conflict, the later-dated one wins unless it says otherwise. `AGENTS.md` now holds a short always-on summary and an index into this page and the other `docs/` guides; read the section here that matches your task.

Earlier moves: [3 November 2026](agents-moved-20261103.md), [standing conventions (9 October)](booklet-standing-conventions.md), [campaign workflow (15 October)](content-campaign-efficient-workflow.md).

## Opening lines (5 November and 30 October 2026)

5 November 2026, user requested: the [pedagogy audit v2](booklet-pedagogy-audit-v2.md), which is for booklet masters only, uses exactly `claude-sonnet-5-5` medium for every call (comparison ratings, audit, challenge, drafting, blind solve). Otherwise, difficulty-only rating calls and booklet-import reviews/ratings/challenges use exactly `gpt-6.1-sol` low; preserve every existing valid rating regardless of model and completed/in-flight provenance. Finish missing/default/stale/unverified practice ratings in existing booklets through the guarded rating workflow. Other reviews/challenges retain Terra 6.1 High. See [rating policy](question-bank-assessment.md).

30 October: [verification cuts](booklet-verification-cuts-20261030.md) govern local/programme checks; otherwise use [lean acceptance](booklet-lean-acceptance.md).

## Cross-booklet duplicate tooling retired (27 October 2026, user requested)

Do not discover, link, synchronise or manage duplicates across booklets. Tools and registry remain in [the recoverable archive](../retired/cross-booklet-duplicates-20261027/README.md). Review duplicates within each booklet; use full matching during bank publication. Preserve historical acceptance, lineage and explicit review reuse without live cross-booklet dependencies. This supersedes automatic cross-project discovery and propagation.

29 October: [remove exam marks and sort exercises by verified difficulty](booklet-exam-marks-and-order.md), including existing booklets; preserve mathematical notation and dependencies.

Keep this file under 32,000 bytes; link detail in `docs/`. `npm run repo:check` enforces the limit.

## Streamlined imports (24 October 2026, user approved)

Follow [the current workflow](booklet-three-pass-import.md#streamlined-completion-24-october-2026): shared completion gate, repair by required edit, one source-side rendered review, scoped repair verification and reused exports. Use `lean-review.mjs finish`; saving progress is not completion. Keep ICE-EM's direct exception, accepted work and active workers. No automatic live-booklet repair campaign. This supersedes conflicting import/polish stages below.

Separately requested [pedagogy reviews](booklet-pedagogy-review.md) follow [worker routing](booklet-worker-routing.md), comments-first repairs and [first-pass rules](booklet-first-pass-review.md). Keep the tool outside `scripts/`.

Imports: [omit redundant vertex labels, retain necessary labels and update solutions](booklet-cross-session-rules.md#redundant-vertex-labels-25-october-2026-user-requested).

## Part labels run in one sequence (11 October 2026, user requested)

For imports and authorised repairs, use [one continuous part-label sequence](booklet-transcription-feedback-checklist.md#part-labels-run-in-one-sequence-11-october-2026-user-requested). Run `node scripts/booklet/check-part-label-sequence.mjs [project-id]`; new imports should report no missing/restarted labels.

## Sample answers for open-ended tables and box grids (11 October 2026, user requested)

An open-ended question answered in the cells of one table or box grid gets one short-answer entry: “Sample answers” and the question’s layout filled with one example per cell, with no per-cell “e.g.” or restated headings. Follow [the convention](booklet-cross-session-rules.md#sample-answers-for-open-ended-tables-and-box-grids-11-october-2026-user-requested).

## Bank links and duplicate questions (9 October 2026, user approved)

Append dependent follow-ups before bank import where possible; see the guide.

A question is published to the bank once; every other booklet that contains it links to that record. Follow [duplicates and linking](booklet-bank-auto-sync.md#duplicates-and-linking-9-october-2026-user-approved). `import-project-bank.mjs` links identical questions automatically, holds a same-question match that has a different answer for one decision in Studio (**Use existing** or **Keep separate**), and creates only the rest; assessments cover new questions only. Do not add a duplicate review stage or model call to imports, and do not hold or block on similarity scores. Run `node scripts/booklet/bank-links.mjs [--project ID]` to see what a publication would create, link or hold. Never create a second bank record for an identical question by writing bank files directly.

## Remote Studio access (8 October 2026, user requested)

Studio is published at `studio.mrdingmaths.com` through a Cloudflare Tunnel with an Access login; see [remote access](studio-remote-access.md). Keep remote-access code in `remote/` and out of `vite.config.js` and `scripts/`, which are hash-bound by export evidence. Never expose port 5173 directly or remove the Access login while the DNS record exists.

The server on `127.0.0.1:5173` may be serving the user remotely. All sessions (Claude and Codex):

- If a server is already listening on 5173, reuse it. Do not stop or restart it unless the task requires it; say so first if the user may be working remotely.
- When starting the port-5173 server, use the remote config: `npx vite --config remote/vite.remote.config.js --port 5173 --strictPort --host 127.0.0.1` (the `mathsmap-dev` launch configuration does this). Do not use `npm run dev`, `npm run dev:batch` or plain `npx vite` on 5173: those work locally but make the remote address return "Blocked request". Local behaviour under the remote config is identical.
- Do not start or stop the tunnel. The user runs `remote/start-remote-studio.cmd`, which starts the tunnel and, only if 5173 is free, the server.
- Scripts that start their own server on another port (frozen export and verification servers) are unaffected and keep using `vite.config.js`.

## Run-folder pruning (8 October 2026, user approved)

When an import is delivered or a feedback repair closes, run `npm run booklet:storage -- exports`, check the preview, then repeat it with `--apply`; see [pruning run folders](booklet-storage.md#pruning-run-folders). Run it only when no import or feedback repair is in flight in any session (no `lean-import.mjs`, `lean-review.mjs` or export process running): it keeps only the newest export of each run, so a run that is still working loses the frozen copies and rasters of its earlier samples. It removes the frozen app copy, Vite cache, page rasters and layout cache that every export leaves behind. These are regenerable and are not evidence to retain. Add `--records` to also drop the process records of run folders idle for seven days or more; source evidence, run state, final decisions, the newest export and every file a live booklet or tracked provenance record points to are kept. Never clear run-folder trees with `rm -rf`, `Remove-Item -Recurse` or `git clean`: frozen copies contain junctions to the real `node_modules` and render cache. Keep one-off scripts and dated repair tests in the run folder, not in `scripts/` or `tests/`.

## Booklet worker limit (6 October 2026, user requested)

Allow at most three model workers per booklet import, shared by all sessions using that booklet's canonical run directory. Different booklets have independent three-worker limits; the multi-booklet lean dispatcher uses `--concurrency` per booklet, not across its entire queue. Reuse the existing run for the same booklet rather than creating separate runs to bypass its cap. This supersedes earlier wording requiring three workers total across different booklets. Preserve model settings, ownership, revision-safe publication and historical evidence. Already-running dispatchers adopt the change on their next launch; do not interrupt or remove active leases.

## Windows Codex worker launches (6 October 2026, user requested)

On this machine, launch authorised child Codex CLI workers and scripts that spawn them with `exec_command` using `sandbox_permissions: "require_escalated"` from the first attempt. This includes booklet import/review runners and content campaign runners. The outer Windows sandbox cannot write Codex's startup directory `C:\Users\Admin\.codex\tmp\arg0`; ordinary launches repeatedly fail with `Access is denied. (os error 5)`. The permitted host launch was verified to start without those warnings. Keep each worker's own `--sandbox read-only`, existing worker limits, model settings and revision-safe publication guards. This instruction does not authorise additional workers or unrelated elevated commands.

Do not first launch these runners in the outer sandbox, consume attempts on the known failure, or retry unchanged permissions. If the permitted launch is rejected, stop the affected dispatch and report the approval-review reason. Do not broaden Windows ACLs, disable the sandbox, change `CODEX_HOME`, or clear runtime/session directories as a workaround. Existing chats must follow this rule when next launching workers; preserve completed work and resume only incomplete tasks.

## Models (30 October 2026)

New content uses exactly `claude-sonnet-5-5`: backfill, bridges, worked examples and guided practice; verify availability, never substitute. Future booklet reviews/ratings/challenges use `gpt-6.1-terra` high, except the pedagogy audit (Sonnet medium) and booklet imports (Sol 6.1 low), per the 5 November line at the top; see [review policy](booklet-pedagogy-review.md#review-model-30-october-2026). Sol Low fallback must be explicit, never automatic. Preserve completed work/provenance and in-flight calls. Other work keeps its settings. The [programme/audit status](booklet-end-goal-programme.md) governs rollout; teaching and Review additions stay comments-first. No bank-fed sections.

## Exam completion (3 November 2026, user requested)

Follow [the completion workflow](booklet-exam-completion.md): one closure record per master on the current source screen, one open proposal per master (amend, never supersede), saves through `pedagogy/exam-publish.mjs` with a ledger row, commits from the live file. Undated official samples print as `HSC <paper> Sample Question`.

## Lean imports (5 October 2026)

New three-pass imports follow [the lean cut](booklet-three-pass-import.md#lean-cut-5-october-2026-user-approved). Content review returns only corrections that change printed content, an answer or a skill mapping. Visual review covers the `student`, `short` and `worked` selections; combined editions are inspected only at covers, transitions and flagged pages, and all five editions keep their automated checks. After a visual repair, inspect only repaired pages and neighbours, once. Budget three exports per booklet (early sample, final, one post-repair); a further export needs a named cause. Do not write one-off scripts to retain, rebind or re-record evidence for unchanged content, and do not produce receipts or closeout audits beyond the short completion report. Review and export new imports with [`scripts/booklet/lean-review.mjs`](booklet-three-pass-import.md#lean-review-route-no-ledger-5-october-2026-user-approved) (`content`, `export`, `visual`, `status`): it keeps only a revision-checked save, one reviewed table and one correction log, and replaces bounded-stage tickets, the visual review queue, settlement and final-review records, which stay only for runs already using them. This supersedes conflicting evidence, re-inspection and audit wording below for new imports; independent inventory, the one full content review, the early layout sample, revision-safe saves, Sol 6.1 (low from 5 November) and the three-worker limit remain.

## Lean local feedback repairs (5 October 2026)

For a feedback repair confined to named blocks of one booklet, follow [the lean local-repair rule](booklet-change-runbook.md#minimum-verification-for-feedback-maintenance). Run `check-feedback-pages.mjs --blocks` once after changes settle, inspect the selected Questions pages, and add an answer edition only when answers changed. Combined editions are not paginated unless answers, covers, transitions or footers change. Skip Studio reopen and interaction scripts unless editor code changed, bank checks unless a changed block is bank-linked, and `repo:check` unless committing or adding assets. Closeout is the before-snapshot, the revision-safe save and a short report; no hashed receipt, provenance copy or per-comment evidence list. One-off repair scripts stay in the run folder. This supersedes the wider feedback-maintenance wording below for local repairs; shared-renderer changes, new imports and full-acceptance work are unchanged. Source fidelity, mathematical correctness and applying feedback to every applicable occurrence remain required.

## Waiting and polling (4 October 2026)

For healthy, non-interactive builds, tests, exports, scripts and delegated work, use a 60-second wait (`60000` ms) by default when the active tool supports it. Prefer completion notifications or event-based waits that return early on completion, failure or required attention. Where a tool has a lower limit, use its maximum supported wait. Avoid additional status-listing or log checks merely to confirm healthy work is still running. Check sooner only when incremental output requires intervention, a relevant deadline approaches, or observed behaviour suggests a stall. Keep required progress updates and existing runtime guards; this changes model-driven waiting, not script-internal timers or quality gates.

## Preset arrangements, templated diagrams and avatars (4 October 2026)

For future imports and authorised feedback repairs, source appearance is evidence, not a layout target. Reproduce content, order, mathematical structure and meaningful relationships; apply house style to everything else. See [the cross-session convention](booklet-cross-session-rules.md#preset-arrangements-templated-diagrams-and-avatars-4-october-2026).

Lay out teaching and practice content with the shared arrangement presets. Use a custom arrangement only where position carries mathematical or instructional meaning, such as paired figures, matching activities, card placement or a diagram that working must sit beside, and record that meaning. Source placement alone is not a reason. Presets keep the per-part handwriting estimate and all instructional content. This supersedes source-relative placement as the default, including the Volume prevention wording; explicit local exceptions remain.

Where a source diagram belongs to a supported family (number line, fraction bar or grid, fraction circle, blank grid), author it from the shared parameter model. Reproduce its mathematical content exactly: range, ticks, marked values, shaded parts, labels and givens. Proportions and size follow the template. Use free-form TikZ for other diagrams and where a template would lose a mathematical feature.

Omit mascots and illustrations that carry no instructional or mathematical content, keeping everything they say as editable text and recording the omission against the source inventory. Explain-the-mistake and speech-bubble characters use the standard avatar set, assigned in order of first appearance within each booklet, with the existing 17 mm portrait and 5 mm gap; do not crop or reproduce source portraits. Keep the character's name and any image a question depends on.

Do not migrate accepted projects automatically. These preferences add no review stage and change no quality gate, spacing rule, cloze or table convention.

## Cloze styles and source tables (4 October 2026)

For future imports and authorised feedback repairs, ordinary completion blanks use editable native dotted clozes, sized consistently with the shared handwriting rule for their expected responses. Prefer dots even when the source uses outlined boxes, except that missing fraction numerators and denominators retain outlined native maths boxes (17 October 2026, user reaffirmed). First-pass review must not suggest replacing these boxes with dots. Keep boxes only where they serve a specific mathematical or response purpose, such as card placement, a dedicated writing region, or meaningful table cells; source decoration alone is insufficient. Explicit user instructions to retain a local box remain exceptions. Preserve source evidence and record intentional departures. Do not automatically migrate accepted projects on load.

Full fraction scaffolds keep a boxed numerator, boxed denominator and vinculum; never automatically replace the scaffold with dots (17 October 2026).

Exception (21 October 2026): [parenthesised fraction blanks](booklet-cross-session-rules.md#cloze-styles-and-source-tables-4-october-2026) keep empty space without visible boxes or dots. Preserve occupied dimensions, line wrapping and pagination; unrelated boxes stay.

Keep source tables as native editable tables, preserving row/column relationships, givens, reading order and meaningful borders; do not replace their cells with separate cards. Bordered table cells already provide the writing space and normally have no cloze dots or duplicate response boxes inside them. Preserve actual card activities as cards. The Integers magic-square conversion is an explicit user-requested departure from its separate source boxes. See [the cross-session convention](booklet-cross-session-rules.md#cloze-styles-and-source-tables-4-october-2026).

## Source alignment on import and Studio layout controls (4 October 2026)

The initial import reproduces the source's [equation and working alignment](booklet-transcription-feedback-checklist.md#equation-and-working-alignment-4-october-2026): position on the page, alignment between lines of working, and worked-example question against working. Inside tables the cell's `align` governs every line unless `preserveParagraphAlignment` is set; `scripts/booklet/check-dormant-alignment.mjs` reports lines whose stored alignment is overridden and should report none for a new import. Do not auto-repair existing booklets. Studio layout controls must only write fields the renderer already supports, or optional fields whose absence renders exactly as before, so adding a control never requires re-auditing existing booklets. House style (10 October 2026, user requested): a bare opening expression followed by lines starting with a relation sign gets an [equals-sign gutter](booklet-transcription-feedback-checklist.md#equals-sign-gutter-10-october-2026-user-requested); `scripts/booklet/check-equals-gutter.mjs` reports the ones without, and existing booklets are repaired only where the user names them.

## Skill-content campaign (worked-examples-2026-09)

The 2–5 October campaign rules (booklet question types, audit first, lean route, efficiency) were moved word for word to [the moved AGENTS sections](agents-moved-20261103.md#skill-content-campaign-booklet-question-types-4-october-2026) on 3 November 2026 and still apply to that campaign.

## Diagram sizing (25 October 2026, user requested)

Follow [source-calibrated diagram sizing](booklet-diagram-sizing.md) for Stage 5, Stage 5 Paths, Stage 6, textbook and future imports. The user's later 25 October scope clarification in that document supersedes the initial recent-edit hold for this maintenance pass; preserve its named exclusions. Measure final height as well as width, retain native 10 pt labels, drawing area and independent edition sizes, and review exceptions instead of enforcing hard caps. Never migrate on load. The [graph and compact-layout convention](booklet-cross-session-rules.md#graph-sizing-and-user-directed-compact-layouts-2-october-2026) otherwise remains.

## Tighter unreviewed layouts (17 October 2026, user requested)

The [calibrated spacing exception](booklet-cross-session-rules.md#tighter-unreviewed-layouts-17-october-2026-user-requested) permits tighter future import defaults and revision-checked maintenance of unreviewed, sweep-complete booklets. Any teacher flag with no `kind` and an `at` means reviewed. Preserve changed fields, repairs and exceptions; never migrate on load. Studio actions change only explicitly selected layouts, with undo and save/reopen verification.

## Booklet polish pipeline (23 October 2026, user approved)

[Polish pipeline](booklet-verification-speed.md) replaces `handoff/run.mjs`: run `polish/run.mjs` before teacher review. Exercise breaks stay forced (suggestions only); only extension and bridging suggestions reach the user.

## Future imports: three-pass precedence (28 September 2026)

Moved word for word to [the moved AGENTS sections](agents-moved-20261103.md#future-imports-three-pass-precedence-28-september-2026) on 3 November 2026, including the import duration controls, bounded Sol 6.1 workflow and feedback-maintenance precedence. Later sections above supersede it where they conflict.

## Standing booklet conventions

Before any booklet or question-bank work, read [standing booklet conventions](booklet-standing-conventions.md), which holds the September 2026 rules moved here on 9 October. Follow the [LLM practice-question rating requirement](question-bank-assessment.md#llm-ratings-for-all-studio-practice-questions-21-october-2026) for current Studio questions and initial imports.

For all 3D diagrams, follow [the visibility contract](solid-visibility.md). Use explicit solid faces and the actual viewing direction to derive hidden edges; silhouettes stay solid. Labels use non-drawing paths and cannot repaint edges. Preserve construction/semantic lines separately. Audit every current occurrence and new candidate with `scripts/audit-solid-visibility.mjs`; unresolved geometry requires a source-hashed review. Changing camera or coordinates invalidates prior visibility acceptance.

For booklet changes, follow [the change runbook](booklet-change-runbook.md): establish affected scope once, validate representative cases early, reuse valid renders, settle changes before final exports, run required final checks once, and record actual phase timings/retries. Use affected-page/neighbour checks for ordinary edits; do not default to five complete booklet reviews. Editor-only changes use focused interaction, save/reopen and representative print checks. Preserve source, mathematical and presentation fidelity gates.

Earlier-session rules are consolidated in [the cross-session transcription and rendering rules](booklet-cross-session-rules.md). Read them with the feedback checklist for every future transcription and rendering change. They distinguish general conventions from source-specific corrections and document precedence where old prompts disagree.

User feedback is a general requirement across all books and every applicable occurrence, including existing books, unless the user explicitly limits it to a specific item. Implement shared renderer/editor causes centrally; audit and repair repeated content defects throughout the affected booklet. Do not treat a named example as the full scope or leave known repeated defects as a list in place of fixing them. Preserve book-specific content, mathematical colour meaning through the standard palette and meaningful arrangements while applying general feedback. Fraction-step spacing is shared across all books and answer editions, not an Index Laws content patch.

For every transcription run, read and complete the [transcription feedback acceptance checklist](booklet-transcription-feedback-checklist.md). It consolidates the user's alignment, spacing, palette, grid, card, native-maths, writable-box, numbered-list and image-control feedback. Apply content conventions throughout; three-pass imports use the targeted visual selection above, while legacy runs check every applicable rendered occurrence; fix shared causes and retain regression coverage rather than waiting for the user to identify repeated defects.

For new imports, use the [direct compact workflow](booklet-direct-compact-import.md): independent source inventory, semantic content with source references, then one compact editable project. Imported counts do not establish fidelity. Record confirmed source corrections without changing original evidence. Keep exact cloning optional. Projects is the sole booklet workspace. Historical-import browsing and creation are retired; new imports require explicit semantic candidates. Retain source serving, correction conflict checks and exact-mode compatibility.

Keep application code, tests, reusable authoring tools, current booklet/bank content and referenced assets in Git. Local render caches, extracted evidence, run logs and automatic project revision histories are not release files. Preserve original source documents and useful recovery/evidence records locally when cleaning temporary renders.

Follow [the storage policy](booklet-storage.md): keep fast autosaving separate from five-minute recovery checkpoints; repeated fine adjustments must not create a whole-booklet backup on every save. Studio retains the latest 20 loose checkpoints plus explicit milestones and archives older snapshots with verified hashes. Keep the ignored `booklets/.storage-archives/` objects, manifests and receipts together. Never apply project-history pruning to bank baselines. Preview maintenance before applying it; check live references and completed-run receipts before archiving staging payloads. Run `npm run repo:check` before committing; keep generated files out of Git and review justified source/content growth against `booklets/storage-policy.json`.

Omit [example cues](booklet-source-example-cues.md).
