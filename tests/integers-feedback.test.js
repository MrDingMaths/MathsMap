import test from 'node:test';
import assert from 'node:assert/strict';
import { combinedExampleTikz, numberedTheoryRules, shortAnswerDisplay, visibleImportedQuestionTitle } from '../src/lib/booklet-preview.js';
import { setoutMathChain } from '../src/lib/inline-content.js';
import { estimateAnswerSpaceMm, normaliseQuestion } from '../src/lib/practice-question-model.js';
import { materializeReconstruction } from '../src/lib/editable-booklet-model.js';
import { applyContentOverrides, contentHash } from '../scripts/booklet/transcription.mjs';
import { numberLineLayer, repairIntegersFeedback } from '../scripts/booklet/repair-integers-v2-feedback.mjs';

function fixture() {
  const pages = [1, 29, 30, 31, 32, 33, 37, 46].map((n) => ({ id: `page-${n}`, pageNumber: n, section: { title: 'Integers' }, blocks: [] }));
  const page = (n) => pages.find((p) => p.pageNumber === n);
  page(30).blocks = [{ id: 'page-30-worked-example', type: 'worked-example', examples: [{ id: 'example', prompt: '$5+(-6)$', theorySolution: '=5-6' }] }];
  const diagrams = [1, 2].flatMap((i) => ['base', 'overlay'].map((suffix) => ({ id: `page-32-number-line-${i}-${suffix}`, format: 'tikz', code: 'old', widthMm: 72 })));
  page(32).blocks = [
    { id: 'page-32-theory', type: 'callout', content: 'Source text' },
    { id: 'page-32-worked-example', type: 'worked-example', diagrams },
    { id: 'page-32-guided-practice-content', children: [{ id: 'scaffold-a', prompt: '$2+(-3)=2\\underline{\\hspace{10mm}}3$', answerSpaceMm: 15 }] },
  ];
  page(46).blocks = [{ id: 'image', format: 'image', src: 'evidence/original.png' }];
  const transcript = { runId: 'test', pages };
  const review = { pages: pages.map((p) => ({ pageNumber: p.pageNumber, accepted: true, note: 'Keep my note' })), history: [], diagrams: {}, layoutOverrides: { answerSpaces: { 'scaffold-a': 7, unrelated: 23 }, diagramColourModes: {} }, contentOverrides: {
    [diagrams[0].id]: { '/widthMm': { beforeHash: contentHash(diagrams[0]), originalValue: 72, value: 50, note: 'My width' } },
  } };
  return { transcript, review };
}

test('pilot repair retains edits, source ordering, source assets and review notes and is idempotent', () => {
  const { transcript, review } = fixture();
  const original = structuredClone({ transcript, review });
  const result = repairIntegersFeedback(transcript, review, 'fixed-time');
  assert.deepEqual({ transcript, review }, original);
  assert.deepEqual(result.transcription.pages.map((p) => p.id), transcript.pages.map((p) => p.id));
  assert.deepEqual(result.review.layoutOverrides.answerSpaces, review.layoutOverrides.answerSpaces);
  assert.equal(result.review.layoutOverrides.diagramColourModes.image, 'grayscale');
  assert.equal(result.transcription.pages.at(-1).blocks[0].src, 'evidence/original.png');
  const effective = applyContentOverrides(result.transcription, result.review);
  assert.equal(effective.pages.find((p) => p.pageNumber === 32).blocks[1].diagrams[0].widthMm, 50);
  assert.ok(result.review.pages.every((p) => !p.accepted && p.note === 'Keep my note'));
  const repeat = repairIntegersFeedback(result.transcription, result.review);
  assert.equal(repeat.changed, false);
  assert.deepEqual(repeat.review, result.review);
});

test('repair refuses conflicting review edits instead of overwriting them', () => {
  const { transcript, review } = fixture();
  const page = transcript.pages.find((p) => p.pageNumber === 33);
  review.contentOverrides[page.id] = { '/section/title': { beforeHash: contentHash(page), value: 'My heading' } };
  assert.throws(() => repairIntegersFeedback(transcript, review), /title has a review edit/);
});

test('number-line base and solution share one TikZ coordinate frame with arches above the ticks', () => {
  const base = { id: 'base', format: 'tikz', code: numberLineLayer(-5, 1) };
  const overlay = { overlayOf: 'base', format: 'tikz', code: numberLineLayer(-5, 1, [[-2, -3], [-3, -4]]) };
  const combined = combinedExampleTikz(base, overlay);
  assert.equal((combined.match(/\\begin\{tikzpicture\}/g) ?? []).length, 1);
  assert.ok(combined.includes('(-2,.28) .. controls (-2,.92) and (-3,.92) .. (-3,.28)'));
  assert.ok(combined.includes('\\foreach'));
  assert.equal(combinedExampleTikz(base, { ...overlay, overlayOf: 'different' }), null);
  assert.equal(combinedExampleTikz(base, { ...overlay, format: 'image' }), null);
});

test('numbered theory preserves wording and subordinate bullet/equation relationships', () => {
  const rules = numberedTheoryRules('1. Touching signs:\n   - Different signs, subtract. $-5+(-3)=-5-3$\n\n2. Positive integers:\n   - Move right. $-5+3=2$');
  assert.deepEqual(rules[0], { number: '1', text: 'Touching signs:', bullets: [{ text: 'Different signs, subtract.', maths: '$-5+(-3)=-5-3$' }] });
  assert.equal(rules[1].number, '2');
  assert.equal(numberedTheoryRules('Ordinary text\n- a bullet'), null);
});

test('scaffold response policy survives canonical normalization without deleting intended blanks', () => {
  const prompt = '$2+(-3)=2\\underline{\\hspace{10mm}}3$';
  const question = normaliseQuestion({ content: { prompt, responseSpace: 'scaffold', answerSpaceMm: 15 } });
  assert.equal(question.content.prompt, prompt);
  assert.equal(question.content.responseSpace, 'scaffold');
  assert.equal(estimateAnswerSpaceMm(question.content), 0);
  assert.equal(estimateAnswerSpaceMm({ answerSpaceMm: 15 }), 15);
});

test('repeated exam label is suppressed only at a complete prompt prefix', () => {
  assert.equal(visibleImportedQuestionTitle({ title: 'NAPLAN C', content: { prompt: '**NAPLAN C**\nCalculate.' } }), '');
  assert.equal(visibleImportedQuestionTitle({ title: 'NAPLAN C', content: { prompt: 'NAPLAN C: Calculate.' } }), '');
  assert.equal(visibleImportedQuestionTitle({ title: 'NAPLAN C', content: { prompt: 'NAPLAN Challenge' } }), 'NAPLAN C');
});

test('difficulty heading and example presentation survive materialization into an editable booklet', () => {
  const raw = { pages: [{ id: 'p31', pageNumber: 31, section: { title: 'Foundation', headingStyle: 'difficulty' }, blocks: [{ id: 'example', type: 'worked-example', presentation: { layout: 'columns', columns: 3, numberSteps: false } }] }] };
  const project = materializeReconstruction(raw);
  assert.equal(project.sections[0].headingStyle, 'difficulty');
  assert.deepEqual(project.sections[0].blocks[0].presentation, raw.pages[0].blocks[0].presentation);
});

test('legacy numeric TeX answers render without changing stored prose or currency', () => {
  assert.equal(shortAnswerDisplay('-269^\\circ\\text{C}'), '$-269^\\circ\\text{C}$');
  assert.equal(shortAnswerDisplay('The answer is $2$.'), 'The answer is $2$.');
  assert.equal(shortAnswerDisplay('\\$70'), '\\$70');
});

test('compact worked keys stack each equality without changing default setout', () => {
  const source = '$-5+(-3)=-5-3=-8$';
  assert.equal(setoutMathChain(source, { stackFirstTerm: true }), '$-5+(-3)$\n$=-5-3$\n$=-8$');
  assert.equal(setoutMathChain(source), '$-5+(-3)=-5-3$\n$=-8$');
  assert.equal(setoutMathChain('Explain $x=2$.', { stackFirstTerm: true }), 'Explain $x=2$.');
});
