// Wave 3: build item-scoped agy repair tasks from a defects JSON file.
//
//   node scripts/agy/build-repair-tasks.mjs --defects .agywork/W3-1/defects.json --out .agywork/W3-1/repair
//
// The orchestrator (Claude) authors defects.json from whichever lane flagged the item —
// the deterministic gate, an adjudicated luna --compare summary, or diagram-audit verdicts:
//
//   { "defects": [ {
//       "skillId": "…",
//       "target":  { "file": "quiz", "itemId": "q3" }
//                  | { "file": "content", "tier": "development", "index": 2 },
//       "defect":  "free text: what is wrong (checker claim + orchestrator ruling)"
//   } ] }
//
// One task file per skill (all that skill's defective items together, so the model sees the
// sibling defects at once), each fully self-contained: the item JSON, the stems of every
// sibling item (dedup context — the repaired item must not converge onto a sibling), the
// defect text, and the Wave-2 repair contract: identify the misconception → redo the
// derivation from scratch → only then change values; never patch the surface number.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { stripBom } from './lib/agy-run.mjs';
import { findArraySpan, objectSpansInArray } from './lib/json-splice.mjs';
import { standingHazardsBlock } from './lib/hazards.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MATHSDATABASE_ROOT = process.env.MATHSDATABASE_ROOT
  || path.resolve(rootDir, '..', 'MathsDatabase');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const defectsFile = arg('--defects', '');
const outDir = arg('--out', '');

// A repair that has to ADD or REDRAW a figure needs the same drawing manual the generation
// lane gets; without it the model invents TikZ against no rules. Opt in per run with
// `--tikz curve,polygons` — the section names are the ones build-gen-tasks accepts.
const tikzSections = arg('--tikz', '').split(',').map(s => s.trim()).filter(Boolean);
const tikzManual = tikzSections.length
  ? (await import(
      new URL(`file:///${path.join(MATHSDATABASE_ROOT, 'tools', 'qgen', 'lib', 'tikz-sections.mjs').replace(/\\/g, '/')}`)
    )).assembleTikzRules(tikzSections.filter(s => s !== 'core'))
  : null;
if (!defectsFile || !outDir) {
  console.error('usage: node scripts/agy/build-repair-tasks.mjs --defects <defects.json> --out <tasks-dir> [--tikz curve,polygons]');
  process.exit(2);
}

const { defects } = JSON.parse(stripBom(fs.readFileSync(defectsFile, 'utf8')));
if (!Array.isArray(defects) || !defects.length) {
  console.error('✗ defects.json has no defects');
  process.exit(1);
}

function readRaw(skillId, file) {
  const p = path.join(rootDir, 'public', file === 'quiz' ? 'quizzes' : 'content', `${skillId}.json`);
  return stripBom(fs.readFileSync(p, 'utf8'));
}

function extractItem(skillId, target) {
  const raw = readRaw(skillId, target.file);
  if (target.file === 'quiz') {
    const arr = findArraySpan(raw, 'questions');
    for (const s of objectSpansInArray(raw, arr)) {
      const obj = JSON.parse(raw.slice(s.start, s.end));
      if (obj.id === target.itemId) return obj;
    }
    throw new Error(`${skillId}: quiz item ${target.itemId} not found`);
  }
  const practiceKey = raw.indexOf('"practice"');
  const arr = findArraySpan(raw, target.tier, practiceKey);
  const spans = objectSpansInArray(raw, arr);
  if (target.index >= spans.length) throw new Error(`${skillId}: practice.${target.tier}[${target.index}] out of range`);
  return JSON.parse(raw.slice(spans[target.index].start, spans[target.index].end));
}

// Sibling stems (first 140 chars of each question) for dedup context.
function siblingStems(skillId) {
  const stems = [];
  const content = JSON.parse(readRaw(skillId, 'content'));
  for (const tier of ['foundation', 'development', 'mastery']) {
    (content.practice?.[tier] || []).forEach((it, i) =>
      stems.push(`practice.${tier}[${i}]: ${String(it.question_text || '').slice(0, 140)}`));
  }
  try {
    const quiz = JSON.parse(readRaw(skillId, 'quiz'));
    for (const q of quiz.questions || []) stems.push(`quiz ${q.id}: ${String(q.question_text || '').slice(0, 140)}`);
  } catch { /* quiz may not exist for a content-only defect */ }
  return stems;
}

const bySkill = new Map();
for (const d of defects) {
  if (!bySkill.has(d.skillId)) bySkill.set(d.skillId, []);
  bySkill.get(d.skillId).push(d);
}

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const [skillId, skillDefects] of bySkill) {
  n++;
  const num = String(n).padStart(3, '0');
  const items = skillDefects.map((d, i) => {
    const item = extractItem(skillId, d.target);
    const address = d.target.file === 'quiz'
      ? `quiz item id "${d.target.itemId}"`
      : `content practice.${d.target.tier}[${d.target.index}]`;
    return [
      `### Defect ${i + 1} — ${address}`,
      '',
      `**What is wrong:** ${d.defect}`,
      '',
      'Current item JSON:',
      '```json',
      JSON.stringify(item, null, 2),
      '```',
    ].join('\n');
  });

  const task = [
    `# Repair task — skill \`${skillId}\``,
    '',
    'You are repairing defective items in maths teaching content. For EACH defect below:',
    '',
    '1. Identify the underlying misconception or error class the defect describes.',
    '2. Redo the full derivation from scratch — never patch the surface value.',
    '3. Only then rewrite the item. Keep its structure, tier, difficulty and JSON shape',
    '   identical (same keys). Keep the same `id` for quiz items.',
    '4. The repaired item must NOT duplicate any sibling stem listed below.',
    '',
    'YOUR REPLACEMENT MUST NOT INTRODUCE A NEW DEFECT. Before you write it, check it against',
    'each of these — a repair that trades one defect for another is a failed repair:',
    '  - exactly ONE option is defensible. If a second reading of the stem leads to a',
    '    different option (an unrounded vs rounded value, a raw formula result vs its',
    '    real-world interpretation, an equality vs a strict inequality), the item is broken.',
    '  - the stated answer must actually be among the options, and the working must evaluate:',
    '    recompute every sum, product and division in your solution before writing it.',
    '  - every distractor must come from one specific, nameable student error, stated in `why`.',
    '  - the arithmetic of the scenario must stay realistic (no negative BAC, no negative',
    '    price, no fractional person) unless interpreting that impossibility IS the skill.',
    '  - keep every KaTeX `$` pair opened and closed ON THE SAME LINE; solution working is one',
    '    step per line, and a `$` left open at end of line swallows the next step.',
    '',
    'Formatting rules: KaTeX inline as in the current item; degree symbol as `^{\\circ}`;',
    'no raw tab/control characters inside JSON strings.',
    '',
    standingHazardsBlock('repair'),
    '',
    ...(tikzManual ? ['## TikZ rules (only sections relevant to this task)', '', tikzManual, ''] : []),
    ...items,
    '',
    '### Sibling stems (do not converge onto these)',
    '',
    ...siblingStems(skillId).map(s => `- ${s}`),
    '',
    '## Output Contract',
    '',
    `Write your result to \`task-${num}.result.json\` in the current directory (nowhere else):`,
    '```json',
    JSON.stringify({
      skillId,
      repairs: skillDefects.map(d => ({
        target: d.target,
        replacement: { '…': 'the full repaired item object' },
        derivation: 'your worked derivation, brief',
      })),
    }, null, 2),
    '```',
    'The `target` objects must be copied verbatim from above. `replacement` is the complete',
    'repaired item. Write the file directly; do not ask for confirmation.',
  ].join('\n');

  fs.writeFileSync(path.join(outDir, `task-${num}.md`), task);
  fs.writeFileSync(path.join(outDir, `task-${num}.ids.json`), JSON.stringify({ ids: [skillId] }) + '\n');
  console.log(`task-${num}.md: ${skillId} (${skillDefects.length} defect(s))`);
}
console.log(`\n${n} repair task(s) in ${outDir}`);
