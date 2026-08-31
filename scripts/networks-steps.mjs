// Wave 3 (W3-2R): deterministic per-step network diagram emitter.
//
// The booklet teaches Prim's algorithm and Dijkstra's algorithm as a SEQUENCE of network
// diagrams — the same graph redrawn once per step with the tree, or the vertex labels, grown
// so far (Networks Paths Trees 2, "Step 1: Choose A  Step 2: Connect AB …"). Reproducing that
// setout across the six networks skills means ~250 near-identical pictures, which is exactly
// the kind of work a model should not be hand-drawing: every step diagram must reuse its
// question figure's coordinates EXACTLY or the sequence stops reading as one graph redrawn.
//
// So the model returns the step SEQUENCE as data and this file draws it:
//
//   solution_text carries a bare `[[STEP]]` line wherever a diagram belongs;
//   the repair object carries `steps: [{bold, labels}]`, one entry per marker, in order.
//
// Each marker is replaced by a rendered [tikz]…[/tikz] block. Everything else about the
// result — {skillId, repairs:[{target, replacement}]} — is left alone, so the rendered file
// goes through scripts/agy/apply-repairs.mjs unchanged.
//
//   node scripts/networks-steps.mjs --tasks-dir .agywork/W3-2R/setout [--check]
//
// --check renders and reports without rewriting the result files.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseResultFile } from './agy/lib/agy-run.mjs';

export const TREE_EDGE_STYLE = 'line width=1.6pt';
export const LABEL_NODE_STYLE = 'circle, draw, fill=white, minimum size=7mm, inner sep=0pt';
export const STEP_MARKER = '[[STEP]]';

const ANCHOR_OFFSET = '4mm';

// ---------------------------------------------------------------------------
// Figure parsing
// ---------------------------------------------------------------------------

// A chained path `\draw (A) -- (B) -- (C);` carries no weight labels, so it is safe to
// expand into one \draw per edge before parsing. identify-trees-spanning-trees writes its
// unweighted graphs this way.
export function expandChainedDraws(code) {
  return String(code).split('\n').map((line) => {
    const t = line.trim();
    const m = /^\\draw(\[[^\]]*\])?\s*((?:\(\w+\)\s*--\s*)+\(\w+\))\s*;$/.exec(t);
    if (!m) return line;
    const opts = m[1] || '';
    const names = [...m[2].matchAll(/\((\w+)\)/g)].map((x) => x[1]);
    if (names.length < 3) return line;
    const out = [];
    for (let i = 0; i + 1 < names.length; i++) out.push(`\\draw${opts} (${names[i]}) -- (${names[i + 1]});`);
    return out.join('\n');
  }).join('\n');
}

const RE_BEGIN = /^\\begin\{tikzpicture\}(\[.*\])?$/;
const RE_COORD = /^\\coordinate \((\w+)\) at \(([-0-9.]+),([-0-9.]+)\);$/;
const RE_EDGE = /^\\draw(?:\[([^\]]*)\])? \((\w+)\) -- \((\w+)\)(?: (node\[[^\]]*\] \{.*\}))?;$/;
const RE_VERTEX = /^\\fill \((\w+)\) circle \(([0-9.]+pt)\) node\[([^\]]*)\] \{(.*)\};$/;

// Parse a networks figure into its parts. Coordinate lines are kept VERBATIM so a re-emitted
// step diagram is byte-identical to the question figure in the one respect that matters
// (tikz-prompt NEVER-DO #10 — never guess a coordinate).
export function parseNetworkFigure(code) {
  const lines = expandChainedDraws(code).split('\n').map((l) => l.trim()).filter(Boolean);
  const fig = { options: '', preamble: [], coordLines: [], coords: new Map(), edges: [], vertices: [] };
  let seenBegin = false;
  for (const line of lines) {
    const b = RE_BEGIN.exec(line);
    if (b) { fig.options = b[1] || ''; seenBegin = true; continue; }
    if (line === '\\end{tikzpicture}') continue;
    if (!seenBegin) throw new Error('figure does not open with \\begin{tikzpicture}');
    if (line.startsWith('\\usetikzlibrary') || line.startsWith('\\tikzset')) { fig.preamble.push(line); continue; }
    const c = RE_COORD.exec(line);
    if (c) { fig.coordLines.push(line); fig.coords.set(c[1], { x: Number(c[2]), y: Number(c[3]) }); continue; }
    const e = RE_EDGE.exec(line);
    if (e) { fig.edges.push({ opts: e[1] || '', a: e[2], b: e[3], label: e[4] || '' }); continue; }
    const v = RE_VERTEX.exec(line);
    if (v) { fig.vertices.push({ name: v[1], radius: v[2], anchor: v[3], text: v[4] }); continue; }
    throw new Error(`unparseable figure line: ${line}`);
  }
  if (!fig.coords.size) throw new Error('figure declares no \\coordinate vertices');
  if (!fig.edges.length) throw new Error('figure declares no edges');
  return fig;
}

// ---------------------------------------------------------------------------
// Step rendering
// ---------------------------------------------------------------------------

export function edgeKey(a, b) {
  return [a, b].sort().join('-');
}

// Accepts "AB", "A-B", "A–B" and ["A","B"].
export function normaliseEdgeRef(ref, coords) {
  if (Array.isArray(ref) && ref.length === 2) return edgeKey(String(ref[0]), String(ref[1]));
  const s = String(ref).trim();
  const split = s.split(/[-–—,\s]+/).filter(Boolean);
  if (split.length === 2) return edgeKey(split[0], split[1]);
  if (coords) {
    // Bare "AB" / "M1M5": split at the boundary that yields two known vertices.
    for (let i = 1; i < s.length; i++) {
      const a = s.slice(0, i);
      const b = s.slice(i);
      if (coords.has(a) && coords.has(b)) return edgeKey(a, b);
    }
  }
  throw new Error(`cannot read edge reference "${ref}"`);
}

function withStyle(opts, extra) {
  return opts ? `[${opts}, ${extra}]` : `[${extra}]`;
}

// A step diagram is denser than the question figure it comes from — tree edges thicken and, in
// the Dijkstra variant, a 7mm circle lands on every vertex. A weight label with no backing then
// reads as if it belongs to whatever it happens to sit on. House style already backs crossing
// weights with white; in a step diagram every weight gets it.
export function backWeightLabel(label) {
  if (!label || /fill\s*=/.test(label)) return label;
  return label.replace(/^node\[([^\]]*)\]/, 'node[$1, fill=white, inner sep=1pt]');
}

// Two vertices closer than this cannot both carry a 7mm label circle and a name without
// colliding. Model-authored baseFigures for 8+ vertex networks are where this bites.
export const MIN_VERTEX_SEPARATION_CM = 1.2;

// The booklet's own sequences run to six figures; past that a flip card becomes a scroll.
// Soft — a seventh diagram is reported, not rejected.
export const MAX_STEPS_PER_ITEM = 6;

// A vertex in a step diagram occupies a 7mm circle plus a name pushed 4mm clear of it, so an
// edge or a weight label that strays inside this radius lands on top of it.
export const VERTEX_CLEARANCE_CM = 0.6;

// Where a vertex's NAME sits, derived from its anchor. The name is the part of a vertex that
// reaches furthest from its coordinate, so a weight can clear the vertex centre comfortably and
// still land on the letter — the `5D` collision that a centre-only check misses.
const ANCHOR_DIRECTION = {
  left: [-1, 0], right: [1, 0], above: [0, 1], below: [0, -1],
  'above left': [-0.7, 0.7], 'above right': [0.7, 0.7],
  'below left': [-0.7, -0.7], 'below right': [0.7, -0.7],
};
export const NAME_OFFSET_CM = 0.45;
export const NAME_CLEARANCE_CM = 0.5;

export function namePosition(coord, anchor) {
  const dir = ANCHOR_DIRECTION[String(anchor).trim()];
  if (!dir) return null;
  return { x: coord.x + dir[0] * NAME_OFFSET_CM, y: coord.y + dir[1] * NAME_OFFSET_CM };
}

function distanceToSegment(p, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (!len2) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

// Two weights this close overlap outright; and a weight sitting on an edge
// that is not its own erases part of that edge with its white fill.
export const WEIGHT_SEPARATION_CM = 0.55;
export const WEIGHT_OFF_EDGE_CM = 0.3;

// Where a weight label sits: the edge midpoint, or `pos=p` along it.
function weightPosition(fig, e) {
  if (!e.label) return null;
  const a = fig.coords.get(e.a);
  const b = fig.coords.get(e.b);
  if (!a || !b) return null;
  const m = /pos=([0-9.]+)/.exec(e.label);
  const t = m ? Number(m[1]) : 0.5;
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
}

export function findCrowdedVertices(fig) {
  const names = [...fig.coords.keys()];
  const faults = [];

  const weighted = fig.edges.map((e) => ({ e, at: weightPosition(fig, e) })).filter((w) => w.at);
  for (let i = 0; i < weighted.length; i++) {
    for (let j = i + 1; j < weighted.length; j++) {
      const d = Math.hypot(weighted[i].at.x - weighted[j].at.x, weighted[i].at.y - weighted[j].at.y);
      if (d < WEIGHT_SEPARATION_CM) {
        faults.push(`weights on ${weighted[i].e.a}-${weighted[i].e.b} and ${weighted[j].e.a}-${weighted[j].e.b} sit ${d.toFixed(2)}cm apart`);
      }
    }
    for (const other of fig.edges) {
      const { e, at } = weighted[i];
      if (other === e) continue;
      const a = fig.coords.get(other.a);
      const b = fig.coords.get(other.b);
      if (!a || !b) continue;
      const d = distanceToSegment(at, a, b);
      if (d < WEIGHT_OFF_EDGE_CM) faults.push(`weight on ${e.a}-${e.b} sits on edge ${other.a}-${other.b}`);
    }
  }
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = fig.coords.get(names[i]);
      const b = fig.coords.get(names[j]);
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < MIN_VERTEX_SEPARATION_CM) faults.push(`${names[i]}/${names[j]} only ${d.toFixed(2)}cm apart`);
    }
  }
  for (const e of fig.edges) {
    const a = fig.coords.get(e.a);
    const b = fig.coords.get(e.b);
    if (!a || !b) continue;
    for (const name of names) {
      if (name === e.a || name === e.b) continue;
      const d = distanceToSegment(fig.coords.get(name), a, b);
      if (d < VERTEX_CLEARANCE_CM) faults.push(`edge ${e.a}-${e.b} passes ${d.toFixed(2)}cm from vertex ${name}`);
    }
    if (!e.label) continue;
    // A `midway` weight sits at the edge midpoint; `pos=p` scales along it.
    const posMatch = /pos=([0-9.]+)/.exec(e.label);
    const t = posMatch ? Number(posMatch[1]) : 0.5;
    const mid = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    for (const name of names) {
      const d = Math.hypot(mid.x - fig.coords.get(name).x, mid.y - fig.coords.get(name).y);
      if (d < VERTEX_CLEARANCE_CM) faults.push(`weight on ${e.a}-${e.b} sits ${d.toFixed(2)}cm from vertex ${name}`);
    }
    for (const v of fig.vertices) {
      const at = namePosition(fig.coords.get(v.name), v.anchor);
      if (!at) continue;
      const d = Math.hypot(mid.x - at.x, mid.y - at.y);
      if (d < NAME_CLEARANCE_CM) faults.push(`weight on ${e.a}-${e.b} sits ${d.toFixed(2)}cm from the name of vertex ${v.name}`);
    }
  }
  return faults;
}

// Render one step of the sequence.
//   bold   — edge refs already selected into the tree/path; drawn thick, never deleted.
//   labels — Dijkstra running totals per vertex. Present ⇒ every vertex becomes a booklet
//            "empty circle"; a vertex absent from the map (or null) stays empty.
export function emitStep(fig, { bold = [], labels = null } = {}) {
  const boldSet = new Set(bold.map((r) => normaliseEdgeRef(r, fig.coords)));
  const seen = new Set();
  const out = [`\\begin{tikzpicture}${fig.options}`, ...fig.preamble, ...fig.coordLines];

  for (const e of fig.edges) {
    const key = edgeKey(e.a, e.b);
    seen.add(key);
    const opts = boldSet.has(key) ? withStyle(e.opts, TREE_EDGE_STYLE) : (e.opts ? `[${e.opts}]` : '');
    const label = backWeightLabel(e.label);
    out.push(`\\draw${opts} (${e.a}) -- (${e.b})${label ? ` ${label}` : ''};`);
  }
  for (const key of boldSet) {
    if (!seen.has(key)) throw new Error(`step names edge ${key}, which is not in the figure`);
  }

  // Vertices are drawn last so their white fill covers the edge ends beneath them.
  for (const v of fig.vertices) {
    if (!labels) { out.push(`\\fill (${v.name}) circle (${v.radius}) node[${v.anchor}] {${v.text}};`); continue; }
    const raw = Object.prototype.hasOwnProperty.call(labels, v.name) ? labels[v.name] : null;
    const inner = raw === null || raw === undefined || raw === '' ? '' : `$${String(raw).replace(/^\$/, '').replace(/\$$/, '')}$`;
    out.push(`\\node[${LABEL_NODE_STYLE}] at (${v.name}) {${inner}};`);
    out.push(`\\node[${v.anchor}=${ANCHOR_OFFSET}] at (${v.name}) {${v.text}};`);
  }
  if (labels) {
    for (const name of Object.keys(labels)) {
      if (!fig.vertices.some((v) => v.name === name)) throw new Error(`step labels vertex ${name}, which the figure never draws`);
    }
  }
  out.push('\\end{tikzpicture}');
  return out.join('\n');
}

export function tikzBlock(code) {
  return `[tikz]\n${code}\n[/tikz]`;
}

// Replace each bare `[[STEP]]` line in solution_text with its rendered diagram.
export function renderSolution(solutionText, fig, steps) {
  const lines = String(solutionText).split('\n');
  const markers = lines.filter((l) => l.trim() === STEP_MARKER).length;
  if (markers !== steps.length) {
    throw new Error(`solution_text has ${markers} ${STEP_MARKER} marker(s) but ${steps.length} step(s) were supplied`);
  }
  let i = 0;
  return lines.map((l) => (l.trim() === STEP_MARKER ? tikzBlock(emitStep(fig, steps[i++])) : l)).join('\n');
}

export function figureFromQuestion(questionText) {
  const m = /\[tikz\]([\s\S]*?)\[\/tikz\]/.exec(String(questionText || ''));
  return m ? m[1].trim() : null;
}

// The figure a step sequence must be drawn from, in priority order:
//   1. the replacement's own question figure;
//   2. the LIVE question figure in public/ — an item can gain one from the question-figure lane
//      after its step diagrams were already drawn from a `baseFigure`, and then the two layouts
//      disagree and the sequence stops reading as one graph redrawn;
//   3. the model-authored `baseFigure`, for an item whose question states the network in prose.
// A real question figure always wins: it is what the student is looking at.
export function stepFigureSource(rootDir, skillId, repair) {
  const fromReplacement = figureFromQuestion(repair.replacement?.question_text);
  if (fromReplacement) return { code: fromReplacement, origin: 'replacement question figure' };
  const t = repair.target || {};
  try {
    const file = path.join(rootDir, 'public', t.file === 'quiz' ? 'quizzes' : 'content', `${skillId}.json`);
    const live = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
    const item = t.file === 'quiz'
      ? (live.questions || []).find((q) => q.id === t.itemId)
      : live.practice?.[t.tier]?.[t.index];
    const fromLive = figureFromQuestion(item?.question_text);
    if (fromLive) return { code: fromLive, origin: 'live question figure' };
  } catch { /* fall through to baseFigure */ }
  if (repair.baseFigure) return { code: repair.baseFigure, origin: 'baseFigure' };
  return null;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function main() {
  const tasksDirArg = arg('--tasks-dir', '');
  const check = process.argv.includes('--check');
  if (!tasksDirArg) {
    console.error('usage: node scripts/networks-steps.mjs --tasks-dir <dir> [--check]');
    process.exit(2);
  }
  const tasksDir = path.resolve(tasksDirArg);

  const files = fs.readdirSync(tasksDir).filter((f) => /^task-\d+\.result\.json$/.test(f)).sort();
  if (!files.length) { console.error(`✗ no task-*.result.json files in ${tasksDir}`); process.exit(1); }

  let rendered = 0;
  let failed = 0;
  const layoutDefects = [];
  for (const rf of files) {
    const full = path.join(tasksDir, rf);
    let result;
    try { result = parseResultFile(full); } catch (error) { console.error(`✗ ${rf}: unparseable — ${error.message}`); failed++; continue; }
    const { skillId, repairs } = result;
    if (!Array.isArray(repairs)) { console.error(`✗ ${rf}: missing repairs`); failed++; continue; }

    let touched = false;
    for (const r of repairs) {
      const sol = r.replacement?.solution_text;
      if (typeof sol !== 'string' || !sol.includes(STEP_MARKER)) continue; // Lane B/C — nothing to render
      const address = r.target?.file === 'quiz' ? `quiz ${r.target.itemId}` : `practice.${r.target?.tier}[${r.target?.index}]`;
      try {
        const source = stepFigureSource(rootDir, skillId, r);
        if (!source) throw new Error('no base figure: the item has no question figure and the result supplied no baseFigure');
        const fig = parseNetworkFigure(source.code);
        // Only a model-authored layout can be crowded; a question figure is already shipped
        // and audited, so flag it as a warning rather than failing a whole item over it.
        const crowded = findCrowdedVertices(fig);
        if (crowded.length) {
          const msg = `layout too crowded for a step diagram — ${crowded.join('; ')}`;
          if (source.origin === 'baseFigure') {
            layoutDefects.push({ skillId, task: rf, target: r.target, address, faults: crowded });
            throw new Error(`${msg}. Redraw baseFigure: keep vertices ${MIN_VERTEX_SEPARATION_CM}cm apart and every edge and weight ${VERTEX_CLEARANCE_CM}cm clear of any other vertex.`);
          }
          console.warn(`  ! ${skillId} ${address}: ${msg} (inherited from the question figure — not blocking)`);
        }
        r.replacement.solution_text = renderSolution(sol, fig, r.steps || []);
        rendered++;
        touched = true;
        const count = (r.steps || []).length;
        console.log(`✓ ${skillId} ${address}: ${count} step diagram(s)`);
        if (count > MAX_STEPS_PER_ITEM) console.warn(`  ! ${skillId} ${address}: ${count} diagrams exceeds the ${MAX_STEPS_PER_ITEM}-diagram sequence cap`);
      } catch (error) {
        console.error(`✗ ${skillId} ${address}: ${error.message}`);
        failed++;
      }
    }
    if (touched && !check) fs.writeFileSync(full, JSON.stringify(result, null, 2) + '\n');
  }

  console.log(`\n${rendered} item(s) rendered, ${failed} failed${check ? ' (check only, nothing written)' : ''}`);
  if (layoutDefects.length) {
    const defectsFile = path.join(tasksDir, 'layout-defects.json');
    fs.writeFileSync(defectsFile, JSON.stringify({ layoutDefects }, null, 2) + '\n');
    const tasks = [...new Set(layoutDefects.map((d) => d.task))].join(' ');
    console.log(`\n${layoutDefects.length} model-authored baseFigure(s) rejected — see ${defectsFile}`);
    console.log(`retry: delete the result file(s) for ${tasks} and rerun run-gen.mjs on this dir`);
  }
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
