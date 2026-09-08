import { normalizeArrangement } from '../../public/libs/maths-editor/arrangement-model.mjs';
// Layout overrides are separate from content and addressed by existing target IDs.
export function normalizeBlockLayouts(raw = {}) {
  const result = {};
  for (const [id, value] of Object.entries(raw ?? {})) {
    if (!value || typeof value !== 'object') continue;
    const entry = {};
    if(value.arrangement)entry.arrangement=normalizeArrangement(value.arrangement);
    for (const [key, min, max] of [['textWidthMm', 15, 175], ['gapMm', 0, 20], ['insetMm', 0, 40], ['diagramWidthMm', 5, 190]]) {
      if (value[key] != null && Number.isFinite(Number(value[key]))) entry[key] = Math.max(min, Math.min(max, Number(value[key])));
    }
    if (['fixed', 'fit'].includes(value.diagramSizing)) entry.diagramSizing = value.diagramSizing;
    result[id] = entry;
  }
  return result;
}

export function questionLayoutStyle(node, layouts = {}) {
  const layout = layouts[node.id];
  if (!layout) return '';
  const text = layout.textWidthMm == null ? 'minmax(0,1fr)' : `minmax(0,${layout.textWidthMm}mm)`;
  const diagram = layout.textWidthMm == null ? 'minmax(0,.8fr)' : 'minmax(0,1fr)';
  const tracks = layout.textWidthMm == null ? 'minmax(0,1fr) minmax(0,.8fr)' : node.diagramPlacement === 'beside-prompt' ? `${diagram} ${text}` : `${text} ${diagram}`;
  return `--question-tracks:${tracks};--question-gap:${layout.gapMm ?? 2}mm;${layout.diagramSizing === 'fit' ? '--question-diagram-width:100%;' : layout.diagramWidthMm != null ? `--question-diagram-width:${layout.diagramWidthMm}mm;` : ''}`;
}
