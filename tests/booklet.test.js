import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveAnswer, estimateRecipePages, normalizeBank, normalizeQuestion, resolveRecipe, stableQuestionId, suggestResponseSpace, suggestSolutionMode, validateRecipe } from '../src/lib/booklet-model.js';
const nl = String.fromCharCode(10);
const question = (id, difficulty, solution = '$= 3$') => ({ id, prompt: 'Question ' + id, solution, difficulty, solutionMode: undefined, responseSpace: undefined });
test('stable IDs and normalization are deterministic', () => {
  assert.equal(stableQuestionId('skill', 'foundation', 0), 'skill:foundation:1');
  const normalized = normalizeQuestion({ question_text: 'Find the gradient.', solution_text: ['step', '$= 4$'].join(nl) }, { skillId: 'rates', tier: 'foundation', index: 1 });
  assert.equal(normalized.id, 'rates:foundation:2');
  assert.equal(normalized.prompt, 'Find the gradient.');
  assert.equal(normalized.answer, '$4$');
  assert.equal(suggestSolutionMode({ solution: ['a', 'b', 'c', 'd', 'e'].join(nl) }), 'worked');
  assert.equal(suggestResponseSpace({ solution: ['a', 'b', 'c'].join(nl) }), 'standard');
  assert.equal(deriveAnswer(['line', '$= 9$'].join(nl)), '$9$');
});
test('recipe selection filters by difficulty but keeps pinned essentials', () => {
  const foundationId = 'skill:foundation:1';
  const masteryId = 'skill:mastery:1';
  const bank = normalizeBank([question(foundationId, 'foundation'), question(masteryId, 'mastery', ['step', 'step', 'step', '$= 8$'].join(nl))]);
  const recipe = { id: 'r', title: 'Recipe', pinnedQuestionIds: [masteryId], sections: [
    { id: 'one', blocks: [{ type: 'questions', questionIds: [foundationId, masteryId] }] },
    { id: 'two', blocks: [{ type: 'questions', questionIds: [foundationId] }] },
  ]};
  const resolved = resolveRecipe(recipe, bank, { maxDifficulty: 'foundation' });
  assert.equal(resolved.questionCount, 3);
  assert.deepEqual(resolved.sections[0].blocks[0].questions.map((q) => q.number), ['1.1', '1.2']);
  assert.equal(resolved.sections[1].blocks[0].questions[0].number, '2.1');
  assert.equal(resolved.solutions.length, 3);
});
test('recipe reports missing IDs and estimates a positive page count', () => {
  const recipe = { id: 'r', title: 'Recipe', sections: [{ id: 'one', blocks: [{ type: 'questions', questionIds: ['missing'] }] }] };
  const resolved = resolveRecipe(recipe, new Map());
  assert.equal(resolved.questionCount, 0);
  assert.match(resolved.warnings[0], /missing/);
  assert.ok(estimateRecipePages(resolved) >= 1);
});
test('recipe validation catches malformed recipes', () => {
  assert.deepEqual(validateRecipe({ id: 'ok', title: 'OK', sections: [{ id: 's', blocks: [{ type: 'questions', questionIds: [] }] }] }), []);
  assert.ok(validateRecipe({}).length >= 2);
});
