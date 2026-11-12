// Import pipeline v2, Stage 3: "every new TikZ diagram is compiled with the label-collision
// check; a diagram that fails is fixed before any review call sees it."
// Cambridge X11 Ch 5 (12 November 2026): 52-57 of 157 sample graphs failed Studio's label
// check. Placement rules in the page notes barely moved it, and a model retry (one code-only
// author call per assignment) fixed most but cost 18 calls and once emptied a printed label.
// Since 13 November 2026 (simplification plan item 1) the failing diagrams go through
// deterministic label placement instead (diagram-label-placer.mjs): no model call, label text
// and strokes unchanged by construction and checked on the render. Remaining collisions are
// left for the sample and finish gates; nothing here accepts a diagram.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Every authored TikZ node with an id, in packet order.
export function packetTikz(packets) {
 const rows = [];
 const walk = node => {
  if (Array.isArray(node)) return node.forEach(walk);
  if (!node || typeof node !== 'object') return;
  if (node.format === 'tikz' && typeof node.code === 'string' && node.id) rows.push(node);
  for (const value of Object.values(node)) walk(value);
 };
 walk(packets);
 return rows;
}

// The default check: Studio's #/tikz-check page on 5173 (pedagogy/figure-label-check.mjs).
async function studioLabelCheck(rows, {name}) {
 const root = process.env.MATHSMAP_STUDIO_ROOT ? path.resolve(process.env.MATHSMAP_STUDIO_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
 const input = path.join(root, 'public', '.audit-input', `author-labels-${name}.json`);
 fs.mkdirSync(path.dirname(input), {recursive: true});
 fs.writeFileSync(input, JSON.stringify(rows.map(row => ({skillId: name, source: name, field: row.id, code: row.code}))));
 try { return await (await import('../../pedagogy/figure-label-check.mjs')).labelCollisions(input, {publicRoot: path.join(root, 'public')}); }
 finally { fs.rmSync(input, {force: true}); }
}
const studioPlacement = async (rows, {log}) => (await import('./diagram-label-placer.mjs')).placeDiagramLabels(rows, {log});

// Printed maths in a diagram ($...$ strings, whitespace-insensitive). Placement may move labels, never lose one.
const printedMaths = code => (code.match(/\$[^$]*\$/g) ?? []).map(text => text.replace(/\s+/g, ''));
export function droppedLabels(before, after) {
 const left = printedMaths(after);
 return printedMaths(before).filter(text => { const i = left.indexOf(text); if (i < 0) return true; left.splice(i, 1); return false; });
}
const collisions = (rows, found) => rows.map(row => ({id: row.id, code: row.code, issues: (found?.[row.id]?.issues ?? []).map(String)})).filter(row => row.issues.length);

// Mutates packets in place (only the code of diagrams placement changed) and returns a record,
// written to label-retry.json beside the attempt.
export async function retryDiagramLabels({packets, assignmentId, out, check = studioLabelCheck, place = studioPlacement, log = () => {}}) {
 // A question that crosses a page break has one copy per page packet, with the same diagram ids.
 // Check and place each diagram once and write the result to every copy, so the copies stay
 // identical (Mastering Ch 3: placing only the first copy failed "Continuation copies disagree").
 const copies = packetTikz(packets), rows = [...new Map(copies.map(node => [node.id, node])).values()];
 if (!rows.length) return {checked: 0, failing: [], placed: false};
 const record = file => { fs.writeFileSync(path.join(out, 'label-retry.json'), JSON.stringify(file, null, 2)); return file; };
 let first;
 try { first = await check(rows, {name: assignmentId}); }
 catch (error) { log('Author label check skipped (Studio unavailable): ' + error.message); return record({checked: rows.length, skipped: error.message, failing: [], placed: false}); }
 const failing = collisions(rows, first);
 if (!failing.length) return record({checked: rows.length, failing: [], placed: false});
 let result, error;
 try { result = await place(failing.map(row => ({id: row.id, code: row.code})), {log}); }
 catch (e) { error = e.message; log('Author label placement skipped; keeping the authored diagrams: ' + e.message); }
 const applied = [], refused = [];
 for (const row of result?.results ?? []) {
  if (!row.changed) continue;
  const node = rows.find(r => r.id === row.id);
  const dropped = node ? droppedLabels(node.code, row.code) : [];
  // Placement keeps every node's text; a loop split substitutes its variable, so compare rendered texts there.
  if (dropped.length && !/\\foreach/.test(node.code)) { refused.push({id: row.id, dropped}); continue; }
  for (const copy of copies) if (copy.id === row.id) copy.code = row.code;
  applied.push(row.id);
 }
 // Still colliding: every failing diagram placement did not change, and any it changed but could not fully clear.
 const after = new Map((result?.results ?? []).map(row => [row.id, row.after]));
 const remaining = failing.filter(row => !applied.includes(row.id) || after.get(row.id) > 0).map(row => ({id: row.id, issues: row.issues}));
 return record({checked: rows.length, failing: failing.map(row => ({id: row.id, issues: row.issues})), placed: true, ok: !error, error, applied, refused, remaining, seconds: result?.seconds, renders: result?.renders});
}
