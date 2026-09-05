// Wave 3 agy driver units: result parsing (BOM, fenced), id reconciliation, resume
// detection (a valid result file counts as complete regardless of agy's status field),
// control-char detection, and byte-preserving item splices. No test invokes agy itself.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  stripBom, parseResultFile, collectIds, reconcileIds, taskComplete, taskPointerPrompt, executionMetrics, OAuthExpiredError, effortArguments, modelForEffort,
} from '../scripts/agy/lib/agy-run.mjs';
import {
  spliceQuizItem, splicePracticeItem, findArraySpan, objectSpansInArray, findRawControlChars,
} from '../scripts/agy/lib/json-splice.mjs';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agy-test-'));
}

test('explicit AGY reasoning effort is optional and invalid settings fail before invocation',()=>{
  assert.deepEqual(effortArguments(),[]);
  assert.deepEqual(effortArguments('low'),['--effort','low']);
  assert.throws(()=>effortArguments('fast'),/effort must/);
});

test('AGY Flash model IDs must agree with explicit reasoning effort',()=>{
  assert.equal(modelForEffort('gemini-3.8-flash-high','low'),'gemini-3.8-flash-low');
  assert.equal(modelForEffort('gemini-3.8-flash-high'),'gemini-3.8-flash-high');
  assert.equal(modelForEffort('gemini-3.7-flash-low','medium'),'gemini-3.7-flash-medium');
  assert.equal(modelForEffort('claude-sonnet-4-6','low'),'claude-sonnet-4-6');
});

test('task pointer names the absolute workspace and file instead of assuming tool cwd', () => {
  const workspace = path.resolve('tmp', 'a booklet with spaces');
  const prompt = taskPointerPrompt(workspace, 'task-013.md');
  assert.ok(prompt.includes(JSON.stringify(path.join(workspace, 'task-013.md'))));
  assert.ok(prompt.includes(JSON.stringify(workspace)));
  assert.match(prompt, /Resolve every relative evidence and output path/);
});

test('execution metrics distinguish wall time from agent duration and keep turn counts', () => {
  const metrics = executionMetrics({ conversation_id: 'diagnostic', duration_seconds: 1.71, num_turns: 1, usage: { output_tokens: 46 } }, 8177);
  assert.equal(metrics.elapsedMs, 8177);assert.equal(metrics.agentDurationMs, 1710);assert.equal(metrics.numTurns, 1);
  assert.equal(executionMetrics(null, 120000).agentDurationMs, null);
});

test('stripBom removes a UTF-8 BOM and nothing else', () => {
  assert.equal(stripBom('﻿{"a":1}'), '{"a":1}');
  assert.equal(stripBom('{"a":1}'), '{"a":1}');
});

test('parseResultFile tolerates BOM and json fences', () => {
  const dir = tmpDir();
  const f1 = path.join(dir, 'r1.json');
  fs.writeFileSync(f1, '﻿{"ids": ["a"]}');
  assert.deepEqual(parseResultFile(f1), { ids: ['a'] });

  const f2 = path.join(dir, 'r2.json');
  fs.writeFileSync(f2, '```json\n{"ids": ["b"]}\n```\n');
  assert.deepEqual(parseResultFile(f2), { ids: ['b'] });
});

test('reconcileIds fails on missing ids, reports extras without failing', () => {
  const result = { results: [{ id: 'a', ok: true }, { id: 'b', ok: true }] };
  assert.equal(reconcileIds(['a', 'b'], result).ok, true);
  const missing = reconcileIds(['a', 'b', 'c'], result);
  assert.equal(missing.ok, false);
  assert.deepEqual(missing.missing, ['c']);
  // Extras are legitimate: a repair result names the skill AND the item id it replaced.
  const extra = reconcileIds(['a'], result);
  assert.equal(extra.ok, true);
  assert.deepEqual(extra.extra, ['b']);
});

test('a repair-shaped result reconciles against its skill id alone', () => {
  const repairResult = {
    skillId: 'stopping-distance',
    repairs: [{ target: { file: 'quiz', itemId: 'q8' }, replacement: { id: 'q8', question_text: '…' } }],
  };
  assert.equal(reconcileIds(['stopping-distance'], repairResult).ok, true);
});

test('collectIds finds id and skillId at any depth', () => {
  const got = collectIds({ skillId: 's1', nested: [{ id: 'q1' }, { deep: { id: 'q2' } }] });
  assert.deepEqual([...got].sort(), ['q1', 'q2', 's1']);
});

test('taskComplete: valid reconciled result file counts as complete (status field ignored)', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'task-001.md'), '# task');
  fs.writeFileSync(path.join(dir, 'task-001.ids.json'), '{"ids": ["a"]}');
  // no result yet
  assert.equal(taskComplete(dir, 'task-001.md', '.result.json'), false);
  // agy may have reported status ERROR — irrelevant; the file decides
  fs.writeFileSync(path.join(dir, 'task-001.result.json'), '﻿{"ids": ["a"], "done": true}');
  assert.equal(taskComplete(dir, 'task-001.md', '.result.json'), true);
  // reconciliation mismatch → not complete
  fs.writeFileSync(path.join(dir, 'task-001.result.json'), '{"ids": ["wrong"], "done": true}');
  assert.equal(taskComplete(dir, 'task-001.md', '.result.json'), false);
});

test('findRawControlChars catches literal tabs inside strings, not structural whitespace', () => {
  assert.equal(findRawControlChars('{\n  "a": "clean"\n}').length, 0);
  const bad = findRawControlChars('{"a": "has\ttab"}');
  assert.equal(bad.length, 1);
  assert.equal(bad[0].code, 9);
  // escaped \t is fine
  assert.equal(findRawControlChars('{"a": "has\\ttab"}').length, 0);
});

const QUIZ = `{
  "skillId": "s1",
  "questions": [
    {
      "id": "q1",
      "question_text": "first {braces} inside \\"string\\"",
      "options": []
    },
    {
      "id": "q2",
      "question_text": "second",
      "options": []
    }
  ]
}
`;

test('spliceQuizItem replaces only the addressed item, byte-preserving the rest', () => {
  const replacement = { id: 'q2', question_text: 'repaired', options: [] };
  const next = spliceQuizItem(QUIZ, 'q2', replacement);
  const parsed = JSON.parse(next);
  assert.equal(parsed.questions[1].question_text, 'repaired');
  // everything before the replaced item's span is byte-identical
  const q2Start = QUIZ.indexOf('{\n      "id": "q2"');
  assert.equal(next.slice(0, q2Start), QUIZ.slice(0, q2Start));
  // trailing bytes (closing brackets + newline) preserved
  assert.ok(next.endsWith(']\n}\n'));
  // q1, including its brace-bearing string, untouched
  assert.equal(parsed.questions[0].question_text, 'first {braces} inside "string"');
});

test('spliceQuizItem throws on a missing id', () => {
  assert.throws(() => spliceQuizItem(QUIZ, 'nope', {}), /found 0 matching/);
});

const CONTENT = `{
  "skillId": "s1",
  "theory": "…",
  "practice": {
    "foundation": [
      { "question_text": "f0", "solution_text": "…" }
    ],
    "development": [
      { "question_text": "d0", "solution_text": "…" },
      { "question_text": "d1", "solution_text": "…" }
    ]
  }
}
`;

test('splicePracticeItem addresses tier + index and preserves other tiers', () => {
  const next = splicePracticeItem(CONTENT, 'development', 1, { question_text: 'd1-fixed', solution_text: 'new' });
  const parsed = JSON.parse(next);
  assert.equal(parsed.practice.development[1].question_text, 'd1-fixed');
  assert.equal(parsed.practice.development[0].question_text, 'd0');
  assert.equal(parsed.practice.foundation[0].question_text, 'f0');
  const before = CONTENT.indexOf('{ "question_text": "d1"');
  assert.equal(next.slice(0, before), CONTENT.slice(0, before));
});

test('splicePracticeItem throws on out-of-range index', () => {
  assert.throws(() => splicePracticeItem(CONTENT, 'foundation', 3, {}), /only 1 item/);
});

test('findArraySpan is string-aware (a key mentioned inside a string does not match)', () => {
  const raw = '{"note": "the \\"questions\\" key", "questions": [ {"id": "q1"} ]}';
  const span = findArraySpan(raw, 'questions');
  const spans = objectSpansInArray(raw, span);
  assert.equal(spans.length, 1);
  assert.equal(JSON.parse(raw.slice(spans[0].start, spans[0].end)).id, 'q1');
});

test('response timeouts are not diagnosed as expired OAuth credentials', () => {
 const failure = new OAuthExpiredError(3, 'agy error: timeout waiting for response');
 assert.equal(failure.name, 'AgyTimeoutError');assert.doesNotMatch(failure.message, /OAuth|Re-authenticate/);
 assert.equal(new OAuthExpiredError(3, 'Individual quota reached').name, 'AgyQuotaError');
});
