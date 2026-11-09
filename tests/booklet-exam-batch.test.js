import test from 'node:test';
import assert from 'node:assert/strict';
import {screenStatus, buildScreen, withExamSection, nativeContent, PER_ARCHETYPE, PROMPT_TABLE_MAX_MM} from '../pedagogy/exam-batch.mjs';
import {examQuestionGapMm, EXAM_QUESTION_GAP_MM} from '../src/lib/booklet-section-options.js';

test('batch screen keeps every row in the closure format with the whitelist statuses', () => {
  assert.equal(PER_ARCHETYPE, 2);
  assert.equal(screenStatus({source: 'CAIE.0580.12.2023.Mar Q19', difficulty: 'Development'}), 'excluded-provider');
  assert.equal(screenStatus({source: 'HSC.ADV.2011 Q2', difficulty: 'Foundation'}), 'excluded-difficulty');
  assert.equal(screenStatus({source: 'HSC.ADV.2011 Q2', difficulty: 'Development'}), 'allowed-label-ready');
  const screen = buildScreen({id: 'p', revision: 3}, [{id: '1', source: 'HSC.ADV.2011 Q2', difficulty: 'Mastery'}, {id: '1', source: 'HSC.ADV.2011 Q2', difficulty: 'Mastery'}, {id: '2', source: 'MB.1', difficulty: 'Mastery'}]);
  assert.deepEqual(screen.questionReferences.map(r => [r.id, r.status, r.key]), [['1', 'allowed-label-ready', 'HSC.ADV.2011 Q2'], ['2', 'excluded-provider', 'MB.1']]);
  assert.equal(screen.projectId, 'p');
});

test('Exam section goes before an end Challenge section and its topic', () => {
  const project = {sections: [{id: 'a', topicId: 't1'}, {id: 'c', topicId: 'challenge', role: 'challenge'}], topics: [{id: 't1'}, {id: 'challenge'}, {id: 'front-matter'}]};
  const next = withExamSection(project, {id: 'p-exam-questions', topicId: 'p-exam-questions', role: 'exam'});
  assert.deepEqual(next.sections.map(s => s.id), ['a', 'p-exam-questions', 'c']);
  assert.deepEqual(next.topics.map(t => t.id), ['t1', 'p-exam-questions', 'challenge', 'front-matter']);
  const plain = withExamSection({sections: [{id: 'a'}], topics: []}, {id: 'x', topicId: 'x'});
  assert.deepEqual(plain.sections.map(s => s.id), ['a', 'x']);
});

test('native content has no working space and labelled parts', () => {
  const single = nativeContent('q', {prompt: 'Find $x$.', answer: {short: '$3$', worked: '$x=3$'}});
  assert.equal(single.answerSpaceMm, 0);
  assert.equal(single.answer.short, '$3$');
  const parts = nativeContent('q', {prompt: 'Stem', children: [{label: 'a', prompt: 'One', answer: {short: '1', worked: '1'}}, {prompt: 'Two', answer: {short: '2', worked: '2'}}]});
  assert.deepEqual(parts.children.map(c => [c.id, c.label]), [['q-a', 'a'], ['q-b', 'b']]);
});

test('tab rows in an Exam prompt print as a bordered table with centred cells', () => {
  const q = nativeContent('q', {prompt: 'The table shows the results.\n\tTest 1\tTest 2\nMean\t60\t58\nSD\t6.2\t6.0\nFind $z$.', answer: {short: '1', worked: '1'}});
  const table = q.prompt.blocks.find(b => b.type === 'table');
  assert.equal(table.border, true);
  assert.equal(table.padding, 1);
  assert.equal(table.widthMm, table.widths.reduce((a, b) => a + b, 0));
  assert.ok(table.rows.flat().every(c => c.align === 'center' && c.blocks.every(b => b.align === 'center')));
});

test('a prompt table column is never narrower than its maths, counting \\quad spacing', () => {
  const q = nativeContent('q', {prompt: 'Stem\tLeaf\n$4$\t$0\\quad8\\quad9$', answer: {short: '1', worked: '1'}});
  const table = q.prompt.blocks.find(b => b.type === 'table');
  assert.ok(table.widths[1] >= 2 * 7 + 5, `leaf column ${table.widths[1]} mm`);
  assert.equal(table.widthMm, table.widths.reduce((a, b) => a + b, 0));
});

test('a wide prompt table fits the text column by narrowing wrappable columns only', () => {
  const q = nativeContent('q', {prompt: 'Month\tPrincipal at the start of the month\tInterest charged this month\tMonthly repayment made\tBalance owing at the end of the month\n1\t$300 000\t$1800\t$2160\t$299 640', answer: {short: '1', worked: '1'}});
  const table = q.prompt.blocks.find(b => b.type === 'table');
  assert.ok(table.widthMm <= PROMPT_TABLE_MAX_MM, `${table.widthMm} mm`);
  assert.ok(table.widths[0] >= 2 * 'Month'.length + 5, `Month column ${table.widths[0]} mm`);
});

test('Exam questions after the first on a page get the 10 mm gap', () => {
  const blocks = [{id: 'h', type: 'rich-text'}, {id: 'q1', type: 'question'}, {id: 'q2', type: 'question'}];
  assert.equal(EXAM_QUESTION_GAP_MM, 10);
  assert.equal(examQuestionGapMm({role: 'exam'}, blocks, blocks[1]), 0);
  assert.equal(examQuestionGapMm({role: 'exam'}, blocks, blocks[2]), 10);
  // Challenge questions get the same gap (James, 9 November 2026); a teaching section tagged challenge does not.
  assert.equal(examQuestionGapMm({role: 'challenge', phase: 'practice'}, blocks, blocks[2]), 10);
  assert.equal(examQuestionGapMm({role: 'challenge', phase: 'practice'}, blocks, blocks[1]), 0);
  assert.equal(examQuestionGapMm({role: 'challenge', phase: 'teaching'}, blocks, blocks[2]), 0);
  assert.equal(examQuestionGapMm({role: 'practice', phase: 'practice'}, blocks, blocks[2]), 0);
});

test('a maths cell is sized for KaTeX spacing round relations, so P(X = x) fits its column', () => {
  const q = nativeContent('q', {prompt: '$x$\t$0$\t$1$\n$P(X=x)$\t$0.2$\t$1-8m$', answer: {short: '1', worked: '1'}});
  const table = q.prompt.blocks.find(b => b.type === 'table');
  assert.ok(table.widths[0] >= 20, `P(X = x) column ${table.widths[0]} mm`);
  assert.ok(table.widths[2] >= 16, `1 - 8m column ${table.widths[2]} mm`);
});
