// Wave 3: collect generated content from an agy tasks dir into public/.
//
//   node scripts/agy/collect-gen.mjs --tasks-dir .agywork/W3-1/gen [--dry-run]
//
// Reads <tasks-dir>/out/{id}.content.json + {id}.quiz.json + {id}.report.json (the output
// contract stated in every generation task file), parses them BOM/fence tolerant, rejects
// raw control characters inside JSON strings (the \t / \f corruption trap from Wave 2 —
// a literal tab inside a string means the model emitted an unescaped control char and
// neighbouring escapes are suspect), copies content/quiz into public/content|quizzes, runs
// scripts/validate.mjs --only over the collected ids, and prints the per-skill report table.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stripBom } from './lib/agy-run.mjs';
import { findRawControlChars } from './lib/json-splice.mjs';

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const dryRun = process.argv.includes('--dry-run');
const tasksDir = path.resolve(arg('--tasks-dir', ''));
const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

if (!arg('--tasks-dir', '')) {
  console.error('usage: node scripts/agy/collect-gen.mjs --tasks-dir <dir> [--dry-run]');
  process.exit(2);
}
const outDir = path.join(tasksDir, 'out');
if (!fs.existsSync(outDir)) {
  console.error(`✗ no out/ directory in ${tasksDir}`);
  process.exit(1);
}

function loadOutFile(file) {
  const raw = stripBom(fs.readFileSync(file, 'utf8'));
  let body = raw.trim();
  const fenced = body.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (fenced) body = fenced[1].trim();
  const bad = findRawControlChars(body);
  if (bad.length) throw new Error(`${path.basename(file)}: ${bad.length} raw control character(s) inside JSON strings (first at index ${bad[0].index}, code ${bad[0].code}) — reject and route to repair`);
  return { body, parsed: JSON.parse(body) };
}

const contentFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.content.json')).sort();
if (!contentFiles.length) {
  console.error(`✗ no *.content.json files in ${outDir}`);
  process.exit(1);
}

const collected = [];
const failures = [];
for (const cf of contentFiles) {
  const id = cf.replace(/\.content\.json$/, '');
  const qf = path.join(outDir, `${id}.quiz.json`);
  const rf = path.join(outDir, `${id}.report.json`);
  try {
    if (!fs.existsSync(qf)) throw new Error(`${id}: content present but quiz missing`);
    const content = loadOutFile(path.join(outDir, cf));
    const quiz = loadOutFile(qf);
    let report = null;
    try { report = fs.existsSync(rf) ? loadOutFile(rf).parsed : null; } catch { report = { error: 'report unparseable' }; }
    collected.push({ id, content, quiz, report });
  } catch (error) {
    failures.push({ id, reason: error.message });
  }
}

for (const f of failures) console.log(`✗ ${f.id}: ${f.reason}`);
if (dryRun) {
  console.log(`dry-run: ${collected.length} skill(s) would be copied, ${failures.length} rejected`);
  process.exit(failures.length ? 1 : 0);
}

for (const { id, content, quiz } of collected) {
  fs.writeFileSync(path.join(rootDir, 'public', 'content', `${id}.json`), content.body + '\n');
  fs.writeFileSync(path.join(rootDir, 'public', 'quizzes', `${id}.json`), quiz.body + '\n');
}
console.log(`copied ${collected.length} skill(s) into public/content + public/quizzes`);

if (collected.length) {
  const ids = collected.map(c => c.id).join(',');
  try {
    execFileSync(process.execPath, [path.join(rootDir, 'scripts', 'validate.mjs'), '--only', ids], { stdio: 'inherit', cwd: rootDir });
  } catch {
    console.error('✗ validate.mjs reported problems — see above');
    process.exitCode = 1;
  }
}

console.log('\nPer-skill reports:');
for (const { id, report } of collected) {
  if (!report) { console.log(`  ${id}: (no report file)`); continue; }
  const types = Array.isArray(report.structuralTypes) ? report.structuralTypes.length : '?';
  const cases = Array.isArray(report.cases) ? report.cases.length : '?';
  const errata = Array.isArray(report.bookletErrata) ? report.bookletErrata.length : 0;
  console.log(`  ${id}: ${types} structural type(s), ${cases} case(s), ${errata} booklet errata`);
  for (const e of (report.bookletErrata || [])) console.log(`      errata: ${typeof e === 'string' ? e : JSON.stringify(e)}`);
}
if (failures.length) process.exitCode = 1;
