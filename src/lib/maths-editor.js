// MathsEditor is deliberately a small document-neutral rich-text engine. A
// booklet owns blocks and page flow; this module only owns the inline prose
// and maths value used by those blocks.

import { renderMath } from './render-math.js';

export const MATHS_EDITOR_VERSION = 1;
export const RICH_TEXT_FORMAT = 'mathsmap-rich-text-v1';

const INLINE_TYPES = new Set(['text', 'math', 'break', 'cloze']);

function clone(value) {
  if (value === undefined) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function marksOf(value) {
  const marks = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(marks.filter((mark) => mark === 'bold' || mark === 'italic'))];
}

export function textNode(text = '', marks = []) {
  return { type: 'text', text: String(text ?? ''), marks: marksOf(marks) };
}

export function mathNode(latex = '', { display = false, source = null } = {}) {
  return { type: 'math', latex: String(latex ?? ''), display: Boolean(display), source: source ?? null };
}

export function hardBreakNode() {
  return { type: 'break', hard: true };
}

export function clozeNode(answer = '', width = 24) {
  const numericWidth = Number(width);
  return {
    type: 'cloze',
    answer: String(answer ?? ''),
    width: Number.isFinite(numericWidth) ? Math.max(8, Math.min(120, numericWidth)) : 24,
  };
}

export function paragraph(inlines = []) {
  return { type: 'paragraph', inlines: normalizeInlines(inlines) };
}

function appendText(out, value, marks = []) {
  const text = String(value ?? '');
  if (!text) return;
  const normalizedMarks = marksOf(marks);
  const previous = out.at(-1);
  if (previous?.type === 'text' && JSON.stringify(previous.marks) === JSON.stringify(normalizedMarks)) {
    previous.text += text;
  } else {
    out.push(textNode(text, normalizedMarks));
  }
}

function consumeDelimited(source, start, delimiter) {
  let cursor = start + delimiter.length;
  while (cursor < source.length) {
    const found = source.indexOf(delimiter, cursor);
    if (found === -1) return null;
    let backslashes = 0;
    for (let i = found - 1; i >= 0 && source[i] === '\\'; i -= 1) backslashes += 1;
    if (backslashes % 2 === 0) return { value: source.slice(start + delimiter.length, found), end: found + delimiter.length };
    cursor = found + delimiter.length;
  }
  return null;
}

function parseInlineString(source) {
  const out = [];
  let cursor = 0;
  let plain = '';
  const flush = () => {
    appendText(out, plain);
    plain = '';
  };

  while (cursor < source.length) {
    if (source[cursor] === '\\' && source[cursor + 1] === '$') {
      plain += '$';
      cursor += 2;
      continue;
    }
    if (source.startsWith('$$', cursor)) {
      const match = consumeDelimited(source, cursor, '$$');
      if (match) {
        flush();
        out.push(mathNode(match.value, { display: true }));
        cursor = match.end;
        continue;
      }
    }
    if (source[cursor] === '$') {
      const match = consumeDelimited(source, cursor, '$');
      if (match) {
        flush();
        out.push(mathNode(match.value));
        cursor = match.end;
        continue;
      }
    }
    if (source.startsWith('[[', cursor)) {
      const end = source.indexOf(']]', cursor + 2);
      if (end !== -1) {
        const encoded = source.slice(cursor + 2, end);
        const split = encoded.lastIndexOf('|');
        const answer = split === -1 ? encoded : encoded.slice(0, split);
        const width = split === -1 ? 24 : encoded.slice(split + 1);
        flush();
        out.push(clozeNode(answer, width));
        cursor = end + 2;
        continue;
      }
    }
    if (source.startsWith('**', cursor)) {
      const match = consumeDelimited(source, cursor, '**');
      if (match) {
        flush();
        parseInlineString(match.value).forEach((node) => {
          if (node.type === 'text') appendText(out, node.text, [...node.marks, 'bold']);
          else out.push(node);
        });
        cursor = match.end;
        continue;
      }
    }
    if (source[cursor] === '_' && source[cursor + 1] !== '_') {
      const match = consumeDelimited(source, cursor, '_');
      if (match) {
        flush();
        parseInlineString(match.value).forEach((node) => {
          if (node.type === 'text') appendText(out, node.text, [...node.marks, 'italic']);
          else out.push(node);
        });
        cursor = match.end;
        continue;
      }
    }
    plain += source[cursor];
    cursor += 1;
  }
  flush();
  return out.length ? out : [textNode('')];
}

function splitSourceParagraphs(source) {
  const normalized = String(source ?? '').replace(/\r\n?/g, '\n');
  // A blank line is an Enter-created paragraph boundary. A single newline is
  // retained as a hard break, which is important for worked maths set-out.
  return normalized.split(/\n{2,}/).map((value) => value.split('\n'));
}

export function parseRichText(source = '') {
  if (source && typeof source === 'object') return normalizeRichText(source);
  const paragraphs = splitSourceParagraphs(String(source ?? '')).map((lines) => {
    const inlines = [];
    lines.forEach((line, index) => {
      if (index) inlines.push(hardBreakNode());
      inlines.push(...parseInlineString(line));
    });
    return paragraph(inlines);
  });
  return { format: RICH_TEXT_FORMAT, version: MATHS_EDITOR_VERSION, paragraphs };
}

function normalizeInline(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string' || typeof raw === 'number') return textNode(raw);
  const type = raw.type ?? raw.kind;
  if (type === 'text' || type === 'prose') return textNode(raw.text ?? raw.value ?? '', raw.marks);
  if (type === 'math' || type === 'latex') return mathNode(raw.latex ?? raw.value ?? raw.source ?? '', { display: raw.display, source: raw.source });
  if (type === 'break' || type === 'hard-break' || type === 'hardBreak') return hardBreakNode();
  if (type === 'cloze' || type === 'inline-cloze') return clozeNode(raw.answer ?? raw.value ?? '', raw.width ?? raw.widthMm);
  return textNode(raw.text ?? raw.value ?? '');
}

function normalizeInlines(raw) {
  const values = Array.isArray(raw) ? raw : [raw];
  const result = [];
  for (const value of values) {
    const node = normalizeInline(value);
    if (!node) continue;
    if (node.type === 'text' && !node.text) {
      if (!result.length) result.push(node);
      continue;
    }
    const previous = result.at(-1);
    if (node.type === 'text' && previous?.type === 'text' && JSON.stringify(previous.marks) === JSON.stringify(node.marks)) previous.text += node.text;
    else result.push(node);
  }
  return result.length ? result : [textNode('')];
}

export function normalizeRichText(raw = '') {
  if (typeof raw === 'string' || typeof raw === 'number' || raw == null) return parseRichText(String(raw ?? ''));
  if (Array.isArray(raw)) {
    if (raw.some((item) => item?.type === 'paragraph')) return { format: RICH_TEXT_FORMAT, version: MATHS_EDITOR_VERSION, paragraphs: raw.map((item) => paragraph(item.inlines ?? item.children ?? [])) };
    return { format: RICH_TEXT_FORMAT, version: MATHS_EDITOR_VERSION, paragraphs: [paragraph(raw)] };
  }
  const source = raw.source ?? raw.sourceFallback ?? null;
  const rawParagraphs = raw.paragraphs ?? raw.blocks ?? null;
  const paragraphs = rawParagraphs
    ? rawParagraphs.map((item) => paragraph(item?.inlines ?? item?.children ?? item ?? []))
    : [paragraph(raw.inlines ?? raw.segments ?? raw.nodes ?? [])];
  return { format: raw.format ?? RICH_TEXT_FORMAT, version: raw.version ?? MATHS_EDITOR_VERSION, paragraphs, source: source == null ? null : String(source) };
}

function serializeInline(node) {
  const value = normalizeInline(node);
  if (!value) return '';
  if (value.type === 'math') return value.display ? `$$${value.latex}$$` : `$${value.latex}$`;
  if (value.type === 'break') return '\n';
  if (value.type === 'cloze') return `[[${value.answer}|${value.width}]]`;
  let text = value.text;
  if (value.marks.includes('bold')) text = `**${text}**`;
  if (value.marks.includes('italic')) text = `_${text}_`;
  return text.replace(/\$/g, '\\$');
}

export function serializeRichText(raw) {
  const value = normalizeRichText(raw);
  return value.paragraphs.map((item) => item.inlines.map(serializeInline).join('')).join('\n\n');
}

export const richTextToSource = serializeRichText;

export function richTextToPlainText(raw, { fillCloze = false } = {}) {
  const value = normalizeRichText(raw);
  return value.paragraphs.map((item) => item.inlines.map((node) => {
    const valueNode = normalizeInline(node);
    if (valueNode.type === 'math') return valueNode.latex;
    if (valueNode.type === 'break') return '\n';
    if (valueNode.type === 'cloze') return fillCloze ? valueNode.answer : ' '.repeat(Math.max(3, Math.round(valueNode.width / 4)));
    return valueNode.text;
  }).join('')).join('\n\n');
}

export function getSourceFallback(raw, fallback = '') {
  const value = normalizeRichText(raw);
  return value.source || serializeRichText(value) || String(fallback ?? '');
}

export function roundTripRichText(raw) {
  return normalizeRichText(parseRichText(serializeRichText(raw)));
}

export function insertInlineMath(raw, latex, paragraphIndex = 0, inlineIndex = null) {
  const value = normalizeRichText(raw);
  const target = value.paragraphs[Math.max(0, Math.min(value.paragraphs.length - 1, paragraphIndex))] ?? paragraph([]);
  const index = inlineIndex == null ? target.inlines.length : Math.max(0, Math.min(target.inlines.length, inlineIndex));
  target.inlines.splice(index, 0, mathNode(latex));
  return value;
}

export function insertInlineCloze(raw, answer = '', width = 24, paragraphIndex = 0, inlineIndex = null) {
  const value = normalizeRichText(raw);
  const target = value.paragraphs[Math.max(0, Math.min(value.paragraphs.length - 1, paragraphIndex))] ?? paragraph([]);
  const index = inlineIndex == null ? target.inlines.length : Math.max(0, Math.min(target.inlines.length, inlineIndex));
  target.inlines.splice(index, 0, clozeNode(answer, width));
  return value;
}

export function toggleMark(raw, paragraphIndex, inlineIndex, mark) {
  const value = normalizeRichText(raw);
  const node = value.paragraphs[paragraphIndex]?.inlines[inlineIndex];
  if (!node || node.type !== 'text' || !['bold', 'italic'].includes(mark)) return value;
  node.marks = node.marks.includes(mark) ? node.marks.filter((item) => item !== mark) : [...node.marks, mark];
  return value;
}

export function splitParagraphAt(raw, paragraphIndex, inlineIndex, characterOffset = 0) {
  const value = normalizeRichText(raw);
  const target = value.paragraphs[paragraphIndex];
  if (!target) return value;
  const left = [];
  const right = [];
  target.inlines.forEach((node, index) => {
    if (index < inlineIndex) left.push(clone(node));
    else if (index > inlineIndex) right.push(clone(node));
    else if (node.type === 'text') {
      left.push(textNode(node.text.slice(0, characterOffset), node.marks));
      right.push(textNode(node.text.slice(characterOffset), node.marks));
    } else {
      right.push(clone(node));
    }
  });
  value.paragraphs.splice(paragraphIndex, 1, paragraph(left), paragraph(right));
  return value;
}

export function insertHardBreak(raw, paragraphIndex, inlineIndex = null) {
  const value = normalizeRichText(raw);
  const target = value.paragraphs[paragraphIndex];
  if (!target) return value;
  target.inlines.splice(inlineIndex == null ? target.inlines.length : inlineIndex, 0, hardBreakNode());
  return value;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderRichTextHtml(raw, { fillCloze = false, editable = false } = {}) {
  const value = normalizeRichText(raw);
  const paragraphs = value.paragraphs.map((item) => {
    const html = item.inlines.map((node) => {
      const valueNode = normalizeInline(node);
      if (valueNode.type === 'math') {
        const source = escapeHtml(`$${valueNode.latex}$`);
        return `<span class="math-island" data-node-type="math" data-latex="${escapeHtml(valueNode.latex)}" data-display="${valueNode.display ? 'true' : 'false'}" data-source="${source}"${editable ? ' contenteditable="false"' : ''}>${renderMath('$' + valueNode.latex + '$')}</span>`;
      }
      if (valueNode.type === 'break') return '<br data-node-type="break">';
      if (valueNode.type === 'cloze') {
        const answer = fillCloze ? escapeHtml(valueNode.answer) : '';
        return `<span class="cloze-island" data-node-type="cloze" data-answer="${escapeHtml(valueNode.answer)}" data-width="${valueNode.width}" style="--cloze-width:${valueNode.width}mm"${editable ? ' contenteditable="false"' : ''}>${answer || '&nbsp;'}</span>`;
      }
      let text = escapeHtml(valueNode.text);
      if (valueNode.marks.includes('bold')) text = `<strong>${text}</strong>`;
      if (valueNode.marks.includes('italic')) text = `<em>${text}</em>`;
      return text;
    }).join('');
    return `<p>${html || '<br>'}</p>`;
  }).join('');
  return paragraphs || '<p><br></p>';
}

function marksFromElement(element) {
  const marks = [];
  let cursor = element;
  while (cursor) {
    if (cursor.nodeType === 1) {
      const tag = cursor.tagName.toLowerCase();
      if (tag === 'strong' || tag === 'b') marks.push('bold');
      if (tag === 'em' || tag === 'i') marks.push('italic');
    }
    cursor = cursor.parentNode;
  }
  return marks;
}

export function parseEditorDom(root) {
  if (!root) return parseRichText('');
  const paragraphs = [];
  const sourceParagraph = (element) => {
    const inlines = [];
    const visit = (node) => {
      if (node.nodeType === 3) {
        appendText(inlines, node.nodeValue, marksFromElement(node.parentElement));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      if (node.dataset.nodeType === 'math') { inlines.push(mathNode(node.dataset.latex ?? '', { display: node.dataset.display === 'true' })); return; }
      if (node.dataset.nodeType === 'cloze') { inlines.push(clozeNode(node.dataset.answer ?? '', node.dataset.width)); return; }
      if (tag === 'br') { inlines.push(hardBreakNode()); return; }
      [...node.childNodes].forEach(visit);
    };
    [...element.childNodes].forEach(visit);
    return paragraph(inlines);
  };
  const children = [...root.childNodes];
  if (!children.length) return parseRichText('');
  children.forEach((child) => {
    if (child.nodeType === 1 && ['p', 'div'].includes(child.tagName.toLowerCase())) paragraphs.push(sourceParagraph(child));
    else if (child.nodeType === 3 && child.nodeValue) paragraphs.push(paragraph([textNode(child.nodeValue)]));
    else if (child.nodeType === 1) paragraphs.push(sourceParagraph(child));
  });
  return { format: RICH_TEXT_FORMAT, version: MATHS_EDITOR_VERSION, paragraphs: paragraphs.length ? paragraphs : [paragraph([])] };
}
