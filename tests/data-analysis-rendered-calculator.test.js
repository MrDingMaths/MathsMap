import test from 'node:test';
import assert from 'node:assert/strict';
import { repairRenderedCalculator } from '../scripts/booklet/repair-data-analysis-rendered-calculator.mjs';
import { flowEditionSections, logicalUnits } from '../src/lib/booklet-flow.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';

const paragraph = (id, text, fontSize = 10) => ({
  id, type: 'paragraph', fontSize, inlines: [{ type: 'text', text }]
});
function fixture() {
  const group = (id, procedureId, itemId) => ({
    id, type: 'layout', columns: 1,
    slots: [{ id: `${id}-slot`, blocks: [{
      id: procedureId, type: 'list', ordered: true, start: 1, indent: 7,
      items: [{ id: itemId, type: 'list-item', blocks: [{
        id: `${itemId}-table`, type: 'table', widthMm: 30, widths: [20, 10],
        rowHeights: [9], padding: 0, border: false, marginBefore: 2, marginAfter: 2,
        annotations: [{ id: `${itemId}-outline`, type: 'circle', cellId: `${itemId}-key-cell`, widthMm: 7, heightMm: 7 }],
        rows: [[
          { id: `${itemId}-text-cell`, type: 'cell', verticalAlign: 'middle', blocks: [paragraph(`${itemId}-text`, 'Press HOME', 11)] },
          { id: `${itemId}-key-cell`, type: 'cell', verticalAlign: 'middle', blocks: [paragraph(`${itemId}-key`, 'EXE')] }
        ]]
      }] }, {
        id: `${itemId}-second`, type: 'list-item', blocks: [paragraph(`${itemId}-instruction`, 'Keep this accepted instruction.')]
      }]
    }] }]
  });
  return {
    id: 'data-analysis-v1', revision: 41,
    settings: { layoutOverrides: { blockLayouts: {
      'p53-example': { arrangement: { version: 1, root: { id: 'accepted-example-layout', type: 'group', direction: 'row', children: [] } } },
      unrelated: { manual: true }
    } } },
    sections: [{
      id: 'calculator-section', topicId: 'statistics',
      title: 'Summary Statistics from a Frequency Table',
      phase: 'teaching', role: 'teaching', headingStyle: 'page-title',
      sourcePageNumber: 52, pageBreakBefore: false,
      blocks: [{
      id: 'p52-calculator-information', type: 'rich-text', pedagogyRole: 'definition',
      sourcePageNumber: 52, source: { hash: 'preserved-source', page: 52 },
      sourceAtom: {
        id: 'p52-calculator-information', kind: 'definition',
        label: 'Summary Statistics using a Calculator', order: 1
      },
      sourceRefs: [{ page: 52 }],
      sourceReview: { sourceHash: 'preserved-source', status: 'accepted' },
      flow: { sourcePageBreakBefore: false },
      content: { format: 'maths-editor-document-v1', version: 1, blocks: [
        group('p52-model-1-group', 'p52-fx8200-procedure', 'model-one-step'),
        group('p52-model-2-group', 'p52-fx82-procedure', 'model-two-step')
      ] }
    }] }, {
      id: 'example-section', topicId: 'statistics', pageBreakBefore: true,
      phase: 'teaching', role: 'teaching', headingStyle: 'page-title',
      source: { page: 53 }, blocks: [{
        id: 'p53-example', type: 'question', sourcePageNumber: 53,
        sourceAtom: {
          id: 'p53-example-group', kind: 'example', label: 'Example',
          visibleSubtitle: 'Calculate summary statistics using a calculator', order: 1
        },
        sourceRefs: [{ page: 53 }],
        sourceReview: { sourceHash: 'preserved-example-source', status: 'accepted' },
        flow: { sourcePageBreakBefore: false },
        presentation: { manual: 'retain-local-layout' },
        content: {
          id: 'p53-calculator-task', answerSpaceMm: 0,
          prompt: { format: 'maths-editor-document-v1', blocks: [{
            id: 'p53-frequency-table', type: 'table', widthMm: 56,
            padding: 1, rowHeights: [8.2, 7.5], rows: []
          }, paragraph('p53-supplied-mean', 'mean = 4.6'), paragraph('p53-supplied-median', 'median = 5')] },
          answer: { short: 'Accepted answer', worked: 'Accepted worked method' }
        }
      }]
    }, { id: 'unrelated-section', blocks: [{ id: 'unrelated-block', content: 'Manual edit retained' }] }]
  };
}
function nodes(root) {
  const result = [];
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (value.id) result.push(value);
    // Source identities may intentionally repeat across model blocks.
    for (const [key, child] of Object.entries(value)) {
      if (['source', 'sourceAtom', 'sourceRefs', 'sourceReview'].includes(key)) continue;
      if (Array.isArray(child)) child.forEach(walk);
      else walk(child);
    }
  }
  walk(root);
  return result;
}
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test('pure repair preserves accepted content, existing IDs, source evidence and manual edits', () => {
  const original = fixture();
  const before = structuredClone(original);
  deepFreeze(original);
  const { next, provenance } = repairRenderedCalculator(original);
  assert.deepEqual(original, before);
  assert.equal(provenance.visualAcceptance, 'pending-fresh-render');
  const nextNodes = nodes(next);
  const byId = new Map(nextNodes.map(node => [node.id, node]));
  assert.equal(byId.size, nextNodes.length);
  for (const node of nodes(before)) {
    assert.ok(byId.has(node.id), `Retain ${node.id}`);
    if (node.type === 'paragraph') assert.deepEqual(byId.get(node.id), node);
    if (node.type === 'table') {
      assert.deepEqual(byId.get(node.id).rowHeights, node.rowHeights);
      assert.equal(byId.get(node.id).padding, node.padding);
      assert.deepEqual(byId.get(node.id).annotations, node.annotations);
    }
  }
  assert.deepEqual(next.settings, before.settings);
  assert.deepEqual(next.sections[3], before.sections[2]);
  const [second, example] = next.sections[1].blocks;
  assert.deepEqual(example.content, before.sections[1].blocks[0].content);
  assert.deepEqual(example.presentation, before.sections[1].blocks[0].presentation);
  assert.deepEqual(next.sections[2], { ...before.sections[1], blocks: [] });
  const first = next.sections[0].blocks[0];
  assert.deepEqual(first.source, before.sections[0].blocks[0].source);
  for (const key of ['sourceAtom', 'sourceRefs', 'sourceReview']) {
    assert.deepEqual(first[key], before.sections[0].blocks[0][key]);
    assert.deepEqual(second[key], before.sections[0].blocks[0][key]);
    assert.deepEqual(example[key], before.sections[1].blocks[0][key]);
  }
  assert.deepEqual(next.sections[1], {
    ...before.sections[0], id: 'calculator-section-calculator-model-2',
    pageBreakBefore: true, blocks: [second, example]
  });
  assert.equal(next.sections[0].pageBreakBefore, before.sections[0].pageBreakBefore);
  assert.equal(byId.get('model-one-step-text').fontSize, 11);
});

test('final method and complete example share a section and supported pagination dependencies', () => {
  const { next } = repairRenderedCalculator(fixture());
  const [first] = next.sections[0].blocks;
  const [second, example] = next.sections[1].blocks;
  assert.equal(next.sections[0].blocks.length, 1);
  assert.equal(next.sections[1].pageBreakBefore, true);
  assert.equal(first.flow.keepWithNext, false);
  assert.deepEqual(first.sourceAtom, second.sourceAtom);
  // Exercise the actual logical-unit function on the sections consumed by
  // pagination. The new section boundary prevents a three-block source atom.
  const studentSections = flowEditionSections(next, 'student');
  const firstSection = studentSections.find(section => section.blocks.some(block => block.id === first.id));
  const secondSection = studentSections.find(section => section.blocks.some(block => block.id === second.id));
  assert.ok(firstSection);
  assert.ok(secondSection);
  assert.notEqual(firstSection, secondSection);
  assert.equal(secondSection.pageBreakBefore, true);
  assert.deepEqual(logicalUnits({ sections: [firstSection] }).map(unit => unit.blocks.map(block => block.id)), [[first.id]]);
  assert.deepEqual(logicalUnits({ sections: [secondSection] }).map(unit => unit.blocks.map(block => block.id)), [[second.id], [example.id]]);
  assert.equal(first.content.blocks[0].id, 'p52-model-1-group');
  assert.equal(second.content.blocks[0].id, 'p52-model-2-group');
  assert.equal(second.flow.keepWithNext, true);
  assert.equal(second.flow.keepTogether, true);
  assert.equal(example.flow.keepTogether, true);
  for (const block of [second, example]) {
    assert.equal(block.flow.pageBreakBefore, false);
    assert.equal(block.flow.sourcePageBreakBefore, false);
    assert.equal('noBreakBefore' in block.flow, false);
  }
  const table = nodes(next).find(node => node.id === 'model-one-step-table');
  assert.equal(table.rows[0][1].verticalAlign, 'middle');
  assert.equal(table.rows[0][1].blocks[0].inlines[0].text, '1.');
  assert.equal(table.widthMm, 37);
  assert.deepEqual(table.widths, [3, 4, 20, 10]);
});

test('legacy same-section split is migrated without changing source or accepted local edits', () => {
  const accepted = repairRenderedCalculator(fixture()).next;
  const legacy = structuredClone(accepted);
  const pair = legacy.sections.splice(1, 1)[0];
  legacy.sections[0].blocks.push(...pair.blocks);
  const before = structuredClone(legacy);
  deepFreeze(legacy);
  assert.deepEqual(logicalUnits(legacy, legacy.sections[0]).map(unit => unit.blocks.map(block => block.id)), [[
    'p52-calculator-information', 'p52-calculator-information-model-2'
  ], ['p53-example']]);
  const result = repairRenderedCalculator(legacy);
  assert.deepEqual(legacy, before);
  assert.equal(result.provenance.changed, true);
  assert.deepEqual(result.next, accepted);
  assert.equal(repairRenderedCalculator(result.next).provenance.changed, false);
});

test('a conflicting deterministic section ID fails without changing the input', () => {
  const original = fixture();
  original.sections.push({ id: 'calculator-section-calculator-model-2', blocks: [] });
  const before = structuredClone(original);
  assert.throws(() => repairRenderedCalculator(original), /teaching section ID conflicts/);
  assert.deepEqual(original, before);
});

test('repair is idempotent and does not add repeated labels or model blocks', () => {
  const first = repairRenderedCalculator(fixture()).next;
  const second = repairRenderedCalculator(first);
  assert.deepEqual(second.next, first);
  assert.equal(second.provenance.changed, false);
});

test('changed native structure fails without altering the input', () => {
  const original = fixture();
  original.sections[0].blocks[0].content.blocks.push(paragraph('new-manual-block', 'Preserve this change'));
  const before = structuredClone(original);
  assert.throws(() => repairRenderedCalculator(original), /differs from the supplied/);
  assert.deepEqual(original, before);
});

test('actual paginator joins the final method and example without joining model one',async()=>{
 const p=repairRenderedCalculator(fixture()).next;const heights={'p52-calculator-information':140,'p52-calculator-information-model-2':120,'p53-example':80};
 const r=await paginateFlow(p,'student',async page=>({height:page.blocks.reduce((n,b)=>n+(heights[b.id]??10),0),capacity:210}));
 const first=r.pages.find(p=>p.blocks.some(b=>b.id==='p52-calculator-information'));const final=r.pages.find(p=>p.blocks.some(b=>b.id==='p53-example'));
 assert.notEqual(first,final);assert.deepEqual(final.blocks.map(b=>b.id),['p52-calculator-information-model-2','p53-example']);assert.ok(!r.issues.some(i=>i.kind==='oversized-content'));
});
