export const LABEL_FADE_MIN = 0.32;
export const LABEL_FADE_MAX = 0.6;
export const LABEL_MEDIUM_CAP = 250;
export const LAYOUT_CACHE_LIMIT = 6;
export const WHEEL_LINE_PX = 36;
export const WHEEL_PAGE_PX = 800;
export const WHEEL_MAX_STEP_PX = 240;
export const WHEEL_ZOOM_RATE = 0.0022;
export const WHEEL_PINCH_MULTIPLIER = 3;
export const MIN_ZOOM_FLOOR = 0.03;
export const MIN_ZOOM_CEIL = 0.25;
export const MAX_ZOOM_DEFAULT = 3;

const geometryCache = new Map();

export function mapGeometryKey({ mode, courseIds = [], topicIds = null, crossOnly = false }) {
  const courses = [...courseIds].sort().join(',');
  const topics = topicIds == null ? '*' : [...topicIds].sort().join(',');
  return `v2|${mode}|${courses}|${topics}|${crossOnly ? 1 : 0}`;
}

export function getCachedGeometry(key) {
  const value = geometryCache.get(key);
  if (!value) return null;
  geometryCache.delete(key);
  geometryCache.set(key, value);
  return value;
}

export function setCachedGeometry(key, value) {
  geometryCache.delete(key);
  geometryCache.set(key, value);
  while (geometryCache.size > LAYOUT_CACHE_LIMIT) {
    geometryCache.delete(geometryCache.keys().next().value);
  }
}

export function clearGeometryCache() {
  geometryCache.clear();
}

export function geometryCacheKeys() {
  return [...geometryCache.keys()];
}

export function labelFade(zoom) {
  return Math.max(0, Math.min(1, (zoom - LABEL_FADE_MIN) / (LABEL_FADE_MAX - LABEL_FADE_MIN)));
}

export function normalizeWheelDelta({
  deltaY = 0,
  deltaMode = 0,
  ctrlKey = false,
  pageHeight = WHEEL_PAGE_PX,
  maxStepPx = WHEEL_MAX_STEP_PX
} = {}) {
  if (!Number.isFinite(deltaY) || deltaY === 0) return 0;
  const unitPx =
    deltaMode === 1
      ? WHEEL_LINE_PX
      : deltaMode === 2
        ? Number.isFinite(pageHeight) && pageHeight > 0
          ? pageHeight
          : WHEEL_PAGE_PX
        : 1;
  const scaled = deltaY * unitPx * (ctrlKey ? WHEEL_PINCH_MULTIPLIER : 1);
  return Math.max(-maxStepPx, Math.min(maxStepPx, scaled));
}

export function wheelZoomFactor(event, rate = WHEEL_ZOOM_RATE) {
  const px = normalizeWheelDelta(event);
  if (px === 0) return 1;
  return Math.pow(2, -px * rate);
}

export function boundsFromBands(bands) {
  const lanes = bands?.lanes || [];
  const rows = bands?.rows || [];
  if (!lanes.length || !rows.length) return null;
  return {
    x1: lanes[0].xLeft - 40,
    y1: rows[0].yTop - 20,
    x2: lanes[lanes.length - 1].xRight + 40,
    y2: rows[rows.length - 1].yBottom + 60
  };
}

export function computeZoomBounds(
  bounds,
  viewportWidth,
  viewportHeight,
  {
    padding = 30,
    minFloor = MIN_ZOOM_FLOOR,
    minCeil = MIN_ZOOM_CEIL,
    maxZoom = MAX_ZOOM_DEFAULT
  } = {}
) {
  if (!bounds || !(viewportWidth > 0) || !(viewportHeight > 0)) {
    return { minZoom: 0.1, maxZoom };
  }
  const bw = Math.max(1, bounds.x2 - bounds.x1);
  const bh = Math.max(1, bounds.y2 - bounds.y1);
  const availW = Math.max(1, viewportWidth - 2 * padding);
  const availH = Math.max(1, viewportHeight - 2 * padding);
  const fitZoom = Math.min(availW / bw, availH / bh);
  const minZoom = Math.max(minFloor, Math.min(minCeil, fitZoom * 0.75));
  return { minZoom, maxZoom };
}

export function clampPanToBounds(
  pan,
  zoom,
  bounds,
  viewportWidth,
  viewportHeight,
  marginPx = 160
) {
  if (!bounds || !(viewportWidth > 0) || !(viewportHeight > 0) || !(zoom > 0)) {
    return pan;
  }
  const marginX = Math.min(marginPx, viewportWidth * 0.35);
  const marginY = Math.min(marginPx, viewportHeight * 0.35);
  const minPanX = marginX - bounds.x2 * zoom;
  const maxPanX = viewportWidth - marginX - bounds.x1 * zoom;
  const minPanY = marginY - bounds.y2 * zoom;
  const maxPanY = viewportHeight - marginY - bounds.y1 * zoom;
  return {
    x: Math.max(minPanX, Math.min(maxPanX, pan.x)),
    y: Math.max(minPanY, Math.min(maxPanY, pan.y))
  };
}

function inExtent(label, extent, padding) {
  return (
    label.x >= extent.x1 - padding &&
    label.x <= extent.x2 + padding &&
    label.y >= extent.y1 - padding &&
    label.y <= extent.y2 + padding
  );
}

export function selectVisibleLabels(
  records,
  { zoom, extent, focusedIds = new Set(), paddingPx = 160, mediumCap = LABEL_MEDIUM_CAP }
) {
  const padding = paddingPx / Math.max(zoom, 0.01);
  const visible = records.filter((label) => inExtent(label, extent, padding));
  const focused = visible.filter((label) => focusedIds.has(label.id));

  if (zoom < LABEL_FADE_MIN) return focused;
  if (zoom >= LABEL_FADE_MAX) return visible;

  const focusedSet = new Set(focused.map((label) => label.id));
  const ordinary = visible
    .filter((label) => !focusedSet.has(label.id))
    .sort((a, b) => {
      const priority = (b.priority || 0) - (a.priority || 0);
      return priority || a.id.localeCompare(b.id);
    })
    .slice(0, mediumCap);
  return [...focused, ...ordinary];
}

export function diffSets(previous = new Set(), next = new Set()) {
  return {
    added: new Set([...next].filter((value) => !previous.has(value))),
    removed: new Set([...previous].filter((value) => !next.has(value)))
  };
}
