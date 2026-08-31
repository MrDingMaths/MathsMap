// Wave 3 (W3-2R, figures lane): give every networks question that DESCRIBES a network an actual
// network diagram.
//
//   node scripts/agy/build-figure-tasks.mjs --plan --out .agywork/W3-2R/figures.json
//   node scripts/agy/build-figure-tasks.mjs --in .agywork/W3-2R/figures.json --out .agywork/W3-2R/figures
//
// W3-2 left 118 of 165 questions with the network written out as prose — "Edge weights are
// $AB=8, AY=6, XB=5$" — where the booklet always draws it. This lane replaces that prose with a
// figure.
//
// Two judgements are NOT the model's to make, so they are settled here:
//   - GIVEAWAY structures stay text-only (owner decision 2026-08-27). Drawing the network either
//     IS the answer (table-to-graph, map-or-context) or deletes the skill (reading the distance
//     table). These items never reach a task file.
//   - Everything else is offered to the model, which decides per item whether the stem actually
//     DETERMINES a network. "A tree has 8 vertices, how many edges?" names no graph; inventing
//     one would assert structure the question never gave. That call needs the whole stem, which
//     is why it is the model's and not a regex's.
//
// Output contract matches the repair lane, so scripts/agy/apply-repairs.mjs consumes it
// unchanged; scripts/check-figures.mjs gates the results before they are applied.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { stripBom } from './lib/agy-run.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const SKILLS = [
  'shortest-path', 'minimum-spanning-tree', 'minimal-connector',
  'identify-trees-spanning-trees', 'solve-network-problems', 'construct-network-diagram',
];

export const GIVEAWAY = new Set([
  'shortest-path-from-distance-table', 'mst-from-distance-table', 'connector-from-distance-table',
  'table-to-graph-undirected', 'table-to-graph-directed', 'matrix-properties-and-symmetry',
  'map-or-context-to-network',
]);

function readJson(file) { return JSON.parse(stripBom(fs.readFileSync(file, 'utf8'))); }
const contentPath = (id) => path.join(rootDir, 'public', 'content', `${id}.json`);
const quizPath = (id) => path.join(rootDir, 'public', 'quizzes', `${id}.json`);

export function enumerateItems(skillId) {
  const out = [];
  const content = readJson(contentPath(skillId));
  for (const tier of ['foundation', 'development', 'mastery']) {
    (content.practice?.[tier] || []).forEach((item, index) => {
      out.push({ skillId, target: { file: 'content', tier, index }, item, address: `practice.${tier}[${index}]` });
    });
  }
  for (const q of readJson(quizPath(skillId)).questions || []) {
    out.push({ skillId, target: { file: 'quiz', itemId: q.id }, item: q, address: `quiz ${q.id}` });
  }
  return out;
}

export function buildPlan() {
  const plan = [];
  for (const skillId of SKILLS) {
    for (const entry of enumerateItems(skillId)) {
      if (/\[tikz\]/.test(entry.item.question_text)) continue;      // already has a figure
      if (GIVEAWAY.has(entry.item.structure)) continue;             // text-only by decision
      plan.push({
        skillId, target: entry.target, address: entry.address,
        structure: entry.item.structure || null,
      });
    }
  }
  return plan;
}

// ---------------------------------------------------------------------------

const BRIEF = String.raw`## What to do

For each item below, decide ONE thing, then act on it.

**Does the question text DETERMINE a network?** It does when you can name every vertex and every
edge the stem states — an edge list (\$AB=8, AC=4\$), a directed list (\$S\to A\,(7)\$), a route
described station by station, a named subgraph (\`the edges \$AB, BC, CD, DE\$\`), or a named
standard graph (\$K_5\$).

It does NOT when the stem gives only counts or totals. "A tree has \$8\$ vertices, how many edges?"
and "the minimum spanning tree has weights \$4, 6, 7\$ and unknown \$k\$" name NO particular graph —
many different networks fit, and drawing one asserts a structure the question never gave. Neither
does a general statement of theory ("explain why the heaviest edge in a cycle...").

- **If it determines a network → \`"decision": "draw"\`.** Rewrite \`question_text\` so the network is
  a figure instead of prose, and return the full item.
- **If it does not → \`"decision": "skip"\`** and a one-line \`reason\`. Return no replacement. A
  skip is a correct answer here, not a failure — roughly half of these items should skip.

## When you draw

- **The figure REPLACES the prose that listed the edges.** Keep the context sentence and keep the
  question being asked; delete only the "Edge weights are …" enumeration, which the picture now
  carries. Do not leave both.
- Put the \`[tikz]\` block after the context sentence and before the final question sentence, the
  way the existing figure-bearing items do.
- **Every vertex and every weight the stem stated must appear in the figure, unchanged.** The
  answer must stay exactly what it is now — check your figure against the current
  \`solution_text\`, which you must NOT modify. If a weight in the stem disagrees with the
  solution, skip the item and say so in \`reason\`.
- Never draw anything the question asks the student to produce, and never mark the answer on the
  figure — no thickened path, no tree, no labels in circles. This is the plain network only.

## Figure conventions

\begin{tikzpicture}[every node/.style={font=\large}]
\coordinate (A) at (0,1.5);
\coordinate (B) at (2,2.6);
\draw (A) -- (B) node[midway, above left] {$2$};
\fill (A) circle (2.5pt) node[left] {$A$};
\end{tikzpicture}

- One \`\coordinate\` per vertex, one \`\draw … -- …\` per edge, one \`\fill … circle (2.5pt)\` per
  vertex dot and name, in that order. Nothing else.
- A weight on a crossing edge takes \`node[midway, fill=white, inner sep=1pt]\`.
- Directed graphs declare the arrow style once, immediately after \`\begin{tikzpicture}\`:
  \`\usetikzlibrary{decorations.markings}\` then
  \`\tikzset{midarrow/.style={decoration={markings, mark=at position 0.6 with {\arrow{>}}}, postaction={decorate}}}\`,
  and each edge is \`\draw[midarrow] (A) -- (B) node[pos=0.3, fill=white, inner sep=1pt] {$4$};\`.
- Vertex names must be single TikZ-safe tokens (\`A\`, \`S\`, \`M1\`, \`T2\`). A station or town called
  "Circular Quay" is drawn as a short vertex name with the full name as its label text.

## Layout — checked automatically, so get it right first time

- every pair of vertices **at least 1.2cm apart** (1.8cm is comfortable);
- every edge passes **at least 0.6cm clear of every vertex that is not one of its endpoints** —
  this is the one that fails most. A long edge drawn straight across the middle will graze
  whatever sits between its ends: route long edges around the OUTSIDE of the layout. Vertices in
  one straight line are almost always wrong;
- every weight at least 0.6cm from any vertex, and 0.5cm from any vertex NAME — so keep edges at
  least 1.6cm long, because a \`midway\` weight on a short edge is near both of its ends;
- **no weight may sit on a DIFFERENT edge.** Its white fill erases part of that edge, and the
  number reads as belonging to the wrong one. This is what happens when several edges cross a
  long horizontal edge near its middle: their midpoints all land on it, and its own weight ends
  up sandwiched between theirs as one run of digits ("2 8 3"). Fix it by staggering the crossing
  vertices so the midpoints fall at different heights, or by moving the labels along their edges
  with \`pos=0.3\` / \`pos=0.7\`;
- **no two weights within 0.55cm of each other**;
- a vertex name goes on the side of the vertex with no edge leaving it.

Before you output a figure, list its edge midpoints and check those last three yourself. They are
the checks that fail most often, and a failing figure is rejected and regenerated.

Shape that works for 6–10 vertices: start on the left, finish on the right, the rest in two
staggered rows between them (y ≈ 0.3 and y ≈ 2.7), x stepping by 1.6–1.8cm. Spread to 7–9cm wide
if you need to; a wide figure costs nothing.`;

function taskFor(skillId, entries, num) {
  const items = enumerateItems(skillId);
  const blocks = entries.map((e, i) => {
    const found = items.find((x) => x.address === e.address);
    if (!found) throw new Error(`${skillId}: ${e.address} not found`);
    return [
      `### Item ${i + 1} — ${e.address} (structure \`${e.structure}\`)`,
      '',
      'Current item JSON:',
      '```json',
      JSON.stringify(found.item, null, 2),
      '```',
    ].join('\n');
  });

  return [
    `# Question figures — skill \`${skillId}\``,
    '',
    'These questions describe their network in words. The booklet always draws it. Your job is to',
    'replace the description with a figure **where the question actually determines a network**.',
    '',
    '**Change `question_text` only.** `solution_text`, `structure`, `mastery`, quiz `id` and quiz',
    '`options` must come back byte-identical. Do not change any number, name or the answer.',
    '',
    BRIEF,
    '',
    ...blocks,
    '',
    '## Output Contract',
    '',
    `Write your result to \`task-${num}.result.json\` in the current directory (nowhere else):`,
    '```json',
    JSON.stringify({
      skillId,
      repairs: entries.map((e) => ({
        target: e.target,
        decision: 'draw | skip',
        reason: 'one line — required when you skip',
        replacement: { '…': 'the complete item, ONLY for decision "draw"' },
      })),
    }, null, 2),
    '```',
    'Copy each `target` verbatim. Omit `replacement` entirely when you skip. Write the file',
    'directly; do not ask for confirmation.',
  ].join('\n');
}

// ---------------------------------------------------------------------------

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function main() {
  const out = arg('--out', '');
  if (!out) {
    console.error('usage: build-figure-tasks.mjs --plan --out <plan.json>');
    console.error('       build-figure-tasks.mjs --in <plan.json> --out <tasks-dir>');
    process.exit(2);
  }

  if (process.argv.includes('--plan')) {
    const plan = buildPlan();
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(path.resolve(out), JSON.stringify({ plan }, null, 2) + '\n');
    for (const skillId of SKILLS) {
      const rows = plan.filter((p) => p.skillId === skillId);
      const total = enumerateItems(skillId);
      const withFig = total.filter((e) => /\[tikz\]/.test(e.item.question_text)).length;
      const giveaway = total.filter((e) => !/\[tikz\]/.test(e.item.question_text) && GIVEAWAY.has(e.item.structure)).length;
      console.log(`${skillId.padEnd(32)} offered=${String(rows.length).padStart(2)}  (has figure=${withFig}, text-only by decision=${giveaway}, of ${total.length})`);
    }
    console.log(`\n${plan.length} item(s) offered to the model; ${plan.length} is an upper bound — it decides per item whether the stem determines a network.`);
    console.log(`plan written to ${out}`);
    return;
  }

  const inFile = arg('--in', '');
  if (!inFile) { console.error('need --plan or --in <plan.json>'); process.exit(2); }
  const { plan } = JSON.parse(stripBom(fs.readFileSync(path.resolve(inFile), 'utf8')));
  const chunkSize = Math.max(1, Number(arg('--chunk', '6')) || 6);

  const outDir = path.resolve(out);
  fs.mkdirSync(outDir, { recursive: true });
  let n = 0;
  for (const skillId of SKILLS) {
    const entries = plan.filter((p) => p.skillId === skillId);
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      n++;
      const num = String(n).padStart(3, '0');
      fs.writeFileSync(path.join(outDir, `task-${num}.md`), taskFor(skillId, chunk, num));
      fs.writeFileSync(path.join(outDir, `task-${num}.ids.json`), JSON.stringify({ ids: [skillId] }) + '\n');
      console.log(`task-${num}.md: ${skillId} — ${chunk.length} item(s)`);
    }
  }
  console.log(`\n${n} task(s) in ${outDir}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
