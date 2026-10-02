import test from 'node:test';
import assert from 'node:assert/strict';
import {
  repairTableEmptyFeedback,
  repairTableEmptyFeedbackCollection,
  shouldEmitGeneratedEmptyCategory
} from '../scripts/booklet/repair-table-empty-feedback.mjs';

const paragraph = (id, text = '') => ({ id, type: 'paragraph', inlines: text === '' ? [] : [{ type: 'text', text }] });
const rich = id => ({ id, type: 'rich-text', content: {
  format: 'maths-editor-document-v1', version: 1, blocks: [paragraph(`${id}-paragraph`)]
} });
const table = id => ({ id, type: 'table', borderColour: '#000000', rows: [[{
  borderColour: 'black', borders: { top: { colour: '#000', width: 1 },
    bottom: false, left: 0, right: { colour: '#000000', width: 0 } },
  blocks: [paragraph(`${id}-empty-cell`)]
}]] });
const project = blocks => ({ id: 'data-analysis-v1', revision: 353, sections: [{ blocks }] });

 test('normalises table and cell overrides while preserving disabled edges and structural cells', () => {
  const input = project([table('ordinary')]);
  const snapshot = structuredClone(input);
  const result = repairTableEmptyFeedback(input);
  const repaired = result.next.sections[0].blocks[0];
  assert.equal(repaired.borderColour, '#cccccc');
  assert.equal(repaired.rows[0][0].borderColour, '#cccccc');
  assert.equal(repaired.rows[0][0].borders.top.colour, '#cccccc');
  assert.equal(repaired.rows[0][0].borders.bottom, false);
  assert.equal(repaired.rows[0][0].borders.left, 0);
  assert.deepEqual(repaired.rows[0][0].borders.right, { colour: '#000000', width: 0 });
  assert.deepEqual(repaired.rows[0][0].blocks, snapshot.sections[0].blocks[0].rows[0][0].blocks);
  assert.equal(result.report.changedTableCount, 1);
  assert.equal(result.report.borderChangeCount, 3);
  assert.deepEqual(input, snapshot);
});

 test('preserves borderless layouts, meaningful borders and unrelated ink', () => {
  const borderless = { ...table('borderless'), border: false };
  const zero = { ...table('zero'), border: 0 };
  const mathematical = { ...table('mathematical'), semanticBorder: true };
  const sourceConfirmed = table('source-confirmed');
  const input = project([borderless, zero, mathematical, sourceConfirmed,
    { id: 'diagram', type: 'diagram', stroke: '#000000', code: '\\draw[black] (0,0)--(1,1);' },
    { id: 'card', type: 'card', borderColour: '#000000' },
    { id: 'annotation', type: 'annotation', stroke: '#000000' },
    { id: 'teaching-divider', type: 'divider', borderColour: '#000000' }]);
  const result = repairTableEmptyFeedback(input, {
    preserveBorder: (_owner, context) => context.tableId === 'source-confirmed'
  });
  assert.deepEqual(result.next, input);
  assert.equal(result.report.borderChangeCount, 0);
});

 test('repairs enabled frequency-table rules without adding layout borders or changing semantic text', () => {
  const frequency = {
    id: 'p81-tests-frequency-table', type: 'table', widthMm: 74,
    widths: [1, 1], rowHeights: [10, 5.5], padding: 0,
    border: false, borderColour: '#000000', borderWidthMm: 0.26,
    rows: [[
      { id: 'category-header', borders: { right: true, bottom: true },
        blocks: [{ type: 'paragraph', inlines: [{ type: 'text', text: 'Score Category', colour: '#268cff' }] }] },
      { id: 'frequency-header', borders: { right: false, bottom: true },
        blocks: [{ type: 'paragraph', inlines: [{ type: 'text', text: 'Number of Tests', colour: '#268cff' }] }] }
    ], [
      { id: 'category', border: false, borders: { right: true, bottom: false },
        blocks: [{ type: 'paragraph', inlines: [{ type: 'text', text: '90s', colour: '#ef6068' }] }] },
      { id: 'frequency', borderColour: '#000000', borders: { right: false, bottom: false },
        blocks: [{ type: 'paragraph', inlines: [{ type: 'math', latex: '0', colour: '#ef6068' }] }] }
    ]]
  };
  const input = project([frequency]);
  const snapshot = structuredClone(input);
  const result = repairTableEmptyFeedback(input);
  const repaired = result.next.sections[0].blocks[0];
  const expected = structuredClone(frequency);
  expected.rows[0][0].borderColour = '#cccccc';
  expected.rows[0][1].borderColour = '#cccccc';
  expected.rows[1][0].borderColour = '#cccccc';
  assert.deepEqual(repaired, expected);
  assert.deepEqual(input, snapshot);
  assert.equal(result.report.changedTableCount, 1);
  assert.equal(result.report.borderChangeCount, 3);
  assert.deepEqual(result.provenance.changes.map(change => change.path), [
    '/sections/0/blocks/0/rows/0/0/borderColour',
    '/sections/0/blocks/0/rows/0/1/borderColour',
    '/sections/0/blocks/0/rows/1/0/borderColour'
  ]);
  const second = repairTableEmptyFeedback(result.next);
  assert.deepEqual(second.next, result.next);
  assert.equal(second.report.borderChangeCount, 0);
});

 test('materialises inherited enabled-rule colours and preserves meaningful or disabled rules', () => {
  for (const colour of [undefined, '', 'inherit', 'currentColor', '#000000', 'black']) {
    const cell = { borders: { right: true, bottom: false }, blocks: [paragraph('value', '90s')] };
    if (colour !== undefined) cell.borderColour = colour;
    const input = project([{ id: 'inherited-rule', type: 'table', border: false,
      borderColour: '#000000', borderWidthMm: 0.26, rows: [[cell]] }]);
    const result = repairTableEmptyFeedback(input);
    assert.equal(result.next.sections[0].blocks[0].rows[0][0].borderColour, '#cccccc');
    assert.equal(result.report.borderChangeCount, 1);
  }
  const ordinary = { id: 'ordinary-rule', borders: { right: true, bottom: false } };
  const mathematical = { id: 'meaningful-rule', semanticBorder: true,
    borderColour: '#268cff', borders: { right: true } };
  const confirmed = { id: 'confirmed-rule', borders: { bottom: true } };
  const zeroWidth = { id: 'zero-width-rule', borderWidthMm: 0,
    borderColour: '#000000', borders: { right: true } };
  const disabled = { id: 'disabled-rules', borderColour: '#000000',
    borders: { right: false, bottom: false } };
  const transparent = { id: 'transparent-rule', borderColour: 'transparent', borders: { right: true } };
  const input = project([{ id: 'mixed-rules', type: 'table', border: false,
    borderColour: '#000000', borderWidthMm: 0.26,
    rows: [[ordinary, mathematical, confirmed, zeroWidth, disabled, transparent]] }]);
  const result = repairTableEmptyFeedback(input, {
    preserveBorder: owner => owner.id === 'confirmed-rule'
  });
  const expected = structuredClone(input);
  expected.sections[0].blocks[0].rows[0][0].borderColour = '#cccccc';
  assert.deepEqual(result.next, expected);
  assert.equal(result.report.borderChangeCount, 1);
  assert.deepEqual(result.report.borderExceptions.map(entry => entry.path), [
    '/sections/0/blocks/0/rows/0/1', '/sections/0/blocks/0/rows/0/2'
  ]);
  const protectedTable = structuredClone(input);
  protectedTable.sections[0].blocks[0].meaningfulBorder = true;
  assert.deepEqual(repairTableEmptyFeedback(protectedTable).next, protectedTable);
  assert.deepEqual(repairTableEmptyFeedback(input, { repairBorders: false }).next, input);
});

 test('honours effective rule widths and explicit cell borders on borderless layouts', () => {
  const input = project([{ id: 'zero-table-width', type: 'table', border: false,
    borderColour: '#000000', borderWidthMm: 0, rows: [[
      { id: 'disabled-by-width', borders: { right: true } },
      { id: 'enabled-width-override', borderWidthMm: 0.26, borders: { right: true } },
      { id: 'enabled-cell-border', border: true, borderWidthMm: 0.26,
        borders: { bottom: false } }
    ]] }]);
  const result = repairTableEmptyFeedback(input);
  const expected = structuredClone(input);
  expected.sections[0].blocks[0].rows[0][1].borderColour = '#cccccc';
  expected.sections[0].blocks[0].rows[0][2].borderColour = '#cccccc';
  assert.deepEqual(result.next, expected);
  assert.equal(result.report.borderChangeCount, 2);
});

 test('collection audit includes borderless project and bank tables with enabled cell rules', () => {
  const frequency = { id: 'frequency-table', type: 'table', border: false,
    borderColour: '#000000', borderWidthMm: 0.26,
    rows: [[{ borders: { right: true, bottom: false }, blocks: [paragraph('data', '90s')] }]] };
  const bank = { id: 'bank-frequency', classification: { topic: 'statistics' },
    links: [{ projectId: 'data-analysis-v1', questionId: 'stable-question' }],
    prompt: { blocks: [frequency] } };
  const collection = repairTableEmptyFeedbackCollection({
    projects: [project([frequency])], bankEntries: [bank]
  });
  assert.deepEqual(collection.affectedProjects, [
    { id: 'data-analysis-v1', changedTables: 1, borderChanges: 1, removedNodes: 0 }
  ]);
  assert.deepEqual(collection.affectedBankEntries, [
    { id: 'bank-frequency', changedTables: 1, borderChanges: 1, removedNodes: 0 }
  ]);
  assert.equal(collection.bankEntries[0].next.prompt.blocks[0].rows[0][0].borderColour, '#cccccc');
  assert.deepEqual(collection.bankEntries[0].next.links, bank.links);
  assert.deepEqual(collection.bankEntries[0].next.classification, bank.classification);
});

 test('removes only confirmed empty category and reconciles arrangements and stored overrides', () => {
  const accidental = { ...rich('p56-development'), sourceMetadata: { page: 56, original: 'retained evidence' } };
  const cover = rich('p1-cover-source-evidence');
  const input = project([cover, accidental, paragraph('unconfirmed', '\u00a0'), rich('kept')]);
  input.arrangement = { rows: [{ blockIds: ['p1-cover-source-evidence', 'p56-development', 'kept'] }] };
  input.presentation = { placements: [{ blockId: 'p56-development', x: 1 }, { blockId: 'kept', x: 2 }] };
  input.storedOverrides = { arrangement: { byBlock: { 'p56-development': { width: 12 }, kept: { width: 20 } } } };
  input.sourceReview = { originalNodeId: 'p56-development' };
  input.atoms = { 'p56-development': { original: true } };
  input.history = [{ blocks: [accidental] }];
  const result = repairTableEmptyFeedback(input);
  assert.deepEqual(result.next.sections[0].blocks.map(node => node.id),
    ['p1-cover-source-evidence', 'unconfirmed', 'kept']);
  assert.deepEqual(result.next.arrangement.rows[0].blockIds, ['p1-cover-source-evidence', 'kept']);
  assert.deepEqual(result.next.presentation.placements, [{ blockId: 'kept', x: 2 }]);
  assert.deepEqual(result.next.storedOverrides.arrangement.byBlock, { kept: { width: 20 } });
  assert.deepEqual(result.next.sourceReview, input.sourceReview);
  assert.deepEqual(result.next.atoms, input.atoms);
  assert.deepEqual(result.next.history, input.history);
  assert.deepEqual(result.provenance.removedNodes[0].node, accidental);
  assert.equal(result.report.removedNodeCount, 1);
  assert.equal(result.provenance.arrangementChanges.length, 3);
  assert.equal(result.next.revision, 353);
});

 test('unknown active references block removal without losing the node or arrangement', () => {
  const input = project([rich('p56-development')]);
  input.presentation = { anchorBlockId: 'p56-development' };
  const result = repairTableEmptyFeedback(input);
  assert.deepEqual(result.next, input);
  assert.equal(result.report.removedNodeCount, 0);
  assert.deepEqual(result.report.blockedRemovals[0].references, ['/presentation/anchorBlockId']);
});

 test('preserves protected empties, structural cells and ambiguous document shapes', () => {
  for (const key of ['preserveEmpty', 'sourcePlaceholder', 'intendedSpacer', 'writingArea', 'manualArrangement']) {
    const input = project([{ ...rich('p56-development'), [key]: true }]);
    assert.deepEqual(repairTableEmptyFeedback(input).next, input);
  }
  const cell = table('cell-container');
  cell.border = false;
  cell.rows[0][0].blocks.push(rich('p56-development'));
  const structural = project([cell]);
  assert.deepEqual(repairTableEmptyFeedback(structural).next, structural);
  const unknown = project([{ id: 'p56-development', type: 'rich-text', content: { html: '<p></p>' } }]);
  assert.deepEqual(repairTableEmptyFeedback(unknown).next, unknown);
  const cover = project([rich('p1-cover-source-evidence')]);
  assert.deepEqual(repairTableEmptyFeedback(cover, { confirmedRemovals: [{
    id: 'p1-cover-source-evidence', classification: 'confirmed-empty-category', reason: 'Attempted removal'
  }] }).next, cover);
});

 test('does not broadly delete blank prompts or Linear structural paragraphs', () => {
  const input = { id: 'linear-relationships-v1', sections: [{ blocks:
    Array.from({ length: 610 }, (_, index) => paragraph(`intentional-${index}`)) }] };
  const result = repairTableEmptyFeedback(input);
  assert.deepEqual(result.next, input);
  assert.equal(result.report.emptyParagraphCount, 610);
  assert.equal(result.report.preservedEmptyParagraphCount, 610);
  assert.equal(result.report.removedNodeCount, 0);
});

 test('is idempotent and reports affected project and bank IDs without altering relationships', () => {
  const first = repairTableEmptyFeedback(project([table('ordinary'), rich('p56-development')]));
  const second = repairTableEmptyFeedback(first.next);
  assert.deepEqual(second.next, first.next);
  assert.equal(second.report.borderChangeCount, 0);
  assert.equal(second.report.removedNodeCount, 0);
  assert.deepEqual(second.provenance, { changes: [], removedNodes: [], arrangementChanges: [] });
  const bank = { id: 'bank-test', classification: { topic: 'statistics' },
    links: [{ projectId: 'data-analysis-v1', questionId: 'stable-question' }],
    prompt: { blocks: [table('bank-table')] } };
  const collection = repairTableEmptyFeedbackCollection({ projects: [project([table('project-table')])], bankEntries: [bank] });
  assert.deepEqual(collection.affectedProjects, [{ id: 'data-analysis-v1', changedTables: 1, borderChanges: 3, removedNodes: 0 }]);
  assert.deepEqual(collection.affectedBankEntries, [{ id: 'bank-test', changedTables: 1, borderChanges: 3, removedNodes: 0 }]);
  assert.deepEqual(collection.bankEntries[0].next.links, bank.links);
  assert.deepEqual(collection.bankEntries[0].next.classification, bank.classification);
});

 test('future generation cleanup requires positive category evidence and preserves meaningful content', () => {
  const empty = rich('generated');
  assert.equal(shouldEmitGeneratedEmptyCategory(empty), true);
  assert.equal(shouldEmitGeneratedEmptyCategory(empty, { generatedCategory: true }), true);
  assert.equal(shouldEmitGeneratedEmptyCategory(empty, { generatedCategory: true, sourceBacked: false }), false);
  assert.equal(shouldEmitGeneratedEmptyCategory({ ...empty, preserveEmpty: true }, {
    generatedCategory: true, sourceBacked: false
  }), true);
  const written = { ...empty, content: { format: 'maths-editor-document-v1', version: 1,
    blocks: [paragraph('written', 'Development')] } };
  assert.equal(shouldEmitGeneratedEmptyCategory(written, { generatedCategory: true, sourceBacked: false }), true);
  assert.equal(shouldEmitGeneratedEmptyCategory(empty, {
    generatedCategory: true, sourceBacked: false, intentionallyEmpty: true
  }), true);
});
