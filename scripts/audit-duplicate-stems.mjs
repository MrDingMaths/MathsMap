#!/usr/bin/env node
// Audits for duplicate question stems across quizzes and practice cards.
//
// The validator only checks each file's internal shape; it cannot see that
// the SAME wording was reused where it shouldn't be:
//
//   * QUIZ-COPIES-PRACTICE — a quiz item and a practice card of the same
//     skill share a stem, so a student who did the practice card sees the
//     "test" as an answer key;
//   * INTRA-FILE-DUP — two quiz items, or two practice cards (possibly in
//     different tiers), of the SAME skill share a stem — wasted item slots;
//   * CROSS-SKILL-DUP — two different skills share a stem — usually a
//     copy/paste seed that was never re-authored for its own skill.
//
// A NEAR-DUP advisory (token-set Jaccard >= 0.85, not exact-equal) is also
// reported, but never counts toward the --strict exit code: it is meant to
// surface likely near-clones for human triage, not to be a hard gate.
//
// Usage:
//   node scripts/audit-duplicate-stems.mjs                 # all skills
//   node scripts/audit-duplicate-stems.mjs --only id1,id2   # ids or prefix
//   node scripts/audit-duplicate-stems.mjs --strict         # exit 1 on defects
//   node scripts/audit-duplicate-stems.mjs --dir <root>      # test override
//
// See docs/content-generation.md and docs/content-schema.md.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rejectStrayPositionals } from './lib/argv.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

// --only id1,id2,... | prefix — ids or prefix match (mirrors audit-equivalent-options.mjs).
function parseOnlyArg(argv) {
  const idx = argv.indexOf('--only');
  if (idx === -1 || idx === argv.length - 1) return null;
  const raw = argv[idx + 1];
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return (id) => ids.some((want) => id === want || id.startsWith(want));
}

function parseDirArg(argv) {
  const idx = argv.indexOf('--dir');
  if (idx === -1 || idx === argv.length - 1) return null;
  return argv[idx + 1];
}

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, { valueFlags: ['--only', '--dir'], boolFlags: ['--strict'] });
const filterFn = parseOnlyArg(argv);
const strict = argv.includes('--strict');
const dirArg = parseDirArg(argv);

const baseDir = dirArg ? join(rootDir, dirArg) : join(rootDir, 'public');
const quizzesDir = join(baseDir, 'quizzes');
const contentDir = join(baseDir, 'content');

// Normalises a stem for exact-duplicate comparison. Keeps [tikz] block
// content (it's part of the stem — two items with the same wording but
// different diagrams are NOT duplicates, and this normalisation still
// distinguishes them since the tikz body differs).
function normaliseStem(text) {
  return String(text)
    .toLowerCase()
    .replace(/\\left|\\right/g, '')
    .replace(/\\dfrac|\\tfrac/g, '\\frac')
    .replace(/[${}]/g, '')
    .replace(/[.,;:!?'"()‘’“”]/g, '')
    .replace(/\s+/g, '');
}

// Display-only: collapse whitespace, replace tikz blocks with a placeholder, truncate.
function displayStem(text) {
  return String(text)
    .replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '[figure]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

// Tokens for Jaccard near-dup comparison: split on anything that isn't
// a-z, 0-9 or backslash (keeps LaTeX macro names and digit tokens intact).
function tokenSet(normStem) {
  return new Set(normStem.split(/[^a-z0-9\\]+/).filter(Boolean));
}

function jaccard(a, b) {
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function listJsonFiles(dir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

const quizFiles = listJsonFiles(quizzesDir).filter((f) => !filterFn || filterFn(f.replace(/\.json$/, '')));
const contentFiles = listJsonFiles(contentDir).filter((f) => !filterFn || filterFn(f.replace(/\.json$/, '')));
const skillIds = new Set([
  ...quizFiles.map((f) => f.replace(/\.json$/, '')),
  ...contentFiles.map((f) => f.replace(/\.json$/, '')),
]);

// entries: { skillId, source, itemId, raw, norm }
const entries = [];
let itemsScanned = 0;

for (const skillId of [...skillIds].sort()) {
  const quizPath = join(quizzesDir, `${skillId}.json`);
  if (quizFiles.includes(`${skillId}.json`)) {
    let quiz;
    try {
      quiz = JSON.parse(readFileSync(quizPath, 'utf8'));
    } catch (err) {
      console.error(`  ✗ quiz ${skillId}: unreadable (${err.message})`);
      quiz = null;
    }
    if (quiz) {
      for (const q of quiz.questions || []) {
        const raw = String(q.question_text || '');
        entries.push({ skillId, source: 'quiz', itemId: q.id, raw, norm: normaliseStem(raw) });
        itemsScanned++;
      }
    }
  }

  const contentPath = join(contentDir, `${skillId}.json`);
  if (contentFiles.includes(`${skillId}.json`)) {
    let content;
    try {
      content = JSON.parse(readFileSync(contentPath, 'utf8'));
    } catch (err) {
      console.error(`  ✗ content ${skillId}: unreadable (${err.message})`);
      content = null;
    }
    if (content) {
      const practice = content.practice || {};
      for (const tier of ['foundation', 'development', 'mastery']) {
        const cards = Array.isArray(practice[tier]) ? practice[tier] : [];
        cards.forEach((card, i) => {
          const raw = String(card?.question_text || '');
          const itemId = `${tier[0]}${i + 1}`;
          entries.push({ skillId, source: tier, itemId, raw, norm: normaliseStem(raw) });
          itemsScanned++;
        });
      }
    }
  }
}

// --- exact-duplicate buckets ---------------------------------------------
const buckets = new Map();
for (const e of entries) {
  if (!e.norm) continue;
  if (!buckets.has(e.norm)) buckets.set(e.norm, []);
  buckets.get(e.norm).push(e);
}

const isCardSource = (s) => s === 'foundation' || s === 'development' || s === 'mastery';

// Classify each unordered pair within a bucket, precedence a > b > c.
function classifyPair(x, y) {
  const sameSkill = x.skillId === y.skillId;
  if (sameSkill) {
    const xCard = isCardSource(x.source);
    const yCard = isCardSource(y.source);
    if (xCard !== yCard) return 'QUIZ-COPIES-PRACTICE'; // one quiz, one card
    return 'INTRA-FILE-DUP'; // quiz+quiz, or card+card (any tiers)
  }
  return 'CROSS-SKILL-DUP';
}

const defectsByKind = { 'QUIZ-COPIES-PRACTICE': [], 'INTRA-FILE-DUP': [], 'CROSS-SKILL-DUP': [] };

for (const [norm, group] of buckets) {
  if (group.length < 2) continue;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const kind = classifyPair(group[i], group[j]);
      defectsByKind[kind].push({ a: group[i], b: group[j], norm });
    }
  }
}

// --- near-dup advisory -----------------------------------------------------
// Only compare pairs that are NOT already exact-equal (different norm), and
// only within the scanned set (same skill, or across skills in the set).
const nearDups = [];
const entryList = entries.filter((e) => e.norm);
for (let i = 0; i < entryList.length; i++) {
  const a = entryList[i];
  const tokensA = tokenSet(a.norm);
  for (let j = i + 1; j < entryList.length; j++) {
    const b = entryList[j];
    if (a.norm === b.norm) continue; // exact dups already handled above
    const tokensB = tokenSet(b.norm);
    const ratio = tokensA.size === 0 || tokensB.size === 0
      ? 0
      : Math.min(tokensA.size, tokensB.size) / Math.max(tokensA.size, tokensB.size);
    if (ratio < 0.5) continue; // cheap prefilter
    const sim = jaccard(tokensA, tokensB);
    if (sim >= 0.85) nearDups.push({ a, b, sim });
  }
}

// --- report ------------------------------------------------------------
function printPair(kind, a, b, norm) {
  console.log(`✗ ${kind}`);
  console.log(`    ${a.skillId} ${a.itemId} == ${b.skillId} ${b.itemId}`);
  console.log(`    stem: ${displayStem(a.raw)}`);
}

let totalDefects = 0;
for (const kind of ['QUIZ-COPIES-PRACTICE', 'INTRA-FILE-DUP', 'CROSS-SKILL-DUP']) {
  for (const { a, b, norm } of defectsByKind[kind]) {
    printPair(kind, a, b, norm);
    totalDefects++;
  }
}

if (nearDups.length) {
  console.log('\nAdvisory (NEAR-DUP, not counted toward --strict):');
  for (const { a, b, sim } of nearDups) {
    console.log(`  ~ ${a.skillId} ${a.itemId} ~= ${b.skillId} ${b.itemId}  (jaccard ${sim.toFixed(2)})`);
    console.log(`    stem: ${displayStem(a.raw)}`);
  }
}

console.log(
  `\nScanned ${itemsScanned} item(s) across ${skillIds.size} skill(s) ` +
    `(${quizFiles.length} quiz file(s), ${contentFiles.length} content file(s)).`,
);
console.log(
  `QUIZ-COPIES-PRACTICE: ${defectsByKind['QUIZ-COPIES-PRACTICE'].length}, ` +
    `INTRA-FILE-DUP: ${defectsByKind['INTRA-FILE-DUP'].length}, ` +
    `CROSS-SKILL-DUP: ${defectsByKind['CROSS-SKILL-DUP'].length}. ` +
    `NEAR-DUP advisory: ${nearDups.length}.`,
);

if (totalDefects) {
  console.log(`\n✗ ${totalDefects} duplicate-stem defect(s).`);
  if (strict) process.exit(1);
} else {
  console.log('\n✓ No duplicate-stem defects.');
}
