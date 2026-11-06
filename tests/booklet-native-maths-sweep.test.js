import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {activeRasterOccurrences} from '../src/lib/booklet-presentation-verification.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
import {renderMath} from '../src/lib/render-math.js';
const p=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));
const blocks=p.sections.flatMap(s=>s.blocks),get=id=>blocks.find(b=>b.id===id);
test('all Index Laws ordinary maths and scaffolds use native content, with only meaningful illustration exceptions',()=>{
 const retained=new Set(['index-t1-q7','index-t1-q8','index-t2-q12','index-t2-q13','index-t5-q12','index-t7-q17','index-t8-q9','index-t9-q8']);
 for(const b of blocks)for(const image of activeRasterOccurrences(b)){assert.ok(retained.has(b.id),b.id+' still has reconstructible maths');assert.ok(!image.mathematicalExpression);}
 for(const id of ['index-t5-q6','index-t6-q5','index-t7-q2','index-t7-q16','index-t7-q22','index-t8-q1','index-t8-q15','index-t8-q16','index-t9-q1','index-t10-q5']){
  const b=get(id);for(const n of b.content.children)assert.ok(!renderMath(typeof n.prompt==='string'?n.prompt:'').includes('katex-error'),n.id);
  const stored=p.settings.layoutOverrides.blockLayouts[id]?.arrangement;
  if(stored){const r=resolveArrangement(b,stored),refs=new Set(arrangementItems(r.tree.root).map(n=>n.ref));assert.equal(r.missing.length,0);assert.ok([...r.entries.values()].filter(e=>e.role==='content').every(e=>refs.has(e.ref)));}
 }
});
