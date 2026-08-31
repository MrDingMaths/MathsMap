#!/usr/bin/env node
// Audits inline [tikz] figures for TANGENT-SLOPE: a straight line drawn against a
// plotted curve that touches it at exactly one point but does not share the curve's
// gradient there — i.e. a line the prose calls a tangent that visibly cuts across
// the curve.
//
// Why this exists: tangent figures were authored by hand — the curve as a
// `plot[smooth] coordinates {...}` guess and the tangent as a hard-coded
// `\draw (x1,y1) -- (x2,y2)`. Nothing checked that the line's gradient equalled the
// curve's gradient at the contact point, so `estimate-instantaneous-rate-graph`
// shipped "tangents" with roughly half the curve's slope. The answer keys were fine
// (they follow the two stated points on the line); only the picture lied.
//
// Scope: only figures whose own card text (question or solution) says "tangent". A
// straight line meeting a curve is otherwise perfectly legitimate — a secant, an
// arm of a piecewise path, a second graph on shared axes — and geometry alone cannot
// tell those from a botched tangent. The prose is the statement of intent, so it is
// what the picture is held to.
//
// Method, per figure: reconstruct the plotted curve — a Catmull-Rom spline through a
// `plot[smooth] coordinates {...}` list, or a direct evaluation of a
// `plot[domain=a:b] (\x,{f(x)})` expression — then, for every straight `--` segment
// that is not an axis or a tick, count where it touches the curve:
//   0 contacts  → an unrelated construction line (dashed drop line, asymptote): skip
//   2+ contacts → a secant, legitimate unless one crossing is the figure's own marked
//                 point of tangency (a `\fill` dot), which means the line cuts through
//                 the very point it was meant to touch
//   1 contact   → the line is meant to be a tangent, so its gradient must match the
//                 curve's gradient there.
// Gradients are compared in canvas units, relative to the curve's own slope, so a
// steep tangent is not held to the same absolute tolerance as a flat one.
//
// Usage:
//   node scripts/audit-tangent-lines.mjs                  # all skills
//   node scripts/audit-tangent-lines.mjs --only id1,id2   # ids or prefix
//   node scripts/audit-tangent-lines.mjs --strict         # exit 1 on defects
//   node scripts/audit-tangent-lines.mjs --dir <root>     # test override
//
// See docs/content-generation.md (deterministic gate) and docs/tikz-prompt.md.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { rejectStrayPositionals } from './lib/argv.mjs';
import { listJsonFiles, extractTikz } from './lib/tikz-blocks.mjs';

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

const NUM = '-?\\d*\\.?\\d+';
// A segment is "touching" the curve where the vertical gap closes to under this many
// canvas units. Tangency in these figures is authored to grid points, so a real
// contact is essentially exact; the slack is for spline reconstruction error.
const CONTACT_EPS = 0.08;
// Two contacts closer together than this are the same touch found twice.
const CONTACT_MERGE = 0.35;
// Gradient tolerance: the larger of an absolute floor (flat tangents) and a fraction
// of the curve's own gradient (steep ones).
const SLOPE_ABS = 0.18;
const SLOPE_REL = 0.15;
// Below this span the segment is a tick or a marker stub, not a drawn line.
const MIN_SPAN = 0.4;

// Catmull-Rom through the authored control points. TikZ's `smooth` plot is a
// Hobby-ish spline, not exactly this, but the two agree closely enough that a
// half-gradient error is unmistakable and a correct tangent stays inside tolerance.
function catmullRom(pts, perSpan = 200) {
  const ext = [
    pts[0].map((_, i) => 2 * pts[0][i] - pts[1][i]),
    ...pts,
    pts.at(-1).map((_, i) => 2 * pts.at(-1)[i] - pts.at(-2)[i]),
  ];
  const out = [];
  for (let i = 1; i < ext.length - 2; i++) {
    for (let k = 0; k < perSpan; k++) {
      const t = k / perSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5
        * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([
        f(ext[i - 1][0], ext[i][0], ext[i + 1][0], ext[i + 2][0]),
        f(ext[i - 1][1], ext[i][1], ext[i + 1][1], ext[i + 2][1]),
      ]);
    }
  }
  out.push(pts.at(-1));
  return out;
}

// A tikz `{...}` maths expression, in the subset these figures use.
function compileExpr(src) {
  const js = src
    .replace(/\\x/g, 'x')
    .replace(/\bexp\(/g, 'Math.exp(')
    .replace(/\bln\(/g, 'Math.log(')
    .replace(/\bsqrt\(/g, 'Math.sqrt(')
    .replace(/\babs\(/g, 'Math.abs(')
    .replace(/\bsin\(/g, 'SIN(')
    .replace(/\bcos\(/g, 'COS(')
    .replace(/\btan\(/g, 'TAN(')
    .replace(/\^/g, '**');
  if (/[a-z_$][\w$]*\s*\(/i.test(js.replace(/Math\.\w+\(|SIN\(|COS\(|TAN\(/g, ''))) return null;
  try {
    const f = new Function(
      'x',
      'const SIN=(v)=>Math.sin(Math.PI/180*v),COS=(v)=>Math.cos(Math.PI/180*v),'
      + 'TAN=(v)=>Math.tan(Math.PI/180*v);return ' + js,
    );
    if (!Number.isFinite(f(0.37))) return null;
    return f;
  } catch {
    return null;
  }
}

// Every curve plotted in one figure, as a dense polyline in canvas coordinates.
function parseCurves(body) {
  const curves = [];

  const coordRe = /plot\s*\[[^\]]*smooth[^\]]*\]\s*coordinates\s*\{([^}]*)\}/g;
  let m;
  while ((m = coordRe.exec(body)) !== null) {
    const pts = [...m[1].matchAll(new RegExp(`\\((${NUM}),\\s*(${NUM})\\)`, 'g'))]
      .map((c) => [Number(c[1]), Number(c[2])]);
    if (pts.length >= 3) curves.push({ kind: 'coords', pts: catmullRom(pts) });
  }

  const fnRe = new RegExp(
    `domain\\s*=\\s*(${NUM})\\s*:\\s*(${NUM})[^\\]]*\\]\\s*plot\\s*\\(\\{?\\\\x\\}?\\s*,\\s*\\{([^}]*)\\}\\)`,
    'g',
  );
  while ((m = fnRe.exec(body)) !== null) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const f = compileExpr(m[3]);
    if (!f) continue;
    const pts = [];
    for (let i = 0; i <= 800; i++) {
      const x = a + ((b - a) * i) / 800;
      const y = f(x);
      if (!Number.isFinite(y)) { pts.length = 0; break; }
      pts.push([x, y]);
    }
    if (pts.length) curves.push({ kind: 'fn', pts });
  }

  return curves;
}

// Points marked with a filled dot: in these figures that is where the tangency (or a
// read-off point on the tangent) is claimed to be.
function parseMarks(body) {
  const re = new RegExp(
    `\\\\fill\\s*(?:\\[[^\\]]*\\])?\\s*\\((${NUM}),\\s*(${NUM})\\)\\s*circle`,
    'g',
  );
  const out = [];
  let m;
  while ((m = re.exec(body)) !== null) out.push([Number(m[1]), Number(m[2])]);
  return out;
}

// Straight two-point `\draw ... (a,b) -- (c,d)` paths, minus arrows (axes) and stubs.
function parseSegments(body) {
  const re = new RegExp(
    `\\\\draw\\s*(?:\\[([^\\]]*)\\])?\\s*\\((${NUM}),\\s*(${NUM})\\)\\s*--\\s*\\((${NUM}),\\s*(${NUM})\\)`,
    'g',
  );
  const out = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    const opt = m[1] || '';
    if (/->|<-|<->/.test(opt)) continue;
    const seg = {
      opt,
      x1: Number(m[2]), y1: Number(m[3]), x2: Number(m[4]), y2: Number(m[5]),
      raw: m[0].replace(/\s+/g, ' '),
    };
    if (Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) < MIN_SPAN) continue;
    if (Math.abs(seg.x2 - seg.x1) < 1e-9) continue; // vertical: never a tangent here
    out.push(seg);
  }
  return out;
}

// Where the line meets the curve, and the curve's gradient at each contact.
function contacts(curve, seg) {
  const m = (seg.y2 - seg.y1) / (seg.x2 - seg.x1);
  const b = seg.y1 - m * seg.x1;
  const lo = Math.min(seg.x1, seg.x2);
  const hi = Math.max(seg.x1, seg.x2);
  const pts = curve.pts.filter((p) => p[0] >= lo - 1e-3 && p[0] <= hi + 1e-3);
  if (pts.length < 20) return { m, overlap: pts.length, found: [] };

  const gaps = pts.map((p) => p[1] - (m * p[0] + b));
  const found = [];
  for (let i = 1; i < gaps.length - 1; i++) {
    const isMin = Math.abs(gaps[i]) <= Math.abs(gaps[i - 1]) && Math.abs(gaps[i]) <= Math.abs(gaps[i + 1]);
    const crossing = gaps[i - 1] * gaps[i + 1] < 0;
    if ((!isMin && !crossing) || Math.abs(gaps[i]) > CONTACT_EPS) continue;
    if (found.length && Math.abs(pts[i][0] - found.at(-1).x) < CONTACT_MERGE) continue;
    const slope = (pts[i + 1][1] - pts[i - 1][1]) / (pts[i + 1][0] - pts[i - 1][0]);
    found.push({ x: pts[i][0], y: pts[i][1], slope, gap: Math.abs(gaps[i]) });
  }
  // An endpoint sitting on the curve is a contact the interior scan cannot see.
  for (const [ex, ey] of [[seg.x1, seg.y1], [seg.x2, seg.y2]]) {
    let bi = -1;
    let best = Infinity;
    pts.forEach((p, i) => { const d = Math.hypot(p[0] - ex, p[1] - ey); if (d < best) { best = d; bi = i; } });
    if (best > CONTACT_EPS || bi <= 0 || bi >= pts.length - 1) continue;
    if (found.some((c) => Math.abs(c.x - pts[bi][0]) < CONTACT_MERGE)) continue;
    const slope = (pts[bi + 1][1] - pts[bi - 1][1]) / (pts[bi + 1][0] - pts[bi - 1][0]);
    found.push({ x: pts[bi][0], y: pts[bi][1], slope, gap: best });
  }
  found.sort((a, c) => a.x - c.x);
  return { m, overlap: pts.length, found };
}

// Like lib/tikz-blocks' collectBlocks, but keeps each figure's own card text so the
// "does the prose call this a tangent?" scope test can be applied.
function collectTangentBlocks() {
  const TIERS = ['foundation', 'development', 'mastery'];
  const TEXT_KEYS = ['question_text', 'solution_text'];
  const blocks = [];

  const push = (skillId, file, where, card) => {
    const prose = TEXT_KEYS.map((k) => (typeof card[k] === 'string' ? card[k] : '')).join('\n');
    if (!/tangent/i.test(prose)) return;
    for (const key of TEXT_KEYS) {
      extractTikz(card[key]).forEach((body, i) => {
        blocks.push({ skillId, file, where: `${where}.${key}`, blockIndex: i, body });
      });
    }
  };

  const contentDir = join(baseDir, 'content');
  for (const file of listJsonFiles(contentDir)) {
    const skillId = file.replace(/\.json$/, '');
    if (filterFn && !filterFn(skillId)) continue;
    let doc;
    try { doc = JSON.parse(readFileSync(join(contentDir, file), 'utf8')); } catch (err) {
      console.error(`  ✗ content/${file}: unreadable (${err.message})`);
      continue;
    }
    for (const tier of TIERS) {
      (doc.practice?.[tier] || []).forEach((card, idx) => push(skillId, `content/${file}`, `${tier}[${idx}]`, card));
    }
  }

  const quizzesDir = join(baseDir, 'quizzes');
  for (const file of listJsonFiles(quizzesDir)) {
    const skillId = file.replace(/\.json$/, '');
    if (filterFn && !filterFn(skillId)) continue;
    let doc;
    try { doc = JSON.parse(readFileSync(join(quizzesDir, file), 'utf8')); } catch (err) {
      console.error(`  ✗ quizzes/${file}: unreadable (${err.message})`);
      continue;
    }
    for (const q of doc.questions || []) push(skillId, `quizzes/${file}`, q.id, q);
  }

  return blocks;
}

const blocks = collectTangentBlocks();

const defects = [];
let figuresScanned = 0;
let curvesFound = 0;
let linesChecked = 0;
let secantsSkipped = 0;
let unrelatedSkipped = 0;

for (const block of blocks) {
  figuresScanned++;
  const curves = parseCurves(block.body);
  if (!curves.length) continue;
  const marks = parseMarks(block.body);
  curvesFound += curves.length;

  for (const seg of parseSegments(block.body)) {
    for (const curve of curves) {
      const { m, found } = contacts(curve, seg);
      if (found.length === 0) { unrelatedSkipped++; continue; }
      if (found.length > 1) {
        // A line crossing the curve twice is a secant — legitimate even in a tangent
        // figure, which usually contrasts the two. It is the defect only when one of
        // those crossings is the figure's own marked point of tangency: the line was
        // meant to touch there and instead cuts through.
        const hit = found.find((c) => marks.some((p) => Math.hypot(c.x - p[0], c.y - p[1]) < CONTACT_MERGE));
        if (!hit && marks.length) { secantsSkipped++; continue; }
        linesChecked++;
        defects.push({
          ...block,
          kind: 'TANGENT-CROSSES',
          detail: `line crosses the curve at ${found.map((c) => `(${c.x.toFixed(2)},${c.y.toFixed(2)})`).join(' and ')}`
            + ' — a tangent touches once',
          seg: seg.raw,
        });
        continue;
      }

      linesChecked++;
      const c = found[0];
      const tol = Math.max(SLOPE_ABS, SLOPE_REL * Math.abs(c.slope));
      if (Math.abs(m - c.slope) <= tol) continue;
      defects.push({
        ...block,
        kind: 'TANGENT-SLOPE',
        detail: `line touching the curve at (${c.x.toFixed(2)},${c.y.toFixed(2)}) has gradient `
          + `${m.toFixed(2)} but the curve's gradient there is ${c.slope.toFixed(2)} — not a tangent`,
        seg: seg.raw,
      });
    }
  }
}

for (const d of defects) {
  console.log(`✗ ${d.kind}`);
  console.log(`    ${d.skillId} ${d.where}${d.blockIndex ? `#${d.blockIndex}` : ''}: ${d.detail}`);
  console.log(`      ${d.seg}`);
}

console.log(
  `\nScanned ${figuresScanned} [tikz] figure(s); reconstructed ${curvesFound} plotted curve(s); `
  + `checked ${linesChecked} single-contact line(s) `
  + `(${secantsSkipped} multi-contact secant/chord, ${unrelatedSkipped} not touching a curve).`,
);

if (defects.length) {
  console.log(`\n✗ ${defects.length} tangent-line defect(s).`);
  if (strict) process.exit(1);
} else {
  console.log('\n✓ No tangent-line defects.');
}
