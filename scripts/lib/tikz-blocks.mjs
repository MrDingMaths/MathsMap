// Shared collector for inline `[tikz]...[/tikz]` figures across the authored
// content and quiz JSON, plus the small geometry helpers the figure audits
// need (coordinate resolution, `--` path segments, node labels).
//
// A "block" is one figure with enough provenance to name it in a report:
//   { skillId, file, where, blockIndex, body }
// where `where` is e.g. `foundation[3].question_text` or `q7.solution_text`.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TIER_KEYS = ['foundation', 'development', 'mastery'];
const TEXT_KEYS = ['question_text', 'solution_text'];

export function listJsonFiles(dir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Pull every [tikz]...[/tikz] body out of one string.
export function extractTikz(text) {
  if (typeof text !== 'string') return [];
  const out = [];
  const re = /\[tikz\]([\s\S]*?)\[\/tikz\]/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

function pushFrom(blocks, skillId, file, where, text) {
  extractTikz(text).forEach((body, i) => {
    blocks.push({ skillId, file, where, blockIndex: i, body });
  });
}

// Collect blocks from public/content/*.json and public/quizzes/*.json.
// `filterFn` takes a skillId and returns whether to include it.
export function collectBlocks(baseDir, filterFn) {
  const blocks = [];
  const contentDir = join(baseDir, 'content');
  const quizzesDir = join(baseDir, 'quizzes');

  for (const file of listJsonFiles(contentDir)) {
    const skillId = file.replace(/\.json$/, '');
    if (filterFn && !filterFn(skillId)) continue;
    let doc;
    try {
      doc = JSON.parse(readFileSync(join(contentDir, file), 'utf8'));
    } catch (err) {
      console.error(`  ✗ content/${file}: unreadable (${err.message})`);
      continue;
    }
    const practice = doc.practice || {};
    for (const tier of TIER_KEYS) {
      const cards = practice[tier] || [];
      cards.forEach((card, idx) => {
        for (const key of TEXT_KEYS) {
          pushFrom(blocks, skillId, `content/${file}`, `${tier}[${idx}].${key}`, card[key]);
        }
      });
    }

    // Theory carries figures too — one generic labelled reference diagram beside
    // the fact it teaches. `where` mirrors the field path so a redraw can be
    // spliced straight back: theory.intro, theory.facts[2], theory.steps[1].
    const theory = doc.theory || {};
    pushFrom(blocks, skillId, `content/${file}`, 'theory.intro', theory.intro);
    for (const key of ['facts', 'steps']) {
      const arr = Array.isArray(theory[key]) ? theory[key] : [];
      arr.forEach((text, idx) => {
        pushFrom(blocks, skillId, `content/${file}`, `theory.${key}[${idx}]`, text);
      });
    }
  }

  for (const file of listJsonFiles(quizzesDir)) {
    const skillId = file.replace(/\.json$/, '');
    if (filterFn && !filterFn(skillId)) continue;
    let doc;
    try {
      doc = JSON.parse(readFileSync(join(quizzesDir, file), 'utf8'));
    } catch (err) {
      console.error(`  ✗ quizzes/${file}: unreadable (${err.message})`);
      continue;
    }
    for (const q of doc.questions || []) {
      for (const key of TEXT_KEYS) {
        pushFrom(blocks, skillId, `quizzes/${file}`, `${q.id}.${key}`, q[key]);
      }
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Geometry parsing
// ---------------------------------------------------------------------------

// A point is [x, y] in 2D or [x, y, z] in 3D. Figures authored with
// tikz-3dplot carry three components, and we keep all three: comparing TRUE
// 3D lengths sidesteps the projection entirely, so a foreshortened depth edge
// is never mistaken for a short one.
function parseTuple(raw) {
  const parts = raw.split(',').map((s) => s.trim());
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return nums;
}

// `\coordinate (A) at (1,2,3);` and `\path (1,2) coordinate (B);`
export function parseNamedCoords(body) {
  const named = new Map();
  const re = /\\coordinate\s*(?:\[[^\]]*\])?\s*\(([^)]+)\)\s*at\s*\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    // Resolve against what is already named, so `\coordinate (P) at (30:2)`
    // (polar) and a coordinate defined from an earlier one both land.
    const pt = resolvePoint(m[2], named);
    if (pt) named.set(m[1].trim(), pt);
  }
  return named;
}

// Resolve one `(...)` path token to a point: a literal tuple, a named
// coordinate, or a polar `(30:2)` form. Returns null when unresolvable
// (e.g. a calc expression) so the caller can drop that link.
export function resolvePoint(token, named) {
  const t = token.trim();
  if (named.has(t)) return named.get(t);
  const polar = t.match(/^(-?[\d.]+)\s*:\s*(-?[\d.]+)$/);
  if (polar) {
    const deg = Number(polar[1]);
    const r = Number(polar[2]);
    if (Number.isFinite(deg) && Number.isFinite(r)) {
      return [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
    }
    return null;
  }
  return parseTuple(t);
}

export function dist(a, b) {
  const n = Math.max(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function midpoint(a, b) {
  const n = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < n; i++) out.push(((a[i] ?? 0) + (b[i] ?? 0)) / 2);
  return out;
}

// Node text may nest braces two deep (`{$12\text{ cm}^{2}$}`).
const BRACED = '\\{((?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*)\\}';
// Ordered alternation: nodes FIRST, so a node's own `at (x,y)` is never read
// as a path point.
const TOKEN_RE = new RegExp(
  `(node)\\s*(\\[[^\\]]*\\])?\\s*(?:\\(([^)]*)\\)\\s*)?(?:at\\s*\\(([^)]*)\\)\\s*)?${BRACED}`
  + '|(--)'
  + '|\\b(arc|plot|circle|ellipse|to|sin|cos|grid|rectangle)\\b'
  + '|\\(([^()]*)\\)'
  // A bare `-- cycle` is the standard TikZ spelling; `(cycle)` is not valid
  // TikZ and never appears. Without this the closing edge of every closed
  // polygon was dropped, so the first vertex read one arm short.
  + '|\\b(cycle)\\b',
  'g',
);

function labelPos(opts) {
  if (!opts) return null;
  if (/\bmidway\b/.test(opts)) return 0.5;
  const p = opts.match(/\bpos\s*=\s*([\d.]+)/);
  if (p) return Number(p[1]);
  if (/\bnear start\b/.test(opts)) return 0.25;
  if (/\bnear end\b/.test(opts)) return 0.75;
  return null;
}

// Walk every path statement once, producing:
//   segments          — every straight `--` link (curve ops break the chain)
//   labelledSegments  — inline `... -- (b) node[midway]{text}` labels, which
//                       bind a label to its segment SYNTACTICALLY, so no
//                       proximity heuristic is needed for them
//   freeNodes         — `\node ... at (x,y) {text}` labels, positioned only
export function parseFigure(body, named) {
  const segments = [];
  const labelledSegments = [];
  const freeNodes = [];

  const stmtRe = /\\(?:draw|path|fill|filldraw|node)\b([\s\S]*?);/g;
  let stmt;
  while ((stmt = stmtRe.exec(body)) !== null) {
    const path = stmt[0];
    let prev = null;        // previous path point
    let first = null;       // chain start, for `cycle`
    let pendingLink = false;
    let lastSeg = null;     // most recently completed segment (a node attaches here)
    let tok;
    TOKEN_RE.lastIndex = 0;
    while ((tok = TOKEN_RE.exec(path)) !== null) {
      const [, isNode, nodeOpts, , nodeAt, nodeText, isLink, curveOp, parenRaw, cycleRaw] = tok;
      const pointRaw = parenRaw ?? cycleRaw;
      if (isNode !== undefined) {
        if (nodeAt) {
          const at = resolvePoint(nodeAt, named);
          if (at) freeNodes.push({ at, text: nodeText });
        } else if (lastSeg) {
          labelledSegments.push({ seg: lastSeg, text: nodeText, pos: labelPos(nodeOpts) ?? 0.5 });
        }
        continue;
      }
      if (isLink !== undefined) { pendingLink = true; continue; }
      if (curveOp !== undefined) { prev = null; first = null; pendingLink = false; lastSeg = null; continue; }
      if (pointRaw === undefined) continue;

      const raw = pointRaw.trim();
      if (/^cycle$/i.test(raw)) {
        if (pendingLink && prev && first) {
          lastSeg = [prev, first];
          segments.push(lastSeg);
        }
        prev = first; pendingLink = false;
        continue;
      }
      const pt = resolvePoint(raw, named);
      if (pendingLink && prev && pt) {
        lastSeg = [prev, pt];
        segments.push(lastSeg);
      }
      pendingLink = false;
      if (pt) { prev = pt; if (!first) first = pt; }
    }
  }

  return {
    segments: segments.filter(([a, b]) => dist(a, b) > 1e-6),
    labelledSegments: labelledSegments.filter(({ seg }) => dist(seg[0], seg[1]) > 1e-6),
    freeNodes,
  };
}

// Centres of `(P) arc[start angle=a,end angle=b,radius=r]` operations. The arc
// begins at P, so its centre is P displaced by r opposite the start angle. An
// angle mark drawn as an arc names this point as its vertex even when no ray
// reaches it — exactly what the angle-arm audit must be able to see.
export function parseArcCentres(body, named) {
  const out = [];
  const re = /\(([^()]*)\)\s*arc\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const start = resolvePoint(m[1], named);
    if (!start) continue;
    const a = m[2].match(/start\s+angle\s*=\s*(-?[\d.]+)/);
    const r = m[2].match(/radius\s*=\s*(-?[\d.]+)/);
    if (!a || !r) continue;
    const rad = (Number(a[1]) * Math.PI) / 180;
    out.push([
      start[0] - Number(r[1]) * Math.cos(rad),
      start[1] - Number(r[1]) * Math.sin(rad),
    ]);
  }
  return out;
}

// A drawn edge is often subdivided by other endpoints landing on it: a base
// drawn as one `(0,0)--(20,0)` may carry two labels, "14 m" and "6 m", split
// by the foot of a cevian at (14,0). Comparing those labels against the whole
// 20-unit edge is a false positive, so every segment is cut at each endpoint
// lying on it and EVERY span between the resulting cut points becomes a
// candidate the label matcher may attach to.
const ON_SEGMENT_TOL = 0.02;

function pad3(p) {
  return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// Parameter t of P along AB when P lies on it, else null.
function paramOnSegment(p, a, b) {
  const P = pad3(p); const A = pad3(a); const B = pad3(b);
  const ab = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
  const ap = [P[0] - A[0], P[1] - A[1], P[2] - A[2]];
  const abLen = Math.hypot(...ab);
  if (abLen < 1e-9) return null;
  const perp = Math.hypot(...cross(ap, ab)) / abLen;
  if (perp > ON_SEGMENT_TOL) return null;
  const t = (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / (abLen * abLen);
  if (t < -1e-6 || t > 1 + 1e-6) return null;
  return Math.min(1, Math.max(0, t));
}

function lerp(a, b, t) {
  const n = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < n; i++) out.push((a[i] ?? 0) + ((b[i] ?? 0) - (a[i] ?? 0)) * t);
  return out;
}

export function candidateSpans(segments) {
  const spans = [];
  const endpoints = segments.flatMap(([a, b]) => [a, b]);
  for (const [a, b] of segments) {
    const cuts = [0, 1];
    for (const p of endpoints) {
      const t = paramOnSegment(p, a, b);
      if (t !== null && cuts.every((c) => Math.abs(c - t) > 1e-4)) cuts.push(t);
    }
    cuts.sort((x, y) => x - y);
    for (let i = 0; i < cuts.length; i++) {
      for (let j = i + 1; j < cuts.length; j++) {
        spans.push([lerp(a, b, cuts[i]), lerp(a, b, cuts[j])]);
      }
    }
  }
  return spans.filter(([a, b]) => dist(a, b) > 1e-6);
}

export function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
