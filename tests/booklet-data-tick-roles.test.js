import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';
import {explicitSmallGraphLabels} from '../scripts/booklet/graph-tick-role-audit.mjs';

test('current Data Visualisation graph tick declarations carry semantic markers in every content role',()=>{
 const project=JSON.parse(fs.readFileSync(process.env.BOOKLET_TICK_PROJECT_FILE??'booklets/projects/data-visualisation-1-v1.json','utf8'));
 const findings=[],ids=new Set();let marked=0,categories=0;
 function visit(v){if(!v||typeof v!=='object')return;
  if(v.format==='tikz'&&typeof v.code==='string'){
   assert(!ids.has(v.id),'Repeated native diagram identity '+v.id);ids.add(v.id);
   for(const node of explicitSmallGraphLabels(v.code)){
    if(node.tick){marked++;continue;}
    if(v.id==='p54-q2-column'&&node.content==='\\lab'){
     assert(v.code.includes('{1/7/A,3/10/B,5/9/C,7/3/D}'),'Nominal A-D exception must retain its reviewed category loop');categories++;continue;
    }
    findings.push({id:v.id,...node});
   }
  }
  for(const[k,x]of Object.entries(v))if(!['sourceReview','sourceAtom','sourceInventory','source','spec'].includes(k)&&x&&typeof x==='object')visit(x);
 }
 visit(project);assert.deepEqual(findings,[],'Explicit small-font graph nodes require tick roles or a reviewed nominal-category exception');assert(marked>=111);assert.equal(categories,1);
});
