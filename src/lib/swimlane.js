// Strand swimlanes for the Map view. Cytoscape has no native swimlanes, so we lay
// the whole graph out ourselves: strands become columns (as before), and within a
// column nodes are split into course bands stacked top→bottom in course order, so
// a later course (e.g. Year 11 Advanced) always sits below an earlier one (e.g.
// Stage 5 Core). Unlike a per-cell dagre pass, ranks (row-within-band depth) are
// computed **once per band, across all strands in that band** — a topo sort +
// ASAP longest-path + pull-down over every intra-band prerequisite edge, whichever
// strand its endpoints live in. That's what makes a topic and its prerequisite in
// a different strand land on different rows instead of the same flat one: prereq
// depth is now a band-wide property, not a per-cell one. Flow runs downward so the
// long prerequisite-depth axis uses the (scrollable) vertical dimension and the
// strands span the wide axis.
import { STRANDS } from './data.js';

// Shared with graph.js's routeEdges(), which needs to know the gutter height
// between rank rows to place taxi turns inside it. Keep in sync with the default
// passed to layoutSwimlanes() below.
export const RANK_SEP = 200;

// Approximate rendered width of a node's label chip, so same-row neighbours can be
// spaced far enough apart that chips never overlap. Must stay in sync with the
// .node-label CSS in Map.svelte: max-width 150px, width: max-content, padding
// 4px 8px (16px horizontal), 15px system font (~7.2px per character on average).
const CHIP_MAX_TEXT = 150;
const CHIP_PAD = 16;
const CHIP_PX_PER_CHAR = 7.2;
export function estimateChipWidth(text) {
  const len = (text || '').length;
  return Math.min(CHIP_MAX_TEXT, Math.ceil(len * CHIP_PX_PER_CHAR)) + CHIP_PAD;
}

// Subtle background tints + label colour per strand, for dark and light themes.
const BAND_STYLE = {
  dark: {
    'Number & Algebra':      { fill: 'rgba(56, 189, 248, 0.075)',  text: 'rgba(164, 213, 240, 0.86)' },
    'Measurement & Space':   { fill: 'rgba(168, 247, 148, 0.075)', text: 'rgba(184, 224, 166, 0.86)' },
    'Statistics & Probability': { fill: 'rgba(244, 159, 11, 0.075)', text: 'rgba(235, 197, 146, 0.86)' },
    'Functions & Calculus':  { fill: 'rgba(147, 51, 234, 0.08)',  text: 'rgba(207, 180, 240, 0.86)' }
  },
  light: {
    'Number & Algebra':      { fill: 'rgba(2, 132, 199, 0.09)',   text: 'rgba(2, 92, 148, 0.88)' },
    'Measurement & Space':   { fill: 'rgba(22, 163, 74, 0.09)',   text: 'rgba(18, 108, 46, 0.88)' },
    'Statistics & Probability': { fill: 'rgba(217, 119, 6, 0.09)', text: 'rgba(145, 72, 0, 0.88)' },
    'Functions & Calculus':  { fill: 'rgba(147, 51, 234, 0.09)',  text: 'rgba(99, 42, 156, 0.88)' }
  }
};
const DEFAULT_STYLE = {
  dark:  { fill: 'rgba(148, 163, 184, 0.05)', text: 'rgba(148, 163, 184, 0.7)' },
  light: { fill: 'rgba(100, 116, 139, 0.07)', text: 'rgba(60, 80, 110, 0.75)' }
};

// Kahn's algorithm over a small DAG: `nodeIds` is the full node set, `edges` is
// [[predId, succId], ...]. Ties broken by id so the order — and everything ranked
// from it — is deterministic across renders. If a cycle survives (shouldn't
// happen: topicGraph.js already drops later→earlier-stage edges, but this is the
// defensive fallback the plan calls for), the nodes involved never reach indegree
// 0 and are appended in id order at the end; their still-dangling incoming edges
// are then dropped by edgesWithoutBackEdges() below so rank/pull-down never sees
// a back-edge.
function topoSortWithFallback(nodeIds, edges) {
  const idSet = new Set(nodeIds);
  const succ = new Map(nodeIds.map((id) => [id, []]));
  const indeg = new Map(nodeIds.map((id) => [id, 0]));
  for (const [p, s] of edges) {
    if (!idSet.has(p) || !idSet.has(s) || p === s) continue;
    succ.get(p).push(s);
    indeg.set(s, (indeg.get(s) || 0) + 1);
  }
  let queue = nodeIds.filter((id) => indeg.get(id) === 0).sort();
  const order = [];
  const seen = new Set();
  while (queue.length) {
    queue.sort();
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    for (const s of succ.get(id) || []) {
      indeg.set(s, indeg.get(s) - 1);
      if (indeg.get(s) === 0) queue.push(s);
    }
  }
  if (order.length < nodeIds.length) {
    for (const id of nodeIds) if (!seen.has(id)) order.push(id);
  }
  return order;
}

// Drops any edge that doesn't flow forward through the topo order — i.e. back-edges
// from a surviving cycle. What's left is a clean DAG safe for ASAP ranking.
function edgesWithoutBackEdges(edges, order) {
  const pos = new Map(order.map((id, i) => [id, i]));
  return edges.filter(([p, s]) => pos.has(p) && pos.has(s) && pos.get(p) < pos.get(s));
}

// ASAP longest-path rank over the topo order (rank(n) = max(rank(pred)) + 1, roots
// at 0), then a reverse-topo **pull-down** pass: any node with successors slides
// down to min(rank(succ)) − 1 whenever that's deeper than its ASAP rank. This is
// what keeps a prereq-free topic from being stranded on the crowded top row — it
// sinks to sit just above whichever dependent needs it soonest. Nodes with no
// intra-band edges at all (no preds, no succs) simply stay at rank 0. Because
// pull-down only ever increases a rank and only past the (already-ranked)
// successors' ranks, `rank(pred) < rank(succ)` stays true for every edge, which is
// what lets the caller do a single top-down sweep for x-ordering afterwards.
function computeRanks(topoOrder, pred, succ) {
  const rank = new Map();
  for (const id of topoOrder) {
    const preds = pred.get(id) || [];
    rank.set(id, preds.length ? Math.max(...preds.map((p) => rank.get(p) ?? 0)) + 1 : 0);
  }
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i];
    const succs = succ.get(id) || [];
    if (!succs.length) continue;
    const minSuccRank = Math.min(...succs.map((s) => rank.get(s)));
    if (minSuccRank - 1 > rank.get(id)) rank.set(id, minSuccRank - 1);
  }
  return rank;
}

// Ranks one band's worth of nodes (pooled across every strand present in that
// band). `edges` is [[predId, succId], ...] restricted to that band's intra-band,
// non-cross-course prerequisites. Exported so a scratch script can sanity-check
// the ranking logic in isolation from Cytoscape/DOM.
export function rankBand(nodeIds, edges) {
  const order = topoSortWithFallback(nodeIds, edges);
  const clean = edgesWithoutBackEdges(edges, order);
  const pred = new Map(nodeIds.map((id) => [id, []]));
  const succ = new Map(nodeIds.map((id) => [id, []]));
  for (const [p, s] of clean) {
    pred.get(s).push(p);
    succ.get(p).push(s);
  }
  const rank = computeRanks(order, pred, succ);
  return { order, rank, pred, succ };
}

// Lays the graph out as a strand × course-band grid: strands become columns, bands
// (course stages) become rows. Within a band, ranks are shared across every strand
// in it (see rankBand above), so a cross-strand prerequisite still flows strictly
// downward instead of landing flat. x-position within a (strand, band, rank) slot
// is a barycenter of already-placed predecessors — a single top-down sweep since
// pred rank is always strictly less than succ rank — falling back to id order when
// a node has no predecessors. Neighbour spacing within a slot is label-aware: the
// gap between two centres is driven by the wider of each node's disc and its
// estimated label chip (see estimateChipWidth), so chips never collide. Returns
// { lanes, rows } in model coords for drawBands(). Generous band gutters keep
// cross-band taxi turns off the node rows.
export function layoutSwimlanes(cy, { gap = 80, bandGap = 90, pad = 48, minSep = 40, rankSep = RANK_SEP } = {}) {
  // Bucket nodes by band alone (not band+strand) so rankBand sees the full
  // cross-strand DAG for that band.
  const bandNodes = new Map(); // band -> node ids
  const presentStrands = new Set();
  const presentBands = new Set();
  const bandLabels = new Map();
  const nodeById = new Map();
  cy.nodes().forEach((n) => {
    const strand = n.data('strand') || STRANDS[0];
    const band = n.data('band') ?? 0;
    if (!bandNodes.has(band)) bandNodes.set(band, []);
    bandNodes.get(band).push(n.id());
    presentStrands.add(strand);
    presentBands.add(band);
    if (!bandLabels.has(band)) bandLabels.set(band, n.data('bandLabel') || null);
    nodeById.set(n.id(), n);
  });

  const intraEdgesByBand = new Map();
  cy.edges().forEach((e) => {
    if (e.hasClass('cross-course')) return;
    const sourceBand = e.source().data('band') ?? 0;
    const targetBand = e.target().data('band') ?? 0;
    if (sourceBand !== targetBand) return;
    if (!intraEdgesByBand.has(sourceBand)) intraEdgesByBand.set(sourceBand, []);
    intraEdgesByBand.get(sourceBand).push([e.data('source'), e.data('target')]);
  });

  // Fixed strand order for columns, then any extras; ascending band order for rows.
  const colOrder = [...STRANDS, ...[...presentStrands].filter((s) => !STRANDS.includes(s))]
    .filter((s) => presentStrands.has(s));
  const rowOrder = [...presentBands].sort((a, b) => a - b);
  const strandIndex = new Map(colOrder.map((s, i) => [s, i]));

  // Pass A: rank + x-order every node, band by band. `groups` collects the final
  // left-to-right node-id order for every (strand, band, rank) slot.
  const groups = new Map(); // `${strand}|${band}|${rank}` -> node id[]
  const orderKey = new Map(); // node id -> sortable scalar, used as "x" for barycenter of successors

  for (const band of rowOrder) {
    const ids = bandNodes.get(band);
    // Only non-cross-course edges among this band's nodes (any strand) drive rank;
    // cross-course edges keep their bezier style and never drove layout anyway.
    const edgeList = intraEdgesByBand.get(band) || [];
    const { rank, pred } = rankBand(ids, edgeList);
    for (const id of ids) nodeById.get(id).data('_rank', rank.get(id));

    // Group by (rank, strand); process ranks ascending so every predecessor's
    // orderKey is already set (predecessors always have a strictly lower rank —
    // see computeRanks) by the time we need it for a barycenter sort.
    const byRank = new Map(); // rank -> Map(strand -> id[])
    for (const id of ids) {
      const r = rank.get(id);
      const strand = nodeById.get(id).data('strand') || STRANDS[0];
      if (!byRank.has(r)) byRank.set(r, new Map());
      if (!byRank.get(r).has(strand)) byRank.get(r).set(strand, []);
      byRank.get(r).get(strand).push(id);
    }
    const ranksAsc = [...byRank.keys()].sort((a, b) => a - b);
    for (const r of ranksAsc) {
      for (const [strand, groupIds] of byRank.get(r)) {
        const baseline = strandIndex.get(strand) * 1e6;
        const medianPredKey = (id) => {
          const keys = (pred.get(id) || [])
            .map((p) => orderKey.get(p))
            .filter((v) => v != null)
            .sort((a, b) => a - b);
          return keys.length ? keys[Math.floor((keys.length - 1) / 2)] : baseline;
        };
        groupIds.sort((a, b) => {
          const diff = medianPredKey(a) - medianPredKey(b);
          return diff !== 0 ? diff : a < b ? -1 : a > b ? 1 : 0;
        });
        groupIds.forEach((id, i) => orderKey.set(id, baseline + i));
        groups.set(`${strand}|${band}|${r}`, groupIds);
      }
    }
  }

  // Pass B: per-strand column width = widest (strand, *, rank) slot anywhere in
  // that strand; per-band row height = deepest rank reached in that band. Same
  // shape as the old per-cell bounding-box pass so drawBands() and the
  // { lanes, rows } contract are unchanged. Spacing within a slot is cumulative
  // and label-aware: each node's "effective width" is the wider of its disc and
  // its label chip, and the centre-to-centre gap between neighbours is
  // max(minSep, half of each effective width + breathing room) — a wide chip next
  // to a narrow one still gets exactly the room the pair needs, no more.
  const GAP_PAD = 16; // breathing room between two adjacent chips' edges
  const colW = new Map();
  const maxRankInBand = new Map();
  const maxNodeHeightInBand = new Map();
  const groupOffsets = new Map(); // group key -> cumulative centre-x offsets (offsets[0] = 0)
  for (const [key, ids] of groups) {
    const [strand, bandStr, rankStr] = key.split('|');
    const band = Number(bandStr);
    const rank = Number(rankStr);
    const eff = ids.map((id) => {
      const node = nodeById.get(id);
      return Math.max(node.width() || 60, estimateChipWidth(node.data('label') || node.data('name') || ''));
    });
    const heights = ids.map((id) => nodeById.get(id).height() || 60);
    const offsets = [0];
    for (let i = 1; i < ids.length; i++)
      offsets.push(offsets[i - 1] + Math.max(minSep, (eff[i - 1] + eff[i]) / 2 + GAP_PAD));
    groupOffsets.set(key, offsets);
    // Slot span includes each end's half-chip overhang so the outermost chips fit
    // inside the column too.
    const slotW = offsets[offsets.length - 1] + eff[0] / 2 + eff[eff.length - 1] / 2;
    colW.set(strand, Math.max(colW.get(strand) || 0, slotW));
    maxRankInBand.set(band, Math.max(maxRankInBand.get(band) || 0, rank));
    maxNodeHeightInBand.set(band, Math.max(maxNodeHeightInBand.get(band) || 0, Math.max(...heights)));
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
    if (!maxRankInBand.has(band)) continue;
    const h = maxRankInBand.get(band) * rankSep + (maxNodeHeightInBand.get(band) || 60);
    rowY.set(band, cyTop);
    cyTop += h + 2 * pad + bandGap;
  }

  // Pass C: place every node — column-centred x within its (strand, band, rank)
  // slot using the label-aware cumulative offsets from Pass B, row-top-anchored y
  // at bandTop + rank * rankSep.
  for (const [key, ids] of groups) {
    const [strand, bandStr, rankStr] = key.split('|');
    const band = Number(bandStr);
    const rank = Number(rankStr);
    const centerX = colX.get(strand) + pad + colW.get(strand) / 2;
    const topY = rowY.get(band) + pad + (maxNodeHeightInBand.get(band) || 60) / 2;
    const offsets = groupOffsets.get(key);
    const span = offsets[offsets.length - 1];
    ids.forEach((id, i) => {
      nodeById.get(id).position({ x: centerX + offsets[i] - span / 2, y: topY + rank * rankSep });
    });
  }

  const lanes = colOrder
    .filter((s) => colW.has(s))
    .map((strand) => ({
      strand,
      xLeft: colX.get(strand),
      xRight: colX.get(strand) + colW.get(strand) + 2 * pad
    }));
  const rows = rowOrder
    .filter((b) => maxRankInBand.has(b))
    .map((band) => ({
      band,
      label: bandLabels.get(band),
      yTop: rowY.get(band),
      yBottom: rowY.get(band) + maxRankInBand.get(band) * rankSep + (maxNodeHeightInBand.get(band) || 60) + 2 * pad
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
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
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
      // Pin the course name while any part of its band is on screen: clamp
      // between the viewport top (just below the strand labels) and the band's
      // own bottom, so scrolling inside a tall band keeps the label visible
      // instead of letting it scroll away with the band top.
      const bottom = row.yBottom * zoom + pan.y;
      if (row.label && bottom > 26 && top < h) {
        ctx.fillStyle = bandText;
        ctx.fillText(row.label, 10, Math.min(Math.max(top + 4, 26), bottom - 24));
      }
    });
  }
}
