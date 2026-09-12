import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function harness() {
  const timers = new Map();
  const listeners = new Map();
  const elements = [];
  const element = () => ({ dataset: {}, addEventListener() {}, removeEventListener() {}, querySelector: () => null });
  const context = vm.createContext({
    window: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    document: { baseURI: 'http://localhost/', addEventListener() {}, querySelectorAll: () => [], createElement: element, head: { appendChild: el => elements.push(el) } },
    localStorage: { getItem: () => '1' },
    indexedDB: { open: () => ({}) },
    URL, performance, console,
    renderEnvironment:()=>new Promise(()=>{}),cacheMode:()=> 'normal',serverDiagram:async()=>null,digestKey:async value=>'checksum:'+value,
    setTimeout: (fn, ms) => { const id = {}; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  const source = readFileSync(new URL('../src/lib/tikz.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/export function/g, 'function');
  vm.runInContext(source + '\n globalThis.api = { _loadEngineScript, _ensureTikzFonts, _startJob, _resetAndReinjectAll, tikzActiveJobs, _idbOpen, _idbGet };', context);
  return { ...context, timers, listeners, elements, fire(ms) { for (const [id, timer] of timers) if (timer.ms === ms) { timers.delete(id); timer.fn(); } } };
}

test('engine startup rejects when the worker never becomes ready', async () => {
  const h = harness();
  const promise = h.api._loadEngineScript();
  const rejected = assert.rejects(promise, /engine failed to load/);
  h.fire(120000);
  await rejected;
  assert.equal(h.listeners.has('tikzjax-engine-ready'), false);
});

test('engine readiness errors reject instead of injecting into a broken engine', async () => {
  const h = harness();
  const rejected = assert.rejects(h.api._loadEngineScript(), /engine failed to load/);
  h.listeners.get('tikzjax-engine-ready')({ detail: { error: true } });
  await rejected;
  assert.equal(h.timers.size, 0);
});

test('missing stylesheet events do not block rendering forever', async () => {
  const h = harness();
  const promise = h.api._ensureTikzFonts();
  h.fire(5000);
  await promise;
});

test('hard deadline settles a job even while IndexedDB startup is pending', () => {
  const h = harness();
  let failure;
  const job = { wrapper: { isConnected: true, querySelector: () => null }, key: 'test', onError: message => { failure = message; } };
  h.api.tikzActiveJobs.add(job);
  h.api._startJob(job);
  h.fire(300000);
  assert.equal(job.done, true);
  assert.match(failure, /timed out/);
  assert.equal(h.api.tikzActiveJobs.size, 0);
});


test('IndexedDB startup timeout falls back without waiting for the diagram deadline',async()=>{
 const h=harness(),pending=h.api._idbOpen();h.fire(1000);assert.equal(await pending,null);
});

test('persisted SVG checksum rejects corruption and accepts intact diagrams',async()=>{
 for(const checksum of ['broken','checksum:<svg/>']){
  const h=harness(),row={svg:'<svg/>',checksum,ts:Date.now()};
  const request=result=>{const req={result};queueMicrotask(()=>req.onsuccess?.());return req;};
  h.indexedDB.open=()=>request({transaction:()=>({objectStore:()=>({get:()=>request(row)})})});
  assert.equal(await h.api._idbGet('a'.repeat(64)+'-diagram'),checksum==='broken'?null:'<svg/>');
 }
});
