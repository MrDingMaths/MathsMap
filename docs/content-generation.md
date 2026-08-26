# Content-generation session prompt

The session prompt for a **queue batch** (one topic, or several same-family topics merged
into one queue row from Wave 2 on) that mass-generates teaching content
(`public/content/{id}.json`) and quizzes (`public/quizzes/{id}.json`) for every skill in
the batch, using a multi-agent workflow (one generation agent per booklet section,
an independent blind checker on a **different model** — OpenAI `gpt-5.6-luna` via the
`codex exec` CLI, driven by `scripts/run-luna-check.mjs` — and an orchestrator).

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
1. Reads `docs/content-queue.md` and takes the **next `pending` batch** (one queue row
   per session; a row may span several same-family topics from Wave 2 on).
2. Enumerates the batch's skills from `data/skills.json` (skills whose `dotPointIds`
   resolve, via `data/dotpoints.json`, to any of the batch's topic ids), maps each to its
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
   fixed-template, and rendered-verification workflow. **Figure-free sections skip it
   entirely:** the orchestrator's spawn prompt states whether the section is
   figure-bearing; an agent whose section carries no `[tikz]` must **not** open
   `tikz-prompt.md` at all — it is by far the largest doc in the shared bundle (~73 KB
   since the 2026-08 unified manual) and reading it "just in case" was the single largest
   duplicated cost in batch 9 (~150k tokens of re-read docs across three generators).
   `docs/tikz-prompt.md` is **generated** — the source of truth is the sibling
   MathsDatabase repo's `prompts/tikz/*.md`; never edit the file in place.
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
   where it exists) — read the `theory` and `solution_text` working of the prereqs for
   **notation and tone continuity**. New content must read as the same voice, the same
   house style, the same step-note vocabulary as the skills it builds on.
7. **The mapped booklet section(s)** from `docs/content-queue.md` — the queue row lists
   the **explicit file paths** (Wave 1 files live under `booklets/Stage 4/`; Wave 2
   spans THREE directories — `booklets/Stage 5/` (NEW-origin, supersedes),
   `booklets/Stage 5 Core/` and `booklets/Stage 5 Path/` — per `booklets/TRIAGE.md`.
   Use the queue row's paths verbatim; do not glob by topic title, several Stage-5
   filenames don't match their topic name). Read the worked examples **and** the
   practice questions. Worked examples alone do not show the routine's full range.
8. **The booklet's diagram PNGs** — **resolve the booklet's own image link relative to the
   booklet's directory**; that always works and the layout differs by wave. Wave 1
   (`booklets/Stage 4/`) puts PNGs at `<booklet-dir>/media/<booklet-stem>/imageN.png`;
   **Wave 2 (`booklets/Stage 5*/`) nests one level deeper —
   `<booklet-dir>/media/<booklet-stem>/media/imageN.png`** (confirmed in W2-1 by five
   independent generation agents, each of which would have hit a non-existent directory
   had it trusted the Wave-1 path). Booklet stems contain spaces and a `_` that is a
   *title separator*, not a path convention, so never glob by topic title. **A figure-free
   section skips this item entirely**, exactly as it skips `tikz-prompt.md` in item 1.
   For any geometry/measurement/data figure —
   3D solids, labelled triangles, graphs, plots, distance–time graphs, or wherever alt
   text is thin — **`Read` the PNG directly** as the design reference before authoring a
   inline `[tikz]...[/tikz]` diagram.
9. **The syllabus dot point** (`data/dotpoints.json`, via the skill's `dotPointIds`) —
   the source of record for what the skill must cover, and the fallback when the booklet
   under-covers it (see Anchoring). **Where a skill's `dotPointIds` span stages, the
   BATCH'S TOPIC ID selects the governing dot point and every other id on the record is
   ignored.** This is the common Wave-2 shape, not an edge case: 11 of W2-1's 12 skills
   also carried a Stage-6 Standard dot point, and 3 of W2-2's 14 carry a Stage-6 Advanced
   one. Resolve `dotPointIds` → `data/dotpoints.json` → `topicId`, keep the id whose
   `topicId` is in the batch, and author to that one alone; the others describe what a
   *later* course does with the same skill and would silently pull the content above stage.

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
that does not validate clean in isolation. (Multiple ids after `--only` must be **one
comma-joined argument** — `--only id1,id2,id3`. Space-separated ids after `--only` are a
hard error in every audit script, not a silent single-file scan.)

**JSON backslash trap.** Every LaTeX backslash inside a JSON string must be doubled:
`"$3 \\times 4$"`, never `"$3 \times 4$"`. The single-escaped forms in the `\t \b \f \n \r`
families do **not** throw a parse error — they silently corrupt: `\times` → TAB + `imes`,
`\frac` → FORMFEED + `rac`, `\text` → TAB + `ext` — and KaTeX then renders the residue
(`imes`, `rac`) as innocent italic letters, so the corruption is invisible to a quick
skim. The validator errors on raw control characters in any string, but write it right
the first time.

---

## Worked-solution setout

`solution_text` reproduces the **booklet worked example's setout** for the skill (Read-first
item 7 is the source of the stage structure). The house style, verbatim in
[content-schema.md](content-schema.md) and [worked-example-principles.md](worked-example-principles.md):

- **Align on `=`.** Opening line is the bare expression; every later line begins `=`. Keep
  useful intermediate lines (e.g. the divide-out line when factorising). **The renderer does
  the visual alignment for you:** a run of consecutive whole-line `$…$` maths is collapsed
  into one KaTeX `aligned` block, column-locked on each line's first top-level relation
  (`InlineContent.groupTextBlocks`). So **write one plain `$…$` per line** — never hand-author
  `\begin{aligned}`/`&`/`\\` (that doubles the JSON-backslash trap for no gain). A line with
  trailing prose (e.g. `$x=112^{\circ}$, angles on a straight line`) breaks the run and renders
  on its own — fine for a concluding reason line.
- **The final line is the answer. No line that merely restates it.** In particular, do **not**
  follow a computed `$=112^{\circ}$` with a bare `$x=112^{\circ}$` — that restatement is a
  defect. And never write a false continuation: `$x+68^{\circ}=180^{\circ}$` then `$=180^{\circ}-68^{\circ}$`
  reads as `180°=180°−68°`; the second line must re-anchor its LHS (`$x=180^{\circ}-68^{\circ}$`).
- **Step headers only at genuine stage boundaries**, as a standalone `N. **Step name**` line
  (number outside the bold) drawn from `theory.steps` in order. **Single-stage routines carry
  no headers** — do not label every line.

```
BEFORE (per-line label soup — banned)          AFTER (booklet setout)
$4x+6$                                          $4x+6$
$= 2(\frac{4x}{2}+\frac{6}{2})$  **Find the HCF**   $=2\left(\frac{4x}{2}+\frac{6}{2}\right)$
$= 2(2x+3)$  **Check by expanding**            $=2(2x+3)$
$2(2x+3)$  **Check by expanding**
```

Multi-stage skills header each stage the booklet numbers (e.g. `1. **Factorise the LHS**`
then `2. **Solve each factor**`). The validator no longer *requires* a label; a header that
is present must still name a `theory.steps` entry in order.

### solution_text is working only — never restate the question

The practice flip-card re-renders the question as a muted recap on the flipped back
(`PracticeCard.svelte` `.flip-back-q`, prose stripped of the figure), then the solution
below it. So **`solution_text` must not repeat the prompt prose** and must not redraw the
plain question figure. Author only the working (and, per the TikZ rule, a *fuller annotated*
figure when it adds construction the question figure lacks — never a duplicate of it).

### Don't force a procedure

Recognition / comparison / conceptual skills with no genuine multi-stage method (e.g.
`linear-representations`) **omit `theory.steps`** and write clean working plus a one-line
answer. A vacuous procedure ("Check each representation", "Confirm the same line") is a defect
— drop the steps and, if the `intro`/`facts` are equally hollow, rewrite them from the booklet
and syllabus dot point.

### Solution migration (already done — the house-style flip)

The Stage-4 practice content was flipped from the old per-line-label style in two passes; a
**regenerated** skill must land in the new style, matching its neighbours:

1. **Mechanical strip** (one-off, since removed): stripped the trailing `**label**` from every
   working line and the redundant restated-answer line across all content + quizzes. This
   finished every single-stage skill.
2. **Re-authored the subset**: pure-recognition skills had their vacuous `steps` dropped; the
   slop-theory skill (`linear-representations`) had `steps` dropped and its contorted
   `$\text{…}$` pseudo-working lines removed. Any future multi-stage skill that genuinely
   stages its work adds booklet-style numbered headers here.

---

## Question-count rule

The tier counts are a **ceiling you earn, not a quota you fill** — foundation **up to 10–12**,
development **up to 10–12**, mastery **3–4**, quiz **8–10**. The validator hard-errors only
below a safety floor (3 / 3 / 2 / 3) and *warns* below **6 / 6 / 3 / 6**; a genuinely narrow
atom clears the warn with a `coverageNote`. Variety, not volume, buys the extra cards. Derive
the count, don't guess it.

**The warn thresholds are deliberately left at the old 6/6/3/6 and must not be raised to
match.** A skill that honestly ceilings out at 7 foundation cards is a *correct* result, not a
shortfall, and should pass silently. The raised numbers say "there is room to go further when
the atom genuinely supplies the variety" — they do **not** say "reach 10 or explain yourself".
An agent that pads to 10 has produced a worse file than one that stopped honestly at 7.

**Why foundation/development rose further than mastery/quiz.** The blind bundle contains
**quiz + mastery only** (`blind-for-check.mjs`) — foundation and development cards are never
sent to the checker. So an extra foundation card costs generation tokens once and nothing
downstream, while an extra quiz or mastery item is re-solved every check round and every flag
it draws costs an adjudication ruling. Spend the added budget where it is cheap and where
students get the most practice.

### Variety is two-level

A new card is justified only when it changes the learner's reasoning or the answer's
character:

1. **Structural type** — the procedure/shape of the question. Each distinct type becomes a
   `structure` slug (kebab-case), tagged on the quiz question **and** on every practice card
   of that type, from one shared per-skill vocabulary. **Enumerate these first.**
   For *round a decimal to a given place*: round-to-tenths, round-to-hundredths,
   carry-boundary, nearest-value recognition — four structural types.
2. **Meaningful case within a type** — a parameter change that flips the problem's
   *character*, not just its digits. Legitimate distinct cards. Case axes:
   - **sign / direction:** `y=2x+3` (increasing) vs `y=−2x+3` (decreasing); `+/−` operands.
   - **regime:** proper / improper / mixed; acute / obtuse / reflex; like vs unlike denoms.
   - **boundary / edge:** carry vs no-carry; crossing zero; the `0.5` tie; 0, 1, right angle.
   - **representation:** fraction vs decimal input; diagram-given vs symbol-given.

**Near-duplicate (banned padding)** = same structural type **and** same case, only the
literal numbers swapped (`y=2x+3` vs `y=2x+5`). Test: *would a student who can do one
automatically get the other with no new thought?* If yes → padding, cut it.

### Deriving the count

1. Enumerate distinct **structural types**; cover each (≥1 card).
2. Add a card per **meaningful case** (sign, regime, boundary, representation) — variety-first,
   **≤2 items per structural type × case**. Stop when the meaningful cases run out, wherever
   that lands. If they run out at 6, the tier has 6 cards; if the atom supplies 12 distinct
   cases, take all 12. **The number is the output of the enumeration, never the input to it.**
3. **Quiz:** up to 8–10, **≥ 1 MCQ per structural type**, and **≥ 1** `mastery: true`
   question whenever the content carries a `mastery` tier. Extra quiz items beyond one per
   type must each earn their place on a distinct *case*, not a re-run of a covered type.
4. A genuinely single-case atom that cannot reach target without near-duplicate padding
   records a one-line `coverageNote` (practice-level in the content file, top-level in the
   quiz file) instead of padding — same escape-hatch pattern as `masteryOmitted`. Push
   variety as far as the atom honestly allows, then stop.

**Every generation agent reports its structural-type enumeration** — the list of types, and
the case that justifies each card beyond the first of its type. This is what makes padding
visible to the orchestrator; a report that gives only counts hides exactly the defect the
per-type cap exists to prevent. The enumeration also lands **in the file**: every practice
card and quiz question carries the `structure` slug for its type (see
[content-schema.md](content-schema.md)), so the validator's practice↔quiz parity check is the
durable version of this report, not just the agent's transcript.

### When the type count exceeds the quiz ceiling — TYPE COVERAGE WINS

A type-rich skill can enumerate more structural types than the quiz ceiling of 8–10 has room
for. **Cover every type and let the quiz exceed 10, stating the count and the reason.** The
ceiling yields; the enumeration does not. A skill with 11 honest types gets an 11-item quiz.

**Never merge two genuine types into one "type with cases" to fit under the ceiling.** That
is the failure mode this ruling exists to stop: it satisfies the arithmetic while making the
reported type list an under-count, and that list is the orchestrator's only instrument for
telling real variety from renumbered padding. Measured in W2-1, where the two agents facing
this split — `earning-money` kept all 9 types and dropped quiz case-variety; the tax agent
folded three types into cases to stay under 10. Both were defensible under a silent runbook;
only the first is correct under this one.

Order of sacrifice when a quiz is over-full: (1) drop **case variety** — extra items beyond
one per type; (2) then drop **the second mastery item**, keeping at least one; (3) only then
run long. Running long is safe: the validator's hard cap is **20** questions, so an 11- or
12-item quiz validates clean and draws no warning. Note the ceiling was calibrated on Stage-4 geometry, which is markedly less
type-rich than financial mathematics and several other Wave-2 families.

Coverage over volume: one clean item per meaningful case beats many near-duplicates.

---

## Quiz-independence rule

**A quiz item must never restate a practice stem from the same skill — any tier,
byte-for-byte or lightly reworded.** The practice cards are the flip-cards the student has
just studied; a quiz item that repeats one tests recall of the card, not the skill. The
quiz mirrors each practice **structural TYPE** (same `structure` slug) with **fresh numbers and
a fresh scenario**, and — wherever the maths allows — lands on a **different answer value**
than the practice card of the same type. The validator warns when a skill's practice
`structure` set and its quiz `structure` set don't cover each other, so a type present on one
side and missing on the other is caught, not just intended.

```
PRACTICE mastery card                           QUIZ mastery item
Evaluate $2^3 \times 2^4 \div 2^5$.

BEFORE (banned — verbatim clone)                AFTER (same type, fresh numbers,
Evaluate $2^3 \times 2^4 \div 2^5$.             different answer)
                                                Evaluate $3^6 \div 3^4 \times 3^2$.
```

Copying the figure counts too: a quiz stem whose `[tikz]` block is byte-identical to a
practice card's is the same defect wearing a diagram. Batch 9 measured this class at **21
items across 7 of 14 skills** — the generators copied the mastery card verbatim into the
quiz — and it alone cost 2 repair rounds and 2 extra check rounds.
`scripts/audit-duplicate-stems.mjs` (deterministic gate, workflow step 3) enforces the
byte-level floor; this rule owns the reworded cases the script cannot see. The
near-duplicate test from the Question-count rule applies across the practice/quiz
boundary: *would a student who just flipped the card answer this MCQ with no new thought?*
If yes, it is not a quiz item.

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
- **Diagrams belong in the QUESTIONS, not only the solutions — STANDARD, every batch.**
  Wherever a figure genuinely helps the student reason — number lines, ratio bar/part
  models, coordinate and distance–time graphs, labelled geometry — every **foundation and
  development** card carries a figure in `question_text` (a **support scaffold**: the line
  / axes / shape drawn, scaled and labelled, but the thing being asked for **not** marked)
  and the matching **worked figure** in `solution_text` (the same figure with the reasoning
  marked on — dots, jump arcs, the plotted segment, the split bar). This is now the default
  treatment, not a per-batch request: it was added by hand to batch 2 (angle configurations
  moved out of prose into figures) and batch 7 (blank support number lines + marked
  solution lines) after human review, and both were approved.
  - **Never pre-mark the answer.** A question figure that already shows the value being
    asked for is a defect, as is a "support" figure on a card where the figure is purely
    decorative (most rate/best-buy/word-problem arithmetic) — there, no figure.
  - **Prefer a figure over wordy configuration prose.** If a card spends two sentences
    describing where things sit, draw it and cut the prose to a short instruction.
  - Mastery tiers follow the same judgement but are not required to carry a scaffold —
    part of mastery can be building the representation yourself.
- **Data displays: obey the anti-collision placement rule and the variety rule** in
  [tikz-prompt.md](tikz-prompt.md) ("Data displays"). Title centred at `ymax+1.1`; y-axis
  label **rotated 90° at the left midpoint** (never the top corner, which collides with the
  title); **x-axis label on its own centred line UNDER the categories at `(xmid, -1.0)` —
  never at the arrow tip on the `y=0` baseline** (there it collides with the last
  category/tick label). **Fit the plot to its labels:** the `font=\large` first line is the
  default and tick/category rows override with `font=\scriptsize`; set the rotated y-label's
  x-offset so it clears the widest tick by about one character; prefer short/abbreviated
  category words; titles ≤ ~22 chars and never extending left of `x=0`. Across sibling skills **never reuse a scenario**, vary the
  column count 3–7 and the value pattern, and draw line graphs with a **non-constant slope**
  (no perfectly linear 10,20,30,40). Instantiate the copy-ready templates rather than
  hand-rolling axes.
- **Keep diagrams small, deterministic, and clearly labelled.** Match the booklet's
  figure conventions (read the media PNG first).
- Embed a bare `[tikz]...[/tikz]` figure in `question_text` and, where it aids the
  explanation, a fuller annotated figure in `solution_text`. Placement in the string is
  placement on screen; there are no separate diagram fields or fallbacks.
- **Diagram-reading skills must carry the diagram into the QUIZ, not just practice.**
  If the skill is about reading a figure (identifying angle pairs, finding an unknown
  angle from a configuration, reading a graph/plot), an MCQ posed in words only tests
  vocabulary recall, not the skill — embed a figure in those MCQs' `question_text`. The exception is a
  genuinely notational/definitional skill (naming conventions, symbol recognition,
  numeric-relationship recall like "complementary to $27°$"), where a figure would be
  forced — there, symbolic/verbal options are correct. The support-scaffold treatment
  above applies to quiz stems too: an MCQ whose practice siblings carry a question figure
  should carry one as well, subject to the same never-pre-mark-the-answer rule.
- **A figure that contradicts its answer is a defect.** When you draw a labelled angle,
  draw it to roughly its stated size, and make the marked positions match the property
  named (alternate = interior + opposite sides, etc.). The blind checker reads your TikZ
  as the diagram; if the drawing implies a different answer than the key, it fails.

---

## Table rule

Some figure-free sections are **table-bearing**: the load-bearing representation is a table,
not a picture (tax tables, year-by-year growth/decay tables, rate cards, frequency tables).
The schema gives the mechanism in one line — a KaTeX `array` inside `$…$` — and this rule
gives the authoring judgement around it.

- **A table is a KaTeX `array` inside `$…$`, never a `[tikz]` picture and never Markdown
  pipes.** Markdown other than `**bold**` is not supported and will render literally.
- **A table the student must read to answer goes in `question_text`**, not only in the
  solution. Same principle as a question-side support figure: the data must be in front of
  them while they work.
- **Restate the table in every stem that needs it.** Do not write "using the tax table from
  question 3" — practice cards are shuffled flip-cards and quiz items are standalone, so a
  cross-reference is unanswerable. Restating an identical table across many stems is
  **correct**, not duplication: `audit-duplicate-stems` normalises the whole stem, so the
  differing lead-in and ask keep the items distinct. Do not let the audit's silence be the
  reason — make the ask genuinely different.
- **One table per batch family unless a card's point is comparing tables.** Copy the
  booklet's table verbatim so nothing drifts between sibling skills, and keep its printed
  conventions (bracket boundaries, cent values). Where a skill genuinely needs a *second*
  table — an unknown-value or compare-two-systems item — make it obviously fictional
  (another country, a made-up institution) so it cannot be mistaken for the real one.
- **Keep the columns aligned to the values** (schema rule) and the table small enough to
  read on a phone: prefer 4–6 rows and 2–3 columns; a long table is usually a sign the
  question should give an extract.

## House mathematical conventions

Where a booklet is internally inconsistent on a definition, the ruling below is the house
convention and **overrides the booklet**. Record any new case here rather than deciding it
per batch — a convention settled in one batch and forgotten is how two skills end up
contradicting each other.

- **Trapezium — INCLUSIVE** (owner ruling, batch 14). A trapezium has **at least** one pair
  of parallel sides, so **every parallelogram is a trapezium**, as are rectangles, rhombuses
  and squares. Write "at least one pair", never "exactly one pair", in any definition.
  `Properties of Geometrical Figures 2` uses both conventions and cannot be followed as
  printed: its hierarchy diagram draws Trapezium → Parallelogram → Rhombus/Rectangle →
  Square (inclusive), while its Foundation Q1 answer key gives a rectangle as
  "quadrilateral, parallelogram, rectangle" with trapezium omitted (exclusive). Follow the
  diagram. Note the exclusive reading is still needed to *describe a figure* — "only one
  pair of sides carries the parallel arrows, so it is a trapezium and not a parallelogram"
  is correct and remains the right way to name a specific shape.
- **No mode / multiple modes** (batch 15, following the batch-4 precedent already shipped in
  `compare-displays-range-mode`'s `theory.facts`). A dataset in which **every value occurs
  equally often has NO mode** — write "no mode", never "every value is a mode". Where two or
  more values tie for the highest frequency, **all** of them are modes and all must be
  reported. `Data Analysis` calls a uniform distribution "No mode", which agrees.
- **Written form of a mean** (batch 15). A mean that does not terminate is asked for **"to
  $1$ decimal place"** — the required form is pinned in the stem, and the booklet's
  recurring-dot notation ($18.\dot{3}$) is **not** used in content. A terminating mean is
  written exactly as a decimal ($7.5$), never as an unreduced fraction ($15/2$). A range is
  stated with units when the data carry units; an MCQ must never offer the same value both
  with and without its unit as two options.
- **Non-convex diagonals** (batch 14). The same booklet's summary states the test as
  "diagonals meet outside the quadrilateral". That is **false** for diagonals as segments —
  in a dart they do not meet at all; only an extension does. Author the true test: **one
  diagonal lies outside the shape**, so the two do not cross inside it.
- **Written form of a probability** (batch 16). The default answer form is a **fraction in
  simplest form**, and the stem pins it explicitly ("as a fraction in simplest form") —
  every probability has four written forms ($\frac{2}{6}=\frac{1}{3}=0.3\dot{3}=33.\dot{3}\%$),
  so an unpinned stem is an equivalent-options defect waiting to happen. When the given
  data are decimals or percentages (e.g. $P(\text{rain})=0.2$, "bus on time $75\%$ of the
  time"), the answer stays in the given form and the stem pins it ("as a decimal", "as a
  percentage"). Never mix forms within one MCQ's options, and never offer two forms of the
  same value as separate options.

- **Written form of a money answer** (batch W2-1, financial mathematics). A literal dollar
  sign is `\$` (schema rule) — in JSON that is `"\\$"`. **The stem pins the rounding and
  the written form follows the pin**: "to the nearest cent" → always two decimal places
  (`\$1\,234.50`, never `\$1234.5`); "to the nearest dollar" → whole dollars (`\$5092`).
  Pin it explicitly whenever the exact value does not terminate at two places — an
  unpinned money stem is an equivalent-options defect waiting to happen, exactly as with
  probability. Never offer the same amount at two roundings as two options.
  **The rule governs computed answers and option texts, not given quantities** — a
  stem-given round price stays `\$4000`, not `\$4000.00`, which is what every booklet
  writes; keep option precision homogeneous *within* one MCQ. Amounts of four digits or
  more take a **thin space** as the thousands separator (`\$23\,040`), never a comma.
  (All three refinements were settled independently by three W2-1 agents before being
  written down here.) **Interest rates are written "$6\%$ p.a."** in prose and
  converted to a decimal only inside the formula line (`$r=0.06$`); a *rate per period*
  under non-annual compounding is stated as the divided rate with its period named
  ("$1.5\%$ per quarter"). **Round only once, at the end** — carrying a rounded
  intermediate through a compounding chain shifts the cents and makes a correct student's
  answer disagree with the key.
- **No redundant coordinate labels on a graphed intercept/point** (owner feedback,
  linear-relationships diagrams). When a marked point's coordinate value is **already a
  labelled tick on both axes** (present in `xtick`/`ytick`), do not also drop a
  `\node{$(a,b)$}` on it restating the same number — the labelled axes already say it. Keep
  the `\addplot[only marks,mark=*]` dot as the visual anchor. Only add the coordinate label
  when at least one coordinate is **not** an axis tick value (e.g. a non-integer intercept
  like $1.5$, or a point the student must read off a gridline the axis doesn't number) —
  there the label is the only way to state the exact value.
- **Don't show the graph when the skill is "read it from the equation"** (owner feedback,
  `compare-linear-equations`, `slope-intercept-interpret`). A steepness-comparison or
  parallel-check question that plots both lines and asks "which is steeper" / "which are
  parallel" lets the student answer by eye, defeating the skill it sits in — these skills
  exist specifically to compare gradients read off the equations. State the equations in
  the stem and drop the `[tikz]` figure entirely; a graph-based version of the same question
  belongs in a graph-reading skill instead (e.g. `parallel-lines-equal-gradient`'s own
  `are-lines-parallel-graph` structure, which is explicitly about reading a graph — keep
  that one).

## Anchoring, the ALREADY-COMPLETE rule & the STAGE 3 rule

**Booklet sections are the primary source** for difficulty calibration, question style,
and the foundation→development→mastery progression. Mirror the booklet's worked examples
and practice range.

- **Where the booklet under-covers a skill:** generate from the syllabus dot point
  (`data/dotpoints.json` via `dotPointIds`) plus the principle docs, and record the skill
  as **`anchor: none`** in `docs/content-queue.md` so it gets closer human review.
- **ALREADY-COMPLETE rule (Wave 2 on).** Some lower-stage skills tagged into a
  higher-stage topic were **fully generated in an earlier wave** — their content file has
  full practice tiers AND a quiz file exists. **Skip them entirely only if both files
  exist AND the skill passes the full deterministic gate** (step 3 of the workflow: all
  six commands, `--strict`, comma-form `--only <thatSkillId>`). Presence is not enough —
  earlier waves shipped before some gate scripts existed, so a file that exists may still
  be dirty.
  - Both files present, gate clean → count the skill as done in the batch report, touch
    nothing.
  - Either file missing → treat it as a normal generate and flag it to the human.
  - **Both files present but the gate is dirty → the skill is a repair item in this
    batch, not a skip.** Fix it under the remediation contract (`docs/content-queue.md`
    § Remediation queue: replace quiz items only, never practice cards; re-author against
    the booklet; preserve every `structure` value and the mastery count), re-run the gate,
    and record the repair in the batch report.
- **STAGE 3 rule.** A lower-stage skill with a **theory-only** content file (no practice
  tiers): **copy the `theory` object BYTE-FOR-BYTE from the existing
  `public/content/{id}.json`** — do not re-author intro/facts/steps. Only **add the
  `practice` tiers** (if absent) and **create the quiz file**. This keeps already-shipped
  theory stable across the batch.
- **Upper-stage scope drift (Wave 2 on).** Stage-5 booklets — especially NEW-origin and
  Path files — contain Stage-6 material, exactly as the Stage-4 `Indices.md` booklet
  contained Stage-5 material. The skill's `stage` and its **governing** dot point (item 9
  above) set the ceiling; material beyond it is excluded and the exclusion is recorded in
  the batch notes.
  - **The exclusion is PER-QUESTION, not per-chapter.** `Indices.md` clumped its
    out-of-stage material in trailing chapters, so "skip the later chapters" worked. Stage-5
    booklets **interleave** it: W2-1's `Financial Mathematics A 1` drops HSC-tagged items
    *inside* otherwise in-stage mastery tiers, and its tax chapters mix Stage-5 and Stage-6
    Standard questions in one exercise. Scan the exercise, not the table of contents.
  - **An HSC-tagged question in a Stage-5 booklet is Stage-6 by default** — exclude it
    unless the routine it exercises is identical to one the in-stage worked examples teach,
    in which case it may be used as a difficulty reference but not reproduced.

---

## Workflow (orchestrator)

The orchestrator drives the batch; generation and checking run in parallel groups.

1. **Map skills → booklet sections.** From `docs/content-queue.md`, list the batch topic's
   skills (resolve via `dotPointIds` → `data/dotpoints.json` → `topicId`) and pair each
   with its booklet section(s) and media folder. Note the already-complete skips
   (ALREADY-COMPLETE rule), the theory-only subset (STAGE 3 rule) and any skill with no
   booklet coverage (`anchor: none`). **Where 2+ skills map to the same booklet section,
   deal the material disjointly:** each spawn prompt states which routines/scenarios of
   that section belong to *this* skill and which belong to its section-mates — parallel
   agents fed the same exemplars otherwise converge on the same questions.
   **Scenario/display exclusivity (standing rule for any batch of ~8+ skills on shared
   material):** assign each skill an exclusive context domain and, where displays are
   involved, an exclusive display type, stated in its spawn prompt — batch 15 ran 14
   sibling skills on one booklet to 0 cross-skill duplicate stems over 386 items this way.
2. **Generate — one agent per booklet SECTION (not per skill), sections run in parallel.**
   This is the leaner default: a section-owning agent takes that section's 2–4 skills,
   reads the shared authoring docs (schema, `tikz-prompt.md`, principle docs, the booklet
   section + its media PNGs) **once**, then authors each of its skills — dealing the shared
   exemplars disjointly across them (step 1). It writes both files per skill and then
   **clears the full deterministic gate (step 3) on its own skills before reporting** —
   all six commands, `--strict`, comma-form `--only`. An agent does not report success
   with a dirty gate. This cuts the duplicated
   doc-reading that one-agent-per-skill pays N times, and one author-per-section improves
   disjoint dealing. (Fall back to one agent per skill only when a section's skills are too
   many or too heavy for a single agent.) **Model tier:** agents for
   geometry/measurement/data skills (PNG reading + TikZ authoring) must not run on a
   downgraded model — image misreading rates on smaller tiers are unacceptable for
   diagram-anchored content.
3. **Deterministic gate — run it BEFORE any checker is spawned.** Every defect a script
   can find must be found by a script, and found before a model is paid to read the
   items. Six commands, always the comma-form `--only`, always `--strict`; the gate is
   seconds, so it also re-runs after **every** repair edit. Six commands since batch 13,
   when the two batch-12 orchestrator-side figure sweeps were promoted to standing
   scripts (`tests/figure-audits.test.js` pins both against a reconstruction of the
   original defects):

   ```
   node scripts/validate.mjs --only <id1,id2,...>
   node scripts/audit-equivalent-options.mjs --strict --only <id1,id2,...>
   node scripts/audit-duplicate-stems.mjs --strict --only <id1,id2,...>
   node scripts/audit-option-hygiene.mjs --strict --only <id1,id2,...>
   node scripts/audit-figure-scale.mjs --strict --only <id1,id2,...>
   node scripts/audit-angle-arms.mjs --strict --only <id1,id2,...>
   ```

   Generation agents clear the gate on their own skills before reporting (step 2); the
   orchestrator re-runs it here over the **whole batch id list** — cross-skill
   duplicates are invisible to a single section's agent.

   **Wave regression check — unscoped, once per wave and after every remediation
   session.** The gate above is scoped by `--only` and therefore cannot see debt
   accumulated across earlier batches. Run the duplicate auditor over the whole repo:

   ```
   node scripts/audit-duplicate-stems.mjs --strict
   ```

   Record the defect totals **by class** in `docs/content-queue.md`. Any increase over
   the previously recorded totals is a regression in the batch just generated — repair it
   before the batch is marked `validated`. The NEAR-DUP line is advisory and never counts.
   Baseline recorded 2026-08-04: `QUIZ-COPIES-PRACTICE: 160, INTRA-FILE-DUP: 4,
   CROSS-SKILL-DUP: 2, QUIZ-COPIES-PRACTICE-VALUES: 132` (298 total, 222 advisory).

   - **`audit-duplicate-stems.mjs`** — normalised-stem duplication, `[tikz]` blocks
     included so figure-identical clones are caught: quiz stem == practice stem in the
     same skill (any tier — batch 9's 21-clone class), two equal stems in one file,
     equal stems across the batch's skills, plus an advisory near-duplicate report.
     It deliberately has **no minimum stem length** — an early ad-hoc scan with one hid
     a five-clone cluster in a single quiz (`order-operations-indices`, batch 9).
     Since Wave 2 it also emits **`QUIZ-COPIES-PRACTICE-VALUES`**: a value-signature
     bucket (all numeric literals in the raw stem + the canonicalised correct answer,
     ≥2 literals required) that catches a quiz item **rewording** a practice card while
     keeping its numbers and answer — the class batch 16's four luna-caught clones
     belonged to, invisible to stem matching.
   - **`audit-figure-scale.mjs`** — a hand-placed length label attached to a segment
     that is not drawn to that length relative to the rest of its figure (batch 12's
     slant-side decoys: `$10$ cm` drawn $8.60$). This is the one gate that reaches
     **foundation and development** cards, which no checker ever sees — the blind bundle
     is quiz + mastery only. Labels are bound to segments by inline `node[midway]`
     syntax where present, else by proximity; a subdivided edge offers each of its
     sub-spans, so part-labels are matched to their part. Figures authored with
     tikz-3dplot are compared on **true 3D lengths**, so a foreshortened depth edge is
     never mistaken for a short one; a solid hand-projected into 2D coordinates is
     skipped, never flagged. Needs ≥3 matched labels in a figure to have a reliable
     median, so a 2-label circle figure is out of its reach by design.
   - **`audit-angle-arms.mjs`** — a labelled angle drawn with fewer than two bounding
     rays, so the marked region is ambiguous (batch 11's central angles with one
     radius, caught by the human's eye). `\pic {angle=A--B--C}` constructions build
     their own arms and are exempt. Only junctions (≥2 segments) and drawn arc centres
     count as vertices — a bare ray tip does not, which is what keeps a label sitting
     between two rays from being mis-assigned.
   - **`audit-option-hygiene.mjs`** — an option equal to the **key of a different item
     sharing its `structure` slug** in the same quiz (cross-item leakage; a bare integer
     coinciding with an unrelated item's answer is not a defect and is not flagged), and
     any distractor `why` under 15 chars or matching a generic-phrase list. It attempts
     no reachability judgement — that needs a model and stays with the checker.

   ### Equivalent-option audit

   Flags MCQ options that are **mathematically equal to one another** — a class the
   validator cannot see (every option is well-formed and exactly one is `correct`) and
   that the blind checkers have repeatedly missed, because a checker who solves the item
   correctly never needs to look at the other options. Two shapes, both real defects:
   - **distractor == distractor** — the pair is jointly eliminable ("a key can't be two
     options"), so the student narrows the field without doing any maths. Fix by changing
     one option's **value**, not just its `why`.
   - **distractor == key** — the item has two defensible correct answers. Fix by **pinning
     the required form in the stem** ("in simplest form", "to $2$ decimal places", "in the
     form $1:n$"), which keeps the distractor's misconception live; the script treats a
     form-pinning stem as intended and does not flag it.

   Worst on ratios (2:6 = 12:36 = 1:3) but it bites anywhere an answer has more than one
   written form: fraction vs decimal, trailing zeros (`2.50 h` vs `2.5 h`), unsimplified
   fractions. The audit is advisory and parses conservatively (~45% of options), so it is
   a floor, not a ceiling — it does not replace the checker.

4. **Blind check — luna (`gpt-5.6-luna` via `codex exec`), one packet per skill.**
   Proceed **only after every generation agent has reported completion AND the
   deterministic gate is clean** — never infer readiness from file presence or mtime.
   For each generated skill run
   `node scripts/blind-for-check.mjs <skillId>` — it emits, under `.checkwork/` (gitignored),
   a `{id}.blind.json` (quiz + mastery practice with correct flags / `why` / `solution_text`
   stripped and options deterministically shuffled) and a `{id}.key.json` answer key. Then:

   ```
   node scripts/run-luna-check.mjs --skills <id1,id2,...>
   node scripts/run-luna-check.mjs --compare <id1,id2,...>
   ```

   The driver builds one **self-contained packet per skill** — the checker brief (the
   brief's single source of truth lives in the script), the skill card from
   `data/skills.json` **with its prereqs and dependents expanded to titles + blurbs**, and
   the blind bundle — and spawns one stateless read-only `codex exec` call per skill
   (**never the codex MCP** — owner instruction). Luna has no repo access; the packet is
   its entire world. Replies land as `.checkwork/{id}.luna.json`; `--compare` then reads
   them against the keys and prints mismatches, coverage shortfalls, and flags. Every
   call is stateless, so **fresh checker every round** holds by construction; the old
   split-above-~25-skills rule is moot (per-skill packets never share context). The
   orchestrator (Claude) never plays checker, and the driver never reads a key file in
   check mode.

   ### What the checker is actually for — brief it accordingly

   **The correlated-reasoners caveat is retired** (batch 10, with the move to luna).
   Through batch 9, generator and checker were the same model reading the same booklet —
   across batches 3–9, roughly **1150 items re-solved, zero answer mismatches** — so the
   compare-to-key step could not cross-validate. A different model's re-solve makes
   answer mismatches **meaningful evidence again**; do not dismiss one as a formatting
   quirk without adjudicating it.

   **The yield is still expected in the cold read.** The defect classes the checker hunts
   (all real catches from batches 8–9):
   - **Ambiguity** — two defensible correct options (a key of `8:5` sitting beside an
     equivalent `1.6:1`), or a stem that never pins the rounding/form.
   - **Duplication** — a quiz item *rewording* its own practice card (the byte-level
     class is now caught by the deterministic gate before any checker runs).
   - **Under-determination** — a construction whose stem doesn't pin every stage, so several
     different graphs satisfy it while the solution shows one. A correct student is marked
     wrong.
   - **Unreachable distractors** — an option no single identifiable slip produces.
   - **Figure contradicts its answer** — cell widths misrepresenting a ratio, a brace
     spanning the wrong bar. Luna reads the `[tikz]` source as the diagram.
   - **Implausible scenarios** — arithmetic correct, physics absurd (a 12 km/h swimmer, an
     8 km/h "walk"). Credibility defects still reach students.

   **NOT-A-DEFECT list** (embedded in the brief; each ruling was re-litigated across
   batches until written down):
   - A quiz item sharing a **structural type** with a practice card but using different
     numbers and a different answer is **required coverage** (Quiz-independence rule),
     not duplication.
   - A small integer coinciding with an **unrelated** item's answer is not leakage — the
     hygiene audit already flags the same-structure case.
   - Booklet-anchored content is **in scope** even when it sits near a stage boundary.
   - Anything listed in the skill card's **`prereqs` is taught and assumable** — batch 9's
     round 3 flagged a legitimate zero-index use as "untaught" when zero-index was the
     skill's direct prereq. The packet carries the prereqs precisely so this cannot recur.

   **Coverage is verified mechanically** (`--compare` checks `itemsAnswered` against
   `itemsReceived` — batch 8's silently-omitted skill can no longer hide), so a zero-flag
   skill whose answers all match **is a clean result. Do not fish for flags** — batch 9's
   round 3 produced 20 flags of which the orchestrator rejected the majority; invalid
   flags cost real repair rounds.

   **Re-solve depth** (`--resolve-mode`, default `figures-first`): full written re-solve
   only for items carrying a `[tikz]` figure — the figure-vs-answer check genuinely needs
   the item worked. Symbolic items get a verification pass against the defect list plus a
   stated answer choice, without full working. **`figures-first` is the adopted default**
   (exercised batches 10–16 with zero answer mismatches; the planned A/B against `full`
   is retired). `--resolve-mode full` remains available for one-off deep checks. If a luna run fails outright after retry, fall
   back to the old same-model Claude checker for that batch and **record the fallback in
   the queue notes** — never silently skip the check.
5. **Adjudicate.** The orchestrator runs `run-luna-check.mjs --compare` and reads the
   mismatch/coverage/flag report. For each answer disagreement, decide whether it is a
   **formatting equivalence** (e.g. `3.5` vs `3.50`, `1/2` vs `0.5`, reordered but equal)
   — accept — or a **genuine mismatch**. For each flag, rule valid or invalid against the
   NOT-A-DEFECT list.
   **Repair is targeted, not wholesale:** the orchestrator (or a small fix agent)
   hand-edits the specific defective question(s), re-runs the **full deterministic gate**
   (step 3 — seconds, every edit), then re-checks **only what changed**:
   `node scripts/blind-for-check.mjs <id> --items <changed ids>` emits a bundle of just
   the edited items plus sibling context (stems + option texts of the unchanged items,
   enough to judge duplication and cross-item leakage), and a fresh luna call checks it.
   Never re-send the full batch for a handful of edits — batch 9's rounds 2–3 re-solved
   **191 items to evaluate 27 edits**. Full skill regeneration is reserved for output that
   is structurally unusable — a rewrite of all items reintroduces new defects.
   **Repair contract:** any repair that replaces an option value must state, in its
   report, the **misconception → derivation → value** chain for the new option — the
   specific slip a student makes on *this* stem and the working that lands on exactly
   that value. The orchestrator rejects a replacement without a derivation: a batch-9
   repair swapped an unreachable distractor for another unreachable one and it survived
   to the final report.
   **Two stopping rules**, whichever bites first:
   - **Max 2 repair rounds per skill**, then **flag for human review** rather than loop.
   - **Majority-invalid round:** if more than half of a check round's flags are
     adjudicated invalid, stop repairing the batch — apply the accepted fixes, record
     the remainder in `docs/content-queue.md` for the human, and do not spawn another
     round. Batch 9's round 3 (20 flags, majority rejected) is the measured case: past
     that point the check is generating adjudication work, not finding defects.
   (The old closing cross-skill stem scan is retired — `audit-duplicate-stems.mjs` in the
   step-3 gate now does it deterministically, batch-wide, on every run.)
6. **Validate the batch.** `node scripts/validate.mjs --only <id1,id2,...>` clean (one
   comma-joined argument).
7. **Diagram list for manual human visual review — REQUIRED for any batch containing
   TikZ** (skip only for a purely symbolic batch like algebra with zero inline TikZ blocks).
   The source-reading blind check in steps 3–4 verifies **answers**; it is blind to the
   **rendered picture** (colliding/merged labels, a line that doesn't reach its
   intersection, a stray arrowhead, a parallel-mark on the transversal, an angle drawn in
   the wrong region). The **automated headless-Chrome vision gate has been retired as too
   costly** — the human closes this gap by eye instead:
   - The orchestrator does **not** run `shoot-tikz.mjs` or `build-vision-gate.mjs`.
   - Instead, assemble the **list of every skill in the batch carrying an inline `[tikz]`
     block** (in `question_text` or `solution_text`, content or quiz) and hand it to the
     human as a required visual-review checklist — the batch is not committed until the
     human has eyeballed each rendered diagram against its question + answer.
   - **Repair any diagram the human flags by re-instantiating the correct construction from
     the [canonical prompt](tikz-prompt.md)** — do not hand-nudge coordinates.
   - `scripts/shoot-tikz.mjs` (needs `npm run dev`) remains available as an **optional**
     local aid to preview renders; it is no longer a required pipeline step. **Side effect
     to expect:** `npm run dev` has a `predev` hook that rewrites
     `public/content-manifest.json`, so using this aid dirties a tracked file mid-batch.
     Step 8's `npm run manifest` settles it — do not hand-revert the file.
8. **Rebuild the manifest.** `npm run manifest` (writes `public/content-manifest.json`).
9. **Human-review samples.** Pick **2–3** skills for the human to eyeball, and **always
   include** every `anchor: none` skill, every checker-triggered regenerated skill, and (for
   TikZ batches) the full list of skills carrying diagrams, for manual visual review, in the
   sample set.
10. **Update the queue.** Record per-batch status, the review-sample ids, any `anchor: none`
   gaps, and the list of diagram skills flagged for manual visual review in
   `docs/content-queue.md`. Do **not** commit — leave that to the human.

---

## Wave 3 — agy provenance

From Wave 3 (Stage 6 Y11) the generator is **Gemini via the `agy` CLI**, not Claude:

- Generation, repairs, diagram redraws, and both diagram-audit tiers run on Gemini through
  `scripts/agy/` drivers (`build-gen-tasks` → `run-gen` → `collect-gen`;
  `build-repair-tasks` → `apply-repairs`). **The model is `gemini-3.7-flash-high` for every
  lane — owner decision 2026-08-26, no pro tier.** The planned flash-vs-pro A/B is cancelled.
  Tier-2 diagram audit gets its extra rigour from a source-inclusive packet and a re-derive
  rubric, not from a bigger model; the safety net for flash is luna plus the diagram lane.
- The blind checker stays `gpt-5.6-luna` via `run-luna-check.mjs` (different model family
  from the generator, so independence holds).
- Claude is the ORCHESTRATOR ONLY: runs scripts, adjudicates luna + diagram flags, edits
  docs/queue. Claude never authors content and never spawns a subagent just to run a command.
- Step 7's manual every-block figure review is replaced by the **diagram audit lane**
  (`scripts/diagram-audit/`): render (`shoot-tikz`, dev server required) → sibling
  layout lint → agy vision Tier-1 triage (packets of 8–10 items with PNGs) → Tier-2
  re-derive on flags (tikz source included, pro model) → agy redraw (≤2 rounds) →
  `report.mjs` human checklist = confirmed/repaired blocks + compile failures + suspicious
  not_applicables + a seeded 10% sample. Humans review flags + sample, not every block.

### agy quirks (encoded in `scripts/agy/lib/agy-run.mjs` — do not relearn these)

- Binary `%LOCALAPPDATA%gyingy.exe` (override `AGY_PATH`); flags `-p <pointer>
  --model <id> --output-format json --disable-slash-commands --dangerously-skip-permissions
  --print-timeout 6m`; run via `node scripts/agy/...` (a raw agy call is blocked by the
  session permission classifier).
- Argv cap ~32,767 chars → the prompt is a ~300-char pointer; the real task is
  `task-NNN.md` on disk, read by the model from its cwd.
- Writes must land in cwd: an `--add-dir` write hits disk but agy misreports
  `status:"ERROR"` — the driver trusts the RESULT FILE's existence + shape, never the
  status field, and never stdout alone.
- Result files may arrive BOM-prefixed and/or code-fenced; the parser strips both.
- Every task has a `task-NNN.ids.json`; the result must cover exactly those ids or the
  task FAILED (never a partial).
- Consecutive no-file errors = Google OAuth expiry → the pool halts with a re-auth
  message; resume = rerun (valid result files are skipped).
- Per-call overhead is large (~211k input tokens measured) → pack work: whole section per
  generation call, 8–10 rows per audit packet, 6 blocks per redraw task, concurrency 3.
- Token ledger: `ledger.jsonl` appended per call in each tasks dir.

## Hard constraints (recap)

- **Schema-exact.** [content-schema.md](content-schema.md) is the contract; validate clean.
- **Single skill per file.** Prereqs only in service; no cross-topic mixing.
- **Every distractor is a named misconception** with a specific `why`.
- **Quiz stems never duplicate practice stems** (any tier) — the deterministic gate
  (step 3) is a hard gate, cleared by generators before they report.
- **The blind check runs on luna via `codex exec` — never the codex MCP.** Checkers
  never see keys, `why`, or `solution_text`; every call is fresh.
- **Diagrams follow the [canonical TikZ prompt](tikz-prompt.md)**; degrees are `^{\circ}`.
- **Question-side support figures are standard** on foundation + development cards of any
  skill a figure genuinely helps — never pre-marking the answer.
- **TikZ batches list every diagram skill for manual human visual review** before commit.
- **Byte-for-byte theory** for lower-stage skills with a theory-only content file
  (STAGE 3 rule); **skip** any skill already fully generated in an earlier wave **only
  when its files exist AND its gate is clean** — a dirty skip is a repair item, not a
  skip (ALREADY-COMPLETE rule).
- **Unscoped `audit-duplicate-stems.mjs --strict` once per wave** — the batch gate is
  `--only`-scoped and cannot see accumulated debt.
- **One batch per session**; statuses updated by the orchestrator; do not commit.
