const REPAIR = 'data-analysis-calculator-local-v1';
const GROUP_IDS = ['p52-model-1-group', 'p52-model-2-group'];
const SUMMARY_ID = 'a43ed60e-721a-4132-81e3-cfc89db6e343';
const PT_TO_MM = 25.4 / 72;

// Reference sans-serif advance metrics. These estimate widths; final printed
// widths must be checked with the application's actual font and renderer.
const ADVANCES = {
  ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889,
  '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584,
  ',': 278, '-': 333, '.': 278, '/': 278, ':': 278, ';': 278,
  '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778,
  H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722,
  O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722,
  V: 667, W: 944, X: 667, Y: 667, Z: 611,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556,
  h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556,
  o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556,
  v: 500, w: 722, x: 500, y: 500, z: 500,
  '[': 278, ']': 278, '–': 556, '—': 1000
};
for (const digit of '0123456789') ADVANCES[digit] = 556;

const INLINE_KEY_METRICS = {
  'p52-fx82-setup-shift-key': { label: 'SHIFT', extra: 3 },
  'p52-fx82-setup-mode-key': { label: 'MODE', extra: 3 },
  'p52-fx82-setup-stat-menu': { label: 'STAT', extra: 0 }
};

const textColumn = { kind: 'text' };
const menu = (label, minimum) => ({ kind: 'menu', label, minimum });
const TABLE_COLUMNS = {
  'p52-fx8200-home-row': [textColumn, 9],
  'p52-fx8200-statistics-row': [textColumn, 22, textColumn, 12],
  'p52-fx8200-one-variable-row': [textColumn, 12],
  'p52-fx8200-entry-row': [textColumn, 12],
  'p52-fx8200-frequency-a': [5, textColumn, 11, textColumn],
  'p52-fx8200-frequency-b': [5, textColumn, 11, textColumn],
  'p52-fx8200-results-row': [textColumn, 12, textColumn, 12],
  'p52-fx8200-down-row': [textColumn, 9, textColumn],
  'p52-fx82-mode-sequence': [menu('MODE', 15), menu('STAT', 14), menu('1-VAR', 17)],
  'p52-fx82-frequency-a': [5, textColumn],
  'p52-fx82-frequency-b': [5, textColumn, 9, textColumn],
  'p52-fx82-frequency-menu': [menu('Frequency?', 22), menu('2:OFF', 18)],
  'p52-fx82-var-menu': [menu('4:Var', 16), menu('3:σx', 18), menu('4:sx', 18)],
  'p52-fx82-minmax-menu': [menu('5:MinMax', 23), menu('1:minX', 20), menu('2:maxX', 20)]
};

function walk(value, visit, path = [], ancestors = []) {
  if (!value || typeof value !== 'object') return;
  visit(value, path, ancestors);
  for (const [key, child] of Object.entries(value)) {
    if (/^(source|provenance|evidence|history|revision|atoms|spec|bankRef|classification|studio)/i.test(key)) continue;
    if (child && typeof child === 'object') {
      walk(child, visit, [...path, key], [...ancestors, value]);
    }
  }
}

function matches(value, id) {
  const found = [];
  walk(value, (node, path, ancestors) => {
    if (node.id === id) found.push({ node, path, ancestors });
  });
  return found;
}

function requireUnique(value, id) {
  const found = matches(value, id);
  if (found.length !== 1) {
    throw new Error(`${REPAIR}: expected one ${id}; found ${found.length}.`);
  }
  return found[0];
}

function advance(text, fontSize) {
  let units = 0;
  for (const character of text) units += ADVANCES[character] ?? 600;
  return units / 1000 * fontSize * PT_TO_MM;
}

function roundUp(value) {
  return Math.ceil((value - 1e-9) * 10) / 10;
}

function paragraphAdvance(paragraph) {
  const fontSize = typeof paragraph.fontSize === 'number'
    ? Math.max(10, paragraph.fontSize) : 10;
  let width = 0;
  for (const inline of paragraph.inlines ?? []) {
    if (inline.type === 'text') {
      width += advance(inline.text ?? '', fontSize);
    } else if (inline.type === 'math') {
      const metric = INLINE_KEY_METRICS[inline.id];
      if (!metric) {
        throw new Error(`${REPAIR}: unmeasured inline mathematics in ${paragraph.id}.`);
      }
      width += advance(metric.label, fontSize) + metric.extra;
    } else {
      throw new Error(`${REPAIR}: unsupported inline in measured paragraph ${paragraph.id}.`);
    }
  }
  return width;
}

function textColumnWidth(table, column) {
  let maximum = 0;
  for (const row of table.rows ?? []) {
    const cell = row[column];
    if (!cell) continue;
    for (const block of cell.blocks ?? []) {
      if (block.type !== 'paragraph') {
        throw new Error(`${REPAIR}: unexpected measured cell content in ${table.id}.`);
      }
      maximum = Math.max(maximum, paragraphAdvance(block));
    }
  }
  if (!maximum) throw new Error(`${REPAIR}: empty measured column in ${table.id}.`);
  // Allow a font-metric reserve and a small gap before the adjacent key.
  return roundUp(maximum * 1.1 + 1.2);
}

function tableWidths(table, specifications) {
  if (!Array.isArray(table.widths) || table.widths.length !== specifications.length) {
    throw new Error(`${REPAIR}: unexpected column configuration in ${table.id}.`);
  }
  return specifications.map((specification, column) => {
    if (typeof specification === 'number') return specification;
    if (specification.kind === 'text') return textColumnWidth(table, column);
    return roundUp(Math.max(
      specification.minimum,
      advance(specification.label, 10) * 1.12 + 2.5
    ));
  });
}

export function repairDataAnalysisCalculator(project) {
  const next = structuredClone(project);
  const changes = [];
  const set = (node, path, field, value) => {
    if (JSON.stringify(node[field]) === JSON.stringify(value)) return;
    const wasPresent = Object.hasOwn(node, field);
    changes.push({
      path: [...path, field].join('.'),
      id: node.id ?? null,
      field,
      wasPresent,
      before: wasPresent ? structuredClone(node[field]) : null,
      after: structuredClone(value)
    });
    node[field] = value;
  };

  const groups = GROUP_IDS.map(id => requireUnique(next, id));
  for (const { node: group, path: groupPath } of groups) {
    if (group.type !== 'layout' || group.columns !== 1) {
      throw new Error(`${REPAIR}: calculator group structure changed: ${group.id}.`);
    }
    walk(group, (node, relativePath, ancestors) => {
      const path = [...groupPath, ...relativePath];
      if (node.type === 'paragraph' &&
          (node.id?.startsWith('p52-fx') || node.id === SUMMARY_ID)) {
        const inCell = ancestors.some(parent => parent.type === 'cell');
        const heading = node.id.endsWith('-heading');
        const fontSize = typeof node.fontSize === 'number'
          ? Math.max(10, node.fontSize) : 10;
        set(node, path, 'fontSize', fontSize);
        set(node, path, 'spaceBefore', 0);
        set(node, path, 'spaceAfter', inCell || node.id === SUMMARY_ID ? 0 : heading ? 1 : 0.6);
      }
      if ((node.type === 'table' || node.type === 'layout') &&
          node.id?.startsWith('p52-')) {
        for (const field of ['spaceBefore', 'spaceAfter', 'margin', 'padding']) {
          if (typeof node[field] === 'number') set(node, path, field, 0);
        }
      }
    });
  }

  for (const [id, specifications] of Object.entries(TABLE_COLUMNS)) {
    const { node: table, path } = requireUnique(next, id);
    if (table.type !== 'table') throw new Error(`${REPAIR}: ${id} is no longer a table.`);
    if (!groups.some(({ node }) => matches(node, id).length === 1)) {
      throw new Error(`${REPAIR}: ${id} is outside its calculator group.`);
    }
    const widths = tableWidths(table, specifications);
    // Preserve row heights, annotations, borders, cells and menu reading order.
    for (const annotation of table.annotations ?? []) {
      if (!(annotation.widthMm > 0)) continue;
      const row = (table.rows ?? []).find(cells => cells.some(cell => cell.id === annotation.cellId));
      const column = row?.findIndex(cell => cell.id === annotation.cellId) ?? -1;
      if (column < 0 || widths[column] < annotation.widthMm + 2) {
        throw new Error(`${REPAIR}: insufficient annotation clearance in ${id}.`);
      }
    }
    set(table, path, 'widths', widths);
    set(table, path, 'widthMm', roundUp(widths.reduce((sum, width) => sum + width, 0)));
  }

  // The supplied example already has a compact stack. Keep its table/results
  // arrangement and content; only reduce the existing horizontal local gap.
  const exampleArrangements = matches(next, 'p53-example-arrangement');
  for (const { node: arrangement, path: arrangementPath } of exampleArrangements) {
    walk(arrangement, (node, relativePath) => {
      if (node.id === 'p53-table-results-row' && typeof node.gap === 'number') {
        set(node, [...arrangementPath, ...relativePath], 'gap', Math.min(node.gap, 3));
      }
    });
  }

  // Only adjust documented local spacing where a p53 blockLayout already exists.
  // Do not add page-break properties or modify teaching controls.
  walk(next, (node, path) => {
    if (node.type !== 'question' || node.sourcePageNumber !== 53 ||
        matches(node, 'p53-calculator-task').length !== 1 ||
        !node.blockLayout || typeof node.blockLayout !== 'object') return;
    for (const field of ['before', 'after']) {
      if (typeof node.blockLayout[field] === 'number') {
        set(node.blockLayout, [...path, 'blockLayout'], field, 0);
      }
    }
  });

  return {
    next,
    provenance: {
      repair: REPAIR,
      sourcePages: [52, 53],
      changes,
      widthBasis: 'Reference sans-serif advance estimates with clearance reserves; actual final-size font measurement remains required.',
      requiredChecks: [
        'Shared ordered-list marker alignment against the first text baseline of a leading native table.',
        'Final student pages 62–64 and pagination neighbours, including model 2 plus the unchanged p53 example on page 63.',
        'Key-outline clearance, menu labels, table borders and editable save/reopen.'
      ],
      visualAcceptance: false
    }
  };
}
