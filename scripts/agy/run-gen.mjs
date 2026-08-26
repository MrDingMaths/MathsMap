// Wave 3: run a directory of generation/repair/audit task files through agy.
//
//   node scripts/agy/run-gen.mjs --tasks-dir .agywork/W3-1/gen [--model gemini-3.7-flash-high] [--concurrency 3]
//
// Wave 3 runs gemini-3.7-flash-high (the default) on every lane — owner decision
// 2026-08-26, no pro tier.
//
// Thin CLI over scripts/agy/lib/agy-run.mjs runTasks — resume-safe (tasks with a valid,
// id-reconciled result file are skipped), ledger to <tasks-dir>/ledger.jsonl.

import path from 'node:path';
import process from 'node:process';
import { runTasks, OAuthExpiredError } from './lib/agy-run.mjs';

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const tasksDir = arg('--tasks-dir', '');
const model = arg('--model', 'gemini-3.7-flash-high');
const concurrency = Number(arg('--concurrency', '3'));

if (!tasksDir) {
  console.error('usage: node scripts/agy/run-gen.mjs --tasks-dir <dir> [--model id] [--concurrency N]');
  process.exit(2);
}

try {
  const { skipped, results, ok } = await runTasks(path.resolve(tasksDir), { model, concurrency });
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length} run, ${skipped.length} skipped (already complete), ${failed.length} failed`);
  for (const f of failed) console.log(`  FAIL ${f.file}: ${f.reason}`);
  process.exit(ok ? 0 : 1);
} catch (error) {
  if (error instanceof OAuthExpiredError) {
    console.error(`\n✗ ${error.message}`);
    process.exit(3);
  }
  throw error;
}
