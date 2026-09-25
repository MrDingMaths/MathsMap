import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {repairDataVisualisationFeedback,readingPlot,walkContent} from '../scripts/booklet/repair-data-visualisation-feedback.mjs';
import {arrangementCatalog,resolveArrangement} from '../src/lib/booklet-arrangement.js';

const original=JSON.parse(fs.readFileSync('booklets/projects/data-visualisation-1-v1.json','utf8'));
const candidate=repairDataVisualisationFeedback(original);
const block=id=>candidate.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
test('feedback preserves source evidence, original input and comment status',()=>{
 const before=JSON.stringify(original);repairDataVisualisationFeedback(original);assert.equal(JSON.stringify(original),before);
 assert.deepEqual(candidate.source,original.source);assert.deepEqual(candidate.studio,original.studio);
 assert.deepEqual(repairDataVisualisationFeedback(candidate),candidate);
});
test('household interpretation is self-contained with consistent computer totals',()=>{
 const q=block('p3-household-interpretation-guided').content,table=q.prompt.blocks.find(n=>n.type==='table');
 assert.equal(table.rows.length,6);assert.match(JSON.stringify(table),/Computers per household/);
 assert.match(q.children[1].answer.short,/14.*computers/);assert.match(q.children[2].answer.short,/3.*computers/);assert.match(q.children[3].answer.short,/2.*computers/);
});
test('dot scaffold has no answer marks and keeps the original observation counts',()=>{
 const q=block('p22-q2').content;assert.equal(q.answerSpaceMm,0);assert.ok(!q.questionDiagrams[0].code.includes('\\fill['));
 assert.ok(q.questionDiagrams[0].code.includes('9/29'));assert.ok(q.questionDiagrams[0].code.includes('dashed'));
 assert.deepEqual(q.answer.short,original.sections.flatMap(s=>s.blocks).find(b=>b.id==='p22-q2').content.answer.short);
 const numbers=q.prompt.blocks[1].inlines.filter(n=>n.text).flatMap(n=>n.text.match(/\d+/g).map(Number));
 assert.equal(numbers.length,34);assert.deepEqual(Array.from({length:10},(_,i)=>numbers.filter(n=>n===20+i).length),[2,2,4,3,2,7,5,5,3,1]);
});
test('interpretation plots have independent keys, repeated observations and correct circled values',()=>{
 for(const negative of [false,true])for(const guided of [false,true]){
  const d=readingPlot('plot',{negative,guided});assert.equal(d.spec.mathematics.rows.length,3);assert.equal(d.spec.mathematics.circles.length,2);assert.match(d.code,/Key/);
  const {rows,circles}=d.spec.mathematics;const values=circles.map(c=>negative?-Number(rows[c.row].stem.replace('-','')+rows[c.row].leaves[c.index]):rows[c.row].stem*10+rows[c.row][c.side][c.index]);
  assert.deepEqual(values,negative?(guided?[-24,-4]:[-23,-5]):(guided?[26,15]:[26,14]));
 }
});
test('worked fields remain fully represented and graph choices leave theory',()=>{
 for(const b of candidate.sections.flatMap(s=>s.blocks)){
  const layout=candidate.settings.layoutOverrides.blockLayouts[b.id]?.arrangement;if(!layout)continue;
  const resolved=resolveArrangement(b,layout);assert.deepEqual(resolved.missing,[],b.id);
  const refs=new Set();walkContent(layout,n=>{if(n.ref)refs.add(n.ref);});
  for(const e of arrangementCatalog(b).entries.values())if(e.role==='solution')assert.ok(refs.has(e.ref),b.id+' '+e.ref);
 }
 assert.ok(!JSON.stringify(block('p51-theory').content).includes('skateboard'));
 assert.equal(block('p51-theory-graphs').sourceAtom.id,block('p51-worked-example').sourceAtom.id);
 assert.ok(block('p46-example').examples[0].theorySolution.blocks.some(n=>n.type==='table'));
});
