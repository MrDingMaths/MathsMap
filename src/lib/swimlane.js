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
import { STRANDS } from './strands.js';
import { canvasColours } from './tokens.js';

// Shared with graph.js's routeEdges(), which needs to know the gutter height
// between rank rows to place taxi turns inside it. Keep in sync with the default
// passed to layoutSwimlanes() below.
export const RANK_SEP = 200;
// Card layout: the node-free gutter between rank rows (edge jogs run along its
// midline, staggered ±30px), and the world-space strip left of the first lane
// that holds the stage labels.
export const ROW_GAP = 64;
// Most cards side by side in one strand column; a wider rank wraps onto extra
// rows (each with its own gutter, so routing still never crosses a card).
export const MAX_PER_ROW = 3;
const COL_GAP = 16; // horizontal gap between card columns
const YEARS_BY_STAGE = { 3: 'Years 5–6', 4: 'Years 7–8', 5: 'Years 9–10', 6: 'Years 11–12' };

// Column-grid placement for card layouts. Each strand gets as many columns as
// its widest row needs; a row's cards are placed in consecutive columns,
// centred under the cards they build on (left-aligned when they build on
// nothing in that column), so prerequisite chains run straight down. Rows are
// top-aligned and every node records the gutters above and below its row.
function placeOnGrid({ groups, nodeById, predOf, colOrder, rowOrder, bandLabels, pitch, spanOf, pad, gap, bandGap, rowGap, left }) {
  const slotsByStrand = new Map();
  const rowHeight = new Map(); // `${band}|${row}` -> tallest node
  const rowsByBand = new Map();
  for (const [key, ids] of groups) {
    const [strand, bandStr, rowStr] = key.split('|');
    const band = Number(bandStr);
    const row = Number(rowStr);
    const total = ids.reduce((sum, id) => sum + spanOf(id), 0);
    if (!slotsByStrand.has(strand)) slotsByStrand.set(strand, 0);
    slotsByStrand.set(strand, Math.max(slotsByStrand.get(strand), total));
    const h = Math.max(...ids.map((id) => nodeById.get(id).height() || 40));
    rowHeight.set(`${band}|${row}`, Math.max(rowHeight.get(`${band}|${row}`) || 0, h));
    if (!rowsByBand.has(band)) rowsByBand.set(band, new Set());
    rowsByBand.get(band).add(row);
  }

  const colX = new Map();
  const colCount = new Map();
  let cx = left;
  for (const strand of colOrder) {
    if (!slotsByStrand.has(strand)) continue;
    colX.set(strand, cx);
    colCount.set(strand, slotsByStrand.get(strand));
    cx += slotsByStrand.get(strand) * pitch - COL_GAP + 2 * pad + gap;
  }

  const rowTop = new Map();
  const contentH = new Map();
  const bandRows = new Map();
  for (const band of rowOrder) {
    const rows = [...(rowsByBand.get(band) || [])].sort((a, b) => a - b);
    if (!rows.length) continue;
    let y = 0;
    rows.forEach((row, i) => {
      if (i) y += rowGap;
      rowTop.set(`${band}|${row}`, y);
      y += rowHeight.get(`${band}|${row}`);
    });
    bandRows.set(band, rows);
    contentH.set(band, y);
  }
  const bandY = new Map();
  let yCursor = 0;
  for (const band of rowOrder) {
    if (!contentH.has(band)) continue;
    bandY.set(band, yCursor);
    yCursor += contentH.get(band) + 2 * pad + bandGap;
  }

  // Place rows top-down so a card's predecessors already have columns.
  const centreCol = new Map(); // node id -> centre column (fractional for spans)
  const keys = [...groups.keys()].sort((a, b) => {
    const [, ba, ra] = a.split('|');
    const [, bb, rb] = b.split('|');
    return Number(ba) - Number(bb) || Number(ra) - Number(rb);
  });
  for (const key of keys) {
    const [strand, bandStr, rowStr] = key.split('|');
    const band = Number(bandStr);
    const row = Number(rowStr);
    const ids = groups.get(key);
    const spans = ids.map(spanOf);
    const total = spans.reduce((a, b) => a + b, 0);
    const cols = colCount.get(strand);
    // Only predecessors in the same strand column steer the position.
    const anchor = ids.flatMap((id) => (predOf.get(id) || [])
      .filter((p) => nodeById.get(p)?.data('strand') === strand && centreCol.has(p))
      .map((p) => centreCol.get(p)));
    let start = 0;
    if (anchor.length) {
      const sorted = [...anchor].sort((a, b) => a - b);
      const median = sorted[Math.floor((sorted.length - 1) / 2)];
      start = Math.round(median - (total - 1) / 2);
    }
    start = Math.max(0, Math.min(cols - total, start));
    const top = bandY.get(band) + pad + rowTop.get(`${band}|${row}`);
    const rows = bandRows.get(band);
    const isFirst = rows[0] === row;
    const isLast = rows[rows.length - 1] === row;
    const bandBottom = bandY.get(band) + contentH.get(band) + 2 * pad;
    const gAbove = isFirst ? bandY.get(band) - bandGap / 2 : top - rowGap / 2;
    const gBelow = isLast ? bandBottom + bandGap / 2 : top + rowHeight.get(`${band}|${row}`) + rowGap / 2;
    let col = start;
    ids.forEach((id, i) => {
      const node = nodeById.get(id);
      const span = spans[i];
      const centre = col + (span - 1) / 2;
      centreCol.set(id, centre);
      const x = colX.get(strand) + pad + centre * pitch + (pitch - COL_GAP) / 2;
      node.position({ x, y: top + (node.height() || 40) / 2 });
      node.data('_gAbove', gAbove);
      node.data('_gBelow', gBelow);
      col += span;
    });
  }

  const lanes = colOrder
    .filter((s) => colX.has(s))
    .map((strand) => ({
      strand,
      xLeft: colX.get(strand),
      xRight: colX.get(strand) + colCount.get(strand) * pitch - COL_GAP + 2 * pad
    }));
  const rows = rowOrder
    .filter((b) => contentH.has(b))
    .map((band) => {
      const count = [...groups.entries()].filter(([key]) => Number(key.split('|')[1]) === band).reduce((n, [, ids]) => n + ids.length, 0);
      const anyId = [...groups.entries()].find(([key]) => Number(key.split('|')[1]) === band)?.[1]?.[0];
      return {
        band,
        label: bandLabels.get(band),
        stage: anyId ? nodeById.get(anyId).data('stage') ?? null : null,
        count,
        yTop: bandY.get(band),
        yBottom: bandY.get(band) + contentH.get(band) + 2 * pad
      };
    });
  return { lanes, rows, labelGutter: left };
}
export const LABEL_GUTTER = 210;

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
// Same blue / green / amber / purple as before, as soft panels; heading text
// matches the --strand-* tokens in app.css.
const BAND_STYLE = {
  dark: {
    'Number & Algebra':      { fill: 'rgba(56, 189, 248, 0.07)',  text: '#7dd3fc' },
    'Measurement & Space':   { fill: 'rgba(74, 222, 128, 0.065)', text: '#86efac' },
    'Statistics & Probability': { fill: 'rgba(251, 191, 36, 0.065)', text: '#fcd34d' },
    'Functions & Calculus':  { fill: 'rgba(192, 132, 252, 0.075)',  text: '#d8b4fe' }
  },
  light: {
    'Number & Algebra':      { fill: 'rgba(2, 132, 199, 0.06)',   text: '#0369a1' },
    'Measurement & Space':   { fill: 'rgba(22, 163, 74, 0.06)',   text: '#15803d' },
    'Statistics & Probability': { fill: 'rgba(217, 119, 6, 0.07)', text: '#b45309' },
    'Functions & Calculus':  { fill: 'rgba(147, 51, 234, 0.06)',  text: '#7e22ce' }
  }
};
export const strandPanelStyle = (strand, isDark) =>
  (isDark ? BAND_STYLE.dark : BAND_STYLE.light)[strand] || (isDark ? DEFAULT_STYLE.dark : DEFAULT_STYLE.light);
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
export function layoutSwimlanes(cy, { gap = 72, bandGap = 90, pad = 48, minSep = 40, rowGap = ROW_GAP, left = LABEL_GUTTER, maxPerRow = MAX_PER_ROW } = {}) {
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
    if (!e.hasClass('layout-edge')) return;
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
  const predOf = new Map(); // node id -> intra-band predecessors (for column alignment)

  for (const band of rowOrder) {
    const ids = bandNodes.get(band);
    // Only non-cross-course edges among this band's nodes (any strand) drive rank;
    // cross-course edges keep their bezier style and never drove layout anyway.
    const edgeList = intraEdgesByBand.get(band) || [];
    const { rank, pred } = rankBand(ids, edgeList);
    for (const id of ids) { nodeById.get(id).data('_rank', rank.get(id)); predOf.set(id, pred.get(id) || []); }

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
  // Wrap wide ranks: a (strand, band, rank) slot with more than maxPerRow nodes
  // is split into consecutive rows, and every strand in that band moves down by
  // the same number of rows so ranks stay aligned across columns.
  // Card layouts sit on a column grid: each card fills one column slot and the
  // opened topic fills as many as its width needs.
  const cardLayout = cy.nodes().length > 0 && cy.nodes().every((n) => n.hasClass('card'));
  const cardPitch = cardLayout
    ? Math.max(...cy.nodes().filter((n) => !n.hasClass('expanded')).map((n) => n.width() || 0), 120) + COL_GAP
    : 0;
  const spanOf = (id) => (cardLayout ? Math.max(1, Math.round(((nodeById.get(id).width() || 0) + COL_GAP) / cardPitch)) : 1);
  if (maxPerRow > 0) {
    const wrapped = new Map();
    for (const band of rowOrder) {
      const slots = [...groups.keys()]
        .map((key) => key.split('|'))
        .filter(([, b]) => Number(b) === band)
        .map(([strand, , r]) => ({ strand, rank: Number(r) }));
      const ranks = [...new Set(slots.map((slot) => slot.rank))].sort((a, b) => a - b);
      let row = 0;
      for (const r of ranks) {
        const here = slots.filter((slot) => slot.rank === r);
        let height = 1;
        for (const { strand } of here) {
          const ids = groups.get(`${strand}|${band}|${r}`);
          // Fill each row up to maxPerRow columns (an opened topic counts for
          // the columns it spans).
          const chunks = [];
          let current = [];
          let used = 0;
          for (const id of ids) {
            const span = Math.min(spanOf(id), maxPerRow);
            if (current.length && used + span > maxPerRow) { chunks.push(current); current = []; used = 0; }
            current.push(id);
            used += span;
          }
          if (current.length) chunks.push(current);
          height = Math.max(height, chunks.length);
          chunks.forEach((chunk, k) => wrapped.set(`${strand}|${band}|${row + k}`, chunk));
        }
        row += height;
      }
    }
    groups.clear();
    for (const [key, ids] of wrapped) groups.set(key, ids);
  }

  if (cardLayout) {
    return placeOnGrid({ groups, nodeById, predOf, colOrder, rowOrder, bandLabels, pitch: cardPitch, spanOf, pad, gap, bandGap, rowGap, left });
  }

  // Card nodes are measured by their own box; legacy disc nodes still reserve
  // room for their label chip.
  const GAP_PAD = 16; // breathing room between two adjacent nodes' edges
  const effWidth = (node) =>
    node.hasClass('card')
      ? node.width() || 60
      : Math.max(node.width() || 60, estimateChipWidth(node.data('label') || node.data('name') || ''));
  const colW = new Map();
  const maxRankInBand = new Map();
  const rankHeight = new Map(); // `${band}|${rank}` -> tallest node in that rank row
  const groupOffsets = new Map(); // group key -> cumulative centre-x offsets (offsets[0] = 0)
  for (const [key, ids] of groups) {
    const [strand, bandStr, rankStr] = key.split('|');
    const band = Number(bandStr);
    const rank = Number(rankStr);
    const eff = ids.map((id) => effWidth(nodeById.get(id)));
    const heights = ids.map((id) => nodeById.get(id).height() || 60);
    const offsets = [0];
    for (let i = 1; i < ids.length; i++)
      offsets.push(offsets[i - 1] + Math.max(minSep, (eff[i - 1] + eff[i]) / 2 + GAP_PAD));
    groupOffsets.set(key, offsets);
    // Slot span includes each end's half-width overhang so the outermost nodes
    // fit inside the column too.
    const slotW = offsets[offsets.length - 1] + eff[0] / 2 + eff[eff.length - 1] / 2;
    colW.set(strand, Math.max(colW.get(strand) || 0, slotW));
    maxRankInBand.set(band, Math.max(maxRankInBand.get(band) || 0, rank));
    const rowKey = `${band}|${rank}`;
    rankHeight.set(rowKey, Math.max(rankHeight.get(rowKey) || 0, Math.max(...heights)));
  }

  const colX = new Map();
  let cx = left;
  for (const strand of colOrder) {
    if (!colW.has(strand)) continue;
    colX.set(strand, cx);
    cx += colW.get(strand) + 2 * pad + gap;
  }

  // Rank rows stack with their own heights (tall cards and an opened topic get
  // the room they need), separated by a fixed node-free gutter.
  const rankTop = new Map(); // `${band}|${rank}` -> offset from the band's content top
  const contentH = new Map();
  const ranksPresent = new Map(); // band -> ascending ranks that hold nodes
  for (const band of rowOrder) {
    if (!maxRankInBand.has(band)) continue;
    let y = 0;
    const present = [];
    for (let r = 0; r <= maxRankInBand.get(band); r++) {
      const h = rankHeight.get(`${band}|${r}`);
      if (!h) continue;
      if (present.length) y += rowGap;
      rankTop.set(`${band}|${r}`, y);
      present.push(r);
      y += h;
    }
    ranksPresent.set(band, present);
    contentH.set(band, y);
  }
  const rowY = new Map();
  let cyTop = 0;
  for (const band of rowOrder) {
    if (!contentH.has(band)) continue;
    rowY.set(band, cyTop);
    cyTop += contentH.get(band) + 2 * pad + bandGap;
  }

  // Pass C: place every node — column-centred x within its (strand, band, rank)
  // slot, top-aligned in its rank row. Each node also records the midlines of
  // the gutters above and below its row, which routeEdges() runs its jogs along.
  for (const [key, ids] of groups) {
    const [strand, bandStr, rankStr] = key.split('|');
    const band = Number(bandStr);
    const rank = Number(rankStr);
    const centerX = colX.get(strand) + pad + colW.get(strand) / 2;
    const contentTop = rowY.get(band) + pad;
    const top = contentTop + rankTop.get(`${band}|${rank}`);
    const rowH = rankHeight.get(`${band}|${rank}`);
    const present = ranksPresent.get(band);
    const isFirst = present[0] === rank;
    const isLast = present[present.length - 1] === rank;
    const bandTop = rowY.get(band);
    const bandBottom = bandTop + contentH.get(band) + 2 * pad;
    const gAbove = isFirst ? bandTop - bandGap / 2 : top - rowGap / 2;
    const gBelow = isLast ? bandBottom + bandGap / 2 : top + rowH + rowGap / 2;
    const offsets = groupOffsets.get(key);
    const span = offsets[offsets.length - 1];
    ids.forEach((id, i) => {
      const node = nodeById.get(id);
      node.position({ x: centerX + offsets[i] - span / 2, y: top + (node.height() || 60) / 2 });
      node.data('_gAbove', gAbove);
      node.data('_gBelow', gBelow);
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
    .filter((b) => contentH.has(b))
    .map((band) => ({
      band,
      label: bandLabels.get(band),
      yTop: rowY.get(band),
      yBottom: rowY.get(band) + contentH.get(band) + 2 * pad
    }));
  return { lanes, rows, labelGutter: left };
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
  // the graph backdrop as well as the lane panels.
  ctx.fillStyle = canvasColours(isDark).bg;
  ctx.fillRect(0, 0, w, h);

  const zoom = cy.zoom();
  const pan = cy.pan();
  // Dot grid in map space, so it moves with the map. The spacing doubles when
  // zoomed out far enough that dots would crowd together.
  let step = 24 * zoom;
  while (step < 14) step *= 2;
  const dot = Math.max(1.2, Math.min(2, 1.8 * zoom));
  ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.26)' : 'rgba(100, 116, 139, 0.34)';
  const startX = ((pan.x % step) + step) % step;
  const startY = ((pan.y % step) + step) % step;
  for (let x = startX; x < w; x += step) {
    for (let y = startY; y < h; y += step) ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
  }
  if (lanes.length === 0 || rows.length === 0) return;

  const palette = isDark ? BAND_STYLE.dark : BAND_STYLE.light;
  const defaultStyle = isDark ? DEFAULT_STYLE.dark : DEFAULT_STYLE.light;
  const top = (rows[0].yTop - 8) * zoom + pan.y;
  const bottom = (rows[rows.length - 1].yBottom + 8) * zoom + pan.y;
  const radius = Math.min(16, 16 * zoom);

  // Strand panels: a soft tint behind each column, with its heading pinned to
  // the top of the panel (or the top of the screen once the panel scrolls up).
  ctx.textBaseline = 'top';
  const headingSize = Math.round(Math.max(11, Math.min(15, 14 * zoom)));
  ctx.font = `800 ${headingSize}px Nunito, system-ui, sans-serif`;
  for (const lane of lanes) {
    const style = palette[lane.strand] || defaultStyle;
    const left = lane.xLeft * zoom + pan.x;
    const right = lane.xRight * zoom + pan.x;
    if (right < 0 || left > w) continue;
    ctx.fillStyle = style.fill;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(left, top, right - left, bottom - top, radius);
    else ctx.rect(left, top, right - left, bottom - top);
    ctx.fill();

    const textW = ctx.measureText(lane.strand).width;
    const labelX = Math.min(Math.max(left + 14, 8), right - textW - 14);
    if (labelX < left + 4 || labelX + textW > right - 4) continue;
    const labelY = Math.min(Math.max(top + 14 * Math.min(1, zoom), 10), bottom - headingSize - 10);
    if (labelY < top) continue;
    ctx.fillStyle = style.text;
    ctx.fillText(lane.strand, labelX, labelY);
  }

  // Stage bands: a hairline between bands and a large stage name in the left
  // gutter, drawn at map scale so it reads like a heading.
  const sep = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(100, 116, 139, 0.2)';
  const ink = canvasColours(isDark).ink;
  const gutterLeft = (layout?.labelGutter ?? LABEL_GUTTER) > 0 ? 24 * zoom + pan.x : null;
  const labelSize = 30 * zoom;
  rows.forEach((row, i) => {
    const rowTop = row.yTop * zoom + pan.y;
    if (i > 0) {
      const prevBottom = rows[i - 1].yBottom * zoom + pan.y;
      const y = Math.round((prevBottom + rowTop) / 2) + 0.5;
      if (y > 0 && y < h) {
        ctx.strokeStyle = sep;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, (gutterLeft ?? 0) - 4), y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
    if (gutterLeft == null || !row.label || labelSize < 9) return;
    const rowBottom = row.yBottom * zoom + pan.y;
    if (rowBottom < 0 || rowTop > h) return;
    const maxWidth = ((layout?.labelGutter ?? LABEL_GUTTER) - 40) * zoom;
    const words = String(row.label).split(' ');
    // Wrap the stage name onto at most two lines inside the gutter.
    ctx.font = `800 ${labelSize}px Nunito, system-ui, sans-serif`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    ctx.fillStyle = ink;
    const y0 = rowTop + 48 * zoom;
    const shown = lines.slice(0, 3);
    shown.forEach((text, index) => ctx.fillText(text, gutterLeft, y0 + index * labelSize * 1.08, maxWidth));
    // Subtitle: school years and how many topics the band holds.
    const subSize = 14 * zoom;
    if (subSize >= 8) {
      const years = YEARS_BY_STAGE[row.stage];
      const sub = [years, row.count ? `${row.count} ${row.count === 1 ? 'topic' : 'topics'}` : null].filter(Boolean);
      ctx.font = `600 ${subSize}px Nunito, system-ui, sans-serif`;
      ctx.fillStyle = canvasColours(isDark).muted;
      const subTop = y0 + shown.length * labelSize * 1.08 + 6 * zoom;
      sub.forEach((text, index) => ctx.fillText(text, gutterLeft, subTop + index * subSize * 1.5, maxWidth));
    }
  });
}
