// Strand swimlanes for the Map view. Cytoscape has no native swimlanes, so we
// run dagre first (which fixes x = prerequisite rank) and then translate each
// strand's nodes into its own horizontal band. Translation (not rescaling)
// preserves dagre's overlap-free intra-strand layout exactly, so banding never
// introduces node overlaps while still separating the strands vertically.
import { STRANDS } from './data.js';

// Subtle background tints + label colour per strand.
const BAND_STYLE = {
  'Number & Algebra': { fill: 'rgba(56, 189, 248, 0.05)', text: 'rgba(148, 196, 224, 0.7)' },
  'Measurement & Space': { fill: 'rgba(168, 247, 148, 0.05)', text: 'rgba(170, 210, 150, 0.7)' },
  'Statistics & Probability': { fill: 'rgba(244, 159, 11, 0.05)', text: 'rgba(220, 180, 130, 0.7)' }
};
const DEFAULT_STYLE = { fill: 'rgba(148, 163, 184, 0.05)', text: 'rgba(148, 163, 184, 0.7)' };

// Repositions nodes into per-strand bands. Returns the band geometry (model
// coords) for drawBands(). Call after the dagre layout has finished.
export function applyStrandBands(cy, { gap = 40, pad = 44 } = {}) {
  const byStrand = new Map();
  cy.nodes().forEach((n) => {
    const strand = n.data('strand') || STRANDS[0];
    if (!byStrand.has(strand)) byStrand.set(strand, []);
    byStrand.get(strand).push(n);
  });

  // Keep the fixed strand order, but only emit bands that actually have nodes.
  const order = [...STRANDS, ...[...byStrand.keys()].filter((s) => !STRANDS.includes(s))];

  const bands = [];
  let cursorY = 0;
  for (const strand of order) {
    const nodes = byStrand.get(strand);
    if (!nodes || nodes.length === 0) continue;

    let minY = Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      const y = n.position('y');
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const bandTop = cursorY;
    const dy = bandTop + pad - minY; // translate so the strand starts at bandTop + pad
    for (const n of nodes) n.position('y', n.position('y') + dy);

    const bandHeight = maxY - minY + 2 * pad;
    bands.push({ strand, yTop: bandTop, yBottom: bandTop + bandHeight });
    cursorY = bandTop + bandHeight + gap;
  }

  cy.fit(undefined, 30);
  return bands;
}

// Paints the band stripes + strand labels onto a <canvas> overlay sitting behind
// the Cytoscape canvas. Re-invoke on every pan/zoom/render so bands track the graph.
export function drawBands(cy, canvas, bands) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // This canvas sits behind the (transparent) Cytoscape container, so it owns
  // the graph backdrop as well as the band stripes.
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, w, h);
  if (!bands || bands.length === 0) return;

  const zoom = cy.zoom();
  const pan = cy.pan();
  for (const band of bands) {
    const style = BAND_STYLE[band.strand] || DEFAULT_STYLE;
    const top = band.yTop * zoom + pan.y;
    const bottom = band.yBottom * zoom + pan.y;

    ctx.fillStyle = style.fill;
    ctx.fillRect(0, top, w, bottom - top);

    ctx.fillStyle = style.text;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(band.strand, 12, Math.max(top, 0) + 8);
  }
}
