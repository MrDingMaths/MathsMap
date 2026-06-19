// Strand swimlanes for the Map view. Cytoscape has no native swimlanes, so we
// lay out each strand independently with its own dagre pass (top→down prereq
// flow), then stack those layouts side by side into vertical lanes. Laying each
// strand out on its own — rather than running one global dagre and pulling
// strands apart — is what gives a lane a meaningful internal order instead of
// leftover scatter. Flow runs downward so the long prerequisite-depth axis uses
// the (scrollable) vertical dimension and the 3 strands span the wide axis.
import { STRANDS } from './data.js';

// Subtle background tints + label colour per strand, for dark and light themes.
const BAND_STYLE = {
  dark: {
    'Number & Algebra':      { fill: 'rgba(56, 189, 248, 0.05)',  text: 'rgba(148, 196, 224, 0.7)' },
    'Measurement & Space':   { fill: 'rgba(168, 247, 148, 0.05)', text: 'rgba(170, 210, 150, 0.7)' },
    'Statistics & Probability': { fill: 'rgba(244, 159, 11, 0.05)', text: 'rgba(220, 180, 130, 0.7)' }
  },
  light: {
    'Number & Algebra':      { fill: 'rgba(2, 132, 199, 0.07)',   text: 'rgba(2, 100, 160, 0.75)' },
    'Measurement & Space':   { fill: 'rgba(22, 163, 74, 0.07)',   text: 'rgba(20, 120, 50, 0.75)' },
    'Statistics & Probability': { fill: 'rgba(217, 119, 6, 0.07)', text: 'rgba(160, 80, 0, 0.75)' }
  }
};
const DEFAULT_STYLE = {
  dark:  { fill: 'rgba(148, 163, 184, 0.05)', text: 'rgba(148, 163, 184, 0.7)' },
  light: { fill: 'rgba(100, 116, 139, 0.07)', text: 'rgba(60, 80, 110, 0.75)' }
};

// Lays out each strand on its own and stacks the results side by side into lanes.
// Returns the lane geometry (model coords) for drawBands(). Replaces a single
// global layout.
export function layoutSwimlanes(cy, { gap = 80, pad = 48, nodeSep = 95, rankSep = 150 } = {}) {
  const byStrand = new Map();
  cy.nodes().forEach((n) => {
    const strand = n.data('strand') || STRANDS[0];
    if (!byStrand.has(strand)) byStrand.set(strand, cy.collection());
    byStrand.set(strand, byStrand.get(strand).union(n));
  });

  // Fixed strand order, but only emit lanes that actually have nodes.
  const order = [...STRANDS, ...[...byStrand.keys()].filter((s) => !STRANDS.includes(s))];

  const lanes = [];
  let cursorX = 0;
  for (const strand of order) {
    const nodes = byStrand.get(strand);
    if (!nodes || nodes.length === 0) continue;

    // Lay out just this strand (its nodes + the edges among them) top→down.
    // Cross-strand edges are excluded from the layout but still drawn between lanes.
    const intra = nodes.edgesWith(nodes);
    nodes
      .union(intra)
      .layout({ name: 'dagre', rankDir: 'TB', nodeSep, rankSep, edgeSep: 20, fit: false, animate: false })
      .run();

    // Translate this strand: top edges aligned at y = pad, left at cursorX + pad.
    const bb = nodes.boundingBox();
    const dy = pad - bb.y1;
    const laneLeft = cursorX;
    const dx = laneLeft + pad - bb.x1;
    nodes.positions((n) => ({ x: n.position('x') + dx, y: n.position('y') + dy }));

    const laneWidth = bb.w + 2 * pad;
    lanes.push({ strand, xLeft: laneLeft, xRight: laneLeft + laneWidth });
    cursorX = laneLeft + laneWidth + gap;
  }

  cy.fit(undefined, 30);
  return lanes;
}

// Bezier links attach to node centres, so several edges into/out of one node
// converge to a single point. Run this once after layout (positions known) to
// fan them out: distribute each node's outgoing edges across its bottom face and
// incoming edges across its top face, sorted by the other end's X so the stubs
// don't cross.
export function fanEdges(cy, { fanSpread = 28 } = {}) {
  cy.nodes().forEach((n) => {
    const fan = (edges, towardX, setter) => {
      if (edges.length === 0) return;
      edges.sort((a, b) => towardX(a) - towardX(b));
      edges.forEach((e, i) => {
        const frac = edges.length === 1 ? 0 : i / (edges.length - 1) - 0.5;
        e.style(setter, `${Math.round(frac * fanSpread)} 0`);
      });
    };
    fan(n.outgoers('edge').toArray(), (e) => e.target().position('x'), 'source-endpoint');
    fan(n.incomers('edge').toArray(), (e) => e.source().position('x'), 'target-endpoint');
  });
}

// Paints the lane stripes + strand labels onto a <canvas> overlay sitting behind
// the Cytoscape canvas. Re-invoke on every pan/zoom/render so lanes track the graph.
export function drawBands(cy, canvas, lanes, isDark = true) {
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
  // the graph backdrop as well as the lane stripes.
  ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
  ctx.fillRect(0, 0, w, h);
  if (!lanes || lanes.length === 0) return;

  const palette = isDark ? BAND_STYLE.dark : BAND_STYLE.light;
  const defaultStyle = isDark ? DEFAULT_STYLE.dark : DEFAULT_STYLE.light;
  const zoom = cy.zoom();
  const pan = cy.pan();
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  for (const lane of lanes) {
    const style = palette[lane.strand] || defaultStyle;
    const left = lane.xLeft * zoom + pan.x;
    const right = lane.xRight * zoom + pan.x;

    ctx.fillStyle = style.fill;
    ctx.fillRect(left, 0, right - left, h);

    // Skip labels for lanes scrolled entirely out of view, and keep each label
    // pinned within its own lane's visible span so it never drifts to a neighbour.
    if (right < 8 || left > w - 8) continue;
    const textW = ctx.measureText(lane.strand).width;
    const labelX = Math.min(Math.max(left + 10, 8), right - textW - 10);
    if (labelX < left || labelX + textW > right) continue;

    ctx.fillStyle = style.text;
    ctx.fillText(lane.strand, labelX, 8);
  }
}
