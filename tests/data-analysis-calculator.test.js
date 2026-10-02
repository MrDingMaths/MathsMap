import test from 'node:test';
import assert from 'node:assert/strict';
import { repairDataAnalysisCalculator } from '../scripts/booklet/repair-data-analysis-calculator.mjs';

function paragraph(id, inlines, extra = {}) {
  return { id, type: 'paragraph', inlines, fontSize: null, spaceBefore: 0, spaceAfter: 2, ...extra };
}
const text = value => ({ type: 'text', text: value });
const math = (id, latex) => ({ id, type: 'math', latex, colour: '#000000' });

function table(id, columns, widths, annotations = []) {
  return {
    id, type: 'table', widthMm: widths.reduce((a, b) => a + b, 0), widths,
    padding: 0, rowHeights: [9], borderColour: '#000000', annotations,
    rows: [columns.map((inlines, index) => ({
      id: `${id}-cell-${index}`, type: 'cell', verticalAlign: 'middle',
      blocks: [paragraph(`${id}-paragraph-${index}`, inlines)]
    }))]
  };
}

function fixture() {
  const exe = [math('exe', String.raw`\mathsf{EXE}`)];
  const t = value => [text(value)];
  const model1 = [
    table('p52-fx8200-home-row', [t('Press HOME'), [math('home', String.raw`\text{⌂}`)]], [23, 9], [
      { id: 'home-outline', type: 'circle', cellId: 'p52-fx8200-home-row-cell-1', colour: '#000000', widthMm: 7 }
    ]),
    table('p52-fx8200-statistics-row', [t('Select'), [math('statistics', String.raw`\begin{array}{c}X\\Statistics\end{array}`)], t('and press'), exe], [12, 22, 20, 16]),
    table('p52-fx8200-one-variable-row', [t('Select [1-Variable] and press'), exe], [53, 28]),
    table('p52-fx8200-entry-row', [t('Then enter data using the arrow keys and'), exe], [75, 29]),
    table('p52-fx8200-frequency-a', [t('a.'), t('Press'), [math('options', String.raw`\circ\!\circ\!\circ`)], t('and select [Frequency] > [On]')], [5, 13, 11, 87]),
    table('p52-fx8200-frequency-b', [t('b.'), t('Press'), [math('ac', String.raw`\mathbf{AC}`)], t('to return to the table.')], [5, 13, 11, 87]),
    table('p52-fx8200-results-row', [t('After entering your data, press'), exe, t(', select [1-Var Results], then press'), exe], [56, 18, 63, 29], [
      { id: 'exe-outline', type: 'circle', cellId: 'p52-fx8200-results-row-cell-1', colour: '#000000', widthMm: 10 }
    ]),
    table('p52-fx8200-down-row', [t('Press'), [math('down', String.raw`\vee`)], t('for the full list of variables.')], [13, 9, 86])
  ];
  const model2 = [
    table('p52-fx82-mode-sequence', [[math('mode', String.raw`\boxed{\mathsf{MODE}}`)], [math('stat', String.raw`\mathsf{STAT}`)], [math('one-var', String.raw`\textsf{1-VAR}`)]], [17, 19, 23]),
    table('p52-fx82-frequency-a', [t('a.'), [text('Enter the setup menu '), math('p52-fx82-setup-shift-key', String.raw`\boxed{\mathsf{SHIFT}}`), text(' '), math('p52-fx82-setup-mode-key', String.raw`\boxed{\mathsf{MODE}}`)]], [5, 119]),
    table('p52-fx82-frequency-b', [t('b.'), t('Scroll down'), [math('triangle', String.raw`\blacktriangledown`)], [text('and select '), math('p52-fx82-setup-stat-menu', String.raw`\mathsf{STAT}`)]], [5, 25, 9, 73]),
    table('p52-fx82-frequency-menu', [[math('frequency', String.raw`\textsf{Frequency?}`)], [math('off', String.raw`\mathsf{2:OFF}`)]], [24, 24]),
    table('p52-fx82-var-menu', [[math('var', String.raw`\mathsf{4:Var}`)], [math('sigma', String.raw`\mathsf{3:}\sigma x`)], [math('s', String.raw`\mathsf{4:}sx`)]], [34, 26, 26]),
    table('p52-fx82-minmax-menu', [[math('minmax', String.raw`\mathsf{5:MinMax}`)], [math('min', String.raw`\mathsf{1:minX}`)], [math('max', String.raw`\mathsf{2:maxX}`)]], [34, 26, 26])
  ];
  const group = (id, blocks) => ({
    id, type: 'layout', arrangement: 'parallel', columns: 1, margin: 0, padding: 0, gap: 0,
    slots: [{ id: `${id}-slot`, blocks }]
  });
  const procedure = (id, blocks) => ({
    id, type: 'list', ordered: true, start: 1, indent: 7,
    items: blocks.map((block, index) => ({ id: `${id}-step-${index}`, type: 'list-item', blocks: [block] }))
  });
  return {
    revision: 353, teachingAnswers: true, pagination: { mode: 'flexible' },
    sourceEvidence: { sourcePages: [52, 53], hash: 'original-source-hash' },
    blocks: [
      group('p52-model-1-group', [
        paragraph('p52-fx8200-heading', [text('Casio FX 8200AU:')]),
        procedure('p52-fx8200-procedure', model1),
        paragraph('p52-fx8200-column-definitions', [math('x', String.raw`\mathbf{x}`), text(' contains the data values; Freq contains their frequencies (counts).')])
      ]),
      group('p52-model-2-group', [
        paragraph('p52-fx82-heading', [text('Casio fx-82AU PLUS II:')], { spaceBefore: 3 }),
        procedure('p52-fx82-procedure', model2),
        paragraph('p52-fx82-leave-editor', [text('Press '), math('leave-ac', String.raw`\boxed{\mathbf{AC}}`), text(' to leave the data editor and calculate statistics.')]),
        { id: 'handwriting-box', type: 'writing-box', widthMm: 100, heightMm: 24, manual: true }
      ]),
      {
        id: 'p53-example', type: 'question', sourcePageNumber: 53,
        pedagogy: 'example', answerSpace: 0, flow: { sourcePageBreakBefore: false },
        blockLayout: {
          before: 4, after: 3, manualWidth: 151,
          arrangement: { version: 1, root: {
            id: 'p53-example-arrangement', type: 'group', direction: 'stack', gap: 0,
            children: [{ id: 'p53-table-results-row', type: 'group', direction: 'row', gap: 4, verticalAlign: 'top', children: [] }]
          } }
        },
        content: {
          id: 'p53-calculator-task', type: 'group',
          prompt: [
            paragraph('p53-calculator-instruction', [text('Find the mean and median using a calculator.')]),
            { id: 'p53-frequency-table', type: 'table', rows: [[2, 3], [3, 5], [4, 3], [5, 4], [6, 8], [7, 2]], borderColour: '#000000' },
            paragraph('p53-supplied-mean', [math('mean', String.raw`\bar{x}=4.6`)]),
            paragraph('p53-supplied-median', [math('median', String.raw`\mathrm{med}=5`)])
          ],
          answer: { short: '4.6; 5', worked: 'Accepted calculator method.' }
        }
      },
      paragraph('unrelated-paragraph', [text('Preserve this manual setting.')], { fontSize: 12, spaceAfter: 8 })
    ]
  };
}

function find(value, id) {
  if (!value || typeof value !== 'object') return undefined;
  if (value.id === id) return value;
  for (const child of Object.values(value)) {
    const result = find(child, id);
    if (result) return result;
  }
}

function pathOwner(value, path) {
  const keys = path.split('.');
  const field = keys.pop();
  return { owner: keys.reduce((node, key) => node[key], value), field };
}

test('candidate is pure, preserves all non-layout content and records every change', () => {
  const original = fixture();
  const snapshot = structuredClone(original);
  const { next, provenance } = repairDataAnalysisCalculator(original);
  assert.deepEqual(original, snapshot);
  assert.notStrictEqual(next, original);
  assert.equal(provenance.visualAcceptance, false);
  assert.ok(provenance.changes.length > 0);
  const restored = structuredClone(next);
  for (const change of provenance.changes) {
    assert.ok(['fontSize', 'spaceBefore', 'spaceAfter', 'widths', 'widthMm', 'gap', 'before', 'after', 'margin', 'padding'].includes(change.field));
    const { owner, field } = pathOwner(restored, change.path);
    assert.deepEqual(owner[field], change.after);
    if (change.wasPresent) owner[field] = change.before;
    else delete owner[field];
  }
  assert.deepEqual(restored, snapshot);
  assert.deepEqual(find(next, 'p53-calculator-task'), find(original, 'p53-calculator-task'));
  assert.deepEqual(find(next, 'handwriting-box'), find(original, 'handwriting-box'));
  assert.deepEqual(find(next, 'unrelated-paragraph'), find(original, 'unrelated-paragraph'));
  assert.deepEqual(next.sourceEvidence, original.sourceEvidence);
  assert.equal(next.teachingAnswers, true);
  assert.equal(find(next, 'p53-example').flow.sourcePageBreakBefore, false);
  assert.equal(find(next, 'p53-example').blockLayout.manualWidth, 151);
});

test('repair is idempotent and retains key outlines, row heights and list numbering', () => {
  const original = fixture();
  const first = repairDataAnalysisCalculator(original);
  const second = repairDataAnalysisCalculator(first.next);
  assert.deepEqual(second.next, first.next);
  assert.deepEqual(second.provenance.changes, []);
  for (const id of ['p52-fx8200-home-row', 'p52-fx8200-results-row']) {
    const before = find(original, id);
    const after = find(first.next, id);
    assert.deepEqual(after.annotations, before.annotations);
    assert.deepEqual(after.rowHeights, before.rowHeights);
    assert.equal(after.borderColour, before.borderColour);
    for (const annotation of after.annotations) {
      const column = after.rows[0].findIndex(cell => cell.id === annotation.cellId);
      assert.ok(after.widths[column] >= annotation.widthMm + 2);
    }
  }
  for (const id of ['p52-fx8200-procedure', 'p52-fx82-procedure']) {
    const list = find(first.next, id);
    assert.equal(list.ordered, true);
    assert.equal(list.start, 1);
    assert.equal(list.indent, 7);
  }
});

test('text widths respond to content and retain larger manual font sizes', () => {
  const compact = repairDataAnalysisCalculator(fixture()).next;
  const changed = fixture();
  const home = find(changed, 'p52-fx8200-home-row');
  home.rows[0][0].blocks[0].inlines[0].text = 'Press the HOME key on your calculator';
  home.rows[0][0].blocks[0].fontSize = 12;
  const repaired = repairDataAnalysisCalculator(changed).next;
  const updated = find(repaired, 'p52-fx8200-home-row');
  assert.ok(updated.widths[0] > find(compact, 'p52-fx8200-home-row').widths[0]);
  assert.equal(updated.rows[0][0].blocks[0].fontSize, 12);
  assert.equal(updated.widths[1], 9);
  assert.ok(find(compact, 'p52-fx8200-results-row').widthMm < 166);
  assert.ok(find(compact, 'p52-fx82-frequency-a').widthMm < 124);
});

test('unexpected source structures stop rather than silently produce a partial repair', () => {
  const missing = fixture();
  missing.blocks.shift();
  assert.throws(() => repairDataAnalysisCalculator(missing), /expected one p52-model-1-group/);
  const duplicate = fixture();
  duplicate.blocks.push(structuredClone(duplicate.blocks[0]));
  assert.throws(() => repairDataAnalysisCalculator(duplicate), /expected one p52-model-1-group/);
  const malformed = fixture();
  find(malformed, 'p52-fx8200-home-row').widths = [32];
  assert.throws(() => repairDataAnalysisCalculator(malformed), /unexpected column configuration/);
});
