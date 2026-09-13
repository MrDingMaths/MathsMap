import test from 'node:test';
import assert from 'node:assert/strict';
import { courseMapColour } from '../src/lib/courseColours.js';

test('map course fills stay recognisable while softening the course-key colour', () => {
  assert.equal(courseMapColour('#f59e0b', false), '#fbd699');
  assert.equal(courseMapColour('#f59e0b', true), '#906e31');
  assert.notEqual(courseMapColour('#f59e0b', false), '#f59e0b');
  assert.equal(courseMapColour('invalid', false), '#64748b');
});
