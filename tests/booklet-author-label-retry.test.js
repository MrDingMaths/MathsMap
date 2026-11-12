// Import v2 Stage 3: failing TikZ labels go back to the author once (scripts/booklet/author-label-retry.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {retryDiagramLabels,labelRetryPrompt,packetTikz} from '../scripts/booklet/author-label-retry.mjs';

const tikz = body => '\\begin{tikzpicture}' + body + '\\end{tikzpicture}';
const packets = () => [{pageNumber: 1, sections: [{blocks: [{id: 'q1', content: {children: [
 {id: 'a', answer: {solutionDiagrams: [{id: 'd-bad', format: 'tikz', code: tikz('\\node at (0,0) {1};')}]}},
 {id: 'b', answer: {solutionDiagrams: [{id: 'd-ok', format: 'tikz', code: tikz('\\node at (2,0) {2};')}]}},
 {id: 'c', answer: {solutionDiagrams: [{id: 'd-broken', format: 'tikz', code: tikz('\\node at (4,0) {3};')}]}}]}}]}]}];
const fixture = () => {
 const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'label-retry-'));
 const out = path.join(runDir, 'semantic-packets', 'assignments', 'a1', '1');
 fs.mkdirSync(out, {recursive: true});
 return {runDir, out};
};
const events = runDir => fs.readFileSync(path.join(runDir, 'semantic-packets', 'attempt-events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);

test('only failing diagrams go back once; fixed code is kept, uncompilable code is reverted', async () => {
 const {runDir, out} = fixture(), data = packets(), prompts = [];
 const check = async rows => Object.fromEntries(rows.filter(r => !r.code.includes('BROKEN')).map(r => [r.id, {issues: r.code.includes('\\node at (0,0) {1}') || r.code.includes('\\node at (4,0) {3}') ? ['a curve or line runs through the label 10% across and 50% down (middle-left)'] : []}]));
 const runner = async ({prompt, out: dir}) => { prompts.push(prompt); fs.mkdirSync(dir, {recursive: true}); return {result: {diagrams: [
  {id: 'd-bad', code: tikz('\\node[below left] at (0,0) {1};')}, {id: 'd-broken', code: tikz('BROKEN')}, {id: 'd-ok', code: tikz('should not apply')}]}, metrics: {provider: 'test'}}; };
 const result = await retryDiagramLabels({packets: data, runDir, assignmentId: 'a1', pages: [1], attempt: 1, out, runner, configuration: {}, check});
 assert.equal(prompts.length, 1);
 assert.match(prompts[0], /d-bad/); assert.match(prompts[0], /d-broken/); assert.doesNotMatch(prompts[0], /"id":"d-ok"/);
 const byId = Object.fromEntries(packetTikz(data).map(n => [n.id, n.code]));
 assert.match(byId['d-bad'], /below left/);
 assert.equal(byId['d-broken'], tikz('\\node at (4,0) {3};'));
 assert.equal(byId['d-ok'], tikz('\\node at (2,0) {2};'));
 assert.deepEqual(result.applied, ['d-bad']); assert.deepEqual(result.reverted, ['d-broken']);
 assert.deepEqual(result.remaining.map(r => r.id), ['d-broken']);
 assert.ok(fs.existsSync(path.join(out, 'label-retry.json')));
 const rows = events(runDir);
 assert.ok(rows.some(e => e.stage === 'author-labels' && e.event === 'finished' && e.ok === true));
});

test('a clean assignment makes no model call, and an unavailable Studio is skipped', async () => {
 const {runDir, out} = fixture();
 let calls = 0;
 const runner = async () => { calls++; return {result: {}}; };
 const clean = await retryDiagramLabels({packets: packets(), runDir, assignmentId: 'a1', pages: [1], attempt: 1, out, runner, check: async rows => Object.fromEntries(rows.map(r => [r.id, {issues: []}]))});
 assert.equal(clean.retried, false); assert.equal(calls, 0);
 const skipped = await retryDiagramLabels({packets: packets(), runDir, assignmentId: 'a1', pages: [1], attempt: 1, out, runner, check: async () => { throw Error('connect ECONNREFUSED'); }});
 assert.match(skipped.skipped, /ECONNREFUSED/); assert.equal(calls, 0);
 assert.equal(fs.existsSync(path.join(runDir, 'semantic-packets', 'attempt-events.jsonl')), false);
});

test('a failed retry call keeps every authored diagram', async () => {
 const {runDir, out} = fixture(), data = packets(), before = packetTikz(data).map(n => n.code);
 const result = await retryDiagramLabels({packets: data, runDir, assignmentId: 'a1', pages: [1], attempt: 1, out, configuration: {},
  runner: async () => { throw Error('spawn codex ENOENT'); },
  check: async rows => Object.fromEntries(rows.map(r => [r.id, {issues: ['a label overlaps another label']}]))});
 assert.equal(result.ok, false); assert.deepEqual(packetTikz(data).map(n => n.code), before);
 assert.equal(result.remaining.length, 3);
});

test('the retry prompt asks for label placement only', () => {
 const prompt = labelRetryPrompt([{id: 'x', code: tikz(''), issues: ['i']}]);
 assert.match(prompt, /Change label placement only/);
 assert.match(prompt, /\{"diagrams":\[\{"id":"\.\.\.","code":"\.\.\."\}\]\}/);
});
