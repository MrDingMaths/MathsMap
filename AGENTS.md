# MathsMap working conventions

This file is the always-on summary. The full rules, word for word, are in [docs/agent-rules.md](docs/agent-rules.md); every section there remains in force. Before doing a task, read the section of that page (and the guide it links) that matches the task.

## Always

- **Studio server (port 5173) may be serving the user remotely.** Reuse a running server; do not stop or restart it unless the task needs it, and say so first. Start it only with the `mathsmap-dev` launch configuration (`npx vite --config remote/vite.remote.config.js --port 5173 --strictPort --host 127.0.0.1`), never `npm run dev` or plain `npx vite`. Never start or stop the tunnel, expose 5173 directly or remove the Access login. Keep remote-access code in `remote/`, out of `vite.config.js` and `scripts/` (hash-bound by export evidence). [Detail](docs/agent-rules.md#remote-studio-access-8-october-2026-user-requested)
- **Shared checkout.** Other sessions run imports and repairs here. Before editing `src/`, `scripts/`, `public/`, `data/` or `vite.config.js`, or pruning, check for running `lean-import.mjs`, `lean-review.mjs` or export processes. Never clear run folders with `rm -rf`, `Remove-Item -Recurse` or `git clean` (they hold junctions to `node_modules`). Commit with explicit paths.
- **Workers.** At most three model workers per booklet, shared by every session using that booklet's run directory. On Windows, launch Codex worker runners with `sandbox_permissions: "require_escalated"` from the first attempt; keep each worker `--sandbox read-only`. [Detail](docs/agent-rules.md#windows-codex-worker-launches-6-october-2026-user-requested)
- **Saves.** Booklet saves are revision-checked. Never write bank files directly; publish with `import-project-bank.mjs`, which links identical questions. Preserve completed work, provenance and in-flight calls. Never migrate booklets on load.
- **Feedback is general.** A user comment applies to every applicable occurrence in every booklet unless the user limits it. Fix shared causes centrally.
- **Waiting.** Use 60-second waits for healthy long-running work; avoid extra polling.
- Run `npm run repo:check` before committing. Keep this file short: the limit is set in `booklets/storage-policy.json`; put detail in `docs/`.

## Models

| Work | Model |
| --- | --- |
| New content (backfill, bridges, worked examples, guided practice) | `claude-sonnet-5-5`, exactly; never substitute |
| Pedagogy audit v2 (booklet masters), every call | `claude-sonnet-5-5` medium |
| Exam questions: checks and difficulty ratings ([batch](docs/booklet-exam-completion.md#batch-exam-completion-7-november-2026-user-requested)) | `gpt-6.1-terra` high |
| Booklet and textbook imports (including the source's exam questions): reviews, ratings; difficulty-only rating calls | `gpt-6.1-sol` low |
| Other booklet reviews, ratings, challenges | `gpt-6.1-terra` high |
| Everything else | its existing setting |

A Sol low fallback must be explicit, never automatic. [Detail](docs/agent-rules.md#opening-lines-5-november-and-30-october-2026)

## Which guide to read

| Task | Read |
| --- | --- |
| Any booklet or question-bank work | [standing conventions](docs/booklet-standing-conventions.md), [cross-session rules](docs/booklet-cross-session-rules.md) |
| New booklet import | [import pipeline v2](docs/booklet-import-pipeline-v2.md) only; it links every rule it still uses. `lean-review.mjs finish` completes an import |
| Feedback repair on named blocks | [lean local repairs](docs/agent-rules.md#lean-local-feedback-repairs-5-october-2026), [change runbook](docs/booklet-change-runbook.md) |
| Verification scope | [verification cuts](docs/booklet-verification-cuts-20261030.md), else [lean acceptance](docs/booklet-lean-acceptance.md) |
| Layout, clozes, tables, diagrams, avatars, alignment | [agent rules](docs/agent-rules.md#preset-arrangements-templated-diagrams-and-avatars-4-october-2026) and the sections after it; [diagram sizing](docs/booklet-diagram-sizing.md); 3D diagrams: [visibility contract](docs/solid-visibility.md) |
| Part labels, sample answers, exam marks and order, vertex labels | [agent rules](docs/agent-rules.md#part-labels-run-in-one-sequence-11-october-2026-user-requested); [exam marks and order](docs/booklet-exam-marks-and-order.md) |
| Bank publication and duplicates | [bank linking](docs/booklet-bank-auto-sync.md#duplicates-and-linking-9-october-2026-user-approved); no cross-booklet duplicate tooling ([retired](retired/cross-booklet-duplicates-20261027/README.md)) |
| Ratings | [rating policy](docs/question-bank-assessment.md) |
| Pedagogy review or audit | [pedagogy review](docs/booklet-pedagogy-review.md), [audit v2](docs/booklet-pedagogy-audit-v2.md), [programme status](docs/booklet-end-goal-programme.md) |
| Exam completion | [completion workflow](docs/booklet-exam-completion.md) |
| Polish before teacher review | [polish pipeline](docs/booklet-verification-speed.md) (`polish/run.mjs`) |
| Pruning run folders after delivery | [storage](docs/booklet-storage.md#pruning-run-folders) |
| Skill-content campaign `worked-examples-2026-09` | [moved sections](docs/agents-moved-20261103.md) |
| Anything else | [docs index](docs/README.md) |
