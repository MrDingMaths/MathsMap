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
//   * QUIZ-COPIES-PRACTICE-VALUES — a quiz item and a practice card of the
//     SAME skill are worded differently (so stem matching misses them) but
//     carry the same numeric literals and the same correct answer — a
//     reworded clone, not a fresh item. Caught blind in batch 16 (quiz items
//     that rephrased a mastery-card stem while keeping its numbers/answer).
//     A hit whose answers could NOT be canonicalised carries no answer evidence
//     at all — the signature is then the stem literals alone — and is demoted to
//     the QUIZ-COPIES-PRACTICE-VALUES-WEAK advisory rather than counted as a defect.
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
import { canonicalise } from './lib/canonical-option.mjs';

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
    // Prose punctuation only. Parentheses are NOT punctuation in a maths stem —
    // they are the whole point of a bracket-contrast pair, and stripping them
    // reported `$12+4\times\sqrt{9}$` and `$(12+4)\times\sqrt{9}$` (a deliberate
    // order-of-operations pair in order-operations-roots) as a duplicate.
    .replace(/[.,;:!?'"‘’“”]/g, '')
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

// --- value signature (for QUIZ-COPIES-PRACTICE-VALUES) --------------------
// Numeric literals in the RAW stem (decimals included; a plain fraction like
// "3/5" falls out as its two literals "3" and "5" — same as a \frac{3}{5}
// numerator/denominator pair). tikz coordinates are NOT excluded: this stays
// consistent with normaliseStem, which also treats [tikz] content as part of
// the stem.
function extractNumbers(raw) {
  const matches = String(raw).match(/\d+(?:\.\d+)?/g) || [];
  return matches.map(Number).filter((n) => Number.isFinite(n));
}

// The correct option's text for a quiz item.
function quizAnswerText(question) {
  const opts = Array.isArray(question.options) ? question.options : [];
  const correct = opts.find((o) => o && o.correct);
  return correct ? String(correct.text || '') : '';
}

// A practice card has no discrete answer field (docs/content-schema.md: "no
// separate answer... field") — the final line of solution_text states it, as
// the text after the last "=" (or the whole line for a word-answer card,
// which canonicalise() will then reject as unparseable).
function practiceAnswerText(card) {
  const solution = String(card?.solution_text || '');
  const lines = solution.split('\n').map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] || '';
  const eqIdx = last.lastIndexOf('=');
  return (eqIdx === -1 ? last : last.slice(eqIdx + 1)).trim();
}

// sig = sorted numeric literals from the stem + the canonical answer value.
// null when there's nothing to go on: fewer than 2 numeric literals is too
// weak a fingerprint on its own (false-positive prone — e.g. two unrelated
// items that both happen to mention "6"), and with 0 literals and no
// canonical answer there's nothing left to key on at all.
// Returns { sig, weak }. `weak` means canonicalise() could not parse the answer, so the
// signature is the STEM LITERALS ALONE — which the note above already calls too weak a
// fingerprint on its own. That is not a rare corner: measured over the whole 818-skill
// corpus, EVERY value-signature hit is weak, so the answer half has never actually
// discriminated anything. On a topic with a small literal vocabulary the collapse is
// catastrophic — W3-11's trigonometry sections put `0`, `2`, `3` and a domain in nearly
// every stem while their answers are solution SETS like
// `x = \frac{\pi}{6}, \frac{\pi}{2}, \frac{7\pi}{6}` that canonicalise() cannot parse, and
// all 30 of the batch's flags were pairs with different equations AND different solution
// sets. Weak hits are still worth a human glance (same numbers, opposite side of the
// quiz/practice line), so they are reported as an ADVISORY and not counted toward
// --strict; a hit whose canonical ANSWERS also match stays a hard defect.
function computeSig(raw, answerRaw) {
  const numbers = extractNumbers(raw);
  const answerKey = answerRaw ? canonicalise(answerRaw) : null;
  if (numbers.length === 0 && !answerKey) return null;
  if (numbers.length < 2) return null;
  const sortedNums = numbers.slice().sort((a, b) => a - b).join(',');
  return { sig: `${sortedNums}|${answerKey || ''}`, weak: !answerKey };
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
        const sigInfo = computeSig(raw, quizAnswerText(q));
        entries.push({ skillId, source: 'quiz', itemId: q.id, raw, norm: normaliseStem(raw), sig: sigInfo?.sig ?? null, sigWeak: sigInfo?.weak ?? false });
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
          const sigInfo = computeSig(raw, practiceAnswerText(card));
          entries.push({ skillId, source: tier, itemId, raw, norm: normaliseStem(raw), sig: sigInfo?.sig ?? null, sigWeak: sigInfo?.weak ?? false });
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

const defectsByKind = {
  'QUIZ-COPIES-PRACTICE': [],
  'INTRA-FILE-DUP': [],
  'CROSS-SKILL-DUP': [],
  'QUIZ-COPIES-PRACTICE-VALUES': [],
};

for (const [norm, group] of buckets) {
  if (group.length < 2) continue;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const kind = classifyPair(group[i], group[j]);
      defectsByKind[kind].push({ a: group[i], b: group[j], norm });
    }
  }
}

// --- value-signature buckets (QUIZ-COPIES-PRACTICE-VALUES) ----------------
// Same-skill quiz-vs-practice-card pairs that share a value signature (see
// computeSig) but a DIFFERENT stem norm — same norm is already caught by the
// QUIZ-COPIES-PRACTICE class above, so skip those to avoid double-reporting.
const weakValueHits = [];
const sigBuckets = new Map();
for (const e of entries) {
  if (!e.sig) continue;
  if (!sigBuckets.has(e.sig)) sigBuckets.set(e.sig, []);
  sigBuckets.get(e.sig).push(e);
}

for (const [sig, group] of sigBuckets) {
  if (group.length < 2) continue;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const x = group[i];
      const y = group[j];
      if (x.skillId !== y.skillId) continue;
      if (x.norm === y.norm) continue; // already flagged by stem matching
      const xCard = isCardSource(x.source);
      const yCard = isCardSource(y.source);
      if (xCard === yCard) continue; // need exactly one quiz side, one card side
      if (x.sigWeak || y.sigWeak) weakValueHits.push({ a: x, b: y, sig });
      else defectsByKind['QUIZ-COPIES-PRACTICE-VALUES'].push({ a: x, b: y, sig });
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
function printPair(kind, a, b) {
  console.log(`✗ ${kind}`);
  console.log(`    ${a.skillId} ${a.itemId} == ${b.skillId} ${b.itemId}`);
  console.log(`    stem: ${displayStem(a.raw)}`);
}

let totalDefects = 0;
for (const kind of ['QUIZ-COPIES-PRACTICE', 'INTRA-FILE-DUP', 'CROSS-SKILL-DUP', 'QUIZ-COPIES-PRACTICE-VALUES']) {
  for (const { a, b } of defectsByKind[kind]) {
    printPair(kind, a, b);
    totalDefects++;
  }
}

if (weakValueHits.length) {
  console.log('\nAdvisory (QUIZ-COPIES-PRACTICE-VALUES-WEAK, not counted toward --strict):');
  console.log('  Same stem literals on opposite sides of the quiz/practice line, but the');
  console.log('  answers could not be canonicalised, so there is NO answer evidence — check');
  console.log('  by hand whether the two items really pose the same question.');
  for (const { a, b } of weakValueHits) {
    console.log(`  ~ ${a.skillId} ${a.itemId} ~= ${b.skillId} ${b.itemId}`);
    console.log(`    stem: ${displayStem(a.raw)}`);
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
    `CROSS-SKILL-DUP: ${defectsByKind['CROSS-SKILL-DUP'].length}, ` +
    `QUIZ-COPIES-PRACTICE-VALUES: ${defectsByKind['QUIZ-COPIES-PRACTICE-VALUES'].length}. ` +
    `VALUES-WEAK advisory: ${weakValueHits.length}. ` +
    `NEAR-DUP advisory: ${nearDups.length}.`,
);

if (totalDefects) {
  console.log(`\n✗ ${totalDefects} duplicate-stem defect(s).`);
  if (strict) process.exit(1);
} else {
  console.log('\n✓ No duplicate-stem defects.');
}
