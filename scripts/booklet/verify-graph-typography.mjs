import fs from 'node:fs';import assert from 'node:assert/strict';
import {graphTikz} from '../../src/lib/graph-model.js';
const dir='output/graph-typography',before=JSON.parse(fs.readFileSync(dir+'/before.json')),after=JSON.parse(fs.readFileSync(dir+'/candidate.json')),reports=JSON.parse(fs.readFileSync(dir+'/measurements.json'));
const diagrams=p=>{const a=[];function walk(n){if(!n||typeof n!=='object')return;if(n.format==='tikz')a.push(n);for(const[k,v]of Object.entries(n))if(!['spec','sourceAtom','mathematicalModel','originalDiagram'].includes(k))Array.isArray(v)?v.forEach(walk):typeof v==='object'&&walk(v);}walk(p);return a;};
const original=new Map(diagrams(before).map(n=>[n.id,n]));let hidden=0;
for(const n of diagrams(after)){
 const old=original.get(n.id);assert.ok(old,n.id);assert.deepEqual(n.spec,old.spec,'Source evidence changed: '+n.id);
 if(n.mathematicalModel){
  assert.equal(n.code,graphTikz(n.mathematicalModel),'Regeneration mismatch: '+n.id);
  const check=(a,b)=>{for(const key of ['bounds','lines','points','rectangle','xstep','ystep','grid','xminor','yminor'])assert.deepEqual(b[key],a[key],n.id+' '+key);assert.deepEqual(b.labels?.map(l=>l.text),a.labels?.map(l=>l.text));a.panels?.forEach((p,i)=>check(p,b.panels[i]));};check(old.mathematicalModel,n.mathematicalModel);
 }
 if(n.id.startsWith('page-74-')){
  hidden++;assert.equal(n.mathematicalModel.ticks,false);assert.equal(n.mathematicalModel.tickLabels,false);
  const svg=fs.readFileSync(reports.find(r=>r.id===n.id).svg,'utf8');
  assert.equal((svg.match(/<text\b/g)??[]).length,2,'Only x/y should be printed on '+n.id);
  assert.ok(svg.includes('stroke="#ccc"')&&(svg.match(/ L /g)??[]).length>=22,'Grid/axes missing on '+n.id);
 }
}
assert.equal(hidden,10);
function withoutDiagramEdits(n){if(Array.isArray(n))return n.map(withoutDiagramEdits);if(!n||typeof n!=='object')return n;return Object.fromEntries(Object.entries(n).filter(([key])=>!(n.format==='tikz'&&['code','mathematicalModel','widthMm'].includes(key))).map(([key,v])=>[key,withoutDiagramEdits(v)]));}
const cleaned=withoutDiagramEdits(after),baseline=withoutDiagramEdits(before);
for(const id of ['page-7-q4-solution','page-8-q6-a','page-8-q6-b','page-8-q6-c','page-8-q6-d','page-92-q3']){
 const value=baseline.settings.layoutOverrides.blockLayouts[id];
 if(value===undefined)delete cleaned.settings.layoutOverrides.blockLayouts[id];else cleaned.settings.layoutOverrides.blockLayouts[id]=value;
}
for(const id of ['page-79-q8-e']){
 const value=baseline.settings.layoutOverrides.answerSpaces[id];
 if(value===undefined)delete cleaned.settings.layoutOverrides.answerSpaces[id];else cleaned.settings.layoutOverrides.answerSpaces[id]=value;
}
assert.deepEqual(cleaned,baseline,'Unrelated project data changed');
console.log(JSON.stringify({diagrams:original.size,unscaledPage74Graphs:hidden,mathematicsAndSourceEvidence:'preserved',unrelatedProjectData:'unchanged'}));
