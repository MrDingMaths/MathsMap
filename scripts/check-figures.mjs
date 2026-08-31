// Wave 3 (W3-2R, figures lane): gate the question-figure results before apply-repairs runs.
//
//   node scripts/check-figures.mjs --tasks-dir .agywork/W3-2R/figures [--quarantine]
//
// A new question figure can fail in ways validate.mjs cannot see: it can drop an edge the stem
// stated, invent a weight, mark the answer on the picture, or collide its own labels. Each check
// below exists because that failure would otherwise reach a student.
//
// --quarantine rewrites failing repairs to `decision: "skip"` so the clean ones can be applied
// while the failures are regenerated.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseResultFile } from './agy/lib/agy-run.mjs';
import { parseNetworkFigure, findCrowdedVertices, figureFromQuestion } from './networks-steps.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));

function currentItem(skillId, target) {
  if (target.file === 'quiz') {
    const quiz = readJson(path.join(rootDir, 'public', 'quizzes', `${skillId}.json`));
    const q = (quiz.questions || []).find((x) => x.id === target.itemId);
    if (!q) throw new Error(`quiz item ${target.itemId} not found`);
    return q;
  }
  const content = readJson(path.join(rootDir, 'public', 'content', `${skillId}.json`));
  const item = content.practice?.[target.tier]?.[target.index];
  if (!item) throw new Error(`practice.${target.tier}[${target.index}] not found`);
  return item;
}

const stripTikz = (t) => String(t).replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '');
// Every number that appears as a weight in the stem, so the figure can be checked against it.
const weightsIn = (t) => (stripTikz(t).match(/\d+(?:\.\d+)?/g) || []).map(Number);

export function checkRepair(skillId, repair) {
  const faults = [];
  const before = currentItem(skillId, repair.target);
  const after = repair.replacement;

  if (!after || typeof after !== 'object') return ['decision "draw" but no replacement item'];

  // Nothing but question_text may move — a figure lane must not quietly rewrite the maths.
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (key === 'question_text') continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) faults.push(`"${key}" changed — only question_text may change`);
  }

  const code = figureFromQuestion(after.question_text);
  if (!code) return [...faults, 'replacement has no [tikz] block'];
  if ((after.question_text.match(/\[tikz\]/g) || []).length !== 1) faults.push('more than one [tikz] block');

  let fig;
  try { fig = parseNetworkFigure(code); } catch (error) { return [...faults, `figure does not parse: ${error.message}`]; }

  faults.push(...findCrowdedVertices(fig));

  // The figure must not mark the answer: no thickened edges, no Dijkstra label circles.
  if (/line width/.test(code)) faults.push('figure thickens an edge — a question figure must not mark the answer');
  if (/circle,\s*draw/.test(code)) faults.push('figure uses label circles — a question figure must not carry running totals');

  // Fidelity: every weight the stem stated must still be somewhere, and the figure must not
  // introduce a weight the item never mentioned.
  const stemNumbers = new Set(weightsIn(before.question_text));
  const figureWeights = (code.match(/\{\$(-?\d+(?:\.\d+)?)[^}]*\$\}/g) || [])
    .map((m) => Number(/(-?\d+(?:\.\d+)?)/.exec(m)[1]));
  // Numbers inside figures count as known, so re-checking an item whose figure is ALREADY
  // applied stays idempotent — by then the edge-list prose it came from is gone from the stem,
  // and the weights live only in the figures.
  const allNumbers = (t) => (String(t).match(/\d+(?:\.\d+)?/g) || []).map(Number);
  const known = new Set([
    ...stemNumbers, ...weightsIn(after.question_text),
    ...allNumbers(before.question_text), ...allNumbers(before.solution_text),
  ]);
  for (const w of figureWeights) {
    if (!known.has(w)) faults.push(`figure shows weight ${w}, which appears nowhere in the item`);
  }
  // Only a number the stem states as an EDGE WEIGHT has to appear in the figure — a vertex pair
  // equals a number (`$AB=8$`) or a directed edge carries one (`$S\to A\,(7)$`). A bare `= 19`
  // is usually a route TOTAL ("8 min + 11 min = 19 min"), which the figure must NOT show.
  const drawn = new Set(figureWeights);
  const stem = stripTikz(before.question_text);
  const statedWeights = new Set([
    ...(stem.match(/\b[A-Z]\w?\s*[A-Z]\w?\s*=\s*(\d+(?:\.\d+)?)/g) || []).map((m) => Number(/(\d+(?:\.\d+)?)$/.exec(m)[1])),
    ...(stem.match(/\\to\s*\w+\s*\\?,?\s*\((\d+(?:\.\d+)?)\)/g) || []).map((m) => Number(/\((\d+(?:\.\d+)?)\)/.exec(m)[1])),
  ]);
  const missing = [...statedWeights].filter((n) => !drawn.has(n));
  if (missing.length) faults.push(`stem states edge weight(s) ${missing.join(', ')} that the figure does not show`);

  return faults;
}

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function main() {
  const dirArg = arg('--tasks-dir', '');
  const quarantine = process.argv.includes('--quarantine');
  if (!dirArg) { console.error('usage: node scripts/check-figures.mjs --tasks-dir <dir> [--quarantine]'); process.exit(2); }
  const tasksDir = path.resolve(dirArg);

  let drawn = 0; let skipped = 0; let failed = 0;
  for (const rf of fs.readdirSync(tasksDir).filter((f) => /^task-\d+\.result\.json$/.test(f)).sort()) {
    const full = path.join(tasksDir, rf);
    let result;
    try { result = parseResultFile(full); } catch (error) { console.error(`✗ ${rf}: unparseable — ${error.message}`); failed++; continue; }
    let touched = false;
    for (const r of result.repairs || []) {
      const address = r.target?.file === 'quiz' ? `quiz ${r.target.itemId}` : `practice.${r.target?.tier}[${r.target?.index}]`;
      if (r.decision !== 'draw') { skipped++; console.log(`· ${result.skillId} ${address}: skip — ${r.reason || 'no reason given'}`); continue; }
      let faults;
      try { faults = checkRepair(result.skillId, r); } catch (error) { faults = [error.message]; }
      if (!faults.length) { drawn++; console.log(`✓ ${result.skillId} ${address}`); continue; }
      failed++;
      console.error(`✗ ${result.skillId} ${address}:`);
      faults.forEach((f) => console.error(`    ${f}`));
      if (quarantine) { r.decision = 'skip'; r.reason = `quarantined by check-figures: ${faults[0]}`; delete r.replacement; touched = true; }
    }
    if (touched) fs.writeFileSync(full, JSON.stringify(result, null, 2) + '\n');
  }

  console.log(`\n${drawn} figure(s) pass, ${skipped} item(s) skipped by the model, ${failed} failed${quarantine ? ' (quarantined to skip)' : ''}`);
  if (failed && !quarantine) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
