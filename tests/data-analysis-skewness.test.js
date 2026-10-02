import test from 'node:test';
import assert from 'node:assert/strict';
import { repairDataAnalysisSkewness } from '../scripts/booklet/repair-data-analysis-skewness.mjs';
import { isPractice } from '../src/lib/booklet-flow.js';

const ID = 'p82-skewness-investigation';

function fixture() {
  return {
    id: 'data-analysis-v1',
    revision: 17,
    manualSettings: { pagination: 'flexible', unrelatedOverride: 23 },
    sections: [
      {
        id: 'distribution-shape-teaching',
        type: 'teaching',
        topicId: 'distribution-shape',
        sourcePageNumber: 82,
        blocks: [
          { id: 'p82-modality', type: 'question', sourceAtom: { order: 1 }, content: { text: 'Existing modality.' } },
          {
            id: 'p82-skewness-comparison',
            type: 'question',
            sourceAtom: { id: 'original-comparison', order: 2, kind: 'key-ideas' },
            sourcePageNumber: 82,
            content: {
              id: 'comparison-content',
              prompt: {
                format: 'maths-editor-document-v1', version: 1,
                blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Existing skewness teaching.' }] }]
              },
              questionDiagrams: [{ id: 'existing-native-diagram', code: 'Original source diagram', widthMm: 63 }],
              answer: { short: 'Accepted answer', worked: 'Accepted taught method' }
            },
            flow: { sourcePageBreakBefore: true }
          },
          { id: 'following-teaching', type: 'question', sourceAtom: { order: 3 }, manualWidthMm: 71 }
        ]
      },
      { id: 'other-topic', type: 'practice', topicId: 'another-topic', blocks: [{ id: 'unrelated-question', difficulty: 3 }] }
    ],
    sourceEvidence: { originalPages: [76, 77, 82], sourceHash: 'retain-this-source-hash' }
  };
}

function investigation(project) {
  return project.sections[0].blocks.find(block => block.id === ID);
}

function statistics(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const frequencies = new Map();
  for (const value of sorted) frequencies.set(value, (frequencies.get(value) ?? 0) + 1);
  const greatestFrequency = Math.max(...frequencies.values());
  return {
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    modes: [...frequencies].filter(([, count]) => count === greatestFrequency).map(([value]) => value)
  };
}

function plottedValues(diagram) {
  const match = diagram.code.match(/^% mathsmap-dotplot-values: (\[[^\n]+\])$/m);
  assert.ok(match, 'Native plot retains explicit editable data evidence.');
  return JSON.parse(match[1]);
}

function promptText(prompt) {
  return prompt.blocks.map(block => block.content.map(node => node.text).join('')).join('\n');
}

test('inserts once after the comparison and preserves all existing content and settings', () => {
  const original = fixture();
  const before = structuredClone(original);
  const { next, provenance } = repairDataAnalysisSkewness(original);
  assert.deepEqual(original, before, 'The input remains unchanged.');
  assert.notEqual(next, original);
  assert.deepEqual(next.sections[0].blocks.map(block => block.id),
    ['p82-modality', 'p82-skewness-comparison', ID, 'following-teaching']);
  const withoutAddition = structuredClone(next);
  withoutAddition.sections[0].blocks.splice(2, 1);
  assert.deepEqual(withoutAddition, original);
  assert.equal(provenance.changed, true);
  assert.equal(provenance.origin, 'feedback-authored');
  assert.equal(provenance.sourceOriginal, false);
  assert.deepEqual(provenance.sourceReferences.map(reference => reference.pageNumber), [82, 76, 77]);
  assert.equal(provenance.acceptance.renderedVisualInspection, 'pending');
  assert.equal(investigation(next).sourceAtom.order, 2.5);
});

test('is idempotent and retains subsequent manual edits to the investigation', () => {
  const first = repairDataAnalysisSkewness(fixture());
  const second = repairDataAnalysisSkewness(first.next);
  assert.deepEqual(second.next, first.next);
  assert.equal(second.provenance.changed, false);
  assert.deepEqual(second.provenance.insertedBlockIds, []);
  investigation(first.next).content.children[0].answerSpaceMm = 19;
  investigation(first.next).content.questionDiagrams[0].widthMm = 58;
  const third = repairDataAnalysisSkewness(first.next);
  assert.deepEqual(third.next, first.next);
});

test('fails safely for missing, duplicate, misplaced or incorrectly scoped blocks', () => {
  const missing = fixture();
  missing.sections[0].blocks.splice(1, 1);
  assert.throws(() => repairDataAnalysisSkewness(missing), /Expected one/);
  const duplicate = fixture();
  duplicate.sections[0].blocks.push(structuredClone(duplicate.sections[0].blocks[1]));
  assert.throws(() => repairDataAnalysisSkewness(duplicate), /Expected one/);
  const wrongSection = fixture();
  wrongSection.sections[0].type = 'practice';
  assert.throws(() => repairDataAnalysisSkewness(wrongSection), /teaching section/);
  const misplaced = fixture();
  misplaced.sections[0].blocks.push({ id: ID, type: 'question' });
  const before = structuredClone(misplaced);
  assert.throws(() => repairDataAnalysisSkewness(misplaced), /conflicting location/);
  assert.deepEqual(misplaced, before);
});

test('starting and independently moved data give the accepted statistics', () => {
  const block = investigation(repairDataAnalysisSkewness(fixture()).next);
  const starting = plottedValues(block.content.questionDiagrams[0]);
  assert.deepEqual(starting, [7, 8, 9, 9, 9, 10, 11]);
  assert.deepEqual(statistics(starting), { mean: 9, median: 9, modes: [9] });
  assert.deepEqual(statistics(starting.map(value => value === 11 ? 18 : value)),
    { mean: 10, median: 9, modes: [9] });
  assert.deepEqual(statistics(starting.map(value => value === 7 ? 0 : value)),
    { mean: 8, median: 9, modes: [9] });
  assert.match(block.content.children[0].answer.short, /Mean increases to 10/);
  assert.match(block.content.children[1].answer.short, /Mean decreases to 8/);
  assert.match(promptText(block.content.children[1].prompt), /Return to the starting data/);
});

test('contrasting plot data and supplied statistic markers agree arithmetically', () => {
  const diagrams = investigation(repairDataAnalysisSkewness(fixture()).next).content.questionDiagrams;
  const cases = [
    { diagram: diagrams[1], values: [9, 9, 9, 10, 11, 12, 17], expected: { mean: 11, median: 10, modes: [9] } },
    { diagram: diagrams[2], values: [1, 6, 7, 8, 9, 9, 9], expected: { mean: 7, median: 8, modes: [9] } }
  ];
  for (const { diagram, values, expected } of cases) {
    assert.deepEqual(plottedValues(diagram), values);
    assert.deepEqual(statistics(values), expected);
    assert.ok(diagram.code.includes(`% mathsmap-statistic-marker: mean=${expected.mean}`));
    assert.ok(diagram.code.includes(`% mathsmap-statistic-marker: median=${expected.median}`));
    assert.ok(diagram.code.includes(`% mathsmap-statistic-marker: mode=${expected.modes[0]}`));
  }
});

test('retains investigation semantics and the actual flow practice predicate excludes it', () => {
  const block = investigation(repairDataAnalysisSkewness(fixture()).next);
  assert.equal(block.sourceAtom.kind, 'investigation');
  assert.equal(block.pedagogyRole, 'investigation');
  assert.equal(block.sourceAtom.label, 'Investigation');
  assert.equal(block.sourceAtom.origin, 'feedback-authored');
  assert.equal(block.sourceAtom.sourceOriginal, false);
  assert.equal(block.snapshotKind, 'local');
  assert.equal(block.bankRef, null);
  assert.equal(block.flow.sourcePageBreakBefore, false);
  assert.equal(isPractice(block), false);
  for (const part of block.content.children) {
    assert.ok(part.answer.short);
    assert.ok(part.answer.worked);
    assert.ok(part.answerSpaceMm <= 16);
    assert.equal(part.prompt.format, 'maths-editor-document-v1');
  }
  assert.match(promptText(block.content.children[2].prompt), /not a rule for every dataset/);
  const studentText = promptText(block.content.prompt) + '\n' +
    block.content.children.map(part => promptText(part.prompt)).join('\n');
  assert.doesNotMatch(studentText, /Mean increases to 10|Mean decreases to 8/);
});

test('places graph metadata immediately inside each dot plot tikzpicture', () => {
  const diagrams = investigation(repairDataAnalysisSkewness(fixture()).next).content.questionDiagrams;
  const special = '\\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}';
  assert.equal(diagrams.length, 3);
  for (const diagram of diagrams) {
    const lines = diagram.code.split('\n');
    const begin = lines.findIndex(line => line.startsWith('\\begin{tikzpicture}'));
    const end = lines.indexOf('\\end{tikzpicture}');
    const metadata = lines.indexOf(special);
    assert.ok(begin >= 0, `${diagram.id}: tikzpicture begins.`);
    assert.ok(end > begin, `${diagram.id}: tikzpicture ends after beginning.`);
    assert.equal(lines.filter(line => line === special).length, 1,
      `${diagram.id}: graph metadata occurs exactly once.`);
    assert.equal(metadata, begin + 1,
      `${diagram.id}: graph metadata immediately follows tikzpicture begin.`);
    assert.ok(metadata < end, `${diagram.id}: graph metadata precedes tikzpicture end.`);
  }
});

test('uses native compact black plots with explicit pending review and font declarations', () => {
  const diagrams = investigation(repairDataAnalysisSkewness(fixture()).next).content.questionDiagrams;
  for (const diagram of diagrams) {
    assert.equal(diagram.format, 'tikz');
    assert.equal(diagram.widthMm, 56);
    assert.equal(diagram.reviewStatus, 'needs-review');
    assert.ok(diagram.code.includes('mathsmap-diagram-colours {"version":1'));
    assert.ok(diagram.code.includes('data-graph-strokes="1"'));
    assert.equal(diagram.code.split('\\fontsize{10}{12}').length - 1, 1);
    assert.ok(diagram.code.includes('line width=0.5pt'));
    assert.ok(diagram.code.includes('line width=0.4pt'));
    assert.ok(diagram.code.includes('line width=0.8pt,fill=black'));
    assert.doesNotMatch(diagram.code, /\\shade|fill opacity|fill=gray/);
  }
});
