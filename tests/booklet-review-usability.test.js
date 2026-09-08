import test from 'node:test';
import assert from 'node:assert/strict';
import { presentationContractForRun } from '../scripts/booklet/transcription.mjs';
import { normaliseQuestion } from '../src/lib/practice-question-model.js';

test('diagram source provenance survives question normalization', () => {
  const question = normaliseQuestion({ id: 'q', content: { id: 'q-content', questionDiagrams: [{ id: 'd', format: 'tikz', code: 'code', sourceAssetOccurrenceId: 'source-1' }], answer: { short: '1' } } });
  assert.equal(question.content.questionDiagrams[0].sourceAssetOccurrenceId, 'source-1');
});


test('new presentation contract is opt-in through immutable run pins', () => {
  assert.equal(presentationContractForRun({ pins: { files: {} } }), '');
  const contract = presentationContractForRun({ pins: { files: { 'scripts/booklet/prompts/source-presentation-v1.md': 'hash' } } });
  for (const token of ['responseSpace', 'sourceAssetOccurrenceId', 'headingStyle', 'numberSteps', 'original question order']) assert.ok(contract.includes(token));
});
