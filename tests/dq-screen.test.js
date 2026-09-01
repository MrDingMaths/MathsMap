import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const applyScreen = path.join('scripts', 'dq', 'apply-screen.mjs');

function run(args) {
  return spawnSync(process.execPath, [applyScreen, ...args], { encoding: 'utf8' });
}

async function makeTasks(entries, ids) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathsmap-screen-'));
  await fs.writeFile(path.join(dir, 'task-001.ids.json'), JSON.stringify({ ids }), 'utf8');
  if (entries) await fs.writeFile(path.join(dir, 'task-001.result.json'), JSON.stringify({ candidates: entries }), 'utf8');
  return dir;
}

test('a complete screen splits into a structure map and an exclusion list', async (t) => {
  const dir = await makeTasks([
    { id: '1', verdict: 'keep', reason: '', structure: 'add-fractions' },
    { id: '2', verdict: 'reject', reason: 'off-skill: tests binomial expansion', structure: 'ignored' },
    { id: '3', verdict: 'keep', reason: '', structure: 'add-fractions' },
  ], ['1', '2', '3']);
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const mapPath = path.join(dir, 'map.json');
  const exclusionsPath = path.join(dir, 'exclusions.txt');

  const result = run(['--tasks-dir', dir, '--structure-map', mapPath, '--exclusions', exclusionsPath]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /3 screened: 2 kept, 1 rejected/);
  assert.deepEqual(JSON.parse(await fs.readFile(mapPath, 'utf8')), { 1: 'add-fractions', 3: 'add-fractions' });
  assert.equal((await fs.readFile(exclusionsPath, 'utf8')).trim(), '2');
});

test('a screen that dropped a candidate is refused, not silently partial', async (t) => {
  const dir = await makeTasks([
    { id: '1', verdict: 'keep', reason: '', structure: 'add-fractions' },
  ], ['1', '2']);
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  const result = run(['--tasks-dir', dir, '--structure-map', path.join(dir, 'map.json'), '--exclusions', path.join(dir, 'x.txt')]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /1 candidate\(s\) never screened: 2/);
  await assert.rejects(fs.access(path.join(dir, 'map.json')), 'no map is written on a partial screen');
});

test('malformed verdicts, bad slugs and reasonless rejections are all refused', async (t) => {
  const dir = await makeTasks([
    { id: '1', verdict: 'maybe', reason: '', structure: 'add-fractions' },
    { id: '2', verdict: 'keep', reason: '', structure: 'Add Fractions' },
    { id: '3', verdict: 'reject', reason: '   ', structure: 'add-fractions' },
  ], ['1', '2', '3']);
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  const result = run(['--tasks-dir', dir, '--structure-map', path.join(dir, 'map.json'), '--exclusions', path.join(dir, 'x.txt')]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /verdict is "maybe"/);
  assert.match(result.stderr, /not a kebab-case slug/);
  assert.match(result.stderr, /rejected with no reason/);
});

test('a task agy never completed is named rather than skipped', async (t) => {
  const dir = await makeTasks(null, ['1']);
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  const result = run(['--tasks-dir', dir, '--structure-map', path.join(dir, 'map.json'), '--exclusions', path.join(dir, 'x.txt')]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /task-001: no result file/);
});
