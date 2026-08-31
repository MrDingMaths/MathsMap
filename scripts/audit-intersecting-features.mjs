#!/usr/bin/env node
// Audits public/quizzes for the "intersecting features" (convergence) cue, where the
// key can be guessed with no mathematics at all:
//
//   * INTERSECT — the option set is PARALLEL (every option tokenises to the same
//     number of tokens), two or more token slots vary, the key holds the STRICTLY
//     most common value in every one of those slots, and no distractor holds all of
//     them. A student splits the options into features, counts which value of each
//     feature wins, and reads the key off the intersection.
//
//         *S56°W | S56°E | N56°W | S34°W        S wins 3:1, 56 wins 3:1, W wins 3:1
//
//     The cause is the habit of writing one distractor per misconception, each
//     differing from the key in exactly one slot. The repair is a BALANCED GRID —
//     two independent error axes, all four combinations — so every feature value
//     ties and nothing converges:
//
//         *(6x+15)/12 | (6x+5)/12 | (2x+15)/12 | (2x+5)/12      every value ties 2:2
//
//     A tie is therefore deliberately not a defect. This is a defect for --strict.
//
//   * INTERSECT-WEAK — the same test over a coarse FEATURE BAG (unit, sign, digit
//     string, written form, function macros) for option sets that do not align
//     token-for-token: worded options, mixed representations, differing lengths.
//     Three or more varying features are required because the bag is coarser than
//     a slot. Reported as an advisory: it does NOT count toward --strict.
//
// Usage:
//   node scripts/audit-intersecting-features.mjs                 # all quizzes
//   node scripts/audit-intersecting-features.mjs --only id1,id2   # ids or prefix
//   node scripts/audit-intersecting-features.mjs --strict         # exit 1 on defects
//   node scripts/audit-intersecting-features.mjs --dir <root>      # test override
//   node scripts/audit-intersecting-features.mjs --json            # machine-readable
//
// `--json` emits { defects[], advisories[] } with each item's dimension grid, which is
// what a repair round's defects.json is assembled from.
//
// See docs/content-generation.md and docs/content-schema.md.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rejectStrayPositionals } from './lib/argv.mjs';
import { bareText, isPureUnit, normaliseUnit } from './lib/canonical-option.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseOnlyArg(argv) {
  const idx = argv.indexOf('--only');
  if (idx === -1 || idx === argv.length - 1) return null;
  const ids = argv[idx + 1].split(',').map((s) => s.trim()).filter(Boolean);
  return (id) => ids.some((want) => id === want || id.startsWith(want));
}

function parseDirArg(argv) {
  const idx = argv.indexOf('--dir');
  if (idx === -1 || idx === argv.length - 1) return null;
  return argv[idx + 1];
}

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, { valueFlags: ['--only', '--dir'], boolFlags: ['--strict', '--json'] });
const filterFn = parseOnlyArg(argv);
const strict = argv.includes('--strict');
const asJson = argv.includes('--json');
const dirArg = parseDirArg(argv);

const baseDir = dirArg ? join(rootDir, dirArg) : join(rootDir, 'public');
const quizzesDir = join(baseDir, 'quizzes');

// --- feature extraction -----------------------------------------------------

// One token = a LaTeX macro, a signed number, a run of letters, or a single
// non-space character. Macros and numbers stay whole so that `\sin` vs `\cos`
// and `54` vs `18` each read as ONE differing feature, not several.
const TOKEN_RE = /\\[a-zA-Z]+|-?\d+(?:\.\d+)?|[a-zA-Z]+|\S/g;

function tokenise(text) {
  return String(text).replace(/\$/g, '').match(TOKEN_RE) || [];
}

// The digit family of an option: every digit run joined, then leading and
// trailing zeros dropped, so 0.05 / 5 / 500 all read as "5" and a place-value
// distractor set is seen as sharing one feature value.
function digitFamily(text) {
  const digits = String(text).replace(/[^0-9]/g, '');
  if (!digits) return null;
  const trimmed = digits.replace(/^0+/, '').replace(/0+$/, '');
  return trimmed || '0';
}

const MACRO_RE = /\\(ln|log|lg|exp|sin|cos|tan|sec|csc|cosec|cot|arcsin|arccos|arctan|sinh|cosh|tanh|sqrt|pi)\b/g;

function macroSet(text) {
  const found = [...String(text).matchAll(MACRO_RE)].map((m) => m[1]);
  return found.length ? [...new Set(found)].sort().join('+') : 'none';
}

function formClass(text) {
  const s = String(text);
  if (/\\d?frac/.test(s)) return 'fraction';
  if (/%/.test(s)) return 'percent';
  if (/\\sqrt/.test(s)) return 'surd';
  const bare = bareText(s);
  if (/:/.test(bare)) return 'ratio';
  if (/^-?\d+\.\d+\s*[a-zA-Z%°/]*$/.test(bare)) return 'decimal';
  if (/^-?\d+\s*[a-zA-Z%°/]*$/.test(bare)) return 'integer';
  if (/[0-9=+\-*/^]/.test(bare)) return 'expression';
  return 'worded';
}

// The unit/currency tail of a lone value, or null when the option is not a
// value-with-unit at all. Same shape as canonical-option.mjs's own tail test.
function unitFeature(text) {
  const bare = bareText(text);
  const m = bare.match(/^([-$€£]?\s*-?[\d.,]+(?:\s*\/\s*[\d.,]+)?)\s*(.*)$/);
  if (!m || !isPureUnit(m[2])) return null;
  return normaliseUnit(m[2], bare) || 'none';
}

function signFeature(text) {
  const bare = bareText(text);
  if (!/\d/.test(bare)) return null;
  return bare.trimStart().startsWith('-') ? 'neg' : 'pos';
}

// --- the shared convergence test --------------------------------------------
//
// `dims` is an array of per-dimension value arrays, each indexed by option.
// The cue exists when the key is the strict mode of every dimension and is the
// only option carrying all of those modal values.
function convergenceCue(dims, keyIndex, optionCount) {
  if (dims.length < 2) return null;
  for (const values of dims) {
    const counts = new Map();
    for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
    const keyValue = values[keyIndex];
    const rivals = [...counts.entries()].filter(([v]) => v !== keyValue).map(([, n]) => n);
    if (!(counts.get(keyValue) > Math.max(0, ...rivals))) return null;
  }
  let fullHolders = 0;
  for (let i = 0; i < optionCount; i++) {
    if (dims.every((values) => values[i] === values[keyIndex])) fullHolders++;
  }
  if (fullHolders !== 1) return null;
  return dims;
}

function renderGrid(names, dims, keyIndex) {
  return dims.map((values, d) => {
    const shown = values.map((v, i) => (i === keyIndex ? `*${v}` : v)).join(' | ');
    return `${names[d]}: ${shown}`;
  });
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

const defects = [];
const advisories = [];
let itemsScanned = 0;
let filesScanned = 0;
let alignedItems = 0;

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

  for (const q of questions) {
    const options = q.options || [];
    if (options.length < 3) continue;
    const keyIndex = options.findIndex((o) => o.correct);
    if (keyIndex === -1) continue;
    const texts = options.map((o) => String(o.text ?? ''));

    // --- Pass A: aligned token slots ---------------------------------------
    const tokenRows = texts.map(tokenise);
    const width = tokenRows[0].length;
    const aligned = width > 0 && tokenRows.every((row) => row.length === width);
    if (aligned) {
      alignedItems++;
      const dims = [];
      const names = [];
      for (let i = 0; i < width; i++) {
        const values = tokenRows.map((row) => row[i]);
        if (new Set(values).size > 1) {
          dims.push(values);
          names.push(`slot ${i}`);
        }
      }
      const cue = convergenceCue(dims, keyIndex, options.length);
      if (cue) {
        defects.push({
          skillId,
          id: q.id,
          dimCount: dims.length,
          grid: renderGrid(names, dims, keyIndex),
          options: texts.map((t, i) => (i === keyIndex ? `*${t}` : t)).join(' | '),
        });
      }
      continue; // an aligned set is judged by Pass A alone
    }

    // --- Pass B: coarse feature bag ----------------------------------------
    const FEATURES = [
      ['unit', unitFeature],
      ['sign', signFeature],
      ['digits', digitFamily],
      ['form', formClass],
      ['macros', macroSet],
    ];
    const dims = [];
    const names = [];
    for (const [name, fn] of FEATURES) {
      const values = texts.map(fn);
      if (values.some((v) => v === null)) continue; // undefined for some option
      if (new Set(values).size <= 1) continue; // constant: not a dimension
      dims.push(values);
      names.push(name);
    }
    if (dims.length < 3) continue; // the bag is coarse — demand more agreement
    const cue = convergenceCue(dims, keyIndex, options.length);
    if (cue) {
      advisories.push({
        skillId,
        id: q.id,
        dimCount: dims.length,
        grid: renderGrid(names, dims, keyIndex),
        options: texts.map((t, i) => (i === keyIndex ? `*${t}` : t)).join(' | '),
      });
    }
  }
}

if (asJson) {
  console.log(JSON.stringify({ defects, advisories }, null, 2));
  process.exit(defects.length && strict ? 1 : 0);
}

for (const d of defects) {
  console.log('✗ INTERSECT');
  console.log(`    ${d.skillId} ${d.id}: key is the strict mode of all ${d.dimCount} varying slot(s)`);
  console.log(`    options: ${d.options}`);
  for (const line of d.grid) console.log(`    ${line}`);
}

if (advisories.length) {
  console.log('\nAdvisory (INTERSECT-WEAK, not counted toward --strict):');
  for (const a of advisories) {
    console.log(`  ~ ${a.skillId} ${a.id}: key is the strict mode of all ${a.dimCount} feature(s)`);
    console.log(`      options: ${a.options}`);
    for (const line of a.grid) console.log(`      ${line}`);
  }
}

console.log(`\nScanned ${itemsScanned} question(s) in ${filesScanned} quiz file(s); ${alignedItems} had parallel option sets.`);
console.log(`INTERSECT: ${defects.length}. INTERSECT-WEAK advisory: ${advisories.length}.`);

if (defects.length) {
  console.log(`\n✗ ${defects.length} intersecting-feature defect(s).`);
  if (strict) process.exit(1);
} else {
  console.log('\n✓ No intersecting-feature defects.');
}
