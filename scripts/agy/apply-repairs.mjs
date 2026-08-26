// Wave 3: splice agy repair results back into public/content|quizzes, byte-preserving
// everything but the replaced items, then re-run the deterministic validate over the
// touched skills.
//
//   node scripts/agy/apply-repairs.mjs --tasks-dir .agywork/W3-1/repair [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseResultFile } from './lib/agy-run.mjs';
import { spliceQuizItem, splicePracticeItem } from './lib/json-splice.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const dryRun = process.argv.includes('--dry-run');
const tasksDir = path.resolve(arg('--tasks-dir', ''));
if (!arg('--tasks-dir', '')) {
  console.error('usage: node scripts/agy/apply-repairs.mjs --tasks-dir <dir> [--dry-run]');
  process.exit(2);
}

const resultFiles = fs.readdirSync(tasksDir).filter(f => /^task-\d+\.result\.json$/.test(f)).sort();
if (!resultFiles.length) {
  console.error(`✗ no task-*.result.json files in ${tasksDir}`);
  process.exit(1);
}

const touched = new Set();
let applied = 0;
let failed = 0;
for (const rf of resultFiles) {
  let result;
  try { result = parseResultFile(path.join(tasksDir, rf)); } catch (error) {
    console.error(`✗ ${rf}: unparseable — ${error.message}`);
    failed++;
    continue;
  }
  const { skillId, repairs } = result;
  if (!skillId || !Array.isArray(repairs)) { console.error(`✗ ${rf}: missing skillId/repairs`); failed++; continue; }
  for (const r of repairs) {
    const t = r.target || {};
    const file = path.join(rootDir, 'public', t.file === 'quiz' ? 'quizzes' : 'content', `${skillId}.json`);
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const next = t.file === 'quiz'
        ? spliceQuizItem(raw, t.itemId, r.replacement)
        : splicePracticeItem(raw, t.tier, t.index, r.replacement);
      if (!dryRun) fs.writeFileSync(file, next);
      touched.add(skillId);
      applied++;
      const address = t.file === 'quiz' ? `quiz ${t.itemId}` : `practice.${t.tier}[${t.index}]`;
      console.log(`✓ ${skillId} ${address}${dryRun ? ' (dry-run)' : ''}`);
    } catch (error) {
      console.error(`✗ ${skillId} ${JSON.stringify(t)}: ${error.message}`);
      failed++;
    }
  }
}

console.log(`\n${applied} repair(s) applied to ${touched.size} skill(s), ${failed} failed`);
if (!dryRun && touched.size) {
  try {
    execFileSync(process.execPath, [path.join(rootDir, 'scripts', 'validate.mjs'), '--only', [...touched].join(',')], { stdio: 'inherit', cwd: rootDir });
  } catch {
    console.error('✗ validate.mjs reported problems — see above');
    process.exitCode = 1;
  }
}
if (failed) process.exitCode = 1;
