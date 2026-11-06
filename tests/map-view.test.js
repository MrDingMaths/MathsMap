import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LABEL_FADE_MAX,
  LABEL_FADE_MIN,
  LAYOUT_CACHE_LIMIT,
  MAX_ZOOM_DEFAULT,
  MIN_ZOOM_CEIL,
  MIN_ZOOM_FLOOR,
  WHEEL_MAX_STEP_PX,
  boundsFromBands,
  clampPanToBounds,
  clearGeometryCache,
  computeZoomBounds,
  diffSets,
  geometryCacheKeys,
  getCachedGeometry,
  labelFade,
  mapGeometryKey,
  normalizeWheelDelta,
  selectVisibleLabels,
  setCachedGeometry,
  wheelZoomFactor
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
  assert.ok(medium.some((label) => label.id === nId(299)));
  assert.equal(selectVisibleLabels(records, { zoom: LABEL_FADE_MAX, extent, paddingPx: 0 }).length, 300);
});

function nId(index) {
  return `n${index}`;
}

test('label fade and focus set differences have stable boundaries', () => {
  assert.equal(labelFade(LABEL_FADE_MIN), 0);
  assert.equal(labelFade(LABEL_FADE_MAX), 1);
  const diff = diffSets(new Set(['a', 'b']), new Set(['b', 'c']));
  assert.deepEqual([...diff.added], ['c']);
  assert.deepEqual([...diff.removed], ['a']);
});

test('wheel zoom factor is responsive, smooth across sub-steps, and immune to tiny-delta ratcheting', () => {
  const notchIn = wheelZoomFactor({ deltaY: -100, deltaMode: 0 });
  const notchOut = wheelZoomFactor({ deltaY: 100, deltaMode: 0 });
  assert.ok(notchIn > 1.15 && notchIn < 1.2, `expected responsive zoom-in per wheel notch, got ${notchIn}`);
  assert.ok(Math.abs(notchIn * notchOut - 1) < 1e-12);

  // Interleaving tiny fractional deltas (which previously ratcheted Cytoscape's
  // stateful inaccurateScrollFactor down to 0.1 and caused 1000x zoom jumps)
  // leaves subsequent wheel notches completely unchanged.
  assert.ok(wheelZoomFactor({ deltaY: -0.1, deltaMode: 0 }) > 1);
  assert.ok(wheelZoomFactor({ deltaY: 1, deltaMode: 0 }) < 1);
  assert.equal(wheelZoomFactor({ deltaY: -100, deltaMode: 0 }), notchIn);
  assert.equal(wheelZoomFactor({ deltaY: 100, deltaMode: 0 }), notchOut);

  // Ten smooth-scroll pixel steps equal one full mouse-wheel notch.
  const subStep = wheelZoomFactor({ deltaY: -10, deltaMode: 0 });
  assert.ok(Math.abs(Math.pow(subStep, 10) - notchIn) < 1e-12);

  // Line mode, page mode, ctrl-pinch, and spike clamping.
  assert.equal(normalizeWheelDelta({ deltaY: -3, deltaMode: 1 }), -108);
  assert.equal(normalizeWheelDelta({ deltaY: 1, deltaMode: 2, pageHeight: 600 }), WHEEL_MAX_STEP_PX);
  assert.ok(wheelZoomFactor({ deltaY: -20, deltaMode: 0, ctrlKey: true }) > wheelZoomFactor({ deltaY: -20, deltaMode: 0 }));
  assert.equal(
    wheelZoomFactor({ deltaY: -50000, deltaMode: 0 }),
    wheelZoomFactor({ deltaY: -WHEEL_MAX_STEP_PX, deltaMode: 0 })
  );
  assert.equal(wheelZoomFactor({ deltaY: 0 }), 1);
  assert.equal(wheelZoomFactor({ deltaY: Number.NaN }), 1);
});

test('dynamic zoom bounds and pan clamping keep both huge and compact maps usable', () => {
  const hugeBands = {
    lanes: [{ xLeft: 0, xRight: 24000 }],
    rows: [{ yTop: 0, yBottom: 16000 }]
  };
  const hugeBounds = boundsFromBands(hugeBands);
  const hugeZoom = computeZoomBounds(hugeBounds, 1160, 828);
  assert.ok(hugeZoom.minZoom < 0.1 && hugeZoom.minZoom >= MIN_ZOOM_FLOOR);
  assert.equal(hugeZoom.maxZoom, MAX_ZOOM_DEFAULT);

  const compactBands = {
    lanes: [{ xLeft: 0, xRight: 900 }],
    rows: [{ yTop: 0, yBottom: 600 }]
  };
  const compactBounds = boundsFromBands(compactBands);
  const compactZoom = computeZoomBounds(compactBounds, 1160, 828);
  assert.equal(compactZoom.minZoom, MIN_ZOOM_CEIL);

  // Clamping prevents flinging the graph completely off-screen while keeping edges reachable.
  const farOffPan = clampPanToBounds({ x: -999999, y: 999999 }, 1, compactBounds, 1160, 828);
  assert.ok(farOffPan.x >= 160 - compactBounds.x2);
  assert.ok(farOffPan.y <= 828 - 160 - compactBounds.y1);
  const centered = { x: 200, y: 150 };
  assert.deepEqual(clampPanToBounds(centered, 0.8, compactBounds, 1160, 828), centered);
});

test('Map.svelte compiles without Svelte warnings', async () => {
  const fs = await import('node:fs');
  const { compile } = await import('svelte/compiler');
  const source = fs.readFileSync('src/views/Map.svelte', 'utf8');
  const warnings = compile(source, { filename: 'src/views/Map.svelte', generate: 'client' }).warnings;
  assert.deepEqual(
    warnings.map((warning) => ({ code: warning.code, message: warning.message })),
    []
  );
});
