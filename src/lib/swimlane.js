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

// Lays the graph out as a strand × course-band grid: strands become columns (as
// before), and within each column nodes are split into course bands stacked
// top→bottom in course order, so a later course (e.g. Year 11 Advanced) always sits
// below an earlier one (e.g. Stage 5 Core). Each (strand, band) cell gets its own
// dagre TB pass, so intra-cell prereq chains still flow downward. Rows align across
// columns so a band sits at the same y in every strand. Returns { lanes, rows } in
// model coords for drawBands(). Generous band gutters keep cross-band taxi turns off
// the node rows.
export function layoutSwimlanes(cy, { gap = 80, bandGap = 90, pad = 48, nodeSep = 110, rankSep = 200 } = {}) {
  // Bucket nodes into grid cells keyed by strand + band.
  const cellNodes = new Map(); // `${strand}|${band}` -> collection
  const presentStrands = new Set();
  const presentBands = new Set();
  const bandLabels = new Map(); // band -> label
  cy.nodes().forEach((n) => {
    const strand = n.data('strand') || STRANDS[0];
    const band = n.data('band') ?? 0;
    const key = `${strand}|${band}`;
    if (!cellNodes.has(key)) cellNodes.set(key, cy.collection());
    cellNodes.set(key, cellNodes.get(key).union(n));
    presentStrands.add(strand);
    presentBands.add(band);
    if (!bandLabels.has(band)) bandLabels.set(band, n.data('bandLabel') || null);
  });

  // Fixed strand order for columns, then any extras; ascending band order for rows.
  const colOrder = [...STRANDS, ...[...presentStrands].filter((s) => !STRANDS.includes(s))]
    .filter((s) => presentStrands.has(s));
  const rowOrder = [...presentBands].sort((a, b) => a - b);

  // Pass A: lay out each non-empty cell on its own; record its bounding box.
  const cells = []; // { strand, band, nodes, bb }
  for (const strand of colOrder) {
    for (const band of rowOrder) {
      const nodes = cellNodes.get(`${strand}|${band}`);
      if (!nodes || nodes.length === 0) continue;
      // Only the edges among this cell's nodes drive its layout; cross-cell edges are
      // still drawn, just not laid out.
      const intra = nodes.edgesWith(nodes);
      nodes
        .union(intra)
        .layout({ name: 'dagre', rankDir: 'TB', nodeSep, rankSep, edgeSep: 26, fit: false, animate: false })
        .run();
      cells.push({ strand, band, nodes, bb: nodes.boundingBox() });
    }
  }

  // Pass B: column widths / row heights = widest / tallest cell in that column / row.
  const colW = new Map();
  const rowH = new Map();
  for (const { strand, band, bb } of cells) {
    colW.set(strand, Math.max(colW.get(strand) || 0, bb.w));
    rowH.set(band, Math.max(rowH.get(band) || 0, bb.h));
  }
  const colX = new Map();
  let cx = 0;
  for (const strand of colOrder) {
    if (!colW.has(strand)) continue;
    colX.set(strand, cx);
    cx += colW.get(strand) + 2 * pad + gap;
  }
  const rowY = new Map();
  let cyTop = 0;
  for (const band of rowOrder) {
    if (!rowH.has(band)) continue;
    rowY.set(band, cyTop);
    cyTop += rowH.get(band) + 2 * pad + bandGap;
  }

  // Pass C: translate each cell to its grid origin (top-left at colX/rowY + pad).
  for (const { strand, band, nodes, bb } of cells) {
    const dx = colX.get(strand) + pad - bb.x1;
    const dy = rowY.get(band) + pad - bb.y1;
    nodes.positions((n) => ({ x: n.position('x') + dx, y: n.position('y') + dy }));
  }

  cy.fit(undefined, 30);

  const lanes = colOrder
    .filter((s) => colW.has(s))
    .map((strand) => ({
      strand,
      xLeft: colX.get(strand),
      xRight: colX.get(strand) + colW.get(strand) + 2 * pad
    }));
  const rows = rowOrder
    .filter((b) => rowH.has(b))
    .map((band) => ({
      band,
      label: bandLabels.get(band),
      yTop: rowY.get(band),
      yBottom: rowY.get(band) + rowH.get(band) + 2 * pad
    }));
  return { lanes, rows };
}

// Paints the strand stripes + strand labels and the horizontal course-band guides onto
// a <canvas> overlay sitting behind the Cytoscape canvas. `layout` is { lanes, rows }
// from layoutSwimlanes(). Re-invoke on every pan/zoom/render so the bands track the graph.
export function drawBands(cy, canvas, layout, isDark = true) {
  if (!canvas) return;
  const lanes = layout?.lanes || [];
  const rows = layout?.rows || [];
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
  if (lanes.length === 0) return;

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

  // Horizontal course-band guides: a faint separator above each band (except the
  // first) plus the course name pinned at the band's top-left, so the new vertical
  // stage separation reads clearly.
  if (rows.length > 1) {
    const sep = isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(100, 116, 139, 0.22)';
    const bandText = defaultStyle.text;
    ctx.font = '600 12px system-ui, sans-serif';
    rows.forEach((row, i) => {
      const top = row.yTop * zoom + pan.y;
      if (i > 0) {
        // Place the separator midway in the gutter above this band.
        const prevBottom = rows[i - 1].yBottom * zoom + pan.y;
        const y = (prevBottom + top) / 2;
        if (y > 0 && y < h) {
          ctx.strokeStyle = sep;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }
      if (row.label && top > -20 && top < h) {
        ctx.fillStyle = bandText;
        ctx.fillText(row.label, 10, Math.max(top + 4, 26));
      }
    });
  }
}
