import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {collectorSource,shard} from '../scripts/booklet/prewarm-diagrams.mjs';

test('the collector rewrites the real renderTikzCode and refuses a changed signature',()=>{
 const source=fs.readFileSync('src/lib/tikz.js','utf8'),rewritten=collectorSource(source);
 assert.match(rewritten,/export function renderTikzCode\([^)]*\) \{\n  if\(window\.__tikzSources\)\{window\.__tikzSources\.add\(code\);/);
 assert.equal(rewritten.split('window.__tikzSources.add(code)').length,2,'injected exactly once');
 assert.throws(()=>collectorSource(source.replace('export function renderTikzCode(','export function renderTikz(')),/signature changed/);
});

test('shards cover every source once and stay balanced',()=>{
 const items=Array.from({length:10},(_,i)=>i),parts=shard(items,3);
 assert.deepEqual(parts.map(p=>p.length),[4,3,3]);
 assert.deepEqual(parts.flat().sort((a,b)=>a-b),items);
 assert.deepEqual(shard([1,2],4),[[1],[2]],'never more pages than sources');
 assert.deepEqual(shard([],3),[[]]);
});
