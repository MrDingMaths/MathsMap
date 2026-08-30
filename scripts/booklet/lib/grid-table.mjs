// Parser for the pandoc "grid table" syntax that every Word booklet exports as.
//
//   +--------+--------+
//   | a.     | b.     |
//   +========+========+
//   | 1.88   | 3.63   |
//   +--------+--------+
//
// The whole booklet's structure — review boxes, drill grids, worked examples, question
// cells — is carried in these tables, so this parser is the foundation of the whole
// transcription lane. It is deliberately deterministic and total: anything it cannot read
// is reported, never guessed.
//
// Three properties of pandoc's output drive the design:
//
//  1. **Column boundaries vary per row.** A box's title row spans the full width while the
//     rows below it are split into two or three columns, all in ONE table. So the boundary
//     set is the union of `+` positions over every border line, and a boundary counts as a
//     separator for a given row only when every content line of that row has a `|` there.
//  2. **Tables nest.** A Review box is a one-column table whose cell contains another whole
//     grid table (`| +------+ |`). Cells are re-parsed when their text looks like a table.
//  3. **`=` borders mark the header split**, and pandoc also emits `+:===:+` alignment
//     markers, so `:` must be stripped before reading boundary positions.

const BORDER_RE = /^\+[-=+:]+\+$/;

export function isBorderLine(line) {
  return BORDER_RE.test(line.trimEnd());
}

function isHeaderBorder(line) {
  return isBorderLine(line) && line.includes('=');
}

// Positions of every `+` in a border line. `:` alignment markers occupy the character
// slots either side of the dashes and must not shift the positions we read.
function borderStops(line) {
  const stops = [];
  for (let i = 0; i < line.length; i++) if (line[i] === '+') stops.push(i);
  return stops;
}

function rtrim(str) {
  return str.replace(/\s+$/, '');
}

// Strip the shared left indent from a cell's lines, so `a.  text` continuation lines
// (indented to align under the label) come back as one clean block.
function dedent(lines) {
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => (l.trim() ? l.slice(cut) : ''));
}

function trimBlankEdges(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start++;
  while (end > start && !lines[end - 1].trim()) end--;
  return lines.slice(start, end);
}

/**
 * Find the [start, end) line spans of every top-level grid table in `lines`.
 * A table runs from a border line to the last border line reachable through
 * content lines (lines starting with `|`).
 */
export function findTableSpans(lines) {
  const spans = [];
  let i = 0;
  while (i < lines.length) {
    if (!isBorderLine(lines[i])) {
      i++;
      continue;
    }
    let j = i + 1;
    let lastBorder = -1;
    while (j < lines.length) {
      const line = lines[j];
      if (isBorderLine(line)) {
        lastBorder = j;
        j++;
      } else if (line.trimStart().startsWith('|')) {
        j++;
      } else {
        break;
      }
    }
    if (lastBorder > i) {
      spans.push([i, lastBorder + 1]);
      i = lastBorder + 1;
    } else {
      i++;
    }
  }
  return spans;
}

/**
 * Parse one grid table.
 *
 * @param {string[]} lines the table's own lines, first and last being border lines
 * @returns {{ rows: Array<Array<{text: string, table: object|null, start: number, end: number}>>,
 *             headerRows: number, problems: string[] }}
 *          `headerRows` is how many leading rows sit above the `=` border (0 when absent).
 */
export function parseGridTable(lines, { depth = 0 } = {}) {
  const problems = [];
  const rows = [];
  if (!lines.length || !isBorderLine(lines[0])) {
    return { rows, headerRows: 0, problems: ['not a grid table: first line is not a border'] };
  }

  // The boundary set is the union over every border line: a row that spans columns has
  // fewer `+` than the widest row, and using any single border alone would lose columns.
  const boundarySet = new Set();
  for (const line of lines) if (isBorderLine(line)) for (const stop of borderStops(line)) boundarySet.add(stop);
  const boundaries = [...boundarySet].sort((a, b) => a - b);

  let headerRows = 0;
  let seenHeaderBorder = false;
  let rowLines = [];
  let rowStart = 0;

  const flushRow = (endIndex) => {
    const content = trimBlankEdges(rowLines);
    rowLines = [];
    if (!content.length) return;

    // A boundary separates cells in THIS row only when every one of its content lines
    // carries a `|` there; otherwise the cell spans across it.
    const active = boundaries.filter((pos) => content.every((line) => line[pos] === '|'));
    if (active.length < 2) {
      problems.push(`row at line ${rowStart + 1}: could not find cell boundaries (a content line is missing its | walls)`);
      return;
    }
    for (const line of content) {
      if (rtrim(line).at(-1) !== '|') {
        problems.push(`row at line ${rowStart + 1}: content line does not end with | — "${rtrim(line).slice(0, 60)}"`);
        break;
      }
    }

    const cells = [];
    for (let k = 0; k + 1 < active.length; k++) {
      const from = active[k] + 1;
      const to = active[k + 1];
      const cellLines = trimBlankEdges(dedent(content.map((line) => rtrim(line.slice(from, to)))));
      const text = cellLines.join('\n');
      // Cells nest whole grid tables, and NOT necessarily at their first line: a Review
      // box's cell reads "- Identify the side opposite" and only then opens its drill grid.
      // So scan the entire cell, and record where each nested table sat so a caller can
      // read the prose around it.
      const tables = [];
      if (depth < 4 && cellLines.length > 1) {
        for (const [a, b] of findTableSpans(cellLines)) {
          const nested = parseGridTable(cellLines.slice(a, b), { depth: depth + 1 });
          problems.push(...nested.problems.map((p) => `nested table at cell line ${a + 1}: ${p}`));
          tables.push({ startLine: a, endLine: b, table: nested });
        }
      }
      cells.push({ text, lines: cellLines, tables, table: tables.length === 1 ? tables[0].table : null, start: from, end: to });
    }
    rows.push(cells);
    if (!seenHeaderBorder) headerRows = rows.length;
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (isBorderLine(line)) {
      flushRow(i);
      if (isHeaderBorder(line) && !seenHeaderBorder) seenHeaderBorder = true;
      rowStart = i + 1;
    } else {
      if (!rowLines.length) rowStart = i;
      rowLines.push(line);
    }
  }
  flushRow(lines.length);

  // With no `=` border anywhere, nothing is a header.
  if (!seenHeaderBorder) headerRows = 0;
  return { rows, headerRows, problems };
}

/**
 * Flatten a parsed table to its cells in reading order, descending into nested tables.
 * Cells whose text is empty are kept — a blank cell is answer space in the Word original
 * and its position carries meaning.
 */
export function tableCells(table) {
  const out = [];
  for (const row of table.rows || []) {
    for (const cell of row) {
      if (cell.tables && cell.tables.length) {
        for (const nested of cell.tables) out.push(...tableCells(nested.table));
      } else {
        out.push(cell);
      }
    }
  }
  return out;
}

/**
 * The prose of a cell with the nested tables removed — the drill prompt that introduces
 * the grid ("Solve proportion equations. Round to 1 d.p.").
 */
export function cellProse(cell) {
  if (!cell.tables || !cell.tables.length) return cell.text;
  const drop = new Set();
  for (const { startLine, endLine } of cell.tables) {
    for (let i = startLine; i < endLine; i++) drop.add(i);
  }
  return (cell.lines || [])
    .filter((_, i) => !drop.has(i))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
