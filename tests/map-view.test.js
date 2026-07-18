import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LABEL_FADE_MAX,
  LABEL_FADE_MIN,
  LAYOUT_CACHE_LIMIT,
  clearGeometryCache,
  diffSets,
  geometryCacheKeys,
  getCachedGeometry,
  labelFade,
  mapGeometryKey,
  selectVisibleLabels,
  setCachedGeometry
} from '../src/lib/mapView.js';

test('map geometry keys are deterministic and distinguish structural filters', () => {
  const a = mapGeometryKey({ mode: 'skill', courseIds: ['s5-core', 's4'], topicIds: ['b', 'a'] });
  const b = mapGeometryKey({ mode: 'skill', courseIds: ['s4', 's5-core'], topicIds: ['a', 'b'] });
  const cross = mapGeometryKey({ mode: 'skill', courseIds: ['s4', 's5-core'], topicIds: ['a', 'b'], crossOnly: true });
  assert.equal(a, b);
  assert.notEqual(a, cross);
});

test('geometry cache is LRU bounded and refreshes a read entry', () => {
  clearGeometryCache();
  for (let i = 0; i < LAYOUT_CACHE_LIMIT; i++) setCachedGeometry(`k${i}`, { i });
  assert.deepEqual(getCachedGeometry('k0'), { i: 0 });
  setCachedGeometry('new', { i: 99 });
  assert.equal(geometryCacheKeys().length, LAYOUT_CACHE_LIMIT);
  assert.equal(getCachedGeometry('k1'), null);
  assert.deepEqual(getCachedGeometry('k0'), { i: 0 });
});

test('adaptive labels cull by viewport, preserve focus, and cap medium zoom', () => {
  const records = Array.from({ length: 300 }, (_, i) => ({
    id: `n${i}`,
    x: i,
    y: i,
    priority: i
  }));
  const extent = { x1: 0, y1: 0, x2: 300, y2: 300 };
  const focusedIds = new Set(['n0', 'n1']);

  assert.deepEqual(
    selectVisibleLabels(records, { zoom: LABEL_FADE_MIN - 0.01, extent, focusedIds, paddingPx: 0 }).map((label) => label.id),
    ['n0', 'n1']
  );
  const medium = selectVisibleLabels(records, {
    zoom: (LABEL_FADE_MIN + LABEL_FADE_MAX) / 2,
    extent,
    focusedIds,
    paddingPx: 0,
    mediumCap: 10
  });
  assert.equal(medium.length, 12);
  assert.ok(medium.some((label) => label.id === 'n299'));
  assert.equal(selectVisibleLabels(records, { zoom: LABEL_FADE_MAX, extent, paddingPx: 0 }).length, 300);
});

test('label fade and focus set differences have stable boundaries', () => {
  assert.equal(labelFade(LABEL_FADE_MIN), 0);
  assert.equal(labelFade(LABEL_FADE_MAX), 1);
  const diff = diffSets(new Set(['a', 'b']), new Set(['b', 'c']));
  assert.deepEqual([...diff.added], ['c']);
  assert.deepEqual([...diff.removed], ['a']);
});
