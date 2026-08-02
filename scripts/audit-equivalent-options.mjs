#!/usr/bin/env node
// Audits MCQ option sets for options that are MATHEMATICALLY EQUAL to one another.
// The validator cannot see this class of defect: every option is well-formed, the
// schema is satisfied, and exactly one option carries `correct: true` — but two
// options denote the same value, which is a real assessment defect:
//
//   * distractor == distractor  → the pair is jointly eliminable ("a key can't be
//     two options"), so the student narrows the field without doing any maths;
//   * distractor == key         → the item has two defensible correct answers,
//     UNLESS the stem pins the required form ("in simplest form", "to 2 decimal
//     places", "in the form 1:n", …). Pinned ones are legitimate "did not
//     simplify" misconceptions and are reported separately as intended.
//
// Ratio-heavy topics are the worst offenders — infinitely many written forms
// denote one ratio (2:6 = 12:36 = 1:3) — but the same trap exists wherever an
// answer has more than one written form: fractions vs decimals (1/2 = 0.5),
// trailing zeros (3.5 = 3.50), unsimplified fractions (4/8 = 1/2).
//
// Advisory, not part of the schema contract: the canonicalisation is heuristic
// and only compares options it can parse confidently. Exits 0 unless --strict.
//
// Usage:
//   node scripts/audit-equivalent-options.mjs                 # all quizzes
//   node scripts/audit-equivalent-options.mjs --only id1,id2  # ids or prefix
//   node scripts/audit-equivalent-options.mjs --strict        # exit 1 on defects
//
// See docs/content-generation.md ("Blind check") and docs/content-schema.md.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rejectStrayPositionals } from './lib/argv.mjs';
import { canonicalise } from './lib/canonical-option.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const quizzesDir = join(rootDir, 'public', 'quizzes');

// Stems that legitimately pin one written form, making a distractor==key pair intended.
const FORM_PINNING = /simplest|simplify|lowest terms|in the form|whole[- ]number|decimal place|significant figure|nearest|as a (fraction|decimal|percentage)|exact form|mixed number|improper/i;

function parseOnlyArg(argv) {
  const idx = argv.indexOf('--only');
  if (idx === -1 || idx === argv.length - 1) return null;
  const raw = argv[idx + 1];
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return (id) => ids.some((want) => id === want || id.startsWith(want));
}

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, { valueFlags: ['--only'], boolFlags: ['--strict'] });
const filterFn = parseOnlyArg(argv);
const strict = argv.includes('--strict');

const files = readdirSync(quizzesDir)
  .filter((f) => f.endsWith('.json'))
  .filter((f) => !filterFn || filterFn(f.replace(/\.json$/, '')))
  .sort();

const defects = [];
const intended = [];
let itemsScanned = 0;
let optionsParsed = 0;
let optionsTotal = 0;

for (const file of files) {
  const skillId = file.replace(/\.json$/, '');
  let quiz;
  try {
    quiz = JSON.parse(readFileSync(join(quizzesDir, file), 'utf8'));
  } catch (err) {
    console.error(`  ✗ ${skillId}: unreadable (${err.message})`);
    continue;
  }
  for (const item of quiz.questions || []) {
    itemsScanned++;
    const stem = String(item.question_text || '');
    const pinned = FORM_PINNING.test(stem);
    const groups = new Map();
    for (const opt of item.options || []) {
      optionsTotal++;
      const key = canonicalise(opt.text);
      if (!key) continue;
      optionsParsed++;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(opt);
    }
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const hasKey = group.some((o) => o.correct);
      const shown = group.map((o) => o.text).join('  ==  ');
      const where = `${skillId} ${item.id}`;
      if (!hasKey) {
        defects.push({ kind: 'DISTRACTOR-PAIR', where, shown, stem });
      } else if (!pinned) {
        defects.push({ kind: 'KEY-EQUAL (stem does not pin the form)', where, shown, stem });
      } else {
        intended.push({ where, shown });
      }
    }
  }
}

for (const d of defects) {
  console.log(`✗ ${d.kind}\n    ${d.where}:  ${d.shown}`);
  if (d.kind.startsWith('KEY-EQUAL')) {
    console.log(`    stem: ${d.stem.replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '[figure]').replace(/\s+/g, ' ').slice(0, 140)}`);
  }
}

const coverage = optionsTotal ? Math.round((optionsParsed / optionsTotal) * 100) : 0;
console.log(
  `\nScanned ${itemsScanned} question(s) in ${files.length} quiz file(s); ` +
    `canonicalised ${optionsParsed}/${optionsTotal} options (${coverage}%).`,
);
console.log(`Intended key-equal options under a form-pinning stem: ${intended.length}.`);

if (defects.length) {
  console.log(`\n✗ ${defects.length} equivalent-option defect(s).`);
  console.log('  Fix by changing the option value (not just its `why`), or, for a');
  console.log('  KEY-EQUAL pair, by pinning the required form in the stem.');
  if (strict) process.exit(1);
} else {
  console.log('\n✓ No equivalent-option defects.');
}
