// Deterministic first pass of the booklet transcription lane.
//
//   node scripts/booklet/parse-booklet.mjs --md "booklets/Stage 5/Trigonometry C 2_....md" \
//     --docx "booklets/Trigonometry C 2_....docx" --bank s5-trig-c-2 \
//     --out .agywork/booklet/s5-trig-c-2/parsed
//
// Writes, per section:
//   parsed/<section>.json  the SKELETON — ids, tiers, origins, figures (png + crop + width),
//                          part labels, the raw stem/answer text, HSC provenance
//   parsed/<section>.md    the normalised, line-numbered source slice for the task packet
// plus parsed/index.json (section list, counts) and parsed/cover.json (booklet meta).
//
// Everything here is mechanical. The skeleton's `origin`, `figure.png`, `tier`, `id` and
// part labels are FIXED — the transcription agent may only fill the null fields. That is
// what makes the collector able to prove the model did not invent or drop a question.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename } from 'node:path';
import { sectionise } from './lib/section-model.mjs';
import { extractImageRefs } from './lib/image-refs.mjs';
import { normaliseInline } from './lib/normalise-md.mjs';
import { readZip, parseRels, extractDrawings, alignRefsToDrawings } from './lib/docx.mjs';
import { parseGridTable, findTableSpans } from './lib/grid-table.mjs';
import { rejectStrayPositionals } from '../lib/argv.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function arg(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : fallback;
}

/**
 * Every image reference in the parsed sections, in document order.
 *
 * References MUST be collected from the parsed cells, never by running the image regex over
 * the raw markdown: inside a grid table, three cells share every physical line, so a regex
 * reading the raw file matches across the `|` walls and swallows its neighbours' references
 * (201 found that way against 300 real pictures). The cell text the grid parser produces is
 * the only correct place to read them from.
 */
export function collectRefs(sections) {
  const refs = [];
  // A node's own `images` list repeats the references its cells and parts already hold —
  // the same objects — so identity-dedupe rather than counting a picture twice.
  const seen = new Set();
  const visit = (images) => {
    for (const image of images || []) {
      if (seen.has(image)) continue;
      seen.add(image);
      refs.push(image);
    }
  };
  for (const section of sections) {
    for (const node of section.nodes) {
      if (node.kind === 'box') {
        for (const group of node.groups || []) for (const cell of group.cells) visit(cell.images);
        for (const cell of node.cells || []) visit(cell.images);
        visit(node.images);
      } else if (node.kind === 'question') {
        for (const part of node.parts || []) visit(part.images);
        visit(node.images);
      } else if (node.kind === 'para') {
        visit(node.images);
      }
    }
  }
  return refs;
}

/**
 * Attach the crop and printed size Word applied to each collected reference.
 * Returns a Map keyed by the reference OBJECT, so no fuzzy (png, width) rematching is
 * needed downstream — the identity of the reference is the key.
 */
export function buildCropIndex(sections, docxPath) {
  const refs = collectRefs(sections);
  if (!docxPath || !existsSync(docxPath)) {
    return {
      byRef: new Map(),
      refs: refs.length,
      problems: docxPath
        ? [`docx not found: ${docxPath} — figures will carry no crop, so composite images print whole`]
        : ['no --docx given: figures will carry no crop, so composite images print whole'],
    };
  }
  const zip = readZip(readFileSync(docxPath));
  const documentXml = zip.get('word/document.xml');
  const relsXml = zip.get('word/_rels/document.xml.rels');
  if (!documentXml || !relsXml) {
    return { byRef: new Map(), refs: refs.length, problems: [`${basename(docxPath)}: missing word/document.xml or its rels`] };
  }

  const drawings = extractDrawings(documentXml.toString('utf8'), parseRels(relsXml.toString('utf8')));
  const { pairs, problems } = alignRefsToDrawings(refs, drawings);
  const byRef = new Map();
  for (const pair of pairs) {
    byRef.set(pair.ref, {
      crop: pair.drawing.crop,
      widthCm: pair.ref.widthCm ?? pair.drawing.widthCm,
      exactWidth: pair.exactWidth,
    });
  }
  return {
    byRef,
    problems,
    drawings: drawings.length,
    refs: refs.length,
    cropped: pairs.filter((p) => p.drawing.crop).length,
    widthConflicts: pairs.filter((p) => p.widthConflict).length,
  };
}

function figureOf(ref, cropIndex) {
  const found = cropIndex.byRef.get(ref);
  const figure = { png: `figures/${ref.png}`, widthCm: ref.widthCm ?? found?.widthCm ?? null };
  if (found && found.crop) figure.crop = found.crop;
  return figure;
}

function figureFor(images, cropIndex) {
  if (!images || !images.length) return null;
  return figureOf(images[0], cropIndex);
}

// The schema carries ONE `figure` per card, part or cell, but a booklet cell sometimes shows
// two pictures (a before/after pair, a plan and elevation). Dropping the extras silently
// would lose content, so every figure a cell holds is listed in `_source.figures` for the
// transcription agent to place — usually by splitting the cell or naming the second picture
// in the stem.
function figuresFor(images, cropIndex) {
  return (images || []).map((ref) => figureOf(ref, cropIndex));
}

// --- skeleton emitters -------------------------------------------------------

function skeletonCard(node, { sourceFile, sectionTitle, cropIndex }) {
  const card = {
    id: node.id,
    tier: node.tier,
    skills: null,
    primarySkill: null,
    structure: null,
    question_text: null,
    answer: null,
    origin: {
      file: sourceFile,
      section: sectionTitle,
      tier: node.tier,
      q: node.number,
      lines: node.lines,
    },
    _source: {
      stemRaw: node.stemRaw,
      answerRaw: node.answerRaw,
      answerParts: node.answerParts,
      figures: figuresFor(node.images, cropIndex),
    },
  };
  if (node.source) card.source = node.source;

  const figure = figureFor(node.images, cropIndex);
  if (figure && !node.parts.length) card.figure = figure;

  if (node.parts.length) {
    card.parts = node.parts.map((part, i) => {
      const partFigure = figureFor(part.images, cropIndex);
      const out = {
        label: part.label || 'abcdefghijkl'[i],
        question_text: null,
        answer: null,
        _source: { stemRaw: part.stemRaw, answerRaw: part.answerRaw, figures: figuresFor(part.images, cropIndex) },
      };
      if (partFigure) out.figure = partFigure;
      return out;
    });
    delete card.answer;
  } else if (node.answerParts && node.answerParts.length) {
    // `a) 110°  b) 169 km` under a stem: the parts exist, their wording is in the stem.
    card.parts = node.answerParts.map((p) => ({
      label: p.label,
      question_text: null,
      answer: null,
      _source: { stemRaw: null, answerRaw: p.answerRaw },
    }));
    delete card.answer;
  }
  return card;
}

function skeletonBlock(node, { sourceFile, sectionTitle, cropIndex }) {
  const base = {
    id: node.id,
    type: node.type,
    title: node.title || null,
    origin: { file: sourceFile, section: sectionTitle, lines: node.lines },
    _source: { prose: node.prose, figures: figuresFor(node.images, cropIndex) },
  };
  if (node.type === 'proof') base.tier = 'mastery';

  const cellSkeleton = (cell, i) => {
    const figure = figureFor(cell.images, cropIndex);
    const out = {
      label: cell.label || 'abcdefghijkl'[i],
      question_text: null,
      answer: null,
      _source: { stemRaw: cell.stemRaw, answerRaw: cell.answerRaw, figures: figuresFor(cell.images, cropIndex) },
    };
    if (figure) out.figure = figure;
    return out;
  };

  switch (node.type) {
    case 'review':
      base.groups = node.groups.map((group) => ({
        prompt: null,
        cells: group.cells.map(cellSkeleton),
        _source: { prompt: group.prompt },
      }));
      break;
    case 'identify':
    case 'write':
    case 'guided':
      base.prompt = null;
      base.cells = node.cells.map(cellSkeleton);
      if (node.type === 'identify') base.exemplars = [];
      break;
    case 'keyIdeas':
      base.items = [];
      break;
    case 'example':
      base.question_text = null;
      base.solution_text = null;
      if (figureFor(node.images, cropIndex)) base.figure = figureFor(node.images, cropIndex);
      break;
    case 'syllabus':
      base.outcome = node.outcome || null;
      base.points = node.points || [];
      delete base._source;
      break;
    case 'proof':
      base.steps = [];
      if (figureFor(node.images, cropIndex)) base.figure = figureFor(node.images, cropIndex);
      break;
    default: {
      base.type = 'teach';
      base.body = null;
      const figure = figureFor(node.images, cropIndex);
      if (figure) base.figure = figure;
      break;
    }
  }
  return base;
}

// --- cover -------------------------------------------------------------------

export function parseCover(lines) {
  const end = lines.findIndex((l) => /^# /.test(l));
  const head = lines.slice(0, end === -1 ? 40 : end);
  const spans = findTableSpans(head);
  const cover = { course: null, title: null, book: null, description: null, version: null, feedbackUrl: null, contents: [] };

  if (spans.length) {
    const banner = parseGridTable(head.slice(spans[0][0], spans[0][1]));
    const cells = banner.rows.flat().map((c) => normaliseInline(c.text));
    if (cells.length) cover.course = cells[0].replace(/\*\*/g, '').trim() || null;
    if (cells.length > 1) cover.title = cells.slice(1).join(' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim() || null;
  }
  if (spans.length > 1) {
    const info = parseGridTable(head.slice(spans[1][0], spans[1][1]));
    const row = info.rows[0] || [];
    if (row[0]) {
      const book = normaliseInline(row[0].text).match(/Book\s+(\d+)/i);
      if (book) cover.book = Number(book[1]);
    }
    if (row[1]) cover.description = normaliseInline(row[1].text).replace(/\s+/g, ' ').trim() || null;
    if (row[2]) {
      const meta = normaliseInline(row[2].text);
      const version = meta.match(/Version:\s*(\S+)/i);
      if (version) cover.version = version[1];
      const url = meta.match(/https?:\/\/\S+/);
      if (url) cover.feedbackUrl = url[0];
    }
    // The contents cell lists the printed sections and their page numbers.
    for (const cell of info.rows.flat()) {
      for (const m of normaliseInline(cell.text).matchAll(/\[([^\][]+?)\s*\[(\d+)\]\([^)]*\)\]\([^)]*\)/g)) {
        cover.contents.push({ title: m[1].replace(/\s+/g, ' ').trim(), page: Number(m[2]) });
      }
    }
  }
  return cover;
}

// --- CLI ---------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  rejectStrayPositionals(argv, { valueFlags: ['--md', '--docx', '--bank', '--out'], boolFlags: [] });
  const mdArg = arg(argv, '--md');
  const outArg = arg(argv, '--out');
  const bank = arg(argv, '--bank');
  if (!mdArg || !outArg || !bank) {
    console.error('usage: node scripts/booklet/parse-booklet.mjs --md <booklet.md> --bank <slug> --out <dir> [--docx <booklet.docx>]');
    process.exit(2);
  }
  const mdPath = resolve(ROOT, mdArg);
  const outDir = resolve(ROOT, outArg);
  const docxPath = arg(argv, '--docx') ? resolve(ROOT, arg(argv, '--docx')) : null;
  const sourceFile = mdArg.split('\\').join('/');

  const raw = readFileSync(mdPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const { sections, problems } = sectionise(lines);
  const cropIndex = buildCropIndex(sections, docxPath);
  mkdirSync(outDir, { recursive: true });

  const index = { bank, sourceFile, sourceDocx: docxPath ? arg(argv, '--docx').split('\\').join('/') : null, sections: [], problems: [...problems, ...cropIndex.problems] };
  let totalCards = 0;
  let totalBlocks = 0;
  let totalParts = 0;
  let totalFigures = 0;
  let croppedFigures = 0;

  for (const section of sections) {
    const cards = [];
    const blocks = [];
    const unclassified = [];
    for (const node of section.nodes) {
      if (node.kind === 'question') {
        const card = skeletonCard(node, { sourceFile, sectionTitle: section.title, cropIndex });
        cards.push(card);
        totalParts += card.parts ? card.parts.length : 0;
      } else if (node.kind === 'box') {
        blocks.push(skeletonBlock(node, { sourceFile, sectionTitle: section.title, cropIndex }));
      } else if (node.kind === 'para' && (node.text || node.images.length)) {
        unclassified.push({ lines: node.lines, text: node.text, images: node.images.map((i) => i.png) });
      }
    }

    // Count the figures actually PLACED on a card, part or cell — not the `_source.figures`
    // catalogue, which repeats them plus any extras still to be placed.
    const countFigures = (value) => {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        for (const v of value) countFigures(v);
        return;
      }
      if (value.figure && value.figure.png) {
        totalFigures++;
        if (value.figure.crop) croppedFigures++;
      }
      for (const [key, v] of Object.entries(value)) {
        if (key !== '_source' && key !== 'figure') countFigures(v);
      }
    };
    countFigures(cards);
    countFigures(blocks);

    const skeleton = {
      bank,
      section: section.slug,
      title: section.title,
      sourceLines: section.lines,
      cards,
      blocks,
      unclassified,
    };
    writeFileSync(join(outDir, `${section.slug}.json`), `${JSON.stringify(skeleton, null, 2)}\n`, 'utf8');

    // The numbered source slice: what the transcription agent reads against the skeleton.
    const [from, to] = section.lines;
    const numbered = lines.slice(from - 1, to)
      .map((line, i) => `${String(from + i).padStart(5)} | ${line}`)
      .join('\n');
    writeFileSync(join(outDir, `${section.slug}.md`), `${numbered}\n`, 'utf8');

    totalCards += cards.length;
    totalBlocks += blocks.length;
    index.sections.push({
      slug: section.slug,
      title: section.title,
      lines: section.lines,
      cards: cards.length,
      blocks: blocks.length,
      unclassified: unclassified.length,
    });
  }

  writeFileSync(join(outDir, 'cover.json'), `${JSON.stringify(parseCover(lines), null, 2)}\n`, 'utf8');
  writeFileSync(join(outDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');

  const outRel = outArg.split('\\').join('/');
  console.log(`Parsed ${basename(mdPath)} → ${outRel}`);
  console.log(`  ${sections.length} section(s), ${totalCards} card(s), ${totalParts} part(s), ${totalBlocks} block(s)`);
  console.log(`  ${totalFigures} figure(s), ${croppedFigures} with a crop recovered from the docx${docxPath ? '' : ' (no --docx given)'}`);
  if (cropIndex.refs) console.log(`  docx: ${cropIndex.drawings} drawing(s) aligned to ${cropIndex.refs} markdown reference(s)`);
  if (index.problems.length) {
    console.log(`\n  ⚠ ${index.problems.length} thing(s) the parser could not settle — see problems in index.json:`);
    for (const p of index.problems.slice(0, 10)) console.log(`    ⚠ ${p}`);
    if (index.problems.length > 10) console.log(`    … and ${index.problems.length - 10} more`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
