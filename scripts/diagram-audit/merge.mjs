// Wave 3 diagram lane: merge per-packet audit results into one verdicts.json.
//
//   node scripts/diagram-audit/merge.mjs --tasks-dir <audit-tasks-dir> --out verdicts.json

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseResultFile } from '../agy/lib/agy-run.mjs';

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const tasksDir = path.resolve(arg('--tasks-dir', ''));
const outFile = arg('--out', '');
if (!arg('--tasks-dir', '') || !outFile) {
  console.error('usage: node scripts/diagram-audit/merge.mjs --tasks-dir <dir> --out verdicts.json');
  process.exit(2);
}

const files = fs.readdirSync(tasksDir).filter(f => /^task-\d+\.result\.json$/.test(f)).sort();
const verdicts = [];
const problems = [];
for (const f of files) {
  try {
    const arr = parseResultFile(path.join(tasksDir, f));
    if (!Array.isArray(arr)) throw new Error('not an array');
    verdicts.push(...arr);
  } catch (error) {
    problems.push({ file: f, reason: error.message });
  }
}
fs.writeFileSync(outFile, JSON.stringify({ verdicts, problems }, null, 2));

const counts = {};
for (const v of verdicts) counts[v.verdict] = (counts[v.verdict] || 0) + 1;
console.log(`${verdicts.length} verdict(s) from ${files.length} packet(s) → ${outFile}`);
for (const [k, n] of Object.entries(counts)) console.log(`  ${k}: ${n}`);
for (const p of problems) console.log(`  ✗ ${p.file}: ${p.reason}`);
if (problems.length) process.exitCode = 1;
