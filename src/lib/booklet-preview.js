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
  return trimmed.slice(1, -1).split('|').map((cell) => cell.trim());
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
    parts.push({ type: 'table', header: header.some(Boolean) ? header : null, rows });
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

export function visibleImportedQuestionTitle(question) {
  const title = String(question?.title ?? '').trim();
  if (!title || title === String(question?.content?.prompt ?? '').trim()) return '';
  return /^(NAPLAN|HSC)\b/i.test(title) ? title : '';
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
        label: atom.kind === 'investigation' ? '' : atom.label,
        description: atom.kind === 'investigation' ? investigationDescription(atom.description || atom.sourceText) : atom.description,
      },
      blocks: [block],
    });
  }
  return result;
}
