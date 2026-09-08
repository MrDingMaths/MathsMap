export function resolvePreviewAssets(value, resolveAssetUrl) {
  const seen = new WeakMap();

  function visit(item) {
    if (!item || typeof item !== 'object') return item;
    if (seen.has(item)) return seen.get(item);
    const copy = Array.isArray(item) ? [] : {};
    seen.set(item, copy);
    for (const [key, child] of Object.entries(item)) {
      copy[key] = key === 'src' && typeof child === 'string' ? resolveAssetUrl(child) : visit(child);
    }
    return copy;
  }

  return visit(value);
}

function markdownCells(line) {
  const trimmed = String(line ?? '').trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  return tableCells(trimmed);
}

export function splitBookletTables(value) {
  const lines = String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
  const parts = [];
  let textLines = [];
  const flushText = () => {
    const text = textLines.join('\n').replace(/^\n+|\n+$/g, '');
    if (text) parts.push({ type: 'text', value: text });
    textLines = [];
  };
  for (let index = 0; index < lines.length;) {
    const header = markdownCells(lines[index]);
    const separator = markdownCells(lines[index + 1]);
    const isTable = header && separator && separator.length === header.length
      && separator.every((cell) => /^:?-{3,}:?$/.test(cell));
    if (!isTable) {
      textLines.push(lines[index]);
      index += 1;
      continue;
    }
    flushText();
    index += 2;
    const rows = [];
    while (index < lines.length) {
      const row = markdownCells(lines[index]);
      if (!row || row.length !== header.length) break;
      rows.push(row);
      index += 1;
    }
    parts.push({ type: 'table', header: header.some(Boolean) ? header : null, rows, alignments: separator.map(cell => cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : 'left') });
  }
  flushText();
  return parts;
}

export function isRewriteTableQuestion(question) {
  const content = question?.content;
  return /^Fill in the table\b/i.test(content?.prompt ?? '')
    && content?.layout === 'grid'
    && Number(content?.columns) === 2
    && (content?.children?.length ?? 0) >= 4
    && content.children.every((child) => !(child.children?.length));
}

export function shortAnswerDisplay(value) {
  if (value?.format === 'maths-editor-document-v1') return value;
  const text = String(value ?? '');
  // Legacy numeric answers may contain bare TeX. Render the formula without
  // rewriting its stored review value or treating prose/currency as mathematics.
  return !text.includes('$') && /^[+-]?\d/.test(text) && /\\(?:circ|text|frac|sqrt)\b/.test(text) ? `$${text}$` : text;
}

export function visibleImportedQuestionTitle(question) {
  const title = String(question?.title ?? '').trim();
  const prompt = String(question?.content?.prompt ?? '').trim().replace(/\*\*/g, '');
  if (!title || title === prompt || prompt.startsWith(title + '\n') || prompt.startsWith(title + ':')) return '';
  return /^(?:\d{4}\s+)?(?:NAPLAN|HSC)\b/i.test(title) ? title : '';
}

// Explicit layout opt-in: keep source text editable as one field, but present
// numbered rules with indented bullets and their maths in an adjacent column.
export function numberedTheoryRules(value) {
  if (typeof value !== 'string') return null;
  const rules = [];
  for (const line of value.split(/\r?\n/).filter((line) => line.trim())) {
    const heading = line.match(/^(\d+)\.\s+(.+)$/);
    if (heading) { rules.push({ number: heading[1], text: heading[2], bullets: [] }); continue; }
    const bullet = line.match(/^\s+[-*]\s+(.+)$/);
    if (!bullet || !rules.length) return null;
    const parts = bullet[1].match(/^(.*?)\s+(\$[^$]+\$)$/);
    rules.at(-1).bullets.push({ text: parts ? parts[1] : bullet[1], maths: parts?.[2] ?? '' });
  }
  return rules.length && rules.every((rule) => rule.bullets.length) ? rules : null;
}

// Compile compatible TikZ layers together so independent SVG bounds and wrapper
// margins cannot shift solution arrows relative to the question number line.
export function combinedExampleTikz(base, overlay) {
  if (base?.format !== 'tikz' || overlay?.format !== 'tikz' || overlay.overlayOf !== base.id) return null;
  const pattern = /^\s*\\begin\{tikzpicture\}(\[[^\]]*\])?([\s\S]*?)\\end\{tikzpicture\}\s*$/;
  const a = base.code?.match(pattern);
  const b = overlay.code?.match(pattern);
  if (!a || !b || (a[1] ?? '') !== (b[1] ?? '')) return null;
  return `\\begin{tikzpicture}${a[1] ?? ''}${a[2]}${b[2]}\\end{tikzpicture}`;
}

export function investigationDescription(value) {
  return String(value ?? '').replace(/^\s*Investigation\s+/i, '').trim();
}

export function groupBookletBlocks(blocks = []) {
  const result = [];
  for (const block of blocks) {
    const atom = block?.sourceAtom;
    if (!atom?.id) {
      result.push({ type: 'block', id: block.id, block });
      continue;
    }
    const previous = result.at(-1);
    if (previous?.type === 'teaching-atom' && previous.atom.id === atom.id) {
      previous.blocks.push(block);
      continue;
    }
    result.push({
      type: 'teaching-atom',
      id: atom.id,
      atom: {
        ...atom,
        label: atom.visibleSubtitle !== undefined ? atom.label : atom.kind === 'investigation' ? '' : atom.label,
        description: atom.description,
        visibleSubtitle: atom.visibleSubtitle ?? (['review','guided-practice','definition','key-ideas'].includes(atom.kind) ? '' : atom.kind === 'investigation' ? investigationDescription(atom.description || atom.sourceText) : atom.description),
      },
      blocks: [block],
    });
  }
  return result;
}
import { tableCells } from '../../public/libs/maths-editor/document-model.mjs';
