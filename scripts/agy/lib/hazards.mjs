// Standing hazards — the defect classes that recurred across Wave-3 batches and therefore
// belong in EVERY generation and repair task, not in a hand-written per-batch hazard list.
//
// Each entry was paid for once: the batch that found it is named so the rule is not
// re-litigated. Per-batch `hazards` in batch.json stay for topic-specific mathematics
// (which routines belong to which skill, booklet gaps, conventions of this topic).
//
// Consumed by scripts/agy/build-gen-tasks.mjs (full list) and build-repair-tasks.mjs
// (the subset a single-item repair can violate).

export const STANDING_HAZARDS = [
  {
    id: 'closed-option-set',
    lanes: ['gen', 'repair'],
    text:
      'CLOSED OPTION SETS (W3-6). When a skill\'s answers come from a small fixed set — {0, 1, −1, undefined} '
      + 'for quadrantal ratios, {Even, Odd, Neither} for parity, {±sin θ, ±cos θ} for negative-angle results, '
      + '{true, false}, a handful of exact surds — two items of the same `structure` inevitably carry each '
      + 'other\'s key as a distractor, and re-numbering CANNOT fix it. Deal such a skill only ONE item per '
      + 'answer value, then vary the item\'s SHAPE instead: evaluate a compound expression, use a coterminal '
      + 'or reflex angle, ask for the reason rather than the value, or give full-sentence reasoned options. '
      + 'Never generate two same-structure items whose option sets are identical.',
  },
  {
    id: 'intersecting-features',
    lanes: ['gen', 'repair'],
    text:
      'NO CONVERGENCE CUE IN THE OPTION SET. Do not fan the distractors around the key so each differs '
      + 'from it in exactly ONE feature (coefficient, constant, denominator, unit, sign, direction letter, '
      + 'exponent). That makes the key the unique option holding the most common value of every feature, and '
      + 'a student picks it by counting features with no mathematics: `*S56°W | S56°E | N56°W | S34°W` gives '
      + 'S 3:1, 56 3:1, W 3:1. Build a BALANCED GRID instead — two independent error axes, all four '
      + 'combinations — so every feature value ties: `*(6x+15)/12 | (6x+5)/12 | (2x+15)/12 | (2x+5)/12`. '
      + 'Where a fourth combination is not a reachable misconception, give TWO distractors sharing the same '
      + 'non-key value in the feature that would otherwise be a 3:1 giveaway. Every option must still be '
      + 'reachable by one identifiable slip, and its `why` must name that slip.',
  },
  {
    id: 'bare-tex',
    lanes: ['gen', 'repair'],
    text:
      'EVERY TeX MACRO MUST SIT INSIDE `$…$` (W3-5: 186 solution lines shipped as bare TeX and rendered '
      + 'literally; the validator could not see them). A line like `\\text{Case 1: } 2x - 3 = 7` with no `$` '
      + 'is broken. Case-split and "let"/"since" lines are the hot zone. Prose stays plain text; maths goes '
      + 'in `$…$`; each `$` pair opens and closes on the SAME line (one working step per line).',
  },
  {
    id: 'arithmetic-in-prose',
    lanes: ['gen', 'repair'],
    text:
      'RECOMPUTE EVERY EVALUATION YOU WRITE (W3-3). The weak spot is arithmetic inside prose and inside '
      + 'working lines, not structure: `27 + 145 + 98 = 280` (it is 270) and `44 − (−4) = 52` (it is 48) both '
      + 'shipped, and both keyed the answer off the bad sum. Before writing any line that asserts a value, '
      + 'evaluate it digit by digit; then confirm the stated answer is one of the options.',
  },
  {
    id: 'mastery-scope',
    lanes: ['gen', 'repair'],
    text:
      'MASTERY IS HARDER, NOT WIDER (W3-6). Mastery cards are where a generator reaches for an untaught fact '
      + 'to make an item "harder" — rhombus diagonals, cone surface area, lines of symmetry. A mastery item '
      + 'may only use this skill plus its listed prereqs; get difficulty from multi-step structure, reverse '
      + 'reasoning or an unfamiliar context, never from new content.',
  },
  {
    id: 'structure-vocabulary',
    lanes: ['gen', 'repair'],
    text:
      'STRUCTURE SLUGS ARE A SHARED VOCABULARY (W3-5). Practice `structure` and quiz `structure` are drawn '
      + 'from the same per-skill set; a quiz structure with no practice counterpart (or the reverse) is a '
      + 'parity defect. Never invent a new slug for a single item — reuse an existing one, or add the '
      + 'matching practice card.',
  },
  {
    id: 'figures-must-be-drawn',
    lanes: ['gen'],
    text:
      'A FIGURE-BEARING SKILL MUST ACTUALLY CARRY `[tikz]` BLOCKS (W3-4: three graphing skills shipped with '
      + 'ZERO figures). Being given TikZ rules does not make a figure appear. For every skill whose stems '
      + 'need a picture, state the figure in the item and draw it: question-side support figures are '
      + 'standard on foundation and development cards, and must never pre-mark the answer.',
  },
  {
    id: 'label-collisions',
    lanes: ['gen', 'repair', 'figure'],
    text:
      'LABEL PLACEMENT IS THE MOST-MISSED FIGURE DEFECT (W3-4, W3-5, W3-6 — the Tier-1 vision pass waves '
      + 'these through). Do not print a coordinate label on a point whose value is already given by a tick '
      + 'label; do not print a curve\'s equation label ON the curve (anchor it in clear space); do not stack '
      + 'two labels at the same `pos=` on crossing lines; keep every label out of the region a shading or '
      + 'arc occupies.',
  },
  {
    id: 'angle-arcs',
    lanes: ['gen', 'repair', 'figure'],
    text:
      'MARKED ANGLES USE `\\pic {angle=A--V--B}` (W3-6 lint `raw-angle-arc`). A hand-drawn `\\draw arc` with '
      + 'a floating `$\\theta$` node is a lint error: the arc drifts off its vertex and the label lands in '
      + 'the wrong region. Every labelled angle needs two bounding rays.',
  },
  {
    id: 'no-tdplot-with-pic',
    lanes: ['gen', 'repair', 'figure'],
    text:
      'NEVER COMBINE `tdplot_main_coords` WITH `\\pic {angle=A--V--B}` (W3-11). Inside a tikz-3dplot picture '
      + 'the angle pic computes its sweep from the UNTRANSFORMED coordinate expressions, so it renders as an '
      + 'enormous circle right round the vertex instead of a small arc between the two arms — six figures '
      + 'shipped that way in W3-11 and every one had to be redrawn. The HOUSE 3D CONVENTION, used by the '
      + 'shipped `trigonometry-3d`, `pythagoras-3d`, `space-diagonal-3d` and `interpret-3d-trig-context`, is '
      + 'to HAND-PROJECT the solid into plain 2D coordinates — an ordinary `\\begin{tikzpicture}` with no '
      + 'tdplot at all, vertices written as explicit 2D pairs, the depth direction a single consistent '
      + 'oblique offset applied to every depth edge — and only then use `\\pic` and the square right-angle '
      + 'mark, which work correctly in that genuinely 2D picture. Draw the projected coordinates so the '
      + 'in-plane edge ratios match the stated lengths; the depth edge is expected to be foreshortened and '
      + '`audit-figure-scale.mjs` recognises the repeated oblique offset and skips the figure.',
  },
  {
    id: 'solid-visibility',
    lanes: ['gen', 'repair', 'figure'],
    text: '3D SOLID VISIBILITY: use the shared MathsMap solid-geometry helper and its versioned model metadata. Visible boundaries and silhouettes are solid; only genuinely occluded edges are dashed. Derive visibility from faces and the actual viewing direction, never vertex names or a remembered front/back edge list. Label with a non-drawing path so adding a dimension cannot repaint a hidden edge. Preserve construction guides and semantic highlights separately. Run audit-solid-visibility.mjs; unsupported or ambiguous geometry needs an occurrence-specific, source-hashed review. Follow docs/solid-visibility.md. Project angle annotations into plain 2D before drawing them.',
  },
  {
    id: 'ties-and-boundaries',
    lanes: ['gen', 'repair'],
    text:
      'TIES AND CONVENTION BOUNDARIES MAKE AN ITEM AMBIGUOUS (W3-3). A "which is the most/least X" stem over '
      + 'a table must name the comparison metric and have a winner that is strictly unique on every natural '
      + 'metric. Never place a value exactly on a convention boundary (a cumulative frequency equal to n/2 '
      + 'or (n+1)/2, an equal-not-cheaper break-even, a point exactly at a piecewise join) unless the '
      + 'convention itself is what the item tests and the stem states it.',
  },
  {
    id: 'periodic-solution-interval',
    lanes: ['gen', 'repair'],
    text:
      'A PERIODIC EQUATION NEEDS ITS SOLUTION INTERVAL PINNED (W4-5). Any stem whose answer comes from a '
      + 'periodic function — solving a trig equation, reading a phase shift, naming a period or a first '
      + 'occurrence — must state the interval explicitly ("for $0\\le x\\le 2\\pi$") and the key must list '
      + 'EVERY solution in it. The recurring defect is a half-period ambiguity: a stem that admits two '
      + 'defensible phase readings (a shift of $\\frac{T}{2}$ left versus right, $\\cos$ written as a shifted '
      + '$\\sin$, or a graph whose window shows less than one full period) makes two options simultaneously '
      + 'correct. Fix it in the stem — name the interval, show at least one full period in any figure, and '
      + 'never offer two options that differ only by a whole or half period.',
  },
  {
    id: 'value-signature-independence',
    lanes: ['gen', 'repair'],
    text:
      'A REWORDED CLONE IS STILL A CLONE (W3-4/W3-5/W3-6: 21–15 QUIZ-COPIES-PRACTICE-VALUES per batch, the '
      + 'single largest mechanical defect class). The gate buckets items by their numeric literals plus the '
      + 'canonical correct answer, so changing the wording while keeping the numbers is caught. Every quiz '
      + 'item needs its OWN numbers and its own answer — different from every practice card of the same '
      + 'skill and from every other quiz item.',
  },
  {
    id: 'replacement-must-clear-siblings',
    lanes: ['repair'],
    text:
      'A REPLACEMENT MUST CLEAR EVERY SIBLING STEM (W3-7: three of four repair rounds existed only because '
      + 'the previous repair landed on a stem already used elsewhere in the same skill — a quiz item repaired '
      + 'onto a practice card\'s equation, twice in a row). The sibling stems are listed in this task for '
      + 'exactly this reason. Before writing the replacement, read that list and check the new item against '
      + 'ALL of it: not just the stem wording, but the numeric literals and the ANSWER. Same routine with the '
      + 'same numbers and the same answer as any sibling is a failed repair, however different the sentence.',
  },
  {
    id: 'cross-course-stem-space',
    lanes: ['gen', 'repair'],
    text:
      'A LOWER-COURSE SKILL MAY ALREADY OWN THIS ROUTINE (W3-7: the Advanced skill '
      + '`solve-trig-equations-restricted` duplicated five stems of the existing Standard skill '
      + '`solve-trig-equations`, which had already used every plain sin/cos/tan = exact value over 0°–360°; '
      + 'only the UNSCOPED duplicate audit saw it, after the batch was otherwise finished). When this skill '
      + 'restates a routine a Standard/earlier-stage skill teaches, that skill\'s stem space is off limits. '
      + 'Take the space it cannot use: radian domains, non-standard domains (−180° to 180°, 0° to 720°, '
      + '−π to π, 0 to 4π), reciprocal ratios (sec, cosec, cot), non-exact values solved to the nearest '
      + 'degree, or a reverse/justify shape.',
  },
  {
    id: 'mastery-tier-needs-a-mastery-quiz-item',
    lanes: ['gen', 'repair'],
    text:
      'A MASTERY PRACTICE TIER REQUIRES AT LEAST ONE `mastery: true` QUIZ ITEM (W4-6 '
      + '`discrete-probability-distribution`; W4-10 four skills in one section). This is the single most '
      + 'repeated generator failure of Wave 4: the practice mastery tier is written, the quiz is written, '
      + 'and every quiz item is left `mastery: false`. `validate.mjs` fails the skill for it. Author the '
      + 'mastery quiz item deliberately — it must be genuinely mastery-level (multi-step, reverse, or an '
      + 'unfamiliar context, still inside this skill plus its prereqs per `mastery-scope`). NEVER satisfy '
      + 'this by flipping an ordinary item\'s flag: a `mastery: true` item that is no harder than its '
      + 'neighbours is a worse defect than the missing flag, and it is invisible to the gate.',
  },
  {
    id: 'negative-support-on-the-axis',
    lanes: ['gen', 'repair', 'figure'],
    text:
      'A NEGATIVE COORDINATE MUST BE DRAWN LEFT OF THE ORIGIN (W4-7: a uniform density on [-3, 5] and '
      + 'another on [-4, 6] were drawn with the whole rectangle to the RIGHT of the y-axis, so the negative '
      + 'lower bound sat on the positive x-axis and the solution figure\'s own `0` tick produced the '
      + 'impossible ordering 0 < -3 < 0 < 5). `lint.mjs` passes this — the axis is drawn and the labels '
      + 'exist; only their ordering against the origin is wrong. Whenever a domain, support, interval or '
      + 'root is negative, extend the drawn axis past it and place the y-axis at true x = 0, then check the '
      + 'labelled ticks read left-to-right in increasing order.',
  },
];

// Markdown block for a task file. `lane` is 'gen', 'repair', or 'figure' (the drawing-only
// subset used by the theory-figure lane, where no new questions are authored).
export function standingHazardsBlock(lane = 'gen') {
  const rules = STANDING_HAZARDS.filter(h => h.lanes.includes(lane));
  return [
    '## Standing hazards (measured defect classes — every one of these has shipped before)',
    '',
    ...rules.map(h => `- **${h.id}** — ${h.text}`),
  ].join('\n');
}
