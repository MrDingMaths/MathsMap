// Converts the ad-hoc maths notation in data/*.json into KaTeX-ready LaTeX,
// wrapping each detected maths run in `$...$` delimiters.
//
//   node scripts/convert-latex.mjs           # dry run: prints a before/after report
//   node scripts/convert-latex.mjs --write   # rewrites data/*.json in place
//
// Design: the source already uses readable Unicode glyphs (x², √, π …), so a run
// that is NOT wrapped still renders fine as plain text. We therefore bias towards
// wrapping only confidently-bounded expressions — under-wrapping is harmless,
// mis-wrapping yields broken KaTeX. Anything wrapped has its inner notation
// (super/subscripts, symbols, function names) rewritten to LaTeX.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['skills.json', 'dotpoints.json', 'topics.json', 'courses.json'];
const FIELDS = ['title', 'blurb', 'text', 'stream', 'strand'];

// ---- character maps ---------------------------------------------------------

const SUP = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9',
  'ⁿ':'n','ˣ':'x','ᵃ':'a','ᵇ':'b','ᶜ':'c','ᵈ':'d','ᵐ':'m','ⁱ':'i','ʳ':'r','ᵏ':'k','ᵗ':'t','⁺':'+','⁻':'-' };
const SUB = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
  'ₐ':'a','ₑ':'e','ₙ':'n','ₓ':'x' };
const SYM = { '×':'\\times ','÷':'\\div ','·':'\\cdot ','−':'-','±':'\\pm ','∓':'\\mp ',
  '≤':'\\le ','≥':'\\ge ','≠':'\\ne ','≈':'\\approx ','⇔':'\\Leftrightarrow ','→':'\\to ',
  '∞':'\\infty ','∝':'\\propto ','∪':'\\cup ','∩':'\\cap ','∫':'\\int ','∑':'\\sum ',
  'Σ':'\\Sigma ','Δ':'\\Delta ','μ':'\\mu ','σ':'\\sigma ','π':'\\pi ','θ':'\\theta ',
  '°':'^{\\circ}','′':"'",'½':'\\tfrac12 ','⅓':'\\tfrac13 ','∈':'\\in ','≡':'\\equiv ',
  'Ā':'\\bar{A}','≅':'\\cong ' };
const SUP_CHARS = Object.keys(SUP).join('');
const SUB_CHARS = Object.keys(SUB).join('');

// Function names that should get a backslash inside a maths run.
const FUNCS = ['sin','cos','tan','sec','cosec','cot','sinh','cosh','tanh','log','ln','lim','exp'];

// ---- notation → LaTeX (applied to the inside of a wrapped run) ---------------

function notationToLatex(s) {
  // Collapse runs of Unicode superscripts → ^{...}
  s = s.replace(new RegExp(`[${SUP_CHARS}]+`, 'g'), (m) =>
    '^{' + [...m].map((c) => SUP[c]).join('') + '}');
  // Collapse runs of Unicode subscripts → _{...}
  s = s.replace(new RegExp(`[${SUB_CHARS}]+`, 'g'), (m) =>
    '_{' + [...m].map((c) => SUB[c]).join('') + '}');

  // ⁿ√(x) already became ^{n}√... ; handle √ roots. √(...) and √x.
  s = s.replace(/\^\{n\}\s*√\s*\(([^()]*)\)/g, '\\sqrt[n]{$1}');
  s = s.replace(/\^\{n\}\s*√\s*([A-Za-z0-9]+)/g, '\\sqrt[n]{$1}');
  s = s.replace(/√\s*\(([^()]*)\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([A-Za-z0-9]+)/g, '\\sqrt{$1}');
  s = s.replace(/√/g, '\\sqrt{}');

  // Symbols
  for (const [k, v] of Object.entries(SYM)) s = s.split(k).join(v);

  // |x| absolute value → \lvert x \rvert is overkill; KaTeX renders |x| fine.

  // Function names → \name (word-boundary, not already preceded by backslash)
  for (const f of FUNCS) {
    s = s.replace(new RegExp(`(^|[^\\\\A-Za-z])(${f})(?![A-Za-z])`, 'g'), `$1\\${f} `);
  }

  // log_a / S_n style ASCII subscripts: ensure single-letter/number subscripts are braced
  s = s.replace(/_([A-Za-z0-9])/g, '_{$1}');
  // collapse accidental double spaces
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

// ---- run detection ----------------------------------------------------------

const SPECIAL = '=^_√÷×·−±≤≥≠≈⇔→∞∝∪∩∫∑ΣΔμσπθ°′½⅓∈≡Ā≅' + SUP_CHARS + SUB_CHARS;
const specialRe = new RegExp(`[${SPECIAL.replace(/[\\\]]/g, '\\$&')}]`);

const FUNC_SET = new Set(FUNCS);
const FILLER_WORDS = new Set(['dx','dy','dt','dr','dv','dQ']); // differentials inside runs

const stripPunct = (t) => t.replace(/^[(]*/, '').replace(/[)?.,;:]+$/, '');

// A token strongly signals maths: contains a special symbol, or an operator
// between alphanumerics, or a bracketed expression, or digit-letter adjacency.
function isStrongMath(tok) {
  const t = tok;
  if (specialRe.test(t)) return true;
  if (/[A-Za-z0-9)\]]\s*[=/]\s*[A-Za-z0-9(\-]/.test(t)) return true; // a=b, a/b
  if (/[A-Za-z0-9]\^/.test(t)) return true;
  if (/[A-Za-z]_[A-Za-z0-9{(]/.test(t)) return true;
  if (/^[A-Za-z]?\([A-Za-z0-9+\-*/^_,. ]*\)/.test(t) && /[+\-*/^=]/.test(t)) return true;
  return false;
}

// A token that can sit inside a run between strong-maths tokens.
function isFiller(tok) {
  const t = stripPunct(tok);
  if (t === '') return false;
  if (/^[A-Za-z]$/.test(t)) return true;                 // single variable
  if (/^[0-9]+([.,][0-9]+)?$/.test(t)) return true;       // number
  if (FUNC_SET.has(t.toLowerCase())) return true;          // sin, cos, …
  if (FILLER_WORDS.has(t)) return true;                    // dx, dt …
  if (/^[+\-=<>]$/.test(t)) return true;                   // bare operator
  if (/^[A-Za-z](\([^)]*\))$/.test(t)) return true;        // f(x)
  return false;
}

// ---- wrap a field -----------------------------------------------------------

function convertField(text) {
  if (typeof text !== 'string' || !specialRe.test(text) && !/[A-Za-z0-9]\/[A-Za-z0-9]/.test(text)) {
    return text;
  }
  const tokens = text.split(/(\s+)/); // keep whitespace tokens
  const out = [];
  let run = [];        // confirmed strong tokens (+ absorbed fillers)
  let pending = [];     // filler tokens awaiting a following strong token

  const flushRunAsMath = () => {
    if (!run.length) return;
    // Separate trailing punctuation from the final token so it stays outside $…$.
    let joined = run.join('');
    const tail = joined.match(/([?.,;:]+)$/);
    let suffix = '';
    if (tail) { suffix = tail[1]; joined = joined.slice(0, -suffix.length); }
    out.push('$' + notationToLatex(joined) + '$' + suffix);
    run = [];
  };
  const dropPendingAsText = () => { out.push(...pending); pending = []; };

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (/^\s+$/.test(tok)) {
      // whitespace: belongs to pending if a run/pending is open, else flush
      if (run.length || pending.length) pending.push(tok);
      else out.push(tok);
      continue;
    }
    if (isStrongMath(tok)) {
      if (pending.length) { run.push(...pending); pending = []; }
      run.push(tok);
    } else if ((run.length || pending.length) && isFiller(tok)) {
      pending.push(tok);
    } else {
      // prose word: close any run, emit pending as plain text
      flushRunAsMath();
      dropPendingAsText();
      out.push(tok);
    }
  }
  flushRunAsMath();
  dropPendingAsText();

  // Tidy: pull stray leading/trailing spaces that ended up adjacent to $.
  return out.join('').replace(/\s+\$/g, ' $').replace(/\$\s+/g, '$ ').replace(/\s{2,}/g, ' ').trimEnd();
}

// ---- run --------------------------------------------------------------------

const write = process.argv.includes('--write');
let changed = 0;
const report = [];

for (const file of FILES) {
  const path = join(root, 'data', file);
  const arr = JSON.parse(readFileSync(path, 'utf8'));
  for (const obj of arr) {
    for (const field of FIELDS) {
      const before = obj[field];
      if (typeof before !== 'string') continue;
      const after = convertField(before);
      if (after !== before) {
        changed++;
        report.push({ file, id: obj.id, field, before, after });
        obj[field] = after;
      }
    }
  }
  if (write) writeFileSync(path, JSON.stringify(arr, null, 2) + '\n');
}

for (const r of report) {
  console.log(`\n[${r.file} ${r.id} .${r.field}]`);
  console.log('  -', r.before);
  console.log('  +', r.after);
}
console.log(`\n${changed} field(s) ${write ? 'rewritten' : 'would change'}.`);
