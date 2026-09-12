import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {currentBookletSourcePath, MATHSMAP_SOURCE_ROOT} from '../scripts/booklet/source-paths.mjs';

test('relocated Studio originals retain their recorded hashes and resolve old evidence paths',()=>{
  const registry=JSON.parse(fs.readFileSync('booklets/sources.json'));
  for(const move of registry.relocations){
    assert.equal(currentBookletSourcePath(move.from),move.to);
    assert.ok(fs.existsSync(move.to));
    if(move.kind==='file')assert.equal(createHash('sha256').update(fs.readFileSync(move.to)).digest('hex'),move.sha256);
  }
  assert.equal(currentBookletSourcePath('booklets\\Stage 4\\Linear Relationships.md'),MATHSMAP_SOURCE_ROOT+'/Stage 4/Linear Relationships.md');
  assert.equal(currentBookletSourcePath('booklets/projects/volume-v1.json'),'booklets/projects/volume-v1.json');
});

test('current atomisation queue resolves files inside the MathsMap source collection',()=>{
  const queue=fs.readFileSync('booklets/QUEUE.md','utf8');
  const paths=[...queue.matchAll(/`(mathsmap-sources\/[^`]+\.md)`/g)].map(m=>'booklets/'+m[1]);
  assert.ok(paths.length>100);
  for(const file of paths)assert.ok(fs.existsSync(file),file);
});
