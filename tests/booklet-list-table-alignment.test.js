import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDocument, renderDocument } from '../public/libs/maths-editor/document-model.mjs';

const leadingTableStyle = 'display:inline-block;vertical-align:middle;';
const paragraph = (id, text) => ({ type: 'paragraph', id, inlines: [{ type: 'text', text }] });
const document = blocks => ({ version: 1, blocks });
const table = id => ({
  type: 'table', id, border: false, widthMm: 40, widths: [30, 10],
  padding: 0.4, marginBefore: 0, marginAfter: 0, annotations: [],
  rows: [[
    { id: `${id}-instruction-cell`, blocks: [paragraph(`${id}-instruction`, 'Press HOME')] },
    { id: `${id}-button-cell`, blocks: [{
      type: 'paragraph', id: `${id}-button`,
      inlines: [{ type: 'math', latex: '\\text{⌂}', display: false }]
    }] }
  ]]
});
const list = (id, items, ordered = true) => ({
  type: 'list', id, ordered, start: 3, indent: 5,
  items: items.map((blocks, index) => ({
    id: `${id}-item-${index}`, ...(index === 0 ? { value: 7 } : {}), blocks
  }))
});

function inspectHTML(html) {
  return {
    wrappers: Array.from(html.matchAll(/<div data-table-wrap style="([^"]*)">/g), match => match[1]),
    listItems: Array.from(html.matchAll(/<li\b[^>]*>/g), match => match[0])
  };
}

function assertNativeId(html, id, type) {
  assert.ok(html.includes(`data-id="${id}"${type ? ` data-type="${type}"` : ''}`), `Missing native ID: ${id}`);
}

for (const editable of [false, true]) {
  test(`leading list tables keep native markup and menu contents (editable=${editable})`, () => {
    const raw = document([list('instructions', [[table('home-menu')]])]);
    const before = JSON.stringify(raw);
    const normalized = normalizeDocument(raw);
    const html = renderDocument(raw, { editable });
    const inspected = inspectHTML(html);
    const normalizedTable = normalized.blocks[0].items[0].blocks[0];
    const standalone = renderDocument(document([normalizedTable]), { editable });

    assert.equal(inspected.wrappers.length, 1);
    assert.ok(inspected.wrappers[0].startsWith(leadingTableStyle));
    assert.ok(html.includes(standalone.replace('data-table-wrap style="', `data-table-wrap style="${leadingTableStyle}`)), 'Only the table wrapper display changes');
    assert.match(html, /<ol\b[^>]*start="3"/);
    assert.match(inspected.listItems[0], /value="7"/);
    assert.match(inspected.listItems[0], /display:list-item/);
    assertNativeId(html, 'instructions', 'list');
    assertNativeId(html, 'instructions-item-0', 'list-item');
    assertNativeId(html, 'home-menu', 'table');
    assertNativeId(html, 'home-menu-instruction-cell');
    assertNativeId(html, 'home-menu-button-cell');
    assertNativeId(html, 'home-menu-instruction', 'paragraph');
    assertNativeId(html, 'home-menu-button', 'paragraph');
    assert.ok(html.includes('Press HOME'));
    assert.ok(html.includes('data-annotations="[]"'));
    assert.equal(JSON.stringify(raw), before, 'Rendering must not mutate source data');
  });
}

for (const editable of [false, true]) {
  test(`multirow leading list tables retain top alignment (editable=${editable})`, () => {
    const multirow = table('multirow-menu');
    multirow.rows.push(table('second-row').rows[0]);
    multirow.rowHeights = [10, 10];
    for (const row of multirow.rows) {
      for (const cell of row) cell.verticalAlign = 'middle';
    }
    const raw = document([list('multirow-instructions', [[multirow]])]);
    const before = JSON.stringify(raw);
    const normalizedTable = normalizeDocument(raw).blocks[0].items[0].blocks[0];
    const html = renderDocument(raw, { editable });
    const standalone = renderDocument(document([normalizedTable]), { editable });
    const inspected = inspectHTML(html);
    const multirowStyle = 'display:inline-block;vertical-align:top;';

    assert.equal(inspected.wrappers.length, 1);
    assert.ok(inspected.wrappers[0].startsWith(multirowStyle));
    assert.ok(html.includes(standalone.replace('data-table-wrap style="', `data-table-wrap style="${multirowStyle}`)), 'Only the leading table wrapper alignment changes');
    assert.match(html, /<ol\b[^>]*start="3"/);
    assert.match(inspected.listItems[0], /value="7"/);
    assert.match(inspected.listItems[0], /display:list-item/);
    assertNativeId(html, 'multirow-instructions', 'list');
    assertNativeId(html, 'multirow-instructions-item-0', 'list-item');
    assertNativeId(html, 'multirow-menu', 'table');
    assertNativeId(html, 'second-row-instruction-cell');
    assert.equal(JSON.stringify(raw), before, 'Rendering must not mutate source data');
  });
}

test('only the first direct block in each list item receives the table display change', () => {
  const firstParagraph = paragraph('ordinary-instruction', 'Choose a menu.');
  const raw = document([list('mixed', [
    [table('leading'), table('following')],
    [firstParagraph, table('after-paragraph')],
    [{ type: 'spacer', id: 'initial-space', height: 2 }, table('after-spacer')]
  ])]);
  const html = renderDocument(raw);
  const { wrappers } = inspectHTML(html);

  assert.equal(wrappers.length, 4);
  assert.deepEqual(wrappers.map(style => style.startsWith(leadingTableStyle)), [true, false, false, false]);
  assert.ok(html.includes(renderDocument(document([firstParagraph]))), 'Ordinary paragraph markup is unchanged');
});

test('standalone tables and tables inside a leading table retain their block wrappers', () => {
  const outer = table('outer');
  outer.rows[0][0].blocks.push(table('inside-cell'));
  const html = renderDocument(document([
    table('standalone'),
    list('outer-list', [[outer]])
  ]));
  const { wrappers } = inspectHTML(html);

  assert.equal(wrappers.length, 3);
  assert.deepEqual(wrappers.map(style => style.startsWith(leadingTableStyle)), [false, true, false]);
});

test('nested lists keep semantic markers and apply the rule within their own items', () => {
  const nested = list('nested', [[table('nested-leading')]], false);
  const introductoryParagraph = paragraph('nested-introduction', 'Follow these steps.');
  const html = renderDocument(document([list('parent', [[introductoryParagraph, nested]])]));
  const inspected = inspectHTML(html);

  assert.match(html, /<ol\b/);
  assert.match(html, /<ul\b[^>]*list-style-type:disc/);
  assert.doesNotMatch(html, /<ul\b[^>]*\bstart=/);
  assert.equal(inspected.listItems.length, 2);
  assert.ok(inspected.listItems.every(item => item.includes('display:list-item')));
  assert.deepEqual(inspected.wrappers.map(style => style.startsWith(leadingTableStyle)), [true]);
  assertNativeId(html, 'parent', 'list');
  assertNativeId(html, 'nested', 'list');
  assertNativeId(html, 'nested-item-0', 'list-item');
  assert.ok(html.includes(renderDocument(document([introductoryParagraph]))));
});
