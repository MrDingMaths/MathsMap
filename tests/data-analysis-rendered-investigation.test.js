import test from 'node:test';
import assert from 'node:assert/strict';
import { repairRenderedInvestigation } from '../scripts/booklet/repair-data-analysis-rendered-investigation.mjs';

const ID = 'p82-skewness-investigation';
const paragraph = (text, number) => ({
  format: 'maths-editor-document-v1', version: 1,
  blocks: [{ type: 'paragraph', id: `${ID}-paragraph-${number}`, inlines: [{ type: 'text', text }] }],
});

function fixture() {
  const parts = [
    ['a', 12, 'Predict which of the mean, median and mode will change, and in which direction, if 11 is replaced by 18.',
      'Mean increases to 10; median and mode stay at 9.',
      'Replacing 11 with 18 increases the total by 7. There are still 7 values, so the mean increases by 1 to 10. The middle value and most frequent value remain 9.'],
    ['b', 12, 'Return to the starting data. Predict which of the mean, median and mode will change, and in which direction, if 7 is replaced by 0.',
      'Mean decreases to 8; median and mode stay at 9.',
      'Replacing 7 with 0 decreases the total by 7. There are still 7 values, so the mean decreases by 1 to 8. The middle value and most frequent value remain 9.'],
    ['c', 16, 'For each contrasting plot, list the mode, median and mean from left to right. Compare their order with the direction of the longer tail. These examples illustrate a typical pattern; the ordering is not a rule for every dataset.',
      'Right tail: mode 9, median 10, mean 11. Left tail: mean 7, median 8, mode 9.',
      'In the right-tail example, mode < median < mean. In the left-tail example, mean < median < mode. The mean lies towards the longer tail in these examples. This ordering is typical, but is not universal.'],
    ['d', 12, 'Explain why an extreme value can move the mean while the median and mode stay the same.',
      'An extreme value strongly pulls the mean towards the tail. The middle rank and most frequent value may stay the same.',
      'The mean uses every value, so moving an extreme value changes the total and pulls the mean towards that tail. The median depends on the middle rank, which may stay unchanged. The mode depends on frequency, so it may also stay unchanged.'],
  ];
  // Representative native code tests byte preservation, not rendered typography.
  const diagrams = [
    ['starting', '[7,8,9,9,9,10,11]'],
    ['right-tail', '[9,9,9,10,11,12,17]'],
    ['left-tail', '[1,6,7,8,9,9,9]'],
  ].map(([suffix, values]) => ({
    id: `${ID}-${suffix}`, format: 'tikz', widthMm: 56,
    role: 'question', reviewStatus: 'needs-review',
    code: `% mathsmap-dotplot-values: ${values}\n\\begin{tikzpicture}[every node/.style={font=\\fontsize{10}{12}\\selectfont}]\n\\path[use as bounding box] (0,-2.05) rectangle (5.6,1.9);\n\\node[font=\\fontsize{8.5}{10}\\selectfont] {9};\n\\end{tikzpicture}`,
  }));
  return {
    id: 'data-analysis-v1',
    preservedMetadata: { revision: 42, sourceHash: 'unchanged', completedReview: true },
    sections: [{
      id: 'assignment-a09664fe6e7ada6943ba-p82-teaching',
      blocks: [{
        id: ID, type: 'question', pedagogyRole: 'investigation',
        sourcePageNumber: 82, snapshotKind: 'local', bankRef: null,
        flow: { sourcePageBreakBefore: false },
        content: {
          id: `${ID}-content`, type: 'group', label: '', layout: 'list',
          diagramPlacement: 'after-prompt', questionDiagrams: diagrams,
          prompt: {
            format: 'maths-editor-document-v1', version: 1,
            blocks: [
              ...paragraph('The starting data are 7, 8, 9, 9, 9, 10, 11. The distribution is symmetrical, and its mean, median and mode are all 9.', 1).blocks,
              ...paragraph('Use the starting data separately for parts a and b. The two contrasting plots also show their mean, median and mode; compare their positions without calculating them.', 2).blocks,
            ],
          },
          children: parts.map(([label, answerSpaceMm, prompt, short, worked], index) => ({
            id: `${ID}-${label}`, type: 'part', label,
            prompt: paragraph(prompt, index + 3), answerSpaceMm,
            answer: { short, worked },
          })),
        },
      }, {
        id: 'unrelated-question', type: 'question',
        content: { children: [{ id: `${ID}-a`, answerSpaceMm: 12 }], manualLayout: 'preserve' },
      }],
    }],
  };
}

const blockOf = (tree) => tree.sections[0].blocks[0];
function freezeTree(value) {
  if (!value || typeof value !== 'object') return value;
  for (const child of Object.values(value)) freezeTree(child);
  return Object.freeze(value);
}

test('repairs only the two one-sentence writing areas without mutating the input', () => {
  const original = fixture();
  const before = structuredClone(original);
  freezeTree(original);
  const { next, provenance } = repairRenderedInvestigation(original);
  const expected = structuredClone(before);
  blockOf(expected).content.children[0].answerSpaceMm = 8;
  blockOf(expected).content.children[1].answerSpaceMm = 8;
  assert.deepEqual(next, expected);
  assert.deepEqual(original, before);
  assert.deepEqual(blockOf(next).content.children.map((part) => part.answerSpaceMm), [8, 8, 16, 12]);
  assert.equal(provenance.savedWritingSpaceMm, 8);
  assert.equal(provenance.changes.length, 2);
  assert.equal(provenance.verificationStatus, 'requires-fresh-render');
  assert.ok(provenance.savedWritingSpaceMm > provenance.evidence.reportedFooterOverflowMm);
});

test('preserves native plots, datasets, teacher answers and the non-universal caution', () => {
  const original = fixture();
  const { next } = repairRenderedInvestigation(original);
  const before = blockOf(original).content;
  const after = blockOf(next).content;
  assert.deepEqual(after.questionDiagrams, before.questionDiagrams);
  assert.deepEqual(after.children.map((part) => part.answer), before.children.map((part) => part.answer));
  assert.deepEqual(after.children.map((part) => part.prompt), before.children.map((part) => part.prompt));
  assert.deepEqual(after.prompt, before.prompt);
});

test('reapplication is idempotent and records no additional reduction', () => {
  const first = repairRenderedInvestigation(fixture());
  const second = repairRenderedInvestigation(first.next);
  assert.deepEqual(second.next, first.next);
  assert.deepEqual(second.provenance.changes, []);
  assert.equal(second.provenance.savedWritingSpaceMm, 0);
});

test('preserves other manual edits and local pagination settings', () => {
  const original = fixture();
  blockOf(original).content.children[2].answerSpaceMm = 24;
  blockOf(original).flow.sourcePageBreakBefore = true;
  blockOf(original).content.manualOverrides = { keepTogether: true };
  const { next } = repairRenderedInvestigation(original);
  assert.equal(blockOf(next).content.children[2].answerSpaceMm, 24);
  assert.deepEqual(blockOf(next).flow, blockOf(original).flow);
  assert.deepEqual(blockOf(next).content.manualOverrides, blockOf(original).content.manualOverrides);
});

test('refuses to overwrite an unexpected target writing-space edit', () => {
  const original = fixture();
  blockOf(original).content.children[1].answerSpaceMm = 10;
  const before = structuredClone(original);
  assert.throws(() => repairRenderedInvestigation(original), /manual edit/);
  assert.deepEqual(original, before);
});

test('requires unique question and part identities', () => {
  const missing = fixture();
  missing.sections[0].blocks.shift();
  assert.throws(() => repairRenderedInvestigation(missing), /found 0/);
  const duplicate = fixture();
  duplicate.sections[0].blocks.push(structuredClone(blockOf(duplicate)));
  assert.throws(() => repairRenderedInvestigation(duplicate), /found 2/);
  const duplicatePart = fixture();
  blockOf(duplicatePart).content.children.push(structuredClone(blockOf(duplicatePart).content.children[0]));
  assert.throws(() => repairRenderedInvestigation(duplicatePart), /exactly one investigation part/);
});

test('refuses a changed layout whose writing width has not been reviewed', () => {
  const original = fixture();
  blockOf(original).content.layout = 'grid';
  assert.throws(() => repairRenderedInvestigation(original), /full-width list layout/);
});
