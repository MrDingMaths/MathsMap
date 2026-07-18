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
