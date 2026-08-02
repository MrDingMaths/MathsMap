#!/usr/bin/env node
// Audits inline [tikz] figures for ANGLE-ARMS: a labelled angle drawn with
// fewer than two bounding rays, so the marked region is ambiguous.
//
// Why this exists: this is the defect the human caught by eye in batch 11 —
// `perimeter-composite-arc-figures` drew a central angle with only ONE radius
// visible, so the arc mark had no second arm and the sector it named could not
// be read off the picture. Nothing in the source-reading blind check sees it
// (luna reads the TikZ and reconstructs the intended angle), and nothing in
// the validator sees it either.
//
// Method, per figure: every `\node ... {$N^{\circ}$}` is matched to the
// nearest vertex (a cluster of segment endpoints); the arms of that vertex are
// the straight segments incident on it. Fewer than two arms is a defect.
// `\pic {angle=A--B--C}` / `{right angle=A--B--C}` constructions draw their own
// arms from the named points, so their vertex is exempt.
//
// Usage:
//   node scripts/audit-angle-arms.mjs                  # all skills
//   node scripts/audit-angle-arms.mjs --only id1,id2   # ids or prefix
//   node scripts/audit-angle-arms.mjs --strict         # exit 1 on defects
//   node scripts/audit-angle-arms.mjs --dir <root>     # test override
//
// See docs/content-generation.md (deterministic gate) and docs/tikz-prompt.md.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rejectStrayPositionals } from './lib/argv.mjs';
import {
  collectBlocks, parseNamedCoords, parseFigure, parseArcCentres, resolvePoint, dist,
} from './lib/tikz-blocks.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseValueArg(argv, flag) {
  const idx = argv.indexOf(flag);
  if (idx === -1 || idx === argv.length - 1) return null;
  return argv[idx + 1];
}

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, { valueFlags: ['--only', '--dir'], boolFlags: ['--strict'] });
const strict = argv.includes('--strict');
const dirArg = parseValueArg(argv, '--dir');
const onlyRaw = parseValueArg(argv, '--only');
const onlyIds = onlyRaw ? onlyRaw.split(',').map((s) => s.trim()).filter(Boolean) : null;
const filterFn = onlyIds ? (id) => onlyIds.some((w) => id === w || id.startsWith(w)) : null;

const baseDir = dirArg ? join(rootDir, dirArg) : join(rootDir, 'public');

const DEGREE_RE = /\^\s*\{?\s*\\circ\s*\}?/;
const VERTEX_EPS = 0.05;
// A degree label further than this fraction of the figure's diagonal from any
// candidate vertex is not annotating a drawn vertex at all (a legend, an
// answer note, a bearing in open space) — unmatched, never a defect. Reflex
// angles legitimately place their label well away from the vertex, so this is
// deliberately generous.
const VERTEX_REACH = 0.8;

// Vertices named by `\pic ... {angle = A--B--C}` draw their own arms.
function picVertices(body, named) {
  const out = [];
  const re = /\\pic[\s\S]*?\{\s*(?:right\s+)?angle\s*=\s*([^}]*)\}/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const parts = m[1].split('--').map((s) => s.trim()).filter(Boolean);
    if (parts.length !== 3) continue;
    const v = resolvePoint(parts[1], named);
    if (v) out.push(v);
  }
  return out;
}

const blocks = collectBlocks(baseDir, filterFn);

const defects = [];
let figuresScanned = 0;
let anglesChecked = 0;
let anglesUnmatched = 0;
let anglesExempt = 0;
let picConstructed = 0;

for (const block of blocks) {
  figuresScanned++;
  const body = block.body;
  if (!DEGREE_RE.test(body)) continue;

  const named = parseNamedCoords(body);
  const { segments, freeNodes } = parseFigure(body, named);
  if (!segments.length) continue;

  const exempt = picVertices(body, named);
  // `\pic[draw,"$120^{\circ}$"]{angle=A--O--B}` carries its label inside the
  // pic, not as a node, and constructs both arms from the named points. Those
  // are counted, not checked.
  picConstructed += exempt.length;

  const xs = segments.flatMap(([a, b]) => [a[0], b[0]]);
  const ys = segments.flatMap(([a, b]) => [a[1], b[1]]);
  const diag = Math.hypot(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  ) || 1;

  const endpoints = segments.flatMap(([a, b]) => [a, b]);
  const armsAt = (v) => segments.filter(
    ([a, b]) => dist(a, v) <= VERTEX_EPS || dist(b, v) <= VERTEX_EPS,
  ).length;

  // Candidate vertices are places an angle can actually be marked: a junction
  // where two or more segments meet, or the centre of a drawn arc. A bare ray
  // TIP is neither, and excluding it is what stops a label sitting between two
  // rays from being assigned to the nearer ray's far end — the false positive
  // that a plain nearest-endpoint search produces on every rays-from-a-point
  // figure.
  const candidates = [
    ...endpoints.filter((p) => armsAt(p) >= 2),
    ...parseArcCentres(body, named),
  ];
  if (!candidates.length) continue;

  for (const node of freeNodes) {
    if (!DEGREE_RE.test(node.text)) continue;

    let vertex = null;
    let best = Infinity;
    for (const p of candidates) {
      const d = dist(node.at, p);
      if (d < best) { best = d; vertex = p; }
    }
    if (!vertex || best > VERTEX_REACH * diag) { anglesUnmatched++; continue; }

    if (exempt.some((v) => dist(v, vertex) <= VERTEX_EPS)) { anglesExempt++; continue; }

    anglesChecked++;
    const arms = armsAt(vertex);
    if (arms < 2) {
      defects.push({
        ...block,
        label: node.text.replace(/\s+/g, ' ').trim(),
        vertex: `(${vertex.map((n) => Number(n).toFixed(2)).join(',')})`,
        arms,
      });
    }
  }
}

for (const d of defects) {
  console.log('✗ ANGLE-ARMS');
  console.log(
    `    ${d.skillId} ${d.where}${d.blockIndex ? `#${d.blockIndex}` : ''}: `
    + `angle "${d.label}" at vertex ${d.vertex} has ${d.arms} bounding ray(s) drawn (needs 2)`,
  );
}

console.log(
  `\nScanned ${figuresScanned} [tikz] figure(s); checked ${anglesChecked} node-labelled angle(s) `
  + `(${picConstructed} built by \\pic with their own arms, ${anglesExempt} node labels on a `
  + `\\pic vertex, ${anglesUnmatched} not at a markable vertex).`,
);

if (defects.length) {
  console.log(`\n✗ ${defects.length} angle-arm defect(s).`);
  if (strict) process.exit(1);
} else {
  console.log('\n✓ No angle-arm defects.');
}
