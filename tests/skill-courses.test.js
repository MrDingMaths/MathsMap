import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (name) =>
  JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));

const skills = load('skills');
const dotpoints = load('dotpoints');
const topics = load('topics');

const topicById = new Map(topics.map((t) => [t.id, t]));
const topicForDotPoint = new Map(dotpoints.map((d) => [d.id, topicById.get(d.topicId)]));

// A skill only reaches a course listing through src/lib/data.js skillsForTopic(), which
// walks the topic's dot points and then filters on the skill's own `courses`. So a dot
// point that places a skill in a course is a promise the `courses` array has to keep.
test('a skill is listed in every course its dot points place it in', () => {
  for (const skill of skills) {
    const listed = new Set(skill.courses || []);
    for (const dp of skill.dotPointIds || []) {
      const topic = topicForDotPoint.get(dp);
      if (!topic) continue; // unresolvable ids are scripts/validate.mjs's job, not this test's
      for (const course of topic.courses || []) {
        assert.ok(
          listed.has(course),
          `${skill.id} has ${dp} (${topic.id}) but is missing course ${course}`
        );
      }
    }
  }
});

// The dual-role skills: one node doing double duty, a Stage-3 atom whose Stage-4 dot point
// is the same atom over a wider range. Deleting the Stage-4 dot point would satisfy the
// test above while quietly dropping the skill out of Stage 4, so pin the ids themselves.
const DUAL_ROLE_S3_S4 = [
  'round-decimals',
  'locate-integers-number-line',
  'equivalent-fractions',
  'perimeter-2d-shapes',
  'classify-triangles',
  'classify-quadrilaterals',
  'area-of-rectangle',
  'area-composite-figures',
  'identify-base-perpendicular-height',
  'area-of-parallelogram',
  'area-of-triangle'
];

test('the dual-role Stage-3 skills keep both their Stage-4 dot point and the s4 course', () => {
  for (const id of DUAL_ROLE_S3_S4) {
    const skill = skills.find((s) => s.id === id);
    assert.ok(skill, `${id} is missing from skills.json`);
    assert.equal(skill.stage, 3, `${id} should still be a Stage-3 skill`);
    assert.ok(
      (skill.dotPointIds || []).some((dp) => dp.startsWith('dp-s3-')),
      `${id} lost its Stage-3 dot point`
    );
    assert.ok(
      (skill.dotPointIds || []).some((dp) => dp.startsWith('dp-s4-')),
      `${id} lost its Stage-4 dot point`
    );
    assert.ok((skill.courses || []).includes('s3'), `${id} is missing course s3`);
    assert.ok((skill.courses || []).includes('s4'), `${id} is missing course s4`);
  }
});

test('sector angle belongs to Length while supporting arc length and sector area', () => {
  const sectorAngle = skills.find((skill) => skill.id === 'sector-interior-angle');
  const arcLength = skills.find((skill) => skill.id === 'arc-length-perimeter-sector');
  const sectorArea = skills.find((skill) => skill.id === 'area-of-sector');

  assert.deepEqual(sectorAngle?.dotPointIds, ['dp-s4-len-2']);
  assert.ok(arcLength?.prereqs.includes(sectorAngle.id));
  assert.ok(sectorArea?.prereqs.includes(sectorAngle.id));
});
