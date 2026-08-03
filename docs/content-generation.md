# Content-generation session prompt

The session prompt for a **per-topic batch** that mass-generates teaching content
(`public/content/{id}.json`) and quizzes (`public/quizzes/{id}.json`) for every skill in
one Stage-4 topic, using a multi-agent workflow (one generation agent per booklet section,
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
   fixed-template, and rendered-verification workflow. **Figure-free sections skip it
   entirely:** the orchestrator's spawn prompt states whether the section is
   figure-bearing; an agent whose section carries no `[tikz]` must **not** open
   `tikz-prompt.md` at all — it is ~65% of the shared doc bundle and reading it "just in
   case" was the single largest duplicated cost in batch 9 (~150k tokens of re-read docs
   across three generators).
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
7. **The mapped booklet section(s)** from `docs/content-queue.md` (files under
   `booklets/Stage 4/`) — the worked examples **and** the practice questions. Worked
   examples alone do not show the routine's full range.
8. **The booklet's diagram PNGs** — booklet image links resolve to PNGs under
   `booklets/Stage 4/media/<booklet-stem>/`. For any geometry/measurement/data figure —
   3D solids, labelled triangles, graphs, plots, distance–time graphs, or wherever alt
   text is thin — **`Read` the PNG directly** as the design reference before authoring a
   inline `[tikz]...[/tikz]` diagram.
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
   quiz `structure` slug (kebab-case) and a practice backbone card. **Enumerate these first.**
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
per-type cap exists to prevent.

Coverage over volume: one clean item per meaningful case beats many near-duplicates.

---

## Quiz-independence rule

**A quiz item must never restate a practice stem from the same skill — any tier,
byte-for-byte or lightly reworded.** The practice cards are the flip-cards the student has
just studied; a quiz item that repeats one tests recall of the card, not the skill. The
quiz mirrors each practice **structural TYPE** with **fresh numbers and a fresh scenario**,
and — wherever the maths allows — lands on a **different answer value** than the practice
card of the same type.

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
  category/tick label). **Fit the plot to its labels:** `scale ≥ 0.85`; y-label at `x≈-2.0`
  when ticks are wide (`%`/≥3-digit); long category words (≥6 letters) use `font=\tiny`;
  titles ≤ ~22 chars and never extending left of `x=0`. Across sibling skills **never reuse a scenario**, vary the
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
2. **Generate — one agent per booklet SECTION (not per skill), sections run in parallel.**
   This is the leaner default: a section-owning agent takes that section's 2–4 skills,
   reads the shared authoring docs (schema, `tikz-prompt.md`, principle docs, the booklet
   section + its media PNGs) **once**, then authors each of its skills — dealing the shared
   exemplars disjointly across them (step 1). It writes both files per skill and then
   **clears the full deterministic gate (step 3) on its own skills before reporting** —
   all four commands, `--strict`, comma-form `--only`. An agent does not report success
   with a dirty gate. This cuts the duplicated
   doc-reading that one-agent-per-skill pays N times, and one author-per-section improves
   disjoint dealing. (Fall back to one agent per skill only when a section's skills are too
   many or too heavy for a single agent.) **Model tier:** agents for
   geometry/measurement/data skills (PNG reading + TikZ authoring) must not run on a
   downgraded model — image misreading rates on smaller tiers are unacceptable for
   diagram-anchored content.
3. **Deterministic gate — run it BEFORE any checker is spawned.** Every defect a script
   can find must be found by a script, and found before a model is paid to read the
   items. Four commands, always the comma-form `--only`, always `--strict`; the gate is
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

   - **`audit-duplicate-stems.mjs`** — normalised-stem duplication, `[tikz]` blocks
     included so figure-identical clones are caught: quiz stem == practice stem in the
     same skill (any tier — batch 9's 21-clone class), two equal stems in one file,
     equal stems across the batch's skills, plus an advisory near-duplicate report.
     It deliberately has **no minimum stem length** — an early ad-hoc scan with one hid
     a five-clone cluster in a single quiz (`order-operations-indices`, batch 9).
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
   stated answer choice, without full working. `--resolve-mode full` reproduces the old
   behaviour; batch 10 A/Bs the two modes (compare defect yield and wall-clock) before
   `figures-first` is adopted outright. If a luna run fails outright after retry, fall
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
     local aid to preview renders; it is no longer a required pipeline step.
8. **Rebuild the manifest.** `npm run manifest` (writes `public/content-manifest.json`).
9. **Human-review samples.** Pick **2–3** skills for the human to eyeball, and **always
   include** every `anchor: none` skill, every checker-triggered regenerated skill, and (for
   TikZ batches) the full list of skills carrying diagrams, for manual visual review, in the
   sample set.
10. **Update the queue.** Record per-batch status, the review-sample ids, any `anchor: none`
   gaps, and the list of diagram skills flagged for manual visual review in
   `docs/content-queue.md`. Do **not** commit — leave that to the human.

---

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
- **Byte-for-byte theory** for stage-3 skills that already have a content file.
- **One batch per session**; statuses updated by the orchestrator; do not commit.
