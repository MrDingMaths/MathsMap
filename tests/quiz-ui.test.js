import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldCelebrateQuiz,
  uncheckedResultItems,
  visibleResultItems
} from '../src/lib/quiz-ui.js';

test('quiz celebration requires at least one correct logged answer', () => {
  assert.equal(shouldCelebrateQuiz([]), false);
  assert.equal(shouldCelebrateQuiz([{ correct: false }, { correct: false }]), false);
  assert.equal(shouldCelebrateQuiz([{ correct: false }, { correct: true }]), true);
  assert.equal(shouldCelebrateQuiz([{ correct: true, isMastery: true }]), true);
});

test('unchecked results retain reasons and preview only five items', () => {
  const items = uncheckedResultItems({
    blocked: [
      { id: 'blocked-1', blockedBy: 'prereq-1' },
      { id: 'blocked-2', blockedBy: 'prereq-2' }
    ],
    notAssessed: ['unchecked-1', 'unchecked-2', 'unchecked-3', 'unchecked-4']
  });

  assert.equal(items.length, 6);
  assert.deepEqual(items[0], { id: 'blocked-1', blockedBy: 'prereq-1', kind: 'blocked' });
  assert.deepEqual(items[2], { id: 'unchecked-1', kind: 'not-assessed' });
  assert.equal(visibleResultItems(items, false).length, 5);
  assert.equal(visibleResultItems(items, true).length, 6);
});
