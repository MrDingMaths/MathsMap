# Content-generation session prompt

The session prompt for a **per-topic batch** that mass-generates teaching content
(`public/content/{id}.json`) and quizzes (`public/quizzes/{id}.json`) for every skill in
one Stage-4 topic, using a multi-agent workflow (one generation agent per skill, an
independent blind checker, an orchestrator).

Companion to the schema and principle docs — this prompt tells agents **how to run the
batch**; those docs remain the authority on **what to produce**:

- [content-schema.md](content-schema.md) — the output contract. **If anything here
  disagrees with the schema doc, the schema doc wins.**
- [worked-example-principles.md](worked-example-principles.md) — choosing/presenting the
  worked example, `theory` block, line-note labels.
- [guided-practice-principles.md](guided-practice-principles.md) — the escalation the
  three practice tiers mirror.
- [atomisation-teaching.md](atomisation-teaching.md) — atom types, scope, example-set
  rules.

Modelled on `booklets/PROMPT.md` (the proven atomisation session prompt) and its queue
doc `booklets/QUEUE.md`.

---

## Queue mode (default)

Paste just this: **"Run the next content-generation batch — follow
docs/content-generation.md."**

The session then:
1. Reads `docs/content-queue.md` and takes the **next `pending` batch** (one topic per
   session).
2. Enumerates the topic's skills from `data/skills.json` (skills whose `dotPointIds`
   resolve, via `data/dotpoints.json`, to the batch's `topicId`), maps each to its
   booklet section(s), and runs the workflow below.
3. Pauses at the human-review gate. After samples are approved and
   `node scripts/validate.mjs` + `npm run manifest` are clean, flips the batch status in
   `docs/content-queue.md` and stops.

**One batch per session.** Work top to bottom; do not skip ahead.

---

## Read first (every generation agent, in this order)

1. **`docs/content-schema.md`** — the full output contract. The two JSON shapes, the
   shared text rules, the tier minimums, the MCQ/distractor rules, the TikZ allowlist.
   Re-read the sections your skill exercises; do not work from memory of them.
   For any skill needing a diagram, also read the complete canonical
   **[`docs/tikz-prompt.md`](tikz-prompt.md)** and follow its semantic audit, construction,
   fixed-template, and rendered-verification workflow.
2. **The three principle docs** —
   [worked-example-principles.md](worked-example-principles.md),
   [guided-practice-principles.md](guided-practice-principles.md),
   [atomisation-teaching.md](atomisation-teaching.md). Cite them for authoring
   judgement; do not restate them into the JSON.
3. **The skill's own `data/skills.json` record** — its `title`, `blurb`, `stage`,
   `difficulty`, `dotPointIds`, `prereqs`. This is the scope boundary.
4. **Each direct prerequisite's `data/skills.json` record** (the ids in the skill's
   `prereqs`) — so the agent knows what may be *assumed* and used in service, and what
   must **not** be re-taught. This is the **lower boundary**.
5. **The topic's sibling skills, and every skill whose `prereqs` include this skill**
   (the dependents), from `data/skills.json` — titles and blurbs are enough. This is the
   **upper boundary**: the agent cannot know when a question has crossed into a
   neighbouring atom unless it has seen what the neighbouring atoms are. Mastery-tier
   pressure is exactly what pushes questions over this line.
6. **Each direct prerequisite's existing content file** (`public/content/{prereqId}.json`
   where it exists) — read the `theory` and `solution` working of the prereqs for
   **notation and tone continuity**. New content must read as the same voice, the same
   house style, the same step-note vocabulary as the skills it builds on.
7. **The mapped booklet section(s)** from `docs/content-queue.md` (files under
   `booklets/Stage 4/`) — the worked examples **and** the practice questions. Worked
   examples alone do not show the routine's full range.
8. **The booklet's diagram PNGs** — booklet image links resolve to PNGs under
   `booklets/Stage 4/media/<booklet-stem>/`. For any geometry/measurement/data figure —
   3D solids, labelled triangles, graphs, plots, distance–time graphs, or wherever alt
   text is thin — **`Read` the PNG directly** as the design reference before authoring a
   `tikz` diagram.
9. **The syllabus dot point** (`data/dotpoints.json`, via the skill's `dotPointIds`) —
   the source of record for what the skill must cover, and the fallback when the booklet
   under-covers it (see Anchoring).

---

## Output contract

Each generation agent writes, for its one skill, directly to disk:

- **`public/content/{skillId}.json`** — theory + tiered practice, schema-exact per
  [content-schema.md](content-schema.md) ("Content file").
- **`public/quizzes/{skillId}.json`** — MCQ check-for-understanding, schema-exact per
  [content-schema.md](content-schema.md) ("Quiz file").

`{skillId}` **equals** the `data/skills.json` id and the filename stem. Both files are
UTF-8. Emit only the keys the schema defines — **unknown keys are a validation error**
(the sole reserved exceptions `iDo`/`weDo` must **not** be authored; the schema doc does
not yet specify them).

Before finishing, the agent runs:

```
node scripts/validate.mjs --only <skillId>
```

and fixes every error and warning it reports. An agent does not report success on a skill
that does not validate clean in isolation.

**JSON backslash trap.** Every LaTeX backslash inside a JSON string must be doubled:
`"$3 \\times 4$"`, never `"$3 \times 4$"`. The single-escaped forms in the `\t \b \f \n \r`
families do **not** throw a parse error — they silently corrupt: `\times` → TAB + `imes`,
`\frac` → FORMFEED + `rac`, `\text` → TAB + `ext` — and KaTeX then renders the residue
(`imes`, `rac`) as innocent italic letters, so the corruption is invisible to a quick
skim. The validator errors on raw control characters in any string, but write it right
the first time.

---

## Question-count rule

The tier minimums are a **floor, not a target** (schema doc, "Question-count principle").
Derive the count, don't guess it:

1. **Enumerate the skill's distinct structural question types first.** These become the
   quiz `structure` slugs (kebab-case) and the backbone of the practice cards. For
   *round a decimal to a given place*: round-to-tenths, round-to-hundredths,
   carry-boundary, nearest-value recognition — four structural types.
2. **Meet every tier minimum:** foundation **4–5**, development **4–5**, mastery **2–3**.
3. **On top of the minimum, guarantee at least one card per structural type.** If a skill
   has more structural types than the tier floor, the count rises to cover them.
4. **Quiz:** **≥ 3** questions total, **≥ 1 MCQ per structural type**, and **≥ 1**
   `mastery: true` question whenever the content carries a `mastery` tier.

Prefer one clean item per structural type over many near-duplicates (schema doc,
"Coverage over volume").

---

## Mastery-omission rule

Omit the `mastery` tier **only** when the atom genuinely has no harder in-skill twist
(single-step transformations, pure recall facts). When omitted, the content file **must**
carry a one-line `masteryOmitted` reason (e.g. `"Atom is single-step; no in-skill twist
exists."`). A mastery twist must always stay the **same underlying skill** — a twist that
needs an untaught skill belongs to a different skill's content, not here. A mastery item
earns its difficulty from **depth within this skill**, never by reaching into a dependent
skill's atom; if a card would fit a sibling skill better, cut it.

**Banned mastery shapes** (each has been measured to produce "mastery" items that are
genuinely easier or off-skill):

- **Template dressed up** — a foundation drill with bigger numbers or one extra
  mechanical step. Same routine, same thinking; not mastery.
- **Self-scaffolding** — the question hands over the decisive move ("first find the
  height, then…"). If the stem does the hard thinking, the item isn't testing it.
- **Clone-and-defuse** — copies the booklet's hard form but removes the very trap that
  made it hard. Keep the trap; that *is* the difficulty.

---

## Scope rule

Every card and every MCQ exercises **this single skill only**. A direct prerequisite may
appear **only in service of** the skill (e.g. comparing two digits while rounding, adding
two lengths while finding a perimeter), never as the thing being tested. No cross-topic
mixing. If an item cannot be answered without an *untaught* skill, it is out of scope —
cut it (schema doc, "Scope principle"; [atomisation-teaching.md](atomisation-teaching.md),
scope note). The boundary runs both ways: below, don't re-teach prereqs; **above, don't
reach into the dependents or siblings read in "Read first" item 5** — if a question would
sit more naturally in one of those skills' files, it belongs there, not here.

---

## Distractor rule

Every incorrect MCQ option carries a `why` that **names a specific, real misconception**
that produces exactly that answer — a sign slip, an operation swap, a place-value shift, a
formula misuse, an off-by-one on the rounding digit (schema doc, "Option" + "MCQ design
principles"):

- Each distractor is the answer a learner **actually gets** by making one identifiable
  mistake, and `why` states that mistake (**≥ 15 chars, specific** — never "wrong",
  "close", "common error").
- **No throwaway options.** A vague `why` is a validation-worthy defect.
- Options are **plausible and homogeneous** — same form, length, precision, and units as
  the correct one. Never let the correct answer stand out by being longer or more precise.
- **No meta options** ("all/none of the above"). **Sort by plausibility, not magnitude**,
  so the answer isn't given away by position or size.

---

## TikZ rule

Diagrams render through TikZJax (a WASM TeX subset), **not** full LaTeX. Author strictly
to the allowlist in [content-schema.md](content-schema.md) ("TikZ allowlist"): the
preloaded libraries, the auto-detected packages, the forbidden/stripped preamble, the
snapped `\fontsize` set. A diagram that falls outside it shows a "⚠ Diagram failed to
render" placeholder.

- **FOLLOW THE CANONICAL PROMPT.** [tikz-prompt.md](tikz-prompt.md) is the sole TikZ
  authoring authority. It requires a semantic/topology audit before coordinates, provides
  fixed angle constructions and relationship maps, defines coordinate-derived marks for
  other geometry, and includes the rendered visual gate. Use its matching fixed construction
  without hand-nudging; if none fits, use its general construction rules and flag the figure
  for extra visual review.
- **Degrees are `^{\circ}`, never a literal `°`** inside a `\node` — the literal character
  does not compile in TikZJax and can stall the diagram worker.
- **Be generous with diagrams on geometry, measurement, and data skills** (length, area,
  volume, Pythagoras, angles, geometrical figures, data displays) — a labelled figure
  usually carries the question. Number/algebra skills rarely need one.
- **Keep diagrams small, deterministic, and clearly labelled.** Match the booklet's
  figure conventions (read the media PNG first).
- Use **both** a `tikz` on the question front and a `tikzSolution` on the back **where
  each aids** — a bare figure on the front, a fuller annotated figure (marks, working,
  the found value) on the back. `tikzSolution` falls back to `tikz` if absent.
- **Diagram-reading skills must carry the diagram into the QUIZ, not just practice.**
  If the skill is about reading a figure (identifying angle pairs, finding an unknown
  angle from a configuration, reading a graph/plot), an MCQ posed in words only tests
  vocabulary recall, not the skill — give those MCQs a `tikz` figure. The exception is a
  genuinely notational/definitional skill (naming conventions, symbol recognition,
  numeric-relationship recall like "complementary to $27°$"), where a figure would be
  forced — there, symbolic/verbal options are correct.
- **A figure that contradicts its answer is a defect.** When you draw a labelled angle,
  draw it to roughly its stated size, and make the marked positions match the property
  named (alternate = interior + opposite sides, etc.). The blind checker reads your TikZ
  as the diagram; if the drawing implies a different answer than the key, it fails.

---

## Anchoring & the STAGE 3 rule

**Booklet sections are the primary source** for difficulty calibration, question style,
and the foundation→development→mastery progression. Mirror the booklet's worked examples
and practice range.

- **Where the booklet under-covers a skill:** generate from the syllabus dot point
  (`data/dotpoints.json` via `dotPointIds`) plus the principle docs, and record the skill
  as **`anchor: none`** in `docs/content-queue.md` so it gets closer human review.
- **STAGE 3 rule.** Several Stage-4-course topics include stage-3 skills that already
  have a content file (see the queue doc's stage-3 subset counts). For any such skill,
  **copy the `theory` object BYTE-FOR-BYTE from the existing `public/content/{id}.json`** —
  do not re-author intro/facts/steps. Only **add the `practice` tiers** (if absent) and
  **create the quiz file**. This keeps already-shipped theory stable across the batch.

---

## Workflow (orchestrator)

The orchestrator drives the batch; generation and checking run in parallel groups.

1. **Map skills → booklet sections.** From `docs/content-queue.md`, list the batch topic's
   skills (resolve via `dotPointIds` → `data/dotpoints.json` → `topicId`) and pair each
   with its booklet section(s) and media folder. Note the stage-3 subset (STAGE 3 rule)
   and any skill with no booklet coverage (`anchor: none`). **Where 2+ skills map to the
   same booklet section, deal the material disjointly:** each spawn prompt states which
   routines/scenarios of that section belong to *this* skill and which belong to its
   section-mates — parallel agents fed the same exemplars otherwise converge on the same
   questions.
2. **Generate — one agent per skill, in parallel groups of 3–4.** Each agent follows the
   full "Read first" list and every rule above, writes both files, and runs
   `validate.mjs --only <id>` before reporting. **Model tier:** agents for
   geometry/measurement/data skills (PNG reading + TikZ authoring) must not run on a
   downgraded model — image misreading rates on smaller tiers are unacceptable for
   diagram-anchored content.
3. **Blind check.** Proceed **only after every generation agent in the group has reported
   completion** — never infer readiness from file presence or mtime. For each generated
   skill run `node scripts/blind-for-check.mjs <skillId>` — it emits, under `.checkwork/`
   (gitignored), a `{id}.blind.json` (quiz + mastery practice with correct flags / `why` /
   `a` / `solution` stripped and options deterministically shuffled) and a `{id}.key.json`
   answer key. Hand **only** the blind bundle to an independent **checker agent**, which
   **re-solves every MCQ and every mastery practice question WITHOUT seeing the stated
   answers**. The checker is a **fresh agent every round** — never reuse a checker that
   has seen a previous round's bundle or any key.
4. **Adjudicate.** The orchestrator compares the checker's answers against `{id}.key.json`.
   For each disagreement, decide whether it is a **formatting equivalence** (e.g. `3.5`
   vs `3.50`, `1/2` vs `0.5`, reordered but equal) — accept — or a **genuine mismatch**.
   **Repair is targeted, not wholesale:** the orchestrator (or a small fix agent)
   hand-edits the specific defective question(s), re-runs `validate.mjs --only <id>`,
   **re-runs `blind-for-check.mjs`** (any edit invalidates the old bundle), and sends the
   fresh bundle to a **new** checker. Full skill regeneration is reserved for output that
   is structurally unusable — a rewrite of all items reintroduces new defects. **Max 2
   repair rounds per skill**, then **flag for human review** rather than loop. Finish
   with a quick **cross-skill scan** of the batch for shared scenarios or near-identical
   stems between skills that shared a booklet section; dedupe by editing the lesser item.
5. **Validate the batch.** `node scripts/validate.mjs --only <all batch ids>` clean.
6. **Visual diagram gate — MANDATORY for any batch containing TikZ** (skip only for a
   purely symbolic batch like algebra with zero `tikz` fields). The source-reading blind
   check in steps 3–4 verifies **answers**; it is blind to the **rendered picture**
   (colliding/merged labels, a line that doesn't reach its intersection, a stray arrowhead,
   a parallel-mark on the transversal, an angle drawn in the wrong region). Close that gap:
   - Ensure the dev server is running (`npm run dev`).
   - `node scripts/shoot-tikz.mjs --topic <topicId> --out .shots` — headless Chrome renders
     every diagram in scope and writes one PNG per card plus `.shots/manifest.json`
     (each entry carries the skillId, field, question, answer, and compile status). Any
     `status:"fail"` is a compile failure — fix the TikZ before proceeding.
   - Assemble and run the vision gate (one agent per PNG *reads the image* and flags visual
     defects against the question + answer): build the workflow with
     `scripts/build-vision-gate.mjs` (see the batch-2 run for the head/tail templates), then
     run it. Every `ok:false` verdict of severity `major` is a blocker; `minor` (e.g. a
     missing parallel-mark) is orchestrator's judgement.
   - **Repair flagged diagrams by re-instantiating the correct construction from the
     [canonical prompt](tikz-prompt.md)** — do not hand-nudge coordinates. Then re-shoot and
     re-gate the repaired skills only, until clean. This gate is why geometry topics
     (`ang`, `dat`, `pyt`, area/volume/geometry) get a diagram pass before human review.
7. **Rebuild the manifest.** `npm run manifest` (writes `public/content-manifest.json`).
8. **Human-review samples.** Pick **2–3** skills for the human to eyeball, and **always
   include** every `anchor: none` skill, every checker-triggered regenerated skill, and (for
   TikZ batches) any diagram the vision gate flagged, in the sample set.
9. **Update the queue.** Record per-batch status, the review-sample ids, any `anchor: none`
   gaps, and the visual-gate result (clean / N repaired) in `docs/content-queue.md`. Do
   **not** commit — leave that to the human.

---

## Hard constraints (recap)

- **Schema-exact.** [content-schema.md](content-schema.md) is the contract; validate clean.
- **Single skill per file.** Prereqs only in service; no cross-topic mixing.
- **Every distractor is a named misconception** with a specific `why`.
- **Diagrams follow the [canonical TikZ prompt](tikz-prompt.md)**; degrees are `^{\circ}`.
- **TikZ batches pass the visual gate** (`shoot-tikz.mjs` → vision workflow) before human review.
- **Byte-for-byte theory** for stage-3 skills that already have a content file.
- **One batch per session**; statuses updated by the orchestrator; do not commit.
