import test from 'node:test';
import assert from 'node:assert/strict';
import { repairDataAnalysisR353 } from '../scripts/booklet/repair-data-analysis-r353.mjs';

const box = width => String.raw`{\color{#cccccc}\boxed{\rule{0pt}{5.738993mm}\hspace{${width}mm}}}`;
const paragraph = (id, latex) => ({
  id, type: 'paragraph', align: 'left', fontSize: 10,
  spaceBefore: 0, spaceAfter: 0.3, lineHeight: 1.2,
  inlines: [{ type: 'math', latex, display: false }],
});
const slot = (id, blocks, widthMm = 38) => ({ id, widthMm, blocks });
const layout = (id, slots) => ({
  id, type: 'layout', arrangement: 'scaffold', columns: slots.length,
  slots, padding: 0, margin: 0, gap: 2, tracks: slots.map(item => item.widthMm),
});
const document = blocks => ({ format: 'maths-editor-document-v1', version: 1, blocks });
const item = ref => ({ id: `layout:${ref}`, type: 'item', ref, title: 'Text' });
const question = (id, difficulty, reasoningScore, sourceOrder) => ({
  id, type: 'question', sourceOrder,
  classification: { difficulty, reasoningScore },
  content: { id: `${id}-content`, type: 'question', label: `${sourceOrder}`, prompt: 'Original prompt', answer: { short: 'Exact answer', worked: 'Original method' } },
  sourcePageNumber: sourceOrder,
  sourceAtom: { id: `${id}-atom` },
});

function fixture() {
  const target = question('p24-q1-block', 'Foundation', 20, 1);
  const hint = paragraph('a-range-hint', String.raw`\boxed{\text{Largest - Smallest}}`);
  hint.fontSize = 9;
  const annotated = {
    id: 'a-mean-table', type: 'annotated-equation',
    latex: String.raw`\frac{${box('12.310876')}}{${box('12.310876')}}\approx${box('14.510876')}`,
    width: 46, gap: 4, margin: 0, arrowSpace: 0, align: 'left', fontSize: 10,
    anchors: [{ id: 'numerator', start: 6, end: 73, text: box('12.310876') }],
    annotations: [{ id: 'arrow', targetId: 'numerator', colour: '#000000', placement: 'above', decoration: 'arrow', blocks: [paragraph('annotation-hint', String.raw`\boxed{\text{Add scores}}`)] }],
  };
  const table = {
    id: 'a-table', type: 'table', widths: [1, 1], rowHeights: [8, 10], padding: 0, border: false,
    rows: [
      [
        { id: 'mode-cell', type: 'cell', align: 'left', verticalAlign: 'middle', blocks: [paragraph('mode-label', String.raw`\text{Mode}=`), paragraph('mode-box', box('20.010876'))] },
        { id: 'median-cell', type: 'cell', align: 'left', verticalAlign: 'middle', blocks: [paragraph('median-label', String.raw`\text{Median}=`), paragraph('median-box', box('10.110876'))] },
      ],
      [
        { id: 'mode-hint-cell', type: 'cell', blocks: [paragraph('mode-hint', String.raw`\boxed{\text{Mode = Most}}`)] },
        { id: 'median-hint-cell', type: 'cell', blocks: [paragraph('median-hint', String.raw`\boxed{\text{Middle score}}`)] },
      ],
    ],
  };
  const a = {
    id: 'part-a', type: 'part', label: 'a', responseSpace: 'scaffold', answerSpaceMm: 0,
    responseEstimate: { lines: 7, heightMm: 44 },
    answer: { short: 'Mode: 16, 19; median: 19; range: 23; mean: 22.2.', worked: 'Original worked solution; 1 d.p.' },
    prompt: document([
      paragraph('a-data', '19,34,22,16,27,35,19,12,16'),
      layout('a-scaffold', [
        slot('a-top-slot', [table], 78),
        slot('a-range-slot', [
          paragraph('a-range-label', String.raw`\text{Range}=`),
          paragraph('a-range-subtraction', `${box('10.110876')}-${box('10.110876')}`),
          hint,
          paragraph('a-range-result', `=${box('10.110876')}`),
        ], 28),
        slot('a-mean-slot', [paragraph('a-mean-label', String.raw`\text{Mean}=`), annotated], 48),
      ]),
    ]),
  };
  const b = {
    id: 'part-b', type: 'part', label: 'b', answerSpaceMm: 0, responseSpace: 'scaffold',
    answer: { short: '47', worked: 'Use the two middle values.' },
    prompt: document([layout('b-scaffold', [
      slot('b-left-slot', [
        paragraph('b-median-label', String.raw`\text{Median}=`),
        paragraph('b-median-fraction', String.raw`\frac{${box('10.110876')}+${box('10.110876')}}{2}`),
        paragraph('b-median-result', `=${box('10.110876')}`),
      ], 37),
      slot('b-right-slot', [
        paragraph('b-range-label', String.raw`\text{Range}=`),
        paragraph('b-range-subtraction', `${box('10.110876')}-${box('10.110876')}`),
        paragraph('b-range-result', `=${box('10.110876')}`),
        paragraph('b-mean-label', String.raw`\text{Mean}=`),
        paragraph('b-mean-formula', String.raw`\frac{${box('12.310876')}}{${box('12.310876')}}=${box('10.110876')}`),
        { id: 'unknown-working', type: 'working-area', widthMm: 17.25, heightMm: 46.75, custom: { keep: true } },
      ], 39),
    ])]),
  };
  const c = {
    id: 'part-c', type: 'part', label: 'c', answerSpaceMm: 0,
    answer: { short: '240', worked: 'Original solution.' },
    prompt: document([layout('c-scaffold', [
      slot('c-left-slot', [paragraph('c-median-label', String.raw`\text{Median}=`)]),
      slot('c-right-slot', [
        paragraph('c-unrelated-box', box('12.310876')),
        paragraph('c-mean', String.raw`\begin{aligned}\text{Mean}&=\frac{${box('14.510876')}}{${box('14.510876')}}\\&\approx${box('16.710876')}\end{aligned}`),
      ]),
    ])]),
  };
  target.content = {
    id: 'p24-q1', type: 'question', label: '1', layout: 'grid', columns: 2,
    prompt: 'Calculate the mode, range, median, and mean. Round to 1 d.p. if required.',
    children: [a, b, c, { id: 'part-d', type: 'part', label: 'd', prompt: '$80,23,56,21,87,66,23$', answerSpaceMm: 46, answer: { short: '50.9', worked: 'Round to 1 d.p.' } }],
  };
  const arrangement = {
    version: 1,
    root: { id: 'question-layout', type: 'group', direction: 'stack', children: [
      item('part-b/prompt'),
      item('part-b/prompt#b-scaffold'),
      item('part-b/prompt#b-median-label'),
      item('part-b/prompt#b-median-fraction'),
      item('part-b/prompt#b-median-result'),
      item('part-a/prompt#a-range-result'),
      item('part-b/space'),
    ] },
  };
  target.presentation = { arrangement: structuredClone(arrangement), customWidthMm: 81 };
  const sourceReview = { arrangement: { root: { children: [item('part-b/prompt#b-median-result')] } }, accepted: true };
  target.sourceReview = structuredClone(sourceReview);
  target.spec = { sourceOrder: 1, prompt: 'Original source specification' };
  target.provenance = { sourceIds: ['b-median-result'] };
  return {
    id: 'data-analysis',
    studioFlags: [{ id: 'flag-1', anchor: 'b-median-result', comment: 'Leave byte-identical', resolved: false }],
    settings: {
      blockLayouts: {
        'p24-q1-block': { arrangement, sourceReview: structuredClone(sourceReview), spec: { ref: 'part-b/prompt#b-median-result' }, provenance: { id: 'b-median-result' } },
        'b-median-result': { widthMm: 10.110876 },
        'part-b/prompt': { widthMm: 37 },
      },
    },
    exercises: [
      { id: 'summary', topicId: 'summary-statistics-list', blocks: [
        question('challenge', 'Challenge', 2, 8),
        { id: 'teaching', type: 'teaching', content: { text: 'Keep its position.' } },
        question('tie-first', 'Development', 38, 3),
        target,
        question('foundation-18', 'Foundation', 18, 2),
        question('tie-second', 'Development', 38, 4),
        question('mastery', 'Mastery', 50, 5),
        question('development-30', 'Development', 30, 6),
      ] },
      { id: 'merits', topicId: 'relative-merits-centre', blocks: [
        question('merits-development', 'Development', 30, 9),
        question('merits-foundation-24', 'Foundation', 24, 10),
        question('merits-foundation-8', 'Foundation', 8, 11),
        question('merits-mastery', 'Mastery', 50, 12),
      ] },
      { id: 'other', topicId: 'unrelated-topic', blocks: [question('other-master', 'Mastery', 55, 13), question('other-foundation', 'Foundation', 5, 14)] },
    ],
  };
}

function getTarget(project) {
  return project.exercises.flatMap(exercise => exercise.blocks).find(block => block.id === 'p24-q1-block');
}

function findNode(value, id) {
  if (!value || typeof value !== 'object') return undefined;
  if (value.id === id) return value;
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return undefined;
}

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

function dimensions(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (typeof value.latex === 'string') {
    result.push(...value.latex.matchAll(/\\(?:rule\{0pt\}|hspace)\{[0-9.]+mm\}/g));
  }
  Object.values(value).forEach(child => {
    if (child && typeof child === 'object') dimensions(child, result);
  });
  return result.map(match => typeof match === 'string' ? match : match[0]);
}

function contentIds(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (typeof value.id === 'string') result.push(value.id);
  Object.values(value).forEach(child => {
    if (child && typeof child === 'object') contentIds(child, result);
  });
  return result;
}

function preservedQuestionData(project) {
  return project.exercises.flatMap(exercise => exercise.blocks).filter(block => block.type === 'question').map(block => ({
    id: block.id, sourceOrder: block.sourceOrder, sourcePageNumber: block.sourcePageNumber,
    classification: block.classification, sourceAtom: block.sourceAtom,
    sourceReview: block.sourceReview, spec: block.spec, provenance: block.provenance,
    label: block.content.label, prompt: block.content.prompt, answer: block.content.answer,
    parts: block.content.children?.map(part => ({
      id: part.id, label: part.label, answer: part.answer, answerSpaceMm: part.answerSpaceMm,
      responseSpace: part.responseSpace, responseEstimate: part.responseEstimate,
    })),
  })).sort((a, b) => a.id.localeCompare(b.id));
}

test('repair is nonmutating and idempotent, with no second-pass changes', () => {
  const original = fixture();
  const snapshot = structuredClone(original);
  freezeDeep(original);
  const first = repairDataAnalysisR353(original);
  assert.deepEqual(original, snapshot);
  assert.notEqual(first.next, original);
  assert.equal(first.provenance.sortedExercises.length, 2);
  assert.equal(first.provenance.mergedParagraphs.length, 6);
  const second = repairDataAnalysisR353(first.next);
  assert.deepEqual(second.next, first.next);
  assert.deepEqual(second.provenance.sortedExercises, []);
  assert.deepEqual(second.provenance.mergedParagraphs, []);
});

test('target topics sort by difficulty then score, preserving ties and teaching positions', () => {
  const original = fixture();
  const { next } = repairDataAnalysisR353(original);
  assert.deepEqual(next.exercises[0].blocks.map(block => block.id), [
    'p24-q1-block', 'teaching', 'foundation-18', 'development-30',
    'tie-first', 'tie-second', 'mastery', 'challenge',
  ]);
  assert.deepEqual(next.exercises[1].blocks.map(block => block.id), [
    'merits-foundation-8', 'merits-foundation-24', 'merits-development', 'merits-mastery',
  ]);
  assert.deepEqual(next.exercises[2], original.exercises[2]);
  assert.deepEqual(preservedQuestionData(next), preservedQuestionData(original));
});

test('minimal supplied classification-only blocks sort without requiring content', () => {
  const original = { exercises: [{ id: 'minimal', topicId: 'summary-statistics-list', blocks: [
    { id: 'p24-q2-block', classification: { difficulty: 'Foundation', reasoningScore: 18 } },
    { id: 'p24-q1-block', classification: { difficulty: 'Foundation', reasoningScore: 20 } },
    { id: 'p25-q7-block', classification: { difficulty: 'Development', reasoningScore: 38 } },
    { id: 'p26-q10-block', classification: { difficulty: 'Development', reasoningScore: 38 } },
  ] }] };
  const { next } = repairDataAnalysisR353(original);
  assert.deepEqual(next.exercises[0].blocks.map(block => block.id), [
    'p24-q1-block', 'p24-q2-block', 'p25-q7-block', 'p26-q10-block',
  ]);
});

test('median, range and mean rows concatenate existing mathematics and retain first IDs', () => {
  const original = fixture();
  const before = getTarget(original).content;
  const { next, provenance } = repairDataAnalysisR353(original);
  const after = getTarget(next).content;
  const median = findNode(after, 'b-median-label');
  assert.equal(median.inlines.length, 1);
  assert.equal(median.inlines[0].latex, ['b-median-label', 'b-median-fraction', 'b-median-result'].map(id => findNode(before, id).inlines[0].latex).join(''));
  assert.equal(findNode(after, 'b-range-label').inlines[0].latex, ['b-range-label', 'b-range-subtraction', 'b-range-result'].map(id => findNode(before, id).inlines[0].latex).join(''));
  assert.equal(findNode(after, 'b-mean-label').inlines[0].latex, ['b-mean-label', 'b-mean-formula'].map(id => findNode(before, id).inlines[0].latex).join(''));
  const removed = provenance.mergedParagraphs.flatMap(merge => merge.removedIds);
  assert.deepEqual([...removed].sort(), [
    'a-range-subtraction', 'b-mean-formula', 'b-median-fraction', 'b-median-result',
    'b-range-result', 'b-range-subtraction', 'median-box', 'mode-box',
  ].sort());
  assert.deepEqual(contentIds(after).sort(), contentIds(before).filter(id => !removed.includes(id)).sort());
  assert.deepEqual(dimensions(after).sort(), dimensions(before).sort());
  for (const key of ['align', 'fontSize', 'spaceBefore', 'spaceAfter', 'lineHeight']) {
    assert.equal(median[key], findNode(before, 'b-median-label')[key]);
  }
});

test('table handwriting heights, hints, annotations, separate slots and unknown working sizes survive', () => {
  const original = fixture();
  const { next } = repairDataAnalysisR353(original);
  const before = getTarget(original).content;
  const after = getTarget(next).content;
  const table = findNode(after, 'a-table');
  assert.deepEqual(table.rowHeights, [8, 10]);
  assert.deepEqual(table.widths, [1, 1]);
  assert.deepEqual(table.rows[1], findNode(before, 'a-table').rows[1]);
  assert.equal(table.rows[0][0].blocks.length, 1);
  assert.equal(table.rows[0][1].blocks.length, 1);
  assert.equal(findNode(after, 'median-label').inlines[0].latex, String.raw`\text{Median}=${box('10.110876')}`);
  assert.deepEqual(findNode(after, 'a-range-hint'), findNode(before, 'a-range-hint'));
  assert.deepEqual(findNode(after, 'a-range-result'), findNode(before, 'a-range-result'));
  assert.deepEqual(findNode(after, 'a-mean-table'), findNode(before, 'a-mean-table'));
  assert.deepEqual(findNode(after, 'a-mean-label'), findNode(before, 'a-mean-label'));
  assert.deepEqual(findNode(after, 'c-scaffold'), findNode(before, 'c-scaffold'));
  assert.deepEqual(findNode(after, 'unknown-working'), findNode(before, 'unknown-working'));
  for (const id of ['a-scaffold', 'b-scaffold']) {
    assert.deepEqual(findNode(after, id).tracks, findNode(before, id).tracks);
    assert.deepEqual(findNode(after, id).slots.map(entry => entry.widthMm), findNode(before, id).slots.map(entry => entry.widthMm));
  }
});

test('removed paragraph layout references are pruned while whole prompts and evidence remain', () => {
  const original = fixture();
  const { next } = repairDataAnalysisR353(original);
  const expectedRefs = [
    'part-b/prompt', 'part-b/prompt#b-scaffold', 'part-b/prompt#b-median-label',
    'part-a/prompt#a-range-result', 'part-b/space',
  ];
  assert.deepEqual(getTarget(next).presentation.arrangement.root.children.map(entry => entry.ref), expectedRefs);
  assert.deepEqual(next.settings.blockLayouts['p24-q1-block'].arrangement.root.children.map(entry => entry.ref), expectedRefs);
  assert.equal(Object.hasOwn(next.settings.blockLayouts, 'b-median-result'), false);
  assert.deepEqual(next.settings.blockLayouts['part-b/prompt'], original.settings.blockLayouts['part-b/prompt']);
  for (const key of ['sourceReview', 'spec', 'provenance']) {
    assert.deepEqual(next.settings.blockLayouts['p24-q1-block'][key], original.settings.blockLayouts['p24-q1-block'][key]);
  }
  assert.equal(JSON.stringify(next.studioFlags), JSON.stringify(original.studioFlags));
});

test('unknown paragraph metadata and unknown box dimensions are preserved rather than inferred', () => {
  const original = fixture();
  const content = getTarget(original).content;
  findNode(content, 'b-median-fraction').sourceAtom = { id: 'keep-source-reference' };
  findNode(content, 'b-range-subtraction').inlines[0].latex = String.raw`\boxed{\rule{0pt}{unknown}\hspace{unknown}}`;
  const { next } = repairDataAnalysisR353(original);
  const after = getTarget(next).content;
  for (const id of ['b-median-label', 'b-median-fraction', 'b-median-result', 'b-range-label', 'b-range-subtraction', 'b-range-result']) {
    assert.deepEqual(findNode(after, id), findNode(content, id));
  }
});
