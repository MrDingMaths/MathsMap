import test from 'node:test';
import assert from 'node:assert/strict';
import { repairRenderedScaffold } from '../scripts/booklet/repair-data-analysis-rendered-scaffold.mjs';

const box = width => String.raw`{\color{#cccccc}\boxed{\rule{0pt}{5.738993mm}\hspace{${width}mm}}}`;
const s = box('10.110876');
const m = box('12.310876');
const w = box('24.410876');
const originals = {
  'p24-q1-a-range-label': String.raw`\text{Range}=${s}-${s}`,
  'p24-q1-b-median-label': String.raw`\text{Median}=\frac{${s}+${s}}{2}=${s}`,
  'p24-q1-b-range-label': String.raw`\text{Range}=${s}-${s}=${s}`,
  'p24-q1-b-mean-label': String.raw`\text{Mean}=\frac{${m}}{${m}}=${s}`,
  'p24-q1-c-mode-label': String.raw`\text{Mode}=${w}`,
  'p24-q1-c-range-label': String.raw`\text{Range}=${m}-${m}=${m}`
};

function paragraph(id, latex) {
  return {
    id, type: 'paragraph', align: 'left', fontSize: 10,
    spaceBefore: 0, spaceAfter: 0.3, lineHeight: 1.2,
    inlines: [{ type: 'math', latex, display: false }],
    manualNote: 'preserve this current edit'
  };
}

function fixture() {
  return {
    content: [
      {
        id: 'p24-q1-a-bottom-layout', type: 'layout', arrangement: 'parallel',
        columns: 2, padding: 0, margin: 0, gap: 2, tracks: [30, 46],
        slots: [
          {
            id: 'p24-q1-a-range-slot', widthMm: 28,
            blocks: [
              paragraph('p24-q1-a-range-label', originals['p24-q1-a-range-label']),
              paragraph('p24-q1-a-range-hint', String.raw`\boxed{\text{Largest - Smallest}}`),
              paragraph('p24-q1-a-range-result', '=' + s)
            ]
          },
          {
            id: 'p24-q1-a-mean-slot', widthMm: 48,
            blocks: [{
              id: 'p24-q1-a-mean-table', type: 'annotated-equation',
              latex: String.raw`\frac{${m}}{${m}}\approx${box('14.510876')}`,
              fontSize: 10, width: 46, gap: 4, margin: 0, arrowSpace: 0,
              anchors: [{ id: 'numerator', start: 6, end: 73, text: m }],
              annotations: [{ id: 'hint', targetId: 'numerator', placement: 'above',
                blocks: [paragraph('add-scores', String.raw`\boxed{\text{Add scores}}`)] }]
            }]
          }
        ]
      },
      ...Object.entries(originals).filter(([id]) => id !== 'p24-q1-a-range-label')
        .map(([id, latex]) => paragraph(id, latex)),
      paragraph('p24-q1-c-median-label', String.raw`\text{Median}=${m}`),
      paragraph('p24-q1-c-mean', String.raw`\begin{aligned}\text{Mean}&=\frac{${box('14.510876')}}{${box('14.510876')}}\\&\approx${box('16.710876')}\end{aligned}`)
    ],
    source: { page: 24, originalText: 'unchanged source evidence' },
    answer: { short: 'Mode: 42; median: 47; range: 45; mean: 48.', worked: 'Accepted worked solution.' },
    classification: { primarySkillId: 'calculate-mean-median-mode-range' },
    override: { columns: 2, manualPagination: 'keep', currentManualEdit: [1, 2, 3] }
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

function ids(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (typeof value.id === 'string') result.push(value.id);
  for (const child of Object.values(value)) ids(child, result);
  return result;
}

function boxes(latex) {
  return latex.match(/\{\\color\{#cccccc\}\\boxed\{\\rule\{0pt\}\{5\.738993mm\}\\hspace\{[\d.]+mm\}\}\}/g) ?? [];
}

function withoutAuthorizedChanges(value) {
  const copy = structuredClone(value);
  for (const id of Object.keys(originals)) find(copy, id).inlines[0].latex = '<authorized latex>';
  find(copy, 'p24-q1-a-range-slot').widthMm = '<authorized width>';
  find(copy, 'p24-q1-a-bottom-layout').tracks[0] = '<authorized track>';
  return copy;
}

test('repairs only the six recorded paragraphs and two range layout properties', () => {
  const original = fixture();
  const snapshot = structuredClone(original);
  const { next, provenance } = repairRenderedScaffold(original);
  assert.deepEqual(original, snapshot, 'caller input must not be mutated');
  assert.deepEqual(withoutAuthorizedChanges(next), withoutAuthorizedChanges(original));
  assert.deepEqual(ids(next), ids(original), 'all IDs and traversal order remain stable');
  assert.deepEqual(
    provenance.changes.filter(change => change.kind === 'paragraph').map(change => change.id),
    Object.keys(originals)
  );
  assert.equal(provenance.changes.length, 8);
  for (const change of provenance.changes.filter(change => change.kind === 'paragraph')) {
    assert.deepEqual(change.before, find(original, change.id));
    assert.deepEqual(change.after, find(next, change.id));
    assert.ok(change.reason);
  }
  assert.equal(provenance.requiresFreshRender, true);
  assert.equal(provenance.acceptance, 'pending rendered inspection');
});

test('preserves every physical writing box and the complete annotated equation', () => {
  const original = fixture();
  const { next } = repairRenderedScaffold(original);
  for (const id of Object.keys(originals)) {
    const before = find(original, id);
    const after = find(next, id);
    assert.deepEqual(boxes(after.inlines[0].latex), boxes(before.inlines[0].latex), id);
    assert.equal(after.fontSize, 10);
    assert.equal(after.inlines[0].display, false);
  }
  assert.deepEqual(find(next, 'p24-q1-a-mean-table'), find(original, 'p24-q1-a-mean-table'));
  assert.deepEqual(find(next, 'p24-q1-c-median-label'), find(original, 'p24-q1-c-median-label'));
  assert.deepEqual(find(next, 'p24-q1-c-mean'), find(original, 'p24-q1-c-mean'));
  const layout = find(next, 'p24-q1-a-bottom-layout');
  assert.equal(layout.columns, 2);
  assert.equal(layout.slots[0].widthMm, 32);
  assert.equal(layout.slots[1].widthMm, 48);
  assert.ok(layout.slots.reduce((sum, slot) => sum + slot.widthMm, layout.gap) <= 83);
});

test('part b has separate label, calculation and result rows rather than an overlong joined expression', () => {
  const { next } = repairRenderedScaffold(fixture());
  for (const [id, name, calculation] of [
    ['p24-q1-b-median-label', 'Median', String.raw`\frac{${s}+${s}}{2}`],
    ['p24-q1-b-range-label', 'Range', `${s}-${s}`],
    ['p24-q1-b-mean-label', 'Mean', String.raw`\frac{${m}}{${m}}`]
  ]) {
    const latex = find(next, id).inlines[0].latex;
    const body = latex.slice(String.raw`\begin{aligned}`.length, -String.raw`\end{aligned}`.length);
    assert.deepEqual(body.split(String.raw`\\`), [
      String.raw`&\text{${name}}=`, '&' + calculation, '&=' + s
    ]);
  }
});

test('is idempotent without treating a repaired candidate as visually accepted', () => {
  const first = repairRenderedScaffold(fixture());
  const second = repairRenderedScaffold(first.next);
  assert.deepEqual(second.next, first.next);
  assert.deepEqual(second.provenance.changes, []);
  assert.equal(second.provenance.requiresFreshRender, true);
});

test('rejects conflicting manual mathematics, dimensions, missing targets and duplicate targets', () => {
  const changedMath = fixture();
  find(changedMath, 'p24-q1-b-median-label').inlines[0].latex += String.raw`\quad\text{manual edit}`;
  const snapshot = structuredClone(changedMath);
  assert.throws(() => repairRenderedScaffold(changedMath), /paragraph differs/);
  assert.deepEqual(changedMath, snapshot);

  const changedWidth = fixture();
  find(changedWidth, 'p24-q1-a-range-slot').widthMm = 31;
  assert.throws(() => repairRenderedScaffold(changedWidth), /range width differs/);

  const missing = fixture();
  missing.content = missing.content.filter(node => node.id !== 'p24-q1-b-mean-label');
  assert.throws(() => repairRenderedScaffold(missing), /Missing scaffold repair target/);

  const duplicate = fixture();
  duplicate.content.push(structuredClone(find(duplicate, 'p24-q1-b-range-label')));
  assert.throws(() => repairRenderedScaffold(duplicate), /Duplicate scaffold repair target/);
});
