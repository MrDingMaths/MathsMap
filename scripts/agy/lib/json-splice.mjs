// Byte-preserving item splices for public/content|quizzes JSON files.
//
// Repairs are item-scoped: a quiz question is addressed by its `id`, a practice item by
// tier + index (practice items carry no id). Everything outside the replaced item's own
// span — key order, whitespace, escapes, trailing content — is left byte-for-byte intact,
// so a repair can never silently reformat (and thus re-dirty) the rest of the file.

// Raw control chars are illegal inside JSON strings (the Wave-2 \t / \f corruption trap —
// a literal tab where \t was meant makes neighbouring escapes suspect). Detect them before
// generated content lands in public/.
export function findRawControlChars(rawText) {
  const bad = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < rawText.length; i++) {
    const c = rawText[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inString) { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString && c.charCodeAt(0) < 0x20) bad.push({ index: i, code: c.charCodeAt(0) });
  }
  return bad;
}

// Scan raw JSON text and return the [start, end) span of every balanced {…} object,
// string/escape aware.
export function scanObjectSpans(raw) {
  const spans = [];
  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inString) { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') stack.push(i);
    else if (c === '}') {
      const start = stack.pop();
      if (start !== undefined) spans.push({ start, end: i + 1 });
    }
  }
  return spans;
}

// Span of the ARRAY value belonging to `"key":` searched from `from`. String-aware search
// for the key token, then the first '[' after the colon, then bracket-balance to its ']'.
export function findArraySpan(raw, key, from = 0) {
  const token = `"${key}"`;
  let i = from;
  let inString = false;
  let escaped = false;
  let keyAt = -1;
  for (; i < raw.length; i++) {
    const c = raw[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inString) { escaped = true; continue; }
    if (c === '"') {
      if (!inString && raw.startsWith(token, i)) {
        const after = raw.slice(i + token.length).match(/^\s*:/);
        if (after) { keyAt = i; break; }
      }
      inString = !inString;
      continue;
    }
  }
  if (keyAt === -1) return null;
  const open = raw.indexOf('[', keyAt + token.length);
  if (open === -1) return null;
  let depth = 0;
  inString = false; escaped = false;
  for (let j = open; j < raw.length; j++) {
    const c = raw[j];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inString) { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return { start: open, end: j + 1 }; }
  }
  return null;
}

// Top-level object spans directly inside an array span (not nested inside other objects).
export function objectSpansInArray(raw, arraySpan) {
  const all = scanObjectSpans(raw).filter(s => s.start > arraySpan.start && s.end <= arraySpan.end);
  return all.filter(s => !all.some(o => o !== s && o.start < s.start && o.end > s.end))
    .sort((a, b) => a.start - b.start);
}

function detectIndent(raw, span) {
  const lineStart = raw.lastIndexOf('\n', span.start) + 1;
  const lead = raw.slice(lineStart, span.start);
  return /^\s*$/.test(lead) ? lead : '      ';
}

function serialiseAt(raw, span, replacement) {
  const indent = detectIndent(raw, span);
  const body = JSON.stringify(replacement, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : indent + line))
    .join('\n');
  return raw.slice(0, span.start) + body + raw.slice(span.end);
}

// Replace the quiz question whose `id` is itemId. Throws if absent or ambiguous.
export function spliceQuizItem(raw, itemId, replacement) {
  const arr = findArraySpan(raw, 'questions');
  if (!arr) throw new Error('no "questions" array found');
  const spans = objectSpansInArray(raw, arr);
  const matches = spans.filter(s => {
    try { return JSON.parse(raw.slice(s.start, s.end)).id === itemId; } catch { return false; }
  });
  if (matches.length !== 1) throw new Error(`quiz item ${itemId}: found ${matches.length} matching object(s)`);
  return serialiseAt(raw, matches[0], replacement);
}

// Replace practice item `index` (0-based) in tier 'foundation'|'development'|'mastery'.
export function splicePracticeItem(raw, tier, index, replacement) {
  const practiceKey = raw.indexOf('"practice"');
  if (practiceKey === -1) throw new Error('no "practice" object found');
  const arr = findArraySpan(raw, tier, practiceKey);
  if (!arr) throw new Error(`no "${tier}" array found under practice`);
  const spans = objectSpansInArray(raw, arr);
  if (index < 0 || index >= spans.length) throw new Error(`practice.${tier}[${index}]: only ${spans.length} item(s)`);
  return serialiseAt(raw, spans[index], replacement);
}
