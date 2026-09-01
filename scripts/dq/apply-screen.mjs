#!/usr/bin/env node
// Merge agy screening results into the two files `process-candidates.mjs` consumes.
//
//   node scripts/dq/apply-screen.mjs --tasks-dir .agywork/dq-t-s4-alg \
//     --structure-map .diagnostic-questions/structure-map-t-s4-alg.json \
//     --exclusions .diagnostic-questions/exclusions-t-s4-alg.txt
//
// Refuses to write a partial merge: every id the tasks asked about must appear in exactly one
// result, with a usable verdict and a kebab-case slug. A screen that silently dropped
// candidates would quietly promote them unmapped.

import { promises as fs } from 'node:fs';
import fsSync from 'node:fs';
import path from 'node:path';
import { parseResultFile, stripBom } from '../agy/lib/agy-run.mjs';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function arg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const tasksDir = path.resolve(arg('--tasks-dir') ?? '');
  const mapPath = arg('--structure-map');
  const exclusionsPath = arg('--exclusions');
  if (!arg('--tasks-dir') || !mapPath || !exclusionsPath) {
    console.error('usage: node scripts/dq/apply-screen.mjs --tasks-dir <dir> --structure-map <file> --exclusions <file>');
    process.exit(2);
  }

  const files = (await fs.readdir(tasksDir)).filter((f) => /^task-\d+\.ids\.json$/.test(f)).sort();
  if (!files.length) throw new Error(`no task ids files in ${tasksDir}`);

  const expected = [];
  const verdicts = new Map();
  const problems = [];

  for (const idsFile of files) {
    const base = idsFile.replace(/\.ids\.json$/, '');
    const { ids } = JSON.parse(stripBom(await fs.readFile(path.join(tasksDir, idsFile), 'utf8')));
    expected.push(...ids.map(String));

    const resultPath = path.join(tasksDir, `${base}.result.json`);
    if (!fsSync.existsSync(resultPath)) {
      problems.push(`${base}: no result file — rerun run-gen.mjs for this task`);
      continue;
    }
    let result;
    try { result = parseResultFile(resultPath); } catch (error) {
      problems.push(`${base}: result is not valid JSON — ${error.message}`);
      continue;
    }
    for (const entry of result.candidates ?? []) {
      const id = String(entry.id ?? '');
      if (!id) { problems.push(`${base}: an entry has no id`); continue; }
      if (verdicts.has(id)) { problems.push(`${id}: screened twice`); continue; }
      if (entry.verdict !== 'keep' && entry.verdict !== 'reject') {
        problems.push(`${id}: verdict is ${JSON.stringify(entry.verdict)}, expected "keep" or "reject"`);
        continue;
      }
      if (entry.verdict === 'keep' && !SLUG.test(String(entry.structure ?? ''))) {
        problems.push(`${id}: kept but structure ${JSON.stringify(entry.structure)} is not a kebab-case slug`);
        continue;
      }
      if (entry.verdict === 'reject' && !String(entry.reason ?? '').trim()) {
        problems.push(`${id}: rejected with no reason`);
        continue;
      }
      verdicts.set(id, entry);
    }
  }

  const missing = expected.filter((id) => !verdicts.has(id));
  if (missing.length) problems.push(`${missing.length} candidate(s) never screened: ${missing.slice(0, 15).join(', ')}${missing.length > 15 ? ' …' : ''}`);
  const extra = [...verdicts.keys()].filter((id) => !expected.includes(id));
  if (extra.length) problems.push(`${extra.length} screened id(s) were never asked about: ${extra.slice(0, 15).join(', ')}`);

  if (problems.length) {
    console.error('[dq-screen] refusing to write a partial merge:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const structureMap = {};
  const rejected = [];
  const byClass = new Map();
  for (const id of expected) {
    const entry = verdicts.get(id);
    if (entry.verdict === 'reject') {
      rejected.push(id);
      const cls = String(entry.reason).split(':')[0].trim() || 'unclassified';
      byClass.set(cls, (byClass.get(cls) ?? 0) + 1);
    } else {
      structureMap[id] = entry.structure;
    }
  }

  await fs.writeFile(path.resolve(mapPath), `${JSON.stringify(structureMap, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.resolve(exclusionsPath), `${rejected.join(',')}\n`, 'utf8');

  const kept = expected.length - rejected.length;
  console.log(`[dq-screen] ${expected.length} screened: ${kept} kept, ${rejected.length} rejected`);
  for (const [cls, n] of [...byClass].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${cls}`);
  console.log(`[dq-screen] structure map -> ${mapPath}`);
  console.log(`[dq-screen] exclusions    -> ${exclusionsPath}`);
  console.log(`[dq-screen] distinct slugs: ${new Set(Object.values(structureMap)).size}`);
}

main().catch((error) => {
  console.error(`[dq-screen] ${error.message}`);
  process.exitCode = 1;
});
