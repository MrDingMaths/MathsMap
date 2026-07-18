// Builds an SVG progress-ring as a data URI, baked at graph-build time and fed to
// Cytoscape via `background-image: data(ring)`. Mastery is known when the graph is
// built, so the ring is static per node — no runtime canvas drawing needed.
//
// The ring replaces the old "solid fill = mastery" node: a gray track with one or
// more coloured arcs starting at 12 o'clock. Segments are drawn in array order, so
// pass the longer arc first and the shorter on top (e.g. amber in-progress under
// green mastered) to get adjacent-looking bands.

const SIZE = 40;
const STROKE = 5;
const R = (SIZE - STROKE) / 2; // 18
const CX = SIZE / 2;
const C = 2 * Math.PI * R; // circumference
const cache = new Map();

// One stroked arc, starting at the top (rotated -90°), covering `pct` of the ring.
function arc(pct, color) {
  const len = (Math.max(0, Math.min(100, pct)) / 100) * C;
  return (
    `<circle cx="${CX}" cy="${CX}" r="${R}" fill="none" stroke="${color}" ` +
    `stroke-width="${STROKE}" stroke-linecap="round" ` +
    `stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" ` +
    `transform="rotate(-90 ${CX} ${CX})"/>`
  );
}

/**
 * @param {object}  opts
 * @param {string}  opts.track     track (unfilled) colour
 * @param {Array<{pct:number,color:string}>} [opts.segments] coloured arcs
 * @param {boolean} [opts.full]    100% mastered → solid ring + check mark
 */
export function ringSvg({ track, segments = [], full = false }) {
  const key = `${track}|${full ? 1 : 0}|${segments.map((s) => `${s.pct}:${s.color}`).join(',')}`;
  if (cache.has(key)) return cache.get(key);
  const trackCircle =
    `<circle cx="${CX}" cy="${CX}" r="${R}" fill="none" stroke="${track}" stroke-width="${STROKE}"/>`;

  let body;
  if (full) {
    const green = '#22c55e';
    const check =
      `<path d="M14 20.5 L18 24.5 L26.5 15.5" fill="none" stroke="${green}" ` +
      `stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    body =
      `<circle cx="${CX}" cy="${CX}" r="${R}" fill="none" stroke="${green}" stroke-width="${STROKE}"/>` +
      check;
  } else {
    body = trackCircle + segments.map((s) => arc(s.pct, s.color)).join('');
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" ` +
    `viewBox="0 0 ${SIZE} ${SIZE}">${body}</svg>`;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cache.set(key, uri);
  return uri;
}

// Theme-aware track colour for the unfilled portion of the ring.
export const trackColour = (isDark) => (isDark ? '#64748b' : '#c2ccd8');
