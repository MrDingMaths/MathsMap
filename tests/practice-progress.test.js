import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { practiceLevel, practiceSummary } from '../src/lib/practice-level.js';

test('practice reaches proficient at most, needing one Got it beyond Foundation', () => {
  assert.equal(practiceLevel({}), 'none');
  assert.equal(practiceLevel({ 'foundation-0': 'not' }), 'learning');
  const threeFoundation = { 'foundation-0': 'got', 'foundation-1': 'got', 'foundation-2': 'got' };
  assert.equal(practiceLevel(threeFoundation, { hasHigherTiers: true }), 'learning');
  assert.equal(practiceLevel(threeFoundation, { hasHigherTiers: false }), 'proficient');
  const many = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`mastery-${i}`, 'got']));
  assert.equal(practiceLevel(many, { hasHigherTiers: true }), 'proficient');
  assert.deepEqual(practiceSummary({ 'foundation-0': 'got', 'foundation-1': 'not' }), { got: 1, needed: 3, level: 'learning' });
});

test('practice writes only through the upgrade-only store call', () => {
  const source = fs.readFileSync(new URL('../src/lib/practice-progress.js', import.meta.url), 'utf8');
  assert.match(source, /upgradeMastery\(skillId, level, 'practice'\)/);
  assert.doesNotMatch(source, /setMastery|'mastered'/);
});
