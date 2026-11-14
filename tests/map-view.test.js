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
  initialViewport,
  labelFade,
  mapGeometryKey,
  normalizeWheelDelta,
  selectVisibleLabels,
  setCachedGeometry,
  wheelIntent,
  wheelPanDelta,
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

test('wheel pans like a page and only Ctrl/Cmd (or a trackpad pinch) zooms', () => {
  assert.equal(wheelIntent({}), 'pan');
  assert.equal(wheelIntent({ ctrlKey: true }), 'zoom');
  assert.equal(wheelIntent({ metaKey: true }), 'zoom');
  assert.deepEqual(wheelPanDelta({ deltaX: 0, deltaY: 100 }), { dx: 0, dy: 100 });
  assert.deepEqual(wheelPanDelta({ deltaX: -30, deltaY: 40 }), { dx: -30, dy: 40 });
  // Shift + vertical wheel scrolls sideways; line mode scales; spikes clamp.
  assert.deepEqual(wheelPanDelta({ deltaY: 3, deltaMode: 1, shiftKey: true }), { dx: 108, dy: 0 });
  assert.deepEqual(wheelPanDelta({ deltaY: 50000 }), { dx: 0, dy: WHEEL_MAX_STEP_PX });
  assert.deepEqual(wheelPanDelta({ deltaX: Number.NaN, deltaY: Number.NaN }), { dx: 0, dy: 0 });
});

test('initial view fits small maps and anchors large ones at a readable zoom', () => {
  const small = initialViewport({ x1: 0, y1: 0, x2: 800, y2: 500 }, 1440, 900);
  assert.ok(small.zoom >= 0.9 && small.zoom <= 1.1);
  const large = initialViewport({ x1: -40, y1: -20, x2: 4000, y2: 6000 }, 1440, 900, { readableZoom: 0.9 });
  assert.equal(large.zoom, 0.9);
  assert.deepEqual(large.pan, { x: 24 + 40 * 0.9, y: 24 + 20 * 0.9 });
  assert.equal(initialViewport(null, 1440, 900), null);
});

test('card layout wraps wide ranks and records node-free gutters for routing', async () => {
  const { default: cytoscape } = await import('cytoscape');
  const { layoutSwimlanes, MAX_PER_ROW, ROW_GAP } = await import('../src/lib/swimlane.js');
  const nodes = Array.from({ length: 5 }, (_, i) => ({
    data: { id: `t${i}`, strand: 'Number & Algebra', band: 1, bandLabel: 'Stage 4', w: 184, h: 40 + i * 2 },
    classes: 'card'
  }));
  const cy = cytoscape({ headless: true, styleEnabled: true, elements: [...nodes, { data: { id: 'late', strand: 'Number & Algebra', band: 1, w: 184, h: 40 }, classes: 'card' }, { data: { id: 'e', source: 't0', target: 'late' }, classes: 'layout-edge' }] });
  cy.style([{ selector: 'node.card', style: { shape: 'round-rectangle', width: 'data(w)', height: 'data(h)' } }]);
  const layout = layoutSwimlanes(cy);
  const rowOf = new Map();
  for (const node of cy.nodes()) {
    const top = Math.round(node.position('y') - node.height() / 2);
    if (!rowOf.has(top)) rowOf.set(top, []);
    rowOf.get(top).push(node.id());
  }
  const rows = [...rowOf.entries()].sort((a, b) => a[0] - b[0]).map(([, ids]) => ids);
  assert.ok(rows.every((ids) => ids.length <= MAX_PER_ROW), JSON.stringify(rows));
  assert.equal(rows.flat().length, 6);
  // Every node's lower gutter sits below its own bottom edge and above the next
  // row's cards, so a jog along it never crosses a card.
  for (const node of cy.nodes()) {
    const bottom = node.position('y') + node.height() / 2;
    assert.ok(node.data('_gBelow') > bottom, node.id());
    assert.ok(node.data('_gAbove') < node.position('y') - node.height() / 2, node.id());
  }
  const late = cy.getElementById('late');
  assert.ok(late.position('y') > cy.getElementById('t0').position('y') + ROW_GAP);
  assert.equal(layout.lanes.length, 1);
  assert.ok(layout.lanes[0].xRight - layout.lanes[0].xLeft < 4 * 184);
  cy.destroy();
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
