// Render ONLY the theory figures of a set of skills.
//
//   node scripts/render-theory-figures.mjs --ids a,b,c --out .agywork/<batch>/theory-figs
//   node scripts/render-theory-figures.mjs --all-stage 4 --out .agywork/stage4-theory-figs
//
// WHY. `scripts/diagram-audit/render.mjs --ids …` renders every TikZ block a skill owns —
// question figures, solution figures, quiz figures — so verifying the handful of THEORY figures
// a batch just added means shooting hundreds of blocks that nothing changed. Nineteen skills
// came to 320 blocks and outran a nine-minute window; the theory pass only ever needs the
// theory ones. This collects just those and feeds them to shoot-tikz through its `--input`
// path, which renders an arbitrary block list.
//
// The input file must live under public/ for the dev server to serve it; it is removed after
// the run.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extractTikz } from './lib/tikz-blocks.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '');
const readJson = (f) => JSON.parse(read(f));

function arg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const out = arg('--out');
const idsArg = arg('--ids');
const stage = arg('--all-stage');
if (!out || (!idsArg && !stage)) {
  console.error('usage: render-theory-figures.mjs (--ids a,b,c | --all-stage 4) --out <dir>');
  process.exit(2);
}

let ids;
if (idsArg) {
  ids = idsArg.split(',').map((s) => s.trim()).filter(Boolean);
} else {
  const skillsRaw = readJson(path.join(rootDir, 'data', 'skills.json'));
  const list = Array.isArray(skillsRaw) ? skillsRaw : skillsRaw.skills;
  ids = list.filter((s) => String(s.stage) === String(stage)).map((s) => s.id);
}

const items = [];
for (const id of ids) {
  const p = path.join(rootDir, 'public', 'content', `${id}.json`);
  if (!fs.existsSync(p)) continue;
  const theory = readJson(p).theory;
  if (!theory) continue;
  const fields = [
    ['intro', theory.intro],
    ...(theory.facts || []).map((t, i) => [`facts[${i}]`, t]),
    ...(theory.steps || []).map((t, i) => [`steps[${i}]`, t]),
  ];
  for (const [where, text] of fields) {
    extractTikz(text).forEach((code, j) => items.push({
      skillId: id,
      kind: 'theory',
      field: `theory.${where}[${j}]`,
      questionId: `${id}:theory.${where}[${j}]`,
      q: String(text).replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '').trim(),
      a: '',
      code,
    }));
  }
}

if (!items.length) {
  console.log('no theory figures in that set — nothing to render');
  process.exit(0);
}

const inputDir = path.join(rootDir, 'public', '.audit-input');
fs.mkdirSync(inputDir, { recursive: true });
const inputFile = path.join(inputDir, `theory-render-${process.pid}.json`);
fs.writeFileSync(inputFile, JSON.stringify({ items }, null, 2) + '\n');

const serverFile = path.join(rootDir, '.agywork', 'dev-server.json');
const base = fs.existsSync(serverFile) ? readJson(serverFile).base : 'http://localhost:5173';

console.log(`${items.length} theory figure(s) across ${new Set(items.map((i) => i.skillId)).size} skill(s) → ${out}`);
try {
  execFileSync(process.execPath, [
    path.join(rootDir, 'scripts', 'shoot-tikz.mjs'),
    '--input', inputFile,
    '--batch-size', arg('--batch-size', '12'),
    '--out', path.resolve(out),
    '--base', base,
  ], { stdio: 'inherit' });
} finally {
  fs.rmSync(inputFile, { force: true });
}
