const OPEN = '[tikz]';
const CLOSE = '[/tikz]';
export const PRACTICE_CARD_KEYS = new Set(['question_text', 'solution_text']);
export const QUIZ_QUESTION_KEYS = new Set(['id', 'question_text', 'structure', 'mastery', 'options', 'solution_text']);

export function unknownKeys(value, allowed) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value).filter((key) => !allowed.has(key))
    : [];
}

// Parse MathsBase-style text containing zero or more inline TikZ blocks.
// Returns text/tikz parts and structural errors without interpreting HTML.
export function splitInlineContent(value) {
  const source = String(value ?? '');
  const parts = [];
  const errors = [];
  let cursor = 0;

  while (cursor < source.length) {
    const open = source.indexOf(OPEN, cursor);
    const strayClose = source.indexOf(CLOSE, cursor);
    if (strayClose !== -1 && (open === -1 || strayClose < open)) {
      if (strayClose > cursor) parts.push({ type: 'text', value: source.slice(cursor, strayClose) });
      errors.push(`Unexpected ${CLOSE}`);
      cursor = strayClose + CLOSE.length;
      continue;
    }
    if (open === -1) {
      if (cursor < source.length) parts.push({ type: 'text', value: source.slice(cursor) });
      break;
    }
    if (open > cursor) parts.push({ type: 'text', value: source.slice(cursor, open) });
    const close = source.indexOf(CLOSE, open + OPEN.length);
    if (close === -1) {
      errors.push(`Missing ${CLOSE}`);
      parts.push({ type: 'text', value: source.slice(open) });
      break;
    }
    const code = source.slice(open + OPEN.length, close);
    if (!code.trim()) errors.push('Empty [tikz] block');
    parts.push({ type: 'tikz', value: code });
    cursor = close + CLOSE.length;
  }

  if (!source.length) parts.push({ type: 'text', value: '' });
  return { parts, errors };
}

// Relation macros (written `\le`, `\ge`, …) that an aligned block should line
// up on, alongside the bare `=`/`<`/`>` characters.
const RELATION_MACROS = new Set([
  'le', 'ge', 'leq', 'geq', 'lt', 'gt', 'approx', 'ne', 'neq', 'equiv',
  'cong', 'sim', 'simeq', 'propto', 'doteq', 'Rightarrow', 'rightarrow',
  'Leftrightarrow', 'leftrightarrow', 'to', 'mapsto'
]);

// A whole-line single maths run: `$…$` with no interior `$` and no trailing prose.
function pureMathInner(line) {
  const t = line.trim();
  if (t.length < 2 || t[0] !== '$' || t[t.length - 1] !== '$') return null;
  if (t.indexOf('$', 1) !== t.length - 1) return null; // interior `$` ⇒ not a single run
  const inner = t.slice(1, -1);
  // An explicit environment (aligned/cases/array/matrix) already controls its
  // own layout — leave it as a standalone line, never re-wrap it.
  if (/\\begin\s*\{/.test(inner)) return null;
  return inner;
}

// Index of the first top-level (brace-depth 0) relation to align on, or -1.
function relationCut(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
      if (m) {
        if (depth === 0 && RELATION_MACROS.has(m[1])) return i;
        i += m[0].length - 1; // skip the macro name
      } else {
        i += 1; // escaped punctuation like `\{`, `\,`
      }
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (depth === 0 && (c === '=' || c === '<' || c === '>')) return i;
  }
  return -1;
}

// Turn a run of consecutive pure-maths lines into one KaTeX `aligned` block so
// the relations column-align on screen (the house-style "align on =" setout).
// A single line is left untouched — only genuine multi-line working is wrapped.
function alignedFromRun(inners) {
  const rows = inners.map((inner) => {
    const cut = relationCut(inner);
    return cut === -1 ? `&${inner}` : `${inner.slice(0, cut)}&${inner.slice(cut)}`;
  });
  return `$\\begin{aligned}${rows.join(' \\\\ ')}\\end{aligned}$`;
}

// Split a text part's value into render blocks. Consecutive whole-line maths
// runs (2+) collapse into one `aligned` block; everything else stays as its own
// line (or a blank spacer), preserving today's behaviour for prose and singles.
export function groupTextBlocks(value) {
  const blocks = [];
  let run = [];
  const flush = () => {
    if (run.length >= 2) blocks.push({ kind: 'line', value: alignedFromRun(run) });
    else if (run.length === 1) blocks.push({ kind: 'line', value: `$${run[0]}$` });
    run = [];
  };
  for (const line of String(value ?? '').split(/\r?\n/)) {
    const inner = pureMathInner(line);
    if (inner !== null) {
      run.push(inner);
      continue;
    }
    flush();
    if (line) blocks.push({ kind: 'line', value: line });
    else blocks.push({ kind: 'blank' });
  }
  flush();
  return blocks;
}

export function extractTikzBlocks(value) {
  const parsed = splitInlineContent(value);
  return {
    blocks: parsed.parts.filter((part) => part.type === 'tikz').map((part) => part.value),
    errors: parsed.errors
  };
}

export function stripTikzBlocks(value) {
  const parsed = splitInlineContent(value);
  return parsed.parts.filter((part) => part.type === 'text').map((part) => part.value).join('').trim();
}

export function normalizeProcedureLabel(value) {
  return String(value ?? '')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/[*_.:;!?]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

// Procedure step headers are a standalone bold label ending a line, e.g.
// `1. **Factorise the LHS**`. A leading number/marker before the bold is ignored.
export function extractProcedureLabels(value) {
  const parsed = splitInlineContent(value);
  const labels = [];
  for (const part of parsed.parts) {
    if (part.type !== 'text') continue;
    for (const line of part.value.split(/\r?\n/)) {
      const match = /\*\*([^*]+)\*\*\s*$/.exec(line.trim());
      if (match) labels.push(match[1].trim());
    }
  }
  return labels;
}

// Step headers are optional (single-stage routines carry none). When present,
// every header must name a theory.steps entry and follow that procedure's order.
export function validateProcedureLabels(value, steps = []) {
  if (!steps.length) return [];
  const canonical = steps.map(normalizeProcedureLabel);
  const labels = extractProcedureLabels(value);
  if (!labels.length) return [];
  const errors = [];
  let previous = -1;
  for (const label of labels) {
    const index = canonical.indexOf(normalizeProcedureLabel(label));
    if (index === -1) errors.push(`procedure label "${label}" does not match theory.steps`);
    else if (index < previous) errors.push(`procedure label "${label}" is out of theory order`);
    else previous = index;
  }
  return errors;
}
