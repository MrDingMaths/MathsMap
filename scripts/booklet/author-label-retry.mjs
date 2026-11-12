// Import pipeline v2, Stage 3: "every new TikZ diagram is compiled with the label-collision
// check; a diagram that fails goes back to the author once, before any review call sees it."
// Cambridge X11 Ch 5 (12 November 2026): 52-57 of 157 sample graphs failed Studio's label
// check, and explicit placement rules in the page notes barely moved it, because the author
// cannot see where a label lands. This runs Studio's own inspection on a validated
// assignment's TikZ and sends only the failing diagrams back to the author once, with the
// measured collisions, for a code-only fix. Remaining collisions are left for the sample
// and finish gates; nothing here accepts a diagram.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {recordAttempt} from './semantic-run-metrics.mjs';
import {withWorkerSlot} from './worker-pool.mjs';

export const LABEL_RETRY_RULES = [
 'Change label placement only: node anchors and positions, label offsets, and where dashed guide lines stop.',
 'Never remove, empty or change the text of any label: every label in the given code is source or answer-key content and must still be printed, with clear space around it.',
 'Keep every plotted curve, line, asymptote, point, domain, scale, colour declaration, metadata comment and special exactly as given, so the mathematics is unchanged.',
 'An intercept or tick label goes on the side of the axis the curve does not occupy near that point; a circle or ellipse intercept label goes outside the curve.',
 'Two tick labels on one axis closer than 0.6 cm apart: anchor them away from each other (one left of its tick, the other right) or stagger them above and below the axis.',
 'Point coordinates go diagonally into an empty region beside the point; equation and asymptote names go past the end of their line, clear of every other path.',
 'Dashed guide lines stop at the axis and never pass through a label.',
].join(' ');

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

export function labelRetryPrompt(failing) {
 return ['DIAGRAM LABEL REPAIR. You authored the TikZ diagrams below. Studio rendered each one and its label check found labels that a curve, line, asymptote, dashed guide or axis runs through, or labels that overlap. Positions are given as percentages of the rendered figure (0% across = left edge, 0% down = top edge).',
  LABEL_RETRY_RULES,
  'Return one JSON object and nothing else: {"diagrams":[{"id":"...","code":"..."}]} with the complete corrected TikZ code for every listed diagram, in the same order. Do not return any other field.',
  JSON.stringify(failing.map(row => ({id: row.id, issues: row.issues, code: row.code})))].join('\n\n');
}

// The default check: Studio's #/tikz-check page on 5173 (pedagogy/figure-label-check.mjs).
async function studioLabelCheck(rows, {name}) {
 const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
 const input = path.join(root, 'public', '.audit-input', `author-labels-${name}.json`);
 fs.mkdirSync(path.dirname(input), {recursive: true});
 fs.writeFileSync(input, JSON.stringify(rows.map(row => ({skillId: name, source: name, field: row.id, code: row.code}))));
 try { return await (await import('../../pedagogy/figure-label-check.mjs')).labelCollisions(input); }
 finally { fs.rmSync(input, {force: true}); }
}

// Printed maths in a diagram ($...$ strings, whitespace-insensitive). A retry may move labels, never lose one.
const printedMaths = code => (code.match(/\$[^$]*\$/g) ?? []).map(text => text.replace(/\s+/g, ''));
export function droppedLabels(before, after) {
 const left = printedMaths(after);
 return printedMaths(before).filter(text => { const i = left.indexOf(text); if (i < 0) return true; left.splice(i, 1); return false; });
}
const collisions = (rows, found) => rows.map(row => ({id: row.id, code: row.code, issues: (found?.[row.id]?.issues ?? []).map(String)})).filter(row => row.issues.length);

// Mutates packets in place (only the code of diagrams the retry returned) and returns a record.
export async function retryDiagramLabels({packets, runDir, assignmentId, pages, attempt, out, runner, configuration, check = studioLabelCheck, log = () => {}, workerSlotOptions}) {
 const rows = packetTikz(packets);
 if (!rows.length) return {checked: 0, failing: [], retried: false};
 const record = file => { fs.writeFileSync(path.join(out, 'label-retry.json'), JSON.stringify(file, null, 2)); return file; };
 let first;
 try { first = await check(rows, {name: assignmentId}); }
 catch (error) { log('Author label check skipped (Studio unavailable): ' + error.message); return record({checked: rows.length, skipped: error.message, failing: [], retried: false}); }
 const failing = collisions(rows, first);
 if (!failing.length) return record({checked: rows.length, failing: [], retried: false});
 const dir = path.join(out, 'label-retry');
 const prompt = labelRetryPrompt(failing);
 const events = recordAttempt(path.join(runDir, 'semantic-packets'), {stage: 'author-labels', page: pages[0], pages, assignmentId, attempt, retryReason: 'label-collisions'});
 let ok = false, error, metrics, applied = [];
 const refused = [];
 try {
  events.phase('generation');
  const reply = await withWorkerSlot(runDir, {stage: 'author-labels', assignmentId}, () => runner({cwd: runDir, runDir, configuration, prompt, images: [], out: dir}), workerSlotOptions);
  metrics = reply.metrics; events.end({metrics});
  fs.writeFileSync(path.join(dir, 'generation.json'), JSON.stringify(reply.result, null, 2));
  const byId = new Map(rows.map(row => [row.id, row]));
  for (const item of reply.result?.diagrams ?? []) {
   const node = byId.get(item?.id);
   if (!node || typeof item.code !== 'string' || !/\\begin\{tikzpicture\}/.test(item.code) || !failing.some(row => row.id === item.id) || applied.includes(item.id)) continue;
   const dropped = droppedLabels(node.code, item.code);
   if (dropped.length) { refused.push({id: item.id, dropped}); continue; }
   node.code = item.code; applied.push(item.id);
  }
  ok = true;
 } catch (e) { error = e.message; metrics ??= e.metrics; log('Author label retry failed; keeping the authored diagrams: ' + e.message); }
 finally { events.finish({ok, error, metrics}); }
 let remaining = failing.map(row => ({id: row.id, issues: row.issues})), reverted = [];
 const revert = ids => { for (const id of ids) { const row = failing.find(f => f.id === id); rows.find(r => r.id === id).code = row.code; reverted.push(id); } };
 if (applied.length) {
  try {
   const changed = rows.filter(row => applied.includes(row.id)), found = await check(changed, {name: assignmentId + '-retry'});
   // A diagram missing from the result did not compile: keep the authored code.
   revert(applied.filter(id => !found?.[id]));
   const after = collisions(changed.filter(row => !reverted.includes(row.id)), found);
   remaining = [...failing.filter(row => !applied.includes(row.id) || reverted.includes(row.id)), ...after].map(row => ({id: row.id, issues: row.issues}));
  } catch (e) { revert(applied); log('Author label recheck skipped; keeping the authored diagrams: ' + e.message); }
 }
 return record({checked: rows.length, failing: failing.map(row => ({id: row.id, issues: row.issues})), retried: true, ok, error, applied: applied.filter(id => !reverted.includes(id)), reverted, refused, remaining});
}
