// Wave 3 diagram lane, step 2: run the sibling tikz-layout-lint rules over every [tikz]
// block for a set of skills.
//
//   node scripts/diagram-audit/lint.mjs --ids a,b,c --out .agywork/W3-1/diagram/lint.json
//
// Bridges scripts/lib/tikz-blocks.mjs (block collection, MathsMap side) to
// MathsDatabase/tools/tikz-audit/lib/rules.mjs lintBlock (rule set, sibling side —
// override the sibling checkout with MATHSDATABASE_ROOT). Findings marked mechanical:true
// have a deterministic fix in the sibling fixes.mjs (apply via --fix); everything else
// routes to the vision/redraw lanes.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROOT, siblingImport } from './lib/audit-lib.mjs';
import { collectBlocks } from '../lib/tikz-blocks.mjs';

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const ids = arg('--ids', '').split(',').filter(Boolean);
const outFile = arg('--out', '');
const applyFixes = process.argv.includes('--fix');
if (!ids.length || !outFile) {
  console.error('usage: node scripts/diagram-audit/lint.mjs --ids a,b,c --out lint.json [--fix]');
  process.exit(2);
}

const { lintBlock } = await siblingImport(path.join('tools', 'tikz-audit', 'lib', 'rules.mjs'));
const { fixBlock } = await siblingImport(path.join('tools', 'tikz-audit', 'lib', 'fixes.mjs'));

const idSet = new Set(ids);
const blocks = collectBlocks(path.join(ROOT, 'public'), id => idSet.has(id));
console.log(`${blocks.length} [tikz] block(s) across ${ids.length} skill(s)`);

const findings = [];
for (const block of blocks) {
  const hits = lintBlock(block.body);
  if (!hits.length) continue;
  findings.push({
    skillId: block.skillId,
    file: block.file,
    where: block.where,
    blockIndex: block.blockIndex,
    findings: hits,
  });
}

fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ ids, blockCount: blocks.length, findings }, null, 2));

const byRule = {};
for (const f of findings) for (const h of f.findings) byRule[h.rule || h.id || 'unknown'] = (byRule[h.rule || h.id || 'unknown'] || 0) + 1;
console.log(`${findings.length} block(s) with findings → ${outFile}`);
for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`  ${rule}: ${n}`);

if (applyFixes) {
  console.log('\n--fix: mechanical fixes are applied via the redraw splice path — build a');
  console.log('defect list from the mechanical findings and run apply-redraws with fixBlock');
  console.log(`output (sibling fixes.mjs loaded OK: ${typeof fixBlock === 'function'}).`);
}
