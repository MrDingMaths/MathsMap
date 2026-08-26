// Targeted blind re-check of the items a repair pass actually touched.
//
//   node scripts/recheck-repairs.mjs --tasks-dir .agywork/W3-1/repair-check [--dry-run]
//
// WHY. A repair can fix the flagged defect and introduce a different one: in W3-1 a repaired
// BAC question came back with the formula yielding a negative value, whose "effective BAC is
// 0.000" reading and whose raw -0.024 reading were BOTH in the option list — one defensible
// answer replaced by two. The deterministic gate cannot see that, and nothing re-ran the
// checker over repaired items, so it was caught only by reading. This closes that loop.
//
// For each skill touched by the repair tasks it rebuilds the blind bundle restricted to the
// repaired item ids (`blind-for-check --items`, which still shows the untouched siblings as
// context for duplication judgements), re-runs the checker over just those, and compares.
//
// Only QUIZ questions and MASTERY practice cards are checkable — the blind bundle covers
// those. A repair to a foundation/development practice card is reported as unchecked rather
// than silently passing.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseResultFile } from './agy/lib/agy-run.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const tasksDir = path.resolve(arg('--tasks-dir', ''));
const dryRun = process.argv.includes('--dry-run');
const checker = arg('--checker', 'sonnet'); // sonnet | luna
if (!arg('--tasks-dir', '')) {
  console.error('usage: node scripts/recheck-repairs.mjs --tasks-dir <repair-tasks-dir> [--checker sonnet|luna] [--dry-run]');
  process.exit(2);
}

// Map a repair target onto the id the blind bundle uses.
export function blindItemId(target) {
  if (!target) return null;
  if (target.file === 'quiz') return target.itemId || null;
  if (target.tier === 'mastery' && Number.isInteger(target.index)) return `m${target.index + 1}`;
  return null; // foundation/development cards are not part of the blind bundle
}

const bySkill = new Map();
const unchecked = [];
for (const f of fs.readdirSync(tasksDir).filter(x => /^task-\d+\.result\.json$/.test(x)).sort()) {
  let result;
  try { result = parseResultFile(path.join(tasksDir, f)); } catch (error) {
    console.error(`✗ ${f}: ${error.message}`);
    continue;
  }
  for (const r of result.repairs || []) {
    const id = blindItemId(r.target);
    const label = `${result.skillId} ${JSON.stringify(r.target)}`;
    if (!id) { unchecked.push(label); continue; }
    if (!bySkill.has(result.skillId)) bySkill.set(result.skillId, new Set());
    bySkill.get(result.skillId).add(id);
  }
}

if (!bySkill.size) {
  console.log('nothing re-checkable in this repair pass');
  for (const u of unchecked) console.log(`  (not in blind bundle, unchecked) ${u}`);
  process.exit(0);
}

console.log(`re-checking ${[...bySkill.values()].reduce((n, s) => n + s.size, 0)} repaired item(s) across ${bySkill.size} skill(s):`);
for (const [skillId, ids] of bySkill) console.log(`  ${skillId}: ${[...ids].join(',')}`);
for (const u of unchecked) console.log(`  (not in blind bundle, unchecked) ${u}`);
if (dryRun) process.exit(0);

const run = (script, args) =>
  execFileSync(process.execPath, [path.join(rootDir, 'scripts', script), ...args], { stdio: 'inherit', cwd: rootDir });

for (const [skillId, ids] of bySkill) {
  run('blind-for-check.mjs', [skillId, '--items', [...ids].join(',')]);
}

const skillList = [...bySkill.keys()].join(',');
run(checker === 'luna' ? 'run-luna-check.mjs' : 'run-sonnet-check.mjs', ['--skills', skillList]);
run('run-luna-check.mjs', ['--compare', skillList]);

console.log('\nRe-check complete. Read the compare output above: a mismatch or a flag on a');
console.log('REPAIRED item means the repair introduced a new defect — adjudicate before committing.');
