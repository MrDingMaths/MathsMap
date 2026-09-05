import test from 'node:test';
import assert from 'node:assert/strict';
import { assertRepairPreservesEdits, presentationContractForRun } from '../scripts/booklet/transcription.mjs';
import { normaliseQuestion } from '../src/lib/practice-question-model.js';

test('diagram source provenance survives question normalization', () => {
  const question = normaliseQuestion({ id: 'q', content: { id: 'q-content', questionDiagrams: [{ id: 'd', format: 'tikz', code: 'code', sourceAssetOccurrenceId: 'source-1' }], answer: { short: '1' } } });
  assert.equal(question.content.questionDiagrams[0].sourceAssetOccurrenceId, 'source-1');
});

test('repairs protect edited descendants and ancestors but allow unrelated targets', () => {
  const transcription = { pages: [{ id: 'page-1', blocks: [{ id: 'question', children: [{ id: 'part' }] }, { id: 'other' }] }] };
  const review = { contentOverrides: { part: { '/prompt': { value: 'My correction' } } } };
  assert.throws(() => assertRepairPreservesEdits(transcription, review, ['question']), /overlaps saved edit part/);
  assert.throws(() => assertRepairPreservesEdits(transcription, review, ['part']), /overlaps saved edit part/);
  assert.doesNotThrow(() => assertRepairPreservesEdits(transcription, review, ['other']));
  assert.throws(() => assertRepairPreservesEdits(transcription, { contentOverrides: { question: { '/children': {} } } }, ['part']), /overlaps saved edit question/);
});

test('new presentation contract is opt-in through immutable run pins', () => {
  assert.equal(presentationContractForRun({ pins: { files: {} } }), '');
  const contract = presentationContractForRun({ pins: { files: { 'scripts/booklet/prompts/source-presentation-v1.md': 'hash' } } });
  for (const token of ['responseSpace', 'sourceAssetOccurrenceId', 'headingStyle', 'numberSteps', 'original question order']) assert.ok(contract.includes(token));
});
