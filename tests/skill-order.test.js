import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { topoSortSkills } from '../src/lib/skillOrder.js';

const ids = (group) => group.map((s) => s.id);
const indexOf = (list) => new Map(list.map((s, i) => [s.id, i]));

test('a prerequisite is ordered before the skill that needs it', () => {
  const group = [
    { id: 'area-of-circle', difficulty: 2, prereqs: ['halve-diameter-for-radius'] },
    { id: 'halve-diameter-for-radius', difficulty: 1, prereqs: ['circle-features'] }
  ];
  assert.deepEqual(ids(topoSortSkills(group, indexOf(group))), [
    'halve-diameter-for-radius',
    'area-of-circle'
  ]);
});

test('prereqs outside the group are ignored, not treated as missing edges', () => {
  const group = [
    { id: 'b', difficulty: 1, prereqs: ['not-in-this-group'] },
    { id: 'a', difficulty: 1, prereqs: [] }
  ];
  // No internal edges: pure difficulty/file-order tie-break, nothing dropped.
  assert.deepEqual(ids(topoSortSkills(group, indexOf(group))), ['b', 'a']);
});

test('unconstrained skills break ties by difficulty, then by file order', () => {
  const group = [
    { id: 'hard-early', difficulty: 3, prereqs: [] },
    { id: 'easy-late', difficulty: 1, prereqs: [] },
    { id: 'easy-later', difficulty: 1, prereqs: [] }
  ];
  assert.deepEqual(ids(topoSortSkills(group, indexOf(group))), [
    'easy-late',
    'easy-later',
    'hard-early'
  ]);
});

test('graph order wins over difficulty when the two disagree', () => {
  const group = [
    { id: 'easy-but-dependent', difficulty: 1, prereqs: ['hard-but-foundational'] },
    { id: 'hard-but-foundational', difficulty: 3, prereqs: [] }
  ];
  assert.deepEqual(ids(topoSortSkills(group, indexOf(group))), [
    'hard-but-foundational',
    'easy-but-dependent'
  ]);
});

test('a cycle appends its nodes instead of dropping them', () => {
  const group = [
    { id: 'x', difficulty: 1, prereqs: ['y'] },
    { id: 'y', difficulty: 1, prereqs: ['x'] },
    { id: 'free', difficulty: 1, prereqs: [] }
  ];
  const out = ids(topoSortSkills(group, indexOf(group)));
  assert.equal(out.length, 3);
  assert.deepEqual([...out].sort(), ['free', 'x', 'y']);
});

test('every dot point group in skills.json sorts without a prereq violation', () => {
  const url = new URL('../data/skills.json', import.meta.url);
  const skills = JSON.parse(readFileSync(url, 'utf8'));
  const fileIndex = indexOf(skills);
  const dotPointIds = [...new Set(skills.flatMap((s) => s.dotPointIds || []))];

  for (const dp of dotPointIds) {
    const group = skills.filter((s) => (s.dotPointIds || []).includes(dp));
    const sorted = topoSortSkills(group, fileIndex);
    assert.equal(sorted.length, group.length, `${dp} lost or duplicated a skill`);

    const inGroup = new Set(group.map((s) => s.id));
    const pos = new Map(sorted.map((s, i) => [s.id, i]));
    for (const s of group) {
      for (const p of s.prereqs || []) {
        if (!inGroup.has(p)) continue;
        assert.ok(pos.get(p) < pos.get(s.id), `${dp}: ${p} should precede ${s.id}`);
      }
    }
  }
});

test('the circle/sector dot point leads with its two atom skills', () => {
  const url = new URL('../data/skills.json', import.meta.url);
  const skills = JSON.parse(readFileSync(url, 'utf8'));
  const group = skills.filter((s) => (s.dotPointIds || []).includes('dp-s4-are-2'));
  const out = ids(topoSortSkills(group, indexOf(skills)));
  assert.ok(out.indexOf('halve-diameter-for-radius') < out.indexOf('area-of-circle'));
  assert.ok(out.indexOf('sector-interior-angle') < out.indexOf('area-of-sector'));
  assert.ok(out.indexOf('area-of-circle') < out.indexOf('area-of-sector'));
});
