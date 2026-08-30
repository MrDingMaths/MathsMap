// Splits a pandoc-from-docx booklet into sections, and each section into an ordered list of
// nodes: boxes (Review, Identify, Example, …), tier headings, numbered questions with their
// lettered cells, and paragraphs.
//
// This is the DETERMINISTIC half of the transcription lane. It never decides what a question
// means, only where it starts and stops and which cells and images belong to it. Anything it
// cannot classify becomes a `para` node and is reported — never dropped, never guessed —
// so the transcription agent places it and the fidelity check can see it happened.
import { findTableSpans, parseGridTable, cellProse } from './grid-table.mjs';
import { extractImageRefs, stripImageRefs } from './image-refs.mjs';
import { normaliseInline } from './normalise-md.mjs';

const HEADING_RE = /^# (.+)$/;
const TIER_RE = /^(Foundation|Development|Mastery)\s*$/;
const NUMBERED_RE = /^(\d+)\.\s+(.*)$/;
const BOX_LABEL_RE = /^\|\s*-\s*\*\*([^*]+)\*\*(.*)$/;
// "**2022 HSC Standard 2 Band 5**" / "**HSC Sample Question Band 6**"
const HSC_RE = /\*\*(?:(\d{4})\s+)?HSC\s+(.*?)\s*Band\s*(\d)\*\*/;

// Box label -> block type. Anything not listed is a teaching/definition box.
const BOX_TYPES = new Map([
  ['review', 'review'],
  ['identify', 'identify'],
  ['key ideas', 'keyIdeas'],
  ['write', 'write'],
  ['example', 'example'],
  ['guided practice', 'guided'],
  ['proof', 'proof'],
]);

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function boxTypeFor(label) {
  return BOX_TYPES.get(label.trim().toLowerCase()) || 'teach';
}

const TIER_CODE = { foundation: 'f', development: 'd', mastery: 'm' };

/**
 * A printed answer is the bare value the teacher version shows under a question:
 * `7.9 m`, `$16.5$`, `005^{\circ}`, or the multi-part `a) 110°  b) 169 km` form.
 * Prose is NOT an answer — a cell whose last line is a sentence falls through to the
 * transcription agent rather than being mis-read as a value.
 */
export function looksLikeAnswer(line) {
  const s = line.trim();
  if (!s) return false;
  if (/^[a-l]\\?\)/.test(s)) return true; // a) 110°   b) 169 km
  if (/^[A-Za-z ]{25,}$/.test(s)) return false; // a sentence
  // A short line that is mostly maths, digits, units or a bare symbol.
  const wordCount = s.replace(/\$[^$]*\$/g, '').split(/\s+/).filter((w) => /[A-Za-z]{3,}/.test(w)).length;
  return s.length <= 60 && wordCount <= 2 && /[\d$]/.test(s);
}

function splitAnswerParts(text) {
  const parts = [];
  const re = /(?:^|\s)([a-l])\\?\)\s*([^]*?)(?=(?:\s[a-l]\\?\))|$)/g;
  for (const m of text.matchAll(re)) parts.push({ label: m[1], answer: m[2].trim() });
  return parts;
}

function cellToItem(cell) {
  const raw = cell.text;
  const images = extractImageRefs(raw);
  const withoutImages = stripImageRefs(raw);
  const lines = withoutImages.split('\n');
  // A leading `a.` / `b.` is the cell's label; the rest is the question.
  const labelMatch = lines[0] ? lines[0].match(/^([a-l])\.\s*(.*)$/) : null;
  const label = labelMatch ? labelMatch[1] : null;
  if (labelMatch) lines[0] = labelMatch[2];

  // The printed answer, when present, is the last non-blank line.
  let answerRaw = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].trim()) continue;
    if (looksLikeAnswer(lines[i])) {
      answerRaw = lines[i].trim();
      lines.splice(i, 1);
    }
    break;
  }
  const body = normaliseInline(lines.join('\n'));
  return {
    label,
    stemRaw: body,
    answerRaw: answerRaw ? normaliseInline(answerRaw) : null,
    images,
    empty: !body && !answerRaw && images.length === 0,
  };
}

function boxNode(lines, start, end) {
  const table = parseGridTable(lines.slice(start, end));
  const first = lines[start + 1] || '';
  const m = first.match(BOX_LABEL_RE);
  const label = m ? m[1].trim() : null;
  // The label line is a table row, so it still carries its trailing cell padding and `|`
  // wall: "- **Identify** whether you can use sine rule   |".
  const titleRest = m ? m[2].replace(/\s*\|\s*$/, '').trim() : '';
  const type = label ? boxTypeFor(label) : 'teach';
  // Row 0 is the box's title bar; the body is everything after it.
  const bodyRows = table.rows.slice(table.headerRows > 0 ? table.headerRows : 1);
  const groups = [];
  const cells = [];
  const images = [];
  const prose = [];

  for (const row of bodyRows) {
    for (const cell of row) {
      if (cell.tables && cell.tables.length) {
        // A Review box: prose prompt(s) interleaved with drill grids.
        const promptText = normaliseInline(stripImageRefs(cellProse(cell)));
        for (const nested of cell.tables) {
          const nestedCells = [];
          for (const nrow of nested.table.rows) for (const ncell of nrow) {
            const item = cellToItem(ncell);
            if (!item.empty) nestedCells.push(item);
          }
          groups.push({ prompt: promptText, cells: nestedCells });
        }
        if (promptText) prose.push(promptText);
      } else {
        const item = cellToItem(cell);
        images.push(...item.images);
        if (item.label || item.answerRaw) {
          if (!item.empty) cells.push(item);
        } else if (item.stemRaw) {
          prose.push(item.stemRaw);
        }
      }
    }
  }

  return {
    kind: 'box',
    type,
    label,
    title: titleRest || label,
    lines: [start + 1, end],
    prose,
    groups,
    cells,
    images,
  };
}

function questionNode(lines, start, end, { number, stemText, tier }) {
  const slice = lines.slice(start, end);
  const tableSpans = findTableSpans(slice);
  const parts = [];
  const images = [];
  let prose = [stemText];

  for (const [a, b] of tableSpans) {
    const table = parseGridTable(slice.slice(a, b));
    for (const row of table.rows) for (const cell of row) {
      const item = cellToItem(cell);
      images.push(...item.images);
      if (item.empty) continue;
      if (item.label) parts.push(item);
      else if (item.stemRaw || item.answerRaw) parts.push(item);
    }
  }

  // Lines outside any table: continuation prose, `a) 110°` answer lines, an HSC tag,
  // bare image refs, or the printed answer of a table-free question.
  const covered = new Set();
  for (const [a, b] of tableSpans) for (let i = a; i < b; i++) covered.add(i);
  let source = null;
  const looseAnswers = [];
  const looseLines = [];
  for (let i = 1; i < slice.length; i++) {
    if (covered.has(i)) continue;
    const line = slice[i];
    if (!line.trim()) continue;
    const hsc = line.match(HSC_RE);
    if (hsc) {
      source = { kind: 'hsc', course: hsc[2].trim(), band: Number(hsc[3]) };
      if (hsc[1]) source.year = Number(hsc[1]);
      continue;
    }
    images.push(...extractImageRefs(line));
    const bare = stripImageRefs(line);
    if (!bare.trim()) continue;
    if (/^[a-l]\\?\)/.test(bare.trim())) looseAnswers.push(bare.trim());
    else looseLines.push(bare);
  }
  prose = prose.concat(looseLines).filter((p) => p && p.trim());

  const answerParts = looseAnswers.length ? splitAnswerParts(looseAnswers.join(' ')) : [];
  let answerRaw = null;
  if (!answerParts.length && !parts.length) {
    // A table-free question prints its answer as the last loose line.
    for (let i = prose.length - 1; i >= 0; i--) {
      if (looksLikeAnswer(prose[i])) {
        answerRaw = normaliseInline(prose[i]);
        prose.splice(i, 1);
      }
      break;
    }
  }

  return {
    kind: 'question',
    number,
    tier,
    lines: [start + 1, end],
    stemRaw: normaliseInline(prose.join('\n')),
    answerRaw,
    answerParts: answerParts.map((p) => ({ label: p.label, answerRaw: normaliseInline(p.answer) })),
    parts,
    images,
    source,
  };
}

// "**MA5-TRG-P-01** applies Pythagoras' theorem and …" then bold sub-headings and `- ` bullets.
const OUTCOME_RE = /^\*\*([A-Z]{2}\d[A-Z0-9-]*)\*\*\s*(.*)$/;

function foldSyllabus(nodes, slug) {
  // Paragraph nodes are one source line each; rejoin them into paragraphs first, because a
  // dot point wraps over two or three lines.
  const paragraphs = [];
  let current = [];
  let lastLine = -2;
  for (const node of nodes) {
    if (!node.text) continue;
    const bulletStart = /^-\s/.test(node.text);
    const outcomeStart = OUTCOME_RE.test(node.text) || /^\*\*/.test(node.text);
    if ((bulletStart || outcomeStart || node.lines[0] !== lastLine + 1) && current.length) {
      paragraphs.push({ text: current.join(' '), lines: [current.startLine, lastLine] });
      current = [];
    }
    if (!current.length) current.startLine = node.lines[0];
    current.push(node.text.replace(/^-\s+/, bulletStart ? '' : ''));
    current.isBullet = current.isBullet || bulletStart;
    lastLine = node.lines[0];
  }
  if (current.length) paragraphs.push({ text: current.join(' '), lines: [current.startLine, lastLine] });
  if (!paragraphs.length) return null;

  const outcomeMatch = paragraphs[0].text.match(OUTCOME_RE);
  if (!outcomeMatch) return null;
  const outcome = `**${outcomeMatch[1]}** ${outcomeMatch[2]}`.replace(/\s+/g, ' ').trim();
  const points = paragraphs.slice(1)
    .map((p) => p.text.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return {
    kind: 'box',
    type: 'syllabus',
    label: 'Syllabus Content',
    title: 'Syllabus Content',
    lines: [nodes[0].lines[0], nodes[nodes.length - 1].lines[1]],
    outcome,
    points,
    prose: [],
    groups: [],
    cells: [],
    images: [],
    slug,
  };
}

/**
 * @param {string[]} lines the whole booklet, split on newlines
 * @returns {{ sections: Array, problems: string[] }}
 */
export function sectionise(lines) {
  const problems = [];
  const sections = [];

  // Section boundaries first: everything before the first `# ` heading is the cover.
  const headings = [];
  lines.forEach((line, i) => {
    const m = line.match(HEADING_RE);
    if (m) headings.push({ title: m[1].trim(), line: i });
  });
  if (!headings.length) return { sections, problems: ['no `# ` headings found — is this a booklet export?'] };

  for (let h = 0; h < headings.length; h++) {
    const start = headings[h].line;
    const end = h + 1 < headings.length ? headings[h + 1].line : lines.length;
    const title = headings[h].title;
    const slug = slugify(title);
    const nodes = [];
    let tier = null;
    const tierCounters = { foundation: 0, development: 0, mastery: 0 };

    // Index the table spans of this section once; a question owns any table inside its span.
    const sectionLines = lines.slice(start, end);
    const spans = findTableSpans(sectionLines).map(([a, b]) => [a + start, b + start]);
    const spanStart = new Map(spans.map(([a, b]) => [a, b]));

    let i = start + 1;
    while (i < end) {
      const line = lines[i];

      if (spanStart.has(i)) {
        const tableEnd = spanStart.get(i);
        nodes.push(boxNode(lines, i, tableEnd));
        i = tableEnd;
        continue;
      }

      const tierMatch = line.match(TIER_RE);
      if (tierMatch) {
        tier = tierMatch[1].toLowerCase();
        nodes.push({ kind: 'tier', tier, lines: [i + 1, i + 1] });
        i++;
        continue;
      }

      const numbered = line.match(NUMBERED_RE);
      if (numbered) {
        // The question runs to the next numbered item, tier heading, or box that is not
        // one of its own answer grids — in practice, to the next line at column 0 that
        // starts a new structure.
        let j = i + 1;
        while (j < end) {
          if (spanStart.has(j)) {
            j = spanStart.get(j);
            continue;
          }
          const next = lines[j];
          if (NUMBERED_RE.test(next) || TIER_RE.test(next) || HEADING_RE.test(next)) break;
          j++;
        }
        const effectiveTier = tier || 'foundation';
        tierCounters[effectiveTier]++;
        nodes.push(questionNode(lines, i, j, {
          number: Number(numbered[1]),
          stemText: numbered[2],
          tier: effectiveTier,
        }));
        if (!tier) {
          problems.push(`${title}: question ${numbered[1]} at line ${i + 1} appears before any tier heading — defaulted to foundation`);
        }
        i = j;
        continue;
      }

      if (line.trim()) {
        const images = extractImageRefs(line);
        const text = normaliseInline(stripImageRefs(line));
        nodes.push({ kind: 'para', lines: [i + 1, i + 1], text, images });
      }
      i++;
    }

    // The Syllabus Content section is pure prose — an outcome code and its dot points —
    // with no tables at all, so the generic walk leaves it as a run of paragraphs. Its
    // shape is fixed and mechanical, so fold it into one `syllabus` block rather than
    // sending 27 unclassified paragraphs to a model.
    if (nodes.length && nodes.every((n) => n.kind === 'para')) {
      const syllabus = foldSyllabus(nodes, slug);
      if (syllabus) nodes.splice(0, nodes.length, syllabus);
    }

    // Ids are assigned from the booklet's own numbering per tier, so a card's id is
    // stable against re-runs and legible against the printed booklet.
    let boxCounts = {};
    for (const node of nodes) {
      if (node.kind === 'question') {
        node.id = `${slug}-${TIER_CODE[node.tier]}${node.number}`;
      } else if (node.kind === 'box') {
        boxCounts[node.type] = (boxCounts[node.type] || 0) + 1;
        node.id = `${slug}-${node.type}-${boxCounts[node.type]}`;
      }
    }

    const unclassified = nodes.filter((n) => n.kind === 'para' && (n.text || n.images.length));
    if (unclassified.length) {
      problems.push(`${title}: ${unclassified.length} unclassified paragraph(s) at line(s) ${unclassified.map((n) => n.lines[0]).join(', ')} — the transcription task must place them`);
    }

    sections.push({ title, slug, lines: [start + 1, end], nodes });
  }

  return { sections, problems };
}
