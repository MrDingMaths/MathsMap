#!/usr/bin/env node
// Audits arithmetic the content ASSERTS: an equation whose every side is a complete
// literal-only expression, e.g. `27 + 145 + 98 = 280`.
//
// W3-3 shipped `27 + 145 + 98 = 280` (it is 270) and `44 - (-4) = 52` (it is 48), each
// keying the item's answer off the bad sum. Both were invisible to the validator (the JSON
// is well-formed and the KaTeX renders) and were caught only by the blind checker — a model
// round trip per defect. The evaluation is mechanical, so it belongs in the gate.
//
// Deliberately conservative. An equation is only evaluated when EVERY side, after macro
// normalisation, parses as a closed arithmetic expression over decimal literals with
// + - * / and parentheses. One letter anywhere in the equation (`2(x+6)-5=9`), one
// unsupported macro (`\frac`, `\sqrt`, `\sin`, `\pi`, `\approx`, `\dots`), one colon
// (clock times), one percent sign — and the whole equation is skipped rather than guessed
// at. Partial matches are impossible by construction: sides are whole, not fragments.
//
// Usage:
//   node scripts/audit-arithmetic.mjs                    # all skills
//   node scripts/audit-arithmetic.mjs --only id1,id2      # ids or prefix
//   node scripts/audit-arithmetic.mjs --strict            # exit 1 on defects
//   node scripts/audit-arithmetic.mjs --dir <root>        # test override
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rejectStrayPositionals } from './lib/argv.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

// Relative tolerance: content rounds mid-computation all the time (2 d.p. money, 3 s.f.
// trig), so only a difference too large to be rounding counts. 0.5% of the larger
// magnitude, floored at 0.005, clears every legitimate rounding in the corpus while still
// catching 280-vs-270 (3.6%) and 52-vs-48 (8%).
export function withinTolerance(actual, claimed) {
  const scale = Math.max(Math.abs(actual), Math.abs(claimed), 1);
  return Math.abs(actual - claimed) <= Math.max(0.005, scale * 0.005);
}

// Rewrites the KaTeX spellings this audit understands into plain operators, and drops
// spacing/format noise that is not part of the arithmetic. Anything NOT rewritten here
// (\frac, \sqrt, \pi, function names, …) survives as a backslash and disqualifies the
// equation in isPureArithmetic below — which is the intended behaviour.
function normalise(text) {
  return String(text)
    .replace(/\\times|\\cdot/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\(?:text|mathrm|textrm)\{[^{}]*\}/g, '#') // a prose label is not arithmetic
    .replace(/\\[,;!:]/g, ' ')
    .replace(/\\left|\\right/g, ' ')
    .replace(/[$]/g, ' ')
    .replace(/(\d),(\d{3})(?![\d.])/g, '$1$2'); // thousands separators
}

const PURE = /^[\s\d.+\-*/()]+$/;
function isPureArithmetic(side) {
  return side.trim() !== '' && PURE.test(side) && /\d/.test(side);
}

// Recursive-descent over: expr := term (('+'|'-') term)*; term := unary (('*'|'/') unary)*;
// unary := '-'? factor; factor := number | '(' expr ')', with implicit multiplication
// between adjacent factors (`3(4)`, `(2)(5)`). Returns null on anything it cannot parse,
// so an unparseable side skips the equation instead of producing a bogus verdict.
export function evaluateExpression(src) {
  const s = src.replace(/\s+/g, '');
  let i = 0;
  const peek = () => s[i];
  function factor() {
    if (peek() === '(') {
      i++;
      const v = expr();
      if (v === null || peek() !== ')') return null;
      i++;
      return v;
    }
    const m = /^\d+(?:\.\d+)?/.exec(s.slice(i));
    if (!m) return null;
    i += m[0].length;
    return Number(m[0]);
  }
  function unary() {
    if (peek() === '-') { i++; const v = unary(); return v === null ? null : -v; }
    if (peek() === '+') { i++; return unary(); }
    let value = factor();
    if (value === null) return null;
    while (peek() === '(') { // implicit multiplication: 3(4)
      const next = factor();
      if (next === null) return null;
      value *= next;
    }
    return value;
  }
  function term() {
    let value = unary();
    if (value === null) return null;
    while (peek() === '*' || peek() === '/') {
      const op = s[i++];
      const rhs = unary();
      if (rhs === null) return null;
      value = op === '*' ? value * rhs : value / rhs;
    }
    return value;
  }
  function expr() {
    let value = term();
    if (value === null) return null;
    while (peek() === '+' || peek() === '-') {
      const op = s[i++];
      const rhs = term();
      if (rhs === null) return null;
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }
  const result = expr();
  return result !== null && i === s.length && Number.isFinite(result) ? result : null;
}

// An equation is worth checking only when at least one side does actual work — a bare
// `4 = 4` restatement, or a lone number on both sides, tells us nothing.
function hasOperator(side) {
  return /[+*/]/.test(side) || /\d\s*-/.test(side);
}

// House setout puts the working on one line and its result on the next (`= 60`), so a
// continuation line is joined back onto its predecessor before anything is evaluated —
// otherwise the most common shape in the corpus is never checked.
function logicalLines(text) {
  const lines = [];
  for (const line of text.split('\n')) {
    // Only onto a line that does not already state an equality: the decimal-placement
    // routine deliberately writes `521 * 4 = 2084` then `= 20.84` (place value restored),
    // which is correct setout, not a false chain.
    if (/^\s*=/.test(line) && lines.length && !lines[lines.length - 1].includes('=')) lines[lines.length - 1] += ` ${line.trim()}`;
    else lines.push(line);
  }
  return lines;
}

export function findArithmeticDefects(text, where) {
  const found = [];
  if (typeof text !== 'string' || !text.includes('=')) return found;
  for (const rawLine of logicalLines(normalise(text))) {
    // A residual macro (anything normalise did not rewrite) or a comparison disqualifies
    // the WHOLE line. Never split an impure line into chunks and check one: splitting
    // `Candidates with centre \ge 75 = 20 + 16 + 8` yields a pure-looking `75 = 20+16+8`
    // that asserts nothing.
    if (/\\/.test(rawLine) || /[<>≤≥≈≠]/.test(rawLine)) continue;
    if (!rawLine.includes('=')) continue;
    const sides = rawLine.split('=').map(s => s.trim());
    // A leading prose label (`Total candidates (n) = 4 + 12 + …`) is not a side to check.
    if (sides.length > 2 && (sides[0] === '' || sides[0].includes('#'))) sides.shift();
    if (sides.length < 2) continue;
    if (!sides.every(isPureArithmetic)) continue;
    if (!sides.some(hasOperator)) continue;
    const values = sides.map(evaluateExpression);
    if (values.some(v => v === null)) continue;
    for (let k = 1; k < values.length; k++) {
      if (!withinTolerance(values[k - 1], values[k])) {
        found.push({ where, claim: `${sides[k - 1]} = ${sides[k]}`, actual: values[k - 1], claimed: values[k] });
      }
    }
  }
  return found;
}

// An MCQ option's `text` is a candidate answer, and on an "which equation is true?" item
// the wrong candidates are deliberately false equations — checking them would flag the
// item's own design. Its `why` is prose about a student's slip and IS checked.
const isOption = (o) => o && typeof o === 'object' && typeof o.text === 'string'
  && (typeof o.why === 'string' || o.correct === true);

function walk(value, where, out) {
  if (typeof value === 'string') out.push(...findArithmeticDefects(value, where));
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${where}[${i}]`, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'text' && isOption(value)) continue;
      walk(v, `${where}.${k}`, out);
    }
  }
}

function parseOnlyArg(argv) {
  const idx = argv.indexOf('--only');
  if (idx === -1 || idx === argv.length - 1) return null;
  const ids = argv[idx + 1].split(',').map(s => s.trim()).filter(Boolean);
  return (id) => ids.some(want => id === want || id.startsWith(want));
}

function main() {
  const argv = process.argv.slice(2);
  rejectStrayPositionals(argv, { valueFlags: ['--only', '--dir'], boolFlags: ['--strict'] });
  const filterFn = parseOnlyArg(argv);
  const strict = argv.includes('--strict');
  const dirIdx = argv.indexOf('--dir');
  const baseDir = dirIdx >= 0 && argv[dirIdx + 1] ? join(rootDir, argv[dirIdx + 1]) : join(rootDir, 'public');

  const defects = [];
  let checked = 0;
  for (const sub of ['content', 'quizzes']) {
    const dir = join(baseDir, sub);
    if (!existsSync(dir)) continue;
    for (const filename of readdirSync(dir).filter(f => f.endsWith('.json'))) {
      const skillId = filename.slice(0, -'.json'.length);
      if (filterFn && !filterFn(skillId)) continue;
      checked++;
      let data;
      try {
        data = JSON.parse(readFileSync(join(dir, filename), 'utf8'));
      } catch {
        continue; // validate.mjs owns malformed JSON
      }
      walk(data, `${sub}/${skillId}`, defects);
    }
  }

  console.log(`Arithmetic audit: checked ${checked} file(s)${filterFn ? ' (filtered)' : ''}.`);
  for (const d of defects) {
    console.log(`  ✗ ${d.where}: "${d.claim}" — left side is ${d.actual}`);
  }
  console.log(`\n${defects.length} asserted evaluation(s) do not hold.`);
  if (defects.length && strict) process.exit(1);
}

// Importable from tests: only run the CLI when this file IS the entry point.
const entry = process.argv[1] ? `file:///${process.argv[1].replace(/\\/g, '/')}` : null;
if (entry && import.meta.url === entry) main();
