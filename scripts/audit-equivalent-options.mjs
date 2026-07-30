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

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const quizzesDir = join(rootDir, 'public', 'quizzes');

// Stems that legitimately pin one written form, making a distractor==key pair intended.
const FORM_PINNING = /simplest|simplify|lowest terms|in the form|whole[- ]number|decimal place|significant figure|nearest|as a (fraction|decimal|percentage)|exact form|mixed number|improper/i;

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

// Macros whose value cannot survive the strip below: dropping `\sqrt` would turn
// √3 into 3 and report a bogus collision. Powers are excluded too, except the
// degree marker `^{\circ}`, which is a unit rather than an exponent.
function hasUnstrippableMath(text) {
  const s = String(text);
  if (/\\(sqrt|pi|times|div|cdot|pm|approx|dot|overline)\b/.test(s)) return true;
  if (/\^(?!\{?\\circ)/.test(s)) return true;
  return false;
}

// Strip the LaTeX/markup shell, turning \frac{a}{b} into a/b so the value survives.
function bareText(text) {
  return String(text)
    .replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\dfrac|\\tfrac|\\frac/g, '')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[$\\{}]/g, '')
    .trim();
}

// "3", "3.5", "1/2", "(3)/(4)" → Number. null if not a lone numeric.
function toNumber(raw) {
  const s = raw.replace(/[()\s,]/g, '');
  if (!s) return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    if (d === 0) return null;
    return parseFloat(frac[1]) / d;
  }
  // mixed number written as "2 1/2" survives the space strip as "21/2", so only
  // handle the explicit-space form before stripping — done by the caller.
  return null;
}

// Canonical key for an option, or null when we can't parse it confidently.
// Ratios canonicalise to lowest integer terms; lone numbers to a fixed-precision
// value plus any trailing unit, so "3.5 km" and "3.50 km" collide but "3.5 km"
// and "3.5 h" do not.
function canonicalise(text) {
  if (hasUnstrippableMath(text)) return null;
  const bare = bareText(text);
  if (!bare) return null;

  // --- ratio form: a:b, a:b:c, terms may be integers, decimals or fractions ---
  if (bare.includes(':')) {
    const body = bare.replace(/\s/g, '');
    if (!/^[-0-9.:()/]+$/.test(body)) return null;
    const parts = body.split(':');
    if (parts.length < 2) return null;
    const nums = parts.map(toNumber);
    if (nums.some((n) => n === null || !Number.isFinite(n))) return null;
    let mult = 1;
    for (const n of nums) {
      const decimals = (String(n).split('.')[1] || '').length;
      if (decimals > 6) return null; // recurring/irrational — don't guess
      mult = Math.max(mult, 10 ** decimals);
    }
    const ints = nums.map((n) => Math.round(n * mult));
    let g = ints[0];
    for (const n of ints) g = gcd(g, n);
    if (!g) return null;
    return `ratio:${ints.map((n) => n / g).join(':')}`;
  }

  // --- lone number, optionally with a unit or currency marker ---
  // The tail must be a PURE unit. Anything else (another number, an operator, a
  // bracket) means the option is an expression, not a value: `8 - 5` and `8 + 5`
  // must never collide just because both start with 8.
  const mixed = bare.match(/^(-?\d+)\s+(\d+)\/(\d+)\s*(.*)$/); // "2 1/2 kg"
  if (mixed) {
    if (!isPureUnit(mixed[4])) return null;
    const whole = parseInt(mixed[1], 10);
    const denom = parseInt(mixed[3], 10);
    if (denom === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    const value = whole + sign * (parseInt(mixed[2], 10) / denom);
    return `num:${value.toPrecision(10)}|${normaliseUnit(mixed[4], bare)}`;
  }
  const m = bare.match(/^([-$€£]?\s*-?[\d.,]+(?:\s*\/\s*[\d.,]+)?)\s*(.*)$/);
  if (!m) return null;
  if (!isPureUnit(m[2])) return null;
  const value = toNumber(m[1].replace(/[$€£]/g, ''));
  if (value === null || !Number.isFinite(value)) return null;
  return `num:${value.toPrecision(10)}|${normaliseUnit(m[2], bare)}`;
}

// A unit may carry letters, %, degrees, per-slashes and squared/cubed marks —
// never a digit, an operator or a bracket.
function isPureUnit(tail) {
  return /^[a-zA-Z%°/²³\s.]*$/.test(String(tail));
}

// Units decide whether two equal numbers are really the same answer. Currency
// markers live at the front, so recover them from the original string.
function normaliseUnit(tail, whole) {
  const unit = String(tail).replace(/[^a-zA-Z%°/^²³]/g, '').toLowerCase();
  const currency = /[$€£]/.test(whole) ? '$' : '';
  return currency + unit;
}

function parseOnlyArg(argv) {
  const idx = argv.indexOf('--only');
  if (idx === -1 || idx === argv.length - 1) return null;
  const raw = argv[idx + 1];
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return (id) => ids.some((want) => id === want || id.startsWith(want));
}

const argv = process.argv.slice(2);
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
