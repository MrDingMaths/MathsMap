# Content & quiz schema (source of truth)

The canonical spec for the two per-skill JSON files a skill can carry:

| File | Purpose | Renders in |
|------|---------|-----------|
| `public/content/{skillId}.json` | Theory block + tiered practice cards | `SkillDetail.svelte` (Theory + Practice) |
| `public/quizzes/{skillId}.json` | Multiple-choice check-for-understanding | quiz view |

The validator, the admin editors (`TheoryEditor`, `PracticeEditor`, `PracticeCardEditor`),
the renderer, and the LLM generation prompts all cite **this** document. If a rule here
disagrees with any of them, this document wins and the other should be fixed.

> **Path note:** content files currently live in `data/content/` and are moving to
> `public/content/` in a parallel refactor; quizzes land in `public/quizzes/`. Use the
> `public/…` paths above. Both files are **optional** — a skill with neither falls back to
> the "coming soon" placeholder.

This is a *schema* doc. For *authoring* judgement — how to choose an example, how to phrase
notes, how to sequence — cite the principles docs rather than duplicating them:
[worked-example-principles.md](worked-example-principles.md),
[guided-practice-principles.md](guided-practice-principles.md),
[atomisation-teaching.md](atomisation-teaching.md).

---

## Shared text rules (both files)

Every human-visible string field (`intro`, `facts[]`, `steps[]`, `q`, `a`, `note`,
`text`, `why`, `math`) obeys the same rules, enforced by `Math.svelte`:

| Rule | Detail |
|------|--------|
| Maths | KaTeX inline, delimited `$…$`. Display mode is **not** used. |
| Bold | Markdown `**bold**` only. No other markdown (no italics, headings, lists). |
| Literal dollar | Write a currency/literal `$` as `\$` (e.g. `\$4.50`). |
| Notation house style | Follow `CLAUDE.md` maths conventions (superscripts, `x/3`, `log\_5`, subscripts `S\_n`, `θ`, `°`, `π`, etc.). |

`Math.svelte` splits on unescaped `$`, KaTeX-renders the odd runs (`throwOnError:false`),
escapes the prose, and applies `**bold**` last — so bold may wrap a maths run
(`**divide by $4$**`). A malformed `$…$` run degrades to literal text rather than throwing.

---

# Content file — `public/content/{skillId}.json`

## Top-level shape

```
{ skillId, atomType, theory, practice? }
```

| Key | Type | Required | Rule |
|-----|------|----------|------|
| `skillId` | string | ✅ | Must equal the filename stem **and** exist as an `id` in `data/skills.json`. |
| `atomType` | string | ✅ | The skill's atom type. Existing values: `R` routine, `T` transformation, `Cat` category, `Com` comparative, `F` fact (see [atomisation-teaching.md](atomisation-teaching.md)). |
| `theory` | object | ✅ | See below. |
| `practice` | object | optional | See below. Absent = theory-only skill. |

**Unknown top-level (or nested) keys are a validation ERROR**, with two reserved
exceptions: **`iDo`** and **`weDo`**. These are reserved for a future guided-teaching pass
(worked example + step-by-step We Do) and are **not yet specified** — a validator must
*allow* them to be present without erroring, but must not assume any shape. Do not author
them until this doc specifies them.

## `theory` (object, required)

| Key | Type | Required | Rule |
|-----|------|----------|------|
| `intro` | string | ✅ | One or two sentences stating what the skill is / the key idea. |
| `facts` | string[] | ✅ | The rules/definitions/formulas the learner returns to. May be empty `[]` but the key must be present. |
| `steps` | string[] | optional | The numbered **procedure**, one line per step. **Omit for non-procedural atoms** (`F`, `Cat`, `Com` that have no procedure). |

`steps` are the source of the ≤ 3-word line-note labels used in practice solutions — keep
each step a terse imperative ("Underline the place", "Check the next digit"), never prose.
See [worked-example-principles.md](worked-example-principles.md) ("A short theory block first").

## `practice` (object, optional)

When present, it holds up to three **tiers**, each an array of `Card`s:

| Tier | Required | Min cards | Cognitive level |
|------|----------|-----------|-----------------|
| `foundation` | ✅ (when `practice` present) | 4 | Routine **single-step** recognition/application of the atom. |
| `development` | ✅ | 4 | Standard **multi-step routine** — the full skill at typical difficulty. |
| `mastery` | optional | 2 (when present) | A **harder twist or combination *within the same skill*** — boundary cases, reverse direction, a non-obvious surface. Never a new skill. |
| `masteryOmitted` | string, required **iff** `mastery` absent | — | One-line reason the generator omitted mastery (e.g. `"Atom is single-step; no in-skill twist exists."`). |

The three tiers map to the mastery ladder deliberately: **foundation → proficient dot,
development → learning dot, mastery → mastered dot** in the UI. The escalation
(single-step → multi-step routine → in-skill twist) mirrors the
worked-example → We Do → independent-practice sequence in
[guided-practice-principles.md](guided-practice-principles.md): a "What If / Reset /
Extension" spread lives *inside* development/mastery, but an Extension here must still be
**the same underlying skill** — twists that require an untaught skill belong to a different
skill's content, not here.

### `Card`

| Key | Type | Required | Rule |
|-----|------|----------|------|
| `q` | string | ✅ | The question prompt. |
| `a` | string | ✅ | The **final answer**, always present, even when `solution` is given (it is the flip-card fallback and the answer of record). |
| `solution` | `{math, note?}[]` | optional | Worked steps, shown on the card back. |
| `tikz` | string | optional | Diagram on the card **front**. Must contain `\begin{tikzpicture}`. |
| `tikzSolution` | string | optional | Diagram on the card **back** (a fuller/annotated figure). Falls back to `tikz` if absent. |

**`solution[].math`** — each working line is an equation step. Lines that continue the
working **must start `$= …$`** (`"$= 4.7$"`): the renderer's `splitEq` peels the leading
`=` so every step aligns on the equals sign, with the opening bare-expression line offset
beneath. The first line may be a bare expression with no `=`.

**`solution[].note`** — a ≤ 3-word step-name label drawn from `theory.steps`
(e.g. "Round up"), never a sentence. The opening bare line carries no note. See
[worked-example-principles.md](worked-example-principles.md) ("Presenting it").

### Question-count principle

The tier minimums (4 / 4 / 2) are a **floor, not a target**. On top of them: **include at
least one question per distinct structural question type of the skill.** Enumerate the
structural types *first*, then guarantee coverage. Example for *round a decimal to a given
place*: (a) round to tenths, (b) round to hundredths, (c) a **carry/boundary** case where
rounding up ripples (`3.98 → 4.0`), (d) a "which listed value is nearest" recognition item.
Four structural types ⇒ at least four cards even before hitting a tier's minimum.

### Scope principle

Every question exercises **this single skill only**. A direct prerequisite may appear **only
in service of** the skill (e.g. comparing two digits while rounding), never as the thing
being tested. If a card can't be answered without an *untaught* skill, it is out of scope —
move it, or atomise further. (See [atomisation-teaching.md](atomisation-teaching.md), scope
note.)

## TikZ allowlist (`tikz` / `tikzSolution`)

Diagrams render through **TikZJax** (`src/lib/tikz.js`), a WASM TeX that is **not** full
LaTeX. Author to this subset and follow the complete semantic construction and rendered
verification workflow in the canonical [`tikz-prompt.md`](tikz-prompt.md):

**Required**
- Must contain `\begin{tikzpicture}` … `\end{tikzpicture}`. No surrounding `\documentclass`
  / `\begin{document}` — TikZJax wraps the body itself.

**Preloaded TikZ libraries** (already `\usetikzlibrary`'d — use freely, do not re-declare):
`arrows`, `arrows.meta`, `patterns`, `calc`, `angles`, `quotes`,
`decorations.pathreplacing`, `decorations.markings`, `decorations.pathmorphing`,
`positioning`, `intersections`, `shadings`.

**Auto-detected packages** (loaded automatically when the source matches — no action
needed): `pgfplots` (on `\begin{axis}`/`\addplot`/`\pgfplots`), `tikz-3dplot` (on
`\tdplot…`), `amsmath` (on `\frac{`, `\dfrac`, `\tfrac`, `\text{`, `\operatorname`,
`\mathbb`, `\bm{`, `\underset`, `\overset`), `amssymb` (on `\mathbb`, `\varnothing`,
`\therefore`, `\square`, `\blacksquare`, `\triangle`, `\angle`).

**Forbidden / stripped**
- **No `\usepackage`** for font/encoding: `fontenc`, `inputenc`, `babel`, `lmodern`,
  `fontawesome`, `luatex85` are silently dropped (only Computer Modern fonts are bundled).
  Other `\usepackage` lines are technically passed through as preamble but should be avoided
  — prefer the preloaded libraries above.
- **No external images, fonts, or `\includegraphics`.**
- `\fontsize{N}{M}` is snapped to the nearest bundled CM design size
  (`5, 6, 7, 8, 9, 10, 12, 17`) — off-list sizes stall the worker, so pick from that set.

Keep diagrams small and deterministic; a diagram that fails to compile shows a
"⚠ Diagram failed to render" placeholder.

## Complete content example

`public/content/round-decimals-given-place.json` — a routine (`R`) atom, decimals:

```json
{
  "skillId": "round-decimals-given-place",
  "atomType": "R",
  "theory": {
    "intro": "Rounding a decimal replaces it with the nearest value that stops at a chosen place — the nearest tenth, hundredth, and so on.",
    "facts": [
      "The **rounding digit** is the digit in the place you are rounding to.",
      "Look at the **next digit to its right**: $5$ or more rounds **up**, $4$ or less stays.",
      "Drop every digit after the rounding place."
    ],
    "steps": [
      "Underline the rounding place.",
      "Check the next digit.",
      "Round up or stay.",
      "Drop the rest."
    ]
  },
  "practice": {
    "foundation": [
      {
        "q": "Round $3.47$ to one decimal place.",
        "a": "$3.5$",
        "solution": [
          { "math": "$3.\\underline{4}7$" },
          { "math": "$= 3.5$", "note": "Round up" }
        ]
      },
      {
        "q": "Round $8.62$ to one decimal place.",
        "a": "$8.6$",
        "solution": [
          { "math": "$8.\\underline{6}2$" },
          { "math": "$= 8.6$", "note": "Stay" }
        ]
      },
      {
        "q": "Round $5.13$ to one decimal place.",
        "a": "$5.1$",
        "solution": [
          { "math": "$5.\\underline{1}3$" },
          { "math": "$= 5.1$", "note": "Stay" }
        ]
      },
      {
        "q": "Round $2.95$ to one decimal place.",
        "a": "$3.0$",
        "solution": [
          { "math": "$2.\\underline{9}5$" },
          { "math": "$= 3.0$", "note": "Carry" }
        ]
      }
    ],
    "development": [
      {
        "q": "Round $6.348$ to two decimal places.",
        "a": "$6.35$",
        "solution": [
          { "math": "$6.3\\underline{4}8$" },
          { "math": "$= 6.35$", "note": "Round up" }
        ]
      },
      {
        "q": "Round $0.9042$ to two decimal places.",
        "a": "$0.90$",
        "solution": [
          { "math": "$0.9\\underline{0}42$" },
          { "math": "$= 0.90$", "note": "Stay" }
        ]
      },
      {
        "q": "Round $12.897$ to two decimal places.",
        "a": "$12.90$",
        "solution": [
          { "math": "$12.8\\underline{9}7$" },
          { "math": "$= 12.90$", "note": "Carry" }
        ]
      },
      {
        "q": "Round $4.5051$ to two decimal places.",
        "a": "$4.51$",
        "solution": [
          { "math": "$4.5\\underline{0}51$" },
          { "math": "$= 4.51$", "note": "Round up" }
        ]
      }
    ],
    "mastery": [
      {
        "q": "Round $9.996$ to two decimal places.",
        "a": "$10.00$",
        "solution": [
          { "math": "$9.9\\underline{9}6$" },
          { "math": "$= 10.00$", "note": "Carry all" }
        ]
      },
      {
        "q": "A number rounds to $4.3$ (one decimal place). What is the **smallest** value it could have been?",
        "a": "$4.25$",
        "solution": [
          { "math": "$4.3 \\pm 0.05$" },
          { "math": "$= 4.25$", "note": "Lower bound" }
        ]
      }
    ]
  }
}
```

---

# Quiz file — `public/quizzes/{skillId}.json`

## Shape

```
{ skillId, questions: [ { id, q, tikz?, structure, mastery, options, solution? } ] }
```

| Key | Type | Required | Rule |
|-----|------|----------|------|
| `skillId` | string | ✅ | Same rule as content: equals filename stem, exists in `data/skills.json`. |
| `questions` | Question[] | ✅ | **≥ 3** questions, with **at least one per distinct `structure` slug**. |

### Question

| Key | Type | Required | Rule |
|-----|------|----------|------|
| `id` | string | ✅ | Unique **within the file**: `q1`, `q2`, … |
| `q` | string | ✅ | The stem (shared text rules apply). |
| `tikz` | string | optional | A figure for the stem; same TikZ allowlist as content. |
| `structure` | string | ✅ | **kebab-case slug** naming the structural question type (e.g. `round-to-tenths`, `carry-boundary`). Groups questions by the same structural family. |
| `mastery` | boolean | ✅ | `true` if this is a mastery-level (harder twist) question. **≥ 1 recommended** when the skill's content has a `mastery` tier. |
| `options` | Option[] | ✅ | **3–5** options. Exactly **one** correct. See below. |
| `solution` | `{math, note?}[]` | optional | Worked steps shown on reveal; same format/alignment rules as content `solution`. |

### Option

Two forms, discriminated by which key is present:

```
{ "text": "…", "correct": true }        // the one correct option — no `why`
{ "text": "…", "why": "…" }             // an incorrect option — `why` required
```

| Rule | Detail |
|------|--------|
| Exactly one correct | Precisely one option has `correct: true`; it carries **no** `why`. |
| Every distractor explains itself | Every incorrect option **must** have a non-empty `why` naming the **specific misconception or error** that produces it (**≥ 15 chars**, specific — not "wrong" / "close"). |
| Canonical order | Option order in the file is canonical/authoring order; **the app shuffles at render**, so never rely on position (no "the third option"). |

`why` is the pedagogical payload: it must name the *named error* — a sign slip, an operation
swap, a place-value shift, a specific formula misuse — so the misconception can be surfaced
and tracked. A throwaway distractor with a vague `why` is a validation-worthy defect.

## MCQ design principles

- **Distractors come from real misconceptions**, specific to *this* skill: sign errors,
  operation confusion, place-value slips, off-by-one on the rounding digit, formula misuse.
  Each distractor should be the answer a learner *actually gets* by making one identifiable
  mistake — and `why` states that mistake.
- **Plausible and homogeneous.** All options share form, length, and precision with the
  correct one (all decimals to the same places, all in the same units). Don't let the
  correct answer stand out by being longer, more precise, or more hedged.
- **No meta options.** Never "all of the above" / "none of the above".
- **Sort numerics by plausibility, not size.** Ordering options by magnitude can give the
  answer away; order so the correct value isn't trivially the largest/middle/smallest.
- **Coverage over volume.** Prefer one clean question per `structure` slug to many
  near-duplicates.

## Complete quiz example

`public/quizzes/round-decimals-given-place.json`:

```json
{
  "skillId": "round-decimals-given-place",
  "questions": [
    {
      "id": "q1",
      "q": "Round $3.47$ to one decimal place.",
      "structure": "round-to-tenths",
      "mastery": false,
      "options": [
        { "text": "$3.5$", "correct": true },
        { "text": "$3.4$", "why": "Truncated instead of rounding — kept the digit and dropped the rest." },
        { "text": "$3.47$", "why": "Left the number unchanged; did not round to one decimal place." },
        { "text": "$4.0$", "why": "Rounded to the nearest whole number, not to one decimal place." }
      ],
      "solution": [
        { "math": "$3.\\underline{4}7$" },
        { "math": "$= 3.5$", "note": "Round up" }
      ]
    },
    {
      "id": "q2",
      "q": "Round $6.348$ to two decimal places.",
      "structure": "round-to-hundredths",
      "mastery": false,
      "options": [
        { "text": "$6.35$", "correct": true },
        { "text": "$6.34$", "why": "Truncated at the hundredths place instead of rounding up." },
        { "text": "$6.3$", "why": "Rounded to one decimal place, not two." },
        { "text": "$6.348$", "why": "Did not round — left all three decimal places." }
      ]
    },
    {
      "id": "q3",
      "q": "Round $2.95$ to one decimal place.",
      "structure": "carry-boundary",
      "mastery": false,
      "options": [
        { "text": "$3.0$", "correct": true },
        { "text": "$2.9$", "why": "Rounded the tenths up without carrying the $9$ into the ones." },
        { "text": "$2.10$", "why": "Wrote a place-value slip — carried into the wrong column." },
        { "text": "$3.5$", "why": "Rounded up to the next half instead of the next tenth." }
      ],
      "solution": [
        { "math": "$2.\\underline{9}5$" },
        { "math": "$= 3.0$", "note": "Carry" }
      ]
    },
    {
      "id": "q4",
      "q": "A number rounds to $4.3$ (one decimal place). What is the **smallest** value it could have been?",
      "structure": "reverse-bound",
      "mastery": true,
      "options": [
        { "text": "$4.25$", "correct": true },
        { "text": "$4.30$", "why": "Gave the rounded value itself, not the lower bound of the interval." },
        { "text": "$4.35$", "why": "Gave the upper bound — values from $4.35$ round up to $4.4$." },
        { "text": "$4.24$", "why": "Went one hundredth too low; $4.24$ rounds to $4.2$." }
      ]
    }
  ]
}
```

---

# Supporting artefacts

## Manifest — `public/content-manifest.json`

A single generated index the app fetches once to know which skills have content/quizzes and
how much, without probing for files. Shape:

```json
{
  "generated": "2026-07-17T00:00:00Z",
  "content": {
    "round-decimals-given-place": [4, 4, 2]
  },
  "quiz": {
    "round-decimals-given-place": [4, 1]
  }
}
```

| Field | Meaning |
|-------|---------|
| `generated` | ISO-8601 timestamp of the build that produced the manifest. |
| `content[skillId]` | `[foundationCount, developmentCount, masteryCount]`. A skill with no mastery tier reports `0` in the third slot. |
| `quiz[skillId]` | `[questionCount, masteryTaggedCount]` — total questions, and how many have `mastery: true`. |

A skill absent from a section has no file of that kind.

## Progress record (v2) — for reference

The store today is v1 (`mathsmap.progress.v1`, a flat `{skillId: level}` string map, see
`src/lib/store.js`). The **planned v2** record — which quiz outcomes will write to — lives at
`localStorage` key **`mathsmap.progress.v2`**:

```json
{
  "round-decimals-given-place": {
    "level": "proficient",
    "source": "quiz",
    "at": 1752710400000
  }
}
```

| Field | Type | Values |
|-------|------|--------|
| `level` | string | `"learning"` \| `"proficient"` \| `"mastered"` |
| `source` | string | `"manual"` (learner set it) \| `"quiz"` (earned via a quiz) |
| `at` | number | Epoch milliseconds of the last update. |

Documented here so content/quiz tooling can reason about how a quiz result maps to a mastery
level; the migration itself is out of scope for this schema.
