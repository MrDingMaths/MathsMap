#!/usr/bin/env node
// Audits quiz option hygiene within public/quizzes:
//
//   * LEAKED-KEY — within one quiz file, items sharing a `structure` (the
//     same question shape, e.g. "solve-two-step") are compared pairwise: if
//     a distractor in item A canonically equals the correct answer of item
//     B, a student who has seen B's key can eliminate/guess A's answer
//     without doing A's maths. Items in different structure groups are
//     never compared — a bare integer coincidentally matching across
//     unrelated items is not a defect.
//   * VAGUE-WHY — a distractor's `why` is missing, too short, or boilerplate
//     ("common error", "wrong answer", ...) instead of naming the specific
//     misconception a student would have to make to land on that option.
//
// Both are defects for --strict.
//
// Usage:
//   node scripts/audit-option-hygiene.mjs                 # all quizzes
//   node scripts/audit-option-hygiene.mjs --only id1,id2   # ids or prefix
//   node scripts/audit-option-hygiene.mjs --strict         # exit 1 on defects
//   node scripts/audit-option-hygiene.mjs --dir <root>      # test override
//
// See docs/content-generation.md and docs/content-schema.md.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rejectStrayPositionals } from './lib/argv.mjs';
import { canonicalise } from './lib/canonical-option.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

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

// Boilerplate `why` text that names no specific misconception. Kept as a
// const array of regexes so new stock phrases are easy to add.
const VAGUE_WHY_PATTERNS = [
  /^(common (error|mistake)s?)$/i,
  /^wrong( answer)?$/i,
  /^close$/i,
  /^incorrect$/i,
  /calculation error/i,
  /careless mistake/i,
  /simple mistake/i,
  /misreads? the question$/i,
  /does not follow the method$/i,
];

function isVagueWhy(why) {
  if (typeof why !== 'string') return true;
  const trimmed = why.trim();
  if (trimmed.length < 15) return true;
  return VAGUE_WHY_PATTERNS.some((re) => re.test(trimmed));
}

// Normalised-string fallback for options canonicalise() can't parse: strip
// LaTeX shell + whitespace and compare literally. Not mathematically aware,
// but still catches identical distractor/key text.
function normaliseFallback(text) {
  return String(text)
    .replace(/\\left|\\right/g, '')
    .replace(/[$\\{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function optionsEqual(aText, bText) {
  const ca = canonicalise(aText);
  const cb = canonicalise(bText);
  if (ca !== null && cb !== null) return ca === cb;
  return normaliseFallback(aText) === normaliseFallback(bText);
}

function listJsonFiles(dir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

const files = listJsonFiles(quizzesDir).filter((f) => !filterFn || filterFn(f.replace(/\.json$/, '')));

const leakedKeyDefects = [];
const vagueWhyDefects = [];
let itemsScanned = 0;
let filesScanned = 0;

for (const file of files) {
  const skillId = file.replace(/\.json$/, '');
  let quiz;
  try {
    quiz = JSON.parse(readFileSync(join(quizzesDir, file), 'utf8'));
  } catch (err) {
    console.error(`  ✗ ${skillId}: unreadable (${err.message})`);
    continue;
  }
  filesScanned++;
  const questions = quiz.questions || [];
  itemsScanned += questions.length;

  // --- LEAKED-KEY: group by structure, compare within groups of size >= 2 ---
  const groups = new Map();
  for (const q of questions) {
    const slug = String(q.structure || '');
    if (!groups.has(slug)) groups.set(slug, []);
    groups.get(slug).push(q);
  }
  const multiGroups = [...groups.values()].filter((g) => g.length >= 2);
  console.log(`${skillId}: ${multiGroups.length} structure group(s) of size >= 2`);

  for (const group of multiGroups) {
    const slug = group[0].structure;
    for (const a of group) {
      for (const b of group) {
        if (a === b) continue;
        const bKey = (b.options || []).find((o) => o.correct);
        if (!bKey) continue;
        for (const opt of a.options || []) {
          if (opt.correct) continue; // only distractors of A leak keys
          if (optionsEqual(opt.text, bKey.text)) {
            leakedKeyDefects.push({
              skillId, aId: a.id, bId: b.id, text: opt.text, slug,
            });
          }
        }
      }
    }
  }

  // --- VAGUE-WHY: any distractor with a missing/too-short/boilerplate why ---
  for (const q of questions) {
    for (const opt of q.options || []) {
      if (opt.correct) continue;
      if (isVagueWhy(opt.why)) {
        vagueWhyDefects.push({ skillId, id: q.id, text: opt.text, why: opt.why });
      }
    }
  }
}

for (const d of leakedKeyDefects) {
  console.log(`✗ LEAKED-KEY`);
  console.log(`    ${d.skillId} ${d.aId}: option "${d.text}" equals key of ${d.bId} (structure: ${d.slug})`);
}

for (const d of vagueWhyDefects) {
  console.log(`✗ VAGUE-WHY`);
  console.log(`    ${d.skillId} ${d.id}: option "${d.text}" why=${JSON.stringify(d.why ?? null)}`);
}

const totalDefects = leakedKeyDefects.length + vagueWhyDefects.length;
console.log(`\nScanned ${itemsScanned} question(s) in ${filesScanned} quiz file(s).`);
console.log(`LEAKED-KEY: ${leakedKeyDefects.length}, VAGUE-WHY: ${vagueWhyDefects.length}.`);

if (totalDefects) {
  console.log(`\n✗ ${totalDefects} option-hygiene defect(s).`);
  if (strict) process.exit(1);
} else {
  console.log('\n✓ No option-hygiene defects.');
}
