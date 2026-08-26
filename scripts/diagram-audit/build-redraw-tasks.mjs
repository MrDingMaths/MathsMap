// Wave 3 diagram lane: build agy redraw tasks for confirmed-defective blocks.
//
//   node scripts/diagram-audit/build-redraw-tasks.mjs --defects <redraw-defects.json> --out <tasks-dir>
//
// redraw-defects.json is authored by the orchestrator from (a) render compile-failures.json,
// (b) non-mechanical lint findings, (c) Tier-2 "confirmed" verdicts:
//
//   { "defects": [ { "skillId": "…", "file": "content/x.json", "where": "foundation[3].question_text",
//       "blockIndex": 0, "reason": "…what is wrong…" } ] }
//
// Tasks batch ~6 blocks; each includes the card's question/solution text, the current
// [tikz] source, the defect, the matching tikz playbook sections (detected from the block
// text via the sibling detectTikzSections), and the standing constraints: change the [tikz]
// block ONLY, and re-derive the figure's numbers against the stated answer.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROOT, siblingImport } from './lib/audit-lib.mjs';
import { substituteTikz } from './lib/audit-lib.mjs';
import { fieldAccessor } from './lib/audit-lib.mjs';

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const defectsFile = arg('--defects', '');
const outDir = arg('--out', '');
const batchSize = Number(arg('--batch-size', '6'));
if (!defectsFile || !outDir) {
  console.error('usage: node scripts/diagram-audit/build-redraw-tasks.mjs --defects <json> --out <dir> [--batch-size 6]');
  process.exit(2);
}

const { detectTikzSections, assembleTikzRules } = await siblingImport(path.join('tools', 'qgen', 'lib', 'tikz-sections.mjs'));

const { defects } = JSON.parse(fs.readFileSync(defectsFile, 'utf8'));
if (!Array.isArray(defects) || !defects.length) {
  console.error('✗ no defects');
  process.exit(1);
}

// Load each defect's field text + current block source.
const rows = defects.map((d, i) => {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', d.file.replace(/^(content|quizzes)\//, '$1/')), 'utf8'));
  const text = fieldAccessor(doc, d.where).get();
  const { blocks } = substituteTikz(text);
  if (d.blockIndex >= blocks.length) throw new Error(`${d.skillId} ${d.where}: blockIndex ${d.blockIndex} out of range (${blocks.length})`);
  return { redrawId: `R${String(i + 1).padStart(3, '0')}`, ...d, fieldText: text, currentSource: blocks[d.blockIndex] };
});

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (let i = 0; i < rows.length; i += batchSize) {
  n++;
  const num = String(n).padStart(3, '0');
  const batch = rows.slice(i, i + batchSize);
  const det = detectTikzSections(batch.map(r => r.fieldText + '\n' + r.currentSource));
  const rules = assembleTikzRules(det.sections);

  const task = [
    `# Redraw task ${num}`,
    '',
    'Each block below rendered defectively. For EACH: re-derive the figure from the stated',
    'question/solution values (the text is authoritative — if the text and figure disagree,',
    'the figure moves), then rewrite the TikZ. Rules:',
    '',
    '- Change the `[tikz]` block ONLY — never the surrounding question or solution text.',
    '- Re-derive coordinates/numbers against the stated answer; do not patch symptoms.',
    '- Never use `^` inside a plotted expression — write `exp(k*ln(b))`.',
    '- Restrict every plot `domain` to the axis window.',
    '- Degree symbol `^{\\circ}`; shading `fill=gray!35`, never `pattern=`.',
    '',
    '## TikZ manual (relevant sections)',
    '',
    rules,
    '',
    '## Blocks',
    '',
    ...batch.map(r => [
      `### ${r.redrawId} — ${r.skillId} ${r.where} block ${r.blockIndex}`,
      '',
      `**Defect:** ${r.reason}`,
      '',
      'Full field text (for context — do NOT change it):',
      '```',
      r.fieldText,
      '```',
      'Current [tikz] source:',
      '```',
      r.currentSource,
      '```',
    ].join('\n')),
    '',
    '## Output Contract',
    '',
    `Write \`task-${num}.result.json\` in the current directory:`,
    '```json',
    JSON.stringify({ results: batch.map(r => ({ id: r.redrawId, newSource: '<the full replacement tikz interior, no [tikz] tags>', derivation: '<brief working>' })) }, null, 2),
    '```',
    'Write the file directly; do not ask for confirmation.',
  ].join('\n');

  fs.writeFileSync(path.join(outDir, `task-${num}.md`), task);
  fs.writeFileSync(path.join(outDir, `task-${num}.ids.json`), JSON.stringify({ ids: batch.map(r => r.redrawId) }) + '\n');
}
// The defect rows keyed by redrawId so apply-redraws can splice.
fs.writeFileSync(path.join(outDir, 'redraw-index.json'),
  JSON.stringify({ rows: rows.map(({ fieldText, currentSource, ...rest }) => rest) }, null, 2));
console.log(`${n} redraw task(s) for ${rows.length} block(s) in ${outDir} (sections: ${detectTikzSections(rows.map(r => r.fieldText)).sections.join(', ')})`);
