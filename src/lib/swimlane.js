// Strand swimlanes for the Map view. Cytoscape has no native swimlanes, so we
// lay out each strand independently with its own dagre pass (left→right prereq
// flow), then stack those layouts into horizontal bands. Laying each strand out
// on its own — rather than running one global dagre and pulling strands apart —
// is what gives a band a meaningful internal order instead of leftover scatter.
import { STRANDS } from './data.js';

// Subtle background tints + label colour per strand.
const BAND_STYLE = {
  'Number & Algebra': { fill: 'rgba(56, 189, 248, 0.05)', text: 'rgba(148, 196, 224, 0.7)' },
  'Measurement & Space': { fill: 'rgba(168, 247, 148, 0.05)', text: 'rgba(170, 210, 150, 0.7)' },
  'Statistics & Probability': { fill: 'rgba(244, 159, 11, 0.05)', text: 'rgba(220, 180, 130, 0.7)' }
};
const DEFAULT_STYLE = { fill: 'rgba(148, 163, 184, 0.05)', text: 'rgba(148, 163, 184, 0.7)' };

// Lays out each strand on its own and stacks the results into bands. Returns the
// band geometry (model coords) for drawBands(). Replaces a single global layout.
export function layoutSwimlanes(cy, { gap = 60, pad = 48, nodeSep = 45, rankSep = 110 } = {}) {
  const byStrand = new Map();
  cy.nodes().forEach((n) => {
    const strand = n.data('strand') || STRANDS[0];
    if (!byStrand.has(strand)) byStrand.set(strand, cy.collection());
    byStrand.set(strand, byStrand.get(strand).union(n));
  });

  // Fixed strand order, but only emit bands that actually have nodes.
  const order = [...STRANDS, ...[...byStrand.keys()].filter((s) => !STRANDS.includes(s))];

  const bands = [];
  let cursorY = 0;
  for (const strand of order) {
    const nodes = byStrand.get(strand);
    if (!nodes || nodes.length === 0) continue;

    // Lay out just this strand (its nodes + the edges among them) left→right.
    // Cross-strand edges are excluded from the layout but still drawn between bands.
    const intra = nodes.edgesWith(nodes);
    nodes
      .union(intra)
      .layout({ name: 'dagre', rankDir: 'LR', nodeSep, rankSep, edgeSep: 20, fit: false, animate: false })
      .run();

    // Translate this strand: left edges aligned at x = 0, top at cursorY + pad.
    const bb = nodes.boundingBox();
    const dx = -bb.x1;
    const bandTop = cursorY;
    const dy = bandTop + pad - bb.y1;
    nodes.positions((n) => ({ x: n.position('x') + dx, y: n.position('y') + dy }));

    const bandHeight = bb.h + 2 * pad;
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
  const lineH = 13;
  for (const band of bands) {
    const style = BAND_STYLE[band.strand] || DEFAULT_STYLE;
    const top = band.yTop * zoom + pan.y;
    const bottom = band.yBottom * zoom + pan.y;

    ctx.fillStyle = style.fill;
    ctx.fillRect(0, top, w, bottom - top);

    // Skip labels for bands scrolled entirely out of view, and keep each label
    // pinned within its own band's visible span so they never stack up at the top.
    if (bottom < 8 || top > h - 8) continue;
    const labelY = Math.min(Math.max(top + 8, 8), bottom - lineH - 8);
    if (labelY < top || labelY + lineH > bottom) continue;

    ctx.fillStyle = style.text;
    ctx.font = `600 ${lineH}px system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(band.strand, 12, labelY);
  }
}
