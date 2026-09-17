import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPracticeBank } from '../src/lib/practice-question-storage.js';

const response = (value) => ({ ok: true, json: async () => value });
const manifest = (count) => ({ questions: Array.from({ length: count }, (_, i) => ({ id: `q-${i}` })) });
const tick = () => new Promise(resolve => setImmediate(resolve));

test('large bank bounds concurrency through parsing and preserves manifest order', async () => {
  const source = manifest(1591);
  let active = 0, peak = 0, calls = 0;
  const result = await loadPracticeBank(async url => {
    if (url.endsWith('/manifest')) return response(source);
    calls++;
    active++;
    peak = Math.max(peak, active);
    const id = url.split('/').at(-1);
    return { ok: true, json: async () => {
      // Unequal delays exercise out-of-order completion and body parsing slots.
      await tick();
      if (Number(id.slice(2)) % 3 === 0) await tick();
      active--;
      return { id };
    } };
  });
  assert.equal(peak, 8);
  assert.equal(active, 0);
  assert.equal(calls, 1591);
  assert.equal(result.manifest, source);
  assert.deepEqual(result.records.map(q => q.id), source.questions.map(q => q.id));
});

test('empty or absent questions issue no question requests', async () => {
  for (const source of [manifest(0), {}]) {
    let calls = 0;
    const result = await loadPracticeBank(async () => { calls++; return response(source); });
    assert.equal(calls, 1);
    assert.deepEqual(result, { manifest: source, records: [] });
  }
});

for (const kind of ['network', 'http', 'json']) {
  test(`${kind} failure stops scheduling, drains workers, and permits a fresh retry`, async () => {
    const source = manifest(24);
    let calls = 0, active = 0, settled = false;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const loading = loadPracticeBank(async url => {
      if (url.endsWith('/manifest')) return response(source);
      calls++;
      if (url.endsWith('/q-0')) {
        if (kind === 'network') throw new Error('network failure');
        if (kind === 'http') return { ok: false, status: 503 };
        return { ok: true, json: async () => { throw new SyntaxError('invalid JSON'); } };
      }
      active++;
      return { ok: true, json: async () => {
        await gate;
        active--;
        return { id: url.split('/').at(-1) };
      } };
    });
    const rejected = assert.rejects(loading, kind === 'http' ? /503/ : kind === 'json' ? /invalid JSON/ : /network failure/);
    loading.then(() => { settled = true; }, () => { settled = true; });
    await tick();
    assert.equal(calls, 8);
    assert.equal(active, 7);
    assert.equal(settled, false);
    release();
    await rejected;
    assert.equal(active, 0);
    assert.equal(calls, 8);
    const retry = await loadPracticeBank(async url => response(url.endsWith('/manifest') ? source : { id: url.split('/').at(-1) }));
    assert.equal(retry.records.length, 24);
  });
}

test('manifest failure does not request questions', async () => {
  let calls = 0;
  await assert.rejects(loadPracticeBank(async () => { calls++; return { ok: false, status: 500 }; }), /500/);
  assert.equal(calls, 1);
});
