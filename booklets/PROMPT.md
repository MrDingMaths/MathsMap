# Booklet-atomisation session prompt

## Queue mode (default — no placeholders needed)

Paste just this: **"Run the next atomisation pass — follow booklets/PROMPT.md queue mode."**

The session then:
1. Reads `booklets/QUEUE.md` and takes the **next `pending` topic group** (one
   group per session/review cycle).
2. Reads ALL booklets in the group and produces **one combined proposal** for
   the whole group, following everything below (read-first list, constraints,
   conventions, proposal structure).
3. Pauses for review. After approval + apply + `npm run validate`, updates the
   group's status in `QUEUE.md` (`pending → proposed → applied` or `nil`) and
   stops.

Image rule: booklet image links resolve to PNGs under the stage folder's
`media/<booklet>/` directory. For 3D diagrams, labelled figures, and function
graphs — or wherever alt text looks thin — `Read` the linked PNG directly.

## One-off mode (fallback — fill placeholders)

Atomise booklet `{{BOOKLET_FILENAME}}` into a proposal for new skills / prereq
edges against the skill graph in `data/skills.json`.

Fill in the placeholders before pasting:
- `{{BOOKLET_FILENAME}}` — the booklet's `.md` filename, found inside its
  stage folder under `booklets/` (e.g. `booklets/Stage 4/Fractions Decimals
  Percentages 3_Converting FDP.md`). The proposal document you write uses the
  same bare filename (no stage prefix), inside `booklets/proposals/`.
- `{{TOPIC}}` — the topic id/name (e.g. `t-s4-frc`, MA4-FRC-C-01).
- `{{DOT_POINT_IDS}}` — the target dot point id(s) this booklet covers (e.g.
  `dp-s4-frc-3, dp-s4-frc-4`).

## Read first, in this order

1. `docs/atomisation-principles.md` — the canonical rubric. Follow its
   edge-inclusion bar, scope rules, and de-bundling rules exactly. Do not
   restate or reinvent them here.
2. `data/dotpoints.json` — the target dot points `{{DOT_POINT_IDS}}` (topic
   `{{TOPIC}}`), so you know what the booklet is supposed to cover.
3. `data/skills.json` — the existing graph. Propose only skills/edges that are
   genuinely missing; dedupe hard against what's already there.
4. Every file in `booklets/proposals/` — prior precedents *and* rejections
   (see the rubric's "Check prior decisions" rule). Never re-propose a
   candidate the user has already rejected.
5. The whole booklet (the stage-folder path filled in above) — worked
   examples **and** practice questions. Worked examples alone don't show the
   full range of the routine.

## Hard constraints

- **Booklet-required.** Every new skill/edge must trace to a real worked
  example or practice question in the booklet — cite the section and question.
- **Routine questions only.** No cross-topic prerequisites (per the rubric's
  scope rules).
- **Stay lean.** The user is strongly averse to graph pollution — when in
  doubt, exclude and note it as a borderline candidate.
- **Earliest genuine stage.** A new skill's stage is the earliest stage it is
  actually needed, not the stage of the booklet by default.
- **Nearest dot point.** Attach new skills to the nearest existing dot point,
  and state which one and why.

## Conventions

- Blurbs use KaTeX inline math (`$...$`), matching existing `data/skills.json`
  entries — **not** the equatio-style notation table from the root
  `CLAUDE.md` (that table governs booklet source content, not skill blurbs).
- Ids are kebab-case.
- Difficulty is 1–3, calibrated against neighbouring skills on the same dot
  point.

## Proposal document

Present the proposal **in-chat first** — it is written to
`booklets/proposals/{{BOOKLET_FILENAME}}` only in the apply phase, after
approval. Match the structure of the existing proposals (see
`booklets/proposals/Angle Relationships.md` as the model):

- **Context** — booklet, target dot point(s)/topic, one line on the goal.
- **Finding (headline)** — how densely the topic is already covered and what,
  if anything, is missing.
- **1. Recommended new skills** — for each: a field table (id, title, blurb,
  stage, courses, dotPointIds, difficulty, prereqs, atom type), a ready-to-paste
  JSON object, the booklet trace (section/question citations), and the
  4-part edge-bar justification from the rubric.
- **2. Recommended new prereq edges** — `X ← P` notation, each with its trace
  and 4-part bar justification.
- **3. Edits to existing skills** — blurb re-scopes arising from de-bundling
  (per the rubric's de-bundling rule), with before/after blurb text.
- **4. Borderline candidates → EXCLUDE** — candidates considered and rejected,
  with reasons tied to the rubric's tests.
- **5. Considered-and-omitted** — ambient/elementary/already-covered content,
  briefly noted so a future pass doesn't re-derive it.
- **Net change if approved** — a tally: N new skills, N new edges, N re-scopes.
- A bold **STOP** line at the end.

Then stop for the user's review — write nothing and do not touch
`data/skills.json` until approved.

If the pass recommends **no changes**, still write (after the user confirms) a
short nil-result proposal doc — Context, Finding, Considered-and-omitted, and
"Net change: none" — so future sessions can see the booklet was audited without
re-deriving the pass.

## Apply phase (only after the user approves — do not do this pre-emptively)

1. Write the proposal document to `booklets/proposals/{{BOOKLET_FILENAME}}`.
2. Apply the approved items to `data/skills.json`. The file is UTF-8 with
   non-ASCII characters — read and write with `utf-8` encoding, not the
   platform default (cp1252 read fails).
3. Run `npm run validate` (`scripts/validate.mjs`) — checks stage-monotonic
   prereqs (prereq stage ≤ skill stage), acyclicity, and that all references
   resolve. Fix any warnings before considering the pass done.
4. Mark the proposal document as applied (status line at the top, as in prior
   proposals).
