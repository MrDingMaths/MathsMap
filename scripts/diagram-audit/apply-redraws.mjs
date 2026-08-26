// Wave 3 diagram lane: splice redraw results back into public/content|quizzes.
//
//   node scripts/diagram-audit/apply-redraws.mjs --tasks-dir <redraw-tasks-dir> [--dry-run]
//
// Uses redraw-index.json (written by build-redraw-tasks.mjs) to map each result id back to
// (file, where, blockIndex), replaces exactly that [tikz] block inside the field string,
// and rewrites the JSON document (2-space indent — these files are machine-generated).
// After applying, re-render + re-lint + re-audit only the changed blocks (max 2 rounds,
// then human).

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseResultFile } from '../agy/lib/agy-run.mjs';
import { ROOT, replaceTikzBlock, fieldAccessor } from './lib/audit-lib.mjs';

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const dryRun = process.argv.includes('--dry-run');
const tasksDir = path.resolve(arg('--tasks-dir', ''));
if (!arg('--tasks-dir', '')) {
  console.error('usage: node scripts/diagram-audit/apply-redraws.mjs --tasks-dir <dir> [--dry-run]');
  process.exit(2);
}

const { rows } = JSON.parse(fs.readFileSync(path.join(tasksDir, 'redraw-index.json'), 'utf8'));
const byId = new Map(rows.map(r => [r.redrawId, r]));

const resultFiles = fs.readdirSync(tasksDir).filter(f => /^task-\d+\.result\.json$/.test(f)).sort();
let applied = 0;
let failed = 0;
const touchedSkills = new Set();
for (const rf of resultFiles) {
  let parsed;
  try { parsed = parseResultFile(path.join(tasksDir, rf)); } catch (error) {
    console.error(`✗ ${rf}: ${error.message}`); failed++; continue;
  }
  for (const r of parsed.results || []) {
    const row = byId.get(r.id);
    if (!row) { console.error(`✗ ${rf}: unknown redraw id ${r.id}`); failed++; continue; }
    if (typeof r.newSource !== 'string' || !r.newSource.trim()) { console.error(`✗ ${r.id}: empty newSource`); failed++; continue; }
    const file = path.join(ROOT, 'public', row.file);
    try {
      const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
      const acc = fieldAccessor(doc, row.where);
      acc.set(replaceTikzBlock(acc.get(), row.blockIndex, r.newSource));
      if (!dryRun) fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
      touchedSkills.add(row.skillId);
      applied++;
      console.log(`✓ ${r.id} → ${row.skillId} ${row.where} block ${row.blockIndex}${dryRun ? ' (dry-run)' : ''}`);
    } catch (error) {
      console.error(`✗ ${r.id}: ${error.message}`); failed++;
    }
  }
}
console.log(`\n${applied} redraw(s) applied across ${touchedSkills.size} skill(s), ${failed} failed`);
if (touchedSkills.size) console.log(`re-check: node scripts/diagram-audit/render.mjs --ids ${[...touchedSkills].join(',')} --out <new-captures> ; then lint + packets on the same ids`);
if (failed) process.exitCode = 1;
