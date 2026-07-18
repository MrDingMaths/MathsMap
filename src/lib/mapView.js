export const LABEL_FADE_MIN = 0.32;
export const LABEL_FADE_MAX = 0.6;
export const LABEL_MEDIUM_CAP = 250;
export const LAYOUT_CACHE_LIMIT = 6;

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
