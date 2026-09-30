import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {repairDataAnalysisFeedback} from '../scripts/booklet/repair-data-analysis-feedback.mjs';
import {arrangementCatalog, resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {logicalUnits} from '../src/lib/booklet-flow.js';
import {validateEditableProject} from '../src/lib/editable-booklet-model.js';

const original = JSON.parse(fs.readFileSync(new URL('./fixtures/booklets/data-analysis-feedback-targets.json', import.meta.url), 'utf8'));
const {next, provenance} = repairDataAnalysisFeedback(original);
const block = (project, id) => project.sections.flatMap(s => s.blocks).find(b => b.id === id);
function contentNodes(value, found = []) {
  if (!value || typeof value !== 'object') return found;
  if (value.id) found.push(value);
  for (const [key, child] of Object.entries(value)) if (!['sourceReview', 'sourceAtom', 'spec'].includes(key)) contentNodes(child, found);
  return found;
}
const node = (project, id) => contentNodes(project.sections).find(n => n.id === id);

test('bounded candidate leaves the input, source acceptance, identities and unrelated settings intact', () => {
  const before = structuredClone(original);
  repairDataAnalysisFeedback(original);
  assert.deepEqual(original, before);
  assert.deepEqual(next.source, original.source);
  assert.deepEqual(next.settings.compactAnswers, original.settings.compactAnswers);
  for (const section of original.sections) for (const old of section.blocks) {
    const repaired = block(next, old.id);
    assert.ok(repaired, old.id);
    for (const field of ['sourceReview', 'sourceAtom', 'sourceRefs', 'sourcePageNumber', 'snapshotKind', 'bankRef']) assert.deepEqual(repaired[field], old[field], `${old.id} ${field}`);
  }
  assert.equal(provenance.baseRevision, original.revision);
  assert.ok(provenance.originalFields.some(f => f.nodeId === 'p26-q10-portrait' && f.field === 'src' && f.value.endsWith('73c03bda5cc6-image29.png')));
  assert.ok(!JSON.stringify(provenance).includes('historical-acceptance'), 'compact field provenance excludes bulky historical review');
  assert.ok(provenance.descriptions['p24-q1-block']);
  assert.ok(!next.sections.flatMap(s => s.blocks).some(b => b.feedbackRepair));
  assert.deepEqual(validateEditableProject(next).errors, []);
});

test('scaffold retains data, answer mathematics, handwriting space and all annotation targets', () => {
  const old = block(original, 'p24-q1-block').content, repaired = block(next, 'p24-q1-block').content;
  assert.equal(repaired.columns, 2);
  assert.deepEqual(repaired.children.map(c => c.id), old.children.map(c => c.id));
  for (let i = 0; i < 4; i++) {
    assert.deepEqual(repaired.children[i].answer, old.children[i].answer);
    assert.equal(repaired.children[i].answerSpaceMm, old.children[i].answerSpaceMm);
    if (i < 3) assert.deepEqual(repaired.children[i].prompt.blocks[0].inlines, old.children[i].prompt.blocks[0].inlines);
    else assert.equal(repaired.children[i].prompt, old.children[i].prompt);
  }
  for (const id of ['p24-q1-a-mode-hint', 'p24-q1-a-add-scores-hint', 'p24-q1-a-count-hint', 'p24-q1-a-mean-rounding-hint']) assert.equal(node(next, id).fontSize, 9, id);
  for (const id of ['p24-q1-a-mode', 'p24-q1-b-median-fraction', 'p24-q1-c-mean', 'p24-q1-a-mean-table']) assert.equal(node(next, id).fontSize, 10, id);
  const annotated = node(next, 'p24-q1-a-mean-table');
  for (const annotation of annotated.annotations) {
    const anchor = annotated.anchors.find(a => a.id === annotation.targetId);
    assert.ok(anchor);
    assert.equal(annotated.latex.slice(anchor.start, anchor.end), anchor.text, annotation.id + ' exact range');
  }
  assert.deepEqual(annotated.annotations.map(a => [a.id, a.targetId, a.decoration, a.placement]), node(original, annotated.id).annotations.map(a => [a.id, a.targetId, a.decoration, a.placement]));
  assert.match(repaired.prompt, /1 d\.p\./);
});

test('response boxes preserve outer handwriting dimensions across the 11-to-10 pt change', () => {
  const boxes = latex => [...latex.matchAll(/\\boxed\{\\rule\{0pt\}\{([\d.]+)mm\}\\hspace\{([\d.]+)mm\}\}/g)].map(m => ({height: Number(m[1]), width: Number(m[2])}));
  const latexById = project => new Map(contentNodes(block(project, 'p24-q1-block').content).filter(n => n.type === 'paragraph' || n.type === 'annotated-equation').map(n => [n.id, n.latex ?? n.inlines?.filter(i => i.type === 'math').map(i => i.latex).join(' ')]));
  const a = latexById(original), b = latexById(next), mmToEm = 72.27 / 25.4 / 10;
  let count = 0;
  for (const [id, latex] of a) {
    const before = boxes(latex ?? ''), after = boxes(b.get(id) ?? '');
    assert.equal(after.length, before.length, id);
    before.forEach((box, i) => {
      for (const [dimension, padding] of [['width', 0.6], ['height', 0.68]]) assert.ok(Math.abs((box[dimension] * mmToEm + padding) * 11 - (after[i][dimension] * mmToEm + padding) * 10) < 0.00001, `${id} ${dimension}`);
      count++;
    });
  }
  assert.equal(count, 26, 'every physical response blank is covered');
});

test('Laura remains an editable fixed-width portrait with the original speech statement', () => {
  const image = node(next, 'p26-q10-portrait');
  assert.equal(image.src, '/booklet-assets/projects/index-laws-complete-v1/a2fc6010263c-image3.png');
  assert.equal(image.width, 17);
  assert.deepEqual(image.crop, [0, 13.894000000000016, 0, 13.104]);
  assert.equal(image.aspectRatio, 0.9969230769230769);
  assert.equal(node(next, 'p26-q10-speech-layout').gap, 5);
  assert.deepEqual(node(next, 'p26-q10-speech-text'), node(original, 'p26-q10-speech-text'));
  assert.equal(node(next, 'p26-q10-a').prompt, 'Explain why she is correct.');
  assert.equal(node(next, 'p26-q10-intro').inlines[0].text, 'Laura says:');
});

test('median formula is one complete mathematical label with a separate explanatory arrow', () => {
  const formula = block(next, 'p31-position-formula');
  assert.equal(formula.widthMm, 65);
  assert.match(formula.code, /\\mathrm\{Position\}=\\frac\{n\+1\}\{2\}/);
  assert.equal((formula.code.match(/\\node/g) ?? []).length, 2, 'whole formula and annotation only');
  assert.ok(!formula.code.includes('(-2,-3.4)--(10.6,-3.4)'), 'no manually drawn fraction rule');
  assert.match(formula.code, /Number of data values/);
  assert.match(formula.code, /fontsize\{10\}\{12\}/);
  const section = next.sections.find(s => s.blocks.some(b => b.id === formula.id));
  assert.equal(section.blocks[section.blocks.indexOf(formula) - 1].id, 'p31-information-header');
});

test('median examples preserve their datasets, divider, results and complete taught method', () => {
  for (const side of ['left', 'right']) {
    const a = node(original, `p31-example-${side}-dataset`), b = node(next, `p31-example-${side}-dataset`);
    assert.deepEqual(b.rows, a.rows);
    assert.equal(b.marginBefore, 2);
    assert.equal(b.marginAfter, 2);
    assert.deepEqual(node(next, `p31-example-${side}-position-working`).inlines, node(original, `p31-example-${side}-position-working`).inlines);
    assert.deepEqual(node(next, `p31-example-${side}-result`).inlines, node(original, `p31-example-${side}-result`).inlines);
    assert.equal(node(next, `p31-example-${side}-demonstration`).padding, 3);
    assert.equal(node(next, `p31-example-${side}-demonstration`).margin, 3);
  }
  assert.deepEqual(node(next, 'p31-example-left-divider-cell').borders, node(original, 'p31-example-left-divider-cell').borders);
  const leftWrapper = node(next, 'p31-example-left-divider-table'), rightWrapper = node(next, 'p31-example-right-wrapper-table');
  const properties = table => Object.fromEntries(Object.entries(table).filter(([key]) => !['id', 'rows'].includes(key)));
  assert.deepEqual(properties(rightWrapper), properties(leftWrapper));
  const leftCell = leftWrapper.rows[0][0], rightCell = rightWrapper.rows[0][0];
  const cellProperties = cell => Object.fromEntries(Object.entries(cell).filter(([key]) => !['id', 'blocks', 'borders'].includes(key)));
  assert.deepEqual(cellProperties(rightCell), cellProperties(leftCell));
  assert.deepEqual(rightCell.blocks.map(n => n.id), ['p31-example-right-dataset', 'p31-example-right-demonstration']);
  assert.deepEqual(rightCell.borders, {top: false, right: false, bottom: false, left: false});
  assert.deepEqual(validateEditableProject(next).errors, []);
  assert.equal(node(next, 'p31-example-right-central-scores').inlines.filter(n => n.type === 'break').length, 0);
  for (const b of next.sections.flatMap(s => s.blocks)) {
    const layout = next.settings.layoutOverrides.blockLayouts[b.id]?.arrangement;
    if (!layout) continue;
    assert.deepEqual(resolveArrangement(b, layout).missing, [], b.id);
    assert.ok(arrangementCatalog(b).entries.size > 0);
  }
});

test('scaffold compacts paragraph gaps while preserving arrangement spacing', () => {
  const root = next.settings.layoutOverrides.blockLayouts['p24-q1-block'].arrangement.root;
  assert.equal(root.after, undefined);
  const expected = structuredClone(original.settings.layoutOverrides.blockLayouts['p24-q1-block'].arrangement.root);
  assert.deepEqual(root, expected);
  assert.ok(!provenance.originalFields.some(field => field.nodeId === root.id && field.field === 'after'));
  assert.equal(node(next, 'p24-q1-c-mode').spaceAfter, 0.3);
  assert.equal(node(next, 'p24-q1-a-add-scores-hint').spaceAfter, 0);
});

test('page break follows the full logical Identify unit without changing its six panels', () => {
  assert.deepEqual(block(next, 'p41-identify').content, block(original, 'p41-identify').content);
  const unit = logicalUnits(next).find(u => u.blocks.some(b => b.id === 'p41-identify'));
  const all = next.sections.flatMap(s => s.blocks), end = all.findIndex(b => b.id === unit.blocks.at(-1).id);
  assert.equal(all[end + 1].type, 'page-break');
  assert.equal(provenance.pageBoundaries.length, 1);
  assert.throws(() => repairDataAnalysisFeedback(next), /Stale expected shape/);
});

test('stale targets fail without mutating the input', () => {
  for (const mutate of [p => { node(p, 'p24-q1-b-mode').spaceAfter = 12; }, p => { node(p, 'p26-q10-portrait').src = '/manual-edit.png'; }, p => { block(p, 'p31-position-formula').code += '\n% manual edit'; }]) {
    const p = structuredClone(original); mutate(p); const before = structuredClone(p);
    assert.throws(() => repairDataAnalysisFeedback(p), /Stale expected shape/);
    assert.deepEqual(p, before);
  }
});
