#!/usr/bin/env node
// Audits inline [tikz] figures for LABEL-SCALE disagreement: a hand-placed
// length label ("$10\text{ cm}$") attached to a segment that is not drawn to
// that length relative to the rest of the figure.
//
// Why this exists: the blind checker only ever sees quiz + mastery items
// (blind-for-check.mjs), so a figure whose labels contradict its own drawing
// is invisible on every foundation/development card. Batch 12 ran this as a
// one-off sweep and it found 3 defects of exactly the class luna had caught
// once by hand — all slant sides drawn shorter than their label.
//
// Method, per figure:
//   1. Resolve named coordinates, then collect every straight `--` segment.
//   2. Collect every node whose text is a plain length (number + mm/cm/m/km,
//      excluding area/volume labels ending ^2 / ^3), converted to mm.
//   3. Match each label to the segment it sits beside (nearest midpoint,
//      normalised by half the segment's length; unmatched labels are skipped,
//      which is what keeps arcs, radii of undrawn circles and area labels out).
//   4. ratio = drawn coordinate length / stated length. A figure's median
//      ratio is its scale; any label off the median by more than the tolerance
//      is a suspect.
//
// 3D: figures authored per docs/tikz-prompt.md use tikz-3dplot with named
// (x,y,z) coordinates. We compare TRUE 3D lengths, so a foreshortened depth
// edge is never mistaken for a short one — no projection is modelled. A block
// that mentions tdplot but carries only 2D coordinates is a hand-projected
// solid whose drawn lengths are deliberately not to scale; those are SKIPPED
// and counted, never flagged. So is a 2D block that never mentions tdplot but
// repeats one OBLIQUE offset vector across 3+ coordinate pairs — the signature
// of an oblique projection, and the house convention the shipped 3D skills use.
//
// Usage:
//   node scripts/audit-figure-scale.mjs                      # all skills
//   node scripts/audit-figure-scale.mjs --only id1,id2       # ids or prefix
//   node scripts/audit-figure-scale.mjs --strict             # exit 1 on suspects
//   node scripts/audit-figure-scale.mjs --tol 0.12           # tolerance (default 0.12)
//   node scripts/audit-figure-scale.mjs --dir <root>         # test override
//
// See docs/content-generation.md (deterministic gate) and docs/tikz-prompt.md.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rejectStrayPositionals } from './lib/argv.mjs';
import {
  collectBlocks, parseNamedCoords, parseFigure, candidateSpans,
  dist, midpoint, median,
} from './lib/tikz-blocks.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseValueArg(argv, flag) {
  const idx = argv.indexOf(flag);
  if (idx === -1 || idx === argv.length - 1) return null;
  return argv[idx + 1];
}

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, { valueFlags: ['--only', '--dir', '--tol'], boolFlags: ['--strict'] });
const strict = argv.includes('--strict');
const dirArg = parseValueArg(argv, '--dir');
const tol = Number(parseValueArg(argv, '--tol') ?? 0.12);
const onlyRaw = parseValueArg(argv, '--only');
const onlyIds = onlyRaw ? onlyRaw.split(',').map((s) => s.trim()).filter(Boolean) : null;
const filterFn = onlyIds ? (id) => onlyIds.some((w) => id === w || id.startsWith(w)) : null;

const baseDir = dirArg ? join(rootDir, dirArg) : join(rootDir, 'public');

// Node text -> length in mm, or null when the node is not a plain length.
const UNIT_MM = { mm: 1, cm: 10, m: 1000, km: 1000000 };
const LENGTH_RE = /(-?\d+(?:\.\d+)?)\s*(?:\\[,;:!])?\s*\\(?:text|mathrm)\s*\{\s*(mm|cm|m|km)\s*\}(\s*\^\s*\{?\s*[23]\s*\}?)?/;

function labelLength(text) {
  const m = LENGTH_RE.exec(text);
  if (!m) return null;
  if (m[3]) return null;             // area / volume label, not a length
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return { mm: value * UNIT_MM[m[2]], shown: `${m[1]} ${m[2]}` };
}

// Match a label node to the segment it annotates. `score` is the distance from
// the node to the segment midpoint measured in half-lengths of that segment,
// so a label sitting beside a long edge and one beside a short edge are judged
// on the same footing.
// Deliberately tight. A label naming a span sits at that span's midpoint, so
// a genuine match scores near 0. Loosening this lets a label for an
// undrawn sub-part (the two "5 cm" halves of a drawn diameter, where nothing
// cuts the segment at the centre) attach to its parent edge and corrupt the
// median. Unmatched labels are simply not compared.
const MATCH_SCORE_MAX = 0.35;
const MIN_LABELS = 3;

function matchSegment(at, segments) {
  let best = null;
  for (const seg of segments) {
    const len = dist(seg[0], seg[1]);
    const score = dist(at, midpoint(seg[0], seg[1])) / (len / 2);
    if (!best || score < best.score) best = { seg, len, score };
  }
  return best && best.score <= MATCH_SCORE_MAX ? best : null;
}

// An obliquely projected solid repeats ONE depth offset across every edge that runs
// "into the page": in a cuboid ABCD-EFGH drawn by hand, B->C, A->D, F->G and E->H are
// all the same vector, and that vector is oblique (both components non-zero) because a
// depth edge is deliberately foreshortened AND slanted. Three or more coordinate pairs
// sharing one oblique offset is that signature; a plane rectangle or parallelogram only
// ever reaches two, so this cannot swallow a flat figure. Needed because the house 3D
// convention (see `trigonometry-3d`) hand-projects WITHOUT mentioning tdplot at all, so
// the string test below misses it and the foreshortened depth edge is then compared
// against the median of the in-plane edges and flagged — W3-11's three cuboids.
function hasRepeatedObliqueOffset(named) {
  const pts = [...named.values()].filter((p) => p.length === 2);
  if (pts.length < 6) return false;
  const EPS = 1e-6;
  const counts = new Map();
  for (let i = 0; i < pts.length; i++) {
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      const dx = pts[j][0] - pts[i][0];
      const dy = pts[j][1] - pts[i][1];
      if (Math.abs(dx) < EPS || Math.abs(dy) < EPS) continue; // axis-aligned: not a depth edge
      const key = `${dx.toFixed(4)},${dy.toFixed(4)}`;
      counts.set(key, (counts.get(key) || 0) + 1);
      if (counts.get(key) >= 3) return true;
    }
  }
  return false;
}

const blocks = collectBlocks(baseDir, filterFn);

const suspects = [];
let figuresScanned = 0;
let figuresCompared = 0;
let figuresSkipped3d = 0;
let labelsMatched = 0;

for (const block of blocks) {
  figuresScanned++;
  const body = block.body;

  const named = parseNamedCoords(body);
  const { segments, labelledSegments, freeNodes } = parseFigure(body, named);

  const is3dPlot = /tdplot|tikz-3dplot/.test(body);
  const has3dCoords = [...named.values()].some((p) => p.length === 3)
    || segments.some(([a, b]) => a.length === 3 || b.length === 3);
  if ((is3dPlot || hasRepeatedObliqueOffset(named)) && !has3dCoords) {
    // Hand-projected solid: drawn lengths are intentionally not to scale.
    figuresSkipped3d++;
    continue;
  }

  const labels = [];

  // Inline path labels bind to their segment by syntax — no heuristic.
  for (const { seg, text } of labelledSegments) {
    const len = labelLength(text);
    if (!len) continue;
    const drawn = dist(seg[0], seg[1]);
    labels.push({ ...len, drawn, ratio: drawn / len.mm });
  }

  // Free-standing labels are matched by proximity to a candidate span.
  const spans = candidateSpans(segments);
  for (const node of freeNodes) {
    const len = labelLength(node.text);
    if (!len) continue;
    const match = matchSegment(node.at, spans);
    if (!match) continue;
    labels.push({ ...len, drawn: match.len, ratio: match.len / len.mm });
  }
  // Three is the floor, not two: with only two labels the "median" is their
  // mean, so a single mismatched label drags the reference and both ends get
  // flagged symmetrically — which is what a 2-label circle figure (diameter
  // + radius, or a circumference value that is not a straight edge at all)
  // produces. Every known catch of this sweep carried three labels
  // (base + perpendicular height + slant).
  if (labels.length < MIN_LABELS) continue;

  labelsMatched += labels.length;
  figuresCompared++;

  const med = median(labels.map((l) => l.ratio));
  if (!med || med <= 0) continue;

  for (const l of labels) {
    const dev = l.ratio / med - 1;
    if (Math.abs(dev) > tol) {
      suspects.push({
        ...block,
        shown: l.shown,
        drawn: l.drawn,
        implied: l.mm * med,
        dev,
      });
    }
  }
}

for (const s of suspects) {
  console.log('✗ LABEL-SCALE');
  console.log(
    `    ${s.skillId} ${s.where}${s.blockIndex ? `#${s.blockIndex}` : ''}: `
    + `label "${s.shown}" drawn ${s.drawn.toFixed(2)} coord-units, `
    + `figure scale implies ${s.implied.toFixed(2)} `
    + `(${(s.dev * 100).toFixed(0)}% off the figure median)`,
  );
}

console.log(
  `\nScanned ${figuresScanned} [tikz] figure(s); compared ${figuresCompared} `
  + `multi-label figure(s) (${labelsMatched} matched labels); `
  + `skipped ${figuresSkipped3d} hand-projected 3D figure(s).`,
);
console.log(`Tolerance: ${(tol * 100).toFixed(0)}%.`);

if (suspects.length) {
  console.log(`\n✗ ${suspects.length} figure-scale suspect(s).`);
  if (strict) process.exit(1);
} else {
  console.log('\n✓ No figure-scale suspects.');
}
