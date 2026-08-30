import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { findTableSpans, parseGridTable, tableCells, cellProse, isBorderLine } from '../scripts/booklet/lib/grid-table.mjs';
import {
  normaliseInline, convertDisplayMath, normaliseDegrees, fixEscapedDollarGlitch,
  fixUnitSuperscripts, stripAltText,
} from '../scripts/booklet/lib/normalise-md.mjs';
import { extractImageRefs, stripImageRefs } from '../scripts/booklet/lib/image-refs.mjs';
import { sectionise, slugify, boxTypeFor, looksLikeAnswer } from '../scripts/booklet/lib/section-model.mjs';
import { readZip, parseRels, extractDrawings, alignRefsToDrawings } from '../scripts/booklet/lib/docx.mjs';
import { collectRefs, buildCropIndex, parseCover } from '../scripts/booklet/parse-booklet.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PILOT_MD = join(rootDir, 'booklets', 'Stage 5', 'Trigonometry C 2_Non-Right-Angled Trigonometry.md');
const PILOT_DOCX = join(rootDir, 'booklets', 'Trigonometry C 2_Non-Right-Angled Trigonometry.docx');

// --- grid tables -------------------------------------------------------------

// Grid tables are column-exact: a cell wall must sit at the same character position on
// every line of a row. Hand-aligning ASCII in a fixture is easy to get wrong, so build the
// lines from the column stops instead — the same thing pandoc does.
function border(stops, ch = '-') {
  const out = new Array(stops[stops.length - 1] + 1).fill(ch);
  for (const s of stops) out[s] = '+';
  return out.join('');
}
function row(stops, texts) {
  const out = new Array(stops[stops.length - 1] + 1).fill(' ');
  for (const s of stops) out[s] = '|';
  texts.forEach((text, i) => {
    for (let j = 0; j < text.length; j++) {
      const at = stops[i] + 2 + j;
      if (at >= stops[i + 1]) throw new Error(`fixture cell ${i} overflows its column: "${text}"`);
      out[at] = text[j];
    }
  });
  return out.join('');
}

// A two-column drill grid whose header separator sits between the rows, as pandoc emits.
const DRILL = [
  '+----------------+----------------+',
  '| a.  first      | b.  second     |',
  '|                |                |',
  '| 1.88           | 3.63           |',
  '+================+================+',
].join('\n').split('\n');

test('parseGridTable splits a two-column drill row into its cells', () => {
  const t = parseGridTable(DRILL);
  assert.equal(t.problems.length, 0);
  assert.equal(t.rows.length, 1);
  assert.deepEqual(t.rows[0].map((c) => c.text), ['a.  first\n\n1.88', 'b.  second\n\n3.63']);
});

test('a row that spans columns keeps one cell while later rows split', () => {
  const lines = [
    border([0, 35]),
    row([0, 35], ['- **Identify** the opposite pair']),
    border([0, 16, 35], '='),
    row([0, 16, 35], ['a.', 'b.']),
    border([0, 16, 35]),
  ];
  const t = parseGridTable(lines);
  assert.equal(t.problems.length, 0, t.problems.join(' / '));
  assert.equal(t.rows.length, 2);
  assert.equal(t.rows[0].length, 1, 'the title row spans the full width');
  assert.equal(t.rows[1].length, 2, 'the row below it splits in two');
  assert.equal(t.headerRows, 1);
});

test('alignment markers (+:===:+) do not shift the column boundaries', () => {
  const lines = [
    '+--------+--------+',
    '| ✖      | ✔      |',
    '+:======:+:======:+',
    '| a.     | b.     |',
    '+--------+--------+',
  ];
  const t = parseGridTable(lines);
  assert.equal(t.problems.length, 0);
  assert.deepEqual(t.rows.map((r) => r.length), [1, 2].slice(0, t.rows.length).map(() => 2));
});

test('a nested table inside a cell is parsed, and cellProse returns the prose around it', () => {
  const lines = [
    '+------------------------------+',
    '| - **Review**                 |',
    '+==============================+',
    '| - Solve proportion equations |',
    '|                              |',
    '| +-----------+-----------+    |',
    '| | a.  x/7   | b.  8/x   |    |',
    '| +===========+===========+    |',
    '+------------------------------+',
  ];
  const t = parseGridTable(lines);
  assert.equal(t.problems.length, 0, t.problems.join(' / '));
  const bodyCell = t.rows[1][0];
  assert.equal(bodyCell.tables.length, 1, 'the drill grid inside the review box is found');
  assert.equal(bodyCell.tables[0].table.rows[0].length, 2);
  assert.equal(cellProse(bodyCell), '- Solve proportion equations');
  // The box title cell plus the two drill cells: tableCells descends into the nested grid.
  assert.equal(tableCells(t).length, 3);
});

test('isBorderLine accepts -, = and : borders and rejects content', () => {
  assert.ok(isBorderLine('+-----+-----+'));
  assert.ok(isBorderLine('+=====+=====+'));
  assert.ok(isBorderLine('+:===:+:===:+'));
  assert.ok(!isBorderLine('| a.  | b.  |'));
});

// --- normalisation -----------------------------------------------------------

test('a multi-brace display block becomes one $…$ line per working step', () => {
  const input = '$${\\frac{x}{\\sin 80} = \\frac{7}{\\sin 75}\n}{x = 7.1\n}{\\approx 7.1\\ m}$$';
  assert.equal(
    convertDisplayMath(input),
    '$\\frac{x}{\\sin 80} = \\frac{7}{\\sin 75}$\n$x = 7.1$\n$\\approx 7.1\\ m$',
  );
});

test('a single display block becomes one inline span', () => {
  assert.equal(convertDisplayMath('$$\\frac{a}{\\sin A}$$'), '$\\frac{a}{\\sin A}$');
});

test('Word degree markup normalises to the house ^{\\circ}', () => {
  assert.equal(normaliseDegrees('\\sin{80{^\\circ}}'), '\\sin{80^{\\circ}}');
});

test("pandoc's $ABC\\$to glitch is repaired into a closed span plus a word", () => {
  assert.equal(fixEscapedDollarGlitch('triangle $ABC\\$to find'), 'triangle $ABC$ to find');
});

test('unit superscripts become inline maths', () => {
  assert.equal(fixUnitSuperscripts('area is 5 cm^2^'), 'area is 5 cm$^2$');
});

test('Word AI alt text is dropped but the image reference survives', () => {
  const input = '![A triangle with numbers AI-generated content may be incorrect.](media/x/image1.png){width="1in"}';
  assert.equal(stripAltText(input), '![](media/x/image1.png){width="1in"}');
});

test('normaliseInline strips blockquote markers and hard-break backslashes', () => {
  assert.equal(normaliseInline('> $$a = b$$'), '$a = b$');
  assert.equal(normaliseInline('Solve proportion equations\\\n  Round to 1 d.p.'), 'Solve proportion equations\n  Round to 1 d.p.');
});

// --- image refs --------------------------------------------------------------

test('extractImageRefs reads the filename and converts the printed width to centimetres', () => {
  const refs = extractImageRefs('![](media/b/media/image28.png){width="1.5833333333333333in" height="1.07in"}');
  assert.equal(refs.length, 1);
  assert.equal(refs[0].png, 'image28.png');
  assert.equal(refs[0].widthCm, 4.02);
  assert.equal(stripImageRefs('a. ![](media/x/image1.png){width="1in"}'), 'a.');
});

test('an image reference wrapped across lines inside a cell is still read', () => {
  const refs = extractImageRefs('![](media/Trigonometry C 2_Non-Right-Angled\nTrigonometry/media/image5.png){width="2.48in"}');
  assert.equal(refs.length, 1);
  assert.equal(refs[0].png, 'image5.png');
});

// --- section model -----------------------------------------------------------

test('slugify and boxTypeFor map booklet headings and box labels', () => {
  assert.equal(slugify('Area of a Triangle using Trigonometry'), 'area-of-a-triangle-using-trigonometry');
  assert.equal(boxTypeFor('Guided Practice'), 'guided');
  assert.equal(boxTypeFor('Key Ideas'), 'keyIdeas');
  assert.equal(boxTypeFor('Sine Rule (Finding a Side)'), 'teach', 'an unlisted label is a teaching box');
});

test('looksLikeAnswer accepts printed values and rejects prose', () => {
  assert.ok(looksLikeAnswer('7.9 m'));
  assert.ok(looksLikeAnswer('$16.5$'));
  assert.ok(looksLikeAnswer('a) 110°   b) 169 km'));
  assert.ok(!looksLikeAnswer('The larger angle is opposite the longer side'));
  assert.ok(!looksLikeAnswer(''));
});

test('sectionise reads tiers, numbered questions, lettered parts and printed answers', () => {
  const md = [
    '# Sine Rule for Sides',
    '',
    'Foundation',
    '',
    '1.  Solve each equation, correct to 2 decimal places.',
    '',
    border([0, 19, 39]),
    row([0, 19, 39], ['a.', 'b.']),
    row([0, 19, 39], ['', '']),
    row([0, 19, 39], ['$$\\frac{a}{2}$$', '$$\\frac{b}{3}$$']),
    row([0, 19, 39], ['', '']),
    row([0, 19, 39], ['1.88', '3.63']),
    border([0, 19, 39], '='),
    '',
    'Development',
    '',
    '4.  A ship sails from $A$ to $B$.',
    '',
    '    **2022 HSC Standard 2 Band 5**',
    '',
    'a\\) 110°   b\\) 169 km',
  ];
  const { sections, problems } = sectionise(md);
  assert.equal(problems.length, 0);
  assert.equal(sections.length, 1);
  const nodes = sections[0].nodes;
  const questions = nodes.filter((n) => n.kind === 'question');
  assert.equal(questions.length, 2);

  const [q1, q4] = questions;
  assert.equal(q1.id, 'sine-rule-for-sides-f1');
  assert.equal(q1.tier, 'foundation');
  assert.equal(q1.parts.length, 2);
  assert.deepEqual(q1.parts.map((p) => p.label), ['a', 'b']);
  assert.deepEqual(q1.parts.map((p) => p.answerRaw), ['1.88', '3.63']);
  assert.equal(q1.parts[0].stemRaw, '$\\frac{a}{2}$');

  assert.equal(q4.id, 'sine-rule-for-sides-d4');
  assert.equal(q4.tier, 'development');
  assert.deepEqual(q4.source, { kind: 'hsc', course: 'Standard 2', band: 5, year: 2022 });
  // A bare `°` in a printed answer stays as written: whether it belongs inside `$…$` is a
  // transcription decision, not something the mechanical pass should force.
  assert.deepEqual(q4.answerParts.map((p) => `${p.label}:${p.answerRaw}`), ['a:110°', 'b:169 km']);
});

test('a question before any tier heading is defaulted and reported, never dropped', () => {
  const { sections, problems } = sectionise(['# Mixed', '', '1.  Find $x$.', '', '5']);
  assert.equal(sections[0].nodes.filter((n) => n.kind === 'question').length, 1);
  assert.match(problems.join(' '), /appears before any tier heading — defaulted to foundation/);
});

test('a pure-prose section folds into one syllabus block instead of loose paragraphs', () => {
  const { sections } = sectionise([
    '# Syllabus Content',
    '',
    "**MA5-TRG-P-01** applies Pythagoras' theorem and trigonometry",
    'to solve 3-dimensional problems',
    '',
    '- Apply the sine rule to find an unknown side',
  ]);
  const blocks = sections[0].nodes;
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'syllabus');
  assert.match(blocks[0].outcome, /^\*\*MA5-TRG-P-01\*\* applies Pythagoras/);
  assert.equal(blocks[0].points.length, 1);
});

// --- docx --------------------------------------------------------------------

test('alignRefsToDrawings pairs per image and uses printed width as the tie-breaker', () => {
  const drawings = [
    { png: 'a.png', occurrence: 1, crop: { l: 0, t: 0, r: 0.6, b: 0 }, widthCm: 4 },
    { png: 'a.png', occurrence: 2, crop: { l: 0.4, t: 0, r: 0.3, b: 0 }, widthCm: 4 },
    { png: 'b.png', occurrence: 1, crop: null, widthCm: 7 },
    { png: 'a.png', occurrence: 3, crop: null, widthCm: 9 },
  ];
  // The markdown omits one drawing pandoc dropped, and its refs are in document order.
  const refs = [
    { png: 'a.png', widthCm: 4, index: 10 },
    { png: 'a.png', widthCm: 9, index: 20 },
    { png: 'b.png', widthCm: 7, index: 30 },
  ];
  const { pairs, unmatched, problems } = alignRefsToDrawings(refs, drawings);
  assert.equal(unmatched.length, 0);
  assert.equal(problems.length, 0);
  assert.deepEqual(pairs.map((p) => p.drawing.occurrence), [1, 3, 1]);
  assert.ok(pairs.every((p) => p.exactWidth));
});

test('more markdown references than docx drawings is reported, not guessed', () => {
  const { unmatched, problems } = alignRefsToDrawings(
    [{ png: 'a.png', widthCm: 4, index: 0 }, { png: 'a.png', widthCm: 4, index: 1 }],
    [{ png: 'a.png', occurrence: 1, crop: null, widthCm: 4 }],
  );
  assert.equal(unmatched.length, 1);
  assert.match(problems[0], /references this image more often than the docx draws it/);
});

test('parseRels maps relationship ids to their media targets', () => {
  const rels = parseRels('<Relationships><Relationship Id="rId7" Type="../image" Target="media/image7.png"/></Relationships>');
  assert.equal(rels.get('rId7'), 'media/image7.png');
});

test('extractDrawings reads srcRect as a fraction and treats an all-zero crop as no crop', () => {
  const xml = [
    '<w:drawing><wp:extent cx="1440000" cy="720000"/>',
    '<a:blip r:embed="rId1"/><a:srcRect l="39117" t="3120" r="39517" b="57360"/></w:drawing>',
    '<w:drawing><wp:extent cx="720000" cy="720000"/>',
    '<a:blip r:embed="rId1"/><a:srcRect l="0" t="0" r="0" b="0"/></w:drawing>',
  ].join('');
  const drawings = extractDrawings(xml, new Map([['rId1', 'media/image6.png']]));
  assert.equal(drawings.length, 2);
  assert.equal(drawings[0].png, 'image6.png');
  assert.equal(drawings[0].widthCm, 4);
  assert.equal(drawings[0].crop.l, 0.39117);
  assert.equal(drawings[1].crop, null, 'an all-zero srcRect means Word applied no crop');
  assert.equal(drawings[1].widthCm, 2, 'each drawing takes its own nearest preceding extent');
});

// --- end-to-end against the pilot booklet ------------------------------------

const pilot = existsSync(PILOT_MD) ? readFileSync(PILOT_MD, 'utf8').split(/\r?\n/) : null;

test('the pilot booklet parses into its ten sections with nothing unclassified', { skip: !pilot }, () => {
  const { sections, problems } = sectionise(pilot);
  assert.equal(sections.length, 10);
  assert.equal(problems.length, 0, problems.join('\n'));
  const counts = sections.map((s) => ({
    slug: s.slug,
    q: s.nodes.filter((n) => n.kind === 'question').length,
    b: s.nodes.filter((n) => n.kind === 'box').length,
  }));
  assert.equal(counts.reduce((n, c) => n + c.q, 0), 91, 'every numbered question is found');
  assert.equal(counts.reduce((n, c) => n + c.b, 0), 47, 'every box is found');
  assert.equal(counts[0].slug, 'syllabus-content');
});

test('the cover yields the booklet meta and its contents page numbers', { skip: !pilot }, () => {
  const cover = parseCover(pilot);
  assert.equal(cover.course, 'Mathematics Stage 5 Path');
  assert.equal(cover.title, 'Non-Right-Angled Trigonometry');
  assert.equal(cover.book, 2);
  assert.equal(cover.version, '260203');
  assert.equal(cover.feedbackUrl, 'https://MrDingMaths.com');
  assert.equal(cover.contents.length, 10);
  assert.deepEqual(cover.contents[0], { title: 'Syllabus Content', page: 2 });
});

test('every figure in the pilot is matched to its docx drawing and composite crops differ', { skip: !pilot || !existsSync(PILOT_DOCX) }, () => {
  const { sections } = sectionise(pilot);
  const index = buildCropIndex(sections, PILOT_DOCX);
  assert.equal(index.problems.length, 0, index.problems.slice(0, 3).join('\n'));
  assert.equal(index.refs, collectRefs(sections).length);
  assert.equal(index.widthConflicts, 0, 'no pairing disagrees on the printed width');
  assert.ok(index.cropped > 100, `expected the composite crops to be recovered, got ${index.cropped}`);

  // The three cells of "Sine Rule for Sides" Q2 all show image28.png, each a different slice.
  const section = sections.find((s) => s.slug === 'sine-rule-for-sides');
  const q2 = section.nodes.find((n) => n.kind === 'question' && n.number === 2);
  const crops = q2.parts.map((p) => JSON.stringify(index.byRef.get(p.images[0]).crop));
  assert.equal(new Set(crops).size, crops.length, 'each part of a composite figure gets its own crop');
});

test('the docx opens with the dependency-free zip reader', { skip: !existsSync(PILOT_DOCX) }, () => {
  const zip = readZip(readFileSync(PILOT_DOCX));
  assert.ok(zip.has('word/document.xml'));
  assert.ok(zip.has('word/_rels/document.xml.rels'));
  assert.ok(zip.get('word/document.xml').toString('utf8').startsWith('<?xml'));
});
