// Import v2 Stage 3: failing TikZ labels are placed deterministically (scripts/booklet/author-label-retry.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {retryDiagramLabels,packetTikz,droppedLabels} from '../scripts/booklet/author-label-retry.mjs';

const tikz = body => '\\begin{tikzpicture}' + body + '\\end{tikzpicture}';
const packets = () => [{pageNumber: 1, sections: [{blocks: [{id: 'q1', content: {children: [
 {id: 'a', answer: {solutionDiagrams: [{id: 'd-bad', format: 'tikz', code: tikz('\\node at (0,0) {1};')}]}},
 {id: 'b', answer: {solutionDiagrams: [{id: 'd-ok', format: 'tikz', code: tikz('\\node at (2,0) {2};')}]}},
 {id: 'c', answer: {solutionDiagrams: [{id: 'd-stuck', format: 'tikz', code: tikz('\\node at (4,0) {3};')}]}}]}}]}]}];
const fixture = () => {
 const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'label-retry-'));
 const out = path.join(runDir, 'semantic-packets', 'assignments', 'a1', '1');
 fs.mkdirSync(out, {recursive: true});
 return {runDir, out};
};
const collide = ['a curve or line runs through the label 10% across and 50% down (middle-left)'];

test('only failing diagrams are placed; changed code is kept, unplaced ones remain; no model call or attempt event', async () => {
 const {runDir, out} = fixture(), data = packets(), placed = [];
 const check = async rows => Object.fromEntries(rows.map(r => [r.id, {issues: r.id === 'd-ok' ? [] : collide}]));
 const place = async rows => { placed.push(...rows.map(r => r.id)); return {seconds: 1, renders: 4, results: [
  {id: 'd-bad', before: 1, after: 0, changed: true, code: tikz('\\node[anchor=north east] at (0,0) {1};')},
  {id: 'd-stuck', before: 1, after: 1, changed: false, code: tikz('\\node at (4,0) {3};'), reverted: 'not fewer collisions'}]}; };
 const result = await retryDiagramLabels({packets: data, assignmentId: 'a1', out, check, place});
 assert.deepEqual(placed, ['d-bad', 'd-stuck']);
 const byId = Object.fromEntries(packetTikz(data).map(n => [n.id, n.code]));
 assert.match(byId['d-bad'], /anchor=north east/);
 assert.equal(byId['d-ok'], tikz('\\node at (2,0) {2};'));
 assert.equal(byId['d-stuck'], tikz('\\node at (4,0) {3};'));
 assert.deepEqual(result.applied, ['d-bad']);
 assert.deepEqual(result.remaining.map(r => r.id), ['d-stuck']);
 assert.equal(result.placed, true);
 assert.ok(fs.existsSync(path.join(out, 'label-retry.json')));
 assert.equal(fs.existsSync(path.join(runDir, 'semantic-packets', 'attempt-events.jsonl')), false, 'no model attempt is recorded');
});

test('a clean assignment places nothing, and an unavailable Studio is skipped', async () => {
 const {out} = fixture();
 let calls = 0;
 const place = async () => { calls++; return {results: []}; };
 const clean = await retryDiagramLabels({packets: packets(), assignmentId: 'a1', out, place, check: async rows => Object.fromEntries(rows.map(r => [r.id, {issues: []}]))});
 assert.equal(clean.placed, false); assert.equal(calls, 0);
 const skipped = await retryDiagramLabels({packets: packets(), assignmentId: 'a1', out, place, check: async () => { throw Error('connect ECONNREFUSED'); }});
 assert.match(skipped.skipped, /ECONNREFUSED/); assert.equal(calls, 0);
});

test('a failed placement keeps every authored diagram', async () => {
 const {out} = fixture(), data = packets(), before = packetTikz(data).map(n => n.code);
 const result = await retryDiagramLabels({packets: data, assignmentId: 'a1', out,
  place: async () => { throw Error('browser crashed'); },
  check: async rows => Object.fromEntries(rows.map(r => [r.id, {issues: ['a label overlaps another label']}]))});
 assert.equal(result.ok, false); assert.deepEqual(packetTikz(data).map(n => n.code), before);
 assert.equal(result.remaining.length, 3);
});

test('placed code that drops a printed label is refused and the authored diagram kept', async () => {
 const {out} = fixture();
 const data = [{pageNumber: 1, sections: [{blocks: [{id: 'q', content: {questionDiagrams: [{id: 'h', format: 'tikz', code: tikz('\\node at (0,-3) {$-3$};\\node at (0,-4) {$-4$};')}]}}]}]}];
 const result = await retryDiagramLabels({packets: data, assignmentId: 'a1', out,
  place: async () => ({results: [{id: 'h', before: 1, after: 0, changed: true, code: tikz('\\node at (0,-3) {};\\node[left] at (0,-4) {$-4$};')}]}),
  check: async rows => Object.fromEntries(rows.map(r => [r.id, {issues: collide}]))});
 assert.deepEqual(result.refused, [{id: 'h', dropped: ['$-3$']}]);
 assert.deepEqual(result.applied, []); assert.equal(result.remaining.length, 1);
 assert.match(packetTikz(data)[0].code, /\$-3\$/);
 assert.deepEqual(droppedLabels(tikz('$1$ $2$'), tikz('$2$ $ 1 $')), []);
});

test('a question copied on two pages is placed once and both copies get the placed code', async () => {
 const {out} = fixture();
 const block = () => ({id: 'q5', content: {children: [{id: 'a', answer: {solutionDiagrams: [{id: 'd-cross', format: 'tikz', code: tikz('\\node at (0,0) {1};')}]}}]}});
 const data = [{pageNumber: 19, sections: [{blocks: [block()]}]}, {pageNumber: 20, sections: [{blocks: [block()]}]}];
 const checked = [], placed = [];
 const check = async rows => { checked.push(...rows.map(r => r.id)); return Object.fromEntries(rows.map(r => [r.id, {issues: collide}])); };
 const place = async rows => { placed.push(...rows.map(r => r.id)); return {results: [{id: 'd-cross', before: 1, after: 0, changed: true, code: tikz('\\node[anchor=north] at (0,0) {1};')}]}; };
 await retryDiagramLabels({packets: data, assignmentId: 'a2', out, check, place});
 assert.deepEqual(checked, ['d-cross']);assert.deepEqual(placed, ['d-cross']);
 assert.deepEqual(packetTikz(data).map(n => n.code), [tikz('\\node[anchor=north] at (0,0) {1};'), tikz('\\node[anchor=north] at (0,0) {1};')], 'both page copies stay identical');
});
