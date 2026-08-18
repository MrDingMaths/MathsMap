# Content and quiz schema

This is the source of truth for `public/content/{skillId}.json` and
`public/quizzes/{skillId}.json`. The validator, renderer, admin editors and generation
workflow must agree with this document. Unknown keys are errors.

## Shared rich-text format

`question_text` and `solution_text` are single UTF-8 strings, following the same convention
as MathsBase.

- Inline maths uses `$...$` and is rendered with KaTeX. Display maths is not supported.
- Bold uses `**...**`. Other Markdown is not supported.
- Preserve working as one line per step; newline characters are rendered as line breaks.
- Mathematical tables use a KaTeX `array` inside `$...$`, with corresponding values in the
  same columns.
- Write a literal dollar as `\$`.
- Every LaTeX backslash must be JSON-escaped: `\\frac`, `\\times`, `\\begin`, and so on.

### Inline TikZ

Place a diagram exactly where it belongs in either text field:

```text
[tikz]
\begin{tikzpicture}
  ...
\end{tikzpicture}
[/tikz]
```

Tags must be balanced, blocks must be non-empty, and every block must contain exactly one
TikZ picture body. Do not add a document preamble or `\usepackage`. The allowlist and visual
construction rules live in [tikz-prompt.md](tikz-prompt.md).

**A figure renders in `question_text` and `solution_text` ONLY — never inside a quiz
option's `text` or `why`.** Those two fields go through `Math.svelte`, which is KaTeX-only
(`QuizQuestion.svelte` renders the stem and solution with `InlineContent`, but each option
with `MathText`), so a `[tikz]` block placed in an option renders as literal `[tikz]…`
source. When an MCQ genuinely needs picture-valued options — "which of these is the top
view?" — draw the candidates as a **labelled A/B/C/D panel inside the stem's figure** and
make the options the labels (`$A$`, `$B$`, …). Batch 13's `views-of-prisms` is the worked
example of this shape.

## Content file

```text
{ skillId, atomType, theory, practice? }
```

- `skillId`: filename stem and an id from `data/skills.json`.
- `atomType`: `R`, `T`, `Cat`, `Com`, or `F`.
- `theory`: `{ intro: string, facts: string[], steps?: string[] }`.
- `practice`: optional `{ foundation, development, mastery? | masteryOmitted, coverageNote? }`.

Foundation and development may run to **10–12** cards; mastery targets **3–4** when present.
These are **ceilings earned by variety, not quotas** — a skill whose meaningful cases run out
at 6 or 7 correctly stops there. The validator hard-errors only below a safety floor (3 for
foundation/development, 2 for mastery) and *warns* below **6 / 6 / 3**; those warn thresholds
stay where they are and must not be raised to match the ceiling, so an honestly-narrow tier
passes silently. Every distinct question structure must be represented in the overall practice
set. Extra cards buy **variety** (distinct structural types, then meaningful cases — sign,
regime, boundary, representation), **≤2 items per structural type × case**, never
near-duplicate padding.

`coverageNote` (optional non-empty string): a one-line reason recorded by a genuinely narrow
atom that ceilings out below target without padding. Its presence suppresses the below-target
tier warns for that file (same escape-hatch pattern as `masteryOmitted`). The quiz file carries
its own top-level `coverageNote` to suppress the quiz below-target warn.

### Practice card

```json
{
  "question_text": "Round $3.47$ to one decimal place.",
  "structure": "round-to-tenths",
  "solution_text": "$3.\\underline{4}7$\n$=3.5$"
}
```

These are the only allowed card keys. `question_text` and `solution_text` are required and
non-empty. There is no separate answer, solution array, or diagram field.

`structure` is a kebab-case archetype slug — the **structural type** from the variety model
below — drawn from the **same per-skill vocabulary as the quiz file's `structure`**. A card's
slug names the procedure/shape it drills; cards that differ only by *case* (sign, regime,
boundary, representation) share one slug. It is currently optional (validator warns when
absent, pending a full backfill of existing content) but every newly authored card must carry
it, and the validator warns when a skill's practice `structure` set and its quiz `structure`
set don't cover each other (see the quiz-mirrors-practice rule below).

Worked solutions follow the booklet house style:

- **Align the working on `=`.** The opening line is the bare expression (no `=`); each later
  line begins `=`, so the equals signs stack. Keep pedagogically useful intermediate lines.
- **The final line states the answer** — the last `=` line, or a short answer sentence for
  word/justify questions. **Do not add a line that merely restates the answer.**
- **Step headers are optional and used only at genuine stage boundaries.** A header is a
  standalone line `N. **Step name**` (the number sits *outside* the bold) placed before that
  stage's working — as the booklets number the factorise stage then the solve stage. Simple
  single-stage routines carry no headers.

When `theory.steps` exists:

- any step header must name a `theory.steps` entry after case and terminal-punctuation
  normalization, and headers occur in theory order (steps may be skipped);
- headers are **not** required — a single-stage solution has none;
- never label every working line; fine-grained steps within one line stay unlabelled.

Categorical skills that hinge on a genuine decision procedure state it in `theory.steps`; a
solution cannot cite an unstated method. **Recognition/conceptual skills with no genuine
procedure omit `theory.steps` — do not force one** (see the worked-example principles).

## Quiz file

```text
{ skillId, questions: Question[], coverageNote? }
```

Quizzes may run to **8–10** authored questions (hard floor 3), with at least one question per
distinct `structure`; items beyond one per structure must each earn their place on a distinct
*case*, not a re-run of a covered type. As with the practice tiers this is a variety-earned
ceiling, not a quota — the below-target warn stays at 6. A narrow atom below target records an
optional top-level `coverageNote` string to suppress its below-target warn. Imported banks may grow beyond the
normal authoring target to improve diagnostic variety, but **20 total questions per skill is a
hard ceiling**, including all existing and imported questions. Prefer distinct structures and
meaningful cases over near-duplicate volume.

```json
{
  "id": "q1",
  "question_text": "Round $3.47$ to one decimal place.",
  "structure": "round-to-tenths",
  "mastery": false,
  "options": [
    { "text": "$3.5$", "correct": true },
    { "text": "$3.4$", "why": "Truncated instead of checking the next digit." },
    { "text": "$4.0$", "why": "Rounded to a whole number rather than one decimal place." }
  ],
  "solution_text": "$3.\\underline{4}7$\n$=3.5$"
}
```

Question keys are exactly `id`, `question_text`, `structure`, `mastery`, `options`, and
`solution_text`. Both text fields follow the shared rich-text and worked-solution rules.

Each quiz has 3-5 homogeneous options and exactly one `{ text, correct: true }`. Every other
option is `{ text, why }`, where `why` is at least 15 characters and names the specific error
that produces the distractor. The app shuffles options, so wording must not depend on order.

A public quiz is publishable only when `public/content/{skillId}.json` exists. The validator
treats an orphan quiz as an error, and manifest generation omits it defensively. Source,
licence, capture, mapping, and review metadata belong in the separate provenance ledger, never
as additional keys in the schema-exact production question object.

## Content manifest

`public/content-manifest.json` is generated by `npm run manifest`. Content entries store tier
counts; quiz entries store `[questionCount, masteryTaggedCount]`. Orphan quizzes are skipped
with a warning. Do not edit it by hand.
