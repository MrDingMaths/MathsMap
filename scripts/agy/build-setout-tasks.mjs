// Wave 3 (W3-2R): build agy tasks that rewrite the networks worked solutions into the
// booklet's per-step setout.
//
//   node scripts/agy/build-setout-tasks.mjs --plan --out .agywork/W3-2R/setout.json
//   node scripts/agy/build-setout-tasks.mjs --in .agywork/W3-2R/setout.json --out .agywork/W3-2R/setout
//
// Why not build-repair-tasks.mjs: that lane's contract is "identify the misconception → redo
// the derivation", and half its checklist is quiz-option hygiene. Here the mathematics is
// already correct — what is wrong is the SETOUT. The six networks skills describe their
// solutions in prose ("Comparing totals, A–B–E gives the minimum weight of 5") where the
// booklet shows a sequence of network diagrams, one per step.
//
// The output contract is deliberately identical to the repair lane —
// {skillId, repairs:[{target, replacement}]} — so scripts/agy/apply-repairs.mjs consumes the
// results unchanged. Lane A results carry two extra sibling keys, `steps` and (when the item
// has no question figure) `baseFigure`, which scripts/networks-steps.mjs consumes to render
// the [[STEP]] markers into real [tikz] blocks before apply-repairs runs.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { stripBom } from './lib/agy-run.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const SKILLS = [
  'shortest-path',
  'minimum-spanning-tree',
  'minimal-connector',
  'identify-trees-spanning-trees',
  'solve-network-problems',
  'construct-network-diagram',
];

// Lane A — an algorithm is executed, so the booklet draws the graph once per step.
export const LANE_A = new Set([
  'dijkstras-algorithm-table-or-labels',
  'prim-algorithm-execution',
  'mst-total-weight',
  'mst-from-distance-table',
  'minimal-connector-distance',
  'minimal-connector-cost',
  'connector-from-distance-table',
  'construct-spanning-tree',
  'edges-to-remove-for-spanning-tree',
]);

// Lane B — the answer IS a picture (a graph built from a table, or a route traced on the
// given network), and the item currently narrates it instead of drawing it.
export const LANE_B = new Set([
  'table-to-graph-undirected',
  'table-to-graph-directed',
  'map-or-context-to-network',
]);
// Lane B only where the question already carries a figure to redraw with the route thickened.
export const LANE_B_IF_FIGURE = new Set([
  'walk-total-weight',
  'practical-constrained-route',
]);

// ---------------------------------------------------------------------------
// Item enumeration and lane assignment
// ---------------------------------------------------------------------------

function readJson(file) {
  return JSON.parse(stripBom(fs.readFileSync(file, 'utf8')));
}

export function contentPath(skillId) { return path.join(rootDir, 'public', 'content', `${skillId}.json`); }
export function quizPath(skillId) { return path.join(rootDir, 'public', 'quizzes', `${skillId}.json`); }

export function enumerateItems(skillId) {
  const out = [];
  const content = readJson(contentPath(skillId));
  for (const tier of ['foundation', 'development', 'mastery']) {
    (content.practice?.[tier] || []).forEach((item, index) => {
      out.push({ skillId, target: { file: 'content', tier, index }, item, address: `practice.${tier}[${index}]` });
    });
  }
  const quiz = readJson(quizPath(skillId));
  for (const q of quiz.questions || []) {
    out.push({ skillId, target: { file: 'quiz', itemId: q.id }, item: q, address: `quiz ${q.id}` });
  }
  return out;
}

export function hasFigure(text) {
  return /\[tikz\][\s\S]*?\[\/tikz\]/.test(String(text || ''));
}

function withoutTikz(text) {
  return String(text || '').replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '');
}

const RE_HEADER = /^\d+\.\s+\*\*.+\*\*\s*$/;

// A line that is a single whole-line `$…$` run — the house-style working line the renderer
// column-aligns (src/lib/inline-content.js groupTextBlocks).
function isMathLine(line) {
  const t = line.trim();
  return t.length > 1 && t.startsWith('$') && t.endsWith('$') && t.indexOf('$', 1) === t.length - 1;
}

// Lane C items are only rewritten when their setout is actually defective: an unsupported
// Markdown bullet (the renderer supports **bold** and $…$ only), or narration heavy enough
// that the working has been replaced by sentences.
export function laneCDefects(solutionText) {
  const lines = withoutTikz(solutionText).split('\n').map((l) => l.trim()).filter(Boolean);
  const reasons = [];
  if (lines.some((l) => /^[-*]\s/.test(l))) reasons.push('uses Markdown `- ` bullets, which the renderer does not support and prints literally');
  const prose = lines.filter((l) => !isMathLine(l) && !RE_HEADER.test(l));
  if (prose.length >= 3) reasons.push(`${prose.length} prose lines describe the method instead of showing the working`);
  else if (!lines.some(isMathLine) && prose.length >= 2) reasons.push('the whole solution is prose — it contains no working line at all');
  // A header may only appear at a genuine stage boundary, numbered from the first stage used.
  const firstHeader = lines.find((l) => RE_HEADER.test(l));
  if (firstHeader && !/^1\./.test(firstHeader)) reasons.push(`the solution opens at step header "${firstHeader}" with no earlier stage shown`);
  return reasons;
}

export function assignLane(entry) {
  const { item } = entry;
  const structure = item.structure || '';
  if (LANE_A.has(structure)) return { lane: 'A', reason: 'an algorithm is executed step by step' };
  if (LANE_B.has(structure)) return { lane: 'B', reason: 'the answer is a network diagram' };
  if (LANE_B_IF_FIGURE.has(structure) && hasFigure(item.question_text)) {
    return { lane: 'B', reason: 'the traced route should be shown on the given network' };
  }
  const defects = laneCDefects(item.solution_text);
  if (defects.length) return { lane: 'C', reason: defects.join('; ') };
  return { lane: null, reason: 'setout already follows house style' };
}

export function buildPlan() {
  const plan = [];
  for (const skillId of SKILLS) {
    for (const entry of enumerateItems(skillId)) {
      const { lane, reason } = assignLane(entry);
      if (!lane) continue;
      plan.push({
        skillId,
        target: entry.target,
        address: entry.address,
        structure: entry.item.structure || null,
        lane,
        reason,
        hasFigure: hasFigure(entry.item.question_text),
      });
    }
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Task authoring
// ---------------------------------------------------------------------------

const HOUSE_STYLE = `## House worked-solution style (all lanes)

- Align the working on \`=\`. The opening line is the bare expression (no \`=\`); every later
  line begins \`=\`, so the equals signs stack. Write ONE plain \`$…$\` per line — the renderer
  collapses a run of whole-line maths into a single KaTeX \`aligned\` block for you. NEVER
  hand-author \`\\begin{aligned}\`, \`&\` or \`\\\\\`.
- The final line states the answer. Do NOT add a line that merely restates it.
- \`solution_text\` is working only. It must not repeat the question prose — the flip card
  already re-renders the stem above the solution.
- Only \`**bold**\` and \`$…$\` are supported. Markdown bullets (\`- \`), italics, headings and
  tables are NOT — a \`- \` line renders as a literal hyphen. A list of candidate paths is
  written as one working line each:
  \`$A\\text{–}B\\text{–}E = 2+3$\` then \`$=5$\`, never \`- Path A–B–E: 2 + 3 = 5\`.
- Mathematical tables use a KaTeX \`array\` inside \`$…$\`.
- Step headers appear only at genuine stage boundaries, as a standalone line
  \`N. **Step name**\` (the number sits OUTSIDE the bold). Every header must quote a
  \`theory.steps\` entry for this skill verbatim, in theory order. Do not label every line.
  Do not open at step 2 — if a stage genuinely does not apply, show it or start at step 1.
- Keep every KaTeX \`$\` pair opened and closed ON THE SAME LINE.
- Degree symbol is \`^{\\circ}\`. No raw tab or control characters inside JSON strings.`;

const NETWORKS_TIKZ = `## Networks figure conventions

A networks figure is built from exactly three kinds of line, in this order:

\`\`\`
\\begin{tikzpicture}[every node/.style={font=\\large}]
\\coordinate (A) at (0,1.5);
\\draw (A) -- (B) node[midway, above left] {$2$};
\\draw (B) -- (C) node[midway, fill=white, inner sep=1pt] {$4$};
\\fill (A) circle (2.5pt) node[left] {$A$};
\\end{tikzpicture}
\`\`\`

- One \`\\coordinate\` per vertex, one \`\\draw … -- …\` per edge, one \`\\fill … circle (2.5pt)\`
  per vertex dot and name. A weight on a crossing edge uses
  \`node[midway, fill=white, inner sep=1pt]\` so the white fill lifts it off the line beneath.
- A directed graph declares the arrow style once, immediately after \`\\begin{tikzpicture}\`:
  \`\\usetikzlibrary{decorations.markings}\` then
  \`\\tikzset{midarrow/.style={decoration={markings, mark=at position 0.6 with {\\arrow{>}}}, postaction={decorate}}}\`,
  and every edge is \`\\draw[midarrow] (A) -- (B) node[pos=0.3, fill=white, inner sep=1pt] {$4$};\`.
- Vertex names must be single tokens usable as TikZ node names (\`A\`, \`S\`, \`M1\`).
- Lay a graph out so no weight label lands on another edge, and keep it roughly 5–7 cm wide.`;

const LANE_A_BRIEF = `## Lane A — per-step diagram sequence

The booklet teaches these skills as a SEQUENCE of network diagrams. Prim's algorithm:
"Step 1: Choose A", "Step 2: Connect AB", "Step 3: Connect AD", … each a redraw of the same
graph with the tree so far drawn thick. Dijkstra's algorithm: "Redraw the graph with empty
circles at each vertex", then write the lowest running total inside each circle, one redraw
per stage, then trace back.

**You do not draw these diagrams.** You place a marker where each one belongs and describe
its state as data; a script renders them from the question figure's own coordinates.

In \`solution_text\`, a diagram is a line containing exactly:

\`\`\`
[[STEP]]
\`\`\`

and the repair object carries a \`steps\` array with ONE entry per marker, in order:

\`\`\`json
"steps": [
  { "bold": [] },
  { "bold": ["A-B"] },
  { "bold": ["A-B", "A-C"] },
  { "bold": ["A-B", "A-C", "C-D"] }
]
\`\`\`

- \`bold\` — every edge selected into the tree/path SO FAR at that step, cumulative. Edges are
  named \`"A-B"\`. Rejected edges are never removed, only left thin.
- For Dijkstra use \`labels\` instead: \`{ "labels": { "S": 0, "A": 4, "B": 6 } }\` — the running
  total at each vertex at that step. A vertex you have not reached yet is simply omitted, and
  renders as the booklet's empty circle. Every step of a Dijkstra sequence must use \`labels\`.
- Cap the sequence at **6 diagrams**. A network with more than 7 vertices shows 4 milestones:
  the start state, two mid-states, and the finished tree/labelled network.

Setout of a Lane A solution: each \`N. **Step name**\` header, then that stage's \`[[STEP]]\`
marker(s), then the aligned \`=\` total, then the answer line. Example shape:

\`\`\`
1. **Select a starting vertex**
[[STEP]]
2. **Choose the lowest-weight edge connected to the starting vertex**
[[STEP]]
3. **From all vertices currently in the tree, repeatedly add the lowest-weight edge to an unvisited vertex**
[[STEP]]
[[STEP]]
4. **Continue until all $n$ vertices are connected and sum the $n - 1$ edge weights**
$\\text{MST weight} = 3 + 4 + 2$
$= 9$
\`\`\`

**If the item has a question figure**, the renderer reuses its coordinates — you add nothing.
**If it does not** (the network is given as an edge list or a distance table), add a
\`baseFigure\` key to the repair object holding the complete \`\\begin{tikzpicture}…\\end{tikzpicture}\`
source for that network, drawn to the conventions above. Every vertex and every edge named in
the question must appear in it, with its weight. Draw it ONCE; the steps are rendered from it.

A step diagram is denser than a plain network: a 7mm circle lands on every vertex and the
vertex name is pushed 4mm outside it. A layout that is merely legible as a static figure will
collide once it is stepped, so a \`baseFigure\` is **rejected automatically** unless:

- **every pair of vertices is at least 1.2 cm apart** — 1.8 cm is the comfortable spacing;
- **every edge passes at least 0.6 cm clear of every vertex that is not one of its endpoints.**
  This is the one that fails most often: a long edge drawn straight across the middle of the
  picture (\`F\` bottom-left to \`I\` right) will graze whatever sits between them. Route such a
  network so that long edges run along the OUTSIDE of the layout, or move the vertex out of
  the way. Vertices in one straight line are almost always wrong for this reason;
- **every weight sits at least 0.6 cm from every vertex** — a weight at the midpoint of a short
  edge is close to both of its ends, so keep short edges at least 1.6 cm long.

Practical shape for 8–10 vertices: a start vertex on the left, a finish vertex on the right, and
the rest in two staggered rows between them (y ≈ 0.3 and y ≈ 2.7), x stepping by 1.6–1.8 cm.
Give every weight \`fill=white, inner sep=1pt\`. Count the vertices before you place them and
spread the picture out to 7–9 cm wide if you need to — a wide figure costs nothing.`;

const LANE_B_BRIEF = `## Lane B — one answer diagram

The answer to these items IS a picture: the network built from a distance table or a context,
or the chosen route traced on the given network. Write the working as usual, and place the
diagram where the booklet would draw it, as a real \`[tikz]…[/tikz]\` block inside
\`solution_text\`, following the networks figure conventions above.

When the question already carries the network, the solution figure must ADD something — the
chosen route drawn with \`[line width=1.6pt]\` — and must reuse that figure's \`\\coordinate\`
lines EXACTLY. Never redraw the plain question figure unchanged.`;

const LANE_C_BRIEF = `## Lane C — working only, no diagram

Rewrite the narration as house-style working. Do not add a figure. Typical fix: a bulleted
list of candidate paths becomes one working line per path,

\`\`\`
$A\\text{–}B\\text{–}E = 2+3$
$=5$
$A\\text{–}D\\text{–}E = 3+4$
$=7$
$A\\text{–}C\\text{–}D\\text{–}E = 6+2+4$
$=12$
Shortest path: $A\\text{–}B\\text{–}E$, length $5$.
\`\`\`

A justify/explain item keeps its sentences — but they must be reasons, not a recital of the
procedure, and the last line must be the answer.`;

function taskFor(skillId, entries, num) {
  const content = readJson(contentPath(skillId));
  const steps = content.theory?.steps || [];
  const lanes = new Set(entries.map((e) => e.lane));

  const itemBlocks = entries.map((e, i) => {
    const items = enumerateItems(skillId);
    const found = items.find((x) => x.address === e.address);
    if (!found) throw new Error(`${skillId}: ${e.address} not found`);
    return [
      `### Item ${i + 1} — ${e.address} (lane ${e.lane}, structure \`${e.structure}\`)`,
      '',
      `**Why it is being rewritten:** ${e.reason}`,
      '',
      e.lane === 'A'
        ? (e.hasFigure
          ? '**Base figure:** this item has a question figure — the step diagrams reuse its coordinates automatically. Do NOT supply `baseFigure`.'
          : '**Base figure:** this item has NO question figure. You MUST supply `baseFigure` for it.')
        : '',
      '',
      'Current item JSON:',
      '```json',
      JSON.stringify(found.item, null, 2),
      '```',
    ].filter((x) => x !== '').join('\n');
  });

  const task = [
    `# Worked-solution setout rewrite — skill \`${skillId}\``,
    '',
    'The items below teach correct mathematics with the WRONG SETOUT: they describe the',
    'solution in prose where the booklet shows it step by step. Your job is to rewrite each',
    "item's `solution_text` into the booklet setout. **Do not change `question_text`, do not",
    'change `structure`, do not change quiz `options` or `id`, and do not change the',
    'mathematics.** If you find the mathematics genuinely wrong, fix it and say so in',
    '`derivation` — but that is not what this task is for.',
    '',
    `## This skill's \`theory.steps\``,
    '',
    steps.length
      ? steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '(none — this skill declares no procedure, so its solutions carry NO step headers)',
    '',
    HOUSE_STYLE,
    '',
    NETWORKS_TIKZ,
    '',
    ...(lanes.has('A') ? [LANE_A_BRIEF, ''] : []),
    ...(lanes.has('B') ? [LANE_B_BRIEF, ''] : []),
    ...(lanes.has('C') ? [LANE_C_BRIEF, ''] : []),
    '## Before you write each replacement, check',
    '',
    '- every sum, product and division in the working actually evaluates — recompute them;',
    '- the answer you state is the answer the original item stated (and, for a quiz item, is',
    '  still the option marked `correct`);',
    '- every step header quotes a `theory.steps` entry above, verbatim, in order;',
    '- no `- ` bullet, no `\\begin{aligned}`, no restated-answer line, no repeated question prose;',
    '- for lane A, the number of `[[STEP]]` markers equals the length of `steps`, and every',
    '  edge you name in `bold` exists in the figure.',
    '',
    ...itemBlocks,
    '',
    '## Output Contract',
    '',
    `Write your result to \`task-${num}.result.json\` in the current directory (nowhere else):`,
    '```json',
    JSON.stringify({
      skillId,
      repairs: entries.map((e) => ({
        target: e.target,
        replacement: { '…': 'the complete item object, same keys as the current item' },
        ...(e.lane === 'A' ? { steps: [{ bold: ['…'] }], ...(e.hasFigure ? {} : { baseFigure: '\\begin{tikzpicture}…\\end{tikzpicture}' }) } : {}),
        derivation: 'your worked derivation, brief',
      })),
    }, null, 2),
    '```',
    'Copy each `target` object verbatim from the list above. `replacement` is the complete',
    'item, with the same keys it has now. `steps` and `baseFigure` belong NEXT TO `replacement`,',
    'never inside it. Write the file directly; do not ask for confirmation.',
  ].join('\n');

  return task;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function main() {
  const out = arg('--out', '');
  if (!out) {
    console.error('usage: build-setout-tasks.mjs --plan --out <plan.json>');
    console.error('       build-setout-tasks.mjs --in <plan.json> --out <tasks-dir>');
    process.exit(2);
  }

  if (process.argv.includes('--plan')) {
    const plan = buildPlan();
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(path.resolve(out), JSON.stringify({ plan }, null, 2) + '\n');
    const byLane = plan.reduce((acc, p) => ({ ...acc, [p.lane]: (acc[p.lane] || 0) + 1 }), {});
    for (const skillId of SKILLS) {
      const rows = plan.filter((p) => p.skillId === skillId);
      const l = (lane) => rows.filter((r) => r.lane === lane).length;
      console.log(`${skillId.padEnd(32)} A=${l('A')}  B=${l('B')}  C=${l('C')}  (of ${enumerateItems(skillId).length} items)`);
    }
    const noFig = plan.filter((p) => p.lane === 'A' && !p.hasFigure).length;
    console.log(`\n${plan.length} item(s) in scope — A=${byLane.A || 0} B=${byLane.B || 0} C=${byLane.C || 0}`);
    console.log(`${noFig} lane-A item(s) have no question figure and need a model-authored baseFigure`);
    console.log(`plan written to ${out}`);
    return;
  }

  const inFile = arg('--in', '');
  if (!inFile) { console.error('need --plan or --in <plan.json>'); process.exit(2); }
  const { plan } = JSON.parse(stripBom(fs.readFileSync(path.resolve(inFile), 'utf8')));

  // One task per (skill, lane) chunk. A single task per skill would carry ~28 items of full
  // JSON — far more than one agy call reliably completes, and a partial result fails the whole
  // task's id reconciliation. Lane-uniform chunks also keep each prompt to the one brief it
  // needs. Chunks stay small enough that a retry is cheap.
  const chunkSize = Math.max(1, Number(arg('--chunk', '6')) || 6);
  const groups = new Map();
  for (const p of plan) {
    const key = `${p.skillId}::${p.lane}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  const outDir = path.resolve(out);
  fs.mkdirSync(outDir, { recursive: true });
  let n = 0;
  for (const skillId of SKILLS) {
    for (const lane of ['A', 'B', 'C']) {
      const entries = groups.get(`${skillId}::${lane}`) || [];
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        n++;
        const num = String(n).padStart(3, '0');
        fs.writeFileSync(path.join(outDir, `task-${num}.md`), taskFor(skillId, chunk, num));
        fs.writeFileSync(path.join(outDir, `task-${num}.ids.json`), JSON.stringify({ ids: [skillId] }) + '\n');
        console.log(`task-${num}.md: ${skillId} lane ${lane} — ${chunk.length} item(s)`);
      }
    }
  }
  console.log(`\n${n} task(s) in ${outDir}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
